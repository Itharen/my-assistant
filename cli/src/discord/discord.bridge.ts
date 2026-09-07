// Discord-híd — a kötegelés vezérlése és a bejuttatás a CCAP-on keresztül.
//
// ⛔ HARD RULE (owner, 2026-09-06): „Nem kerülheted meg a CCAP-t a neked szánt üzenetekkel."
// A bejuttatás KIZÁRÓLAG a `CcapApiClient.sendPrompt` útján történik.
//
// A kiküldés-döntés tiszta függvény (`decideFlush`) — így egységteszttel ellenőrizhető
// anélkül, hogy Discordot vagy futó CCAP-ot kellene indítani.

import { CcapApiClient } from '../ccap/ccap.api-client.js';
import { resolveSelfIdentity } from '../ccap/ccap.identity.js';
import { composeBatchPrompt } from './discord.batch-composer.js';
import { DiscordBatchStore } from './discord.batch-store.js';
import {
  DEFAULT_BATCH_CONFIG,
  type DiscordBatchConfig,
  type DiscordFlushDecision,
  type DiscordFlushResult,
  type DiscordInboundMessage,
} from './discord.models.js';

/**
 * Eldönti, hogy a jelenlegi köteget ki kell-e küldeni.
 *
 * A három eset — a sorrend számít:
 *   1. üres köteg                       → nem küldünk
 *   2. a legrégebbi tétel túl régen vár → KÜLDÜNK, akkor is, ha foglalt (biztonsági szelep;
 *      enélkül egy sokáig futó session alatt korlátlanul állnának az üzenetek)
 *   3. a session szabad ÉS elcsendesedett (a legutóbbi üzenet óta letelt az összegyűjtési
 *      ablak) → KÜLDÜNK, egyben
 *
 * Ha a session FOGLALT és a szelep még nem nyílt: gyűjtünk tovább — pontosan ez az owner
 * kérése („minél több infó kerüljön be egy-egy promptba").
 */
export function decideFlush(params: {
  pending: DiscordInboundMessage[];
  isBusyProcessing: boolean;
  now: Date;
  config?: DiscordBatchConfig;
}): DiscordFlushDecision {
  const config: DiscordBatchConfig = params.config ?? DEFAULT_BATCH_CONFIG;
  const pendingCount: number = params.pending.length;

  if (pendingCount === 0) {
    return { shouldFlush: false, reason: 'Nincs várakozó üzenet.', pendingCount: 0 };
  }

  const nowMs: number = params.now.getTime();
  const oldestAgeMs: number = nowMs - timestampOf(params.pending[0], nowMs);
  const newestAgeMs: number = nowMs - timestampOf(params.pending[pendingCount - 1], nowMs);

  if (oldestAgeMs >= config.maxHoldMs) {
    return {
      shouldFlush: true,
      reason: `Biztonsági szelep: a legrégebbi üzenet ${Math.round(oldestAgeMs / 1000)} mp-e vár `
        + `(korlát ${Math.round(config.maxHoldMs / 1000)} mp) — küldünk, foglaltság ellenére is.`,
      pendingCount,
    };
  }

  if (params.isBusyProcessing) {
    return {
      shouldFlush: false,
      reason: `A session dolgozik — gyűjtünk tovább (${pendingCount} tétel vár), `
        + 'hogy egy futásba minél több infó kerüljön.',
      pendingCount,
    };
  }

  if (newestAgeMs < config.collectWindowMs) {
    return {
      shouldFlush: false,
      reason: `Összegyűjtési ablak: a legutóbbi üzenet ${Math.round(newestAgeMs / 1000)} mp-es, `
        + `várunk még ${Math.round((config.collectWindowMs - newestAgeMs) / 1000)} mp-et, hátha jön több.`,
      pendingCount,
    };
  }

  return {
    shouldFlush: true,
    reason: `A session szabad és elcsendesedett — ${pendingCount} tétel megy ki EGY promptban.`,
    pendingCount,
  };
}

export class DiscordBridge {

  constructor(
    private readonly store: DiscordBatchStore = new DiscordBatchStore(),
    private readonly ccap: CcapApiClient = new CcapApiClient(),
    private readonly config: DiscordBatchConfig = DEFAULT_BATCH_CONFIG,
  ) {}

  /** A köteg-tár — a visszamenőleges beolvasás ezen ellenőrzi a már kézbesítetteket. */
  getStore(): DiscordBatchStore {
    return this.store;
  }

  /** Beérkező üzenet felvétele a kötegbe. Nem küld — csak eltárol. */
  async enqueue(message: DiscordInboundMessage): Promise<boolean> {
    return this.store.append(message);
  }

  /** A jelenlegi döntés — küldés nélkül. A diagnosztika és a napló ezt mutatja. */
  async inspect(now: Date = new Date()): Promise<DiscordFlushDecision> {
    const pending: DiscordInboundMessage[] = await this.store.readPending();
    const identity = await resolveSelfIdentity(this.ccap);
    const runtime = await this.ccap.inspectRuntime(identity.sessionId);

    return decideFlush({
      pending,
      isBusyProcessing: runtime.isBusyProcessing,
      now,
      config: this.config,
    });
  }

  /**
   * Kiküldés, ha a feltételek teljesülnek.
   *
   * 🔴 A köteg CSAK a sikeres `sendPrompt` UTÁN ürül. Ha a küldés hibára fut, a hiba
   * felszáll, a tár érintetlen marad, és a következő kör újrapróbálja — üzenet nem vész el.
   *
   * @param force igaz esetén a döntést átugorja (kézi kiküldés diagnosztikához).
   */
  async flush(params: {
    now?: Date;
    force?: boolean;
    /**
     * Kozvetlenul a KULDES ELOTT fut, amikor mar eldolt, hogy megy a koteg.
     *
     * > **Owner (2026-09-07):** *„Jo lenne ha a discord msg kezeles frissitene kuldes elott a
     * > msg-eket. (Ha idokozben meg gyujtes/kuldes elott javitom/modositom, akkor a friss
     * > menjen neked."*
     *
     * ⭐ Szandekosan ITT, es nem a kor elejen: a kiküldési kör 15 mp-enkent fut, de a kotegn
     * gyakran percekig var (amig a session dolgozik). Ha a frissitest a kor elejen vegeznenk,
     * ugyanazokat az uzeneteket kerdeznenk le a Discordtol **feleslegesen, percenkent
     * negyszer** — itt viszont pontosan egyszer fut, akkor, amikor szamit.
     *
     * A visszaadott lista lesz a kikuldott koteg. Hiba eseten a hivo a **valtozatlan** listat
     * adja vissza — a frissites elmaradasa sosem allithatja meg a kikuldest.
     *
     * 🔴 SZERZODES: ha a hivo **megvaltoztatja** a listat (frissit vagy kihagy egy tetelt),
     * azt **vissza is kell irnia a tarba** (`store.applyPendingRefresh`). A veglegesites ugyanis a
     * tar ELSO N elemet archivalja — ha a tar es a visszaadott lista szetcsuszik, rossz
     * uzeneteket veglegesitenenk.
     */
    beforeSend?: (pending: DiscordInboundMessage[]) => Promise<DiscordInboundMessage[]>;
  } = {}): Promise<DiscordFlushResult | null> {
    const now: Date = params.now ?? new Date();
    const pending: DiscordInboundMessage[] = await this.store.readPending();

    if (pending.length === 0) return null;

    // Egyszer oldjuk fel — a küldéshez amúgy is kell, és a fölösleges hálózati körök
    // csak további hibalehetőségek lennének a kiküldés útjában.
    const identity = await resolveSelfIdentity(this.ccap);

    if (!params.force) {
      const runtime = await this.ccap.inspectRuntime(identity.sessionId);
      const decision: DiscordFlushDecision = decideFlush({
        pending,
        isBusyProcessing: runtime.isBusyProcessing,
        now,
        config: this.config,
      });

      if (!decision.shouldFlush) return null;
    }

    // A pillanatkép rögzítése: a küldés alatt érkező üzeneteket NEM véglegesítjük.
    //
    // ⚠️ A `beforeSend` **csökkentheti** a lista hosszát (torolt uzenet), ezert a
    // `commitDelivered` a FRISSITETT hosszal hivodik — kulonben tobbet veglegesitenenk,
    // mint amennyit tenylegesen elkuldtunk.
    const batch: DiscordInboundMessage[] = params.beforeSend
      ? await params.beforeSend(pending)
      : pending;

    if (batch.length === 0) return null;

    const prompt: string = composeBatchPrompt(batch, now);

    const result = await this.ccap.sendPrompt({ sessionId: identity.sessionId, content: prompt });

    // Csak IDE eljutva véglegesítünk — igazolt átadás után.
    await this.store.commitDelivered(batch.length);

    return {
      deliveredCount: batch.length,
      queued: result.queued,
      promptPreview: prompt.slice(0, 400),
    };
  }
}

function timestampOf(message: DiscordInboundMessage | undefined, fallbackMs: number): number {
  if (!message) return fallbackMs;
  const parsed: number = new Date(message.receivedAt).getTime();

  return Number.isNaN(parsed) ? fallbackMs : parsed;
}

// Discord-híd — a kötegelés vezérlése és a bejuttatás a CCAP-on keresztül.
//
// ⛔ HARD RULE (owner, 2026-09-06): „Nem kerülheted meg a CCAP-t a neked szánt üzenetekkel."
// A bejuttatás KIZÁRÓLAG a `CcapApiClient.sendPrompt` útján történik.
//
// A kiküldés-döntés tiszta függvény (`decideFlush`) — így egységteszttel ellenőrizhető
// anélkül, hogy Discordot vagy futó CCAP-ot kellene indítani.

import { CcapApiClient } from '../ccap/ccap.api-client.js';
import { resolveOwnerMessageTarget } from '../ccap/ccap.owner-target.js';
import { resolveProjectRoot } from '../utils/project-root.js';
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
  /**
   * Hány tétel áll MÁR a CCAP sorában.
   *
   * > **Owner-észrevétel (2026-09-07):** *„látom, hogy message queue-ba kerültek az üzeneteim
   * > és nem lett megvárva, hogy a session-öd végezzen (ha running vagy van message a
   * > queue-ban akkor csak gyűjtünk)"*
   *
   * 🔴 MÉRT HIÁNY, EZ JAVÍTJA: a döntés eddig **csak** a `isBusyProcessing`-et nézte. Van egy
   * rés a kettő között: a session épp nem „dolgozik", de a CCAP sorában **már áll** egy tétel.
   * Ilyenkor a küldés nem várakoztat, hanem **beáll a sorba** — vagyis több külön futás lesz
   * belőle, pont az ellenkezője annak, amiért a kötegelés létezik.
   */
  queuedItemCount: number;
  /** Zárolt-e a CCAP sora. Zárolt sorba küldeni ugyanaz a hiba, mint tele sorba. */
  isQueueLocked?: boolean;
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

  // ⚠️ A biztonsági szelep MÉRÉSE, de a döntés a foglaltság-kapuk UTÁN dől el.
  //
  // 🔴 MÉRT HIBA (2026-09-07) — EZ NYELT EL 5 ÜZENETET: a szelep KORÁBBAN itt, a kapuk ELŐTT
  // állt, és 15 perc után „foglaltság ellenére is" küldött. A foglalt sessionbe küldött prompt
  // viszont a CCAP SORÁBA áll — mi pedig `delivered`-nek jelöltük. Az owner öt üzenete így
  // úgy tűnt el, hogy a rendszer minden szintje SIKERT jelentett rá.
  //
  // Az owner maga mondta ki a helyes szabályt: *„ha running vagy van message a queue-ban
  // akkor csak gyűjtünk"* — és ő vette észre a hiányt is: *„félek, hogy egy kicsit elsikkadt
  // egy pár üzenet"*.
  //
  // ⭐ A szelep ezért mostantól CSAK az összegyűjtési ablakot írja felül, a foglaltságot NEM.
  // Egy foglalt sessionbe küldés nem kézbesítés, hanem eltűnés.
  const holdExpired: boolean = oldestAgeMs >= config.maxHoldMs;

  if (params.isBusyProcessing) {
    return {
      shouldFlush: false,
      reason: `A session dolgozik — gyűjtünk tovább (${pendingCount} tétel vár), `
        + 'hogy egy futásba minél több infó kerüljön.'
        + (holdExpired ? ' ⚠️ A tartási korlát LEJÁRT, de foglalt sessionbe küldeni nem kézbesítés, hanem eltűnés.' : ''),
      pendingCount,
    };
  }

  // ⭐ Owner-szabály: „ha running VAGY van message a queue-ban, akkor csak gyűjtünk".
  // A sorba küldés nem várakoztatás — az üzenet beáll a sorba, és külön futás lesz belőle.
  if (params.queuedItemCount > 0) {
    return {
      shouldFlush: false,
      reason: `A CCAP sorában már áll ${params.queuedItemCount} tétel — gyűjtünk tovább `
        + `(${pendingCount} tétel vár). Küldeni most annyit tenne, hogy beállunk a sorba, `
        + 'és külön futás lenne belőle.',
      pendingCount,
    };
  }

  if (params.isQueueLocked) {
    return {
      shouldFlush: false,
      reason: `A CCAP sora ZÁROLT — gyűjtünk tovább (${pendingCount} tétel vár).`,
      pendingCount,
    };
  }

  if (newestAgeMs < config.collectWindowMs && !holdExpired) {
    return {
      shouldFlush: false,
      reason: `Összegyűjtési ablak: a legutóbbi üzenet ${Math.round(newestAgeMs / 1000)} mp-es, `
        + `várunk még ${Math.round((config.collectWindowMs - newestAgeMs) / 1000)} mp-et, hátha jön több.`,
      pendingCount,
    };
  }

  return {
    shouldFlush: true,
    reason: holdExpired
      ? `A session szabad, és a tartási korlát is lejárt (${Math.round(oldestAgeMs / 1000)} mp) — `
        + `${pendingCount} tétel megy ki EGY promptban.`
      : `A session szabad és elcsendesedett — ${pendingCount} tétel megy ki EGY promptban.`,
    pendingCount,
  };
}

export class DiscordBridge {

  constructor(
    private readonly store: DiscordBatchStore = new DiscordBatchStore(),
    private readonly ccap: CcapApiClient = new CcapApiClient(),
    private readonly config: DiscordBatchConfig = DEFAULT_BATCH_CONFIG,
    /**
     * A repó gyökere — innen olvassuk a KÉZBESÍTÉSI CÉL rögzítését.
     *
     * ⭐ Azért paraméter, hogy a teszt saját ideiglenes gyökeret adhasson: a cél-feloldás
     * a rendszer legcsendesebb hibapontja, ezért tesztelhetőnek KELL lennie.
     */
    private readonly repoRoot: string = resolveProjectRoot(),
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
    const identity = await resolveOwnerMessageTarget(this.repoRoot, this.ccap);
    const runtime = await this.ccap.inspectRuntime(identity.sessionId);

    return decideFlush({
      pending,
      isBusyProcessing: runtime.isBusyProcessing,
      queuedItemCount: runtime.queuedItemCount,
      isQueueLocked: runtime.isQueueLocked,
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
    const identity = await resolveOwnerMessageTarget(this.repoRoot, this.ccap);

    if (!params.force) {
      const runtime = await this.ccap.inspectRuntime(identity.sessionId);
      const decision: DiscordFlushDecision = decideFlush({
        pending,
        isBusyProcessing: runtime.isBusyProcessing,
        queuedItemCount: runtime.queuedItemCount,
        isQueueLocked: runtime.isQueueLocked,
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

    // ⚠️ A SORBA ÁLLÍTÁS IS ÁTADÁS — AZ ÚJRAKÜLDÉS VOLNA A HIBA.
    //
    // 🔴 SAJÁT HIBA, ugyanezen a napon: néhány órán át itt `deliveredCount: 0` állt, azzal az
    // indokkal, hogy a sorba állítás „nem kézbesítés", tehát a köteg maradjon várakozó.
    // **Ez rossz volt**, és az owner azonnal ki is mondta:
    //
    // > *„Az nem jó ha újraküldöd amit már sorba állítottunk.... Az megint duplikáció..."*
    //
    // ⭐ MÉRVE, ami az eredeti következtetést MEGDÖNTÖTTE: a `queued: true`-val átadott
    // promptok **MEGÉRKEZNEK** — csak késve, a következő futás-határon. Amit „véglegesen
    // elveszettnek" hittem, az valójában **sorban állt**. Újraküldve MINDKÉT példány
    // megérkezne, és pontosan azt a zajt csinálnánk, amire az owner panaszkodott
    // *(üzenetenként külön prompt, külön fejléccel-lábléccel)*.
    //
    // ⇒ A helyes védelem nem az újraküldés, hanem hogy **be se kerüljön a sorba**: a
    // `decideFlush` foglalt session mellett NEM küld (owner: *„ha running vagy van message a
    // queue-ban akkor csak gyűjtünk"*). Ha ide mégis `queued: true`-val jutunk, azt
    // **jelezzük** — de véglegesítünk. A duplikátum rosszabb, mint a késés.
    await this.store.commitDelivered(batch.length);

    return {
      deliveredCount: batch.length,
      queued: result.queued,
      promptPreview: prompt.slice(0, 400),
      ...(result.queued
        ? {
          detail: `⚠️ A CCAP SORBA TETTE a promptot (${batch.length} tétel) — meg fog érkezni, `
            + 'de KÉSVE, külön futásban. Ez NEM VÁRT: a foglaltság-kapunak meg kellett volna '
            + 'előznie. Ha ismétlődik, a kapu romlott el.',
        }
        : {}),
    };
  }
}

function timestampOf(message: DiscordInboundMessage | undefined, fallbackMs: number): number {
  if (!message) return fallbackMs;
  const parsed: number = new Date(message.receivedAt).getTime();

  return Number.isNaN(parsed) ? fallbackMs : parsed;
}

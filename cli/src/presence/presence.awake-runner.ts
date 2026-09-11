// 😴 AZ ÉBRENLÉT-DÖNTÉS FUTTATÁSA VALÓS ADATOKKAL — a jelek összeszedése.
//
// ⭐ Ez a réteg köti össze a **tiszta döntést** *(`PresenceAwake_Util.decide`)* a lemezen lévő
// mérésekkel. Külön van, hogy a döntés maga **futó gép nélkül** is tesztelhető maradjon.
//
// ## ⭐ EGY TULAJDONOS — két fogyasztó
//
// | Ki használja | Mire |
// |---|---|
// | 🔊 `notify.gate-runner.ts` *(hangszóró-kapu)* | ébren **ÉS** itthon ⇒ megszólalhat-e |
// | 🖧 a szerver `/api/sleep-state` | ébren-e ⇒ **néma** ablak vagy nem |
//
// ⛔ **MIÉRT NEM KÉT IMPLEMENTÁCIÓ:** a szerver eddig **fix órarendből tippelt**, a CLI-kapu
// pedig **mért** — ⇒ a rendszer **két különböző igazságot** mondott ugyanarról az emberről.
// A `comm doctor` ezt sárgán jelezte, és 2026-09-11/12-én **kétszer** bizonyult hamisnak a
// tipp *(l. `presence.awake.ts` fejléce)*.
//
// 🔴 **HIBÁT NEM DOB.** Ha az olvasás elszáll *(jogosultság, sérült fájl)*, az eredmény
// `unknown` ⇒ „nem szólalunk meg". ⚠️ Egy kivétel itt azt jelentené, hogy a `ma cast notify`
// vagy a szerver-végpont **elhasal**, ahelyett hogy **biztonságosan csendben** maradna.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { DiscordBatchStore } from '../discord/discord.batch-store.js';
import { resolvePresenceDataDirectory, resolveProjectRoot } from '../utils/project-root.js';
import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { PresenceAwake_Util } from './presence.awake.js';
import { readPresence, type PresenceSnapshot } from './presence.reader.js';

/** A mért állapot: az ébrenlét-döntés ÉS a nyers jelenlét. ⚠️ Szándékosan nem exportált. */
interface AwakeReading {
  /** Az ébrenlét-döntés indoklással. */
  awake: ReturnType<typeof PresenceAwake_Util.decide>;
  /**
   * A nyers jelenlét-kép.
   *
   * ⭐ MIÉRT JÖN VISSZA: a hangszóró-kapunak **az ITTHON-jel külön is** kell *(az owner
   * MINDKETTŐT kérte)*. ⛔ Enélkül a kapunak újra kellene olvasnia ugyanazt a fájlt.
   */
  presence: PresenceSnapshot;
  /**
   * Az utolsó Discord-válasz ideje, ha volt.
   *
   * ⭐ MIÉRT A NYERS IDŐPONT: a hangszóró-kapu a **saját**, szigorúbb ágait maga értékeli ki.
   * ⚠️ Ha csak a döntés **percre kerekített** életkorát adnánk vissza, a kapu a türelmi ablak
   * **határán** más eredményt kaphatna, mint az ébrenlét-döntés — ⛔ két igazság ugyanarról.
   */
  lastDiscordReplyAt?: Date;
}

/** Az ébrenlét kiértékelése a jelenlegi, MÉRT állapot alapján. */
export async function runAwakeDecision(now: Date = new Date()): Promise<AwakeReading> {
  let presence: PresenceSnapshot;

  try {
    presence = await readPresence(resolvePresenceDataDirectory(resolveProjectRoot()), now);
  } catch (err: unknown) {
    // ⛔ NEM NÉMA: a „nem tudtam elolvasni" és a „nincs jel" KÜLÖNBÖZŐ állapot — a döntés
    // ugyanaz *(nem szólalunk meg)*, de az indoklás megkülönbözteti.
    presence = {
      isHome: 'unknown',
      reason: 'A jelenlét-mérés nem olvasható '
        + `(${err instanceof Error ? err.message : String(err)}).`,
    };
  }

  const lastDiscordReplyAt: Date | undefined = await findLastDiscordReply();

  return {
    awake: PresenceAwake_Util.decide({
      presence: presence,
      ...(lastDiscordReplyAt ? { lastDiscordReplyAt: lastDiscordReplyAt } : {}),
      now: now,
    }),
    presence: presence,
    ...(lastDiscordReplyAt ? { lastDiscordReplyAt: lastDiscordReplyAt } : {}),
  };
}

/**
 * Az owner legutóbbi Discord-üzenetének ideje.
 *
 * Két helyen lehet: a még ki nem küldött **kötegben**, és a már bejuttatottak **archívumában**.
 * ⭐ A kettő közül a **KÉSŐBBI** számít — enélkül egy frissen érkezett üzenet ⛔ nem számítana
 * bele az ébrenlétbe, mert még nem került archívumba.
 */
async function findLastDiscordReply(): Promise<Date | undefined> {
  const store: DiscordBatchStore = new DiscordBatchStore();
  const candidates: Date[] = [];

  try {
    const pending = await store.readPending();
    const newest = pending[pending.length - 1];

    if (newest) candidates.push(new Date(newest.receivedAt));
  } catch (err) {
    // A köteg olvashatatlansága ⛔ nem akadályozhatja a döntést — a jel egyszerűen hiányzik.
    // ⚠️ De a „nincs jel" és a „nem tudtam elolvasni" KÜLÖNBÖZŐ: az első nyugalom, a második
    // hiba. A döntés ugyanaz, a napló viszont megkülönbözteti.
    SwallowedFailure_Util.report('presence.awake-runner.readPending', err);
  }

  const archiveTimestamp: Date | undefined = await readArchiveTail(store.getPaths().archiveFile);

  if (archiveTimestamp) candidates.push(archiveTimestamp);

  const valid: Date[] = candidates.filter((date: Date): boolean => !Number.isNaN(date.getTime()));

  if (valid.length === 0) return undefined;

  return valid.reduce((latest: Date, current: Date): Date => (current > latest ? current : latest));
}

/** Az archívum utolsó értelmezhető bejegyzésének ideje. */
async function readArchiveTail(archiveFile: string): Promise<Date | undefined> {
  if (!existsSync(archiveFile)) return undefined;

  try {
    const raw: string = await readFile(archiveFile, 'utf-8');
    const lines: string[] = raw.split('\n').filter((line: string): boolean => line.trim().length > 0);

    for (let index: number = lines.length - 1; index >= 0; index -= 1) {
      const parsed = JSON.parse(lines[index] ?? '') as { receivedAt?: unknown };

      if (typeof parsed.receivedAt === 'string') {
        const date: Date = new Date(parsed.receivedAt);

        if (!Number.isNaN(date.getTime())) return date;
      }
    }
  } catch (err) {
    SwallowedFailure_Util.report('presence.awake-runner.readArchiveTail', err);

    return undefined;
  }

  return undefined;
}

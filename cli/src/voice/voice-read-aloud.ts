// 🗣️ MIKOR OLVASSUK FEL AZ ÜZENETET. **Tiszta döntés, hálózat és hang nélkül.**
//
// > **Owner, 2026-09-10 18:27:** *„És a voice-ra, hogyha ott vagyok, akkor **fel is olvasod**."*
// > **Owner, 2026-09-08 08:02 (T-59):** *„ez a legmegbízhatóbb módja annak, hogy
// > kommunikáljunk"* — ⭐ és ilyenkor **közvetlenebb hangnem** való.
//
// ## ⭐ MIÉRT A KIMENŐ NAPLÓBÓL DOLGOZUNK, ÉS NEM ÚJ CSATORNÁBÓL
//
// A felolvasás **más folyamatban** dől el, mint a küldés: a hang-kapcsolatot a **figyelő**
// tartja, a küldés viszont egy rövid életű CLI-folyamat *(`ma comm say`)*. A kettő között
// kellett egy átjáró.
//
// ⛔ NEM építettünk új protokollt: a `recordOutbound` **már most** minden kimenő üzenetet
// beír a `outbound-log.jsonl`-be, **pontosan egyszer**, a teljes szöveggel. A figyelő ezt
// figyeli — így a felolvasás **nem hoz létre új üzenet-eseményt**, ami pont a handoff
// kikötése volt: *„a duplázás nem jelenthet két külön üzenet-eseményt a naplóban/mérésben."*
//
// ## 🔴 AMIT NEM OLVASUNK FEL — és miért
//
// | eset | miért nem |
// |---|---|
// | az owner **nincs** bent | a hangot senki nem hallaná; a szöveg viszont ott van |
// | `kind: 'ack'` | a nyugta **nem mondanivaló**, csak azt jelzi, hogy megkaptam |
// | üres kimondható szöveg | egy csak-táblázatos üzenetnek nincs hang-alakja |
// | már felolvasva | ⚠️ a napló-figyelő újraolvashat sorokat *(fájl-esemény többször is jöhet)* |

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { prepareSpeechText } from './voice-speech-text.js';

/** Egy kimenő napló-bejegyzés — pontosan az, amit a `recordOutbound` ír. */
export interface OutboundLogEntry {
  sentAt: string;
  /** `reply` = valódi válasz · `ack` = átvételi nyugta. */
  kind?: string;
  text?: string;
}

/** A felolvasás körülményei. */
export interface ReadAloudContext {
  /** Bent van-e az owner a hang-csatornában — MÉRT tény, nem feltevés. */
  ownerPresent: boolean;
  /** A már felolvasott bejegyzések azonosítói *(`sentAt`)*. */
  alreadySpoken: ReadonlySet<string>;
}

/** A döntés. */
export interface ReadAloudDecision {
  speak: boolean;
  /** A kimondható szöveg — csak `speak: true` esetén értelmes. */
  text: string;
  /** MIÉRT — ez kerül a naplóba. ⛔ Soha nem üres. */
  reason: string;
}

/**
 * Felolvassuk-e ezt a kimenő üzenetet? **Tiszta függvény.**
 *
 * @param entry a kimenő napló bejegyzése.
 * @param context a körülmények *(bent van-e, mit olvastunk már fel)*.
 */
export function decideReadAloud(
  entry: OutboundLogEntry,
  context: ReadAloudContext,
): ReadAloudDecision {
  if (!entry.sentAt) {
    return { speak: false, text: '', reason: 'időbélyeg nélküli bejegyzés — nem azonosítható' };
  }

  if (context.alreadySpoken.has(entry.sentAt)) {
    // ⚠️ A fájl-figyelő ugyanarra az írásra több eseményt is adhat. Enélkül az owner
    // ugyanazt hallgatná végig kétszer — ami hangban sokkal zavaróbb, mint szövegben.
    return { speak: false, text: '', reason: 'ezt már felolvastuk' };
  }

  if (!context.ownerPresent) {
    return { speak: false, text: '', reason: 'az owner nincs bent a hang-csatornában' };
  }

  if (entry.kind === 'ack') {
    // ⛔ A nyugta nem mondanivaló: azt jelzi, hogy MEGKAPTAM, nem azt, hogy mondok valamit.
    // Felolvasva csak megszakítaná azt, amit épp csinál.
    return { speak: false, text: '', reason: 'nyugta (ack) — nem mondanivaló' };
  }
  const text: string = prepareSpeechText(entry.text ?? '');

  if (!text) {
    return {
      speak: false,
      text: '',
      reason: 'nincs kimondható tartalom (pl. csak táblázat vagy emoji)',
    };
  }

  return { speak: true, text: text, reason: 'az owner bent van — felolvasás' };
}

/**
 * Egy napló-sor értelmezése. ⛔ **Nem dob** — a sérült sor `null`.
 *
 * ⚠️ A csonka sor a hívó felé `null` — a következő fájl-eseménynél újra megnézzük. De
 * ⛔ **nem néma**: mérve, a `recordOutbound` egyetlen `appendFile`-lal ír ki egy teljes sort,
 * tehát egy értelmezhetetlen sor **jel**, nem hétköznapi működés.
 */
export function parseOutboundLine(line: string): OutboundLogEntry | null {
  const trimmed: string = line.trim();

  if (!trimmed) return null;

  try {
    const parsed: OutboundLogEntry = JSON.parse(trimmed) as OutboundLogEntry;

    return typeof parsed.sentAt === 'string' && parsed.sentAt ? parsed : null;
  } catch (err) {
    // ⭐ FELTÉTEL NÉLKÜL jelentünk — és ez tudatos javítás egy korábbi, ÓVATOSKODÓ döntésemen.
    //
    // Először `SyntaxError`-ra szűrtem, azzal az indoklással, hogy „a csonka utolsó sor a
    // NORMÁLIS eset egy append-only naplóban". ⚠️ Ez **nem állta meg a helyét**: a
    // `recordOutbound` **egyetlen `appendFile`-lal** ír ki egy rövid, teljes sort, ami a
    // gyakorlatban **atomi** — csonka sor tehát nem a hétköznapi működés, hanem **jel**.
    //
    // ⇒ Ha itt mégis értelmezhetetlen sort látunk, azt **tudni akarjuk**: valaki hibásan ír a
    // naplóba, és ettől üzenetek maradhatnak ki a felolvasásból. A jelentő hatókörönként
    // **deduplikál**, tehát ez nem tud riasztás-özönné válni.
    SwallowedFailure_Util.report('voice.read-aloud.parseLine', err);

    return null;
  }
}

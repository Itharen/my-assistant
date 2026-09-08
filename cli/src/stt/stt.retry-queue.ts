// 🔴 STT-ÚJRAPRÓBÁLÓ SOR — a hang, amit nem sikerült felismerni, NEM veszhet el.
//
// **MÉRT HIÁNY (2026-09-07):** 16 sikeres felismerés mellett **2 hangüzenet teljesen
// elveszett**, mindkettő *„A felismerés 5 perc után sem fejeződött be"* hibával. Az owner is
// észrevette: *„Volt pár voice message ami nem került feldolgozásra"*. Újrapróbálás nem volt
// ⇒ a tartalom **véglegesen** elveszett.
//
// > **Owner-szabály (2026-09-07 12:05) — SZÓ SZERINT:**
// > *„Sok párhuzamos munka folyik ezért a RAM usage folyton fluktuál. Ezt nem kell megoldani,
// > csak azt ahogy alkalmazkodunk ehhez az issue-hoz."*
//
// ⇒ ⛔ A RAM-ot NEM optimalizáljuk, és ⛔ az FDP AI-hoz NEM nyúlunk (`fdp-ai-never-restart`).
// A megoldás **alkalmazkodás**: eltesszük a hangot, és **később** próbáljuk újra, amikor a
// terhelés úgyis más. Ez a két tervezési döntés következik belőle:
//
//   1. 🔴 **A BÁJTOKAT tesszük el, NEM az URL-t.** A Discord letöltési linkjei ALÁÍRTAK és
//      LEJÁRNAK — egy URL-t őrző sor pont akkor mondaná fel a szolgálatot, amikor kellene.
//   2. ⏳ **Az első újrapróbálás sem AZONNAL jön.** Azonnal ugyanabba a RAM-falba futnánk, és
//      elégetnénk még 5 percet. A várakozás nem tétlenség: ez MAGA az alkalmazkodás.

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { reportSwallowedFailure } from '../utils/swallowed-failure.js';

/**
 * A várakozási lépcsők — az n. újrapróbálás ennyivel a bukás UTÁN esedékes.
 *
 * ⭐ MIÉRT NÖVEKVŐ ÉS MIÉRT ILYEN HOSSZÚ: a RAM-csúcs percekben mérhető, nem másodpercekben.
 * A sűrű újrapróbálás nem ügyesebb — csak **többször fut bele ugyanabba a falba**, és közben
 * ő maga is terhel. A ritkuló próbálkozás ad esélyt arra, hogy a terhelés magától elmúljon.
 */
export const RETRY_DELAYS_MS: number[] = [2 * 60_000, 5 * 60_000, 15 * 60_000, 45 * 60_000];

/** Ennyi próbálkozás után feladjuk — és ezt MEG IS MONDJUK az ownernek. */
export const MAX_ATTEMPTS: number = RETRY_DELAYS_MS.length + 1;

/** Egy várakozó hang a soron. */
export interface SttRetryEntry {
  /** A Discord-üzenet azonosítója — ez köti vissza a hangot a forrásához. */
  messageId: string;
  channelId: string;
  /**
   * A szerző — hogy a **sikeres** újrapróbálás után a kötegbe ugyanúgy kerüljön be az üzenet,
   * mintha elsőre sikerült volna. ⚠️ Enélkül a felismert szöveg megvolna, de nem tudnánk,
   * kitől — vagyis pont a kötegbe tétel bukna el a cél előtt.
   */
  authorId: string;
  authorName: string;
  filename: string;
  contentType?: string;
  durationSecs?: number;
  /** Hányszor próbáltuk MÁR (a legelső, sikertelen próbát is beleértve). */
  attempts: number;
  /** Mikor esedékes a következő próbálkozás (ISO). */
  nextAttemptAt: string;
  /** Mikor került a sorra (ISO) — ebből látszik, mióta várakozik. */
  queuedAt: string;
  /** Miért bukott legutóbb — ez kerül az owner elé, ha végleg feladjuk. */
  lastFailure: string;
  /**
   * 🔊 HONNAN jött a hang — mert a **kézbesítés útja különbözik**.
   *
   * 🔴 MÉRT OK (2026-09-08 02:15): a sikeres újrapróbálás
   * *(a)* `🎙️ HANGÜZENET`-ként teszi a kötegbe, és
   * *(b)* a tükröt a **forrás-üzenetre válaszolva**, különben a **fő** csatornába küldi.
   *
   * ⚠️ Egy **hang-csatornás** felvételnél mindkettő HIBÁS lenne: a `messageId` ott a WAV
   * **fájlneve**, nem valódi Discord-üzenet *(a válasz nem létező üzenetre menne)*, a jelölés
   * pedig elfedné, hogy **élő beszédről** van szó — ami más bizonytalanságú, mint egy
   * újrahallgatható hangüzenet.
   *
   * ⭐ A mező **opcionális**, és hiánya `voice-message`-t jelent: a lemezen MÁR OTT LÉVŐ
   * bejegyzések így változatlanul, helyesen működnek tovább.
   */
  source?: SttRetrySource;
}

/** A hang forrása — a kézbesítés útját dönti el. */
export type SttRetrySource = 'voice-message' | 'voice-channel';

export interface SttRetryPaths {
  /** A könyvtár, ahol a hangok és a leírásaik állnak. */
  root: string;
}

/**
 * Hol laknak a várakozó hangok.
 *
 * ⚠️ A `~/.config` alatt, a Discord-köteg mellett — **NEM a repóban**: ezek nyers
 * hangfelvételek az ownerről, azoknak semmi keresnivalójuk a verziókezelésben.
 */
export function resolveSttRetryPaths(userHome: string = homedir()): SttRetryPaths {
  return { root: join(userHome, '.config', 'my-assistant', 'stt-retry') };
}

/** A leíró és a hang fájlneve egy tételhez. Egy helyen, hogy ne csússzon szét. */
function entryFiles(root: string, messageId: string): { meta: string; audio: string } {
  // A Discord-azonosító csak számjegy — de ha bármi mást kapnánk, NEM engedjük ki a könyvtárból.
  const safeId: string = messageId.replace(/[^A-Za-z0-9_-]/g, '_');

  return { meta: join(root, `${safeId}.json`), audio: join(root, `${safeId}.bin`) };
}

/** Mikor esedékes az `attempts`. próbálkozás után a következő? */
export function computeNextAttemptAt(attempts: number, now: Date = new Date()): string | null {
  const delay: number | undefined = RETRY_DELAYS_MS[attempts - 1];

  if (delay === undefined) return null;

  return new Date(now.getTime() + delay).toISOString();
}

export class SttRetryQueue {

  constructor(
    private readonly paths: SttRetryPaths = resolveSttRetryPaths(),
    /**
     * 🔴 A FELADÁS PILLANATÁBAN hívódik — **mielőtt** a hang törlődne.
     *
     * ⭐ Ez teszi lehetővé a nyilvántartást (T-68): a sor **nem tud** a nyilvántartásról, a
     * hívó viszont itt átmentheti a hangot, mielőtt véglegesen elveszne.
     */
    private readonly onGiveUp?: (entry: SttRetryEntry) => Promise<void>,
  ) {}

  /**
   * Egy sikertelen felismerés felvétele a sorra.
   *
   * 🔴 A HANG ELŐBB MEGY KI A LEMEZRE, MINT A LEÍRÓ. Fordítva egy megszakadás olyan leírót
   * hagyna hátra, ami **nem létező hangra** mutat — és a sor onnantól minden körben
   * ugyanazon a szellem-tételen bukna.
   */
  async enqueue(params: {
    messageId: string;
    channelId: string;
    authorId: string;
    authorName: string;
    filename: string;
    contentType?: string;
    durationSecs?: number;
    audio: Uint8Array;
    failure: string;
    /** Honnan jott a hang. Alapertelmezes: `voice-message` (visszafele kompatibilis). */
    source?: SttRetrySource;
    now?: Date;
  }): Promise<SttRetryEntry | null> {
    const now: Date = params.now ?? new Date();
    const nextAttemptAt: string | null = computeNextAttemptAt(1, now);

    // Ha már az első bukás után sincs több lépcsőnk, nincs mit eltenni.
    if (nextAttemptAt === null) return null;

    await mkdir(this.paths.root, { recursive: true });

    const files = entryFiles(this.paths.root, params.messageId);
    const entry: SttRetryEntry = {
      messageId: params.messageId,
      channelId: params.channelId,
      authorId: params.authorId,
      authorName: params.authorName,
      filename: params.filename,
      ...(params.contentType ? { contentType: params.contentType } : {}),
      ...(params.durationSecs === undefined ? {} : { durationSecs: params.durationSecs }),
      ...(params.source ? { source: params.source } : {}),
      attempts: 1,
      nextAttemptAt: nextAttemptAt,
      queuedAt: now.toISOString(),
      lastFailure: params.failure,
    };

    await writeFile(files.audio, params.audio);
    await writeFile(files.meta, `${JSON.stringify(entry, null, 2)}\n`, 'utf-8');

    return entry;
  }

  /** Minden várakozó tétel, a legrégebben sorra kerülttel az elején. */
  async list(): Promise<SttRetryEntry[]> {
    if (!existsSync(this.paths.root)) return [];

    const names: string[] = (await readdir(this.paths.root)).filter((n) => n.endsWith('.json'));
    const entries: SttRetryEntry[] = [];

    for (const name of names) {
      try {
        const raw: string = await readFile(join(this.paths.root, name), 'utf-8');

        entries.push(JSON.parse(raw) as SttRetryEntry);
      } catch (err) {
        // ⚠️ Egy serult leiro NEM nemithatja el az egesz sort: a tobbi tetel tartalma is
        // elveszne vele. A serultet atugorjuk — a takaritas a `dropCorrupt` dolga. ⛔ De az
        // atugras nem lehet nema: egy varakozo hang tunne el ugy, hogy sehol nem latszik.
        reportSwallowedFailure('stt.retry-queue.readEntry', err);
        continue;
      }
    }

    return entries.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
  }

  /**
   * A LEGRÉGEBBI esedékes tétel — vagy `null`, ha most nincs ilyen.
   *
   * ⭐ SZÁNDÉKOSAN EGYESÉVEL: a felismerés a szűk erőforrás, amiről az egész baj szól. Ha egy
   * körben többet indítanánk, **mi magunk** okoznánk azt a RAM-csúcsot, ami ellen a sor
   * egyáltalán létezik.
   */
  async takeDue(now: Date = new Date()): Promise<SttRetryEntry | null> {
    const due: SttRetryEntry[] = (await this.list())
      .filter((e) => Date.parse(e.nextAttemptAt) <= now.getTime());

    return due[0] ?? null;
  }

  /** Egy tétel eltett hangja. `null`, ha a hang már nincs meg (ilyenkor a tétel halott). */
  async readAudio(messageId: string): Promise<Uint8Array | null> {
    const files = entryFiles(this.paths.root, messageId);

    if (!existsSync(files.audio)) return null;

    return new Uint8Array(await readFile(files.audio));
  }

  /**
   * Egy sikertelen újrapróbálás könyvelése.
   *
   * @returns a frissített tétel — vagy `null`, ha **elfogytak a próbálkozások**. Ilyenkor a
   *          tétel MÁR TÖRÖLVE van, és a hívónak **szólnia kell az ownernek**: ez az a
   *          pillanat, amikor a tartalom tényleg elvész, és ez nem maradhat némán.
   */
  async recordFailure(messageId: string, failure: string, now: Date = new Date()): Promise<SttRetryEntry | null> {
    const entry: SttRetryEntry | undefined = (await this.list()).find((e) => e.messageId === messageId);

    if (!entry) return null;

    const attempts: number = entry.attempts + 1;
    const nextAttemptAt: string | null = computeNextAttemptAt(attempts, now);

    if (nextAttemptAt === null) {
      // 🔴 EZ AZ UTOLSÓ PILLANAT, amikor a hang még megvan. A hívó itt mentheti át a
      // nyilvántartásba — utána a `remove()` VÉGLEG törli (`stt.transcript-ledger.ts`).
      // ⛔ A horog hibája nem akadályozhatja meg a takarítást: a sor nem ragadhat be.
      try {
        await this.onGiveUp?.({ ...entry, attempts: attempts, lastFailure: failure });
      } catch (err) {
        // A takaritas a fontos, ezert nem dobunk tovabb. ⛔ De ez a horog EPP A HANG
        // MEGORZESE: ha elhasal, a `remove()` VEGLEG torli a felvetelt. A „hivo majd
        // naplozza" feltevesre itt nem lehet epiteni — ez a tartalom utolso pillanata.
        reportSwallowedFailure('stt.retry-queue.onGiveUp', err);
      }

      await this.remove(messageId);

      return null;
    }

    const updated: SttRetryEntry = {
      ...entry,
      attempts: attempts,
      nextAttemptAt: nextAttemptAt,
      lastFailure: failure,
    };

    await writeFile(
      entryFiles(this.paths.root, messageId).meta,
      `${JSON.stringify(updated, null, 2)}\n`,
      'utf-8',
    );

    return updated;
  }

  /**
   * A tétel HANGJÁNAK útvonala — `null`, ha már nincs meg.
   *
   * ⭐ MIÉRT KELL (T-68): a feladáskor a `remove()` **törli a hangot**, és ezzel a
   * *„visszamenőlegesen is fel kell tudjad oldani"* fizikailag lehetetlenné válik. Ezért a
   * feladás előtt a hívó **átmentheti** a nyilvántartásba — de csak ha tudja, hol van.
   */
  audioPathOf(messageId: string): string | null {
    const path: string = entryFiles(this.paths.root, messageId).audio;

    return existsSync(path) ? path : null;
  }

  /** A tétel eltávolítása — sikeres felismerésnél, vagy amikor feladtuk. */
  async remove(messageId: string): Promise<void> {
    const files = entryFiles(this.paths.root, messageId);

    await rm(files.meta, { force: true });
    await rm(files.audio, { force: true });
  }
}

/**
 * Amit az ownernek mondunk, amikor VÉGLEG feladtuk.
 *
 * 🔴 Ez a legfontosabb üzenet az egész sorban. Egy csendben eldobott hangüzenet pontosan úgy
 * néz ki, mintha meg sem érkezett volna — és az owner azt hiszi, tudom, amit mondott.
 */
export function composeGiveUpMessage(entry: SttRetryEntry): string {
  const waited: string = describeWait(entry);

  return '🔴 **Egy hangüzenetedet VÉGLEG nem sikerült felismernem.**\n'
    + `${MAX_ATTEMPTS} próbálkozás ${waited} alatt — utoljára: ${entry.lastFailure}\n\n`
    + '📌 **Nem tudom, mit mondtál benne.** Kérlek küldd újra, vagy írd le.';
}

/** Mennyit várakozott a tétel — ember-olvasható alakban. */
function describeWait(entry: SttRetryEntry): string {
  const minutes: number = Math.round((Date.now() - Date.parse(entry.queuedAt)) / 60_000);

  if (minutes < 60) return `${minutes} perc`;

  return `${Math.round(minutes / 6) / 10} óra`;
}

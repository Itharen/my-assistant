// 📒 HANGÜZENET ↔ TRANSZKRIPT NYILVÁNTARTÁS — a T-68 első és blokkoló része.
//
// > **Owner (2026-09-08 15:31, szó szerint):** *„a rendszernek rögzítenie kéne, hogy melyik
// > üzenetekhez melyik transzkript tartozik, illetve melyik üzeneteknek nem sikerült a
// > transzkript, és ilyenkor ezeket majd **visszamenőlegesen is fel kell tudjad oldani**."*
//
// ## 🔴 MIÉRT EZ AZ ELSŐ — a mért blokkoló
//
// A `SttRetryQueue.remove()` a feladáskor **a hangot is törli**:
//
// ```ts
// await rm(files.meta,  { force: true });
// await rm(files.audio, { force: true });   // ⛔ ITT VÉSZ EL A TARTALOM
// ```
//
// ⇒ Ma a „visszamenőleges feloldás" **fizikailag lehetetlen**: mire kérnék, már **nincs mit**
// újrapróbálni. Ezért a sorrend: **előbb megőrizni, aztán visszanyúlni.**
//
// ## Mit tart nyilván
//
// | Állapot | Mikor | Mit őrzünk |
// |---|---|---|
// | `resolved` | a felismerés sikerült *(elsőre vagy újrapróbálásra)* | a **szöveget** |
// | `failed` | elfogytak a próbálkozások | a **hangot** + az okot + a próbaszámot |
//
// ⭐ **A siker is bekerül**, nem csak a bukás: az owner kérdése *„melyik üzenethez melyik
// transzkript tartozik"* — ez a **párosítás** önmagában érték, akkor is, ha minden sikerül.
//
// ⚠️ **A hang CSAK bukásnál marad meg.** Sikeres felismerés után a nyers hangot nem őrizzük:
// megvan a szöveg, a hang már csak helyet foglalna *(a mai bejegyzés 123 KB / 30 mp)*.
//
// 📌 Tárolás: `~/.config/my-assistant/stt-ledger/` — a retry-sor mellett, ⛔ **nem a repóban**
// *(nyers felhasználói tartalom, ugyanaz a megfontolás, mint a `stt-retry`-nál)*.

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Egy hangüzenet sorsa — ez a nyilvántartás lelke. */
export type TranscriptStatus =
  /** ✅ Megvan a szöveg. */
  | 'resolved'
  /** 🔴 Elfogytak a próbálkozások — a HANG megmarad, hogy később feloldható legyen. */
  | 'failed';

export interface TranscriptLedgerEntry {
  messageId: string;
  channelId: string;
  authorName: string;
  /** Az eredeti csatolmány neve — a visszakereséshez. */
  filename: string;
  durationSecs?: number;
  status: TranscriptStatus;
  /** ✅ `resolved`-nál: a felismert szöveg. */
  transcript?: string;
  /** 🔴 `failed`-nél: MIÉRT nem sikerült — ⛔ soha nem üres. */
  failure?: string;
  /** Hányszor próbáltuk összesen. */
  attempts: number;
  /** Mikor láttuk először, és mikor dőlt el a sorsa. */
  firstSeenAt: string;
  settledAt: string;
  /**
   * 🔴 `failed`-nél a MEGŐRZÖTT hang fájlneve *(a nyilvántartás könyvtárán belül)*.
   *
   * ⭐ Ez teszi lehetővé a **visszamenőleges feloldást** — enélkül a bejegyzés csak annyit
   * mondana, hogy *„volt itt valami, és elveszett"*.
   */
  audioFile?: string;
}

export interface TranscriptLedgerPaths {
  root: string;
}

/**
 * A nyilvántartás helye.
 *
 * ⚠️ A `~/.config` alatt, a retry-sor mellett — ⛔ **nem a repóban**: ezek **nyers
 * felhasználói tartalmak** *(kimondott mondatok és a hangjuk)*, amiknek nincs helyük a
 * verziókezelésben.
 */
export function resolveTranscriptLedgerPaths(userHome: string = homedir()): TranscriptLedgerPaths {
  return { root: join(userHome, '.config', 'my-assistant', 'stt-ledger') };
}

/** Egy bejegyzés fájljai. */
function ledgerFiles(root: string, messageId: string): { meta: string; audio: string } {
  return {
    meta: join(root, `${messageId}.json`),
    audio: join(root, `${messageId}.bin`),
  };
}

/** Amit egy sikeres felismerésről tudunk. */
export interface ResolvedInput {
  messageId: string;
  channelId: string;
  authorName: string;
  filename: string;
  durationSecs?: number;
  transcript: string;
  attempts: number;
}

/** Amit egy VÉGLEGES bukásról tudunk. */
export interface FailedInput {
  messageId: string;
  channelId: string;
  authorName: string;
  filename: string;
  durationSecs?: number;
  failure: string;
  attempts: number;
}

/**
 * Egy SIKERES felismerés bejegyzése. **Tiszta függvény.**
 *
 * ⚠️ A `firstSeenAt` a **korábbi** bejegyzésből öröklődik, ha van: egy újrapróbálásra sikerült
 * hang **nem most** érkezett, és a nyilvántartásnak ezt tudnia kell — különben a „mennyi ideig
 * tartott feloldani" kérdés megválaszolhatatlan lenne.
 */
export function buildResolvedEntry(
  input: ResolvedInput,
  previous: TranscriptLedgerEntry | null,
  now: Date,
): TranscriptLedgerEntry {
  return {
    messageId: input.messageId,
    channelId: input.channelId,
    authorName: input.authorName,
    filename: input.filename,
    ...(input.durationSecs === undefined ? {} : { durationSecs: input.durationSecs }),
    status: 'resolved',
    transcript: input.transcript,
    attempts: input.attempts,
    firstSeenAt: previous?.firstSeenAt ?? now.toISOString(),
    settledAt: now.toISOString(),
  };
}

/**
 * Egy VÉGLEGES bukás bejegyzése. **Tiszta függvény.**
 *
 * ⛔ Az `audioFile` **szándékosan itt dől el**, nem a hívóban: a nyilvántartás ígérete az,
 * hogy bukásnál a hang **megmarad** — ezt nem bízhatjuk arra, hogy a hívó emlékszik-e rá.
 */
export function buildFailedEntry(
  input: FailedInput,
  previous: TranscriptLedgerEntry | null,
  now: Date,
): TranscriptLedgerEntry {
  return {
    messageId: input.messageId,
    channelId: input.channelId,
    authorName: input.authorName,
    filename: input.filename,
    ...(input.durationSecs === undefined ? {} : { durationSecs: input.durationSecs }),
    status: 'failed',
    failure: input.failure,
    attempts: input.attempts,
    firstSeenAt: previous?.firstSeenAt ?? now.toISOString(),
    settledAt: now.toISOString(),
    audioFile: `${input.messageId}.bin`,
  };
}

/**
 * A nyilvántartás.
 *
 * ⛔ **Hibát SOHA nem dob a hívó felé** *(kivéve a szándékos olvasási hibát)*: a nyilvántartás
 * **kísérő** funkció — ha elhasal, az nem viheti magával a felismerést vagy a kézbesítést.
 * *(Ugyanaz az elv, mint a keretenkénti sávnál: „a diagnosztika sosem buktathatja meg azt,
 * amit megfigyel".)*
 */
export class TranscriptLedger {

  constructor(private readonly paths: TranscriptLedgerPaths = resolveTranscriptLedgerPaths()) {}

  /** Egy bejegyzés beolvasása. `null`, ha nincs. */
  async get(messageId: string): Promise<TranscriptLedgerEntry | null> {
    const file: string = ledgerFiles(this.paths.root, messageId).meta;

    if (!existsSync(file)) return null;

    try {
      return JSON.parse(await readFile(file, 'utf-8')) as TranscriptLedgerEntry;
    } catch {
      // ⚠️ Sérült bejegyzés: úgy kezeljük, mintha nem lenne — ⛔ de NEM töröljük, hogy
      // kézzel még megnézhető legyen.
      return null;
    }
  }

  /** Minden bejegyzés — a legutóbb eldőlt elöl. */
  async list(): Promise<TranscriptLedgerEntry[]> {
    if (!existsSync(this.paths.root)) return [];

    const names: string[] = (await readdir(this.paths.root)).filter((n) => n.endsWith('.json'));
    const entries: TranscriptLedgerEntry[] = [];

    for (const name of names) {
      const entry: TranscriptLedgerEntry | null = await this.get(name.replace(/\.json$/, ''));

      if (entry) entries.push(entry);
    }

    return entries.sort((a, b) => b.settledAt.localeCompare(a.settledAt));
  }

  /** Csak a FELOLDATLANOK — ez a visszamenőleges feloldás munkalistája. */
  async listFailed(): Promise<TranscriptLedgerEntry[]> {
    return (await this.list()).filter((e) => e.status === 'failed');
  }

  /** Egy sikeres felismerés rögzítése. */
  async recordResolved(input: ResolvedInput, now: Date = new Date()): Promise<void> {
    const entry: TranscriptLedgerEntry = buildResolvedEntry(input, await this.get(input.messageId), now);

    await this.write(entry);
  }

  /**
   * Egy végleges bukás rögzítése — a HANG MEGŐRZÉSÉVEL.
   *
   * @param audioSourcePath a retry-sor hangfájlja, amit **áthelyezünk** ide.
   *
   * ⚠️ Ha az áthelyezés nem sikerül *(a fájl már nincs meg)*, a bejegyzés **akkor is elkészül**,
   * csak `audioFile` nélkül — mert *„tudjuk, hogy elveszett"* még mindig sokkal többet ér,
   * mint a semmi.
   */
  async recordFailed(
    input: FailedInput,
    audioSourcePath: string | null,
    now: Date = new Date(),
  ): Promise<void> {
    const entry: TranscriptLedgerEntry = buildFailedEntry(input, await this.get(input.messageId), now);

    await mkdir(this.paths.root, { recursive: true });

    const target: string = ledgerFiles(this.paths.root, input.messageId).audio;
    let audioKept: boolean = false;

    if (audioSourcePath && existsSync(audioSourcePath)) {
      try {
        await rename(audioSourcePath, target);
        audioKept = true;
      } catch {
        // ⚠️ Kötetek közti átnevezés bukhat — másolás nélkül itt nem megyünk tovább, de a
        // bejegyzést NEM veszítjük el.
        audioKept = false;
      }
    }

    await this.write(audioKept ? entry : { ...entry, audioFile: undefined });
  }

  /** A megőrzött hang teljes útvonala — `null`, ha nincs. */
  audioPathOf(entry: TranscriptLedgerEntry): string | null {
    if (!entry.audioFile) return null;

    const path: string = join(this.paths.root, entry.audioFile);

    return existsSync(path) ? path : null;
  }

  private async write(entry: TranscriptLedgerEntry): Promise<void> {
    await mkdir(this.paths.root, { recursive: true });
    await writeFile(
      ledgerFiles(this.paths.root, entry.messageId).meta,
      `${JSON.stringify(entry, null, 2)}\n`,
      'utf-8',
    );
  }
}

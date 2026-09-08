// 📜 ÜZENET-VISSZANÉZÉS — mit írt az owner, mit írtam én, és mi vár még kézbesítésre.
//
// > **Owner-kérdés (2026-09-07 13:27):** *„Tuti minden üzenetem eljutott hozzád a discordból?
// > Van am eszközöd amivel vissza tudod nézni az üzeneteimet? +Transcripted? Tiédeket?"*
//
// A kérdés jogos volt, és a válasz akkor **részleges**: a bejövő oldalt vissza tudtam nézni
// (archívum + hangüzenet-átirat), a **sajátomat nem** — a kimenő naplóban csak `sentAt` és
// `kind` állt, szöveg nélkül. Ez a modul teszi a visszanézést **teljessé és egy paranccsá**.
//
// ⭐ A HÁROM FORRÁS SZÁNDÉKOSAN KÜLÖN LÁTSZIK, mert MÁST jelentenek:
//   - **kézbesített** — eljutott hozzám, tehát tudok róla
//   - **VÁRAKOZÓ**  — 🔴 megérkezett a Discordra, de HOZZÁM MÉG NEM. Pont ez az a halmaz,
//     amire az owner rákérdezett, és amit korábban csak véletlenül vettem észre.
//   - **kimenő**     — amit én írtam
//
// ⛔ Ez NEM a Discord-csatorna lekérdezése: azt, ami a szűrőn kívül esett (más szerző, más
// csatorna), ez sem látja. A saját nyilvántartásunkat mutatja meg — pontosan, és a határait
// kimondva.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { reportSwallowedFailure } from '../utils/swallowed-failure.js';
import { resolveDiscordBatchPaths } from '../discord/discord.batch-store.js';
import { resolveOutboundLogPath } from '../discord/discord.reply-tracker.js';

/** Egy tétel a visszanézésben — bármelyik forrásból. */
export interface CommHistoryEntry {
  /** `inbound-delivered` · `inbound-pending` · `outbound` */
  source: 'inbound-delivered' | 'inbound-pending' | 'outbound';
  at: string;
  /** A szöveg. Régi kimenő tételeknél hiányozhat — akkor ezt KIMONDJUK. */
  text?: string;
  /** Csak kimenőnél: valódi válasz volt-e, vagy csak nyugta. */
  kind?: string;
  /** ⭐ Igaz, ha a szöveg gépi átirat (hangüzenet). */
  isTranscript?: boolean;
}

export interface CommHistoryReport {
  entries: CommHistoryEntry[];
  /** Hány üzenet vár MÉG kézbesítésre — ez a legfontosabb szám a jelentésben. */
  pendingCount: number;
  /** Hány kimenő tételnél hiányzik a szöveg (a 2026-09-07 előtti rögzítés miatt). */
  outboundWithoutText: number;
}

/** A hangüzenet-jelölés, amit a kötegbe tett átirat kap. Egy helyen, hogy ne csússzon szét. */
const TRANSCRIPT_MARKER: string = '🎙️ HANGÜZENET';

/**
 * A teljes visszanézés, időrendben.
 *
 * @param limit hány tételt adjunk vissza a VÉGÉRŐL (a legfrissebbek). `0` = mind.
 *
 * 🔴 Hibát nem dob: egy sérült sor nem némíthatja el az egész visszanézést — pont az veszne
 * el, amiért a parancs létezik.
 */
export async function readCommHistory(limit: number = 30): Promise<CommHistoryReport> {
  const paths = resolveDiscordBatchPaths();
  const entries: CommHistoryEntry[] = [];

  for (const entry of await readJsonlSafe(paths.archiveFile)) {
    const text: string = typeof entry['content'] === 'string' ? entry['content'] : '';

    entries.push({
      source: 'inbound-delivered',
      at: String(entry['receivedAt'] ?? ''),
      text: text,
      isTranscript: text.includes(TRANSCRIPT_MARKER),
    });
  }

  for (const entry of await readJsonlSafe(paths.pendingFile)) {
    const text: string = typeof entry['content'] === 'string' ? entry['content'] : '';

    entries.push({
      source: 'inbound-pending',
      at: String(entry['receivedAt'] ?? ''),
      text: text,
      isTranscript: text.includes(TRANSCRIPT_MARKER),
    });
  }

  let outboundWithoutText: number = 0;

  for (const entry of await readJsonlSafe(resolveOutboundLogPath())) {
    const text: unknown = entry['text'];

    if (typeof text !== 'string' || !text) outboundWithoutText += 1;

    entries.push({
      source: 'outbound',
      at: String(entry['sentAt'] ?? ''),
      ...(typeof text === 'string' && text ? { text: text } : {}),
      kind: String(entry['kind'] ?? 'reply'),
    });
  }

  entries.sort((a, b) => a.at.localeCompare(b.at));

  const pendingCount: number = entries.filter((e) => e.source === 'inbound-pending').length;
  const sliced: CommHistoryEntry[] = limit > 0 ? entries.slice(-limit) : entries;

  return {
    entries: sliced,
    pendingCount: pendingCount,
    outboundWithoutText: outboundWithoutText,
  };
}

/**
 * Ember-olvasható jelentés.
 *
 * ⛔ TÁBLÁZAT NÉLKÜL — owner, 2026-09-07: *„A Discord nem tud táblázatokat megjeleníteni..."*
 * Ez a kimenet a konzolra ÉS a Discordra is mehet, ezért listás.
 */
export function formatCommHistory(report: CommHistoryReport): string {
  const lines: string[] = [];

  if (report.pendingCount > 0) {
    lines.push(`🔴 ${report.pendingCount} üzenet MÉG NEM jutott el hozzám (a kötegben vár).`);
    lines.push('');
  }

  for (const entry of report.entries) {
    lines.push(`${iconFor(entry)} ${formatClock(entry.at)} — ${firstLine(entry)}`);
  }

  if (report.outboundWithoutText > 0) {
    lines.push('');
    lines.push(`⚠️ ${report.outboundWithoutText} korábbi SAJÁT üzenetem szövege nem visszanézhető `
      + '— 2026-09-07 előtt csak az időpontot rögzítettük. A mostaniak már teljesek.');
  }

  return lines.join('\n');
}

function iconFor(entry: CommHistoryEntry): string {
  if (entry.source === 'outbound') return entry.kind === 'ack' ? '↩️' : '💬';
  if (entry.source === 'inbound-pending') return '🔴';

  return entry.isTranscript ? '🎙️' : '📥';
}

/** Az első értelmes sor — a visszanézés áttekintés, nem teljes szöveg. */
function firstLine(entry: CommHistoryEntry): string {
  if (!entry.text) return '*(a szöveg nincs rögzítve)*';

  const meaningful: string = entry.text
    .split('\n')
    .map((line) => line.trim())
    // A hangüzenet-jelölést és a flag-sort átugorjuk — a TARTALOM érdekel.
    .filter((line) => line && !line.startsWith(TRANSCRIPT_MARKER) && !line.startsWith('['))
    .join(' ');

  const text: string = meaningful || entry.text.trim();

  return text.length > 110 ? `${text.slice(0, 110)}…` : text;
}

function formatClock(iso: string): string {
  const parsed: Date = new Date(iso);

  if (Number.isNaN(parsed.getTime())) return iso;

  const pad = (v: number): string => String(v).padStart(2, '0');

  return `${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} `
    + `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

/** JSONL beolvasás, ami sérült soron NEM áll meg. A csatorna-ellenőrzés is ezt használja. */
export async function readJsonlSafe(path: string): Promise<Record<string, unknown>[]> {
  if (!existsSync(path)) return [];

  try {
    const raw: string = await readFile(path, 'utf-8');
    const out: Record<string, unknown>[] = [];

    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;

      try {
        out.push(JSON.parse(line) as Record<string, unknown>);
      } catch (err) {
        // Egy serult sor nem nemithatja el a tobbit — de o maga sem lehet nema.
        reportSwallowedFailure('comm.history.parseLine', err);
        continue;
      }
    }

    return out;
  } catch (err) {
    // ⚠️ Az ures lista azt jelentene, hogy „nem tortent semmi". Ha valojaban olvasni sem
    // tudtuk, az MAS — es pont ezt a kulonbseget kerte szamon az owner a naplon.
    reportSwallowedFailure('comm.history.readJsonl', err);

    return [];
  }
}

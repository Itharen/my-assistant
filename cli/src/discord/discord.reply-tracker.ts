// G-1 — VÁLASZ-KÖTELEZETTSÉG KÖVETÉSE.
//
// Owner-szabály (2026-09-06): *„ezekre nem elég ha csak válaszolsz, hanem a Discord
// üzenetben is kell válaszoljál."*
//
// 🔴 MIÉRT KELL GÉPI ELLENŐRZÉS: a legvalószínűbb csendes hiba az, hogy válaszolok a
// sessionben, azt hiszem, kész — és az owner oldalán **néma marad a csatorna**. Ez nem
// bízható az emlékezetemre: ha nincs mérés, a mulasztás láthatatlan.
//
// A logika egyszerű és nem tud „majdnem jó" lenni:
//   ha a LEGUTÓBB BEJUTTATOTT bejövő üzenet ÚJABB, mint a LEGUTÓBBI kimenő válasz,
//   akkor válasszal tartozom.

import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { resolveDiscordBatchPaths } from './discord.batch-store.js';

/** A kimenő üzenetek naplója — ebből tudjuk, mikor válaszoltunk utoljára. */
export function resolveOutboundLogPath(): string {
  return join(dirname(resolveDiscordBatchPaths().pendingFile), 'outbound-log.jsonl');
}

/**
 * A kimenő üzenet fajtája.
 *
 * 🔴 MIÉRT KELL MEGKÜLÖNBÖZTETNI: az **átvételi nyugta** („megvan, dolgozom") is kimenő
 * üzenet, de ⛔ **NEM válasz**. Ha ugyanúgy számítana, a nyugta **letörölné a
 * válasz-kötelezettséget** — vagyis pont az az ellenőrzés vakulna meg, ami azt fogja meg,
 * hogy csak a sessionben válaszoltam.
 */
export type OutboundKind = 'reply' | 'ack';

/**
 * Egy kimenő üzenet rögzítése. Hibát NEM dob — a naplózás nem akaszthatja meg a küldést.
 *
 * ⭐ A `text` 2026-09-07 óta rögzül. **Owner-kérdés:** *„Van am eszközöd amivel vissza tudod
 * nézni az üzeneteimet? +Transcripted? Tiédeket?"* — a bejövő oldalra a válasz IGEN volt
 * *(archívum + hangüzenet-átirat)*, a **sajátomra NEM**: itt addig csak `sentAt` és `kind`
 * állt, vagyis tudtam, **mikor** írtam, de nem, hogy **mit**.
 *
 * 🔴 Ez pont a rossz oldalon volt hiányos: ha nem tudom, mit ígértem, nem tudom betartani sem.
 */
export async function recordOutbound(
  sentAt: string = new Date().toISOString(),
  kind: OutboundKind = 'reply',
  text?: string,
): Promise<void> {
  const path: string = resolveOutboundLogPath();

  try {
    await mkdir(dirname(path), { recursive: true });
    await appendFile(
      path,
      `${JSON.stringify({ sentAt, kind, ...(text ? { text: text } : {}) })}\n`,
      'utf-8',
    );
  } catch (err) {
    // Ha nem tudjuk rogziteni, a kovetkezo ellenorzes „tartozunk valasszal"-t mond — ami az
    // OVATOS irany, a hamis „rendben" lenne a veszelyes. ⛔ De a nema valtozatban egy tartos
    // iras-hiba orokos „tartozunk valasszal"-t okozott volna, minden magyarazat nelkul.
    SwallowedFailure_Util.report('discord.reply-tracker.recordOutbound', err);
  }
}

export interface ReplyObligationStatus {
  /** Tartozunk-e válasszal Discordon. */
  owesReply: boolean;
  /** A legutóbb bejuttatott bejövő üzenet ideje (ISO), ha volt. */
  lastInboundAt?: string;
  /** A legutóbbi kimenő válasz ideje (ISO), ha volt. */
  lastOutboundAt?: string;
  /** Hány perce vár válaszra. */
  waitingMinutes?: number;
}

/**
 * Tartozunk-e Discord-válasszal?
 *
 * A bejövő oldal forrása a **kézbesített** üzenetek archívuma — mert a válasz-kötelezettség
 * akkor keletkezik, amikor az üzenet ténylegesen eljutott hozzám, nem amikor beérkezett.
 */
export async function checkReplyObligation(now: Date = new Date()): Promise<ReplyObligationStatus> {
  const lastInboundAt: string | undefined = await readLastTimestamp(
    resolveDiscordBatchPaths().archiveFile,
    ['deliveredAt', 'receivedAt'],
  );

  if (!lastInboundAt) return { owesReply: false };

  // A NYUGTAKAT KIHAGYJUK: a "megvan, dolgozom" nem valasz. Enelkul egy nyugta letorolne
  // a valasz-kotelezettseget, es a mulasztas ujra lathatatlanna valna.
  const lastOutboundAt: string | undefined = await readLastTimestamp(
    resolveOutboundLogPath(),
    ['sentAt'],
    (entry) => entry['kind'] !== 'ack',
  );

  const inboundMs: number = new Date(lastInboundAt).getTime();
  const outboundMs: number = lastOutboundAt ? new Date(lastOutboundAt).getTime() : 0;

  if (Number.isNaN(inboundMs)) return { owesReply: false, lastInboundAt, lastOutboundAt };

  const owesReply: boolean = inboundMs > outboundMs;

  return {
    owesReply,
    lastInboundAt,
    lastOutboundAt,
    waitingMinutes: owesReply ? Math.round((now.getTime() - inboundMs) / 60_000) : undefined,
  };
}

/** A fájl UTOLSÓ sorából az első megtalált időbélyeg-mező. */
async function readLastTimestamp(
  path: string,
  fields: string[],
  accept: (entry: Record<string, unknown>) => boolean = () => true,
): Promise<string | undefined> {
  if (!existsSync(path)) return undefined;

  try {
    const lines: string[] = (await readFile(path, 'utf-8'))
      .split('\n')
      .filter((line) => line.trim().length > 0);

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      try {
        const parsed = JSON.parse(lines[index]!) as Record<string, unknown>;

        if (!accept(parsed)) continue;

        for (const field of fields) {
          const value: unknown = parsed[field];

          if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) return value;
        }
      } catch (err) {
        // Serult sor — megyunk visszafele tovabb, de nem nyomtalanul.
        SwallowedFailure_Util.report('discord.reply-tracker.parseLogLine', err);
      }
    }
  } catch (err) {
    SwallowedFailure_Util.report('discord.reply-tracker.readNewestTimestamp', err);

    return undefined;
  }

  return undefined;
}

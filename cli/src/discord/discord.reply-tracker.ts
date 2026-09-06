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

import { resolveDiscordBatchPaths } from './discord.batch-store.js';

/** A kimenő üzenetek naplója — ebből tudjuk, mikor válaszoltunk utoljára. */
export function resolveOutboundLogPath(): string {
  return join(dirname(resolveDiscordBatchPaths().pendingFile), 'outbound-log.jsonl');
}

/** Egy kimenő üzenet rögzítése. Hibát NEM dob — a naplózás nem akaszthatja meg a küldést. */
export async function recordOutbound(sentAt: string = new Date().toISOString()): Promise<void> {
  const path: string = resolveOutboundLogPath();

  try {
    await mkdir(dirname(path), { recursive: true });
    await appendFile(path, `${JSON.stringify({ sentAt })}\n`, 'utf-8');
  } catch {
    // Elnyelve: ha nem tudjuk rögzíteni, a következő ellenőrzés „tartozunk válasszal"-t
    // mond — ami az ÓVATOS irány. A hamis „rendben" lenne a veszélyes.
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

  const lastOutboundAt: string | undefined = await readLastTimestamp(
    resolveOutboundLogPath(),
    ['sentAt'],
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
async function readLastTimestamp(path: string, fields: string[]): Promise<string | undefined> {
  if (!existsSync(path)) return undefined;

  try {
    const lines: string[] = (await readFile(path, 'utf-8'))
      .split('\n')
      .filter((line) => line.trim().length > 0);

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      try {
        const parsed = JSON.parse(lines[index]!) as Record<string, unknown>;

        for (const field of fields) {
          const value: unknown = parsed[field];

          if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) return value;
        }
      } catch {
        // Sérült sor — megyünk visszafelé tovább.
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

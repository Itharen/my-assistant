// `ma comm <subcommand>` — kommunikációs csatornák kezelése.
//
//   doctor  — tételes diagnosztika: mi él, mi hiányzik, MIT KELL TENNI
//   flush   — a Discord-köteg kiküldése (a döntés szerint, vagy `--force`-szal)
//   listen  — a Discord-figyelő (hosszan futó)
//   say     — kimenő üzenet; `--text` VAGY `--file`
//
// 🔴 A `--file` NEM kényelmi opció (2026-09-07 incidens): Windowson az `npx`/`cmd` burkoló
// a többsoros `--text` argumentumot AZ ELSŐ ÚJSORNÁL LEVÁGTA, és a rendszer minden szintje
// sikert jelentett rá. Fájlból olvasva a szöveg SOHA nem megy át a shellen.
//
// A `doctor` alapból EMBER-OLVASHATÓ táblát ír; `--json`-nal gépi envelope-ot.

import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { runCommDoctor } from '../comm/comm.doctor.js';
import type { CommCheck, CommCheckStatus, CommDoctorReport } from '../comm/comm.models.js';
import { DiscordBridge } from '../discord/discord.bridge.js';
import { DiscordListener } from '../discord/discord.listener.js';
import { sendDiscordMessage } from '../discord/discord.sender.js';
import { CcapError } from '../ccap/ccap.error.js';
import { fail, makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

const STATUS_ICON: Record<CommCheckStatus, string> = {
  ok: '✅',
  missing: '⚪',
  degraded: '🟡',
  broken: '🔴',
  unknown: '❓',
};

const AREA_LABEL: Record<CommCheck['area'], string> = {
  ldp: 'LDP',
  ccap: 'CCAP',
  discord: 'Discord',
  speaker: 'Hangszóró',
  presence: 'Jelenlét',
};

/**
 * A kimenő üzenet szövegének feloldása — `--file` VAGY `--text`.
 *
 * 🔴 A `--file` az AJÁNLOTT út. A 2026-09-07-i incidensben a Windows `npx`/`cmd` burkoló a
 * többsoros `--text` argumentumot az ELSŐ ÚJSORNÁL levágta — a CLI és a `discord.js`
 * hibátlanul működött, csak sosem kapta meg a teljes szöveget. Fájlból olvasva a szöveg
 * **soha nem megy át a shellen**, tehát ez a hiba szerkezetileg lehetetlenné válik.
 *
 * ⛔ A hiányzó/olvashatatlan fájl NEM csendes: `CcapError`-t dob, orvoslással.
 */
async function resolveOutgoingText(
  source: { text?: string; file?: string },
): Promise<{ ok: true; text: string } | { ok: false; detail: string; remedy: string }> {
  if (!source.file) return { ok: true, text: source.text ?? '' };

  try {
    return { ok: true, text: await readFile(source.file, 'utf-8') };
  } catch (err: unknown) {
    return {
      ok: false,
      detail: `A megadott fájl nem olvasható: ${source.file} — `
        + `${err instanceof Error ? err.message : String(err)}`,
      remedy: 'Ellenőrizd az útvonalat (abszolút út a legbiztosabb), és hogy UTF-8 a kódolás.',
    };
  }
}

export async function runCommCommand(subcommand: string, args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args,
    options: {
      json: { type: 'boolean' },
      pretty: { type: 'boolean' },
      force: { type: 'boolean' },
      text: { type: 'string' },
      file: { type: 'string' },
    },
    strict: false,
  });
  const asJson: boolean = Boolean(parsed.values.json);
  const pretty: boolean = Boolean(parsed.values.pretty);
  const action: string = `comm.${subcommand}`;

  try {
    if (subcommand === 'doctor') {
      const report: CommDoctorReport = await runCommDoctor();

      if (asJson) {
        writeEnvelope(ok(action, requestId, startedAt, report), pretty);
      } else {
        process.stdout.write(renderReport(report));
      }

      // A hibás/részleges állapot nem-nulla kilépési kód — így scriptből is észrevehető.
      if (report.overall === 'broken' || report.overall === 'degraded') process.exitCode = 1;
      return;
    }

    if (subcommand === 'flush') {
      const result = await new DiscordBridge().flush({ force: Boolean(parsed.values.force) });

      writeEnvelope(
        ok(action, requestId, startedAt, result ?? { deliveredCount: 0, skipped: true }),
        pretty || !asJson,
      );
      return;
    }

    if (subcommand === 'say') {
      const source = await resolveOutgoingText({
        text: typeof parsed.values.text === 'string' ? parsed.values.text : undefined,
        file: typeof parsed.values.file === 'string' ? parsed.values.file : undefined,
      });

      if (!source.ok) {
        // ⛔ A hiba SOSEM csendes: a hívó lássa, MI a baj és MIT tegyen.
        writeEnvelope(
          ok(action, requestId, startedAt, { sent: false, partCount: 0, detail: source.detail, remedy: source.remedy }),
          true,
        );
        process.exitCode = 1;

        return;
      }

      const result = await sendDiscordMessage(source.text);

      writeEnvelope(ok(action, requestId, startedAt, result), pretty || !asJson);

      if (!result.sent) process.exitCode = 1;
      return;
    }

    if (subcommand === 'listen') {
      // ⚠️ HOSSZAN FUTÓ parancs: a Discord-kapcsolat addig él, amíg ez a folyamat fut.
      const listener: DiscordListener = new DiscordListener();
      const result = await listener.start();

      writeEnvelope(ok(action, requestId, startedAt, result), pretty || !asJson);

      if (!result.started) {
        process.exitCode = 1;
        return;
      }

      // Siker esetén NEM térünk vissza — a figyelő a folyamat élettartamáig dolgozik.
      process.stdout.write('A figyelő fut. Leállítás: Ctrl+C.\n');
      await new Promise<void>((resolve) => {
        process.once('SIGINT', () => {
          void listener.stop().finally(resolve);
        });
      });

      return;
    }

    process.stderr.write(
      `Ismeretlen comm subcommand: "${subcommand}". Használat: doctor | flush | listen | say\n`,
    );
    process.exitCode = 1;
  } catch (err: unknown) {
    if (err instanceof CcapError) {
      writeEnvelope(
        fail(action, requestId, startedAt, err.code, err.message, { remedy: err.remedy }),
        true,
      );
      process.exitCode = 1;
      return;
    }

    throw err;
  }
}

/** Ember-olvasható riport — ezt olvassa az agent és az owner is. */
function renderReport(report: CommDoctorReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  KOMMUNIKÁCIÓS CSATORNÁK — DIAGNOSZTIKA');
  lines.push(`  ${report.checkedAt}`);
  lines.push('');

  let currentArea: string = '';

  for (const check of report.checks) {
    if (check.area !== currentArea) {
      currentArea = check.area;
      lines.push(`  ── ${AREA_LABEL[check.area]} ──`);
    }

    lines.push(`  ${STATUS_ICON[check.status]} ${check.label}`);
    lines.push(`       ${check.detail}`);

    if (check.remedy) lines.push(`       → TEENDŐ: ${check.remedy}`);

    lines.push('');
  }

  lines.push(`  ÖSSZEGZÉS: ${report.headline}`);
  lines.push('');

  return lines.join('\n');
}

// `ma stt transcript <messageId>` · `ma stt pending` — a hangüzenet-nyilvántartás olvasása.
//
// 🔴 OWNER-KÉRÉS (2026-09-08 14:49): *„lesz olyan üzenetem, kérésem, hogy »ezt az üzenetet
// próbáld újraolvasni« (reply-al)… Szóval kelleni fog reply reference és **on demand read** és
// voice process."*
//
// ⭐ EZ AZ „ON DEMAND READ": az owner egy üzenetre válaszol, az asszisztens megkapja a
// **válasz-referenciát** (`referencedMessageId`), és ezzel a paranccsal **visszakeresi**, mi
// hangzott el benne — vagy hogy **miért nem tudjuk**.
//
// ⚠️ A `pending` a **feloldatlanok** munkalistája: ezekhez a hang MEGVAN, csak a szöveg nem.

import { parseArgs } from 'node:util';

import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';
import {
  TranscriptLedger,
  type TranscriptLedgerEntry,
} from '../stt/stt.transcript-ledger.js';
import { localStamp, localTimeHeader } from '../utils/local-time.js';

/** Egy bejegyzés ember-olvasható alakja. */
function renderEntry(entry: TranscriptLedgerEntry, ledger: TranscriptLedger): string {
  const when: string = localStamp(new Date(entry.firstSeenAt));
  const head: string = `  ${entry.status === 'resolved' ? '✅' : '🔴'} ${entry.messageId} `
    + `· ${when} · ${entry.authorName}`
    + (entry.durationSecs === undefined ? '' : ` · ${Math.round(entry.durationSecs)} mp`);

  if (entry.status === 'resolved') {
    return `${head}\n       „${entry.transcript ?? ''}"`;
  }

  // 🔴 A bukásnál a LEGFONTOSABB információ az, hogy MEGVAN-E MÉG A HANG — mert csak akkor
  // van értelme visszamenőleg feloldani.
  const audio: string = ledger.audioPathOf(entry)
    ? '🎧 a hang MEGVAN — újra megpróbálható'
    : '⛔ a hang NINCS meg — ez a tartalom véglegesen elveszett';

  return `${head}\n       ⚠️ ${entry.failure ?? '(ok ismeretlen)'} `
    + `(${entry.attempts} próba)\n       ${audio}`;
}

export async function runSttCommand(subcommand: string, args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args,
    options: { json: { type: 'boolean' }, pretty: { type: 'boolean' } },
    strict: false,
    allowPositionals: true,
  });
  const ledger: TranscriptLedger = new TranscriptLedger();

  if (subcommand === 'pending') {
    const failed: TranscriptLedgerEntry[] = await ledger.listFailed();

    if (parsed.values.json) {
      writeEnvelope(ok('stt.pending', requestId, startedAt, {
        count: failed.length,
        entries: failed,
      }), parsed.values.pretty === true);

      return;
    }

    if (!failed.length) {
      process.stdout.write(`\n🎙️ Feloldatlan hangüzenet: nincs.\n  ${localTimeHeader()}\n\n`);

      return;
    }

    process.stdout.write(
      `\n🎙️ FELOLDATLAN hangüzenetek (${failed.length})\n  ${localTimeHeader()}\n\n`
      + `${failed.map((e) => renderEntry(e, ledger)).join('\n\n')}\n\n`,
    );

    return;
  }

  if (subcommand === 'transcript') {
    const messageId: string = String(parsed.positionals[0] ?? '').trim();

    if (!messageId) {
      // ⛔ A néma üres-válasz tilos: a hívó lássa, MI hiányzik és MIT tegyen.
      process.stderr.write(
        'Hiányzik az üzenet-azonosító.\n'
        + 'Használat: ma stt transcript <messageId>  (a válasz-referenciából jön)\n',
      );
      process.exitCode = 1;

      return;
    }

    const entry: TranscriptLedgerEntry | null = await ledger.get(messageId);

    if (parsed.values.json) {
      writeEnvelope(ok('stt.transcript', requestId, startedAt, {
        found: entry !== null,
        entry: entry,
        audioAvailable: entry ? ledger.audioPathOf(entry) !== null : false,
      }), parsed.values.pretty === true);

      return;
    }

    if (!entry) {
      // ⚠️ „Nincs bejegyzés" NEM azt jelenti, hogy nem hangzott el semmi — azt jelenti, hogy
      // erről az üzenetről nincs feljegyzésünk. A kettő összemosása félrevezetne.
      process.stdout.write(
        `\n⚪ Erről az üzenetről (${messageId}) NINCS feljegyzés a nyilvántartásban.\n`
        + '   Vagy nem hangüzenet volt, vagy még a nyilvántartás bevezetése előtt érkezett.\n\n',
      );

      return;
    }

    process.stdout.write(`\n${renderEntry(entry, ledger)}\n\n`);

    return;
  }

  process.stderr.write(
    `Ismeretlen stt subcommand: "${subcommand}". Használat: transcript <messageId> | pending\n`,
  );
  process.exitCode = 1;
}

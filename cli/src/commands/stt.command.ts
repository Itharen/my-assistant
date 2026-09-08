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

import { DiscordBridge } from '../discord/discord.bridge.js';
import { composeTranscriptForBatch } from '../discord/discord.voice-message.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';
import { transcribeAudio } from '../stt/stt.client.js';
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

  if (subcommand === 'retry') {
    await runRetry(
      parsed.positionals.map(String),
      ledger,
      requestId,
      startedAt,
      parsed.values.pretty === true,
      parsed.values.json === true,
    );

    return;
  }

  process.stderr.write(
    `Ismeretlen stt subcommand: "${subcommand}". `
    + 'Használat: transcript <messageId> | pending | retry <messageId>\n',
  );
  process.exitCode = 1;
}

/**
 * 🔁 VISSZAMENŐLEGES FELOLDÁS — a T-68 harmadik, cél-része.
 *
 * > **Owner (2026-09-08 15:31):** *„…és ilyenkor ezeket majd **visszamenőlegesen is fel kell
 * > tudjad oldani**."*
 *
 * ⭐ MIÉRT MŰKÖDIK MOST, ami eddig lehetetlen volt: a nyilvántartás a feladáskor **megőrzi a
 * hangot** *(1. rész)*. Enélkül a `SttRetryQueue.remove()` már törölte volna, és nem lenne
 * mit újrapróbálni — pontosan ez veszített el ma egy 30 másodperces hangüzenetet.
 *
 * ⚠️ **A siker a KÖTEGBE is bekerül** — különben megvolna a szöveg, de nem jutna el az
 * asszisztenshez, vagyis a cél előtt egy lépéssel bukna el az egész.
 */
async function runRetry(
  positionals: string[],
  ledger: TranscriptLedger,
  requestId: string,
  startedAt: number,
  pretty: boolean,
  asJson: boolean,
): Promise<void> {
  const messageId: string = String(positionals[0] ?? '').trim();

  if (!messageId) {
    process.stderr.write(
      'Hiányzik az üzenet-azonosító.\n'
      + 'Használat: ma stt retry <messageId>   (a `ma stt pending` listázza a feloldatlanokat)\n',
    );
    process.exitCode = 1;

    return;
  }

  const entry: TranscriptLedgerEntry | null = await ledger.get(messageId);

  if (!entry || entry.status !== 'failed') {
    // ⚠️ A „nincs mit újrapróbálni" NEM hiba — de ⛔ nem is maradhat néma.
    process.stdout.write(`\n⚪ ${!entry
      ? `Erről az üzenetről (${messageId}) nincs feljegyzés.`
      : 'Ez az üzenet MÁR fel van oldva — nincs mit újrapróbálni.'}\n\n`);

    return;
  }

  const audio: Uint8Array | null = await ledger.readAudio(entry);

  if (!audio) {
    process.stdout.write(
      `\n⛔ A hang NINCS meg ehhez az üzenethez (${messageId}) — ez a tartalom véglegesen\n`
      + '   elveszett. A bejegyzés megmarad, hogy legalább a TÉNY látszódjon.\n\n',
    );
    process.exitCode = 1;

    return;
  }

  process.stdout.write(`\n🔁 Újrapróbálom: ${messageId}\n  ${localTimeHeader()}\n`);

  const result = await transcribeAudio({
    audio: audio,
    filename: entry.filename,
    ...(entry.durationSecs === undefined ? {} : { audioDurationSecs: entry.durationSecs }),
  });

  if (!result.ok || !result.text.trim()) {
    // 🔴 A bukás NEM írja felül a bejegyzést: a hang MEGMARAD, a következő próba ugyanígy
    // elindítható. ⛔ Egy sikertelen újrapróbálás nem törölheti a tartalmat.
    process.stdout.write(
      `\n🔴 Most sem sikerült: ${result.detail || '(nincs részlet)'}\n`
      + '   ⭐ A hang MEGMARAD — később újra megpróbálható.\n\n',
    );
    process.exitCode = 1;

    return;
  }

  await ledger.recordResolved({
    messageId: entry.messageId,
    channelId: entry.channelId,
    authorName: entry.authorName,
    filename: entry.filename,
    ...(entry.durationSecs === undefined ? {} : { durationSecs: entry.durationSecs }),
    transcript: result.text,
    attempts: entry.attempts + 1,
  });

  // ⭐ A CÉL: a késve feloldott szöveg ELJUT az asszisztenshez, nem csak a nyilvántartásba.
  // ⚠️ Külön azonosítóval, hogy a köteg duplikátum-szűrője ne dobja el az eredeti mellett.
  await new DiscordBridge().enqueue({
    messageId: `${entry.messageId}-retry`,
    authorId: '',
    authorName: entry.authorName,
    channelId: entry.channelId,
    content: composeTranscriptForBatch({
      transcript: result.text,
      ...(entry.durationSecs === undefined ? {} : { durationSecs: entry.durationSecs }),
    }),
    receivedAt: new Date().toISOString(),
    referencedMessageId: entry.messageId,
  });

  if (asJson) {
    writeEnvelope(ok('stt.retry', requestId, startedAt, {
      messageId: entry.messageId,
      transcript: result.text,
    }), pretty);

    return;
  }

  process.stdout.write(`\n✅ FELOLDVA — és a kötegbe is bekerült:\n   „${result.text}"\n\n`);
}

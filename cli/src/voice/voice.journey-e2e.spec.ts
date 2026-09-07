// 🧭 USER-JOURNEY E2E — a hang-csatorna teljes útja, a beszédtől a MÉRHETŐ eredményig.
//
// > Kötelező réteg (`core-e2e-user-journey`): cross-feature · sorrendhelyes · **állapot-továbbadó**
// > · lépésenkénti business-assert · az **értéket adó kimenetig** fut · cleanup.
//
// ⭐ MIÉRT KELL EZ A PER-MODUL TESZTEK MELLÉ. Minden darab külön zöld volt — és a lánc mégis
// **1%-on** teljesített. A hibák a **darabok KÖZÖTT** voltak: a tükör rossz csatornába ment, a
// duplikátum veszteségnek látszott, a „hallak" féke elnyelte az „eldobva" jelzést. ⇒ Egy
// journey pont azt méri, amit egy unit-teszt szerkezetileg **nem tud**: hogy a szomszédos
// darabok **ugyanazt értik**.
//
// 🔴 A LEGFONTOSABB ASSERT — A NAPLÓ-SZÓKINCS ODA-VISSZA:
// az **író** (`classifyRecordingOutcome` / a figyelő) és az **olvasó** (`buildVoiceFunnelReport`)
// külön modul. Ha a kód-sztringek elcsúsznának, a tölcsér **nem hibázna — NULLÁT jelentene**,
// és úgy nézne ki, mintha nem veszett volna el semmi. ⚠️ Pontosan az a néma, jóindulatúnak
// látszó adatvesztés, ami ellen az egész mérés készült. Ez a journey végigviszi a kört.
//
// ⛔ Ami NINCS benne, és nem is lehet: a valódi Discord-hang és a valódi STT. Azok élő
// mérést igényelnek (`ma comm voice-funnel`), és a journey ezt **nem** állítja másnak.

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DiscordBatchStore } from '../discord/discord.batch-store.js';
import { VoiceChannelBridge, VOICE_CHANNEL_MARKER } from './voice-channel-bridge.js';
import {
  classifyRecordingOutcome,
  handleFinishedRecording,
  type RecordingHandled,
} from './voice-channel-recorder.js';
import { VoiceDropProbe, type VoiceDropObservation } from './voice-drop-probe.js';
import { MissedSpeechReporter } from './voice-missed-speech.js';
import { planFeedbackForDrop, planFeedbackForOutcome } from './voice-feedback-plan.js';
import { buildVoiceFunnelReport, type VoiceFunnelReport } from './voice-funnel-report.js';
import { VOICE_LOG_CODES } from './voice-log-codes.js';
import type { sendDiscordMessage } from '../discord/discord.sender.js';
import type { SttResult } from '../stt/stt.models.js';

const OWNER_ID: string = 'owner-42';
const VOICE_CHANNEL_ID: string = 'hang-csatorna-42';
const DAY: string = '2026-09-08';

/** 1 másodperc hang bájtban: 48 kHz · 2 csatorna · 16 bit + WAV-fejléc. */
const ONE_SECOND_BYTES: number = 44 + 48000 * 2 * 2;

interface SentMessage {
  text: string;
  channelId: string | undefined;
}

describe('🧭 hang-csatorna — kritikus user-journey', () => {
  let root: string;
  let recordingsDir: string;
  let sent: SentMessage[];
  let logLines: string[];

  /** A csatornába küldött üzenetek elkapása — a cél-csatornával EGYÜTT. */
  function makeSender(): typeof sendDiscordMessage {
    return (async (text: string, _kind: string, channelId?: string) => {
      sent.push({ text: text, channelId: channelId });

      return { sent: true, partCount: 1, detail: 'ok' };
    }) as unknown as typeof sendDiscordMessage;
  }

  /** Egy napló-sor kiírása — pontosan úgy, ahogy a figyelő teszi. */
  function log(code: string, extra: Record<string, unknown> = {}): void {
    logLines.push(JSON.stringify({
      ts: `${DAY}T00:30:00+02:00`,
      actor: 'cli',
      kind: 'note',
      extra: { code: code, ...extra },
    }));
  }

  async function flushLog(): Promise<void> {
    await writeFile(join(root, '__agent', 'log', 'actions', `${DAY}.jsonl`), logLines.join('\n'), 'utf8');
  }

  function bridgeOn(store: DiscordBatchStore): VoiceChannelBridge {
    return new VoiceChannelBridge(store, makeSender());
  }

  function stt(overrides: Partial<SttResult> = {}): () => Promise<SttResult> {
    return async (): Promise<SttResult> => ({
      ok: true,
      text: 'Nézd meg a holnapi programot.',
      detail: 'Felismerve.',
      elapsedMs: 800,
      suspicious: false,
      ...overrides,
    });
  }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'ma-voice-journey-'));
    recordingsDir = join(root, 'recordings');
    sent = [];
    logLines = [];

    await mkdtempTree(root, recordingsDir);
  });

  afterEach(async () => {
    // 🧹 CLEANUP — a journey nem hagyhat maga után se fájlt, se könyvtárat.
    await rm(root, { recursive: true, force: true });
  });

  it('✅ TELJES ÚT: beszéd → felismerés → köteg + tükör a HANG-csatornába → mérhető 100%', async () => {
    const store = new DiscordBatchStore({
      pendingFile: join(root, 'pending.jsonl'),
      archiveFile: join(root, 'archive.jsonl'),
    });
    const probe = new VoiceDropProbe({ recordingsDir: recordingsDir, ownerUserId: OWNER_ID });
    const wav: string = join(recordingsDir, `recording-${OWNER_ID}-01.wav`);

    // ── 1. lépés: megszólalás — felvétel keletkezik, a szonda látja ────────────────────────
    await writeFile(wav, Buffer.alloc(ONE_SECOND_BYTES * 3));
    probe.markSpeechStart();
    await sweep(probe);

    expect(probe.funnel.speechStarts).toBe(1);
    expect(probe.funnel.filesOpened).toBe(1);

    // ── 2. lépés: az ELŐZŐ lépésben létrejött fájlt dolgozzuk fel (állapot-továbbadás) ─────
    const outcome: RecordingHandled = await handleFinishedRecording({
      userId: OWNER_ID,
      filename: wav,
      ownerUserId: OWNER_ID,
      ownerName: 'Itharen',
      channelId: VOICE_CHANNEL_ID,
      bridge: bridgeOn(store),
      transcribe: stt() as never,
    });

    expect(outcome.queued).toBe(true);
    expect(outcome.transcribed).toBe(true);

    // ── 3. lépés: az ÉRTÉKET ADÓ KIMENET — a szöveg tényleg a kötegben van ────────────────
    const pending: string = await readFile(join(root, 'pending.jsonl'), 'utf8');

    expect(pending).toContain('Nézd meg a holnapi programot.');
    expect(pending).toContain(VOICE_CHANNEL_MARKER);

    // ── 4. lépés: a tükör ODA ment, ahol elhangzott — NEM a fő chatbe ─────────────────────
    expect(sent.length).toBe(1);
    expect(sent[0]?.channelId).toBe(VOICE_CHANNEL_ID);
    expect(sent[0]?.text).toContain('Nézd meg a holnapi programot.');

    // ── 5. lépés: a szonda tudja, hogy ez NEM veszett el ──────────────────────────────────
    probe.markDelivered(wav);
    await rm(wav);
    await sweep(probe);

    expect(probe.funnel.filesDelivered).toBe(1);
    expect(probe.funnel.filesDropped).toBe(0);

    // ── 6. lépés: a visszajelzés-terv a SIKER hangját adja, jelentés nélkül ───────────────
    const plan = planFeedbackForOutcome(outcome);

    expect(plan.cue).toBe('understood');
    expect(plan.missed).toBeNull();

    // ── 7. lépés: 🔴 A SZÓKINCS ODA-VISSZA — az író kódját az olvasó FELDOLGOZZA ──────────
    log(classifyRecordingOutcome(outcome));
    await flushLog();

    const funnel: VoiceFunnelReport = await buildVoiceFunnelReport({ projectRoot: root, day: DAY });

    expect(funnel.hasData).toBe(true);
    expect(funnel.queued).toBe(1);
    expect(funnel.transferRatePct).toBe(100);
    // ⚠️ És a rendszer maga mondja meg, hogy EBBŐL MÉG NEM lehet következtetni.
    expect(funnel.attempts).toBe(1);
  });

  it('🔴 VESZTESÉG-VARIÁNS: a felvevő némán eldobja → látható jelzés + a tölcsérben MÁSODPERC', async () => {
    const drops: VoiceDropObservation[] = [];
    const probe = new VoiceDropProbe({
      recordingsDir: recordingsDir,
      ownerUserId: OWNER_ID,
      onDrop: (observation: VoiceDropObservation): void => void drops.push(observation),
    });
    const reporter = new MissedSpeechReporter({
      channelId: VOICE_CHANNEL_ID,
      speakerName: 'Itharen',
      send: makeSender(),
      quietMs: 60_000,
    });
    const wav: string = join(recordingsDir, `recording-${OWNER_ID}-02.wav`);

    // ── 1. lépés: 3 másodpercnyi beszéd kerül felvételre ──────────────────────────────────
    await writeFile(wav, Buffer.alloc(44 + 3 * 48000 * 2 * 2));
    probe.markSpeechStart();
    await sweep(probe);

    // ── 2. lépés: a felvevő ELDOBJA — a hook SOSEM szólal meg ─────────────────────────────
    await rm(wav);
    await sweep(probe);

    expect(drops.length).toBe(1);
    expect(drops[0]?.reason).toBe('discarded-by-recorder');
    expect(drops[0]?.lostAudioSeconds).toBe(3);

    // ── 3. lépés: a visszajelzés-terv SZÓL és JELENT (az előző lépés megfigyeléséből) ─────
    const plan = planFeedbackForDrop(drops[0] as VoiceDropObservation);

    expect(plan.cue).toBe('dropped');
    reporter.note(plan.missed as never);

    // ── 4. lépés: az ÉRTÉKET ADÓ KIMENET — az owner LÁTJA a hang-csatornában ──────────────
    await reporter.flush();

    expect(sent.length).toBe(1);
    expect(sent[0]?.channelId).toBe(VOICE_CHANNEL_ID);
    expect(sent[0]?.text).toContain('1 megszólalás NEM jutott át');
    expect(sent[0]?.text).toContain('3 mp');

    // ── 5. lépés: 🔴 SZÓKINCS ODA-VISSZA a veszteség-ágon is ─────────────────────────────
    log(VOICE_LOG_CODES.droppedSilently, {
      reason: drops[0]?.reason,
      lostAudioSeconds: drops[0]?.lostAudioSeconds,
    });
    await flushLog();

    const funnel: VoiceFunnelReport = await buildVoiceFunnelReport({ projectRoot: root, day: DAY });

    expect(funnel.droppedByRecorder).toBe(1);
    expect(funnel.lostAudioSeconds).toBe(3);
    expect(funnel.transferRatePct).toBe(0);
  });

  it('⚪ MEGSZAKÍTÁS-VARIÁNS: idegen beszélő és duplikátum NEM rontja a mérést', async () => {
    const store = new DiscordBatchStore({
      pendingFile: join(root, 'pending.jsonl'),
      archiveFile: join(root, 'archive.jsonl'),
    });
    const bridge = bridgeOn(store);
    const wav: string = join(recordingsDir, `recording-${OWNER_ID}-03.wav`);

    await writeFile(wav, Buffer.alloc(ONE_SECOND_BYTES));

    // ── 1. lépés: IDEGEN beszélő — meg sem próbáljuk feldolgozni ─────────────────────────
    const stranger: RecordingHandled = await handleFinishedRecording({
      userId: 'valaki-mas',
      filename: wav,
      ownerUserId: OWNER_ID,
      ownerName: 'Itharen',
      channelId: VOICE_CHANNEL_ID,
      bridge: bridge,
      transcribe: stt() as never,
    });

    expect(stranger.fromOwner).toBe(false);
    expect(planFeedbackForOutcome(stranger).cue).toBeNull();

    // ── 2. lépés: az owner ugyanazt a szegmenst KÉTSZER — a második DUPLIKÁTUM ────────────
    const first: RecordingHandled = await handleFinishedRecording({
      userId: OWNER_ID, filename: wav, ownerUserId: OWNER_ID, ownerName: 'Itharen',
      channelId: VOICE_CHANNEL_ID, bridge: bridge, transcribe: stt() as never,
    });
    const second: RecordingHandled = await handleFinishedRecording({
      userId: OWNER_ID, filename: wav, ownerUserId: OWNER_ID, ownerName: 'Itharen',
      channelId: VOICE_CHANNEL_ID, bridge: bridge, transcribe: stt() as never,
    });

    expect(first.queued).toBe(true);
    expect(second.queued).toBe(false);

    // ⭐ A DUPLIKÁTUMNÁL CSEND — se hang, se „nem jutott át" üzenet.
    expect(planFeedbackForOutcome(second).cue).toBeNull();
    expect(planFeedbackForOutcome(second).missed).toBeNull();
    // ⛔ És a tükör sem ment ki másodszor: az owner azt hinné, kétszer mondta.
    expect(sent.length).toBe(1);

    // ── 3. lépés: a mérésben egyik sem VESZTESÉG ─────────────────────────────────────────
    log(classifyRecordingOutcome(stranger));
    log(classifyRecordingOutcome(first));
    log(classifyRecordingOutcome(second));
    await flushLog();

    const funnel: VoiceFunnelReport = await buildVoiceFunnelReport({ projectRoot: root, day: DAY });

    expect(funnel.queued).toBe(1);
    expect(funnel.skipped).toBe(2);
    expect(funnel.droppedAfterTranscribe).toBe(0);
    // 🔴 A LÉNYEG: a kihagyottak NEM rontják az arányt.
    expect(funnel.transferRatePct).toBe(100);
  });
});

/** Egy mintavételi kör kikényszerítése — a `setInterval` nélkül, determinisztikusan. */
async function sweep(probe: VoiceDropProbe): Promise<void> {
  await (probe as unknown as { sweep(): Promise<void> }).sweep();
}

/** A journey munkakönyvtárai. */
async function mkdtempTree(root: string, recordingsDir: string): Promise<void> {
  const { mkdir } = await import('node:fs/promises');

  await mkdir(recordingsDir, { recursive: true });
  await mkdir(join(root, '__agent', 'log', 'actions'), { recursive: true });
}

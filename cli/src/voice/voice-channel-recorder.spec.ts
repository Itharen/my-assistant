import {
  handleFinishedRecording,
  startVoiceRecording,
  type RecordingHandled,
  type TransplantedRecorder,
} from './voice-channel-recorder.js';
import type { VoiceChannelBridge } from './voice-channel-bridge.js';
import type { SttResult } from '../stt/stt.models.js';

const OWNER_ID = 'owner-1';

/** Hamis híd: megjegyzi, mit adtunk át neki. */
function makeBridge(options: { queued?: boolean } = {}): {
  bridge: VoiceChannelBridge;
  calls: { transcript: string; messageId: string; speakerId: string }[];
} {
  const calls: { transcript: string; messageId: string; speakerId: string }[] = [];

  return {
    bridge: {
      handleOwnerSpeech: async (p: {
        transcript: string; messageId: string; speakerId: string;
      }): Promise<{ queued: boolean; mirrored: boolean; detail: string }> => {
        calls.push({ transcript: p.transcript, messageId: p.messageId, speakerId: p.speakerId });

        return {
          queued: options.queued ?? true,
          mirrored: true,
          detail: 'Kötegbe téve, és a tükör-szöveg kiment.',
        };
      },
    } as unknown as VoiceChannelBridge,
    calls: calls,
  };
}

function makeStt(overrides: Partial<SttResult> = {}): () => Promise<SttResult> {
  return async (): Promise<SttResult> => ({
    ok: true,
    text: 'Szia Honnie, nézd meg a naptáram.',
    detail: 'Felismerve.',
    elapsedMs: 900,
    suspicious: false,
    ...overrides,
  });
}

const READ_OK = async (): Promise<Buffer> => Buffer.from([1, 2, 3, 4]);

const BASE = {
  userId: OWNER_ID,
  filename: 'C:/rec/recording-owner-1-2026-09-07.wav',
  ownerUserId: OWNER_ID,
  ownerName: 'Itharen',
  channelId: 'voice-1',
};

describe('voice-channel-recorder', () => {

  describe('handleFinishedRecording', () => {
    it('felismeri és átadja a hídnak', async () => {
      const { bridge, calls } = makeBridge();

      const outcome = await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        transcribe: makeStt() as never,
        read: READ_OK as never,
      });

      expect(outcome.transcribed).toBe(true);
      expect(outcome.queued).toBe(true);
      expect(calls.length).toBe(1);
      expect(calls[0]!.transcript).toBe('Szia Honnie, nézd meg a naptáram.');
    });

    it('🔴 IDEGEN BESZÉLŐ hangja NEM megy tovább — a hangból nem látszik, ki mondta', async () => {
      const { bridge, calls } = makeBridge();
      let sttCalled = false;

      const outcome = await handleFinishedRecording({
        ...BASE,
        userId: 'valaki-mas',
        bridge: bridge,
        transcribe: ((): never => { sttCalled = true; throw new Error('nem szabad hívni'); }) as never,
        read: READ_OK as never,
      });

      expect(outcome.fromOwner).toBe(false);
      expect(sttCalled).toBe(false);
      expect(calls).toEqual([]);
    });

    it('⚠️ GYANÚS átiratra NEM cselekszünk — inkább ne értsük, mint félreértsük', async () => {
      const { bridge, calls } = makeBridge();

      const outcome = await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        transcribe: makeStt({ suspicious: true, suspicionReason: 'ismert hallucináció' }) as never,
        read: READ_OK as never,
      });

      expect(outcome.transcribed).toBe(false);
      expect(outcome.detail).toContain('ismert hallucináció');
      expect(calls).toEqual([]);
    });

    it('üres átiratot sem ad tovább', async () => {
      const { bridge, calls } = makeBridge();

      const outcome = await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        transcribe: makeStt({ text: '   ' }) as never,
        read: READ_OK as never,
      });

      expect(outcome.transcribed).toBe(false);
      expect(calls).toEqual([]);
    });

    it('🔴 olvashatatlan felvételnél NEM dob — leíró eredményt ad', async () => {
      const { bridge } = makeBridge();

      const outcome = await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        transcribe: makeStt() as never,
        read: (async (): Promise<never> => { throw new Error('ENOENT'); }) as never,
      });

      expect(outcome.transcribed).toBe(false);
      expect(outcome.detail).toContain('ENOENT');
    });

    it('⭐ a FÁJLNÉV az azonosító — erre épül a híd duplikáció-védelme', async () => {
      const { bridge, calls } = makeBridge();

      await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        transcribe: makeStt() as never,
        read: READ_OK as never,
      });

      expect(calls[0]!.messageId).toBe(BASE.filename);
    });
  });

  describe('startVoiceRecording', () => {
    /** Hamis átemelt felvevő — a valódi modul-gráf 19,5 s-es betöltése nélkül. */
    function makeRecorder(): { recorder: TransplantedRecorder; state: {
      initialized: boolean; receiverConnected: boolean;
    } } {
      const state = { initialized: false, receiverConnected: false };

      return {
        recorder: {
          initializeRecordingsDirectory: async (): Promise<void> => { state.initialized = true; },
          handlePcmReceiver: (): void => { state.receiverConnected = true; },
        },
        state: state,
      };
    }

    it('inicializálja a könyvtárat, bekötni a vevőt, és felteszi a hookot', async () => {
      const { recorder, state } = makeRecorder();

      const result = await startVoiceRecording({
        connection: {} as never,
        ownerUserId: OWNER_ID,
        ownerName: 'Itharen',
        channelId: 'voice-1',
        bridge: makeBridge().bridge,
        loadRecorder: (async (): Promise<TransplantedRecorder> => recorder) as never,
      });

      expect(result.started).toBe(true);
      expect(state.initialized).toBe(true);
      expect(state.receiverConnected).toBe(true);
      expect(typeof recorder.onWavFileReadyForProcessing).toBe('function');
    });

    it('🔴 owner-azonosító NÉLKÜL el sem indul — különben bárki hangja utasítás lenne', async () => {
      const { recorder, state } = makeRecorder();

      const result = await startVoiceRecording({
        connection: {} as never,
        ownerUserId: '',
        ownerName: 'Itharen',
        channelId: 'voice-1',
        loadRecorder: (async (): Promise<TransplantedRecorder> => recorder) as never,
      });

      expect(result.started).toBe(false);
      expect(result.remedy).toContain('MA_DISCORD_USER_ID');
      expect(state.receiverConnected).toBe(false);
    });

    it('⚠️ a betöltés bukása NEM dob — a szöveges csatorna attól még él', async () => {
      const result = await startVoiceRecording({
        connection: {} as never,
        ownerUserId: OWNER_ID,
        ownerName: 'Itharen',
        channelId: 'voice-1',
        loadRecorder: (async (): Promise<never> => { throw new Error('nincs lefordítva'); }) as never,
      });

      expect(result.started).toBe(false);
      expect(result.detail).toContain('nincs lefordítva');
      expect(result.remedy).toContain('tsc-transplanted');
    });

    it('a hook lefutása után a kimenetel eljut a naplózóhoz', async () => {
      const { recorder } = makeRecorder();
      const { bridge } = makeBridge();
      const seen: RecordingHandled[] = [];

      await startVoiceRecording({
        connection: {} as never,
        ownerUserId: OWNER_ID,
        ownerName: 'Itharen',
        channelId: 'voice-1',
        bridge: bridge,
        loadRecorder: (async (): Promise<TransplantedRecorder> => recorder) as never,
        onHandled: (outcome: RecordingHandled): void => { seen.push(outcome); },
      });

      recorder.onWavFileReadyForProcessing?.({ userId: 'valaki-mas', filename: 'x.wav' });
      await new Promise((resolve): void => { setTimeout(resolve, 10); });

      expect(seen.length).toBe(1);
      expect(seen[0]!.fromOwner).toBe(false);
    });
  });
});

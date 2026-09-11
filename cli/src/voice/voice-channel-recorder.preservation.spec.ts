// 🎙️ A MEGŐRZÉS TESZTJEI — a hang nem veszhet el.
//
// > **Owner, 2026-09-11 01:57 (hang):** *„megint ment át egy nagy adag beszédem… biztosítani
// > kéne azt, hogy **elmenthessem a hangüzeneteimet**… ne kelljen újra elmondanom, mert **nem
// > mindig tudom ugyanúgy**."*
//
// ⭐ MIÉRT KÜLÖN FÁJL: a `voice-channel-recorder.spec.ts` ezzel együtt **546 sor** lett, a
// `max-file-lines` felső határa viszont 500. ⛔ A szabályt nem kapcsoljuk ki — a fájlt bontjuk,
// pontosan ahogy a review tanácsolja. ⚠️ A megőrzés amúgy is **önálló szerződés**: a felvevő
// dolga a felismerés, ennek a dolga az, hogy a forrás **utána is meglegyen**.
//
// 🔴 A MÉRT VESZTESÉG, amiért ezek a tesztek léteznek:
// `ma comm voice-funnel --day 2026-09-11` ⇒ **62,5% átvitel** 24 megszólalásból, ebből
// *„felismerés után elveszett: 6"*.

import { handleFinishedRecording } from './voice-channel-recorder.js';
import { VoiceChannelBridge } from './voice-channel-bridge.js';
import type { transcribeAudio } from '../stt/stt.client.js';
import type { SttResult } from '../stt/stt.models.js';

const OWNER_ID: string = 'owner-1';

/**
 * Hamis híd: megjegyzi, mit adtunk át neki.
 *
 * ⭐ VALÓDI példány + `spyOn` — ⛔ **nem** `as unknown as` átcímkézés. A konstruktor lusta
 * *(a tár és a küldő is alapértelmezett paraméter)*, tehát a példányosítás nem nyúl semmihez;
 * a kém pedig **típushelyesen** cseréli le az egyetlen metódust, amit a felvevő használ.
 */
function makeBridge(): {
  bridge: VoiceChannelBridge;
  calls: { transcript: string; messageId: string; speakerId: string }[];
} {
  const calls: { transcript: string; messageId: string; speakerId: string }[] = [];
  const bridge: VoiceChannelBridge = new VoiceChannelBridge();

  spyOn(bridge, 'handleOwnerSpeech').and.callFake(async (p: {
    transcript: string; messageId: string; speakerId: string;
  }): Promise<{ queued: boolean; mirrored: boolean; detail: string }> => {
    calls.push({ transcript: p.transcript, messageId: p.messageId, speakerId: p.speakerId });

    return { queued: true, mirrored: true, detail: 'Kötegbe téve.' };
  });

  return { bridge: bridge, calls: calls };
}

/**
 * Hamis felismerő.
 *
 * ⭐ A VISSZATÉRÉSI TÍPUS A VALÓDI SZERZŐDÉS *(`typeof transcribeAudio`)* — ⛔ így egyetlen
 * `as` átcímkézés sem kell. ⚠️ Ez nem kozmetika: átcímkézve a fordító **nem szólna**, ha a
 * felismerő felülete elmozdulna, és a teszt zöld maradna egy nem létező szerződésre.
 */
function makeStt(overrides: Partial<SttResult> = {}): typeof transcribeAudio {
  return async (): Promise<SttResult> => ({
    ok: true,
    text: 'Szia Honnie, nézd meg a naptáram.',
    detail: 'Felismerve.',
    elapsedMs: 900,
    suspicious: false,
    ...overrides,
  });
}

/**
 * Hamis fájl-olvasó.
 *
 * ⚠️ A `readFile` **túlterhelt** *(a visszatérése az `options`-tól függ)*, ezért a teljes
 * `typeof readFile`-t egy nyíl-függvény nem tudja kielégíteni. ⭐ Ehelyett a felvevő által
 * **tényleg használt** szűkebb alakot deklaráljuk — ⛔ így sincs `as` átcímkézés.
 */
const READ_OK: (path: string) => Promise<Buffer> = async (): Promise<Buffer> =>
  Buffer.from([1, 2, 3, 4]);

const BASE = {
  userId: OWNER_ID,
  filename: 'C:/rec/recording-owner-1-2026-09-07.wav',
  ownerUserId: OWNER_ID,
  ownerName: 'Itharen',
  channelId: 'voice-1',
};

  describe('🎙️ A MEGŐRZÉS — a hang nem veszhet el (owner, 2026-09-11 01:57)', () => {

    it('🔴 a hangot a FELISMERÉS ELŐTT teszi el — ⛔ nem kimenetel szerint utána', async () => {
      // ⭐ EZ A SORREND A LÉNYEG: így a MÉG NEM ISMERT hibafajták ellen is véd. Ha a
      // felismerés összeomlik vagy a folyamat meghal, a forrás akkor is a lemezen van.
      const order: string[] = [];
      const { bridge } = makeBridge();

      await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        archive: async (): Promise<boolean> => {
          order.push('archive');

          return true;
        },
        transcribe: async (input: Parameters<typeof transcribeAudio>[0]): Promise<SttResult> => {
          order.push('transcribe');

          return makeStt()(input);
        },
        read: READ_OK,
      });

      expect(order).toEqual(['archive', 'transcribe']);
    });

    it('🔴 a BIZONYTALAN ágon IS megőriz — itt veszett el a mért 6 megszólalás', async () => {
      // MÉRVE: `ma comm voice-funnel --day 2026-09-11` -> „felismerés után elveszett: 6".
      // A `onRecognitionFailed` ezen az ágon SZÁNDÉKOSAN nem hívódik (újrapróbálni értelmetlen),
      // ezért a hang korábban VÉGLEG elveszett. ⭐ A megőrzés viszont MINDEN ágon kell.
      const kept: string[] = [];
      const retried: string[] = [];
      const { bridge } = makeBridge();

      const outcome = await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        archive: async (info: { filename: string }): Promise<boolean> => {
          kept.push(info.filename);

          return true;
        },
        onRecognitionFailed: (info): void => void retried.push(info.filename),
        transcribe: makeStt({ suspicious: true, suspicionReason: 'gyanús tagolás' }),
        read: READ_OK,
      });

      expect(kept.length).toBe(1);
      // ⛔ VÁLTOZATLAN: a bizonytalant nem próbáljuk újra — ugyanazt a kétes eredményt adná.
      expect(retried).toEqual([]);
      expect(outcome.audioKept).toBeTrue();
    });

    it('⭐ AMIT ÉRTETTÜNK továbbmegy a kimenetelben — ⛔ de NEM a kötegbe', async () => {
      // Owner, 01:29: „jó lenne, ha kiírnánk azt is, hogy mit hallottál, vagy miért nem lett
      // biztos." ⇒ Így Ő dönti el, hogy jól hallottam-e.
      const { bridge, calls } = makeBridge();

      const outcome = await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        transcribe: makeStt({ suspicious: true, suspicionReason: 'nyelv-eltérés' }),
        read: READ_OK,
      });

      expect(outcome.heard).toBe('Szia Honnie, nézd meg a naptáram.');
      expect(outcome.reason).toBe('nyelv-eltérés');
      // 🔴 A HALLUCINÁCIÓ-ŐR VÁLTOZATLAN: a köteg üres marad.
      expect(calls).toEqual([]);
    });

    it('⚠️ ha a megőrzés BUKIK, a kimenetel ezt MEGMONDJA — ⛔ nem állít valótlant', async () => {
      // A hamis biztonság itt a legrosszabb: az owner azt hinné, van mihez visszatérni.
      const { bridge } = makeBridge();

      const outcome = await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        archive: async (): Promise<boolean> => false,
        transcribe: makeStt(),
        read: READ_OK,
      });

      expect(outcome.audioKept).toBeFalse();
    });

    it('⭐ a FÁJLNÉV visszajön a kimenetelben — enélkül a jegyzet nem párosítható', async () => {
      const { bridge } = makeBridge();

      const outcome = await handleFinishedRecording({
        ...BASE,
        bridge: bridge,
        transcribe: makeStt(),
        read: READ_OK,
      });

      expect(outcome.filename).toBe(BASE.filename);
    });

    it('⛔ IDEGEN beszélőnél nem őrzünk meg semmit — nem az owner mondata', async () => {
      // 🔒 Személyes adat: más hangját nem tesszük el.
      const kept: string[] = [];
      const { bridge } = makeBridge();

      await handleFinishedRecording({
        ...BASE,
        userId: 'valaki-mas',
        bridge: bridge,
        archive: async (info: { filename: string }): Promise<boolean> => {
          kept.push(info.filename);

          return true;
        },
        transcribe: async (): Promise<SttResult> => {
          throw new Error('nem szabad hívni');
        },
        read: READ_OK,
      });

      expect(kept).toEqual([]);
    });
  });

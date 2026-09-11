// A felismerő-hívás tesztjei — ⭐ a HOSSZÚ hang darabolásával.
//
// 🔴 AMIT EZEK A TESZTEK ŐRIZNEK, és miért pont ezt:
//   (a) **a rövid eset EGY hívás marad** — a nap 84 felvételéből 73 ilyen, és ott a mai,
//       élesben bizonyított út egy bájtot sem változhat;
//   (b) **a hosszú hang TÖBB hívásra bomlik**, és az átiratok **összefűzve** jönnek vissza —
//       mérve: 56,9 mp → 295 karakter egyben, **641** darabolva;
//   (c) 🔴 **egy elbukott darab NEM tűnhet el némán** — a hiányos szöveg ránézésre pontosan
//       úgy néz ki, mint egy teljes. **Ez az a hibaosztály, ami ezt a munkát kiváltotta.**
//
// ⭐ Hálózat nincs: a hívás **bemenetként** cserélhető *(szűk típus, ⛔ `as` átcímkézés nélkül)*.

import { transcribeAudio } from './stt.client.js';
import type { SttResult } from './stt.models.js';

const SAMPLE_RATE: number = 48_000;
const CHANNELS: number = 2;
const FRAME_BYTES: number = CHANNELS * 2;
const BYTES_PER_SECOND: number = SAMPLE_RATE * FRAME_BYTES;

/** Egy szabályos teszt-WAV a megadott hosszal, csend nélkül *(végig hangos)*. */
function makeWav(secs: number): Uint8Array {
  const pcmBytes: number = Math.round(secs * BYTES_PER_SECOND / FRAME_BYTES) * FRAME_BYTES;
  const out = new Uint8Array(44 + pcmBytes);
  const view = new DataView(out.buffer);
  const write = (offset: number, text: string): void => {
    for (let index: number = 0; index < text.length; index += 1) {
      out[offset + index] = text.charCodeAt(index);
    }
  };

  write(0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, CHANNELS, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, BYTES_PER_SECOND, true);
  view.setUint16(32, FRAME_BYTES, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, pcmBytes, true);

  for (let at: number = 44; at + 1 < out.byteLength; at += 2) {
    view.setInt16(at, 3000, true);
  }

  return out;
}

/** A felismerő utánzata — RÖGZÍTI a hívásokat, és sorban adja a válaszokat. */
function makeRecognizer(replies: ({ text: string } | { httpStatus: number })[]): {
  call: (url: string, init: {
    method: string;
    headers: Record<string, string>;
    body: ArrayBuffer;
    signal: AbortSignal;
  }) => Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
    text: () => Promise<string>;
  }>;
  filenames: string[];
  bodySizes: number[];
} {
  const filenames: string[] = [];
  const bodySizes: number[] = [];

  return {
    filenames: filenames,
    bodySizes: bodySizes,
    call: async (_url: string, init: {
      method: string;
      headers: Record<string, string>;
      body: ArrayBuffer;
      signal: AbortSignal;
    }) => {
      const index: number = filenames.length;

      filenames.push(init.headers['Filename'] ?? '');
      bodySizes.push(init.body.byteLength);

      const reply = replies[Math.min(index, replies.length - 1)] ?? { text: '' };

      if ('httpStatus' in reply) {
        return {
          ok: false,
          status: reply.httpStatus,
          json: async (): Promise<unknown> => ({}),
          text: async (): Promise<string> => 'a szolgáltatás hibája',
        };
      }

      return {
        ok: true,
        status: 200,
        json: async (): Promise<unknown> => ({ status: 'ok', result: { text: reply.text } }),
        text: async (): Promise<string> => '',
      };
    },
  };
}

describe('| transcribeAudio — a RÖVID eset VÁLTOZATLAN', () => {

  it('az ablak alatti hangnál PONTOSAN egy hívás megy ki', async () => {
    const recognizer = makeRecognizer([{ text: 'Ez egy rövid mondat.' }]);
    const result: SttResult = await transcribeAudio({
      audio: makeWav(10),
      filename: 'rovid.wav',
      contentType: 'audio/wav',
      fetchImpl: recognizer.call,
    });

    expect(recognizer.filenames).toEqual(['rovid.wav']);
    expect(result.ok).toBe(true);
    expect(result.text).toBe('Ez egy rövid mondat.');
    // ⭐ Nincs darabolás ⇒ nincs mit KIMONDANI róla.
    expect(result.segmentation).toBeUndefined();
  });

  it('NEM-WAV bemenetnél is egy hívás — ⛔ a darabolás nem szólhat bele', async () => {
    const recognizer = makeRecognizer([{ text: 'Ogg-ból is megy.' }]);
    const result: SttResult = await transcribeAudio({
      audio: new TextEncoder().encode('OggS ez nem wav, de hang'),
      filename: 'hang.ogg',
      contentType: 'audio/ogg',
      fetchImpl: recognizer.call,
    });

    expect(recognizer.filenames.length).toBe(1);
    expect(result.text).toBe('Ogg-ból is megy.');
    expect(result.segmentation).toBeUndefined();
  });

  it('HTTP-hibánál `ok: false`, és a teendő is megjelenik', async () => {
    const recognizer = makeRecognizer([{ httpStatus: 500 }]);
    const result: SttResult = await transcribeAudio({
      audio: makeWav(5),
      filename: 'rovid.wav',
      fetchImpl: recognizer.call,
    });

    expect(result.ok).toBe(false);
    expect(result.text).toBe('');
    expect(result.suspicious).toBe(true);
    expect(result.remedy ?? '').toContain('api/health');
  });
});

describe('| transcribeAudio — a HOSSZÚ hang darabolása', () => {

  it('🔴 a 70 mp-es hangot TÖBB hívásra bontja, és az átiratokat ÖSSZEFŰZI', async () => {
    const recognizer = makeRecognizer([
      { text: 'Első rész.' },
      { text: 'Második rész.' },
      { text: 'Harmadik rész.' },
    ]);
    const result: SttResult = await transcribeAudio({
      audio: makeWav(70),
      filename: 'hosszu.wav',
      contentType: 'audio/wav',
      fetchImpl: recognizer.call,
    });

    expect(recognizer.filenames.length).toBe(3);
    expect(result.ok).toBe(true);
    expect(result.text).toBe('Első rész. Második rész. Harmadik rész.');
    expect(result.segmentation?.parts).toBe(3);
    expect(result.segmentation?.failedParts).toBe(0);
  });

  it('EGYETLEN kiküldött darab sem lépi túl a MÉRT 30 mp-es ablakot', async () => {
    const recognizer = makeRecognizer([{ text: 'x' }]);

    await transcribeAudio({
      audio: makeWav(70),
      filename: 'hosszu.wav',
      fetchImpl: recognizer.call,
    });

    for (const size of recognizer.bodySizes) {
      // ⚠️ A fejléc 44 bájt — az adat ennyivel kevesebb.
      expect((size - 44) / BYTES_PER_SECOND).toBeLessThanOrEqual(30);
    }
  });

  it('a darabok KÜLÖN nevet kapnak — ⛔ három azonos kérés nem nyomozható', async () => {
    const recognizer = makeRecognizer([{ text: 'x' }]);

    await transcribeAudio({
      audio: makeWav(70),
      filename: 'hosszu.wav',
      fetchImpl: recognizer.call,
    });

    expect(recognizer.filenames).toEqual([
      'hosszu.wav.part1.wav',
      'hosszu.wav.part2.wav',
      'hosszu.wav.part3.wav',
    ]);
  });

  it('a darabolást a `detail` is KIMONDJA — a naplóban is látszik', async () => {
    const recognizer = makeRecognizer([{ text: 'szöveg' }]);
    const result: SttResult = await transcribeAudio({
      audio: makeWav(70),
      filename: 'hosszu.wav',
      fetchImpl: recognizer.call,
    });

    expect(result.detail).toContain('3 részletben');
    expect(result.detail).toContain('30');
  });

  it('a VÉGIG hangos hangnál jelzi, hogy beszéd közben kellett vágni', async () => {
    const recognizer = makeRecognizer([{ text: 'szöveg' }]);
    const result: SttResult = await transcribeAudio({
      audio: makeWav(70),
      filename: 'hosszu.wav',
      fetchImpl: recognizer.call,
    });

    expect(result.segmentation?.midSpeechCuts).toBeGreaterThan(0);
  });

  it('az ÜRES darab-átirat nem hagy dupla szóközt az összefűzésben', async () => {
    const recognizer = makeRecognizer([
      { text: 'Első.' },
      { text: '   ' },
      { text: 'Harmadik.' },
    ]);
    const result: SttResult = await transcribeAudio({
      audio: makeWav(70),
      filename: 'hosszu.wav',
      fetchImpl: recognizer.call,
    });

    expect(result.text).toBe('Első. Harmadik.');
  });
});

describe('| transcribeAudio — 🔴 az ELBUKOTT darab NEM lehet néma', () => {

  it('🔴 ha EGY darab elbukik, a szöveg megjön, DE gyanúsként és MEGNEVEZVE', async () => {
    const recognizer = makeRecognizer([
      { text: 'Első rész.' },
      { httpStatus: 500 },
      { text: 'Harmadik rész.' },
    ]);
    const result: SttResult = await transcribeAudio({
      audio: makeWav(70),
      filename: 'hosszu.wav',
      fetchImpl: recognizer.call,
    });

    // ⭐ A MEGLÉVŐ SZÖVEG NEM DOBÓDIK EL: 2/3 többet ér, mint a semmi.
    expect(result.text).toBe('Első rész. Harmadik rész.');
    expect(result.ok).toBe(true);
    // 🔴 DE KIMONDVA HIÁNYOS — ⛔ ez a sor a néma csonkolás elleni védelem.
    expect(result.suspicious).toBe(true);
    expect(result.suspicionReason ?? '').toContain('HIÁNYOS');
    expect(result.segmentation?.failedParts).toBe(1);
    expect(result.segmentation?.parts).toBe(3);
  });

  it('ha MINDEN darab elbukik, az NEM részleges eredmény, hanem BUKÁS', async () => {
    const recognizer = makeRecognizer([{ httpStatus: 503 }]);
    const result: SttResult = await transcribeAudio({
      audio: makeWav(70),
      filename: 'hosszu.wav',
      fetchImpl: recognizer.call,
    });

    expect(result.ok).toBe(false);
    expect(result.text).toBe('');
    expect(result.suspicious).toBe(true);
    expect(result.segmentation?.failedParts).toBe(3);
  });

  it('a hosszt a HANGBÓL méri, ha a hívó nem adta meg — így bukik le a csonka átirat', async () => {
    // ⚠️ 70 mp hangból 5 karakter: a MÉRT arány-szabály ezt gyanúsnak jelöli. Enélkül (hossz
    // nélkül) átcsúszna — pontosan úgy, ahogy a „9 mp → Köszönöm" eset 2026-09-07-én.
    const recognizer = makeRecognizer([{ text: 'Igen.' }, { text: '' }, { text: '' }]);
    const result: SttResult = await transcribeAudio({
      audio: makeWav(70),
      filename: 'hosszu.wav',
      fetchImpl: recognizer.call,
    });

    expect(result.suspicious).toBe(true);
    expect(result.suspicionReason ?? '').toContain('karakter/mp');
  });
});

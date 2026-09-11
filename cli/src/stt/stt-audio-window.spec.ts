// A hosszú hang darabolásának tesztjei.
//
// 🔴 A NÉGY ÁLLÍTÁS, amiért ez a fájl létezik — mindegyik egy MÉRT hibából:
//   (a) **semmi nem veszhet el** — a darabok PCM-je összefűzve BÁJTRA az eredeti. Ez a lényeg:
//       a 30 mp-es ablak miatt eddig a hang **60%-a** is elveszhetett *(56,9 mp → 295 karakter,
//       felezve 627)*;
//   (b) **semmi nem duplázódhat** — a darabok hézag és átfedés nélkül követik egymást;
//   (c) **a rövid eset VÁLTOZATLAN** — a nap 84 felvételéből 73 az ablak alatt van, ott a mai,
//       élesben bizonyított út egy bájtot sem változhat;
//   (d) **a fejléc HAZUDIK** — a felvevő minden fájlon 22 369,6 mp-et állít, ezért a hosszt a
//       fájlméretből számoljuk. ⛔ Ha ezt elhinnénk, képzelt hanggal dolgoznánk.

import { SttAudioWindow_Util } from './stt-audio-window.js';

const SAMPLE_RATE: number = 48_000;
const CHANNELS: number = 2;
const FRAME_BYTES: number = CHANNELS * 2;
const BYTES_PER_SECOND: number = SAMPLE_RATE * FRAME_BYTES;

/**
 * Egy WAV teszt-fájl.
 *
 * @param declaredDataBytes ha meg van adva, EZ kerül a fejléc adat-hossz mezőjébe — így
 *   utánozható a felvevő **hibás** fejléce *(22 369,6 mp)*.
 */
function makeWav(pcm: Uint8Array, declaredDataBytes?: number): Uint8Array {
  const out = new Uint8Array(44 + pcm.byteLength);
  const view = new DataView(out.buffer);
  const write = (offset: number, text: string): void => {
    for (let index: number = 0; index < text.length; index += 1) {
      out[offset + index] = text.charCodeAt(index);
    }
  };

  write(0, 'RIFF');
  view.setUint32(4, 36 + pcm.byteLength, true);
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
  view.setUint32(40, declaredDataBytes ?? pcm.byteLength, true);
  out.set(pcm, 44);

  return out;
}

/** Hangos PCM — minden minta a megadott amplitúdó. */
function makePcm(secs: number, amplitude: number): Uint8Array {
  const bytes: number = Math.round(secs * BYTES_PER_SECOND / FRAME_BYTES) * FRAME_BYTES;
  const pcm = new Uint8Array(bytes);
  const view = new DataView(pcm.buffer);

  for (let at: number = 0; at + 1 < bytes; at += 2) {
    view.setInt16(at, amplitude, true);
  }

  return pcm;
}

/** Két PCM-szakasz egymás után. */
function concat(parts: Uint8Array[]): Uint8Array {
  const total: number = parts.reduce((sum: number, part: Uint8Array): number => sum + part.byteLength, 0);
  const out = new Uint8Array(total);
  let at: number = 0;

  for (const part of parts) {
    out.set(part, at);
    at += part.byteLength;
  }

  return out;
}

describe('| SttAudioWindow_Util.describe', () => {

  it('a mért felépítést adja vissza egy szabályos WAV-ról', () => {
    const layout = SttAudioWindow_Util.describe(makeWav(makePcm(1, 3000)));

    expect(layout?.sampleRate).toBe(48_000);
    expect(layout?.channels).toBe(2);
    expect(layout?.bitsPerSample).toBe(16);
    expect(layout?.bytesPerSecond).toBe(192_000);
    expect(layout?.dataOffset).toBe(44);
  });

  it('⛔ NEM WAV bemenetre `null` — ⚠️ ez nem hiba, hanem „egyben dolgozd fel"', () => {
    expect(SttAudioWindow_Util.describe(new Uint8Array(0))).toBeNull();
    expect(SttAudioWindow_Util.describe(new Uint8Array(100))).toBeNull();
    expect(SttAudioWindow_Util.describe(new TextEncoder().encode('OggS ez nem wav'))).toBeNull();
  });

  it('🔴 a HAZUG adat-hosszt FIGYELMEN KÍVÜL hagyja — a hossz a fájlméretből jön', () => {
    // ⚠️ Pontosan a felvevő fejléce: 22 369,6 mp-et állít 2 mp hanghoz.
    const wav: Uint8Array = makeWav(makePcm(2, 3000), 0xFFFFFFFF);
    const secs: number | null = SttAudioWindow_Util.durationSecs(wav);

    expect(secs).not.toBeNull();
    expect(Math.round(secs ?? 0)).toBe(2);
  });

  it('a `fmt ` és a `data` közé beszúrt idegen blokkot átlépi', () => {
    const pcm: Uint8Array = makePcm(1, 3000);
    const base: Uint8Array = makeWav(pcm);
    // Egy 10 bájtos `LIST` blokk a `data` elé.
    const extra = new Uint8Array(18);
    const view = new DataView(extra.buffer);

    for (let index: number = 0; index < 4; index += 1) extra[index] = 'LIST'.charCodeAt(index);

    view.setUint32(4, 10, true);

    const out = new Uint8Array(base.byteLength + extra.byteLength);

    out.set(base.subarray(0, 36), 0);
    out.set(extra, 36);
    out.set(base.subarray(36), 36 + extra.byteLength);

    const layout = SttAudioWindow_Util.describe(out);

    expect(layout).not.toBeNull();
    expect(layout?.dataOffset).toBe(36 + extra.byteLength + 8);
  });
});

describe('| SttAudioWindow_Util.split — a rövid eset VÁLTOZATLAN', () => {

  it('⛔ nem-WAV bemenetnél ÜRES listát ad — a hívó egyben dolgozza fel', () => {
    expect(SttAudioWindow_Util.split(new TextEncoder().encode('OggS'))).toEqual([]);
  });

  it('🔴 az ablak alatti hangnál PONTOSAN a bemenetet adja vissza — ⛔ nem újracsomagolva', () => {
    const wav: Uint8Array = makeWav(makePcm(10, 3000));
    const chunks = SttAudioWindow_Util.split(wav);

    expect(chunks.length).toBe(1);
    // ⭐ UGYANAZ AZ OBJEKTUM: garantáltan bájtra a mai út.
    expect(chunks[0]?.audio).toBe(wav);
    expect(chunks[0]?.cutMidSpeech).toBe(false);
  });

  it('pontosan a 30 mp-es határon MÉG egy darab', () => {
    const chunks = SttAudioWindow_Util.split(makeWav(makePcm(30, 3000)));

    expect(chunks.length).toBe(1);
  });

  it('üres adat-szakasznál ÜRES listát ad — ⛔ nem hoz létre üres darabot', () => {
    expect(SttAudioWindow_Util.split(makeWav(new Uint8Array(0)))).toEqual([]);
  });
});

describe('| SttAudioWindow_Util.split — a hosszú eset', () => {

  it('🔴 a darabok PCM-je összefűzve BÁJTRA az eredeti — semmi nem veszik el', () => {
    const pcm: Uint8Array = makePcm(70, 3000);
    const chunks = SttAudioWindow_Util.split(makeWav(pcm));
    const rebuilt: Uint8Array = concat(chunks.map(
      (chunk): Uint8Array => chunk.audio.subarray(44),
    ));

    expect(rebuilt.byteLength).toBe(pcm.byteLength);
    expect(Array.from(rebuilt.subarray(0, 64))).toEqual(Array.from(pcm.subarray(0, 64)));
    expect(Array.from(rebuilt.subarray(rebuilt.byteLength - 64)))
      .toEqual(Array.from(pcm.subarray(pcm.byteLength - 64)));
  });

  it('🔴 a darabok HÉZAG és ÁTFEDÉS nélkül követik egymást', () => {
    const chunks = SttAudioWindow_Util.split(makeWav(makePcm(70, 3000)));

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.startSecs).toBe(0);

    for (let index: number = 1; index < chunks.length; index += 1) {
      // ⚠️ Az előző vége = a következő kezdete. ⛔ Átfedésnél szó duplázódna, hézagnál eltűnne.
      expect(chunks[index]?.startSecs).toBe(chunks[index - 1]?.endSecs);
    }
  });

  it('EGYETLEN darab sem lépi túl a MÉRT 30 mp-es ablakot', () => {
    for (const secs of [35, 57, 70, 121]) {
      const chunks = SttAudioWindow_Util.split(makeWav(makePcm(secs, 3000)));

      for (const chunk of chunks) {
        expect(chunk.endSecs - chunk.startSecs)
          .toBeLessThanOrEqual(SttAudioWindow_Util.RECOGNIZER_WINDOW_SECS);
      }
    }
  });

  it('a mért 56,9 mp-es esetnél TÖBB darab lesz — ez a javítás lényege', () => {
    const chunks = SttAudioWindow_Util.split(makeWav(makePcm(56.9, 3000)));

    expect(chunks.length).toBe(3);
  });

  it('minden darab ÉRVÉNYES WAV, HELYES adat-hosszal', () => {
    const chunks = SttAudioWindow_Util.split(makeWav(makePcm(70, 3000)));

    for (const chunk of chunks) {
      const layout = SttAudioWindow_Util.describe(chunk.audio);

      expect(layout).not.toBeNull();
      expect(layout?.sampleRate).toBe(48_000);

      const view = new DataView(chunk.audio.buffer, chunk.audio.byteOffset, chunk.audio.byteLength);

      // ⭐ A HELYES hossz — szemben a felvevő 22 369 mp-es állításával.
      expect(view.getUint32(40, true)).toBe(chunk.audio.byteLength - 44);
    }
  });

  it('a vágások MINTAKERET-határra esnek — ⛔ fél minta zörejt adna', () => {
    const chunks = SttAudioWindow_Util.split(makeWav(makePcm(70, 3000)));

    for (const chunk of chunks) {
      expect((chunk.audio.byteLength - 44) % FRAME_BYTES).toBe(0);
    }
  });
});

describe('| SttAudioWindow_Util.split — a vágás HELYE', () => {

  it('⭐ CSENDNÉL vág, ha van csend a határ előtti sávban', () => {
    // Hangos 0-25 mp · CSEND 25-26 mp · hangos 26-60 mp.
    const audio: Uint8Array = makeWav(concat([
      makePcm(25, 3000),
      makePcm(1, 0),
      makePcm(34, 3000),
    ]));
    const chunks = SttAudioWindow_Util.split(audio);
    const firstCut: number = chunks[0]?.endSecs ?? 0;

    // A csend 25-26 mp között van, a vágásnak oda kell esnie.
    expect(firstCut).toBeGreaterThanOrEqual(25);
    expect(firstCut).toBeLessThanOrEqual(26);
    // ⭐ ÉS EZT KI IS MONDJA: a vágás nem beszéd közben esett.
    expect(chunks[0]?.cutMidSpeech).toBe(false);
  });

  it('🔴 VÉGIG hangos hangnál KIMONDJA, hogy beszéd közben vágott', () => {
    const chunks = SttAudioWindow_Util.split(makeWav(makePcm(60, 3000)));

    // ⚠️ Nincs hova vágni ⇒ a határon vágunk, DE a jelzés megy vele.
    // ⛔ A jelzés elhagyása lenne a néma csonkolás.
    expect(chunks[0]?.cutMidSpeech).toBe(true);
    expect(Math.round(chunks[0]?.endSecs ?? 0)).toBe(SttAudioWindow_Util.CHUNK_SECS);
  });

  it('az UTOLSÓ darab vágása SOHA nem „beszéd közbeni" — ott nincs vágás', () => {
    const chunks = SttAudioWindow_Util.split(makeWav(makePcm(60, 3000)));
    const last = chunks[chunks.length - 1];

    expect(last?.cutMidSpeech).toBe(false);
    expect(Math.round(last?.endSecs ?? 0)).toBe(60);
  });

  it('a mért csend-küszöb alatti halk szakaszt is szóköznek veszi', () => {
    // ⚠️ A küszöb 200; a mért eloszlásban a beszéd p25-e 504. A 150 tehát szünet.
    const audio: Uint8Array = makeWav(concat([
      makePcm(26, 3000),
      makePcm(0.5, 150),
      makePcm(20, 3000),
    ]));
    const chunks = SttAudioWindow_Util.split(audio);

    expect(chunks[0]?.cutMidSpeech).toBe(false);
  });

  it('a MÉRT állandók nem csúszhatnak el némán', () => {
    // 🔴 Ezek MÉRT értékek (2026-09-11), nem hangolható paraméterek. Ha valaki átírja őket,
    // itt bukjon el — és a mérést kelljen megismételni, ⛔ nem a tesztet átírni.
    expect(SttAudioWindow_Util.RECOGNIZER_WINDOW_SECS).toBe(30);
    expect(SttAudioWindow_Util.CHUNK_SECS).toBe(28);
    expect(SttAudioWindow_Util.CUT_SEARCH_SECS).toBe(5);
    expect(SttAudioWindow_Util.QUIET_ENERGY).toBe(200);
    expect(SttAudioWindow_Util.FRAME_MS).toBe(100);
  });
});

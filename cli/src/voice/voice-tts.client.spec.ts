// Az ElevenLabs **V3** kliens tesztjei.
//
// 🔴 MIÉRT LÉTEZIK EZ A MODUL: az átemelt réteg **soha nem szólalt meg**. A
// `el.api-service.ts:91-94` a kulcsot `xi-api-` prefixhez kötötte, az owner kulcsa viszont
// `sk_`-val kezdődik ⇒ minden hívás `'Service not initialized'`-del tért vissza.
//
// ⭐ A LEGFONTOSABB ÁLLÍTÁSOK ITT:
//   (a) 🔒 **a kulcs ÉRTÉKE soha nem jelenik meg** semmilyen kimenetben — sem a leírásban,
//       sem a hiba-részletben. Ez az átemelt kód mért hibája volt: a kulcs bekerült a
//       szerver naplójába;
//   (b) az alapértelmezett modell a **kért V3**;
//   (c) a hiányzó bemenetek **leíró** bukást adnak, ⛔ nem kivételt — a felolvasás kísérő
//       funkció, nem viheti magával az üzenet-kézbesítést.

import { VoiceTts_Client } from './voice-tts.client.js';

/** Egy valósághű kulcs-alak — ⚠️ NEM az owner kulcsa, csak ugyanolyan formájú. */
const SAMPLE_KEY: string = 'sk_0123456789abcdef0123456789abcdef0123456789abcdef';

describe('VoiceTts_Client.describeKey — 🔒 a kulcs ÉRTÉKE sosem szivárog', () => {

  it('🔴 a leírás NEM tartalmazza a kulcsot', () => {
    // Ez az átemelt kód MÉRT hibája: `DyFM_Log.error('… not initialized', apiKey)` — a teljes
    // kulcs bekerült a szerver naplójába. A diagnosztika és a szivárgás határa ez a függvény.
    const described: string = VoiceTts_Client.describeKey(SAMPLE_KEY);

    expect(described).not.toContain(SAMPLE_KEY);
    expect(described).not.toContain('0123456789');
  });

  it('⭐ de a DIAGNÓZISHOZ eleget mond: hossz + prefix', () => {
    const described: string = VoiceTts_Client.describeKey(SAMPLE_KEY);

    expect(described).toContain(String(SAMPLE_KEY.length));
    // A prefix családja („sk_" vs. a régi „xi-") pont az, amitől a régi kód elhasalt.
    expect(described).toContain('sk_');
  });

  it('a hiányzó kulcsot megnevezi — ⛔ nem tesz úgy, mintha rendben lenne', () => {
    expect(VoiceTts_Client.describeKey('')).toBe('nincs beállítva');
    expect(VoiceTts_Client.describeKey('   ')).toBe('nincs beállítva');
  });

  it('⚠️ a HÁROM karakternél nem ad többet — egy rövid kulcs sem szivároghat ki', () => {
    expect(VoiceTts_Client.describeKey('sk_abcd')).toBe('hossz 7, prefix "sk_"');
  });
});

describe('VoiceTts_Client.resolveModelId', () => {

  it('⭐ alapból a KÉRT V3', () => {
    // Owner-korrekció (2026-09-10 21:46): „nem a V3 lett leimplementálva, hanem a régi Fors."
    expect(VoiceTts_Client.resolveModelId(undefined)).toBe('eleven_v3');
    expect(VoiceTts_Client.DEFAULT_MODEL_ID).toBe('eleven_v3');
  });

  it('a felülírás érvényesül — mérve a V3 kétszer lassabb (3543 ms vs. 1680 ms)', () => {
    expect(VoiceTts_Client.resolveModelId('eleven_multilingual_v2')).toBe('eleven_multilingual_v2');
  });

  it('⚠️ az ÜRES felülírás nem üti ki az alapértéket', () => {
    // Egy üresen hagyott env-változó ne jelentse azt, hogy „nincs modell".
    expect(VoiceTts_Client.resolveModelId('')).toBe('eleven_v3');
    expect(VoiceTts_Client.resolveModelId('   ')).toBe('eleven_v3');
  });
});

describe('VoiceTts_Client.synthesize — a bemenet-ellenőrzés', () => {

  it('⛔ hálózat NÉLKÜL utasítja el az üres szöveget', async (): Promise<void> => {
    const result = await VoiceTts_Client.synthesize({
      text: '   ',
      voiceId: 'v',
      apiKey: SAMPLE_KEY,
    });

    expect(result.ok).toBeFalse();
    expect(result.detail).toContain('Nincs kimondható szöveg');
  });

  it('🔒 a HIÁNYZÓ kulcsnál a hiba a hiányról szól — az értékről semmit', async (): Promise<void> => {
    const result = await VoiceTts_Client.synthesize({ text: 'Szia.', voiceId: 'v', apiKey: '' });

    expect(result.ok).toBeFalse();
    expect(result.detail).toContain('FDP_ELEVENLABS_API_KEY');
  });

  it('a hiányzó hang-azonosítót megnevezi — ⛔ nem küld üres kérést', async (): Promise<void> => {
    const result = await VoiceTts_Client.synthesize({
      text: 'Szia.',
      voiceId: '  ',
      apiKey: SAMPLE_KEY,
    });

    expect(result.ok).toBeFalse();
    expect(result.detail).toContain('MA_ELEVENLABS_VOICE_ID');
  });

  it('⛔ egyik ellenőrzés sem DOB — mindegyik leíró eredményt ad', async (): Promise<void> => {
    // A felolvasás kísérő funkció: egy kivétel innen megbuktatná az üzenet-kézbesítést.
    for (const input of [
      { text: '', voiceId: 'v', apiKey: SAMPLE_KEY },
      { text: 'x', voiceId: '', apiKey: SAMPLE_KEY },
      { text: 'x', voiceId: 'v', apiKey: '' },
    ]) {
      await expectAsync(VoiceTts_Client.synthesize(input)).toBeResolved();
    }
  });
});

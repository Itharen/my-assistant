// A nyitott-mikrofon gyanú tesztjei.
//
// 🔴 A MÉRT ALAP (2026-09-12): a napi akció-naplókból kiszámolva, hány eldobott megszólalás jut
// egy 10 perces ablakra:
//
// ```
// NORMÁL ablakok (09-08 … 09-11):  1 · 2 · 3 · 3 · 3 · 3 · 4 · 4     ⟵ max 4
// A BULI ablakai (09-12 01:20-01:59):  66 · 84 · 63 · 42             ⟵ min 42
// ```
//
// ⇒ A két halmaz között **10× üres sáv** van. A 12-es küszöb ebbe esik — ⛔ nem riad egy
// szokásos estére, és ⛔ nem hallgat egy bulira.

import { VoiceNoiseBurst_Util } from './voice-noise-burst.js';

const START: Date = new Date('2026-09-12T01:20:00+02:00');

/** `count` darab zaj-tétel, `spreadMinutes` perc alatt egyenletesen elosztva. */
function samples(count: number, spreadMinutes: number): Date[] {
  if (count <= 1) return count === 1 ? [START] : [];

  const stepMs: number = (spreadMinutes * 60_000) / (count - 1);

  return Array.from({ length: count }, (_unused: unknown, index: number): Date =>
    new Date(START.getTime() + index * stepMs));
}

describe('| VoiceNoiseBurst_Util.evaluate — 🎤 nyitott mikrofon gyanúja', () => {

  it('⛔ zaj-tétel NÉLKÜL nincs gyanú — és ezt kimondja', () => {
    const verdict = VoiceNoiseBurst_Util.evaluate({ timestamps: [] });

    expect(verdict.isBurst).toBeFalse();
    expect(verdict.peakCount).toBe(0);
    expect(verdict.reason).toContain('nincs alapja');
  });

  it('⛔ a MÉRT NORMÁL csúcs (4 tétel / 10 perc) NEM gyanús', () => {
    expect(VoiceNoiseBurst_Util.evaluate({ timestamps: samples(4, 10) }).isBurst).toBeFalse();
  });

  it('🔴 a MÉRT BULI-sűrűség (42 tétel / 10 perc) GYANÚS', () => {
    const verdict = VoiceNoiseBurst_Util.evaluate({ timestamps: samples(42, 10) });

    expect(verdict.isBurst).toBeTrue();
    expect(verdict.peakCount).toBe(42);
  });

  it('pontosan a küszöbön (12) MÁR gyanús', () => {
    expect(VoiceNoiseBurst_Util.evaluate({ timestamps: samples(12, 9) }).isBurst).toBeTrue();
  });

  it('a küszöb alatt (11) MÉG nem', () => {
    expect(VoiceNoiseBurst_Util.evaluate({ timestamps: samples(11, 9) }).isBurst).toBeFalse();
  });

  it('🔴 EGY NAPRA SZÓRVA ugyanannyi tétel NEM gyanús — a sűrűség dönt, ⛔ nem a darabszám', () => {
    // ⚠️ Ez a lényeg: 40 zaj egy egész nap alatt szokásos háttér; 40 tíz perc alatt nyitott
    // mikrofon. A puszta napi darabszám a kettőt ⛔ nem tudná szétválasztani.
    expect(VoiceNoiseBurst_Util.evaluate({ timestamps: samples(40, 24 * 60) }).isBurst).toBeFalse();
  });

  it('⭐ a CSÚSZÓ ablak az óra-határon átnyúló özönt is megfogja', () => {
    // ⚠️ Fix negyed-órás ablakokkal ez kettévágódna, és mindkét fele a küszöb alatt maradna.
    const around: Date[] = [
      ...samples(7, 4),
      ...Array.from({ length: 7 }, (_u: unknown, index: number): Date =>
        new Date(START.getTime() + (5 + index * 0.5) * 60_000)),
    ];

    expect(VoiceNoiseBurst_Util.evaluate({ timestamps: around }).isBurst).toBeTrue();
  });

  it('az érvénytelen időbélyeget kihagyja — ⛔ nem dob és ⛔ nem számolja bele', () => {
    const withBad: Date[] = [...samples(3, 5), new Date('nem-datum')];
    const verdict = VoiceNoiseBurst_Util.evaluate({ timestamps: withBad });

    expect(verdict.peakCount).toBe(3);
  });

  it('⭐ az INDOKLÁS megmondja a számot, az ablakot és a teendőt', () => {
    const verdict = VoiceNoiseBurst_Util.evaluate({ timestamps: samples(30, 8) });

    expect(verdict.reason).toContain('NYITOTT MIKROFON');
    expect(verdict.reason).toContain('30');
    expect(verdict.reason).toContain('küszöb');
    expect(verdict.reason).toContain('zárja a mikrofont');
  });

  it('a MÉRT állandók nem csúszhatnak el némán', () => {
    expect(VoiceNoiseBurst_Util.WINDOW_MINUTES).toBe(10);
    expect(VoiceNoiseBurst_Util.BURST_THRESHOLD).toBe(12);
  });
});

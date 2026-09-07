// A konzol-sor tesztjei.
//
// A tiszta `composePulseLine` fölött mérünk: a sornak ÁRULKODNIA kell — egy pillantásra ki
// kell derülnie, hogy valami nem stimmel. Ezért a hiba-ágakra legalább annyi teszt jut,
// mint a boldog útra.

import { composePulseLine, formatAge, SystemPulseSnapshot } from './system-pulse.service.js';

const now: Date = new Date('2026-09-07T09:20:00+02:00');

function healthy(overrides: Partial<SystemPulseSnapshot> = {}): SystemPulseSnapshot {
  return {
    now,
    uptimeMs: 2 * 3_600_000 + 55 * 60_000,
    discord: { state: 'alive', ageMs: 45_000, botTag: 'Honnie#6234', processedCount: 3 },
    presence: { state: 'alive', ageMs: 30_000, idleState: 'active' },
    pendingInbound: 0,
    sttRetryPending: 0,
    lastOutboundAgeMs: 8 * 60_000,
    ...overrides,
  };
}

describe('composePulseLine', () => {

  it('🎙️ KIÍRJA, ha hang vár újrapróbálásra — ez pontosan az az állapot, ami némán veszít', () => {
    expect(composePulseLine(healthy({ sttRetryPending: 2 }))).toContain('2 hang újrapróbálásra vár');
  });

  it('nullánál NEM foglal helyet — a nulla nem hír', () => {
    expect(composePulseLine(healthy())).not.toContain('újrapróbálásra');
  });

  it('egyetlen sor — a konzolon ez a lényeg', () => {
    expect(composePulseLine(healthy())).not.toContain('\n');
  });

  it('kiírja az órát és a futásidőt', () => {
    const line: string = composePulseLine(healthy());

    expect(line).toContain('09:20');
    expect(line).toContain('fut 2ó 55p');
  });

  it('ép rendszernél NINCS riasztó jel', () => {
    const line: string = composePulseLine(healthy());

    expect(line).not.toContain('🔴');
    expect(line).not.toContain('⚠️');
    expect(line).toContain('Honnie#6234');
  });

  it('a halott Discord-figyelőt PIROSSAL jelzi', () => {
    // Ez a legfontosabb eset: pontosan ettől volt a jelenlét-figyelő 112 napig halott úgy,
    // hogy senki nem vette észre.
    const line: string = composePulseLine(healthy({
      discord: { state: 'stale', ageMs: 12 * 60_000, botTag: 'Honnie#6234' },
    }));

    expect(line).toContain('🔴');
    expect(line).toContain('HALOTT');
  });

  it('a soha el nem indult figyelőt megkülönbözteti a halottól', () => {
    const line: string = composePulseLine(healthy({ discord: { state: 'absent' } }));

    expect(line).toContain('nincs életjel');
    expect(line).not.toContain('HALOTT');
  });

  it('az elavult jelenlét-mérést jelzi', () => {
    const line: string = composePulseLine(healthy({
      presence: { state: 'stale', ageMs: 40 * 60_000 },
    }));

    expect(line).toContain('ELAVULT');
  });

  it('a jelenlét nyers mezőértékét magyarul mutatja', () => {
    expect(composePulseLine(healthy())).toContain('aktív');
    expect(composePulseLine(healthy({
      presence: { state: 'alive', ageMs: 10_000, idleState: 'idle' },
    }))).toContain('tétlen');
  });

  it('a várakozó üzeneteket FIGYELMEZTETÉSKÉNT mutatja', () => {
    const line: string = composePulseLine(healthy({ pendingInbound: 2 }));

    expect(line).toContain('⚠️');
    expect(line).toContain('2 üzenet vár');
  });

  it('üres kötegnél nem riogat', () => {
    expect(composePulseLine(healthy())).toContain('köteg üres');
  });

  it('kezeli, ha még soha nem ment ki üzenet', () => {
    const line: string = composePulseLine(healthy({ lastOutboundAgeMs: undefined }));

    expect(line).toContain('még soha');
  });
});

describe('formatAge', () => {

  it('percnél rövidebbet másodpercben ad', () => {
    expect(formatAge(45_000)).toBe('45mp');
  });

  it('órán belül percben ad', () => {
    expect(formatAge(7 * 60_000)).toBe('7p');
  });

  it('órán túl órát ÉS percet ad', () => {
    expect(formatAge(2 * 3_600_000 + 15 * 60_000)).toBe('2ó 15p');
  });

  it('a negatív kort (jövőbeli időbélyeg, óracsúszás) nem engedi ki hibaként', () => {
    expect(formatAge(-5_000)).toBe('0mp');
  });
});

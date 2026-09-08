import { composeDeliveryNotice, shouldSendDeliveryNotice } from './discord.receipt.js';

// Owner-korrekcio (2026-09-07 10:29): "Nem kell folyton irni, hogy megvannak az uzenetek...
// Eleg ha a typing frissitve van es esetleg arrol kuldhetsz egy rovid 2 szavas valaszt, hogy
// na most ment el neked x uzenet"
//
// => A jelzes a KULDES pillanataba kerult, es TOMONDAT lett.

describe('composeDeliveryNotice', () => {

  it('egyes szamban helyes', () => {
    expect(composeDeliveryNotice(1)).toBe('📨 Átment az üzeneted.');
  });

  it('megmondja a darabszamot', () => {
    expect(composeDeliveryNotice(3)).toBe('📨 Átment 3 üzeneted.');
  });

  it('🔴 TOMONDAT — az owner kifejezetten rovidet kert', () => {
    const text = composeDeliveryNotice(5);

    expect(text.includes('\n')).toBe(false);
    expect(text.length).toBeLessThan(40);
  });

  it('⛔ NEM magyaraz es NEM iger semmit', () => {
    const text = composeDeliveryNotice(2);

    expect(text).not.toContain('dolgozom');
    expect(text).not.toContain('Jövök');
    expect(text).not.toContain('még nem');
  });
});

describe('shouldSendDeliveryNotice — 🔴 a MÉRT SPAM ellen (2026-09-08)', () => {

  // Aznap 72 sajat uzenetbol 17 volt ez a nyugta. Az owner reggel: „megint kicsit ossze lett
  // spam-elve a discord". Az uzenetei EGYESEVEL erkeznek => a koteg-ertesitobol per-input
  // nyugta lett, azaz pontosan az, amit 13:19-kor megtiltott.

  it('⛔ EGYETLEN üzenetre NEM szólunk — ezt tiltotta meg', () => {
    expect(shouldSendDeliveryNotice(1)).toBe(false);
  });

  it('✅ KETTŐTŐL felfelé megy — ott valódi információ van', () => {
    expect(shouldSendDeliveryNotice(2)).toBe(true);
    expect(shouldSendDeliveryNotice(21)).toBe(true);
  });

  it('⛔ nulla kézbesítésnél sincs értesítő', () => {
    expect(shouldSendDeliveryNotice(0)).toBe(false);
  });

  it('⭐ a KORÁBBI owner-kérés így is teljesül: „most ment el neked x üzenet"', () => {
    // 2026-09-07 10:29 — a koteg-ertesito megmarad, csak a per-input valtozata tunik el.
    expect(shouldSendDeliveryNotice(3)).toBe(true);
    expect(composeDeliveryNotice(3)).toContain('3');
  });
});

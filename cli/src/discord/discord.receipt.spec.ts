import { composeDeliveryNotice } from './discord.receipt.js';

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

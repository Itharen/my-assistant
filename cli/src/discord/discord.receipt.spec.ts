import { composeDeliveryNotice, shouldSendDeliveryNotice } from './discord.receipt.js';

// Owner-korrekcio (2026-09-07 10:29): "Nem kell folyton irni, hogy megvannak az uzenetek...
// Eleg ha a typing frissitve van es esetleg arrol kuldhetsz egy rovid 2 szavas valaszt, hogy
// na most ment el neked x uzenet"
//
// => A jelzes a KULDES pillanataba kerult, es TOMONDAT lett.

describe('composeDeliveryNotice — 📨 az ŐSZINTE nyugta (23. tétel)', () => {

  // > **Owner, 2026-09-12 22:02:** *„Úgy látom, hogy X üzenet elküldve üzenetet NEM AKKOR
  // > kapom, amikor elküldötté válik tényleg, hanem nem tudom mikor később."*
  //
  // 🔬 MÉRVE: a nyugta 2-5 mp-cel a KÉZBESÍTÉS után megy ki, de 190-650 mp-cel az owner
  // BESZÉDE után. ⇒ A szám pontos volt, csak ⛔ nem azt mérte, amit ő hitt.
  //
  // ⚠️ EZ FELÜLÍRJA a 2026-09-07-es „rövid 2 szavas válasz" kérést: az owner MOST kifejezetten
  // TÖBB információt kért (a várakozást). ⭐ Az EGY SOR viszont megmarad.

  it('🔴 KIMONDJA, hogy HOZZÁM érkezett meg — ⛔ nem „átment"', () => {
    const text = composeDeliveryNotice(3, 240_000);

    expect(text).toContain('megérkezett hozzám');
    expect(text).not.toContain('Átment');
  });

  it('⭐ KIÍRJA A VÁRAKOZÁST — ez a négy félreértés ellenszere', () => {
    // 🔴 Az owner MA NÉGYSZER hitte, hogy áll a rendszer (03:17 · 04:22 · 04:40 · 22:02) —
    // egyszer sem állt. A várakozás kiírása mind a négyet megelőzte volna.
    expect(composeDeliveryNotice(3, 252_000)).toBe('📨 3 üzeneted megérkezett hozzám (4p 12mp várakozás után).');
  });

  it('egyes számban helyes', () => {
    expect(composeDeliveryNotice(1, 45_000)).toBe('📨 Az üzeneted megérkezett hozzám (45 mp várakozás után).');
  });

  it('⚠️ A SZOKATLANUL HOSSZÚ VÁRAKOZÁS KIEMELVE — és az OKA is kimondva', () => {
    const text = composeDeliveryNotice(2, 14 * 60_000);

    expect(text).toContain('⚠️');
    expect(text).toContain('addig gyűjtött a köteg');
  });

  it('⭐ A 10 PERC ALATTI várakozás NEM kap kiemelést — különben a jel elértéktelenedik', () => {
    expect(composeDeliveryNotice(2, 9 * 60_000)).not.toContain('⚠️');
    expect(composeDeliveryNotice(2, 10 * 60_000)).toContain('⚠️');
  });

  it('⭐ KEREK PERCNÉL nincs „0mp" zaj — de a közös formázót ⛔ nem forkoltuk', () => {
    expect(composeDeliveryNotice(2, 9 * 60_000)).toContain('9p várakozás');
    expect(composeDeliveryNotice(2, 9 * 60_000)).not.toContain('0mp');
    // ⚠️ A nem kerek perc VÁLTOZATLANUL pontos marad:
    expect(composeDeliveryNotice(2, 252_000)).toContain('4p 12mp');
  });

  it('⛔ NEM MÉRHETŐ várakozásnál NEM írunk ki számot — a kitalált szám rosszabb', () => {
    expect(composeDeliveryNotice(3, null)).toBe('📨 3 üzeneted megérkezett hozzám.');
    expect(composeDeliveryNotice(3)).toBe('📨 3 üzeneted megérkezett hozzám.');
  });

  it('🔴 EGY SOR marad — az owner rövidséget kért, és ez a korlát ÉL', () => {
    const worst = composeDeliveryNotice(12, 65 * 60_000);

    expect(worst.split('\n').length).toBe(1);
    expect(worst.length).toBeLessThan(100);
  });

  it('⛔ NEM magyaráz és NEM ígér semmit', () => {
    const text = composeDeliveryNotice(2, 120_000);

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
    expect(composeDeliveryNotice(3, 60_000)).toContain('3');
  });
});

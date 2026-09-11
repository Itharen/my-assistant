// A profil-frissítés mezőinek tesztjei.
//
// > **Owner, 2026-09-11 01:52:** *„a profilt kéne frissítsük… adhatnál majd egy felületet, meg
// > valami **easy to use, copy-paste-es megoldást**, ugye azt sem tudjuk automatizálni
// > teljesen."*
//
// ⭐ A NÉGY ÁLLÍTÁS, AMI A FELADATBÓL JÖN:
//   (a) **mezőnként** dolgozunk — ⛔ nem egy nagy blob;
//   (b) a **karakterszám + limit** ott derül ki, ⛔ nem a beillesztésnél;
//   (c) a **„beillesztettem" pipa** mezőnként — különben félbeszakítás után nem tudja, hol tartott;
//   (d) ⚠️ a **javaslat hiánya nem hiba** — azt az asszisztens írja, ⛔ nem a DEV.

import { LinkedinProfileFields_Util } from './linkedin-profile-fields.js';

/** A MÉRT alak: a LinkedIn exportja ezekkel a kulcsokkal ad adatot. */
const CURRENT = {
  'Headline': 'AI Systems Engineer & Agent Builder',
  'Summary': 'I build AI-driven systems.',
  'Industry': 'IT Services and IT Consulting',
  'Geo Location': 'Budapest, Budapest, Hungary',
};

describe('LinkedinProfileFields_Util.buildPlan — ⭐ MEZŐNKÉNT', () => {

  it('mind a NÉGY mezőt megadja, a LinkedIn nevével', () => {
    // ⚠️ A LinkedIn nevén: azon a néven keresse, ahol beilleszti. Az „About" NEM „Summary"
    // a felületen, pedig az export így hívja.
    const plan = LinkedinProfileFields_Util.buildPlan({ current: CURRENT, proposed: {} });

    expect(plan.fields.map((f) => f.label)).toEqual(['Headline', 'About', 'Industry', 'Location']);
  });

  it('⭐ a MOSTANI és a JAVASOLT szöveg EGYMÁS MELLETT van', () => {
    const plan = LinkedinProfileFields_Util.buildPlan({
      current: CURRENT,
      proposed: { 'Headline': 'Új headline' },
    });
    const headline = plan.fields[0];

    expect(headline?.current).toBe('AI Systems Engineer & Agent Builder');
    expect(headline?.proposed).toBe('Új headline');
  });

  it('🔴 a TÚLLÓGÁS itt derül ki — ⛔ nem a beillesztésnél', () => {
    // A feladat kikötése: „ha túllóg, ott derüljön ki, ne a beillesztésnél". Egy beillesztésnél
    // levágott szöveg NÉMÁN veszít tartalmat.
    const plan = LinkedinProfileFields_Util.buildPlan({
      current: CURRENT,
      proposed: { 'Headline': 'x'.repeat(221) },
    });

    expect(plan.fields[0]?.isOverLimit).toBeTrue();
    expect(plan.fields[0]?.limit).toBe(220);
    expect(plan.overLimitCount).toBe(1);
  });

  it('a limiten BELÜL nem jelez túllógást', () => {
    const plan = LinkedinProfileFields_Util.buildPlan({
      current: CURRENT,
      proposed: { 'Headline': 'x'.repeat(220), 'Summary': 'y'.repeat(2_600) },
    });

    expect(plan.fields[0]?.isOverLimit).toBeFalse();
    expect(plan.fields[1]?.isOverLimit).toBeFalse();
    expect(plan.overLimitCount).toBe(0);
  });

  it('⭐ a karakterszám MINDKÉT oldalon megvan', () => {
    const plan = LinkedinProfileFields_Util.buildPlan({
      current: CURRENT,
      proposed: { 'Headline': 'Rövid' },
    });

    expect(plan.fields[0]?.currentLength).toBe(35);
    expect(plan.fields[0]?.proposedLength).toBe(5);
  });

  it('🔴 AZONOS szöveg NEM változás — ⛔ ne adjunk fölösleges munkát', () => {
    const plan = LinkedinProfileFields_Util.buildPlan({
      current: CURRENT,
      proposed: { 'Headline': 'AI Systems Engineer & Agent Builder' },
    });

    expect(plan.fields[0]?.hasChange).toBeFalse();
    expect(plan.changeCount).toBe(0);
  });

  it('⚠️ a JAVASLAT HIÁNYA nem hiba — az asszisztens írja meg', () => {
    // ⛔ Ez NEM a DEV dolga. A felületnek ezt KI KELL MONDANIA, különben üresen
    // elromlottnak látszik.
    const plan = LinkedinProfileFields_Util.buildPlan({ current: CURRENT, proposed: {} });

    expect(plan.hasProposal).toBeFalse();
    expect(plan.changeCount).toBe(0);
    // ⭐ És ez ⛔ NEM „kész": nincs miből beilleszteni.
    expect(plan.isComplete).toBeFalse();
  });

  it('⛔ HIÁNYZÓ vagy sérült profil-adatra sem dob', () => {
    for (const source of [undefined, null, 'nem objektum', 42, []]) {
      const plan = LinkedinProfileFields_Util.buildPlan({ current: source, proposed: source });

      expect(plan.fields.length).toBe(4);
      expect(plan.hasProposal).toBeFalse();
    }
  });
});

describe('LinkedinProfileFields_Util — ✅ a „beillesztettem" pipa', () => {

  const PROPOSED = { 'Headline': 'Új headline', 'Summary': 'Új about' };

  it('⭐ mezőnként számolja, mennyi van kész', () => {
    const plan = LinkedinProfileFields_Util.buildPlan({
      current: CURRENT,
      proposed: PROPOSED,
      pasted: ['headline'],
    });

    expect(plan.changeCount).toBe(2);
    expect(plan.pastedCount).toBe(1);
    expect(plan.isComplete).toBeFalse();
  });

  it('🔴 KÉSZ, ha MINDEN változó mező beillesztve', () => {
    const plan = LinkedinProfileFields_Util.buildPlan({
      current: CURRENT,
      proposed: PROPOSED,
      pasted: ['headline', 'summary'],
    });

    expect(plan.isComplete).toBeTrue();
  });

  it('⚠️ a NEM VÁLTOZÓ mező beillesztése nem számít bele', () => {
    // Különben egy változatlan mező „kipipálása" késznek mutatná a munkát.
    const plan = LinkedinProfileFields_Util.buildPlan({
      current: CURRENT,
      proposed: { 'Headline': 'Új headline' },
      pasted: ['headline', 'industry'],
    });

    expect(plan.changeCount).toBe(1);
    expect(plan.pastedCount).toBe(1);
    expect(plan.isComplete).toBeTrue();
  });

  it('a jelölés be- és kikapcsolható', () => {
    expect(LinkedinProfileFields_Util.togglePasted([], 'headline', true)).toEqual(['headline']);
    expect(LinkedinProfileFields_Util.togglePasted(['headline'], 'headline', false)).toEqual([]);
  });

  it('⭐ a sorrend a MEZŐ-SORREND — az állapot-fájl olvasható marad', () => {
    // ⚠️ Enélkül két egymás utáni írás értelmetlen diffet adna.
    expect(LinkedinProfileFields_Util.togglePasted(['summary'], 'headline', true))
      .toEqual(['headline', 'summary']);
  });

  it('⛔ ISMERETLEN kulcsot nem jegyez fel — egy elírás némán felhalmozódna', () => {
    expect(LinkedinProfileFields_Util.togglePasted(['headline'], 'nincs-ilyen', true))
      .toEqual(['headline']);
  });

  it('⛔ a bemenetet NEM módosítja — tiszta függvény', () => {
    const original: string[] = ['headline'];

    LinkedinProfileFields_Util.togglePasted(original, 'summary', true);

    expect(original).toEqual(['headline']);
  });
});

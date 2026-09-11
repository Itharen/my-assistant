// A profil-frissítő panel tesztjei.
//
// > **Owner, 2026-09-11 01:52:** *„adhatnál majd egy felületet, meg valami **easy to use,
// > copy-paste-es megoldást**, ugye azt sem tudjuk automatizálni teljesen."*
//
// ⭐ A HÁROM ÁLLÍTÁS, AMI A FELÜLETRE VONATKOZIK:
//   (a) ⛔ **egyetlen hiba sem néma** — a betöltés, a vágólap és a mentés bukása is látszik;
//   (b) a jelölés után a **szerver friss terve** rajzol újra, ⛔ nem a saját feltevésünk;
//   (c) csak a **változó** mezők látszanak — a változatlanokkal ⛔ nem adunk munkát.

import type { LinkedInProfileField, LinkedInProfileUpdatePlan } from '@server-models';
import { L_ProfileUpdate_Component } from './l-profile-update.component';

/**
 * Az adat-réteg utánzata.
 *
 * ⭐ A komponens **szűk szerződést** kér *(`ProfileUpdateGateway`)*, ezért itt egy
 * egyszerű objektum elég — ⛔ egyetlen `as` átcímkézés sem kell.
 */
function gateway(overrides: {
  getProfileUpdatePlan?: () => Promise<LinkedInProfileUpdatePlan>;
  markProfileFieldPasted?: (request: { key: string; isPasted: boolean }) => Promise<LinkedInProfileUpdatePlan>;
}): {
  getProfileUpdatePlan(): Promise<LinkedInProfileUpdatePlan>;
  markProfileFieldPasted(request: { key: string; isPasted: boolean }): Promise<LinkedInProfileUpdatePlan>;
} {
  return {
    getProfileUpdatePlan: overrides.getProfileUpdatePlan
      ?? ((): Promise<LinkedInProfileUpdatePlan> => Promise.resolve(plan([]))),
    markProfileFieldPasted: overrides.markProfileFieldPasted
      ?? ((): Promise<LinkedInProfileUpdatePlan> => Promise.resolve(plan([]))),
  };
}

/** Egy mező a teszthez. */
function field(overrides: Partial<LinkedInProfileField> = {}): LinkedInProfileField {
  return {
    key: 'headline',
    label: 'Headline',
    limit: 220,
    current: 'Régi',
    proposed: 'Új',
    currentLength: 4,
    proposedLength: 2,
    isOverLimit: false,
    hasChange: true,
    isPasted: false,
    ...overrides,
  };
}

/** Egy terv a teszthez. */
function plan(fields: LinkedInProfileField[]): LinkedInProfileUpdatePlan {
  const changing: LinkedInProfileField[] = fields.filter((f: LinkedInProfileField): boolean => f.hasChange);

  return {
    fields: fields,
    changeCount: changing.length,
    pastedCount: changing.filter((f: LinkedInProfileField): boolean => f.isPasted).length,
    overLimitCount: fields.filter((f: LinkedInProfileField): boolean => f.isOverLimit).length,
    isComplete: changing.length > 0 && changing.every((f: LinkedInProfileField): boolean => f.isPasted),
    hasProposal: fields.some((f: LinkedInProfileField): boolean => f.proposed.length > 0),
  };
}

describe('L_ProfileUpdate_Component', (): void => {

  it('⭐ betöltéskor lekéri a tervet', async (): Promise<void> => {
    const api = gateway({
      getProfileUpdatePlan: async (): Promise<LinkedInProfileUpdatePlan> => plan([field()]),
    });
    const component = new L_ProfileUpdate_Component(api);

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.plan_$()?.changeCount).toBe(1);
    expect(component.error_$()).toBeNull();
  });

  it('🔴 a BETÖLTÉS bukása LÁTSZIK — ⛔ nem áll üresen', async (): Promise<void> => {
    // ⚠️ Ez a hibafajta MÁR MEGTÖRTÉNT ebben a projektben: az `ngOnInit` elutasított
    // promise-a némán elnyelődött, és a panel üresen állt.
    const api = gateway({
      getProfileUpdatePlan: async (): Promise<never> => {
        throw new Error('a szerver nem válaszol');
      },
    });
    const component = new L_ProfileUpdate_Component(api);

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.error_$()).toContain('nem olvasható');
    expect(component.loading_$()).toBeFalse();
  });

  it('⛔ csak a VÁLTOZÓ mezők látszanak', async (): Promise<void> => {
    const api = gateway({
      getProfileUpdatePlan: async (): Promise<LinkedInProfileUpdatePlan> => plan([
        field({ key: 'headline', hasChange: true }),
        field({ key: 'summary', label: 'About', hasChange: false }),
      ]),
    });
    const component = new L_ProfileUpdate_Component(api);

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.changingFields_$().map((f: LinkedInProfileField): string => f.key))
      .toEqual(['headline']);
  });

  it('⚠️ JAVASLAT NÉLKÜL kimondja, hogy még nincs — ⛔ nem látszik elromlottnak', async (): Promise<void> => {
    const api = gateway({
      getProfileUpdatePlan: async (): Promise<LinkedInProfileUpdatePlan> =>
        plan([field({ proposed: '', proposedLength: 0, hasChange: false })]),
    });
    const component = new L_ProfileUpdate_Component(api);

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.progressLabel_$()).toContain('Még nincs javaslat');
  });

  it('a haladás mezőnként látszik', async (): Promise<void> => {
    const api = gateway({
      getProfileUpdatePlan: async (): Promise<LinkedInProfileUpdatePlan> => plan([
        field({ key: 'headline', isPasted: true }),
        field({ key: 'summary', label: 'About', isPasted: false }),
      ]),
    });
    const component = new L_ProfileUpdate_Component(api);

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.progressLabel_$()).toBe('1 / 2 mező beillesztve');
  });

  it('🔴 JAVASLAT NÉLKÜLI mezőt nem másol — és megmondja, miért', async (): Promise<void> => {
    const component = new L_ProfileUpdate_Component(gateway({}));

    await component.copyField(field({ proposed: '' }));

    expect(component.error_$()).toContain('még nincs javaslat');
    expect(component.copiedKey_$()).toBeNull();
  });

  it('⭐ a jelölés után a SZERVER friss terve rajzol újra', async (): Promise<void> => {
    // ⛔ NEM a saját feltevésünkből: így egy elbukott mentés LÁTSZIK, nem tűnik kipipáltnak.
    const sent: { key: string; isPasted: boolean }[] = [];
    const api = gateway({
      markProfileFieldPasted: async (request: { key: string; isPasted: boolean }): Promise<LinkedInProfileUpdatePlan> => {
        sent.push(request);

        return plan([field({ isPasted: true })]);
      },
    });
    const component = new L_ProfileUpdate_Component(api);

    await component.togglePasted(field({ isPasted: false }));

    expect(sent).toEqual([{ key: 'headline', isPasted: true }]);
    expect(component.plan_$()?.pastedCount).toBe(1);
  });

  it('🔴 a MENTÉS bukása LÁTSZIK — a haladás nem őrződött meg', async (): Promise<void> => {
    const api = gateway({
      markProfileFieldPasted: async (): Promise<never> => {
        throw new Error('lemez tele');
      },
    });
    const component = new L_ProfileUpdate_Component(api);

    await component.togglePasted(field());

    expect(component.error_$()).toContain('nem menthető');
  });
});

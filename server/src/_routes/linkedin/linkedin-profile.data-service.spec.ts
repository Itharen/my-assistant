// A LinkedIn profil-frissítés adat-szolgáltatásának tesztjei.
//
// ## 🔴 MIÉRT LÉTEZIK EZ A FÁJL — egy MÉRT, ÉLES hiba (2026-09-11 11:02)
//
// > **Owner, 2026-09-11 10:55:** *„Mindenféle **hibákat** látok megjelenni a My Assistant
// > felületén…"*
//
// A `resolveRepoRoot()` **`__dirname`-t** használt. A szerver viszont **ESM**
// *(`server/package.json` → `"type": "module"`)*, ahol a `__dirname` ⛔ **nem létezik** ⇒
// futásidőben `ReferenceError`:
//
// ```
// GET /api/linkedin/profile-update  →  MA-LINKEDIN-PROFILE-READ-FAILED
// ```
//
// ⚠️ **ÉS EZ ÁTCSÚSZOTT A FORDÍTÁSON:** a `@types/node` **globálisan deklarálja** a
// `__dirname`-t, tehát a `tsc` **zöld** volt, és egyetlen teszt sem hívta ezt az utat.
//
// ⭐ **EZÉRT EZ A TESZT AZ ÉLŐ UTAT hívja** *(`readPlan()`)*, ⛔ nem csak a tiszta függvényt:
// a tiszta mező-logikát a CLI oldalon már 15 spec fedi — ami **hiányzott**, az a **futásidejű
// útvonal-feloldás**. ⇒ Egy ilyen teszt a hibát **azonnal** elkapta volna.

import { LinkedinProfile_DataService } from './linkedin-profile.data-service.js';

/**
 * A terv mezoinek szerkezeti kiolvasasa — `as` atcimkezes NELKUL.
 *
 * A `readPlan()` szandekosan `unknown`-t ad (a mezo-logika a CLI-ben lakik), es a valasz
 * IDEGEN ADAT a szerver szempontjabol. Egy atcimkezes azt allitana, hogy ismerjuk az alakjat.
 */
function fieldsOf(plan: unknown): { label: string; current: string }[] {
  if (!plan || typeof plan !== 'object') return [];

  for (const [key, value] of Object.entries(plan)) {
    if (key !== 'fields' || !Array.isArray(value)) continue;

    return value.map((item: unknown): { label: string; current: string } => {
      const label: unknown = item && typeof item === 'object'
        ? Object.entries(item).find(([name]): boolean => name === 'label')?.[1]
        : undefined;
      const current: unknown = item && typeof item === 'object'
        ? Object.entries(item).find(([name]): boolean => name === 'current')?.[1]
        : undefined;

      return {
        label: typeof label === 'string' ? label : '',
        current: typeof current === 'string' ? current : '',
      };
    });
  }

  return [];
}

/** Egy logikai mezo kiolvasasa — szinten atcimkezes nelkul. */
function flagOf(plan: unknown, field: string): boolean | undefined {
  if (!plan || typeof plan !== 'object') return undefined;

  for (const [key, value] of Object.entries(plan)) {
    if (key === field && typeof value === 'boolean') return value;
  }

  return undefined;
}

describe('LinkedinProfile_DataService.readPlan — 🔴 az ÉLŐ út', () => {

  it('🔴 LEFUT és tervet ad — ⛔ nem dob (ez a `__dirname`-hiba regresszió-őre)', async (): Promise<void> => {
    // ⚠️ Ez a teszt a VALÓDI fájlokat olvassa a repóból: pontosan azt az utat, ami élesben
    // elbukott. Ha a gyökér-feloldás elromlik, EZ bukik el — ⛔ nem az owner böngészője.
    const plan = await new LinkedinProfile_DataService().readPlan();

    expect(plan).toBeDefined();
  });

  it('⭐ a terv a NÉGY mezőt adja vissza, a LinkedIn nevével', async (): Promise<void> => {
    const fields = fieldsOf(await new LinkedinProfile_DataService().readPlan());

    expect(fields.length).toBe(4);
    expect(fields.map((field): string => field.label)).toEqual([
      'Headline', 'About', 'Industry', 'Location',
    ]);
  });

  it('⭐ a MOSTANI profil-szöveg TÉNYLEGESEN beolvasva — a gyökér-feloldás bizonyítéka', async (): Promise<void> => {
    // 🔴 EZ A LÉNYEG: ha a gyökér rossz, a fájl nem található, a `current` mindenhol ÜRES
    // lenne — és a panel „nincs mit frissíteni"-t mutatna, NÉMÁN. A hibás út tehát nem
    // feltétlenül kivétel: lehet **csendes üresség** is.
    const fields = fieldsOf(await new LinkedinProfile_DataService().readPlan());

    expect(fields.some((field): boolean => field.current.length > 0)).toBeTrue();
  });

  it('⚠️ a hiányzó JAVASLAT nem hiba — a `hasProposal` mondja meg', async (): Promise<void> => {
    // A javaslatot az ASSZISZTENS írja; a hiánya érvényes állapot, ⛔ nem bukás.
    const plan: unknown = await new LinkedinProfile_DataService().readPlan();

    expect(flagOf(plan, 'hasProposal')).toBeDefined();
  });
});

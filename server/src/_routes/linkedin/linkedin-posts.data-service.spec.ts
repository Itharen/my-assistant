// A LinkedIn poszt-piszkozat adat-szolgáltatásának tesztjei.
//
// ## 🔴 MIÉRT AZ ÉLŐ UTAT HÍVJA — egy MÉRT, ÉLES hiba tanulsága (2026-09-11 11:02)
//
// A szomszéd **profil**-panelnél a `resolveRepoRoot()` `__dirname`-t használt. A szerver
// **ESM**, ahol a `__dirname` ⛔ nem létezik ⇒ futásidőben `ReferenceError`, és a panel
// `MA-LINKEDIN-PROFILE-READ-FAILED`-et adott. ⚠️ **A `tsc` zöld volt** *(a `@types/node`
// globálisan deklarálja)*, és egyetlen teszt sem hívta azt az utat.
//
// ⭐ Ezért itt a **`readDrafts()`** fut — a **valódi** fájlrendszeren, a **buildből**.
// A tiszta lista-logikát a CLI oldalon 27 spec fedi; ami csak **futásidőben** dőlhet el, az a
// **gyökér-feloldás és a mappa-olvasás**.
//
// 🔴 **ÉS A LEGROSSZABB KIMENETEL NEM A KIVÉTEL, HANEM A CSENDES ÜRESSÉG:** egy hibás
// gyökér-feloldás mellett a mappa „nem létezik", a lista üres, és a panel
// *„még nincs piszkozat"*-ot mutat — ⛔ miközben a hiba nálunk van.

import { LinkedinPosts_DataService } from './linkedin-posts.data-service.js';

/** Egy logikai mező kiolvasása — ⛔ `as` átcímkézés nélkül *(a válasz `unknown`)*. */
function flagOf(plan: unknown, field: string): boolean | undefined {
  if (!plan || typeof plan !== 'object') return undefined;

  for (const [key, value] of Object.entries(plan)) {
    if (key === field && typeof value === 'boolean') return value;
  }

  return undefined;
}

/** Egy szöveges mező kiolvasása. */
function textOf(plan: unknown, field: string): string {
  if (!plan || typeof plan !== 'object') return '';

  for (const [key, value] of Object.entries(plan)) {
    if (key === field && typeof value === 'string') return value;
  }

  return '';
}

/** Egy számmező kiolvasása. */
function numberOf(plan: unknown, field: string): number | undefined {
  if (!plan || typeof plan !== 'object') return undefined;

  for (const [key, value] of Object.entries(plan)) {
    if (key === field && typeof value === 'number') return value;
  }

  return undefined;
}

describe('LinkedinPosts_DataService.readDrafts — 🔴 az ÉLŐ út', () => {

  it('🔴 LEFUT és listát ad — ⛔ nem dob (ez a gyökér-feloldás regresszió-őre)', async (): Promise<void> => {
    // ⚠️ A VALÓDI fájlrendszert olvassa. Ha a gyökér-feloldás elromlik, EZ bukik el —
    // ⛔ nem az owner böngészője.
    const plan: unknown = await new LinkedinPosts_DataService().readDrafts();

    expect(plan).toBeDefined();
  });

  it('⭐ a válasz KIMONDJA, hol keresi a piszkozatokat', async (): Promise<void> => {
    // 🔴 EZ A CSENDES ÜRESSÉG ELLENI VÉDELEM: ha nincs piszkozat, az ownernek tudnia kell,
    // HOVA kell írni. Egy üres panel útvonal nélkül ⛔ hibának látszik.
    const plan: unknown = await new LinkedinPosts_DataService().readDrafts();

    expect(textOf(plan, 'draftsPath')).toContain('post-drafts');
  });

  it('⚠️ a piszkozatok HIÁNYA nem hiba — a `hasDrafts` mondja meg', async (): Promise<void> => {
    // A poszt szövegét az ASSZISZTENS írja; a hiánya érvényes állapot, ⛔ nem bukás.
    const plan: unknown = await new LinkedinPosts_DataService().readDrafts();

    expect(flagOf(plan, 'hasDrafts')).toBeDefined();
  });

  it('az összesítő számok jelen vannak — a panel ezekből rajzol haladást', async (): Promise<void> => {
    const plan: unknown = await new LinkedinPosts_DataService().readDrafts();

    expect(numberOf(plan, 'draftCount')).toBeDefined();
    expect(numberOf(plan, 'postedCount')).toBeDefined();
    expect(numberOf(plan, 'overLimitCount')).toBeDefined();
  });

  it('🔴 az ÜZENET-piszkozatok ⛔ NEM kerülnek a poszt-listába', async (): Promise<void> => {
    // ⚠️ MÉRT KOCKÁZAT (2026-09-11): a `current/linkedin/drafts/` mappa ÜZENET-válaszokat
    // tartalmaz, és azokban **óradíj és telefonszám** van. Ha valaki a mappát átállítaná,
    // azok a „posztok" panelen jelennének meg. ⇒ Ez a teszt az őr.
    const plan: unknown = await new LinkedinPosts_DataService().readDrafts();
    const serialized: string = JSON.stringify(plan);

    expect(serialized).not.toContain('EUR/óra');
    expect(serialized).not.toContain('thread:');
  });
});

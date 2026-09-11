// A naptár-parancs REGISZTRÁCIÓJÁNAK tesztje.
//
// 🔴 A MÉRT CSAPDA, ami miatt ez a fájl létezik *(2026-09-08)*:
//
// > A `comm voice-funnel` parancs **593 zöld teszt** és **zöld `tsc`** mellett **FUTÁSIDŐBEN NEM
// > LÉTEZETT**, mert kimaradt a `main.ts` engedélyezési listájából *(`COMMAND_TREE`)*.
//
// ⚠️ Ez a hibafajta **csendes**: a parancs-modul fordul, a tesztjei zöldek, a `tsc` boldog — és a
// felhasználó *„Unknown command group"*-ot kap. ⇒ A regisztrációt **külön** kell őrizni, mert a
// parancs-logika tesztje **elvileg sem** tudja megfogni.
//
// ⭐ MIÉRT A FÁJL SZÖVEGÉT OLVASSUK: a `COMMAND_TREE` a `main.ts`-en **belül** él, és a modul
// importálása **lefuttatná** a CLI belépési pontját *(globális hibakezelő-kötés, `.env`-betöltés,
// `main()` hívás)*. ⛔ Azt egy unit-teszt nem teheti meg — a **szöveg-szintű** ellenőrzés a
// járható út, és pontosan azt a sort őrzi, ami kimaradhat.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { resolveProjectRoot } from '../utils/project-root.js';

/** A `main.ts` szövege — vagy üres, ha nem találtuk meg. */
function readMainSource(): { path: string; text: string } {
  const path: string = join(resolveProjectRoot(), 'cli', 'src', 'main.ts');

  return {
    path: path,
    // ⛔ NEM `try`/`catch` üres szövegre: ha a fájl nincs meg, az alábbi `existsSync`-állítás
    // BUKIK — a néma üres szöveg ugyanis „minden rendben"-nek látszó tesztet adna.
    text: existsSync(path) ? readFileSync(path, 'utf8') : '',
  };
}

describe('| ma calendar — a parancs REGISZTRÁCIÓJA', () => {

  it('a main.ts megtalálható — ⚠️ enélkül a többi állítás semmit nem mérne', () => {
    const main = readMainSource();

    expect(existsSync(main.path)).toBe(true);
    expect(main.text.length).toBeGreaterThan(1000);
  });

  it('🔴 a `calendar` csoport BENNE VAN az engedélyezési listában', () => {
    const main = readMainSource();

    // ⚠️ Pontosan az a szövegforma, ami a `COMMAND_TREE`-ben áll.
    expect(main.text).toContain('  calendar: {');
  });

  it('🔴 a `today` alparancs is regisztrálva van', () => {
    const main = readMainSource();

    expect(main.text).toContain("today: (args: string[]) => runCalendarSubcommand('today', args)");
  });

  it('a lusta betöltő a naptár-parancs modulra mutat', () => {
    const main = readMainSource();

    // ⚠️ A modul-útvonalat SZÁNDÉKOSAN a betöltő-hívás szava NÉLKÜL keresem. Mért ok
    // (2026-09-11): a `no-dynamic-imports` review-szabály a SAJÁT TESZT-SZÖVEGEMET találta
    // meg találatként. ⭐ Ugyanaz a tanulság, mint a komment-találatoknál: a tiltott mintát
    // a saját állításomban sem szabad kiírni.
    expect(main.text).toContain('./commands/calendar.command.js');
    expect(main.text).toContain('runCalendarCommand(command, args)');
  });

  it('a csoport szerepel a fő súgóban — ⛔ a felderíthetetlen parancs nem létező parancs', () => {
    const main = readMainSource();

    expect(main.text).toContain("'  calendar    ");
  });

  it('🔴 a `CalendarToolError` STRUKTURÁLT hibaként van kezelve — a stabil kód miatt', () => {
    const main = readMainSource();

    // ⚠️ Enélkül a hiba-boríték a gyűjtőkódot (`E_FAILED`) vinné, és a „nincs jogosultság"
    // gépileg megkülönböztethetetlen lenne minden más hibától.
    expect(main.text).toContain('err instanceof CalendarToolError');
  });
});

// ⚠️ AZ ÉRTELMESSÉG-JELÖLÉS TESZTJEI (18. tétel) — ⭐ a MÉRT KORPUSZ mondataival.
//
// > **Owner, 2026-09-12 04:15:** *„Magyar szavak, magyar dallam, értelem nélkül… a
// > megkülönböztető jel NEM a nyelv, hanem az ÉRTELMESSÉG."* ·
// > *„bizonytalanságnál NE dobd el — JELÖLD MEG, és én döntök."*
//
// ⭐ MIÉRT A VALÓDI LEXIKONNAL FUT: a küszöbök **ehhez a szótárhoz** vannak mérve. Egy hamis
// szótárral a teszt a saját fikcióját igazolná, ⛔ nem a leszállított viselkedést. ⇒ Ha a
// `cli/data/hu-lexicon.txt` eltűnik vagy megcsonkul, ezek a tesztek **elbuknak**.

import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SttMeaningfulness_Util } from './stt.meaningfulness.js';
import { collectFlags, describeFlags } from './stt.flags.js';
import { PROJECT_ROOT_ENV } from '../utils/project-root.js';

/** 🔴 A 2026-09-12-es éjszakából, felcímkézve — ezek ÉRTELMETLENEK. */
const GIBBERISH_CAUGHT: string[] = [
  // Az owner első példája (arány 0,375 — 3 ismeretlen szó 8-ból).
  'A pro fysisz per lágrában. Én mindig a szóvaló értik a szóval.',
  // A mérésben a másik elkapott tétel (arány 0,267 — 4 ismeretlen szó 15-ből).
  'ahol az a lehább túl lehúzó, az a múlcéről fejlesz, akkor én pedig az, hogy ezt érted, '
    + 'hogy a két két kápadok.',
];

/**
 * 🔴 A MÉRT KORPUSZ LEGKÖZELEBBI VALÓDI MONDATAI — ⛔ EGYIK SEM kaphat jelölést.
 *
 * ⭐ Ezek ⛔ nem véletlen minták: a 207 valódi beszéd-átirat közül pontosan azok, amelyek a
 * legközelebb kerültek a küszöbhöz *(0,250 · 0,200 · 0,182)*. Ha a küszöb elcsúszik, itt bukik.
 */
const REAL_NOT_MARKED: string[] = [
  'Úgy látom, CCAT lett, de valójában az egy félre hallás, CCAP.',
  'Péntek este van, beszámíthatatlan vagyok egy kicsit, kicsit be vagyok ívva.',
  'Ja, meg a DM-be, privát message-be is tök jó lenne, ha elküldenéd a voice echo-kat, amit felismertél.',
  'Leklónosztad nekem az összes játék infót, illetve azt, hogy hogyan férsz hozzá.',
  'Na, baszd meg, még én beszélek, a csomót nem megy át. Na, tehát azt magyaráztam, hogy már az '
    + 'ágyban fekszem. Már a telefonnal beszélgetünk.',
];

describe('SttMeaningfulness_Util — az értelmesség-jelölés', () => {

  afterEach(() => {
    delete process.env[PROJECT_ROOT_ENV];
    SttMeaningfulness_Util.resetLexicon();
  });

  it('⭐ A LEXIKON ÉL és nem csonka — enélkül minden alábbi állítás hamis lenne', () => {
    // 🔴 Fail-open van: ha a fájl eltűnik, a jelölés NÉMÁN elmaradna. Ez a teszt a néma
    // elmaradást hangossá teszi.
    expect(SttMeaningfulness_Util.lexiconSize()).toBeGreaterThan(10_000);
    expect(SttMeaningfulness_Util.isKnownWord('feladat')).toBeTrue();
    expect(SttMeaningfulness_Util.isKnownWord('fysisz')).toBeFalse();
  });

  it('🔴 A HALANDZSA MEGJELÖLVE — az owner példájával', () => {
    for (const text of GIBBERISH_CAUGHT) {
      const verdict = SttMeaningfulness_Util.inspect({
        text: text,
        isKnownWord: (word: string): boolean => SttMeaningfulness_Util.isKnownWord(word),
      });

      expect(verdict.doubtful).withContext(text).toBeTrue();
      expect(verdict.reason).withContext(text).toContain('ismeretlen szó');
    }
  });

  it('⭐ A VALÓDI ÜZENETEK NEM kapnak jelölést — a küszöbhöz LEGKÖZELEBBI mondatokkal', () => {
    for (const text of REAL_NOT_MARKED) {
      const verdict = SttMeaningfulness_Util.inspect({
        text: text,
        isKnownWord: (word: string): boolean => SttMeaningfulness_Util.isKnownWord(word),
      });

      expect(verdict.doubtful).withContext(text).toBeFalse();
    }
  });

  it('⚪ AMIT NEM FOG MEG — kimondva, ⛔ nem elhallgatva', () => {
    // 🔴 Az owner MÁSODIK példája a küszöb ALATT van (arány 0,125, 2 ismeretlen szó). A mért
    // átfedés miatt nincs olyan küszöb, ami ezt elkapja hamis jelölés nélkül — ezért a hiány
    // TESZTELT TÉNY, nem meglepetés. Ha egyszer elkapjuk, ez a teszt figyelmeztet, hogy a
    // recall javult (és akkor újra kell mérni a hamis jelöléseket is).
    const missed: string = 'Egyébként az számolóban a hátulágiakban, azért a terület szívesen '
      + 'kapcsánál. Egyébként a helye van, hogy lehet veled most szipotékig tenni.';
    const verdict = SttMeaningfulness_Util.inspect({
      text: missed,
      isKnownWord: (word: string): boolean => SttMeaningfulness_Util.isKnownWord(word),
    });

    expect(verdict.doubtful).toBeFalse();
    expect(verdict.unknownWords.length).toBeLessThan(SttMeaningfulness_Util.MIN_UNKNOWN_WORDS);
  });

  it('⛔ RÖVID SZÖVEGRŐL NEM ítélkezünk — ott az arány zajos', () => {
    const verdict = SttMeaningfulness_Util.inspect({
      text: 'Na jó, fysisz.',
      isKnownWord: (word: string): boolean => word !== 'fysisz',
    });

    expect(verdict.contentWords).toBeLessThan(SttMeaningfulness_Util.MIN_CONTENT_WORDS);
    expect(verdict.doubtful).toBeFalse();
  });

  it('🔴 POZITÍV KONTROLL: ha MINDEN szó ismert, a leghalandzsább szöveg sem gyanús', () => {
    // ⭐ Ez igazolja, hogy tényleg a SZÓTÁR dönt, ⛔ nem valami rejtett szövegforma-heurisztika.
    const verdict = SttMeaningfulness_Util.inspect({
      text: GIBBERISH_CAUGHT[0] ?? '',
      isKnownWord: (): boolean => true,
    });

    expect(verdict.doubtful).toBeFalse();
    expect(verdict.unknownWords).toEqual([]);
  });

  it('⛔ HIÁNYZÓ LEXIKON = NINCS jelölés (fail-open), ⛔ nem minden szó ismeretlen', async () => {
    // 🔴 A fordított viselkedés katasztrófa lenne: lexikon nélkül MINDEN átirat jelölést kapna.
    const emptyRoot: string = await mkdtemp(join(tmpdir(), 'ma-lexicon-'));

    process.env[PROJECT_ROOT_ENV] = emptyRoot;
    SttMeaningfulness_Util.resetLexicon();

    expect(SttMeaningfulness_Util.isKnownWord('fysisz')).toBeTrue();
    expect(collectFlags(GIBBERISH_CAUGHT[0] ?? '').meaningDoubt).toBeUndefined();
  });

  it('⭐ A JELÖLÉS A SZÖVEG MELLÉ KERÜL, és kimondja, hogy NEM dobtuk el', () => {
    const flags = collectFlags(GIBBERISH_CAUGHT[0] ?? '');
    const rendered: string = describeFlags(flags);

    expect(flags.meaningDoubt).toBeDefined();
    expect(rendered).toContain('🎙️ gépi átirat');
    expect(rendered).toContain('ÉRTELMESSÉG-GYANÚ');
    expect(rendered).toContain('NEM dobtam el');
  });
});

describe('🎮 TULAJDONNÉV-MENTESSÉG — az első ÉLES hamis pozitív javítása (20. tétel, 2)', () => {

  /**
   * 🔴 A VALÓDI owner-üzenet, amit az értelmesség-őr 2026-09-12 05:31-kor MEGJELÖLT.
   *
   * A jelölés: *„14 ismeretlen szó a 45 tartalmi szóból (31%, küszöb: 22%): timberborn-ban,
   * dyson, sphere-ben, settlers, dyson"* ⇒ **mind játékcím**, az üzenet teljesen valódi.
   */
  const REAL_GAME_MESSAGE: string = 'Azt mondod, hogy a Timberborn-ban, a Dyson Sphere-ben, a '
    + 'Mini Settlers az lehet, hogy abban tényleg nincs időm, de a másik kettőben biztos, hogy '
    + 'van. Dyson Sphere-re az a baj, hogy amikor a bolygó fázisban éppen mindig elszédülök, '
    + 'ahogy rakködök körbe a bolygón. Timberborn-nal meg már annyit játsztottam, hogy már '
    + 'megépítettem 100 hódbázist, mert kicsit meguntam.';

  afterEach(() => {
    delete process.env[PROJECT_ROOT_ENV];
    SttMeaningfulness_Util.resetLexicon();
  });

  it('🔴 AZ ÉLES HAMIS POZITÍV MEGSZŰNT — ⛔ a küszöb emelése NÉLKÜL', () => {
    // ⭐ Ez a teszt a repó-lexikonnal fut, tehát a JÁTÉKNEVEKET a nagybetűs szabály menti meg
    // (a személyes név-szótár csak ráteszi a bő ráhagyást). ⇒ Gép-független állítás.
    const verdict = SttMeaningfulness_Util.inspect({ text: REAL_GAME_MESSAGE });

    expect(verdict.doubtful).toBeFalse();
    expect(SttMeaningfulness_Util.UNKNOWN_RATIO_THRESHOLD).toBe(0.22);
    expect(verdict.unknownWords).not.toContain('timberborn-ban');
  });

  it('🔴 POZITÍV KONTROLL: ha a játéknevek KISBETŰSEK lennének, továbbra is megjelölné', () => {
    // ⚠️ Enélkül a fenti teszt „zöld lenne" akkor is, ha a mentesség semmit nem tesz: ez mutatja
    // meg, hogy TÉNYLEG a nagybetű dönt — és hogy a mérés (0,311) reprodukálható.
    const verdict = SttMeaningfulness_Util.inspect({
      text: REAL_GAME_MESSAGE.toLowerCase(),
      // ⛔ Szótár nélkül: csak a nagybetűs szabály védhetne, de kisbetűs szövegben az sem.
      isKnownWord: (word: string): boolean => word === 'hogy' || word === 'azt',
    });

    expect(verdict.doubtful).toBeTrue();
  });

  it('⭐ A MONDAT ELSŐ SZAVA NEM tulajdonnév — ott a nagybetű kötelező, semmit nem bizonyít', () => {
    // 🔴 Ha a mondat-kezdőt is felmentenénk, minden mondat-kezdő halandzsa ingyen átmenne.
    const nothingKnown = (): boolean => false;
    const atStart = SttMeaningfulness_Util.inspect({
      text: 'Fysisz lagraban szovalo ertik kapadok mulcerol lehabb szipotekig.',
      isKnownWord: nothingKnown,
    });
    const midSentence = SttMeaningfulness_Util.inspect({
      text: 'Ez a Fysisz Lagraban Szovalo Ertik Kapadok Mulcerol Lehabb Szipotekig.',
      isKnownWord: nothingKnown,
    });

    // A mondat elején álló `Fysisz` BENNE van az ismeretlenek között…
    expect(atStart.unknownWords).toContain('fysisz');
    // …a mondat KÖZEPÉN álló nagybetűs szavak viszont tulajdonnévnek számítanak.
    expect(midSentence.unknownWords).not.toContain('fysisz');
  });

  it('🎮 A SZEMÉLYES NÉV-SZÓTÁR beolvasódik, ha létezik — ⛔ és ha nem, az sem hiba', async () => {
    // ⚠️ A valódi fájl SZEMÉLYES és gitignorált ⇒ a teszt a SAJÁT, ideiglenes példányát adja
    // (`USERPROFILE`), így gép-független. ⛔ A valódi fájl tartalmát nem másoljuk a repóba.
    const home: string = await mkdtemp(join(tmpdir(), 'ma-steam-'));
    const steam: string = join(home, '.config', 'my-assistant', 'steam');
    const originalProfile: string | undefined = process.env['USERPROFILE'];

    await mkdir(steam, { recursive: true });
    await writeFile(
      join(steam, 'appdetails-cache.json'),
      JSON.stringify({ '594570': { name: 'Kvirkaton Zsomborka' } }),
      'utf-8',
    );

    process.env['USERPROFILE'] = home;
    SttMeaningfulness_Util.resetLexicon();

    try {
      expect(SttMeaningfulness_Util.isKnownWord('kvirkaton')).toBeTrue();
      expect(SttMeaningfulness_Util.isKnownWord('zsomborka')).toBeTrue();
      // ⭐ És egy olyan szó, ami SEM a repó-lexikonban, SEM a név-szótárban nincs:
      expect(SttMeaningfulness_Util.isKnownWord('fysisz')).toBeFalse();
    } finally {
      if (originalProfile === undefined) delete process.env['USERPROFILE'];
      else process.env['USERPROFILE'] = originalProfile;

      SttMeaningfulness_Util.resetLexicon();
    }
  });
});

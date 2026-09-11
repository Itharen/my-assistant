// A poszt-piszkozat lista tesztjei.
//
// 🔴 A NÉGY ÁLLÍTÁS, amiért ez a fájl létezik:
//   (a) 🔴 **A POSZT SZÖVEGE VÁLTOZATLAN** — ⛔ egy karaktert sem alakítunk. A tartalmi
//       szabályok az asszisztensé; ha a felület „szépítene", az owner nem azt posztolná, amit
//       megírt;
//   (b) **az ÜRES lista NEM hiba** — a szöveget az asszisztens írja; a panelnek ezt
//       **kimondva** kell mutatnia, ⛔ nem üresen elromlottnak látszania;
//   (c) **a túllógás a MÁSOLÁS ELŐTT derül ki** — a feladat kikötése;
//   (d) **a haladás megőrződik** — a „kiposztoltam" pipa, mint a profil-panelnél.

import { LinkedinPostDrafts_Util } from './linkedin-post-drafts.js';

describe('| LinkedinPostDrafts_Util.buildList', () => {

  it('🔴 az ÜRES lista NEM hiba — és KIMONDJA, hol keresi a piszkozatokat', () => {
    const plan = LinkedinPostDrafts_Util.buildList({ sources: [] });

    expect(plan.hasDrafts).toBe(false);
    expect(plan.draftCount).toBe(0);
    // ⭐ Enélkül az owner nem tudná, hova kell írni a piszkozatot.
    expect(plan.draftsPath).toContain('post-drafts');
  });

  it('🔴 a poszt szövegét VÁLTOZATLANUL adja tovább', () => {
    const body: string = 'Első sor.\n\nMásodik bekezdés — „idézettel" és 3 emojival 🚀🔴⭐';
    const plan = LinkedinPostDrafts_Util.buildList({
      sources: [{ id: '2026-09-11-teszt', body: body }],
    });

    expect(plan.drafts[0]?.body).toBe(body);
  });

  it('a fájl végi üres sorokat levágja — ⚠️ azok a fájlból jönnek, ⛔ nem a szövegből', () => {
    const plan = LinkedinPostDrafts_Util.buildList({
      sources: [{ id: '2026-09-11-teszt', body: '\nSzöveg.\n\n\n' }],
    });

    expect(plan.drafts[0]?.body).toBe('Szöveg.');
  });

  it('a karakterszámot és a limitet megadja', () => {
    const plan = LinkedinPostDrafts_Util.buildList({
      sources: [{ id: '2026-09-11-teszt', body: 'Rövid.' }],
    });

    expect(plan.drafts[0]?.length).toBe(6);
    expect(plan.drafts[0]?.limit).toBe(3000);
    expect(plan.drafts[0]?.isOverLimit).toBe(false);
  });

  it('🔴 a TÚLLÓGÁS a listában derül ki — ⛔ nem a beillesztésnél', () => {
    const plan = LinkedinPostDrafts_Util.buildList({
      sources: [{ id: '2026-09-11-hosszu', body: 'x'.repeat(3001) }],
    });

    expect(plan.drafts[0]?.isOverLimit).toBe(true);
    expect(plan.overLimitCount).toBe(1);
  });

  it('pontosan a limiten MÉG nem túllógó', () => {
    const plan = LinkedinPostDrafts_Util.buildList({
      sources: [{ id: '2026-09-11-hatar', body: 'x'.repeat(3000) }],
    });

    expect(plan.drafts[0]?.isOverLimit).toBe(false);
  });

  it('a LEGFRISSEBB piszkozat kerül előre', () => {
    const plan = LinkedinPostDrafts_Util.buildList({
      sources: [
        { id: '2026-09-01-regi', body: 'a' },
        { id: '2026-09-11-friss', body: 'b' },
        { id: '2026-09-05-kozepes', body: 'c' },
      ],
    });

    expect(plan.drafts.map((draft): string => draft.id))
      .toEqual(['2026-09-11-friss', '2026-09-05-kozepes', '2026-09-01-regi']);
  });

  it('a „kiposztoltam" jelölést átveszi és összesíti', () => {
    const plan = LinkedinPostDrafts_Util.buildList({
      sources: [
        { id: '2026-09-11-egy', body: 'a' },
        { id: '2026-09-11-ketto', body: 'b' },
      ],
      posted: ['2026-09-11-egy'],
    });

    expect(plan.postedCount).toBe(1);
    expect(plan.drafts.find((draft): boolean => draft.id === '2026-09-11-egy')?.isPosted).toBe(true);
    expect(plan.drafts.find((draft): boolean => draft.id === '2026-09-11-ketto')?.isPosted).toBe(false);
  });

  it('⛔ a BEMENETET nem módosítja', () => {
    const sources = [
      { id: '2026-09-01-a', body: 'a' },
      { id: '2026-09-11-b', body: 'b' },
    ];

    LinkedinPostDrafts_Util.buildList({ sources: sources });

    expect(sources.map((source): string => source.id)).toEqual(['2026-09-01-a', '2026-09-11-b']);
  });

  it('indoklás-fájl nélkül sem dob — a „miért" üres, ⚠️ ez nem hiba', () => {
    const plan = LinkedinPostDrafts_Util.buildList({
      sources: [{ id: '2026-09-11-teszt', body: 'Szöveg.' }],
    });

    expect(plan.drafts[0]?.why).toBe('');
    expect(plan.drafts[0]?.status).toBe('');
  });
});

describe('| LinkedinPostDrafts_Util.describeTitle', () => {

  it('a dátumot és a szöveg ELEJÉT adja — ⛔ nem a kötőjeles fájlnevet', () => {
    const title: string = LinkedinPostDrafts_Util.describeTitle(
      '2026-09-11-ai-agents-es-a-tobbi',
      'Az AI-agentek nem varázslat.\n\nTovábbi sorok.',
    );

    expect(title).toBe('2026-09-11 — Az AI-agentek nem varázslat.');
  });

  it('a hosszú első sort levágja, de jelzi', () => {
    const title: string = LinkedinPostDrafts_Util.describeTitle('2026-09-11-x', 'y'.repeat(120));

    expect(title.endsWith('…')).toBe(true);
    expect(title.length).toBeLessThan(100);
  });

  it('a vezető üres sorokat átlépi', () => {
    const title: string = LinkedinPostDrafts_Util.describeTitle('2026-09-11-x', '\n\n   \nElső.');

    expect(title).toBe('2026-09-11 — Első.');
  });

  it('🔴 az ÜRES piszkozat is LÁTSZIK a listában', () => {
    expect(LinkedinPostDrafts_Util.describeTitle('2026-09-11-x', '   '))
      .toBe('2026-09-11 — (üres piszkozat)');
    expect(LinkedinPostDrafts_Util.describeTitle('nincs-datum', '')).toBe('(üres piszkozat)');
  });

  it('dátum nélküli azonosítónál csak a szöveget adja', () => {
    expect(LinkedinPostDrafts_Util.describeTitle('valami', 'Szöveg.')).toBe('Szöveg.');
  });
});

describe('| LinkedinPostDrafts_Util — az indoklás olvasása', () => {

  /** Egy piszkozat-indoklás a bevett két-fájlos alak szerint. */
  const MARKDOWN: string = [
    '---',
    'statusz: PISZKOZAT — owner-jovahagyasra var',
    'torzs: 2026-09-11-teszt.body.txt',
    '---',
    '',
    '## Miert EZ',
    '',
    'Mert a CV-vel egy irányba mutat.',
  ].join('\n');

  it('a `statusz` mezőt kiolvassa a front-matterből', () => {
    expect(LinkedinPostDrafts_Util.readMetaField(MARKDOWN, 'statusz'))
      .toBe('PISZKOZAT — owner-jovahagyasra var');
  });

  it('a mezőnév kis/nagybetűtől független', () => {
    expect(LinkedinPostDrafts_Util.readMetaField(MARKDOWN, 'STATUSZ')).not.toBe('');
  });

  it('🔴 a TÖRZSBEN lévő azonos szót ⛔ NEM veszi mezőnek', () => {
    // ⚠️ Enélkül egy idézet („statusz: valami") HAMIS státuszt írna a panelre.
    const markdown: string = ['---', 'torzs: x.body.txt', '---', '', 'statusz: HAMIS'].join('\n');

    expect(LinkedinPostDrafts_Util.readMetaField(markdown, 'statusz')).toBe('');
  });

  it('front-matter nélküli fájlnál üreset ad — ⚠️ ez nem hiba', () => {
    expect(LinkedinPostDrafts_Util.readMetaField('Sima szöveg.', 'statusz')).toBe('');
    expect(LinkedinPostDrafts_Util.readMetaField('', 'statusz')).toBe('');
  });

  it('a „miért" a front-matter UTÁNI rész', () => {
    const why: string = LinkedinPostDrafts_Util.readWhy(MARKDOWN);

    expect(why.startsWith('## Miert EZ')).toBe(true);
    expect(why).toContain('egy irányba mutat');
    // ⛔ A front-matter NEM kerül bele: az gépi adat, nem magyarázat.
    expect(why).not.toContain('torzs:');
  });

  it('front-matter nélkül a TELJES szöveg a „miért"', () => {
    expect(LinkedinPostDrafts_Util.readWhy('Csak a magyarázat.')).toBe('Csak a magyarázat.');
  });

  it('lezáratlan front-matternél ⛔ nem dob', () => {
    expect(LinkedinPostDrafts_Util.readWhy('---\nstatusz: x')).toBe('');
    expect(LinkedinPostDrafts_Util.readMetaField('---\nstatusz: x', 'statusz')).toBe('');
  });
});

describe('| LinkedinPostDrafts_Util.togglePosted', () => {

  const KNOWN: string[] = ['2026-09-11-egy', '2026-09-11-ketto'];

  it('felveszi és leveszi a jelölést', () => {
    const first: string[] = LinkedinPostDrafts_Util.togglePosted([], '2026-09-11-egy', true, KNOWN);

    expect(first).toEqual(['2026-09-11-egy']);
    expect(LinkedinPostDrafts_Util.togglePosted(first, '2026-09-11-egy', false, KNOWN)).toEqual([]);
  });

  it('🔴 ISMERETLEN azonosítót ⛔ NEM jegyez fel', () => {
    // ⚠️ Egy elírás különben némán felhalmozódna az állapot-fájlban.
    expect(LinkedinPostDrafts_Util.togglePosted([], 'nincs-ilyen', true, KNOWN)).toEqual([]);
  });

  it('⛔ a BEMENETET nem módosítja', () => {
    const posted: string[] = ['2026-09-11-egy'];

    LinkedinPostDrafts_Util.togglePosted(posted, '2026-09-11-ketto', true, KNOWN);

    expect(posted).toEqual(['2026-09-11-egy']);
  });

  it('rendezve ad vissza — az állapot-fájl így OLVASHATÓ', () => {
    const next: string[] = LinkedinPostDrafts_Util.togglePosted(
      ['2026-09-11-ketto'],
      '2026-09-11-egy',
      true,
      KNOWN,
    );

    expect(next).toEqual(['2026-09-11-egy', '2026-09-11-ketto']);
  });

  it('kétszeri felvétel nem duplikál', () => {
    const once: string[] = LinkedinPostDrafts_Util.togglePosted([], '2026-09-11-egy', true, KNOWN);
    const twice: string[] = LinkedinPostDrafts_Util.togglePosted(once, '2026-09-11-egy', true, KNOWN);

    expect(twice).toEqual(['2026-09-11-egy']);
  });
});

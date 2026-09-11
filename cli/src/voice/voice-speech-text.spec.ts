// A kimondható-szöveg fordító tesztjei (T-59/b).
//
// 🔴 MIÉRT LÉTEZIK: az üzeneteim **a szemnek** vannak formázva. Nyersen felolvasva a
// `**kész**`-ből „csillag csillag kész" lesz, a táblázatból zaj. Ez a suite azt őrzi, hogy a
// fordítás a **jelentést** viszi át, és ⛔ nem hagy a szövegben olyat, ami hangban értelmetlen.

import { prepareSpeechText, SPEECH_MAX_CHARS } from './voice-speech-text.js';

describe('prepareSpeechText — a díszek eltűnnek, a JELENTÉS marad', () => {

  it('a markdown-dísz eltűnik, a szöveg megmarad', () => {
    expect(prepareSpeechText('A **kész** és a `parancs` marad.')).toBe('A kész és a parancs marad.');
  });

  it('a fejléc-jelölés és a felsorolás-pont eltűnik', () => {
    expect(prepareSpeechText('## Cím\n- első\n- második')).toBe('Cím első második');
  });

  it('a hivatkozásból a SZÖVEG marad, nem az URL', () => {
    expect(prepareSpeechText('lásd [a naplót](https://pelda.hu/x)')).toBe('lásd a naplót');
  });

  it('a magyar ékezetek SÉRTETLENEK — ⛔ ezeket kimondani kell', () => {
    expect(prepareSpeechText('Őrült árvíztűrő tükörfúrógép')).toBe('Őrült árvíztűrő tükörfúrógép');
  });

  describe('⭐ a jelentést hordozó jelek KIMONDHATÓK lesznek', () => {

    it('a nyílból „ebből következik" lesz — ⛔ nem tűnik el', () => {
      expect(prepareSpeechText('mérve ⇒ javítva')).toBe('mérve ebből következik: javítva');
      expect(prepareSpeechText('A → B')).toBe('A ebből következik: B');
    });

    it('az egyenlőségjel kimondható', () => {
      expect(prepareSpeechText('kész = 3')).toBe('kész egyenlő 3');
    });

    it('a tagoló pont vesszővé lesz — a saját üzeneteimben ez a tagolás', () => {
      expect(prepareSpeechText('egy · kettő')).toBe('egy, kettő');
    });
  });

  describe('⭐ a JELZÉS-emojik hangsúllyá lesznek, a dísz-emojik eltűnnek', () => {

    it('a figyelmeztető emoji kimondható előtaggá lesz', () => {
      expect(prepareSpeechText('🔴 elszállt a build')).toBe('figyelem: elszállt a build');
      expect(prepareSpeechText('⛔ ne nyúlj hozzá')).toBe('tilos: ne nyúlj hozzá');
    });

    it('a dísz-emoji NEM olvasódik fel', () => {
      // ⚠️ A nevét felolvasni („rakéta") zaj lenne — a mondat értelme nem változik nélküle.
      expect(prepareSpeechText('kiment az üzenet 🚀')).toBe('kiment az üzenet');
    });
  });

  describe('🔴 amit hangban NEM lehet felolvasni', () => {

    it('a táblázat-sorok kimaradnak', () => {
      // ⚠️ Egy `| a | b |` sor felolvasva értelmezhetetlen — a szemnek viszont ez a szerkezet.
      expect(prepareSpeechText('Eredmény:\n| név | érték |\n|---|---|\n| a | 1 |'))
        .toBe('Eredmény:');
    });

    it('a kódblokk helyett a TÉNYÉT mondjuk ki — ⛔ nem hallgatjuk el', () => {
      // Enélkül az owner nem tudná, hogy volt ott valami, amit érdemes megnézni írásban.
      expect(prepareSpeechText('Futtasd:\n```bash\nnpm test\n```'))
        .toBe('Futtasd: (kódrészlet a szövegben)');
    });

    it('az URL helyett a tényét mondjuk ki', () => {
      expect(prepareSpeechText('itt van: https://pelda.hu/hosszu/utvonal?x=1'))
        .toBe('itt van: (hivatkozás)');
    });
  });

  describe('a hossz', () => {

    // 🔴 ÁTÍRVA 2026-09-11 — a CSONKOLÁSRÓL a NEM-CSONKOLÁSRA.
    //
    // > **Owner, 2026-09-11 01:28 (hang):** *„az üzeneteidnél most így levágja a végét… szét
    // > kéne bontani… lehetőleg **ne [vágjunk] le semmit**."*
    //
    // ⚠️ A tesztek ⛔ NEM lettek törölve *(a feladat kikötése)*: ugyanazt a bemenetet vizsgálják,
    // csak a **helyes** elvárással. A hossz-kezelés a `VoiceSpeechSplit_Util` dolga.

    it(`🔴 a ${SPEECH_MAX_CHARS} karakter fölötti szöveg TELJES EGÉSZÉBEN megmarad`, () => {
      const long: string = `${'Ez egy teljes mondat. '.repeat(60)}vég`;
      const spoken: string = prepareSpeechText(long);

      // ⭐ A LÉNYEG: hosszabb a határnál, és ez így HELYES — nem ez a függvény vág.
      expect(spoken.length).toBeGreaterThan(SPEECH_MAX_CHARS);
      // 🔴 A régi csonkolás nyoma SEHOL nem jelenhet meg.
      expect(spoken).not.toContain('A többi írásban.');
      expect(spoken.endsWith('vég')).toBeTrue();
    });

    it('⛔ mondathatár NÉLKÜL sem vág — és nem is jelez csonkolást', () => {
      const spoken: string = prepareSpeechText('szó '.repeat(400));

      expect(spoken).not.toContain('A többi írásban.');
      expect(spoken).not.toContain('…');
      // A 400 „szó " ⇒ 1600 karakter, szóközök összevonása után is jóval a határ fölött.
      expect(spoken.length).toBeGreaterThan(SPEECH_MAX_CHARS);
    });

    it('a sávon belüli szöveg érintetlen', () => {
      expect(prepareSpeechText('Rövid üzenet.')).toBe('Rövid üzenet.');
    });
  });

  describe('⚠️ az ÜRES eredmény érvényes válasz', () => {

    it('a csak-táblázat üresen jön vissza — ilyenkor nem olvasunk fel semmit', () => {
      expect(prepareSpeechText('| a | b |\n|---|---|')).toBe('');
    });

    it('a csak-emoji üresen jön vissza', () => {
      expect(prepareSpeechText('🚀🎉')).toBe('');
    });

    it('az üres bemenet üres', () => {
      expect(prepareSpeechText('   ')).toBe('');
    });
  });
});

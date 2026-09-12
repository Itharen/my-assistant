import {
  inspectTranscript,
  NOISE_MAX_CHARS,
  NOISE_MAX_WORDS,
} from './stt.transcript-guard.js';

describe('inspectTranscript — 🌐 NYELV-ELTÉRÉS (owner, 2026-09-11 01:24)', () => {

  // > **Owner:** *„a felismerés nyelve legyen rögzítve magyarra, ne találgasson."*
  // > **01:30:** *„ne építs köré nagy detektálás-logikát: egy paraméter, és kész."*
  //
  // ⭐ MÉRVE (2026-09-11 04:10): az FDP AI `/api/recognition` a `language=hu` paramétert
  // **elfogadja, de figyelmen kívül hagyja** — ugyanaz a megőrzött felvétel BETŰRE ugyanazt
  // adta vele és nélküle (`{"text":"Thanks."}`). ⇒ A kért paraméter **nem létezik**, ezért a
  // handoff TARTALÉK-ága valósul meg: EGY szabály, ⛔ nem detektálás-rendszer.

  it('🔴 az IZLANDI átirat megjelölve — ezt kétszer is jelentette az owner', () => {
    // Élő adat a megőrzött átiratokból: „Það er hann." / „Ná, hvað er mást holið startung?"
    const verdict = inspectTranscript('Það er hann.', {});

    expect(verdict.suspicious).toBeTrue();
    expect(verdict.reason).toContain('NYELV-ELTÉRÉS');
  });

  it('🔴 a LENGYEL és a JAPÁN is — mindkettő élő adat', () => {
    expect(inspectTranscript('Dziękuję.', {}).suspicious).toBeTrue();
    expect(inspectTranscript('ありがotうございました'.replace('ot', 'と'), {}).suspicious).toBeTrue();
  });

  it('🔴 a CIRILL írás is — a modell ismert orosz szemét-kimenete', () => {
    expect(inspectTranscript('Продолжается', {}).suspicious).toBeTrue();
  });

  it('⭐ a VALÓDI magyar szöveg ÉRINTETLEN — ékezetekkel is', () => {
    for (const text of [
      'Köszönöm, akkor ezt csináld.',
      'Jó reggelt! Nézd meg a naptáram, légyszi.',
      'Az ő ügye, meg a mieink is — összefűzve.',
    ]) {
      expect(inspectTranscript(text, {}).suspicious).withContext(text).toBeFalse();
    }
  });

  it('🔴 az „Igen." és a „Nem." NEM gyanús — ezek a LEGFONTOSABB válaszai', () => {
    // ⚠️ EZÉRT NEM az ékezet-hiányra figyelünk: az „Igen."/„Nem." ékezet nélküli, és egy
    // ékezet-alapú szabály az owner JÓVÁHAGYÁSÁT dobná el. A kód ezt a csapdát már ismerte
    // („igen"/„ok" szándékosan nincs a filler-listán) — ezt a döntést ⛔ nem írjuk felül.
    expect(inspectTranscript('Igen.', {}).suspicious).toBeFalse();
    expect(inspectTranscript('Nem.', {}).suspicious).toBeFalse();
  });

  it('⭐ az ANGOL szavak (Hunglish) érintetlenek — az angol sem használ ilyen betűt', () => {
    expect(inspectTranscript('A deploy után nézd meg a pipeline-t.', {}).suspicious).toBeFalse();
    expect(inspectTranscript('Csinald meg a code review-t.', {}).suspicious).toBeFalse();
  });

  it('a MÉRT angol töltelék-köszönések is megjelölve', () => {
    // Élő adat: teljes átiratként fordultak elő bukott felismerésből.
    expect(inspectTranscript('Yeah.', {}).suspicious).toBeTrue();
    expect(inspectTranscript('Bye.', {}).suspicious).toBeTrue();
  });
});

describe('inspectTranscript', () => {
  it('accepts a normal Hungarian sentence', () => {
    expect(inspectTranscript('Kerlek nezd meg, mikor indul a vonat.').suspicious).toBe(false);
  });

  it('flags the EXACT hallucination we measured on 2026-09-07', () => {
    // Elo probaan egy csendes mintara ezt adta vissza a szolgaltatas, status: processed.
    const verdict = inspectTranscript('Продолжение следует...');

    expect(verdict.suspicious).toBe(true);
    expect(verdict.reason).toContain('hallucin');
  });

  it('flags an empty transcript', () => {
    expect(inspectTranscript('   ').suspicious).toBe(true);
  });

  it('flags known subtitle-credit hallucinations', () => {
    expect(inspectTranscript('Субтитры сделал DimaTorzok').suspicious).toBe(true);
    expect(inspectTranscript('Thanks for watching!').suspicious).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(inspectTranscript('THANKS FOR WATCHING').suspicious).toBe(true);
  });

  it('flags a very short transcript but does NOT discard it', () => {
    const verdict = inspectTranscript('a');

    expect(verdict.suspicious).toBe(true);
    expect(verdict.reason).toContain('rövid');
  });

  it('accepts a short but meaningful answer', () => {
    // "igen" ertelmes valasz - nem szabad gyanusnak jelolni.
    expect(inspectTranscript('igen').suspicious).toBe(false);
  });

  it('flags a hallucination even when embedded in other text', () => {
    expect(inspectTranscript('hello Продолжение следует').suspicious).toBe(true);
  });
});

describe('inspectTranscript — BUKOTT FELISMERÉS (owner mérése, 2026-09-07)', () => {

  it('🔴 A MÉRT ESET: 9 mp hangból „Köszönöm" — a puszta hossz-küszöb ÁTENGEDTE volna', () => {
    const verdict = inspectTranscript('Köszönöm', { audioDurationSecs: 9 });

    expect(verdict.suspicious).toBe(true);
    expect(verdict.reason).toContain('9 másodperc');
    expect(verdict.reason).toContain('küldje újra');
  });

  it('hanghossz NÉLKÜL is elkapja a csupasz töltelék-szót', () => {
    expect(inspectTranscript('Köszönöm').suspicious).toBe(true);
    expect(inspectTranscript('thank you').suspicious).toBe(true);
    expect(inspectTranscript('you').suspicious).toBe(true);
  });

  it('⛔ a töltelék-szó CSAK önmagában gyanús — mondat részeként NEM', () => {
    const verdict = inspectTranscript('Köszönöm, akkor ezt csináld meg holnap reggel.');

    expect(verdict.suspicious).toBe(false);
  });

  it('a záró írásjel nem menti meg a csupasz tölteléket', () => {
    expect(inspectTranscript('Köszönöm.').suspicious).toBe(true);
  });

  it('⚠️ ÉRDEMI szöveget hosszú hangnál sem jelöl meg', () => {
    const real = 'Na most jelentem, hogy amikor hazaértem, olyan fárasztó volt ez a nap, '
      + 'hogy el is aludtam, és most ébredtem fel.';

    expect(inspectTranscript(real, { audioDurationSecs: 16 }).suspicious).toBe(false);
  });

  it('rövid hangnál NEM számol arányt — ott a szórás túl nagy', () => {
    // 2 mp hangból 3 karakter: aránytalan lenne, de ilyen rövidnél ez normális.
    expect(inspectTranscript('Jó.', { audioDurationSecs: 2 }).suspicious).toBe(false);
  });
});

describe('| inspectTranscript — 🎤 BULI-ZAJ (nyitott mikrofon)', () => {

  // 🔴 A MÉRT KORPUSZ (2026-09-12 éjjel): a nyitott mikrofon 722 érzékelést / 259 felvételt
  // termelt EGY este alatt (normál nap: 123/9), és ebből 16 volt valódi input. A kötegbe
  // jutott 36 átiratot felcímkéztem — 21 zaj / 15 valódi —, és a magyar-jel HIBÁTLANUL
  // szétvágta a kettőt (0/21 vs 15/15). Az alábbi példák MIND a valódi korpuszból vannak.

  /** A ma éjjeli korpusz zaj-tételei — szó szerint. */
  const NOISE_SAMPLES: string[] = [
    "It's fine.",
    'There I go.',
    'okay',
    'Yes.',
    'huh',
    'Tämä on varmasti päivä.',
    'Okay.',
    'Oh.',
    'Merci.',
    'Right.',
    'Go.',
    'Simple.',
    'What should I get?',
    'I think very good.',
    'about',
    'after that.',
    'People watch you go down.',
    'I want them to be good.',
  ];

  /** A ma éjjeli korpusz VALÓDI tételei — szó szerint (rövidítve). */
  const REAL_SAMPLES: string[] = [
    'Na mi a pék van? Semmi nem megy most már, teljesen nem működik.',
    'Na jó, tehát most jön az, hogy...',
    'Péntek este van, beszámíthatatlan vagyok egy kicsit, kicsit be vagyok ívva.',
    'Hashtag, azért, asszisztensi feladatok. Azt hiszem, most játszani fogok.',
    'Na akkor most jó napot kívánok, itt van a minta alap, meg a zaj alap.',
  ];

  it('🔴 a korpusz MINDEN zaj-tételét megjelöli', () => {
    for (const sample of NOISE_SAMPLES) {
      const verdict = inspectTranscript(sample);

      expect(verdict.isNoise).withContext(sample).toBeTrue();
      expect(verdict.suspicious).withContext(sample).toBeTrue();
    }
  });

  it('🔴 a korpusz EGYETLEN valódi tételét sem jelöli zajnak — ⛔ ez a drága hiba', () => {
    for (const sample of REAL_SAMPLES) {
      expect(inspectTranscript(sample).isNoise).withContext(sample).toBeFalsy();
    }
  });

  it('⭐ az indoklás MEGNEVEZI a hosszt, a szószámot és a nyelvet', () => {
    const verdict = inspectTranscript('There I go.');

    expect(verdict.reason ?? '').toContain('BULI-ZAJ');
    expect(verdict.reason ?? '').toContain('szó');
    expect(verdict.reason ?? '').toContain('NEM magyar');
  });

  it('⛔ a RÖVID MAGYAR választ NEM jelöli zajnak — a magyar-jel megvédi', () => {
    // 🔴 EZ A LEGFONTOSABB VÉDELEM: az owner legrövidebb válaszai a jóváhagyásai.
    for (const sample of ['Igen, csináld.', 'Jó lesz.', 'Nem kell.', 'Ez az.', 'Majd holnap.']) {
      expect(inspectTranscript(sample).isNoise).withContext(sample).toBeFalsy();
    }
  });

  it('⛔ az ÉKEZET NÉLKÜLI magyart sem jelöli zajnak — a szó-jel fogja meg', () => {
    // ⚠️ „Nem megy a dolog" — nincs benne ékezet, mégis magyar. A magyar-szó-lista védi.
    for (const sample of ['Nem megy a dolog', 'Ez az akkor jo lesz', 'Most kell hogy menjen']) {
      expect(inspectTranscript(sample).isNoise).withContext(sample).toBeFalsy();
    }
  });

  it('⛔ a HOSSZABB, nem magyar szöveget NEM jelöli zajnak — az owner kikötése', () => {
    // > „az owner használ angol szakszavakat, és egy hosszabb angol mondat lehet valódi"
    //
    // ⚠️ VÁLLALT CSERE: a mért korpuszon ez 2 zaj-tételt átenged (a 34 és a 94 karakterest).
    // ⭐ A fordított hiba drágább: egy valódi, hosszabb angol mondat eldobása.
    const long: string = "That's because we're doing a good job. I'll make you a wind of a movement.";
    const verdict = inspectTranscript(long);

    expect(verdict.isNoise).toBeFalsy();
  });

  it('a MÉRT küszöbök nem csúszhatnak el némán', () => {
    // 🔴 A számok a korpuszból jönnek: a valódi minimum 33 karakter / 7 szó volt, tehát
    // mindkét küszöb ALATTA van. Ha valaki átírja, itt bukjon el — és a MÉRÉST ismételje meg.
    expect(NOISE_MAX_CHARS).toBe(30);
    expect(NOISE_MAX_WORDS).toBe(6);
  });

  it('⭐ az angol SZAKSZÓ magyar mondatban érintetlen', () => {
    const sample: string = 'Akkor a deploy után nézd meg a pipeline-t, mert a build elhasalt.';

    expect(inspectTranscript(sample).isNoise).toBeFalsy();
  });
});

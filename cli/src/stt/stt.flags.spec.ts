import { collectFlags, describeFlags, findMishearings, looksTruncated } from './stt.flags.js';

describe('looksTruncated', () => {

  it('🔴 A MERT ESET: mondat kozben vegzodo atirat GYANUS', () => {
    // 2026-09-07: egy 32 mp-es uzenet atirata itt ert veget.
    expect(looksTruncated('be tudnad-e allitani az ENV-be generalt kulcsokat. Ehhez')).toBe(true);
  });

  it('a lezart mondat NEM gyanus', () => {
    expect(looksTruncated('Ez egy teljes mondat.')).toBe(false);
    expect(looksTruncated('Mukodik?')).toBe(false);
    expect(looksTruncated('Nagyszeru!')).toBe(false);
  });

  it('ures szovegre nem jelol', () => {
    expect(looksTruncated('   ')).toBe(false);
  });

  it('a haromponttal vegzodot lezartnak veszi', () => {
    expect(looksTruncated('Na de akkor…')).toBe(false);
  });
});

describe('findMishearings', () => {

  it('felismeri a CIC -> CI/CD felrehallast', () => {
    expect(findMishearings('vegig kell menjenek a CIC-ig').length).toBe(1);
  });

  it('🔴 felismeri az FTP templates -> FDP Templates felrehallast', () => {
    // Ez a LEGVESZELYESEBB: az FTP egy VALODI FDP-szolgaltatas, tehat vakon kovetve
    // a ROSSZ repoban kezdenek dolgozni.
    const found = findMishearings('FTP templates-be felvenni');

    expect(found.length).toBeGreaterThan(0);
    expect(found[0]?.likely).toBe('FDP Templates');
  });

  it('kis/nagybetutol fuggetlen', () => {
    expect(findMishearings('ftp TEMPLATES').length).toBeGreaterThan(0);
  });

  it('tiszta szovegben nem talal semmit', () => {
    expect(findMishearings('Ez egy teljesen rendes magyar mondat.').length).toBe(0);
  });
});

describe('collectFlags + describeFlags', () => {

  it('MINDIG jelzi, hogy gepi atirat', () => {
    expect(collectFlags('barmi.').machineTranscribed).toBe(true);
    expect(describeFlags(collectFlags('barmi.'))).toContain('gépi átirat');
  });

  it('a gyanus tagolast KIEMELTEN jelzi', () => {
    // ⚠️ A szoveg SZANDEKOSAN nem allitja, hogy hianyzik a vege: az owner megerositette
    // (2026-09-07), hogy egy ilyen esetben valojaban a PONT kerult rossz helyre. A ket ok
    // kulonbozo, a helyes reakcio viszont ugyanaz — visszakerdezni.
    const text = describeFlags(collectFlags('valami ami nem fejezodik be es'));

    expect(text).toContain('GYANÚS TAGOLÁS');
    expect(text).toContain('rossz helyen a pont');
  });

  it('a felrehallast a VALOSZINU eredetivel egyutt mutatja', () => {
    const text = describeFlags(collectFlags('menjen at a CIC-ig.'));

    expect(text).toContain('CI/CD');
  });

  it('⛔ a szoveget NEM irja at — csak megjelol', () => {
    // A flagek kulon sorban allnak; az atirat valtozatlan marad.
    const original = 'menjen at a CIC-ig.';

    expect(describeFlags(collectFlags(original))).not.toBe(original);
  });
});

describe('| describeFlags — 🧩 a DARABOLÁS kimondva', () => {

  it('egyetlen hívásnál ⛔ NEM ír darabolást — nincs mit mondani róla', () => {
    const text: string = describeFlags(collectFlags('Teljes mondat.'));

    expect(text).not.toContain('részletben');
  });

  it('⭐ több részletnél KIMONDJA, és megmondja az OKÁT is', () => {
    const text: string = describeFlags(collectFlags('Első. Második.', {
      parts: 3,
      failedParts: 0,
      midSpeechCuts: 0,
      windowSecs: 30,
    }));

    expect(text).toContain('3 részletben');
    // ⚠️ Az ok nélkül a jelzés csak zaj lenne: az owner nem tudná, MIÉRT volt darabolás.
    expect(text).toContain('30 mp');
  });

  it('🔴 az ELBUKOTT részletet HIÁNYOS-ként mondja ki — ⛔ nem elegánsan elhallgatva', () => {
    const text: string = describeFlags(collectFlags('Csak az első rész.', {
      parts: 3,
      failedParts: 1,
      midSpeechCuts: 0,
      windowSecs: 30,
    }));

    expect(text).toContain('ELBUKOTT');
    expect(text).toContain('HIÁNYOS');
  });

  it('a beszéd közbeni vágást is jelzi — ott szó csúszhatott el', () => {
    const text: string = describeFlags(collectFlags('Valami szöveg.', {
      parts: 2,
      failedParts: 0,
      midSpeechCuts: 1,
      windowSecs: 30,
    }));

    expect(text).toContain('beszéd közben');
  });

  it('a gépi-átirat jelölés MINDIG megmarad a darabolás mellett is', () => {
    const text: string = describeFlags(collectFlags('Szöveg.', {
      parts: 2,
      failedParts: 0,
      midSpeechCuts: 0,
      windowSecs: 30,
    }));

    expect(text).toContain('gépi átirat');
  });
});

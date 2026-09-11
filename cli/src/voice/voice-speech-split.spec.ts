// A darabolás tesztjei.
//
// > **Owner, 2026-09-11 01:28 (hang):** *„az üzeneteidnél most így levágja a végét, és azt
// > mondja, hogy a folytatás írásban… szét kéne bontani… lehetőleg **ne [vágjunk] le semmit**."*
//
// ⭐ A NÉGY ÁLLÍTÁS, AMI MIATT EZ A MODUL LÉTEZIK:
//   (a) 🔴 **NULLA VESZTESÉG** — a darabok összefűzve **karakterre** ugyanazt adják;
//   (b) a határ **mondathatár**, tartalékban **szóhatár**, ⛔ szó közepén SOHA;
//   (c) a **darabszám** egyszer, az elején hangzik el, ⛔ nem minden rész végén;
//   (d) a `SPEECH_MAX_CHARS` a **darab** mérete, ⛔ nem a teljes szövegé.

import { VoiceSpeechSplit_Util } from './voice-speech-split.js';

/** A darabok összefűzése — a veszteség-ellenőrzéshez. */
function rejoin(parts: string[]): string {
  return parts.join(' ');
}

describe('VoiceSpeechSplit_Util.split — 🔴 NULLA VESZTESÉG', () => {

  it('⭐ a darabok összefűzve KARAKTERRE ugyanazt adják', () => {
    // Ez a teszt lényege: a darabolás ⛔ nem veszít. A régi kód a 700 fölötti részt ELDOBTA.
    const text: string = `${'Ez egy teljes mondat. '.repeat(80)}A vége itt van.`.trim();
    const parts: string[] = VoiceSpeechSplit_Util.split(text);

    expect(parts.length).toBeGreaterThan(1);
    expect(rejoin(parts)).toBe(text);
  });

  it('🔴 a szöveg VÉGE is elhangzik — itt veszett el korábban', () => {
    const text: string = `${'Mondat. '.repeat(200)}EZ-A-LEGVEGE.`.trim();
    const parts: string[] = VoiceSpeechSplit_Util.split(text);

    expect(parts[parts.length - 1]).toContain('EZ-A-LEGVEGE.');
  });

  it('⛔ EGYETLEN darab sem hosszabb a határnál', () => {
    const text: string = 'Ez egy teljes mondat. '.repeat(120);

    for (const part of VoiceSpeechSplit_Util.split(text)) {
      expect(part.length).toBeLessThanOrEqual(VoiceSpeechSplit_Util.MAX_PART_CHARS);
    }
  });

  it('a határ ALATTI szöveg EGY darab marad — ⛔ nem bontjuk fel ok nélkül', () => {
    expect(VoiceSpeechSplit_Util.split('Kész a javítás.')).toEqual(['Kész a javítás.']);
  });

  it('üres bemenetre ÜRES lista — ⛔ nem egy üres darab', () => {
    expect(VoiceSpeechSplit_Util.split('')).toEqual([]);
    expect(VoiceSpeechSplit_Util.split('   ')).toEqual([]);
  });
});

describe('VoiceSpeechSplit_Util.split — a HATÁROK', () => {

  it('⭐ MONDATHATÁRON vág — minden darab írásjellel zárul', () => {
    // Hangban a mondathatár az egyetlen természetes vágás; egy félbeszakadt mondat
    // félreérthető.
    const parts: string[] = VoiceSpeechSplit_Util.split('Ez egy teljes mondat. '.repeat(100));

    for (const part of parts) {
      expect(part.endsWith('.')).toBeTrue();
    }
  });

  it('a KÉRDŐJEL és a FELKIÁLTÓJEL is mondatvég — a tagolás megmarad', () => {
    const text: string = `${'Kérdés? Felkiáltás! '.repeat(60)}Vég.`;
    const parts: string[] = VoiceSpeechSplit_Util.split(text);

    expect(parts.length).toBeGreaterThan(1);
    // ⚠️ Az írásjel a mondatnál MARAD — enélkül egy kérdés kijelentéssé válna hangban.
    expect(rejoin(parts)).toContain('Kérdés?');
    expect(rejoin(parts)).toContain('Felkiáltás!');
  });

  it('🔴 SZÓ KÖZEPÉN SOHA — a hosszú mondat szóhatáron bomlik', () => {
    // Tartalék-ág: egy mondat maga hosszabb a határnál (pl. pontok nélküli felsorolás).
    const text: string = 'alma '.repeat(400).trim();
    const parts: string[] = VoiceSpeechSplit_Util.split(text);

    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) {
      // Minden darab csak ÉP „alma" szavakból áll — ⛔ nincs „al" vagy „ma".
      for (const word of part.split(' ')) {
        expect(word).toBe('alma');
      }
    }
    expect(rejoin(parts)).toBe(text);
  });

  it('⚠️ egy EGYETLEN szó, ami hosszabb a határnál, SAJÁT darabot kap — ⛔ nem csonkolva', () => {
    // Jobb egy hosszú darab, mint egy elveszett. (Pl. egy beillesztett hosszú azonosító.)
    const monster: string = 'x'.repeat(VoiceSpeechSplit_Util.MAX_PART_CHARS + 100);
    const parts: string[] = VoiceSpeechSplit_Util.split(`Előtte. ${monster} Utána.`);

    expect(parts.some((p: string): boolean => p === monster)).toBeTrue();
    expect(rejoin(parts)).toContain('Utána.');
  });

  it('a SORREND az eredeti — ⛔ semmi nem csavarodik össze', () => {
    const text: string = Array.from({ length: 120 }, (_v: unknown, i: number): string => `Mondat${i}.`)
      .join(' ');
    const parts: string[] = VoiceSpeechSplit_Util.split(text);

    expect(rejoin(parts)).toBe(text);
    expect(parts[0]?.startsWith('Mondat0.')).toBeTrue();
  });
});

describe('VoiceSpeechSplit_Util.describeParts — a darabszám EGYSZER', () => {

  it('⭐ több darabnál BEMONDJA a darabszámot', () => {
    // A feladat kikötése: „a darabszám hangozzon el egyszer az elején (»négy részben mondom«)".
    expect(VoiceSpeechSplit_Util.describeParts(4)).toBe('négy részben mondom.');
    expect(VoiceSpeechSplit_Util.describeParts(2)).toBe('két részben mondom.');
  });

  it('⛔ EGY darabnál NEM mond semmit — az „egy részben mondom" zaj', () => {
    expect(VoiceSpeechSplit_Util.describeParts(1)).toBe('');
    expect(VoiceSpeechSplit_Util.describeParts(0)).toBe('');
  });

  it('⚠️ NAGYON sok darabnál sem mond számot — az elbátortalanít, nem segít', () => {
    // Ilyenkor amúgy is a KÜLDÖTT ÜZENET hossza a hiba, nem a felolvasás.
    expect(VoiceSpeechSplit_Util.describeParts(17)).toBe('');
  });
});

describe('VoiceSpeechSplit_Util.toSpokenParts — ez megy a sorba', () => {

  it('⭐ a bemondás az ELSŐ darab elejére kerül — ⛔ nem külön tételként', () => {
    // Külön tételként a sor egy önálló „négy részben mondom." darabot látna, és a
    // lejátszás-váltás miatt szünet lenne a bemondás és a tartalom között.
    const text: string = 'Ez egy teljes mondat. '.repeat(100);
    const spoken: string[] = VoiceSpeechSplit_Util.toSpokenParts(text);

    expect(spoken[0]?.startsWith('részben mondom.')).toBeFalse();
    expect(spoken[0]).toContain('részben mondom.');
    expect(spoken[0]).toContain('Ez egy teljes mondat.');
  });

  it('EGY darabnál nincs bemondás — a szöveg változatlan', () => {
    expect(VoiceSpeechSplit_Util.toSpokenParts('Kész a javítás.')).toEqual(['Kész a javítás.']);
  });

  it('🔴 a bemondással EGYÜTT sem veszik el tartalom', () => {
    const text: string = `${'Mondat. '.repeat(150)}UTOLSO-SZO.`.trim();
    const spoken: string[] = VoiceSpeechSplit_Util.toSpokenParts(text);

    expect(spoken[spoken.length - 1]).toContain('UTOLSO-SZO.');
    // ⭐ A bemondáson KÍVÜL minden karakter megvan.
    expect(rejoin(spoken).replace(/^\S+ részben mondom\. /u, '')).toBe(text);
  });

  it('üres bemenetre üres lista', () => {
    expect(VoiceSpeechSplit_Util.toSpokenParts('   ')).toEqual([]);
  });
});

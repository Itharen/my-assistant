// 🔒 A BESZÉD-ÉSZLELÉS LESZÖGEZÉSE — jellemző-tesztek (characterization tests).
//
// > **Owner, 2026-09-11 04:11 (szó szerint):** *„a voice inputunknál, amit **importáltunk a
// > CCAP-ból**, hogy **mikor beszélek, mikor nem**, az **kurva jól működik** — azt amúgy
// > **nagyon alaposan rögzítenünk is kéne, körbeírni, nagyon alaposan tesztekkel fixálni a
// > funkcionalitást**."*
//
// ## 🔴 A MÉRT ÁLLAPOT, AMIÉRT EZ A FÁJL LÉTEZIK (2026-09-11 06:52)
//
// | mérés | érték |
// |---|---|
// | `cli/src/_modules/voice/` — fájlok | **37 db, 6 681 sor** |
// | ebből `cv-recording.control-service.ts` | 1 322 sor |
// | 🔴 spec-fájlok ebben a fában | **0** ← *nulla* |
//
// ⇒ **A rendszer legjobban működő darabja volt a legvédetlenebb.** Bármely jövőbeli mozdulat
// **némán** elronthatta, és **semmi nem szólt volna**.
//
// ## ⛔ EZ A FÁJL A MIÉNK — az ÁTEMELT kód érintetlen
//
// ⚠️ A név **szándékosan NEM `cv-`** előtagú: az a prefix az **átemelt** CCAP-kódot jelöli.
// Ez a fájl **a mi tesztünk**, és csak azért van **ebben** a könyvtárban, mert a fő build
// `strict` programja ⛔ **kizárja** a `src/_modules`-t *(`tsconfig.json` `exclude`)* — a
// jellemző-teszt viszont **ugyanazzal a laza szerződéssel** kell fordulnia, mint a
// leszögezett kód *(`tsconfig.transplanted.json`)*.
//
// 🔴 **A HATÁR (`transplant-not-rewrite`):** a `cv-*.ts` fájlokon a `git diff` **ÜRES**.
// ⛔ Nem refaktoráltunk, ⛔ nem neveztünk át, és ⛔ **nem hangoltuk a küszöböket** — ez a teszt
// azt rögzíti, ami **VAN**, ⛔ nem amit szebbnek gondolnánk.
//
// ## ⚠️ AMIT EZ A TESZT NEM TUD LESZÖGEZNI — és miért
//
// A feladat *„beszéd → 1 s csend → beszéd → **két** szegmens"* tesztet is kért. ⭐ **MÉRVE
// (`cv-recording.control-service.ts:113`):** a szegmens-határt ⛔ **nem a mi kódunk** húzza meg,
// hanem a `@discordjs/voice` **receivere**:
//
// ```ts
// receiver.subscribe(userId, { end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 } });
// ```
//
// ⇒ A *„mikor ér véget egy megszólalás"* döntés a **Discord SDK-jában** van, nem nálunk. Egy
// ilyen teszt tehát **a Discordot tesztelné**, ⛔ nem a mi viselkedésünket — és élő hang-kapcsolat
// nélkül nem is futtatható. **Amit MI döntünk el**, az a **keret-szintű** beszéd-ítélet
// *(hangerő + ZCR)* és a **ZCR-szűrés** — ⭐ pontosan ezt szögezi le ez a fájl.
//
// A teljes körbeírás: `__documentations/dev/VOICE_SPEECH_DETECTION.md`.

import { CV_VoiceUtils } from './_collections/cv-voice.utils.js';
import { CV_voiceRecordingConfig } from './_collections/consts/cv-voice-recording.const.js';

/** Egy 16 bites, little-endian PCM-puffer a megadott minta-értékekből. */
function pcmBuffer(samples: number[]): Buffer {
  const buffer: Buffer = Buffer.alloc(samples.length * 2);

  samples.forEach((value: number, index: number): void => {
    buffer.writeInt16LE(Math.round(value * 32768), index * 2);
  });

  return buffer;
}

describe('🔒 Beszéd-észlelés — a MINTA-KINYERÉS leszögezése', () => {

  it('a 16 bites little-endian mintát -1..1-re normalizálja', () => {
    // MÉRT viselkedés: `buffer.readInt16LE(i) / 32768`.
    const samples: number[] = CV_VoiceUtils.extractSamples(pcmBuffer([0, 0.5, -0.5]));

    expect(samples.length).toBe(3);
    expect(samples[0]).toBe(0);
    expect(samples[1]).toBeCloseTo(0.5, 4);
    expect(samples[2]).toBeCloseTo(-0.5, 4);
  });

  it('⚠️ a PÁRATLAN utolsó bájtot ELDOBJA — ⛔ nem dob hibát', () => {
    // A ciklus `i + 1 < buffer.length`-et követel ⇒ a fél minta kimarad. Ez a MÉRT
    // viselkedés; egy jövőbeli „javítás" itt csendben megváltoztatná a minta-számot.
    expect(CV_VoiceUtils.extractSamples(Buffer.from([0x00, 0x10, 0x7f])).length).toBe(1);
  });

  it('üres puffer → üres minta-lista', () => {
    expect(CV_VoiceUtils.extractSamples(Buffer.alloc(0))).toEqual([]);
  });
});

describe('🔒 Beszéd-észlelés — a HANGERŐ (RMS) leszögezése', () => {

  it('a CSEND RMS-e nulla', () => {
    expect(CV_VoiceUtils.calculateRMS([0, 0, 0, 0])).toBe(0);
  });

  it('üres mintára 0 — ⛔ nem NaN', () => {
    // ⚠️ Egy `NaN` itt végigfolyna a küszöb-összehasonlításokon, és MINDEN összehasonlítás
    // hamis lenne ⇒ a beszéd sosem érné el a küszöböt, NÉMÁN.
    expect(CV_VoiceUtils.calculateRMS([])).toBe(0);
  });

  it('⭐ az RMS a négyzetes közép — mért képlet', () => {
    // sqrt((0.6² + (-0.8)²) / 2) = sqrt(0.5) ≈ 0.7071
    expect(CV_VoiceUtils.calculateRMS([0.6, -0.8])).toBeCloseTo(Math.sqrt(0.5), 6);
  });

  it('🔴 a beszéd-küszöb a MÉRT 0,008 — ez a „mikor beszélek" alapja', () => {
    // ⛔ EZT NEM HANGOLJUK. Az owner: „kurva jól működik" — a teszt azt rögzíti, ami VAN.
    expect(CV_voiceRecordingConfig.speechThreshold).toBe(0.008);
  });

  it('⭐ egy halk, de beszéd-szintű keret ÁTMEGY a küszöbön; a csend NEM', () => {
    const quietSpeech: number = CV_VoiceUtils.calculateRMS([0.02, -0.02, 0.02, -0.02]);
    const silence: number = CV_VoiceUtils.calculateRMS([0.001, -0.001, 0.001]);

    expect(quietSpeech).toBeGreaterThan(CV_voiceRecordingConfig.speechThreshold);
    expect(silence).toBeLessThan(CV_voiceRecordingConfig.speechThreshold);
  });
});

describe('🔒 Beszéd-észlelés — a ZCR (nulla-átmenet) leszögezése', () => {

  it('az ÁLLANDÓ jel ZCR-je nulla', () => {
    expect(CV_VoiceUtils.calculateZeroCrossings([0.5, 0.5, 0.5, 0.5])).toBe(0);
  });

  it('2-nél rövidebb mintára 0 — ⛔ nem hibázik', () => {
    expect(CV_VoiceUtils.calculateZeroCrossings([])).toBe(0);
    expect(CV_VoiceUtils.calculateZeroCrossings([0.5])).toBe(0);
  });

  it('⭐ minden előjel-váltás EGY átmenet', () => {
    // +,-,+,- ⇒ három váltás.
    expect(CV_VoiceUtils.calculateZeroCrossings([0.5, -0.5, 0.5, -0.5])).toBe(3);
  });

  it('🔴 a PONTOS NULLA is átmenetnek számít negatív után — MÉRT különcség', () => {
    // A feltétel: `prev < 0 && cur >= 0`. Tehát a `0` „nem-negatívnak" számít.
    // ⚠️ Ez apróságnak tűnik, de egy néma jelnél (csupa 0) egy negatív keret után
    // átmenetet ad — és a ZCR-alapú ítélet ezen áll.
    expect(CV_VoiceUtils.calculateZeroCrossings([-0.5, 0])).toBe(1);
    // ⛔ De pozitív után a 0 is átmenet (`prev > 0 && cur <= 0`).
    expect(CV_VoiceUtils.calculateZeroCrossings([0.5, 0])).toBe(1);
  });

  it('a magas frekvenciájú jel ZCR-je NAGYOBB, mint az alacsonyé', () => {
    const high: number = CV_VoiceUtils.calculateZeroCrossings([1, -1, 1, -1, 1, -1, 1, -1]);
    const low: number = CV_VoiceUtils.calculateZeroCrossings([1, 1, 1, 1, -1, -1, -1, -1]);

    expect(high).toBeGreaterThan(low);
  });
});

describe('🔒 A ZCR-SZŰRÉS leszögezése — ⚠️ a legkevésbé kézenfekvő viselkedés', () => {

  const GATE: number = 0.05;

  it(`🔴 ${CV_voiceRecordingConfig.zcrFilteringCount}+ egymást követő nem-zöld keret után MINDENT ELDOB INNENTŐL`, () => {
    // ⭐ EZ A LEGFONTOSABB LESZÖGEZÉS. A függvény ⛔ NEM csak a rossz futamot veszi ki:
    // `break`-kel KILÉP, és a maradékot is **eldobja**. Aki ezt nem tudja, azt hiszi,
    // hogy csak a zajos rész esik ki — pedig a mögötte lévő ÉP beszéd is.
    const green: number[] = [0.3, 0.3, 0.3];
    const red: number[] = new Array(CV_voiceRecordingConfig.zcrFilteringCount).fill(0.01);
    const tail: number[] = [0.3, 0.3];
    const zcr: number[] = [...green, ...red, ...tail];
    const volume: number[] = zcr.map((): number => 0.2);
    const result = CV_VoiceUtils.filterLongNonGreenSequences(zcr, volume, GATE);

    expect(result.filteredZcr).toEqual(green);
    // A piros futam + a MÖGÖTTE lévő minden keret eltávolítva.
    expect(result.removedCount).toBe(red.length + tail.length);
  });

  it(`⭐ a ${CV_voiceRecordingConfig.zcrFilteringCount}-nél RÖVIDEBB nem-zöld futamot MEGTARTJA`, () => {
    // A beszéd közbeni rövid szünet NEM zaj — ha kidobnánk, szétesne a szegmens.
    const zcr: number[] = [0.3, 0.01, 0.01, 0.3];
    const volume: number[] = [0.2, 0.1, 0.1, 0.2];
    const result = CV_VoiceUtils.filterLongNonGreenSequences(zcr, volume, GATE);

    expect(result.filteredZcr).toEqual(zcr);
    expect(result.removedCount).toBe(0);
  });

  it('a hangerő-puffer a ZCR-rel EGYÜTT szűrődik — a két lista szinkronban marad', () => {
    // ⚠️ Ha szétcsúsznának, a hangerő-statisztika MÁS keretekre vonatkozna, mint a ZCR —
    // és az ítélet két különböző dologból állna össze.
    const zcr: number[] = [0.3, 0.01, 0.3];
    const volume: number[] = [0.9, 0.1, 0.8];
    const result = CV_VoiceUtils.filterLongNonGreenSequences(zcr, volume, GATE);

    expect(result.filteredZcr.length).toBe(result.filteredVolume.length);
    expect(result.filteredVolume).toEqual(volume);
  });

  it('a CSUPA ZÖLD puffer változatlanul jön vissza', () => {
    const zcr: number[] = [0.3, 0.4, 0.5];
    const result = CV_VoiceUtils.filterLongNonGreenSequences(zcr, [0.2, 0.2, 0.2], GATE);

    expect(result.filteredZcr).toEqual(zcr);
    expect(result.removedCount).toBe(0);
  });

  it('üres puffer → üres eredmény, 0 eltávolítva', () => {
    const result = CV_VoiceUtils.filterLongNonGreenSequences([], [], GATE);

    expect(result.filteredZcr).toEqual([]);
    expect(result.removedCount).toBe(0);
  });
});

describe('🔒 A TÖBBSÉGI-ZÖLD validáció leszögezése', () => {

  const GATE: number = 0.05;

  it('⭐ a többségében zöld puffer ÉRVÉNYES', () => {
    const verdict = CV_VoiceUtils.validateMajorityGreenZCR([0.3, 0.3, 0.01], GATE);

    expect(verdict.isValid).toBeTrue();
    expect(verdict.goodCount).toBe(2);
    expect(verdict.totalCount).toBe(3);
    expect(verdict.goodRatio).toBeCloseTo(2 / 3, 6);
  });

  it('🔴 a PONTOSAN 50% NEM érvényes — a küszöb SZIGORÚ (`> 0.5`)', () => {
    // ⚠️ MÉRT különcség: a fele-fele eset ELBUKIK. Egy `>=`-re váltás itt csendben
    // megváltoztatná, mi számít beszédnek.
    const verdict = CV_VoiceUtils.validateMajorityGreenZCR([0.3, 0.01], GATE);

    expect(verdict.goodRatio).toBe(0.5);
    expect(verdict.isValid).toBeFalse();
  });

  it('a kapuval EGYENLŐ érték ZÖLDNEK számít (`>= zcrGate`)', () => {
    expect(CV_VoiceUtils.validateMajorityGreenZCR([GATE, GATE], GATE).goodCount).toBe(2);
  });

  it('⛔ az ÜRES puffer érvénytelen — ⛔ nem osztunk nullával', () => {
    const verdict = CV_VoiceUtils.validateMajorityGreenZCR([], GATE);

    expect(verdict.isValid).toBeFalse();
    expect(verdict.goodRatio).toBe(0);
    expect(verdict.totalCount).toBe(0);
  });
});

describe('🔒 A MÉRT KONFIGURÁCIÓ leszögezése — ⛔ ezeket nem hangoljuk', () => {

  // > Owner: *„kurva jól működik"* ⇒ ezek az értékek **most jók**. A teszt a **jelenlegit**
  // rögzíti: ha valaki hozzájuk nyúl, azt ⛔ nem csendben teheti.

  it('a keret-megerősítés: 2 keret beszédhez, 3 csendhez', () => {
    // ⭐ ASZIMMETRIKUS, és ez szándékos: a beszéd kezdetét gyorsan akarjuk elkapni, a
    // végét viszont óvatosabban — különben a szó közbeni levegővétel szegmenst zárna.
    expect(CV_voiceRecordingConfig.speechConfirmationFrames).toBe(2);
    expect(CV_voiceRecordingConfig.silenceConfirmationFrames).toBe(3);
  });

  it('az időzítés: minimum 100 ms beszéd, maximum 30 s felvétel', () => {
    expect(CV_voiceRecordingConfig.minSpeechDuration).toBe(100);
    expect(CV_voiceRecordingConfig.maxRecordingDuration).toBe(30_000);
  });

  it('a hangerő-puffer 50 keret', () => {
    expect(CV_voiceRecordingConfig.volumeBufferSize).toBe(50);
  });

  it('🔴 a ZCR-szűrés hossza a MÉRT 10 keret', () => {
    // ⭐ EZT A SAJÁT POZITÍV KONTROLLOM HOZTA ELŐ: a szűrés-tesztek a tömböt **a configból**
    // építik (`new Array(zcrFilteringCount)`), ezért 10 → 3 átállításra **NEM buktak el**.
    // ⇒ A kapcsolatot leszögezték, az ÉRTÉKET nem. Ez a sor zárja be a rést.
    //
    // ⚠️ Miért számít: ez a szám dönti el, mennyi zaj után dobjuk el a MARADÉK beszédet is.
    // Lejjebb véve a rendszer sokkal agresszívebben vágna — csendben.
    expect(CV_voiceRecordingConfig.zcrFilteringCount).toBe(10);
  });

  it('a Discord-formátum: 48 kHz, sztereó, 16 bit', () => {
    expect(CV_voiceRecordingConfig.samplingFrequency).toBe(48_000);
    expect(CV_voiceRecordingConfig.channels).toBe(2);
    expect(CV_voiceRecordingConfig.bitDepth).toBe(16);
  });

  it('⚠️ a `zcrValidationThreshold` KI VAN KAPCSOLVA — a kódban kikommentezve', () => {
    // 🔴 MÉRT LELET: a feladat-leírás a „zcrValidationThreshold szerepét" kérte — a valóság
    // az, hogy az érték a forrásban **kikommentezve** áll, tehát NINCS hatása.
    // ⇒ A Whisper-küldés előtti ZCR-validáció helyét a TÖBBSÉGI-ZÖLD ellenőrzés vette át.
    //
    // Szerkezeti olvasas, `as` atcimkezes NELKUL: azt allitjuk, hogy a kulcs NINCS OTT.
    expect(Object.keys(CV_voiceRecordingConfig)).not.toContain('zcrValidationThreshold');
    expect(Object.keys(CV_voiceRecordingConfig)).not.toContain('zcrMaxRedGapLength');
  });

  it('az adaptív ZCR arányai és szorzói', () => {
    expect(CV_voiceRecordingConfig.zcrAdaptiveHighRatio).toBe(0.8);
    expect(CV_voiceRecordingConfig.zcrAdaptiveMediumRatio).toBe(0.6);
    expect(CV_voiceRecordingConfig.zcrAdaptiveHighMultiplier).toBe(0.8);
    expect(CV_voiceRecordingConfig.zcrAdaptiveMediumMultiplier).toBe(0.9);
  });
});

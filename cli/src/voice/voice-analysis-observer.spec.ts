// A megfigyelő tesztjei.
//
// 🔴 A LEGFONTOSABB ÁLLÍTÁS ITT: *„a diagnosztika sosem buktathatja meg azt, amit megfigyel"*.
// Mért precedens ugyanebben a láncban: egy megszólalás-számláló `?.` nélkül megölte volna a
// felvételt. Ezért a burkoló minden hibája **itt** kell kiderüljön, ne élesben.

import { VoiceAnalysisBar, type AnalysisFrame } from './voice-analysis-bar.js';
import {
  attachAnalysisBar,
  attachAnalysisBarSafely,
  type AnalyzerLike,
} from './voice-analysis-observer.js';

/** Egy elemző-utánzat, ami számolja a hívásokat. */
function fakeAnalyzer(result: AnalysisFrame = { isSpeech: true, zcrNormalized: 0.5 }): {
  analyzer: AnalyzerLike;
  calls: () => number;
} {
  let calls: number = 0;

  return {
    analyzer: {
      analyzeAudio: (): AnalysisFrame => {
        calls += 1;

        return result;
      },
    },
    calls: (): number => calls,
  };
}

function collectingBar(): { bar: VoiceAnalysisBar; frames: () => number } {
  let pushed: number = 0;

  const bar: VoiceAnalysisBar = new VoiceAnalysisBar((): void => undefined);
  const original = bar.push.bind(bar);

  bar.push = (frame: AnalysisFrame): void => {
    pushed += 1;
    original(frame);
  };

  return { bar: bar, frames: (): number => pushed };
}

describe('attachAnalysisBar — kívülről ülünk rá, az átemelt kód érintése nélkül', () => {

  it('⭐ az EREDETI eredményt adja vissza, változatlanul', () => {
    // 🔴 Ha a burkoló megváltoztatná a visszatérést, a felvevő döntése romlana el —
    // a megfigyelés megváltoztatná a megfigyeltet.
    const expected: AnalysisFrame = { isSpeech: true, zcrNormalized: 0.42 };
    const { analyzer } = fakeAnalyzer(expected);

    attachAnalysisBar(analyzer, collectingBar().bar);

    expect(analyzer.analyzeAudio(Buffer.from([1, 2, 3]))).toEqual(expected);
  });

  it('az eredetit PONTOSAN egyszer hívja keretenként', () => {
    const { analyzer, calls } = fakeAnalyzer();

    attachAnalysisBar(analyzer, collectingBar().bar);
    analyzer.analyzeAudio(Buffer.from([1]));

    expect(calls()).toBe(1);
  });

  it('minden keretet továbbad a sávnak', () => {
    const { analyzer } = fakeAnalyzer();
    const { bar, frames } = collectingBar();

    attachAnalysisBar(analyzer, bar);
    analyzer.analyzeAudio(Buffer.from([1]));
    analyzer.analyzeAudio(Buffer.from([2]));

    expect(frames()).toBe(2);
  });

  it('⚠️ ugyanazt a példányt csak EGYSZER burkolja', () => {
    // Minden újracsatlakozás újra rákötne — és akkor egy keretből kettő lenne a sávban.
    const { analyzer } = fakeAnalyzer();
    const { bar, frames } = collectingBar();

    expect(attachAnalysisBar(analyzer, bar)).toBeTrue();
    expect(attachAnalysisBar(analyzer, bar)).toBeFalse();

    analyzer.analyzeAudio(Buffer.from([1]));

    expect(frames()).toBe(1);
  });

  it('🔴 a SÁV hibája NEM terjed a felvevő felé', () => {
    const expected: AnalysisFrame = { isSpeech: false, zcrNormalized: 0.1 };
    const { analyzer } = fakeAnalyzer(expected);
    const bar: VoiceAnalysisBar = new VoiceAnalysisBar((): void => undefined);

    bar.push = (): void => {
      throw new Error('a sáv elhasalt');
    };

    // ⚠️ NÉMA nyelő: enélkül ez a szándékos hiba a VALÓDI akció-naplóba kerülne — mérve
    // 2026-09-08, hogy a teszt-suite így 22 hamis üzemi hibát írt a mai napi naplóba.
    attachAnalysisBar(analyzer, bar, (): void => undefined);

    // ⛔ Enélkül egy sáv-hiba MEGÖLNÉ a felvételt — pontosan az a hibaosztály, amit a
    // DEV-HANDOFF kemény korlátként tilt.
    expect((): AnalysisFrame => analyzer.analyzeAudio(Buffer.from([1]))).not.toThrow();
    expect(analyzer.analyzeAudio(Buffer.from([1]))).toEqual(expected);
  });
});

describe('attachAnalysisBarSafely — a betöltés bukása sem fatális', () => {

  it('sikeres betöltésnél rákötés történik', async (): Promise<void> => {
    const { analyzer } = fakeAnalyzer();

    const attached: boolean = await attachAnalysisBarSafely({
      load: async (): Promise<AnalyzerLike | null> => analyzer,
      bar: collectingBar().bar,
    });

    expect(attached).toBeTrue();
  });

  it('⚠️ hiányzó elemzőnél NEM dob — de NEM is hallgat', async (): Promise<void> => {
    let reported: string = '';

    const attached: boolean = await attachAnalysisBarSafely({
      load: async (): Promise<AnalyzerLike | null> => null,
      bar: collectingBar().bar,
      onError: (detail: string): void => void (reported = detail),
    });

    expect(attached).toBeFalse();
    // ⛔ A néma elnyelés tilos: az ownernek tudnia kell, miért nincs sáv.
    expect(reported).toContain('NEM fog megjelenni');
  });

  it('🔴 a betöltés DOBÁSA sem fatális — a felvétel megy tovább', async (): Promise<void> => {
    let reported: string = '';

    const attached: boolean = await attachAnalysisBarSafely({
      load: async (): Promise<AnalyzerLike | null> => {
        throw new Error('a modul nem tölthető be');
      },
      bar: collectingBar().bar,
      onError: (detail: string): void => void (reported = detail),
    });

    expect(attached).toBeFalse();
    expect(reported).toContain('ÉRINTETLEN');
    expect(reported).toContain('a modul nem tölthető be');
  });
});

// Az élő, keretenkénti színes sáv tesztjei (T-52).
//
// 🔴 MIÉRT SZÁMÍT: az owner a döntés **folyamatát** kérte, nem az eredményét — hogy beszéd
// közben lássa, épp beszédnek minősül-e, amit mond. Egy hibás sáv rosszabb a semminél: azt
// hinné, hogy hangosabban kell beszélnie, miközben a hiba máshol van.

import {
  BAR_WIDTH,
  classifyFrame,
  longestGreenRun,
  MIN_GREEN_RUN,
  renderBar,
  summarizeSegment,
  VoiceAnalysisBar,
  ZCR_GATE,
  type AnalysisFrame,
  type FrameVerdict,
} from './voice-analysis-bar.js';

const GREEN: string = '\x1b[32m';
const YELLOW: string = '\x1b[33m';
const RED: string = '\x1b[31m';

function frames(pattern: string): AnalysisFrame[] {
  // `g` = beszéd · `y` = határeset · `r` = csend
  return [...pattern].map((char: string): AnalysisFrame => {
    if (char === 'g') return { isSpeech: true, zcrNormalized: 0.5 };
    if (char === 'y') return { isSpeech: false, zcrNormalized: ZCR_GATE * 0.95 };

    return { isSpeech: false, zcrNormalized: 0.05 };
  });
}

function verdicts(pattern: string): FrameVerdict[] {
  return frames(pattern).map(classifyFrame);
}

describe('classifyFrame — a keret besorolása', () => {

  it('⭐ a ZÖLD a felvevő TÉNYLEGES döntése, nem a mi rekonstrukciónk', () => {
    // 🔴 EZ A LEGFONTOSABB ÁLLÍTÁS: ha saját képlettel színeznénk, a sáv elcsúszhatna attól,
    // amit a felvevő valójában csinál — és akkor a sáv HAZUDNA arról, amit megfigyel.
    // Alacsony ZCR mellett is ZÖLD, ha az elemző beszédnek mondta.
    expect(classifyFrame({ isSpeech: true, zcrNormalized: 0.01 })).toBe('speech');
  });

  it('a sárga csak árnyalat: nem beszéd, de közel volt', () => {
    expect(classifyFrame({ isSpeech: false, zcrNormalized: ZCR_GATE * 0.95 })).toBe('edge');
  });

  it('a csend piros', () => {
    expect(classifyFrame({ isSpeech: false, zcrNormalized: 0.05 })).toBe('silence');
  });

  it('a küszöb HATÁRÁN nem billen sárgába — szigorúan fölötte kell lennie', () => {
    expect(classifyFrame({ isSpeech: false, zcrNormalized: ZCR_GATE * 0.9 })).toBe('silence');
  });
});

describe('renderBar — amit az owner LÁT', () => {

  it('`|` jeleket ad, ahogy kérte', () => {
    expect(renderBar(verdicts('ggg'))).toContain('|');
  });

  it('zöld / sárga / piros — mindhárom szín megjelenik', () => {
    const bar: string = renderBar(verdicts('gyr'));

    expect(bar).toContain(GREEN);
    expect(bar).toContain(YELLOW);
    expect(bar).toContain(RED);
  });

  it('keretenként PONTOSAN egy jel — a felbontás nem vész el', () => {
    // ⚠️ Ha összevonna, az megint „összegzés" lenne, nem folyamat — épp az a hiba,
    // amiért a T-52-t újra kellett nyitni.
    const bar: string = renderBar(verdicts('ggrrgy'));

    expect((bar.match(/\|/g) ?? []).length).toBe(6);
  });

  it('⛔ NEM tartalmaz kocsivisszát — mért ütközés a pulzus-sorral', () => {
    // 🔴 Az eredeti `\r`-es helyben-rajzolás itt tönkremegy, mert KÉT folyamat ír a konzolra.
    expect(renderBar(verdicts('ggg'))).not.toContain('\r');
  });

  it('⛔ NEM tör sort a köteg közepén', () => {
    expect(renderBar(verdicts('ggggg'))).not.toContain('\n');
  });

  it('üres kötegnél sem hasal el', () => {
    expect(renderBar([])).toBe('🎤 ');
  });
});

describe('longestGreenRun — „elég sok zöld EGYMÁS MELLETT"', () => {

  it('a megszakítatlan sorozatot méri, nem az összes zöldet', () => {
    // 🔴 EZ AZ OWNER SZABÁLYA: szórt zöldek = zaj. 6 zöld, de a leghosszabb sorozat 2.
    expect(longestGreenRun(verdicts('ggrggrgg'))).toBe(2);
  });

  it('a megszakítatlan sorozatot teljes hosszában megtalálja', () => {
    expect(longestGreenRun(verdicts('rrgggggrr'))).toBe(5);
  });

  it('csupa csendnél nulla', () => {
    expect(longestGreenRun(verdicts('rrrr'))).toBe(0);
  });

  it('üres bemenetnél nulla — ⛔ nem NaN, nem -Infinity', () => {
    expect(longestGreenRun([])).toBe(0);
  });

  it('a sárga MEGSZAKÍTJA a sorozatot — a határeset nem beszéd', () => {
    expect(longestGreenRun(verdicts('gggyggg'))).toBe(3);
  });
});

describe('summarizeSegment — a záró ítélet', () => {

  it('elég hosszú zöld sorozatnál MEGSZÓLALÁS', () => {
    expect(summarizeSegment(verdicts('g'.repeat(MIN_GREEN_RUN)))).toContain('MEGSZÓLALÁS');
  });

  it('eggyel rövidebbnél MÉG NEM', () => {
    expect(summarizeSegment(verdicts('g'.repeat(MIN_GREEN_RUN - 1)))).toContain('nem elég');
  });

  it('🔴 sok SZÓRT zöld sem elég — ez a szabály lelke', () => {
    // 20 zöld keret, de sosem több kettőnél egymás után.
    const scattered: string = 'ggr'.repeat(10);

    expect(summarizeSegment(verdicts(scattered))).toContain('nem elég');
  });

  it('MEGMONDJA a számokat is — ne kelljen kitalálni, mennyi hiányzott', () => {
    const summary: string = summarizeSegment(verdicts('ggrr'));

    expect(summary).toContain('2/4');
    expect(summary).toContain(`kell: ${MIN_GREEN_RUN}`);
  });
});

describe('VoiceAnalysisBar — az élő gyűjtés', () => {

  it('teljes köteg után AZONNAL ír — nem vár a megszólalás végére', () => {
    // ⭐ Ez az „élő" lényege: beszéd KÖZBEN érkezik a visszajelzés.
    const lines: string[] = [];
    const bar: VoiceAnalysisBar = new VoiceAnalysisBar((line: string): void => void lines.push(line));

    for (const frame of frames('g'.repeat(BAR_WIDTH))) bar.push(frame);

    expect(lines.length).toBe(1);
  });

  it('a köteg betelte ELŐTT nem ír — különben minden keret külön sor lenne', () => {
    const lines: string[] = [];
    const bar: VoiceAnalysisBar = new VoiceAnalysisBar((line: string): void => void lines.push(line));

    for (const frame of frames('g'.repeat(BAR_WIDTH - 1))) bar.push(frame);

    expect(lines.length).toBe(0);
  });

  it('a lezárás kiírja a maradékot ÉS az ítéletet', () => {
    const lines: string[] = [];
    const bar: VoiceAnalysisBar = new VoiceAnalysisBar((line: string): void => void lines.push(line));

    for (const frame of frames('ggg')) bar.push(frame);
    bar.endSegment();

    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('zöld keret');
  });

  it('⚠️ ÜRES megszólalásnál semmit nem ír — a „0/0" csak zaj lenne', () => {
    const lines: string[] = [];
    const bar: VoiceAnalysisBar = new VoiceAnalysisBar((line: string): void => void lines.push(line));

    bar.endSegment();

    expect(lines.length).toBe(0);
  });

  it('a lezárás UTÁN új megszólalás kezdődik — nem viszi tovább a régi kereteket', () => {
    const lines: string[] = [];
    const bar: VoiceAnalysisBar = new VoiceAnalysisBar((line: string): void => void lines.push(line));

    for (const frame of frames('g'.repeat(MIN_GREEN_RUN))) bar.push(frame);
    bar.endSegment();
    lines.length = 0;

    for (const frame of frames('rr')) bar.push(frame);
    bar.endSegment();

    // ⚠️ Ha a régi zöldek átszivárognának, itt hamis „MEGSZÓLALÁS" jönne.
    expect(lines.join('\n')).toContain('nem elég');
  });

  it('⛔ a kiíró hibája NEM öli meg a sávot — a felvétel a termék, a sáv csak diagnosztika', () => {
    let calls: number = 0;
    const bar: VoiceAnalysisBar = new VoiceAnalysisBar((): void => {
      calls += 1;
      throw new Error('a konzol elhasalt');
    });

    // 🔴 Mért precedens: egy megfigyelő `?.` nélkül megölte volna a felvételt.
    expect((): void => {
      for (const frame of frames('g'.repeat(BAR_WIDTH * 2))) bar.push(frame);
    }).not.toThrow();
    expect(calls).toBeGreaterThan(0);
  });

  it('csend után MAGÁTÓL lezárja a megszólalást', (done: DoneFn): void => {
    // ⭐ A megszólalás vége az ÁTEMELT kódban dől el, amihez nem nyúlhatunk — a csend
    // viszont kívülről is látszik.
    const lines: string[] = [];
    const bar: VoiceAnalysisBar = new VoiceAnalysisBar(
      (line: string): void => void lines.push(line),
      20,
    );

    for (const frame of frames('gg')) bar.push(frame);

    setTimeout((): void => {
      expect(lines.some((line: string): boolean => line.includes('zöld keret'))).toBeTrue();
      done();
    }, 80);
  });
});

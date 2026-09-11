// Az alvás-állapot tesztjei — ⭐ MÉRÉS-alapú, ⛔ nem fix órarend.
//
// ## 🔴 MIÉRT ÍRÓDOTT ÁT EZ A SPEC (2026-09-12)
//
// A korábbi tesztek a **fix órarendet** szögezték le *(`02:00-10:00 = alvás`)*. Azt a
// viselkedést az owner **kimondottan hibásnak** nevezte — és a nyers jelenlét-adat **kétszer**
// cáfolta: 09-11 09:00-kor a tipp „ébren" volt *(idle 6,1 óra ⇒ aludt)*, 09-12 00:06-kor
// „alszik" *(idle 0 mp ⇒ ébren volt)*.
//
// ⚠️ Ezért a **döntést** leszögező állítások **helyükre** mérés-alapúak kerültek. ⛔ Egyetlen
// teszt sincs kikapcsolva: a régi óra-mezőket *(`hour`, `window`, env-felülírás)* továbbra is
// őrzik a tesztek — csak most **tájékoztató** mezőként, ⛔ nem döntésként.
//
// ⭐ **A HÉTVÉGI KIKÖTÉS SZERINT MINDEN FIXTÚRÁBÓL MEGY**: a mérés-olvasó **bemenetként**
// cserélhető, tehát ⛔ nincs élő jelenlét-fájl és ⛔ nincs hangszóró-kísérlet.

import { SleepState_Service, type SleepState_AwakeReading } from './sleep-state.service.js';

interface SleepStateClass_Internal {
  instance: SleepState_Service | null;
}

function resetSingleton(): void {
  (SleepState_Service as unknown as SleepStateClass_Internal).instance = null;
}

function at(hour: number, minute: number = 0): Date {
  const d: Date = new Date();
  d.setHours(hour, minute, 0, 0);

  return d;
}

/** Egy ébrenlét-olvasó FIXTÚRA — ⛔ lemez és hálózat nélkül. */
function reader(awake: SleepState_AwakeReading['awake']): (when: Date) => Promise<SleepState_AwakeReading> {
  return async (): Promise<SleepState_AwakeReading> => ({ awake: awake });
}

/** ÉBREN — a gépét használja. */
const AWAKE: SleepState_AwakeReading['awake'] = {
  state: 'awake',
  isAwake: true,
  signal: 'presence-active',
  reason: 'ÉBREN — a gépét használja. Friss mérés (1 perce), aktív bevitel.',
  ageMinutes: 1,
};

/** ALSZIK — friss mérés, de régóta tétlen. */
const ASLEEP: SleepState_AwakeReading['awake'] = {
  state: 'asleep',
  isAwake: false,
  signal: 'presence-idle',
  reason: 'ALSZIK (vagy nincs a gépnél) — friss mérés, de 7,7 óra óta nincs bevitel.',
  ageMinutes: 2,
};

/** NINCS ADAT — a figyelő nem fut. */
const UNKNOWN: SleepState_AwakeReading['awake'] = {
  state: 'unknown',
  isAwake: false,
  signal: 'none',
  reason: 'NEM TUDJUK, ébren van-e: a legutóbbi mérés 240 perces — a figyelő nem fut.',
};

describe('| SleepState_Service — a HÁROM ÁG', () => {

  beforeEach(resetSingleton);
  afterEach(resetSingleton);

  it('⭐ ÉBREN ⇒ NINCS néma ablak, és a forrás MÉRÉS', async (): Promise<void> => {
    // 🔴 Ez a 09-12 00:06-os eset: éjfél van, a fix órarend „alszik"-ot tippelt volna.
    const snap = await SleepState_Service.getInstance().getSnapshot(at(0, 6), reader(AWAKE));

    expect(snap.isInSleepWindow).toBe(false);
    expect(snap.source).toBe('presence-measurement');
    expect(snap.awake.state).toBe('awake');
  });

  it('⭐ ALSZIK ⇒ NÉMA ablak, akkor is, ha az óra szerint „reggel" van', async (): Promise<void> => {
    // 🔴 Ez a 09-11 09:00-es eset: a fix órarend „ébren"-t tippelt, közben aludt.
    const snap = await SleepState_Service.getInstance().getSnapshot(at(9), reader(ASLEEP));

    expect(snap.isInSleepWindow).toBe(true);
    expect(snap.source).toBe('presence-measurement');
    expect(snap.awake.state).toBe('asleep');
  });

  it('🔴 NINCS ADAT ⇒ a BIZTONSÁGOS ág nyer: NÉMA', async (): Promise<void> => {
    // ⚠️ Ez a harmadik ág a lényeg: az „ismeretlen" ⛔ NEM „valószínűleg ébren".
    const snap = await SleepState_Service.getInstance().getSnapshot(at(14), reader(UNKNOWN));

    expect(snap.isInSleepWindow).toBe(true);
    expect(snap.awake.state).toBe('unknown');
    expect(snap.awake.isAwake).toBe(false);
  });

  it('🔴 ha a mérés-olvasó DOB, akkor is használható választ ad — és KIMONDJA, miért', async (): Promise<void> => {
    const snap = await SleepState_Service.getInstance().getSnapshot(at(3), async (): Promise<SleepState_AwakeReading> => {
      throw new Error('a jelenlét-könyvtár nem olvasható');
    });

    expect(snap.isInSleepWindow).toBe(true);
    expect(snap.source).toBe('measurement-unavailable');
    expect(snap.awake.reason).toContain('nem olvasható');
    // 🔴 ⛔ ÉS NEM ESIK VISSZA AZ ÓRA-TIPPELÉSRE — az volt az eredeti hiba.
    expect(snap.awake.reason).toContain('Fix órarendre NEM esünk vissza');
  });
});

describe('| SleepState_Service — az INDOKLÁS', () => {

  beforeEach(resetSingleton);
  afterEach(resetSingleton);

  it('⭐ a döntés indoklása ÁTMEGY — ⛔ nem puszta logikai érték', async (): Promise<void> => {
    const snap = await SleepState_Service.getInstance().getSnapshot(at(12), reader(AWAKE));

    expect(snap.awake.reason).toContain('a gépét használja');
    expect(snap.awake.signal).toBe('presence-active');
    expect(snap.awake.ageMinutes).toBe(1);
  });

  it('a `isInSleepWindow` kényelmi hívás EGYEZIK a snapshottal', async (): Promise<void> => {
    const service: SleepState_Service = SleepState_Service.getInstance();
    const now: Date = at(4);

    expect(await service.isInSleepWindow(now, reader(ASLEEP)))
      .toBe((await service.getSnapshot(now, reader(ASLEEP))).isInSleepWindow);
  });

  it('| singleton getInstance returns the same instance across calls', () => {
    expect(SleepState_Service.getInstance()).toBe(SleepState_Service.getInstance());
  });
});

describe('| SleepState_Service — az óra-mezők ⚠️ TÁJÉKOZTATÓK, ⛔ nem döntenek', () => {

  let origStart: string | undefined;
  let origEnd: string | undefined;

  beforeEach(() => {
    origStart = process.env.MA_SLEEP_START_HOUR;
    origEnd = process.env.MA_SLEEP_END_HOUR;
    delete process.env.MA_SLEEP_START_HOUR;
    delete process.env.MA_SLEEP_END_HOUR;
    resetSingleton();
  });

  afterEach(() => {
    if (origStart === undefined) delete process.env.MA_SLEEP_START_HOUR;
    else process.env.MA_SLEEP_START_HOUR = origStart;
    if (origEnd === undefined) delete process.env.MA_SLEEP_END_HOUR;
    else process.env.MA_SLEEP_END_HOUR = origEnd;
    resetSingleton();
  });

  it('a snapshot viszi az órát és az ablak-konfigurációt', async (): Promise<void> => {
    const snap = await SleepState_Service.getInstance().getSnapshot(at(5), reader(AWAKE));

    expect(snap.hour).toBe(5);
    expect(snap.window).toEqual({ startHour: 2, endHour: 10 });
    expect(typeof snap.ts).toBe('string');
  });

  it('env override MA_SLEEP_START_HOUR / MA_SLEEP_END_HOUR honored', async (): Promise<void> => {
    process.env.MA_SLEEP_START_HOUR = '23';
    process.env.MA_SLEEP_END_HOUR = '6';
    resetSingleton();

    const snap = await SleepState_Service.getInstance().getSnapshot(at(0), reader(AWAKE));

    expect(snap.window).toEqual({ startHour: 23, endHour: 6 });
  });

  it('invalid env value (non-numeric, out-of-range) falls back to defaults', async (): Promise<void> => {
    process.env.MA_SLEEP_START_HOUR = 'not-a-number';
    process.env.MA_SLEEP_END_HOUR = '99';
    resetSingleton();

    const snap = await SleepState_Service.getInstance().getSnapshot(at(3), reader(AWAKE));

    expect(snap.window).toEqual({ startHour: 2, endHour: 10 });
  });

  it('🔴 az ÓRA-ABLAK NEM DÖNT: 03:00-kor (a régi „alvás-ablak") ÉBREN ⇒ NINCS néma ablak', async (): Promise<void> => {
    // ⚠️ EZ A LEGFONTOSABB ÁLLÍTÁS EBBEN A BLOKKBAN. A régi kód itt `true`-t adott volna
    // *(mert 03:00 az ablakban van)*. Most a MÉRÉS dönt — és az owner ébren van.
    const snap = await SleepState_Service.getInstance().getSnapshot(at(3), reader(AWAKE));

    expect(snap.isInSleepWindow).toBe(false);
  });

  it('🔴 és fordítva: 14:00-kor (az ablakon KÍVÜL) ALSZIK ⇒ NÉMA ablak', async (): Promise<void> => {
    const snap = await SleepState_Service.getInstance().getSnapshot(at(14), reader(ASLEEP));

    expect(snap.isInSleepWindow).toBe(true);
  });
});

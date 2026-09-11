// A folyamatban-lévő-megszólalás nyilvántartás tesztjei.
//
// > **Owner, 2026-09-11 02:28:** *„az üzenetcsomagot csak akkor szabad elküldeni, ha nem
// > kezdtünk el következő üzenetet se… meg kell várni, hogy abból mi lesz."*
//
// > **Owner, 2026-09-11 03:27 — élesben, MÁSODSZOR:** *„Na, baszd meg, **még én beszélek**, a
// > csomó[g] nem megy át."*
//
// ⭐ A HÁROM ÁLLÍTÁS:
//   (a) amíg egy megszólalás **folyamatban** van, `isInProgress()` **igaz**;
//   (b) a lezárás **sikernél ÉS bukásnál** egyaránt elengedi *(mindkettő lezárás)*;
//   (c) 🔴 egy **beragadt** jel ⛔ nem fogja meg örökre a kaput — a tétel **elévül**.

import { VoiceSpeechInFlight } from './voice-speech-inflight.js';

/** Kézzel léptetett óra — így a teszt nem vár valódi perceket. */
function makeClock(): { now: () => number; advance: (ms: number) => void } {
  let current: number = 1_000_000;

  return {
    now: (): number => current,
    advance: (ms: number): void => {
      current += ms;
    },
  };
}

describe('VoiceSpeechInFlight', () => {

  it('⭐ induláskor NINCS folyamatban semmi', () => {
    expect(new VoiceSpeechInFlight().isInProgress()).toBeFalse();
  });

  it('🔴 a megszólalás kezdete után FOLYAMATBAN van', () => {
    // Ez a kapu lényege: ilyenkor a köteg ⛔ nem mehet ki.
    const tracker = new VoiceSpeechInFlight();

    tracker.noteStarted();

    expect(tracker.isInProgress()).toBeTrue();
    expect(tracker.trackedCount).toBe(1);
  });

  it('a lezárás után NEM folyamatban', () => {
    const tracker = new VoiceSpeechInFlight();

    tracker.noteStarted();
    tracker.noteSettled();

    expect(tracker.isInProgress()).toBeFalse();
  });

  it('⭐ TÖBB egymásra futó megszólalást is követ', () => {
    // A felismerés percekig tarthat, közben újabb megszólalás indulhat.
    const tracker = new VoiceSpeechInFlight();

    tracker.noteStarted();
    tracker.noteStarted();
    tracker.noteSettled();

    // ⚠️ EGY lezárás NEM elég: a másik még folyamatban van.
    expect(tracker.isInProgress()).toBeTrue();

    tracker.noteSettled();
    expect(tracker.isInProgress()).toBeFalse();
  });

  it('⛔ több lezárás mint kezdet: nem megy negatívba', () => {
    const tracker = new VoiceSpeechInFlight();

    tracker.noteSettled();
    tracker.noteSettled();
    tracker.noteStarted();

    // Ha a számláló negatívba csúszhatna, EZ a megszólalás láthatatlan lenne.
    expect(tracker.isInProgress()).toBeTrue();
  });

  it('🔴 a BERAGADT jel ELÉVÜL — ⛔ nem fogja meg örökre a kaput', async (): Promise<void> => {
    // ⚠️ Ez a legfontosabb védelem: ha egy lezárás-jel elmarad (a figyelő újraindul, egy
    // kivétel kiszökik), a köteg KÜLÖNBEN örökre állna, és minden üzenet némán várakozna.
    const clock = makeClock();
    const tracker = new VoiceSpeechInFlight(clock.now);

    tracker.noteStarted();
    expect(tracker.isInProgress()).toBeTrue();

    clock.advance(VoiceSpeechInFlight.STALE_AFTER_MS + 1);

    expect(tracker.isInProgress()).toBeFalse();
    // ⭐ Az elévült tételt EL IS DOBJA — így a számláló sem hazudik utána.
    expect(tracker.trackedCount).toBe(0);
  });

  it('⚠️ az elévülés ELŐTT még folyamatban van', () => {
    const clock = makeClock();
    const tracker = new VoiceSpeechInFlight(clock.now);

    tracker.noteStarted();
    clock.advance(VoiceSpeechInFlight.STALE_AFTER_MS - 1_000);

    expect(tracker.isInProgress()).toBeTrue();
  });

  it('⭐ a FRISS tétel megmarad, amikor egy régi elévül', () => {
    const clock = makeClock();
    const tracker = new VoiceSpeechInFlight(clock.now);

    tracker.noteStarted();
    clock.advance(VoiceSpeechInFlight.STALE_AFTER_MS + 1);
    tracker.noteStarted();

    // A régi kiesik, az új marad ⇒ továbbra is folyamatban.
    expect(tracker.isInProgress()).toBeTrue();
    expect(tracker.trackedCount).toBe(1);
  });

  it('⚠️ a korlát ÉRTELMES sávban van — se túl rövid, se órás', () => {
    // ⛔ Túl rövid: a kapu hatástalan. ⛔ Túl hosszú: egy elmaradt jel megbénítja a kézbesítést.
    expect(VoiceSpeechInFlight.STALE_AFTER_MS).toBeGreaterThanOrEqual(60_000);
    expect(VoiceSpeechInFlight.STALE_AFTER_MS).toBeLessThanOrEqual(600_000);
  });
});

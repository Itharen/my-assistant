// A szüneteltető tesztjei.
//
// > **Owner, 2026-09-11 01:15:** *„amikor elkezdek beszélni, és amíg beszélek, meg utána még
// > talán plusz pár másodpercig szüneteltetni kéne a felolvasást. **Aztán újra folytatni.**"*
//
// ⭐ A NÉGY ÁLLÍTÁS:
//   (a) a megszólalás **azonnal** megállítja a felolvasást;
//   (b) minden **további** megszólalás **újraindítja** a türelmi időt *(a levegővételnél ⛔ nem
//       kapcsolunk vissza)*;
//   (c) a türelmi idő letelte után **FOLYTATÁS** — ⛔ nem újrakezdés, ⛔ nem eldobás;
//   (d) 🔴 **VÉGTELEN SZÜNET NEM LEHETSÉGES** — a feloldás idő-alapú, ⛔ nem egy „elhallgatott"
//       jelre vár, ami elmaradhat.

import { VoiceSpeechHold } from './voice-speech-hold.js';

/** Kézzel léptetett időzítő — így a teszt nem vár valódi másodperceket. */
function makeClock(): {
  setTimer: (callback: () => void, ms: number) => { cancel: () => void };
  /** A várakozó hívások lefuttatása. */
  tick: () => void;
  /** Hány időzítő vár épp. */
  pending: () => number;
  /** Az utolsó kért késleltetés. */
  lastMs: () => number;
} {
  let queued: { callback: () => void; ms: number }[] = [];

  return {
    // ⭐ A fogantyú MAGA hordozza a lemondását — így egyetlen `as` átcímkézés sem kell.
    setTimer: (callback: () => void, ms: number): { cancel: () => void } => {
      const entry = { callback: callback, ms: ms };

      queued.push(entry);

      return {
        cancel: (): void => {
          queued = queued.filter((q): boolean => q !== entry);
        },
      };
    },
    tick: (): void => {
      const run = queued;

      queued = [];
      for (const entry of run) entry.callback();
    },
    pending: (): number => queued.length,
    lastMs: (): number => queued[queued.length - 1]?.ms ?? 0,
  };
}

/** A vizsgált szüneteltető + amit a sorral tett. */
function makeHold(graceMs: number = 2_500): {
  hold: VoiceSpeechHold;
  clock: ReturnType<typeof makeClock>;
  events: string[];
  notes: string[];
} {
  const clock = makeClock();
  const events: string[] = [];
  const notes: string[] = [];

  return {
    clock: clock,
    events: events,
    notes: notes,
    hold: new VoiceSpeechHold({
      hold: (): void => void events.push('hold'),
      release: (): void => void events.push('release'),
      graceMs: async (): Promise<number> => graceMs,
      onNote: (detail: string): void => void notes.push(detail),
      setTimer: clock.setTimer,
    }),
  };
}

/** A `graceMs` `await`-je miatt egy mikrotask-kört be kell várni. */
const settle = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('VoiceSpeechHold', () => {

  it('⭐ a megszólalás AZONNAL megállítja a felolvasást', async (): Promise<void> => {
    const { hold, events } = makeHold();

    hold.noteOwnerSpeech();
    await settle();

    expect(events).toEqual(['hold']);
    expect(hold.isHolding).toBeTrue();
  });

  it('🔴 a türelmi idő letelte után FOLYTATÓDIK — ⛔ nem kezdi újra', async (): Promise<void> => {
    // Owner: „Aztán újra folytatni." ⇒ a sor oldalán a `release()` NEM üríti ki a sort.
    const { hold, clock, events } = makeHold();

    hold.noteOwnerSpeech();
    await settle();
    clock.tick();

    expect(events).toEqual(['hold', 'release']);
    expect(hold.isHolding).toBeFalse();
  });

  it('🔴 minden ÚJABB megszólalás ÚJRAINDÍTJA a türelmi időt', async (): Promise<void> => {
    // ⚠️ Enélkül egy hosszabb mondat közepén — a LEVEGŐVÉTELNÉL — visszakapcsolnánk, és
    // pont az egymásba-beszélés jönne vissza, amit meg akartunk szüntetni.
    const { hold, clock, events } = makeHold();

    hold.noteOwnerSpeech();
    await settle();
    hold.noteOwnerSpeech();
    await settle();
    hold.noteOwnerSpeech();
    await settle();

    // ⭐ EGY tartás, és ⛔ egyetlen korai feloldás sem.
    expect(events).toEqual(['hold']);
    expect(clock.pending()).toBe(1);

    clock.tick();
    expect(events).toEqual(['hold', 'release']);
  });

  it('⭐ a türelmi időt MINDEN megszólaláskor újra kérdezi — futás közben állítható', async (): Promise<void> => {
    let grace: number = 1_000;
    const clock = makeClock();
    const hold = new VoiceSpeechHold({
      hold: (): void => {},
      release: (): void => {},
      graceMs: async (): Promise<number> => grace,
      setTimer: clock.setTimer,
    });

    hold.noteOwnerSpeech();
    await settle();
    expect(clock.lastMs()).toBe(1_000);

    // Az owner átállítja — ⛔ újraindítás nélkül érvényesül.
    grace = 4_000;
    hold.noteOwnerSpeech();
    await settle();
    expect(clock.lastMs()).toBe(4_000);
  });

  it('🔴 a KÉSÉS is naplóba kerül — ebből látszik egy akadás-hurok', async (): Promise<void> => {
    // A visszhang (mérve: 0-3 mp) legfeljebb akadást okozhat. Ha az akadás ISMÉTLŐDIK,
    // annak a naplóból kell látszania — ⛔ nem találgatásból.
    const { hold, clock, notes } = makeHold(2_500);

    hold.noteOwnerSpeech();
    await settle();
    clock.tick();

    expect(notes[0]).toContain('SZÜNETEL');
    expect(notes[1]).toContain('FOLYTATÓDIK');
    expect(notes[1]).toContain('2500 ms türelmi idő');
  });

  it('⛔ a LEÁLLÍTÁS feloldja a tartást — ⛔ nem hagyja örökre tartva', async (): Promise<void> => {
    // Egy leállított szüneteltető, ami tartva hagyja a sort, MINDEN későbbi felolvasást
    // megszüntetne — némán. Ez a legrosszabb elképzelhető kimenetel.
    const { hold, events } = makeHold();

    hold.noteOwnerSpeech();
    await settle();
    hold.stop();

    expect(events).toEqual(['hold', 'release']);
    expect(hold.isHolding).toBeFalse();
  });

  it('a leállítás tartás NÉLKÜL nem oldja fel a semmit', async (): Promise<void> => {
    const { hold, events } = makeHold();

    hold.stop();

    expect(events).toEqual([]);
  });

  it('⛔ a feloldás UTÁN a letelt időzítő nem old fel MÁSODSZOR', async (): Promise<void> => {
    // Egy dupla `release()` a sort egy KÉSŐBBI, jogos tartásból is kiengedhetné.
    const { hold, clock, events } = makeHold();

    hold.noteOwnerSpeech();
    await settle();
    hold.stop();
    clock.tick();

    expect(events).toEqual(['hold', 'release']);
  });

  it('🔴 VÉGTELEN SZÜNET NEM LEHETSÉGES — a feloldás IDŐ-alapú', async (): Promise<void> => {
    // Ez a handoff kikötése. A feloldás ⛔ NEM egy „elhallgatott" jelre vár (ami elmaradhat):
    // a türelmi idő letelik, és folytatjuk. ⭐ És mivel a szünet MEGSZÜNTETI a visszhang
    // forrását (az én hangomat), a visszhang legfeljebb egy akadás lehet.
    const { hold, clock, events } = makeHold();

    // 20 megszólalás — mintha végig beszélne (vagy mintha visszhang jönne).
    for (let i = 0; i < 20; i += 1) {
      hold.noteOwnerSpeech();
      await settle();
    }

    expect(hold.isHolding).toBeTrue();
    clock.tick();

    // ⭐ EGYETLEN időzítő-lejárat elég a folytatáshoz — nincs mire várni.
    expect(hold.isHolding).toBeFalse();
    expect(events.filter((e: string): boolean => e === 'release').length).toBe(1);
  });

  it('⛔ a sor hibája sem dob — a szüneteltető nem buktathatja meg a figyelőt', async (): Promise<void> => {
    const clock = makeClock();
    const hold = new VoiceSpeechHold({
      hold: (): void => {
        throw new Error('a sor elszállt');
      },
      release: (): void => {},
      graceMs: async (): Promise<number> => 1_000,
      setTimer: clock.setTimer,
    });

    expect((): void => hold.noteOwnerSpeech()).not.toThrow();
  });
});

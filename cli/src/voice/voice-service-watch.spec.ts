// A szolgáltatás-figyelő tesztjei.
//
// 🔴 MIÉRT LÉTEZIK EZ A MODUL EGYÁLTALÁN: 2026-09-10-én a jel- és `stdin`-alapú horgonyok
// **hatástalanok** voltak, mert a `tsx` közbeiktat egy folyamatot, és a figyelő a szerver
// **unokája**. A napló öt belépést és **nulla kilépést** mutatott.
//
// ⭐ A KÉT LEGFONTOSABB ÁLLÍTÁS ITT:
//   (a) az ELSŐ bukásnál MÉG NEM lépünk ki — az újraindítás normális működés;
//   (b) a szolgáltatás visszatérésekor VISSZA is lépünk — különben minden újraindítás után
//       némán kimaradnánk, ami ugyanolyan félrevezető, mint a hamis jelenlét.

import {
  SERVICE_WATCH_FAILURES_BEFORE_LEAVE,
  VoiceServiceWatch,
} from './voice-service-watch.js';

describe('VoiceServiceWatch', () => {

  let leaves: string[];
  let rejoins: number;
  let notes: string[];
  let isAlive: boolean;

  function makeWatch(): VoiceServiceWatch {
    return new VoiceServiceWatch({
      healthUrl: 'http://localhost:39335/api/healthz',
      probe: async (): Promise<boolean> => isAlive,
      onLeave: async (action): Promise<void> => {
        leaves.push(action.reason);
      },
      onRejoin: async (): Promise<void> => {
        rejoins += 1;
      },
      onNote: (detail: string): void => {
        notes.push(detail);
      },
    });
  }

  beforeEach((): void => {
    leaves = [];
    rejoins = 0;
    notes = [];
    isAlive = true;
  });

  it('amíg a szolgáltatás él, semmi nem történik', async (): Promise<void> => {
    const watch = makeWatch();

    await watch.check();
    await watch.check();

    expect(leaves).toEqual([]);
    expect(rejoins).toBe(0);
  });

  it('🔴 az ELSŐ bukásnál MÉG NEM lépünk ki — az újraindítás normális működés', async (): Promise<void> => {
    // ⚠️ Enélkül minden LDP-kör kiléptetne és visszaléptetne — a hang-csatornában ez
    // hallható kapcsolat-csapkodás lenne.
    const watch = makeWatch();

    isAlive = false;
    await watch.check();

    expect(leaves).toEqual([]);
    expect(notes.some((n: string): boolean => n.includes('még várok'))).toBeTrue();
  });

  it(`⭐ a ${SERVICE_WATCH_FAILURES_BEFORE_LEAVE}. egymás utáni bukásnál KILÉPÜNK, okkal`, async (): Promise<void> => {
    const watch = makeWatch();

    isAlive = false;
    for (let i: number = 0; i < SERVICE_WATCH_FAILURES_BEFORE_LEAVE; i += 1) {
      await watch.check();
    }

    expect(leaves.length).toBe(1);
    expect(leaves[0]).toContain('nem érhető el');
  });

  it('⛔ NEM lép ki kétszer ugyanarra a kimaradásra', async (): Promise<void> => {
    // Két „kiléptem" sor ugyanarról a kimaradásról pontosan olyan félrevezető, mint a nulla.
    const watch = makeWatch();

    isAlive = false;
    for (let i: number = 0; i < 6; i += 1) {
      await watch.check();
    }

    expect(leaves.length).toBe(1);
  });

  it('⭐ a szolgáltatás VISSZATÉRÉSEKOR visszalépünk', async (): Promise<void> => {
    const watch = makeWatch();

    isAlive = false;
    for (let i: number = 0; i < SERVICE_WATCH_FAILURES_BEFORE_LEAVE; i += 1) {
      await watch.check();
    }
    isAlive = true;
    await watch.check();

    expect(rejoins).toBe(1);
    expect(notes.some((n: string): boolean => n.includes('visszajött'))).toBeTrue();
  });

  it('⚠️ a MEGSZAKÍTOTT sorozat NEM halmozódik — a számláló nullázódik', async (): Promise<void> => {
    // Egy elszórt hálózati hiba nem léptethet ki: csak az EGYMÁS UTÁNI bukás jelent kiesést.
    const watch = makeWatch();

    isAlive = false;
    await watch.check();
    isAlive = true;
    await watch.check();
    isAlive = false;
    await watch.check();

    expect(leaves).toEqual([]);
  });

  it('a visszalépés után egy ÚJ kiesés ismét kiléptet', async (): Promise<void> => {
    const watch = makeWatch();

    isAlive = false;
    for (let i: number = 0; i < SERVICE_WATCH_FAILURES_BEFORE_LEAVE; i += 1) await watch.check();
    isAlive = true;
    await watch.check();
    isAlive = false;
    for (let i: number = 0; i < SERVICE_WATCH_FAILURES_BEFORE_LEAVE; i += 1) await watch.check();

    expect(leaves.length).toBe(2);
  });

  it('⛔ az ellenőrzés KIVÉTELE nem buktatja meg a figyelőt', async (): Promise<void> => {
    const watch = new VoiceServiceWatch({
      healthUrl: 'x',
      probe: async (): Promise<never> => {
        throw new Error('a próba elszállt');
      },
      onLeave: async (): Promise<void> => undefined,
      onRejoin: async (): Promise<void> => undefined,
    });

    await expectAsync(watch.check()).toBeResolved();
  });
});

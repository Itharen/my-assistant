// A felolvasás-sor tesztjei.
//
// > **Owner, 2026-09-11 01:30 (hang):** *„mintha két üzenetet küldtél, és csak az első került
// > felolvasásra… majd itt bonyolultabb queuing rendszert is kell kialakítsunk"*
//
// 🔴 A MÉRT GYÖKÉR, amit ezek a tesztek őriznek: a `speakInVoiceChannel` a `player.play()` után
// **azonnal visszatér**, tehát a hívó `await`-je csak az **indítást** várta meg, nem a
// lejátszás **végét**. ⇒ A második üzenet nem-`Idle` lejátszóba futott, és `spoken: false`-szal
// **elesett**.
//
// ⭐ A NÉGY ÁLLÍTÁS, AMI MIATT EZ A MODUL LÉTEZIK:
//   (a) **nulla veszteség** — ha épp szól egy, a következő VÁR, ⛔ nem esik ki;
//   (b) **sorrend** — érkezési, ⛔ soha nem előz;
//   (c) **csoport** — egy üzenet darabjai közé más üzenet ⛔ nem ékelődhet;
//   (d) **láthatóság** — a torlódás jelzés, ⛔ nem csendes felhalmozódás.

import { VoiceSpeechQueue } from './voice-speech-queue.js';

/** Egy „lejátszó"-utánzat, ami MÉRI az egymásba-beszélést. */
function makeSpeaker(): {
  speak: (text: string) => Promise<{ spoken: boolean; detail: string }>;
  waitForIdle: () => Promise<boolean>;
  /** Amit kimondtunk, sorrendben. */
  spoken: string[];
  /** 🔴 Hányszor indult úgy megszólalás, hogy az előző MÉG SZÓLT. */
  overlaps: number;
} {
  const state = { spoken: [] as string[], overlaps: 0, isPlaying: false };

  return {
    spoken: state.spoken,
    get overlaps(): number {
      return state.overlaps;
    },
    speak: async (text: string): Promise<{ spoken: boolean; detail: string }> => {
      // 🔴 EZ A MÉRÉS: ha a lejátszó még szól, ez egymásba-beszélés — pont az a hiba,
      // ami miatt az owner csak az első üzenetet hallotta.
      if (state.isPlaying) state.overlaps += 1;

      state.isPlaying = true;
      state.spoken.push(text);

      return { spoken: true, detail: `Felolvasva: ${text}` };
    },
    waitForIdle: async (): Promise<boolean> => {
      state.isPlaying = false;

      return true;
    },
  };
}

describe('VoiceSpeechQueue — ⭐ NULLA VESZTESÉG és sorrend', () => {

  it('🔴 KÉT üzenetből MINDKETTŐ elhangzik — ez a mért regresszió', async (): Promise<void> => {
    // Owner: „mintha két üzenetet küldtél, és csak az első került felolvasásra".
    const player = makeSpeaker();
    const queue = new VoiceSpeechQueue({ speak: player.speak, waitForIdle: player.waitForIdle });

    queue.enqueue({ id: 'a', parts: ['Első.'] });
    queue.enqueue({ id: 'b', parts: ['Második.'] });
    await queue.drain();

    expect(player.spoken).toEqual(['Első.', 'Második.']);
  });

  it('🔴 SOHA nem beszél egymásba — megvárja, hogy elhallgatott', async (): Promise<void> => {
    const player = makeSpeaker();
    const queue = new VoiceSpeechQueue({ speak: player.speak, waitForIdle: player.waitForIdle });

    for (const id of ['a', 'b', 'c', 'd']) {
      queue.enqueue({ id: id, parts: [`${id}-szoveg`] });
    }
    await queue.drain();

    expect(player.spoken.length).toBe(4);
    // ⭐ A LÉNYEG: nulla átfedés. Enélkül a sor csak „sorban" futtatná egymásra a hangokat.
    expect(player.overlaps).toBe(0);
  });

  it('az ÉRKEZÉSI sorrend tartva — ⛔ semmi nem előz', async (): Promise<void> => {
    const player = makeSpeaker();
    const queue = new VoiceSpeechQueue({ speak: player.speak, waitForIdle: player.waitForIdle });

    for (const n of [1, 2, 3, 4, 5]) {
      queue.enqueue({ id: `m${n}`, parts: [`${n}`] });
    }
    await queue.drain();

    expect(player.spoken).toEqual(['1', '2', '3', '4', '5']);
  });

  it('⭐ egy üzenet DARABJAI közé más üzenet NEM ékelődik', async (): Promise<void> => {
    // Ez a darabolás (01:30) előfeltétele: „egy üzenet N darabja EGYBEN marad".
    const player = makeSpeaker();
    const queue = new VoiceSpeechQueue({ speak: player.speak, waitForIdle: player.waitForIdle });

    queue.enqueue({ id: 'hosszu', parts: ['egy', 'ketto', 'harom'] });
    queue.enqueue({ id: 'rovid', parts: ['kozbeszolas'] });
    await queue.drain();

    expect(player.spoken).toEqual(['egy', 'ketto', 'harom', 'kozbeszolas']);
  });

  it('⛔ EGY darab bukása nem állítja meg a sort — a többi elhangzik', async (): Promise<void> => {
    // A szintézis elhasalhat (kvóta, hálózat). A teljes szöveg írásban amúgy is ott van,
    // de a MARADÉK hang ne essen ki emiatt.
    const spoken: string[] = [];
    const queue = new VoiceSpeechQueue({
      speak: async (text: string): Promise<{ spoken: boolean; detail: string }> => {
        if (text === 'rossz') return { spoken: false, detail: 'kvóta elfogyott' };

        spoken.push(text);

        return { spoken: true, detail: 'ok' };
      },
      waitForIdle: async (): Promise<boolean> => true,
    });

    queue.enqueue({ id: 'a', parts: ['jo1', 'rossz', 'jo2'] });
    await queue.drain();

    expect(spoken).toEqual(['jo1', 'jo2']);
  });

  it('⚠️ ha a lejátszás vége NEM kivárható, a sor TOVÁBBLÉP — ⛔ nem akad be', async (): Promise<void> => {
    // Egy beragadt lejátszó különben a TELJES sort megfogná, és minden további üzenet
    // némán várakozna — ugyanaz a néma veszteség, csak lassabban.
    const notes: string[] = [];
    const spoken: string[] = [];
    const queue = new VoiceSpeechQueue({
      speak: async (text: string): Promise<{ spoken: boolean; detail: string }> => {
        spoken.push(text);

        return { spoken: true, detail: 'ok' };
      },
      waitForIdle: async (): Promise<boolean> => false,
      onNote: (detail: string): void => void notes.push(detail),
    });

    queue.enqueue({ id: 'a', parts: ['egy'] });
    queue.enqueue({ id: 'b', parts: ['ketto'] });
    await queue.drain();

    expect(spoken).toEqual(['egy', 'ketto']);
    expect(notes.some((n: string): boolean => n.includes('TOVÁBBLÉP'))).toBeTrue();
  });

  it('üres darab-listát nem tesz sorba', async (): Promise<void> => {
    const player = makeSpeaker();
    const queue = new VoiceSpeechQueue({ speak: player.speak, waitForIdle: player.waitForIdle });

    queue.enqueue({ id: 'ures', parts: [] });
    queue.enqueue({ id: 'szokoz', parts: ['   ', ''] });

    expect(queue.depth).toBe(0);
    await queue.drain();
    expect(player.spoken).toEqual([]);
  });
});

describe('VoiceSpeechQueue — a TARTÁS (a 01:20-as szüneteltetés alapja)', () => {

  it('⭐ tartás alatt NEM indul új darab — de a sor NEM ürül ki', async (): Promise<void> => {
    // Owner, 01:15: „amikor elkezdek beszélni… szüneteltetni kéne a felolvasást. Aztán újra
    // folytatni." ⇒ FOLYTATÁS, ⛔ nem újrakezdés és ⛔ nem eldobás.
    const player = makeSpeaker();
    const queue = new VoiceSpeechQueue({ speak: player.speak, waitForIdle: player.waitForIdle });

    queue.hold();
    queue.enqueue({ id: 'a', parts: ['egy'] });

    expect(queue.isPaused).toBeTrue();
    expect(queue.depth).toBe(1);
    expect(player.spoken).toEqual([]);
  });

  it('🔴 a feloldás ONNAN folytatja, ahol abbamaradt — ⛔ nem kezdi újra', async (): Promise<void> => {
    const spoken: string[] = [];
    let queue: VoiceSpeechQueue | undefined;
    const holder = new VoiceSpeechQueue({
      speak: async (text: string): Promise<{ spoken: boolean; detail: string }> => {
        spoken.push(text);
        // A 2. darab UTÁN „megszólal az owner" ⇒ tartás.
        if (text === 'ketto') queue?.hold();

        return { spoken: true, detail: 'ok' };
      },
      waitForIdle: async (): Promise<boolean> => true,
    });

    queue = holder;
    holder.enqueue({ id: 'hosszu', parts: ['egy', 'ketto', 'harom', 'negy'] });
    await holder.drain();

    // ⭐ A 3. NEM indult el — a handoff kikötése: „ha a 2. rész közben megszólal, a 3. NE induljon".
    expect(spoken).toEqual(['egy', 'ketto']);
    expect(holder.depth).toBe(1);

    holder.release();
    await holder.drain();

    // 🔴 A MARADÉK ELHANGZIK, és ⛔ az első kettő NEM hangzik el újra.
    expect(spoken).toEqual(['egy', 'ketto', 'harom', 'negy']);
    expect(holder.depth).toBe(0);
  });
});

describe('VoiceSpeechQueue — 🔴 a TORLÓDÁS LÁTHATÓ', () => {

  it('a küszöb fölött JELEZ — a csendes felhalmozódás láthatatlan veszteség', async (): Promise<void> => {
    const alerts: { depth: number; parts: number }[] = [];
    const queue = new VoiceSpeechQueue({
      // ⚠️ Sosem hallgat el ⇒ a sor tényleg áll, tehát TÉNYLEG torlódik.
      speak: async (): Promise<{ spoken: boolean; detail: string }> => ({ spoken: true, detail: 'ok' }),
      waitForIdle: async (): Promise<boolean> => new Promise<boolean>((): void => {}),
      onBacklog: (info: { depth: number; parts: number }): void => void alerts.push(info),
      backlogThreshold: 2,
    });

    for (const n of [1, 2, 3, 4]) {
      queue.enqueue({ id: `m${n}`, parts: [`${n}`] });
    }

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]?.depth).toBe(3);
  });

  it('⚠️ EGYSZER szól torlódásonként — ⛔ nem üzenetenként (az spam lenne)', async (): Promise<void> => {
    const alerts: { depth: number; parts: number }[] = [];
    const queue = new VoiceSpeechQueue({
      speak: async (): Promise<{ spoken: boolean; detail: string }> => ({ spoken: true, detail: 'ok' }),
      waitForIdle: async (): Promise<boolean> => new Promise<boolean>((): void => {}),
      onBacklog: (info: { depth: number; parts: number }): void => void alerts.push(info),
      backlogThreshold: 1,
    });

    for (const n of [1, 2, 3, 4, 5, 6]) {
      queue.enqueue({ id: `m${n}`, parts: [`${n}`] });
    }

    expect(alerts.length).toBe(1);
  });

  it('a küszöb alatt NEM szól — a nyugalom nem hír', async (): Promise<void> => {
    const alerts: unknown[] = [];
    const player = makeSpeaker();
    const queue = new VoiceSpeechQueue({
      speak: player.speak,
      waitForIdle: player.waitForIdle,
      onBacklog: (): void => void alerts.push(1),
      backlogThreshold: 5,
    });

    queue.enqueue({ id: 'a', parts: ['egy'] });
    await queue.drain();

    expect(alerts).toEqual([]);
  });

  it('⭐ a DARABSZÁM is benne van a jelzésben — 5 üzenet 20 darab is lehet', async (): Promise<void> => {
    const alerts: { depth: number; parts: number }[] = [];
    const queue = new VoiceSpeechQueue({
      speak: async (): Promise<{ spoken: boolean; detail: string }> => ({ spoken: true, detail: 'ok' }),
      waitForIdle: async (): Promise<boolean> => new Promise<boolean>((): void => {}),
      onBacklog: (info: { depth: number; parts: number }): void => void alerts.push(info),
      backlogThreshold: 1,
    });

    queue.enqueue({ id: 'a', parts: ['1', '2', '3'] });
    queue.enqueue({ id: 'b', parts: ['4', '5'] });

    expect(alerts[0]?.parts).toBe(5);
  });
});

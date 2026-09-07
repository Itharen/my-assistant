import {
  VoiceDropProbe,
  describeFunnel,
  toAudioSeconds,
  type VoiceDropObservation,
} from './voice-drop-probe.js';

/**
 * Hamis fájlrendszer: a könyvtár tartalmát ÉS a méreteket mi vezéreljük, hogy a szonda
 * viselkedése lépésről lépésre igazolható legyen. ⛔ Valódi lemezt nem érintünk — a teszt
 * nem függhet attól, hogy épp fut-e a felvevő.
 */
function makeFakeFs(): {
  put: (name: string, size: number) => void;
  remove: (name: string) => void;
  listDir: (dir: string) => Promise<string[]>;
  sizeOf: (path: string) => Promise<number>;
} {
  const files: Map<string, number> = new Map();

  return {
    put: (name: string, size: number): void => void files.set(name, size),
    remove: (name: string): void => void files.delete(name),
    listDir: async (): Promise<string[]> => [...files.keys()],
    sizeOf: async (path: string): Promise<number> => {
      const name: string = path.replace(/^.*[\\/]/, '');
      const size: number | undefined = files.get(name);

      if (size === undefined) throw new Error(`ENOENT: ${name}`);

      return size;
    },
  };
}

/** Egy mintavételi kör kikényszerítése — a `setInterval` nélkül, determinisztikusan. */
async function sweepOnce(probe: VoiceDropProbe): Promise<void> {
  await (probe as unknown as { sweep(): Promise<void> }).sweep();
}

/** 1 másodpercnyi hang bájtban: 48 kHz · 2 csatorna · 16 bit + fejléc. */
const ONE_SECOND_BYTES: number = 44 + 48000 * 2 * 2;

describe('VoiceDropProbe — a néma eldobás mérése', () => {
  it('a hookig eljutott felvételt NEM jelenti eldobásnak', async () => {
    const fs = makeFakeFs();
    const drops: VoiceDropObservation[] = [];
    const probe = new VoiceDropProbe({
      recordingsDir: '/rec',
      onDrop: (o: VoiceDropObservation): void => void drops.push(o),
      listDir: fs.listDir,
      sizeOf: fs.sizeOf,
    });

    fs.put('recording-owner-1.wav', ONE_SECOND_BYTES);
    await sweepOnce(probe);

    probe.markDelivered('/rec/recording-owner-1.wav');
    fs.remove('recording-owner-1.wav');
    await sweepOnce(probe);

    expect(drops.length).toBe(0);
    expect(probe.funnel.filesDelivered).toBe(1);
    expect(probe.funnel.filesDropped).toBe(0);
  });

  it('🔴 a hook NÉLKÜL eltűnt felvételt eldobásként jelenti, MÁSODPERCBEN', async () => {
    const fs = makeFakeFs();
    const drops: VoiceDropObservation[] = [];
    const probe = new VoiceDropProbe({
      recordingsDir: '/rec',
      onDrop: (o: VoiceDropObservation): void => void drops.push(o),
      listDir: fs.listDir,
      sizeOf: fs.sizeOf,
    });

    // 3,5 másodpercnyi hang — ez az, amit az owner beszélt, és ami elveszett.
    fs.put('recording-owner-2.wav', 44 + Math.round(3.5 * 48000 * 2 * 2));
    await sweepOnce(probe);

    fs.remove('recording-owner-2.wav');
    await sweepOnce(probe);

    expect(drops.length).toBe(1);
    expect(drops[0]?.reason).toBe('discarded-by-recorder');
    expect(drops[0]?.lostAudioSeconds).toBe(3.5);
    expect(probe.funnel.lostAudioSeconds).toBe(3.5);
  });

  it('az üres (csak fejléc) fájlt MÁS okkal jelenti — ott tényleg nem volt mit felismerni', async () => {
    const fs = makeFakeFs();
    const drops: VoiceDropObservation[] = [];
    const probe = new VoiceDropProbe({
      recordingsDir: '/rec',
      onDrop: (o: VoiceDropObservation): void => void drops.push(o),
      listDir: fs.listDir,
      sizeOf: fs.sizeOf,
    });

    fs.put('recording-owner-3.wav', 44);
    await sweepOnce(probe);
    fs.remove('recording-owner-3.wav');
    await sweepOnce(probe);

    expect(drops[0]?.reason).toBe('empty-file');
    expect(drops[0]?.lostAudioSeconds).toBe(0);
  });

  it('⭐ a MÉRET-CSÚCSOT tartja — a törlés pillanatában már nem kérdezhető le', async () => {
    const fs = makeFakeFs();
    const drops: VoiceDropObservation[] = [];
    const probe = new VoiceDropProbe({
      recordingsDir: '/rec',
      onDrop: (o: VoiceDropObservation): void => void drops.push(o),
      listDir: fs.listDir,
      sizeOf: fs.sizeOf,
    });

    fs.put('recording-owner-4.wav', 44);
    await sweepOnce(probe);

    fs.put('recording-owner-4.wav', ONE_SECOND_BYTES * 2);
    await sweepOnce(probe);

    fs.remove('recording-owner-4.wav');
    await sweepOnce(probe);

    expect(drops[0]?.maxSizeBytes).toBe(ONE_SECOND_BYTES * 2);
    expect(drops[0]?.lostAudioSeconds).toBe(2);
  });

  it('⭐ az ÖSSZEOLVADT megszólalás nem számít veszteségnek (ez volt a régi számláló hibája)', async () => {
    const fs = makeFakeFs();
    const probe = new VoiceDropProbe({ recordingsDir: '/rec', listDir: fs.listDir, sizeOf: fs.sizeOf });

    // Három megszólalás, de csak EGY fájl nyílt: a felvevő ugyanabba a folyamba írta.
    probe.markSpeechStart();
    probe.markSpeechStart();
    probe.markSpeechStart();

    fs.put('recording-owner-5.wav', ONE_SECOND_BYTES);
    await sweepOnce(probe);

    probe.markDelivered('recording-owner-5.wav');
    fs.remove('recording-owner-5.wav');
    await sweepOnce(probe);

    expect(probe.funnel.speechStarts).toBe(3);
    expect(probe.funnel.filesOpened).toBe(1);
    expect(probe.funnel.filesDropped).toBe(0);
    expect(describeFunnel(probe.funnel)).toContain('2 beleolvadt');
  });

  it('⚠️ ha a hook GYORSABB, mint az első mintavétel, nem jelent hamis eldobást', async () => {
    const fs = makeFakeFs();
    const drops: VoiceDropObservation[] = [];
    const probe = new VoiceDropProbe({
      recordingsDir: '/rec',
      onDrop: (o: VoiceDropObservation): void => void drops.push(o),
      listDir: fs.listDir,
      sizeOf: fs.sizeOf,
    });

    // A hook lefut, mielőtt a szonda egyáltalán látta volna a fájlt.
    probe.markDelivered('recording-owner-6.wav');
    await sweepOnce(probe);

    expect(drops.length).toBe(0);
    expect(probe.funnel.filesDropped).toBe(0);
  });

  it('⚠️ olvashatatlan könyvtárnál JELENT, de nem dob — a diagnosztika nem buktathat meg semmit', async () => {
    const errors: string[] = [];
    const probe = new VoiceDropProbe({
      recordingsDir: '/nincs-ilyen',
      onProbeError: (detail: string): void => void errors.push(detail),
      listDir: async (): Promise<string[]> => {
        throw new Error('EACCES');
      },
      sizeOf: async (): Promise<number> => 0,
    });

    await expectAsync(sweepOnce(probe)).toBeResolved();
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('EACCES');
  });

  it('⚠️ a fájl eltűnése MÉRÉS KÖZBEN nem hiba — a következő kör kezeli', async () => {
    const fs = makeFakeFs();
    const errors: string[] = [];
    const probe = new VoiceDropProbe({
      recordingsDir: '/rec',
      onProbeError: (detail: string): void => void errors.push(detail),
      listDir: async (): Promise<string[]> => ['recording-owner-7.wav'],
      sizeOf: async (): Promise<number> => {
        throw new Error('ENOENT');
      },
    });

    await expectAsync(sweepOnce(probe)).toBeResolved();
    expect(errors.length).toBe(0);
    expect(fs.listDir).toBeDefined();
  });

  it('🔴 az IDEGEN beszélő felvételét NEM számolja az owner veszteségének', async () => {
    const fs = makeFakeFs();
    const drops: VoiceDropObservation[] = [];
    const probe = new VoiceDropProbe({
      recordingsDir: '/rec',
      ownerUserId: 'owner-9',
      onDrop: (o: VoiceDropObservation): void => void drops.push(o),
      listDir: fs.listDir,
      sizeOf: fs.sizeOf,
    });

    fs.put('recording-idegen-2026.wav', ONE_SECOND_BYTES * 5);
    fs.put('recording-owner-9-2026.wav', ONE_SECOND_BYTES);
    await sweepOnce(probe);

    fs.remove('recording-idegen-2026.wav');
    fs.remove('recording-owner-9-2026.wav');
    await sweepOnce(probe);

    expect(probe.funnel.filesOpened).toBe(1);
    expect(drops.length).toBe(1);
    expect(drops[0]?.filename).toBe('recording-owner-9-2026.wav');
    expect(probe.funnel.lostAudioSeconds).toBe(1);
  });

  it('⚠️ a KÉTSZER jelzett kézbesítést egyszer könyveli (a hookot két helyről hívják)', async () => {
    const fs = makeFakeFs();
    const probe = new VoiceDropProbe({ recordingsDir: '/rec', listDir: fs.listDir, sizeOf: fs.sizeOf });

    fs.put('recording-owner-8.wav', ONE_SECOND_BYTES);
    await sweepOnce(probe);

    probe.markDelivered('recording-owner-8.wav');
    probe.markDelivered('recording-owner-8.wav');

    expect(probe.funnel.filesDelivered).toBe(1);
  });

  it('a nem-WAV fájlokat figyelmen kívül hagyja', async () => {
    const fs = makeFakeFs();
    const probe = new VoiceDropProbe({ recordingsDir: '/rec', listDir: fs.listDir, sizeOf: fs.sizeOf });

    fs.put('jegyzet.txt', 1000);
    await sweepOnce(probe);

    expect(probe.funnel.filesOpened).toBe(0);
  });

  it('a `funnel` MÁSOLAT — a hívó nem tudja elrontani a könyvelést', () => {
    const probe = new VoiceDropProbe({ recordingsDir: '/rec' });
    const snapshot = probe.funnel;

    snapshot.filesDropped = 999;

    expect(probe.funnel.filesDropped).toBe(0);
  });

  it('`toAudioSeconds`: a fejlécnél kisebb méret 0, nem negatív', () => {
    expect(toAudioSeconds(0)).toBe(0);
    expect(toAudioSeconds(10)).toBe(0);
    expect(toAudioSeconds(ONE_SECOND_BYTES)).toBe(1);
  });

  it('`start()` kétszer hívva sem indít két ciklust, és a `stop()` leáll', () => {
    const probe = new VoiceDropProbe({ recordingsDir: '/rec', pollMs: 10_000 });

    probe.start();
    probe.start();

    expect((): void => probe.stop()).not.toThrow();
    expect((): void => probe.stop()).not.toThrow();
  });
});

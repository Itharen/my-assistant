import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { VoiceCuePlayer, areCuesEnabled, resolveSoundsDir, type VoiceCue } from './voice-cues.js';
import type { VoiceConnection } from '@discordjs/voice';

/** Hamis kapcsolat: csak azt jegyzi meg, rákötöttünk-e. */
function makeConnection(): { connection: VoiceConnection; subscribeCalls: number } {
  const state = { subscribeCalls: 0 };

  return {
    connection: {
      subscribe: (): unknown => {
        state.subscribeCalls += 1;

        return {};
      },
    } as unknown as VoiceConnection,
    get subscribeCalls(): number {
      return state.subscribeCalls;
    },
  };
}

/** Egy lejátszó, aminél a fájl-létezés és a lejátszás is vezérelhető. */
function makePlayer(options: {
  exists?: boolean;
  throws?: boolean;
  nowRef?: { value: number };
} = {}): {
  player: VoiceCuePlayer;
  played: string[];
  errors: string[];
  now: { value: number };
} {
  const played: string[] = [];
  const errors: string[] = [];
  const now = options.nowRef ?? { value: 1_000_000 };

  const player = new VoiceCuePlayer({
    soundsDir: '/hangok',
    minGapMs: 3000,
    now: (): number => now.value,
    fileExists: async (): Promise<boolean> => options.exists ?? true,
    playFile: async (path: string): Promise<void> => {
      if (options.throws) throw new Error('az ffmpeg nem indult el');

      played.push(path);
    },
    onError: (detail: string): void => void errors.push(detail),
  });

  return { player: player, played: played, errors: errors, now: now };
}

describe('VoiceCuePlayer — hallható visszajelzés a hang-csatornában', () => {
  it('⛔ kapcsolat NÉLKÜL nem játszik le semmit (és nem is hibázik)', async () => {
    const { player, played, errors } = makePlayer();

    await player.play('heard');

    expect(played.length).toBe(0);
    expect(errors.length).toBe(0);
  });

  it('rákötés után lejátssza a megfelelő fájlt', async () => {
    const { player, played } = makePlayer();
    const conn = makeConnection();

    player.attach(conn.connection);
    await player.play('understood');

    expect(conn.subscribeCalls).toBe(1);
    expect(played[0]).toContain('cue-understood.mp3');
  });

  it('⭐ minden jelzéshez SAJÁT fájl tartozik', async () => {
    const cues: VoiceCue[] = ['heard', 'understood', 'dropped', 'unsure', 'error'];
    const seen: string[] = [];

    for (const cue of cues) {
      const { player, played, now } = makePlayer();

      player.attach(makeConnection().connection);
      now.value += 10_000;
      await player.play(cue);

      seen.push(played[0] ?? '');
    }

    expect(new Set(seen).size).toBe(cues.length);
    expect(seen.every((p: string): boolean => p.endsWith('.mp3'))).toBe(true);
  });

  it('🔴 a FÉK működik — két „hallak" túl sűrűn nem szólalhat meg', async () => {
    const { player, played, now } = makePlayer();

    player.attach(makeConnection().connection);

    await player.play('heard');
    now.value += 500;
    await player.play('heard');

    expect(played.length).toBe(1);
  });

  it('a fék UTÁN viszont újra megszólal', async () => {
    const { player, played, now } = makePlayer();

    player.attach(makeConnection().connection);

    await player.play('heard');
    now.value += 3_500;
    await player.play('heard');

    expect(played.length).toBe(2);
  });

  it('🔴 a „hallak" NEM nyelheti el az ELDOBVA jelzést (a valós időzítés: ~1,4 s)', async () => {
    const { player, played, now } = makePlayer();

    player.attach(makeConnection().connection);

    await player.play('heard');
    now.value += 1_400;
    await player.play('dropped');

    expect(played.length).toBe(2);
    expect(played[1]).toContain('cue-dropped.mp3');
  });

  it('⭐ a kimenetel-jelzések EGYMÁST viszont fékezik (nem géppuska)', async () => {
    const { player, played, now } = makePlayer();

    player.attach(makeConnection().connection);

    await player.play('dropped');
    now.value += 200;
    await player.play('dropped');

    expect(played.length).toBe(1);
  });

  it('a kimenetel-fék UTÁN a következő kimenetel megszólal', async () => {
    const { player, played, now } = makePlayer();

    player.attach(makeConnection().connection);

    await player.play('dropped');
    now.value += 1_000;
    await player.play('understood');

    expect(played.length).toBe(2);
  });

  it('⚠️ HIÁNYZÓ hangfájlnál jelent, de nem dob — és CSAK EGYSZER jelenti', async () => {
    const { player, played, errors, now } = makePlayer({ exists: false });

    player.attach(makeConnection().connection);

    await player.play('heard');
    now.value += 10_000;
    await player.play('heard');

    expect(played.length).toBe(0);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('NEM található');
  });

  it('⚠️ a lejátszás BUKÁSA nem dob — csak jelenti', async () => {
    const { player, errors } = makePlayer({ throws: true });

    player.attach(makeConnection().connection);

    await expectAsync(player.play('error')).toBeResolved();
    expect(errors[0]).toContain('ffmpeg');
  });

  it('a `detach()` után már nem játszik le', async () => {
    const { player, played, now } = makePlayer();

    player.attach(makeConnection().connection);
    player.detach();

    now.value += 10_000;
    await player.play('heard');

    expect(played.length).toBe(0);
  });

  it('🔇 `MA_VOICE_CUES=off` eseten NEM szolal meg (hangszoro-visszacsatolas elleni kapcsolo)', async () => {
    const played: string[] = [];
    const player = new VoiceCuePlayer({
      soundsDir: '/hangok',
      enabled: (): boolean => false,
      fileExists: async (): Promise<boolean> => true,
      playFile: async (path: string): Promise<void> => void played.push(path),
    });

    player.attach(makeConnection().connection);
    await player.play('heard');

    expect(played.length).toBe(0);
  });

  it('az `areCuesEnabled` alapertelmezese BE, es csak az `off` kapcsolja ki', () => {
    const original: string | undefined = process.env['MA_VOICE_CUES'];

    try {
      delete process.env['MA_VOICE_CUES'];
      expect(areCuesEnabled()).toBe(true);

      process.env['MA_VOICE_CUES'] = 'OFF';
      expect(areCuesEnabled()).toBe(false);

      process.env['MA_VOICE_CUES'] = 'on';
      expect(areCuesEnabled()).toBe(true);
    } finally {
      if (original === undefined) delete process.env['MA_VOICE_CUES'];
      else process.env['MA_VOICE_CUES'] = original;
    }
  });

  it('a hangok könyvtára a felvevővel AZONOS `process.cwd()`-konvenciót követi', () => {
    expect(resolveSoundsDir().replace(/\\/g, '/')).toContain('/src/_assets/sounds');
  });
});

describe('resolveSoundsDir — 🔴 a `cwd` NEM befolyásolhatja (mért hiba, 2026-09-09)', () => {

  // Az owner elo teszten: „semmilyen hangvisszajelzest nem kapok". A naplo:
  //   MA-VOICE-CUE-FAILED: A hangfajl NEM talalhato: …\my-assistant\src\_assets\sounds\…
  // A fajl a cli/src/_assets/sounds/-ban van; a keresés a repo GYOKEREBEN tortent, mert a
  // regi feloldas process.cwd()-t hasznalt — es a cwd attol fuggott, KI inditotta a figyelot.

  it('⭐ ugyanazt adja, bárhonnan is fut — a cwd megváltoztatása NEM számít', () => {
    const original: string = process.cwd();

    try {
      const fromHere: string = resolveSoundsDir();
      process.chdir(dirname(original));
      const fromParent: string = resolveSoundsDir();

      expect(fromParent).toBe(fromHere);
    } finally {
      process.chdir(original);
    }
  });

  it('✅ a feloldott könyvtárban TÉNYLEG ott vannak a hangok', () => {
    // ⛔ Nem eleg, hogy „ad egy utvonalat" — a hiba pont az volt, hogy ADOTT egyet, csak rosszat.
    expect(existsSync(join(resolveSoundsDir(), 'cue-heard.mp3'))).toBe(true);
  });
});

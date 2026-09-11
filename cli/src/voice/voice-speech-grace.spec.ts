// A türelmi idő tesztjei.
//
// > **Owner, 2026-09-11 01:15:** *„…meg utána még **talán plusz pár másodpercig** szüneteltetni
// > kéne a felolvasást."*
//
// ⭐ A *„talán"* miatt ez **paraméter**, ⛔ nem beégetett szám. A feladat kikötése: *„Alapérték
// 2-3 s, és állítható **ugyanott, ahol a hangerő**."*

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { VoiceSpeechGrace_Util } from './voice-speech-grace.js';

describe('VoiceSpeechGrace_Util — az alapérték és a sáv', () => {

  it('⭐ az alapérték a feladat sávjában van (2-3 s)', () => {
    expect(VoiceSpeechGrace_Util.DEFAULT_MS).toBeGreaterThanOrEqual(2_000);
    expect(VoiceSpeechGrace_Util.DEFAULT_MS).toBeLessThanOrEqual(3_000);
  });

  it('⚠️ a NULLA türelmi idő nem elfogadható — a levegővételbe belevágnánk', () => {
    expect(VoiceSpeechGrace_Util.parse(0).ok).toBeFalse();
    expect(VoiceSpeechGrace_Util.MIN_MS).toBeGreaterThan(0);
  });

  it('⚠️ a túl HOSSZÚ sem — az elhallgatásnak látszik', () => {
    // Egy néma rendszer és egy nagyon türelmes rendszer kívülről ugyanúgy néz ki.
    expect(VoiceSpeechGrace_Util.parse(60_000).ok).toBeFalse();
    expect(VoiceSpeechGrace_Util.parse(60_000).detail).toContain('sávon kívül');
  });

  it('a sávon belüli érték elfogadott', () => {
    expect(VoiceSpeechGrace_Util.parse(4_000)).toEqual({ ok: true, value: 4_000, detail: '4000 ms' });
  });

  it('a sztringet is értelmezi — az env-változó sztring', () => {
    expect(VoiceSpeechGrace_Util.parse(' 3000 ').value).toBe(3_000);
  });

  it('🔴 HIBÁS bemenetnél a MOSTANI érték marad — ⛔ nem esik csendben az alapértékre', () => {
    // Az owner beállításának néma eldobása a legrosszabb: azt hinné, beállította.
    const result = VoiceSpeechGrace_Util.parse('nem szám', 5_000);

    expect(result.ok).toBeFalse();
    expect(result.value).toBe(5_000);
    expect(result.detail.length).toBeGreaterThan(0);
  });
});

describe('VoiceSpeechGrace_Util — a tárolás (⭐ a hangerő MELLETT)', () => {

  let root: string;
  let path: string;
  const savedEnv: string | undefined = process.env['MA_VOICE_SPEECH_GRACE_MS'];

  beforeEach(async (): Promise<void> => {
    root = await mkdtemp(join(tmpdir(), 'ma-grace-'));
    path = join(root, 'voice', 'speech-grace.json');
    delete process.env['MA_VOICE_SPEECH_GRACE_MS'];
  });

  afterEach(async (): Promise<void> => {
    if (savedEnv === undefined) delete process.env['MA_VOICE_SPEECH_GRACE_MS'];
    else process.env['MA_VOICE_SPEECH_GRACE_MS'] = savedEnv;

    await rm(root, { recursive: true, force: true });
  });

  it('⭐ UGYANABBAN a könyvtárban van, mint a hangerő', () => {
    // A feladat kikötése: „állítható ugyanott, ahol a hangerő".
    expect(VoiceSpeechGrace_Util.resolvePath('/home/x').replace(/\\/gu, '/'))
      .toBe('/home/x/.config/my-assistant/voice/speech-grace.json');
  });

  it('fájl nélkül az ALAPÉRTÉK jön', async (): Promise<void> => {
    expect(await VoiceSpeechGrace_Util.read(path)).toBe(VoiceSpeechGrace_Util.DEFAULT_MS);
  });

  it('⭐ az írás után az olvasás UGYANAZT adja', async (): Promise<void> => {
    const written = await VoiceSpeechGrace_Util.write(3_500, 'owner', path);

    expect(written.ok).toBeTrue();
    expect(await VoiceSpeechGrace_Util.read(path)).toBe(3_500);
    expect(JSON.parse(await readFile(path, 'utf-8')).setBy).toBe('owner');
  });

  it('⛔ HIBÁS értékre NEM ír — a meglévő beállítás marad', async (): Promise<void> => {
    await VoiceSpeechGrace_Util.write(3_000, 'owner', path);

    const rejected = await VoiceSpeechGrace_Util.write(999_999, 'agent', path);

    expect(rejected.ok).toBeFalse();
    expect(await VoiceSpeechGrace_Util.read(path)).toBe(3_000);
  });

  it('⭐ a KÖRNYEZETI VÁLTOZÓ üti a fájlt — próbához, a fájl elpiszkítása nélkül', async (): Promise<void> => {
    await VoiceSpeechGrace_Util.write(3_000, 'owner', path);
    process.env['MA_VOICE_SPEECH_GRACE_MS'] = '1200';

    expect(await VoiceSpeechGrace_Util.read(path)).toBe(1_200);
  });

  it('⛔ SÉRÜLT fájlnál sem dob — az alapérték jön', async (): Promise<void> => {
    await writeFile(path.replace(/speech-grace\.json$/u, 'x'), '', 'utf-8').catch((): void => {});
    await VoiceSpeechGrace_Util.write(3_000, 'owner', path);
    await writeFile(path, '{ ez nem json', 'utf-8');

    expect(await VoiceSpeechGrace_Util.read(path)).toBe(VoiceSpeechGrace_Util.DEFAULT_MS);
  });

  it('⛔ a sávon kívüli TÁROLT értéket sem fogadja el — az alapérték jön', async (): Promise<void> => {
    await VoiceSpeechGrace_Util.write(3_000, 'owner', path);
    await writeFile(path, JSON.stringify({ graceMs: 999_999 }), 'utf-8');

    expect(await VoiceSpeechGrace_Util.read(path)).toBe(VoiceSpeechGrace_Util.DEFAULT_MS);
  });
});

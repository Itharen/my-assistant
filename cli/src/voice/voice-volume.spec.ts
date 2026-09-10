// A hang-csatorna hangerő-beállításának tesztjei.
//
// 🔴 MIÉRT LÉTEZIK: 2026-09-10-én az owner kérte, hogy a hangerő állítható legyen — és a mérés
// azt adta, hogy **egyáltalán nem volt mit állítani**: a lejátszó `inlineVolume: false`-szal
// dolgozott. Ez a suite azt őrzi, hogy a beállítás (a) létezik, (b) **nem csonkol csendben**,
// és (c) a hibás érték **nem írja felül** a jót.

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DEFAULT_VOICE_VOLUME,
  MAX_VOICE_VOLUME,
  parseVoiceVolume,
  readVoiceVolume,
  resolveVoiceVolumePath,
  writeVoiceVolume,
  type VoiceVolumeFile,
} from './voice-volume.js';

describe('parseVoiceVolume — az értelmezés', () => {

  it('a sávon belüli számot elfogadja', () => {
    expect(parseVoiceVolume('0.6')).toEqual({ ok: true, value: 0.6 });
  });

  it('a tizedes vesszőt is érti — a magyar billentyűzet ezt adja', () => {
    expect(parseVoiceVolume('0,4').value).toBe(0.4);
  });

  it('a 0 ÉRVÉNYES — a teljes elhallgatás valódi választás', () => {
    expect(parseVoiceVolume('0')).toEqual({ ok: true, value: 0 });
  });

  it('két tizedesre kerekít — különben a visszaolvasás MÁST mutatna, mint a bemenet', () => {
    expect(parseVoiceVolume(0.6000000000000001).value).toBe(0.6);
  });

  describe('⛔ NEM csonkol csendben', () => {

    it('a sáv fölötti értéket ELUTASÍTJA, nem kerekíti a plafonra', () => {
      // ⚠️ Ha némán 2.0 lenne belőle, a hívó azt hinné, hogy a 3 „működött", és a
      // következő próbája 5 lenne. A hiba-üzenet tanít, a csendes csonkolás félrevezet.
      const result = parseVoiceVolume('3');

      expect(result.ok).toBeFalse();
      expect(result.detail).toContain('kívül van');
      expect(result.remedy).toBeDefined();
    });

    it('a negatív értéket elutasítja', () => {
      expect(parseVoiceVolume('-0.5').ok).toBeFalse();
    });

    it('a nem-számot elutasítja, és MEGMONDJA, mi volt a baj', () => {
      const result = parseVoiceVolume('hangosan');

      expect(result.ok).toBeFalse();
      expect(result.detail).toContain('hangosan');
    });

    it('az üres bemenetet elutasítja', () => {
      expect(parseVoiceVolume('').ok).toBeFalse();
      expect(parseVoiceVolume(undefined).ok).toBeFalse();
    });
  });

  it('🔴 bukásnál a JELENLEGI értéket adja vissza — nem az alapértéket', () => {
    // ⚠️ Enélkül egy elgépelt beállítás VISSZAÁLLÍTANÁ az alapértékre azt, amit az owner
    // korábban gondosan beállított — vagyis a hibás bemenet kárt tenne.
    expect(parseVoiceVolume('nem-szam', 0.3).value).toBe(0.3);
  });
});

describe('readVoiceVolume / writeVoiceVolume — a tárolás', () => {

  let root: string;
  let path: string;
  const savedEnv: string | undefined = process.env['MA_VOICE_VOLUME'];

  beforeEach(async (): Promise<void> => {
    root = await mkdtemp(join(tmpdir(), 'ma-voice-vol-'));
    path = join(root, 'volume.json');
    delete process.env['MA_VOICE_VOLUME'];
  });

  afterEach(async (): Promise<void> => {
    await rm(root, { recursive: true, force: true });

    if (savedEnv === undefined) {
      delete process.env['MA_VOICE_VOLUME'];
    } else {
      process.env['MA_VOICE_VOLUME'] = savedEnv;
    }
  });

  it('beállítás nélkül az ALAPÉRTÉK jön — ami egyezik a mai tényleges szinttel', async (): Promise<void> => {
    expect(await readVoiceVolume(path)).toBe(DEFAULT_VOICE_VOLUME);
  });

  it('a beírt érték visszaolvasható', async (): Promise<void> => {
    await writeVoiceVolume('0.45', 'agent', path);

    expect(await readVoiceVolume(path)).toBe(0.45);
  });

  it('rögzíti, KI állította — az owner felülete és az agent elkülöníthető', async (): Promise<void> => {
    await writeVoiceVolume('0.8', 'owner', path);

    const file: VoiceVolumeFile = JSON.parse(await readFile(path, 'utf-8')) as VoiceVolumeFile;

    expect(file.setBy).toBe('owner');
    expect(file.updatedAt).toBeDefined();
  });

  it('⛔ HIBÁS bemenetnél NEM ír — a korábbi beállítás sértetlen marad', async (): Promise<void> => {
    await writeVoiceVolume('0.25', 'owner', path);

    const result = await writeVoiceVolume('12', 'agent', path);

    expect(result.ok).toBeFalse();
    expect(await readVoiceVolume(path)).toBe(0.25);
  });

  it('⚠️ a SÉRÜLT fájlnál az alapérték jön — de ⛔ nem dob', async (): Promise<void> => {
    await writeFile(path, '{ ez nem json', 'utf-8');

    await expectAsync(readVoiceVolume(path)).toBeResolvedTo(DEFAULT_VOICE_VOLUME);
  });

  it('a környezeti változó FELÜLÍRJA a fájlt — próbához, teszthez', async (): Promise<void> => {
    await writeVoiceVolume('0.2', 'owner', path);
    process.env['MA_VOICE_VOLUME'] = '0.9';

    expect(await readVoiceVolume(path)).toBe(0.9);
  });

  it('az ÉRVÉNYTELEN környezeti változó nem üti ki a fájlt', async (): Promise<void> => {
    // ⚠️ Egy elgépelt env-érték ne törölje el az owner beállítását — csak legyen figyelmen kívül.
    await writeVoiceVolume('0.2', 'owner', path);
    process.env['MA_VOICE_VOLUME'] = 'hangosabban';

    expect(await readVoiceVolume(path)).toBe(0.2);
  });

  it(`a plafon ${MAX_VOICE_VOLUME} — az erősítés megengedett, mert a forrás-fájl lehet halk`, async (): Promise<void> => {
    expect((await writeVoiceVolume(String(MAX_VOICE_VOLUME), 'owner', path)).ok).toBeTrue();
    expect(await readVoiceVolume(path)).toBe(MAX_VOICE_VOLUME);
  });

  it('az útvonal a felhasználó config-könyvtárában van — ⛔ NEM a repóban', () => {
    const resolved: string = resolveVoiceVolumePath('/home/teszt');

    expect(resolved.replace(/\\/gu, '/')).toBe('/home/teszt/.config/my-assistant/voice/volume.json');
  });
});

// A kimenő-napló-figyelő tesztjei.
//
// 🔴 A LEGFONTOSABB ÁLLÍTÁS ITT: **indulásnál NEM olvassuk fel az előzményt.** Enélkül a
// figyelő minden újraindulásnál bezúdítaná az egész napi üzenet-forgalmat hangban — ami a
// leghangosabb elképzelhető hibafajta, és pont az ellenkezője annak, amit az owner kért.
//
// ⭐ A második: aki NINCS bent, annak nem olvasunk fel — de a bejegyzés **akkor is
// ismertté válik**, különben a belépés pillanatában ömlene rá az összes korábbi üzenet.

import { appendFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { VoiceReadAloudWatcher } from './voice-read-aloud-watcher.js';

/** Egy napló-sor. */
function line(sentAt: string, text: string, kind: string = 'reply'): string {
  return `${JSON.stringify({ sentAt: sentAt, kind: kind, text: text })}\n`;
}

/** Megvárja, hogy a fájl-esemény átfusson a rendszeren. */
async function settle(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 250));
}

describe('VoiceReadAloudWatcher', () => {

  let root: string;
  let logPath: string;
  let spokenTexts: string[];
  let notes: string[];
  let watcher: VoiceReadAloudWatcher | null = null;
  let ownerPresent: boolean;

  function makeWatcher(): VoiceReadAloudWatcher {
    return new VoiceReadAloudWatcher({
      logPath: logPath,
      isOwnerPresent: (): boolean => ownerPresent,
      speak: async (text: string): Promise<void> => {
        spokenTexts.push(text);
      },
      onNote: (detail: string): void => {
        notes.push(detail);
      },
    });
  }

  beforeEach(async (): Promise<void> => {
    root = await mkdtemp(join(tmpdir(), 'ma-read-aloud-'));
    logPath = join(root, 'outbound-log.jsonl');
    spokenTexts = [];
    notes = [];
    ownerPresent = true;
  });

  afterEach(async (): Promise<void> => {
    watcher?.stop();
    watcher = null;
    await rm(root, { recursive: true, force: true });
  });

  it('🔴 INDULÁSNÁL az előzményt NEM olvassa fel — csak megjegyzi', async (): Promise<void> => {
    await writeFile(logPath, line('2026-09-10T18:00:00+02:00', 'Régi üzenet egy.')
      + line('2026-09-10T18:01:00+02:00', 'Régi üzenet kettő.'), 'utf-8');

    watcher = makeWatcher();
    await watcher.start();
    await settle();

    expect(spokenTexts).toEqual([]);
  });

  it('⭐ az ÚJ bejegyzést felolvassa — kimondhatóvá alakítva', async (): Promise<void> => {
    await writeFile(logPath, line('2026-09-10T18:00:00+02:00', 'Régi.'), 'utf-8');
    watcher = makeWatcher();
    await watcher.start();

    await appendFile(logPath, line('2026-09-10T18:05:00+02:00', 'Kész a **javítás**.'), 'utf-8');
    await settle();

    // A markdown-dísz eltűnt: a fordítás lefutott.
    expect(spokenTexts).toEqual(['Kész a javítás.']);
  });

  it('⛔ ha az owner NINCS bent, nem olvas fel — de a bejegyzést ISMERTTÉ teszi', async (): Promise<void> => {
    // ⚠️ Enélkül a belépés pillanatában ömlene rá az összes korábbi üzenet.
    await writeFile(logPath, line('2026-09-10T18:00:00+02:00', 'Régi.'), 'utf-8');
    watcher = makeWatcher();
    await watcher.start();

    ownerPresent = false;
    await appendFile(logPath, line('2026-09-10T18:05:00+02:00', 'Ezt nem hallja.'), 'utf-8');
    await settle();

    expect(spokenTexts).toEqual([]);

    // Most belép — a KORÁBBI üzenet akkor sem hangzik el.
    ownerPresent = true;
    await appendFile(logPath, line('2026-09-10T18:06:00+02:00', 'Ezt igen.'), 'utf-8');
    await settle();

    expect(spokenTexts).toEqual(['Ezt igen.']);
  });

  it('⛔ a NYUGTÁT (ack) nem olvassa fel', async (): Promise<void> => {
    await writeFile(logPath, '', 'utf-8');
    watcher = makeWatcher();
    await watcher.start();

    await appendFile(logPath, line('2026-09-10T18:05:00+02:00', 'Megkaptam.', 'ack'), 'utf-8');
    await settle();

    expect(spokenTexts).toEqual([]);
  });

  it('MINDEN kihagyás OKOT ír — ⛔ a néma kihagyás nem derülne ki', async (): Promise<void> => {
    await writeFile(logPath, '', 'utf-8');
    watcher = makeWatcher();
    await watcher.start();

    ownerPresent = false;
    await appendFile(logPath, line('2026-09-10T18:05:00+02:00', 'Valami.'), 'utf-8');
    await settle();

    expect(notes.some((n: string): boolean => n.includes('nincs bent'))).toBeTrue();
  });

  it('⚠️ még NEM létező naplónál sem dob — csak jelzi', async (): Promise<void> => {
    watcher = makeWatcher();

    await expectAsync(watcher.start()).toBeResolved();
    expect(notes.some((n: string): boolean => n.includes('még nem létezik'))).toBeTrue();
  });

  it('a CSONKA utolsó sor nem buktatja meg a feldolgozást', async (): Promise<void> => {
    await writeFile(logPath, '', 'utf-8');
    watcher = makeWatcher();
    await watcher.start();

    await appendFile(logPath, line('2026-09-10T18:05:00+02:00', 'Rendes.'), 'utf-8');
    await appendFile(logPath, '{"sentAt":"2026-09-10T18:06', 'utf-8');
    await settle();

    expect(spokenTexts).toEqual(['Rendes.']);
  });
});

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readPresence } from './presence.reader.js';

const NOW = new Date('2026-09-06T15:00:00+02:00');

function makeDirectory(): string {
  return mkdtempSync(join(tmpdir(), 'ma-presence-'));
}

function sampleLine(minutesAgo: number, idleState: 'active' | 'idle'): string {
  return JSON.stringify({
    timestamp: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString(),
    processName: 'Code',
    windowTitle: 'teszt',
    idleSeconds: idleState === 'idle' ? 900 : 3,
    idleState,
  });
}

describe('readPresence', () => {
  it('reports unknown — never "not home" — when the data directory is missing', async () => {
    const snapshot = await readPresence(join(makeDirectory(), 'nincs-ilyen'), NOW);

    expect(snapshot.isHome).toBe('unknown');
  });

  it('reports unknown when the directory exists but holds no usable measurement', async () => {
    const snapshot = await readPresence(makeDirectory(), NOW);

    expect(snapshot.isHome).toBe('unknown');
  });

  it('reports home when a recent sample shows input activity', async () => {
    const directory = makeDirectory();

    writeFileSync(join(directory, '2026-09-06.jsonl'), `${sampleLine(2, 'active')}\n`, 'utf-8');

    const snapshot = await readPresence(directory, NOW);

    expect(snapshot.isHome).toBe('yes');
  });

  it('reports not-home when a recent sample shows the machine sitting idle', async () => {
    const directory = makeDirectory();

    writeFileSync(join(directory, '2026-09-06.jsonl'), `${sampleLine(2, 'idle')}\n`, 'utf-8');

    const snapshot = await readPresence(directory, NOW);

    expect(snapshot.isHome).toBe('no');
  });

  it('treats a stale measurement as unknown rather than as an answer', async () => {
    const directory = makeDirectory();

    writeFileSync(join(directory, '2026-09-06.jsonl'), `${sampleLine(120, 'active')}\n`, 'utf-8');

    const snapshot = await readPresence(directory, NOW);

    expect(snapshot.isHome).toBe('unknown');
    expect(snapshot.reason).toContain('nem fut');
  });

  it('falls back to the previous day file when today\'s file is still empty', async () => {
    const directory = makeDirectory();

    // Éjfél utáni állapot: az új napi fájl létrejött, de még üres.
    writeFileSync(join(directory, '2026-09-06.jsonl'), '', 'utf-8');
    writeFileSync(join(directory, '2026-09-05.jsonl'), `${sampleLine(3, 'active')}\n`, 'utf-8');

    const snapshot = await readPresence(directory, NOW);

    expect(snapshot.isHome).toBe('yes');
  });

  it('skips a corrupted trailing line and still finds the last good sample', async () => {
    const directory = makeDirectory();

    writeFileSync(
      join(directory, '2026-09-06.jsonl'),
      `${sampleLine(2, 'active')}\n{"timestamp":"csonka`,
      'utf-8',
    );

    const snapshot = await readPresence(directory, NOW);

    expect(snapshot.isHome).toBe('yes');
  });

  it('tolerates a byte-order mark written by the PowerShell logger', async () => {
    const directory = makeDirectory();

    writeFileSync(join(directory, '2026-09-06.jsonl'), `﻿${sampleLine(2, 'active')}\n`, 'utf-8');

    const snapshot = await readPresence(directory, NOW);

    expect(snapshot.isHome).toBe('yes');
  });
});

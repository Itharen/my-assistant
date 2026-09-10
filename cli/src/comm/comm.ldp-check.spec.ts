import { mkdtempSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LDP_STATUS_STALE_MS, readLdpStatus } from './comm.ldp-check.js';

const NOW = new Date('2026-09-07T12:00:00+02:00');

function writeStatus(content: unknown, ageMs: number = 0): string {
  const file: string = join(mkdtempSync(join(tmpdir(), 'ma-ldp-')), 'status.json');

  writeFileSync(file, JSON.stringify(content), 'utf-8');

  const when: Date = new Date(NOW.getTime() - ageMs);

  utimesSync(file, when, when);

  return file;
}

describe('readLdpStatus', () => {

  it('FUT, ha a fajl friss ES a folyamat el', () => {
    const file = writeStatus({ pid: 4242, phase: 'server-runtime' });
    const status = readLdpStatus(file, NOW, () => true);

    expect(status.state).toBe('running');
    expect(status.pid).toBe(4242);
    expect(status.detail).toContain('server-runtime');
  });

  it('🔴 HALOTT, ha a fajl megvan, de a FOLYAMAT mar nem el', () => {
    // EZ A LENYEG: a status.json a lemezen marad akkor is, ha a folyamat reg meghalt.
    // Fajl-alapon "fut"-nak latszana — es kozben a Discord-csatorna NEMA.
    const file = writeStatus({ pid: 4242, phase: 'server-runtime' });
    const status = readLdpStatus(file, NOW, () => false);

    expect(status.state).toBe('dead');
    expect(status.detail).toContain('NEM FUT');
    expect(status.remedy).toContain('dc ldp');
  });

  it('HALOTT, ha nincs folyamat-azonosito a fajlban', () => {
    const status = readLdpStatus(writeStatus({ phase: 'server-runtime' }), NOW, () => true);

    expect(status.state).toBe('dead');
  });

  it('NINCS, ha a fajl sem letezik', () => {
    const status = readLdpStatus(join(tmpdir(), 'nincs-ilyen-ldp-status.json'), NOW, () => true);

    expect(status.state).toBe('absent');
    expect(status.remedy).toContain('dc ldp');
  });

  it('⚠️ ELAVULT, ha a folyamat el, de a fajl regen frissult', () => {
    const file = writeStatus({ pid: 4242 }, LDP_STATUS_STALE_MS + 60_000);
    const status = readLdpStatus(file, NOW, () => true);

    expect(status.state).toBe('stale');
    expect(status.detail).toContain('beragadt');
  });

  it('a hatar alatt meg FUT-nak szamit', () => {
    const file = writeStatus({ pid: 4242 }, LDP_STATUS_STALE_MS - 60_000);

    expect(readLdpStatus(file, NOW, () => true).state).toBe('running');
  });

  it('serult JSON-on nem hasal el', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'ma-ldp-')), 'status.json');

    writeFileSync(file, '{ ez nem json', 'utf-8');

    expect(readLdpStatus(file, NOW, () => true).state).toBe('absent');
  });
});

describe('readLdpStatus — 🔴 a CSENDES PIHENÉS nem beragadás (mért hamis riasztás)', () => {

  // Négy körön át vizsgáltam ki, hogy nincs semmi baj. Mérve 2026-09-10 09:01:
  // „az állapot-fájl 538 perce nem frissült" — miközben a szerver és MINDKÉT figyelő
  // 1 perces életjellel élt. A befejezett pipeline `server-runtime` fázisban ül, és
  // nincs mit írnia, amíg nem érkezik új változás.

  it('⭐ KÉSZ pipeline + régi fájl ⇒ `running`, NEM `stale`', () => {
    const file = writeStatus(
      { pid: 4242, phase: 'server-runtime', pipelineComplete: true },
      LDP_STATUS_STALE_MS + 9 * 60 * 60_000,
    );
    const status = readLdpStatus(file, NOW, () => true);

    expect(status.state).toBe('running');
    expect(status.detail).not.toContain('beragadt');
  });

  it('⛔ de a KORT továbbra is kiírjuk — nem hallgatjuk el', () => {
    const file = writeStatus(
      { pid: 4242, phase: 'server-runtime', pipelineComplete: true },
      LDP_STATUS_STALE_MS + 60_000,
    );

    expect(readLdpStatus(file, NOW, () => true).detail).toContain('perce');
  });

  it('🔴 NEM KÉSZ pipeline + régi fájl ⇒ továbbra is `stale` — ez a valódi gyanú', () => {
    const file = writeStatus(
      { pid: 4242, phase: 'client-test', pipelineComplete: false },
      LDP_STATUS_STALE_MS + 60_000,
    );
    const status = readLdpStatus(file, NOW, () => true);

    expect(status.state).toBe('stale');
    expect(status.detail).toContain('beragadt');
  });

  it('⚠️ HIÁNYZÓ `pipelineComplete` ⇒ gyanú marad — nem feltételezünk készet', () => {
    const file = writeStatus({ pid: 4242 }, LDP_STATUS_STALE_MS + 60_000);

    expect(readLdpStatus(file, NOW, () => true).state).toBe('stale');
  });

  it('⛔ a HALOTT folyamat akkor is halott, ha a pipeline kész volt', () => {
    const file = writeStatus(
      { pid: 4242, phase: 'server-runtime', pipelineComplete: true },
      LDP_STATUS_STALE_MS + 60_000,
    );

    expect(readLdpStatus(file, NOW, () => false).state).toBe('dead');
  });
});

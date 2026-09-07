import { basename } from 'node:path';

import {
  buildVoiceFunnelReport,
  renderVoiceFunnel,
  resolveActionLogPath,
  type VoiceFunnelReport,
} from './voice-funnel-report.js';

/** Egy napló-sor összeállítása. */
function line(code: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ ts: '2026-09-07T22:00:00+02:00', kind: 'note', extra: { code: code, ...extra } });
}

async function build(lines: string[]): Promise<VoiceFunnelReport> {
  return buildVoiceFunnelReport({
    projectRoot: '/p',
    day: '2026-09-07',
    read: async (): Promise<string> => lines.join('\n'),
  });
}

describe('buildVoiceFunnelReport — az átviteli arány kiolvasása a naplóból', () => {
  it('⚪ hiányzó naplónál NEM dob, és a „nincs adat" megkülönböztethető a nullától', async () => {
    const report = await buildVoiceFunnelReport({
      projectRoot: '/p',
      day: '1999-01-01',
      read: async (): Promise<string> => {
        throw new Error('ENOENT');
      },
    });

    expect(report.hasData).toBe(false);
    expect(report.transferRatePct).toBeNull();
    expect(renderVoiceFunnel(report)).toContain('Nincs napló');
  });

  it('🔴 az owner 1%-os panasza kiszámolható belőle', async () => {
    const lines: string[] = [
      line('MA-VOICE-SPEECH-QUEUED'),
      ...Array.from({ length: 9 }, (): string =>
        line('MA-VOICE-SPEECH-DROPPED-SILENTLY', { reason: 'discarded-by-recorder', lostAudioSeconds: 2 })),
    ];

    const report = await build(lines);

    expect(report.queued).toBe(1);
    expect(report.droppedByRecorder).toBe(9);
    expect(report.transferRatePct).toBe(10);
    expect(report.lostAudioSeconds).toBe(18);
  });

  it('⭐ a megszólalás-számláló KUMULATÍV — maximumot veszünk, nem összeget', async () => {
    const report = await build([
      line('MA-VOICE-SPEECH-DETECTED', { detected: 1, delivered: 0 }),
      line('MA-VOICE-SPEECH-DETECTED', { detected: 2, delivered: 1 }),
      line('MA-VOICE-SPEECH-DETECTED', { detected: 3, delivered: 1 }),
    ]);

    expect(report.speechDetected).toBe(3);
    expect(report.delivered).toBe(1);
  });

  it('⛔ az ÜRES felvétel nem rontja az arányt (ott nem volt beszéd)', async () => {
    const report = await build([
      line('MA-VOICE-SPEECH-QUEUED'),
      line('MA-VOICE-SPEECH-DROPPED-SILENTLY', { reason: 'empty-file', lostAudioSeconds: 0 }),
    ]);

    expect(report.emptyFiles).toBe(1);
    expect(report.transferRatePct).toBe(100);
  });

  it('⛔ a DUPLIKÁTUM/idegen (`SKIPPED`) sem rontja az arányt', async () => {
    const report = await build([
      line('MA-VOICE-SPEECH-QUEUED'),
      line('MA-VOICE-SPEECH-SKIPPED'),
      line('MA-VOICE-SPEECH-SKIPPED'),
    ]);

    expect(report.skipped).toBe(2);
    expect(report.transferRatePct).toBe(100);
  });

  it('a felismerés UTÁNI veszteség beleszámít az arányba', async () => {
    const report = await build([
      line('MA-VOICE-SPEECH-QUEUED'),
      line('MA-VOICE-SPEECH-DROPPED'),
    ]);

    expect(report.droppedAfterTranscribe).toBe(1);
    expect(report.transferRatePct).toBe(50);
  });

  it('⚠️ megszólalás nélkül az arány `null`, NEM 0% (a 0% azt hazudná, hogy minden elveszett)', async () => {
    const report = await build([line('MA-VOICE-JOINED')]);

    expect(report.hasData).toBe(true);
    expect(report.transferRatePct).toBeNull();
    expect(renderVoiceFunnel(report)).toContain('nem mérhető');
  });

  it('⚠️ a SÉRÜLT sor nem buktatja meg a jelentést (append-only napló csonka vége)', async () => {
    const report = await build([
      line('MA-VOICE-SPEECH-QUEUED'),
      '{ ez nem json',
      line('MA-VOICE-SPEECH-QUEUED'),
    ]);

    expect(report.queued).toBe(2);
  });

  it('a nem hang-kódú sorokat figyelmen kívül hagyja', async () => {
    const report = await build([
      line('MA-DISCORD-SOMETHING'),
      JSON.stringify({ ts: 'x', kind: 'bash', summary: 'nincs extra' }),
      line('MA-VOICE-SPEECH-QUEUED'),
    ]);

    expect(report.queued).toBe(1);
  });

  it('az útvonal a napi akció-naplóra mutat', () => {
    expect(resolveActionLogPath('/p', '2026-09-07').replace(/\\/g, '/'))
      .toBe('/p/__agent/log/actions/2026-09-07.jsonl');
  });

  it('a renderelt tábla a 🔴 jelet adja alacsony aránynál, ✅-t magasnál', async () => {
    const bad = await build([
      line('MA-VOICE-SPEECH-QUEUED'),
      ...Array.from({ length: 9 }, (): string =>
        line('MA-VOICE-SPEECH-DROPPED-SILENTLY', { reason: 'discarded-by-recorder', lostAudioSeconds: 1 })),
    ]);
    const good = await build([
      ...Array.from({ length: 9 }, (): string => line('MA-VOICE-SPEECH-QUEUED')),
      line('MA-VOICE-SPEECH-DROPPED-SILENTLY', { reason: 'discarded-by-recorder', lostAudioSeconds: 1 }),
    ]);

    expect(renderVoiceFunnel(bad)).toContain('🔴 ÁTVITELI ARÁNY: 10%');
    expect(renderVoiceFunnel(good)).toContain('✅ ÁTVITELI ARÁNY: 90%');
  });
});

describe('kevés minta — az arány NEM állítható túl', () => {
  it('🔴 EGYETLEN sikeres felvétel nem „100% ✅" — a kevés minta JELEZVE van', async () => {
    const report = await buildVoiceFunnelReport({
      projectRoot: '/p',
      day: '2026-09-07',
      read: async (): Promise<string> => line('MA-VOICE-SPEECH-QUEUED'),
    });

    expect(report.attempts).toBe(1);
    expect(report.transferRatePct).toBe(100);

    const text: string = renderVoiceFunnel(report);

    expect(text).toContain('KEVÉS MINTA');
    expect(text).toContain('(1 megszólalásból)');
    expect(text).not.toContain('✅ ÁTVITELI ARÁNY');
  });

  it('elég mintánál viszont MEGJELENIK a minősítő jel', async () => {
    const lines: string[] = Array.from({ length: 8 }, (): string => line('MA-VOICE-SPEECH-QUEUED'));
    const report = await buildVoiceFunnelReport({
      projectRoot: '/p',
      day: '2026-09-07',
      read: async (): Promise<string> => lines.join('\n'),
    });

    expect(report.attempts).toBe(8);
    expect(renderVoiceFunnel(report)).toContain('✅ ÁTVITELI ARÁNY');
    expect(renderVoiceFunnel(report)).not.toContain('KEVÉS MINTA');
  });
});

describe('🔴 gördülő ablak — az éjfél NEM vághatja ketté a beszélgetést', () => {
  /** Egy sor konkrét időbélyeggel. */
  function at(ts: string, code: string, extra: Record<string, unknown> = {}): string {
    return JSON.stringify({ ts: ts, kind: 'note', extra: { code: code, ...extra } });
  }

  /** Hamis fájlrendszer napi fájlokkal. */
  function fsWith(files: Record<string, string[]>): (path: string) => Promise<string> {
    return async (path: string): Promise<string> => {
      // ⚠️ `basename`, nem regex: a napi fájl útvonala platformfüggő elválasztót használ
      // (`node:path.join`), és egy kézzel írt karakterosztály itt már egyszer elrontotta a
      // tesztet — a szabványos függvény mindkét platformon helyes.
      const day: string = basename(path, '.jsonl');
      const lines: string[] | undefined = files[day];

      if (!lines) throw new Error(`ENOENT: ${day}`);

      return lines.join('\n');
    };
  }

  const NOW = (): Date => new Date('2026-09-08T00:51:00+02:00');

  it('⭐ AZ ÉJFÉLEN ÁTNYÚLÓ beszélgetést EGYBEN méri (ez volt a mért hiba)', async () => {
    const report = await buildVoiceFunnelReport({
      projectRoot: '/p',
      now: NOW,
      read: fsWith({
        '2026-09-07': [
          at('2026-09-07T23:50:00+02:00', 'MA-VOICE-SPEECH-QUEUED'),
          at('2026-09-07T23:55:00+02:00', 'MA-VOICE-SPEECH-DROPPED-SILENTLY', {
            reason: 'discarded-by-recorder', lostAudioSeconds: 2,
          }),
        ],
        '2026-09-08': [at('2026-09-08T00:10:00+02:00', 'MA-VOICE-SPEECH-QUEUED')],
      }),
    });

    // 🔴 Naptári napokra bontva 09-07 → 50%, 09-08 → 100% lenne. Egyben: 2/3.
    expect(report.queued).toBe(2);
    expect(report.droppedByRecorder).toBe(1);
    expect(report.attempts).toBe(3);
    expect(report.transferRatePct).toBe(66.7);
    expect(report.windowLabel).toContain('elmúlt 12 óra');
  });

  it('az ablakon KÍVÜLI sor kimarad', async () => {
    const report = await buildVoiceFunnelReport({
      projectRoot: '/p',
      hours: 2,
      now: NOW,
      read: fsWith({
        '2026-09-07': [
          at('2026-09-07T12:00:00+02:00', 'MA-VOICE-SPEECH-QUEUED'),
          at('2026-09-07T23:50:00+02:00', 'MA-VOICE-SPEECH-QUEUED'),
        ],
        '2026-09-08': [],
      }),
    });

    expect(report.queued).toBe(1);
    expect(report.windowLabel).toContain('elmúlt 2 óra');
  });

  it('⚠️ a HIÁNYZÓ időbélyegű sor BENT marad — nem dobunk el mérési adatot metaadat-hiány miatt', async () => {
    const report = await buildVoiceFunnelReport({
      projectRoot: '/p',
      now: NOW,
      read: fsWith({
        '2026-09-08': [JSON.stringify({ kind: 'note', extra: { code: 'MA-VOICE-SPEECH-QUEUED' } })],
        '2026-09-07': [],
      }),
    });

    expect(report.queued).toBe(1);
  });

  it('⚠️ az ablakban lévő HIÁNYZÓ napi fájl nem hiba — a másik nap adata megjön', async () => {
    const report = await buildVoiceFunnelReport({
      projectRoot: '/p',
      now: NOW,
      read: fsWith({ '2026-09-07': [at('2026-09-07T23:00:00+02:00', 'MA-VOICE-SPEECH-QUEUED')] }),
    });

    expect(report.hasData).toBe(true);
    expect(report.queued).toBe(1);
  });

  it('`--day` módban viszont TÉNYLEG csak az a naptári nap számít', async () => {
    const report = await buildVoiceFunnelReport({
      projectRoot: '/p',
      day: '2026-09-07',
      now: NOW,
      read: fsWith({
        '2026-09-07': [at('2026-09-07T12:00:00+02:00', 'MA-VOICE-SPEECH-QUEUED')],
        '2026-09-08': [at('2026-09-08T00:10:00+02:00', 'MA-VOICE-SPEECH-QUEUED')],
      }),
    });

    expect(report.queued).toBe(1);
    expect(report.windowLabel).toContain('naptári nap');
  });

  it('a renderelt tábla MEGMONDJA az ablakot — üres jelentésnél is', async () => {
    const report = await buildVoiceFunnelReport({
      projectRoot: '/p',
      now: NOW,
      read: async (): Promise<string> => {
        throw new Error('ENOENT');
      },
    });

    expect(report.hasData).toBe(false);
    expect(renderVoiceFunnel(report)).toContain('elmúlt 12 óra');
  });
});

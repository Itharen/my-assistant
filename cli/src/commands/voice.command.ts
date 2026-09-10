// `ma voice volume [<érték>]` — a HANG-CSATORNA hangereje.
//
// > **Owner, 2026-09-10 18:27:** *„Nekem (agentként) állíthatónak kell lennie… és a My
// > Assistant felületén is szeretném tudni állítani."*
//
// ⭐ EZ AZ AGENT-OLDALI HOZZÁFÉRÉS. A felület a `PUT /api/voice/volume`-on ugyanezt a fájlt
// írja — **egy tárolt érték, három hozzáférési pont** *(l. `voice-volume.ts`)*.
//
// ⛔ NEM keverendő a `ma volume`-mal: az a **Cast-hangszóró** hangereje a lakásban. Ez a
// Discord hang-csatornába küldött hangunk szintje.

import { parseArgs } from 'node:util';

import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';
import { localTimeHeader } from '../utils/local-time.js';
import {
  DEFAULT_VOICE_VOLUME,
  MAX_VOICE_VOLUME,
  MIN_VOICE_VOLUME,
  readVoiceVolume,
  resolveVoiceVolumePath,
  writeVoiceVolume,
  type VoiceVolumeParse,
} from '../voice/voice-volume.js';

/** Egy szemléltető sáv a hangerőhöz — ránézésre olvasható, nem csak szám. */
function renderBar(volume: number): string {
  const width: number = 20;
  const filled: number = Math.round((volume / MAX_VOICE_VOLUME) * width);

  return `${'█'.repeat(Math.max(0, filled))}${'░'.repeat(Math.max(0, width - filled))}`;
}

export async function runVoiceCommand(subcommand: string, args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args,
    options: { json: { type: 'boolean' }, pretty: { type: 'boolean' } },
    strict: false,
    allowPositionals: true,
  });

  if (subcommand !== 'volume') {
    process.stderr.write(
      `Ismeretlen voice subcommand: "${subcommand}". Használat: ma voice volume [<érték>]\n`,
    );
    process.exitCode = 1;

    return;
  }
  const raw: string = String(parsed.positionals[0] ?? '').trim();

  // ── OLVASÁS ──────────────────────────────────────────────────────────────────
  if (!raw) {
    const current: number = await readVoiceVolume();

    if (parsed.values.json) {
      writeEnvelope(ok('voice.volume', requestId, startedAt, {
        volume: current,
        default: DEFAULT_VOICE_VOLUME,
        min: MIN_VOICE_VOLUME,
        max: MAX_VOICE_VOLUME,
        storedAt: resolveVoiceVolumePath(),
      }), parsed.values.pretty === true);

      return;
    }

    process.stdout.write(
      `\n🔊 Hang-csatorna hangerő: ${current.toFixed(2)}\n`
      + `  ${renderBar(current)}  (${MIN_VOICE_VOLUME}–${MAX_VOICE_VOLUME}, alapérték ${DEFAULT_VOICE_VOLUME})\n`
      + `  ${localTimeHeader()}\n\n`
      + '  Állítás: ma voice volume 0.6\n\n',
    );

    return;
  }

  // ── ÍRÁS ─────────────────────────────────────────────────────────────────────
  const result: VoiceVolumeParse = await writeVoiceVolume(raw, 'agent');

  if (parsed.values.json) {
    writeEnvelope(ok('voice.volume', requestId, startedAt, result), parsed.values.pretty === true);

    if (!result.ok) process.exitCode = 1;

    return;
  }

  if (!result.ok) {
    // ⛔ A hiba SOSEM csendes: látszódjon, MI a baj és MIT tegyen a hívó.
    process.stderr.write(
      `\n🔴 A hangerő NEM változott: ${result.detail ?? '(nincs részlet)'}\n`
      + `   → ${result.remedy ?? ''}\n`
      + `   A jelenlegi érték változatlan: ${result.value.toFixed(2)}\n\n`,
    );
    process.exitCode = 1;

    return;
  }

  process.stdout.write(
    `\n✅ Hang-csatorna hangerő: ${result.value.toFixed(2)}\n`
    + `  ${renderBar(result.value)}\n`
    + `  ${localTimeHeader()}\n\n`
    // ⚠️ A következő lejátszáskor lép érvénybe — a már szóló hangot nem módosítja.
    + '  A következő hang-jelzésnél lesz hallható.\n\n',
  );
}

// `ma tick plan` — megmutatja, MIT TENNE az óránkénti Assistant-tick most.
//
// ⚠️ Ez SZÁRAZ FUTÁS: nem küld üzenetet és nem szólal meg. Azért van, hogy a döntés
// ellenőrizhető legyen, MIELŐTT élesben bármit tenne — és hogy a workflow-szabályokat
// az owner-rel valós adaton lehessen finomítani.

import { parseArgs } from 'node:util';

import { logAction } from '../action-log/action-log.client.js';
import { runPresenceGate } from '../cast/notify.gate-runner.js';
import { buildStatusDigest } from '../status/status.digest.js';
import { decideTick } from '../tick/tick.decider.js';
import type { TickDecision } from '../tick/tick.models.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

const CHANNEL_LABEL: Record<string, string> = {
  speaker: '🔊 Hangszóró',
  discord: '💬 Discord',
};

const ACTION_LABEL: Record<TickDecision['action'], string> = {
  notify: '📤 SZÓLNA',
  hold: '🔒 GYŰJT',
  silent: '🤫 CSENDES',
};

export async function runTickCommand(subcommand: string, args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args,
    options: { json: { type: 'boolean' }, pretty: { type: 'boolean' } },
    strict: false,
  });

  if (subcommand !== 'plan') {
    process.stderr.write(`Ismeretlen tick subcommand: "${subcommand}". Használat: plan\n`);
    process.exitCode = 1;
    return;
  }

  const now: Date = new Date();
  const [digest, gate] = await Promise.all([buildStatusDigest({ now }), runPresenceGate(now)]);
  const decision: TickDecision = decideTick({ digest, gate, now });

  // 🔴 Workflow-szabály (§4, 7. pont): „Minden döntés az akció-naplóba — A CSENDES TICK IS."
  // A csendes tick naplózása azért kötelező, mert különben nem lehet megkülönböztetni azt,
  // hogy a tick lefutott és úgy döntött, hogy hallgat — attól, hogy EL SEM INDULT.
  await logAction({
    kind: 'note',
    summary: `[tick/${decision.mode}] ${decision.action}`
      + `${decision.channel ? ` → ${decision.channel}` : ''}`
      + ` (${decision.items.length} tétel) — ${decision.reason}`,
    extra: {
      code: 'MA-TICK-DECISION',
      dryRun: true,
      mode: decision.mode,
      action: decision.action,
      channel: decision.channel,
      itemRefs: decision.items.map((item) => item.ref),
      digestPartial: digest.isPartial,
      gateAllowed: gate.allowed,
      gateSignals: gate.signals,
    },
  });

  if (parsed.values.json) {
    writeEnvelope(
      ok('tick.plan', requestId, startedAt, { decision, gate, digestHeadline: digest.headline }),
      Boolean(parsed.values.pretty),
    );
    return;
  }

  process.stdout.write(render(decision, gate.reason, digest.headline));
}

function render(decision: TickDecision, gateReason: string, digestHeadline: string): string {
  const lines: string[] = ['', '  TICK — SZÁRAZ FUTÁS (nem küld semmit)', ''];

  lines.push(`  Mód:      ${decision.mode === 'daytime' ? '☀️ Daytime (ébren)' : '🌙 Nighttime'}`);
  lines.push(`  Döntés:   ${ACTION_LABEL[decision.action]}`
    + (decision.channel ? ` — ${CHANNEL_LABEL[decision.channel]}` : ''));
  lines.push(`  Indok:    ${decision.reason}`);
  lines.push('');
  lines.push(`  Kapu:     ${gateReason}`);
  lines.push(`  Kivonat:  ${digestHeadline}`);
  lines.push('');

  if (decision.items.length > 0) {
    lines.push(`  ── Érintett tételek (${decision.items.length}) ──`);

    for (const item of decision.items) {
      const due: string = item.dueDate || item.notifyAt;

      lines.push(`  • ${item.title}${due ? ` — ${due}` : ''}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

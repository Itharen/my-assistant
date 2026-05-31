// scripts/agent-handlers/src/dispatch.ts
// Main entry. Reads agent JSON output (stdin or --file), validates, gates
// by tier, executes handlers, logs everything.
//
// Exit codes:
//   0 — all actions completed successfully (or were intentionally skipped)
//   2 — input validation failed (no actions executed)
//   3 — runtime error during handler execution

import { promises as fs } from 'node:fs';
import { validateAgentOutput } from './schema.js';
import { gateAction } from './tiers.js';
import { logAction } from './action-log.js';
import { readTickState, updateTickState, rolloverIfNewDay } from './state.js';
import { handleLog } from './handlers/log.js';
import { handleUserInputNew } from './handlers/user-input-new.js';
import { handleUpdateStatus } from './handlers/update-status.js';
import { handleNotifyCast } from './handlers/notify-cast.js';
import { handleCcapNotify } from './handlers/ccap-notify.js';
import { handleNotifyDiscord } from './handlers/notify-discord.js';
import { handleNotifyPush } from './handlers/notify-push.js';
import { handleTaskCreate } from './handlers/task-create.js';
import { handleTaskUpdate } from './handlers/task-update.js';
import { handleFrStatusChange } from './handlers/fr-status-change.js';
import { handlePlanStepMarkDone } from './handlers/plan-step-mark-done.js';
import type { Action, AgentName, AgentOutput, DispatchResult } from './types.js';

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (buf += chunk));
    process.stdin.on('end', () => resolve(buf));
    process.stdin.on('error', reject);
  });
}

async function readInput(): Promise<string> {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    return fs.readFile(args[fileIdx + 1]!, 'utf8');
  }
  if (process.stdin.isTTY) {
    throw new Error('No input. Pass JSON via stdin or --file <path>.');
  }
  return readStdin();
}

/**
 * Naive sleep-window detection. Phase 2 will replace this with the real
 * sleep-system + activity-monitor inference. For now: 02:00–08:00 fallback.
 */
function isSleepingNow(): boolean {
  const h = new Date().getHours();
  return h >= 2 && h < 8;
}

async function executeAction(action: Action): Promise<void> {
  switch (action.type) {
    case 'log':
      return handleLog(action);
    case 'user-input-new':
      return handleUserInputNew(action);
    case 'update-status':
      return handleUpdateStatus(action);
    case 'notify-cast':
      return handleNotifyCast(action);
    case 'ccap-notify':
      return handleCcapNotify(action);
    case 'notify-discord':
      return handleNotifyDiscord(action);
    case 'notify-push':
      return handleNotifyPush(action);
    case 'task-create':
      return handleTaskCreate(action);
    case 'task-update':
      return handleTaskUpdate(action);
    case 'fr-status-change':
      return handleFrStatusChange(action);
    case 'plan-step-mark-done':
      return handlePlanStepMarkDone(action);
  }
}

async function main(): Promise<void> {
  const raw = await readInput();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`[dispatch] JSON parse error: ${(err as Error).message}\n`);
    await logAction({
      actor: 'agent-dispatcher',
      kind: 'error',
      summary: `dispatch: JSON parse error — ${(err as Error).message}`,
    });
    process.exit(2);
  }

  const validation = validateAgentOutput(parsed);
  if (!validation.ok || !validation.output) {
    const errSummary = validation.errors
      .slice(0, 5)
      .map((e) => `${e.path}: ${e.message}`)
      .join('; ');
    process.stderr.write(`[dispatch] Validation failed:\n${errSummary}\n`);
    await logAction({
      actor: 'agent-dispatcher',
      kind: 'error',
      summary: `dispatch: validation failed — ${errSummary}`,
      extra: { errors: validation.errors },
    });
    process.exit(2);
  }

  const output: AgentOutput = validation.output;
  const agent: AgentName = output.agent ?? 'assistant-cron';   // default backward-compat
  const isSleeping = isSleepingNow();

  // Tick-start log
  await logAction({
    actor: `agent-dispatcher:${agent}`,
    kind: 'flow-start',
    summary: `${agent} tick: verdict=${output.verdict}, ${output.actions.length} action(s), sleeping=${isSleeping}`,
    extra: {
      agent,
      reason: output.reason,
      tickedAt: output.tickMeta.tickedAt,
      inputDigest: output.tickMeta.inputDigest,
    },
  });

  const result: DispatchResult = {
    ok: true,
    total: output.actions.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  for (let i = 0; i < output.actions.length; i++) {
    const action = output.actions[i]!;
    const gate = gateAction(action, { isSleeping });
    if (!gate.ok) {
      result.skipped++;
      result.details.push({ index: i, type: action.type, status: 'skipped', reason: gate.reason });
      await logAction({
        actor: 'agent-dispatcher',
        kind: 'note',
        summary: `dispatch: action[${i}] (${action.type}) skipped — ${gate.reason}`,
      });
      continue;
    }

    try {
      await executeAction(action);
      result.succeeded++;
      result.details.push({ index: i, type: action.type, status: 'ok' });
    } catch (err) {
      result.ok = false;
      result.failed++;
      result.details.push({
        index: i,
        type: action.type,
        status: 'failed',
        reason: (err as Error).message,
      });
      await logAction({
        actor: 'agent-dispatcher',
        kind: 'error',
        summary: `dispatch: action[${i}] (${action.type}) failed — ${(err as Error).message}`,
      });
    }
  }

  // Update tick state (per-agent routing — Phase 1.5)
  const now = new Date();
  let state = await readTickState(agent);
  state = rolloverIfNewDay(state, now);
  await updateTickState(
    {
      lastTickAt: now.toISOString(),
      tickCounter: state.tickCounter + 1,
      currentDay: state.currentDay,
      dailyTickCount: state.dailyTickCount + 1,
      lastVerdict: output.verdict,
      lastReason: output.reason,
    },
    agent,
  );

  // Tick-end log + summary on stdout
  await logAction({
    actor: `agent-dispatcher:${agent}`,
    kind: 'flow-end',
    summary: `${agent} tick done: ok=${result.succeeded}, failed=${result.failed}, skipped=${result.skipped}`,
    extra: { details: result.details },
  });

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 3);
}

main().catch(async (err) => {
  process.stderr.write(`[dispatch] FATAL: ${(err as Error).message}\n`);
  await logAction({
    actor: 'agent-dispatcher',
    kind: 'error',
    summary: `dispatch: FATAL — ${(err as Error).message}`,
  });
  process.exit(3);
});

// scripts/agent-handlers/src/handlers/notify-cast.ts
// Tier 1 — FR #1 communication-forms Phase 2.
// Shell-out a `ma cast notify` parancsra (Google Home / Cast cluster TTS csatorna).
//
// Phase 4 (közös throttle): külön cycle. Itt csak args-passing.

import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { existsSync } from 'node:fs';
import { logAction } from '../action-log.js';
import { paths } from '../paths.js';
import type { NotifyCastAction } from '../types.js';

function resolveMaMainJs(): string {
  return path.join(paths.root(), 'cli', 'build', 'main.js');
}

export async function handleNotifyCast(action: NotifyCastAction): Promise<void> {
  const maMainJs: string = resolveMaMainJs();
  if (!existsSync(maMainJs)) {
    // Build hiányzik — strukturált error, NEM silent. A dispatcher
    // try/catch-je elkapja, action-log MA-NOTIFY-CAST-BUILD-MISSING-kal.
    throw new Error(
      `MA-NOTIFY-CAST-BUILD-MISSING: ${maMainJs} (run LDP or 'pnpm run build-base' in cli/)`,
    );
  }

  const cliArgs: string[] = ['cast', 'notify', '--text', action.args.text];
  if (action.args.target) cliArgs.push('--target', action.args.target);
  // throttleId — Phase 4 lesz throttle handler. Itt csak action-log mező.

  await new Promise<void>((resolve, reject) => {
    const child = spawn('node', [maMainJs, ...cliArgs], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr: string = '';
    let stdout: string = '';
    child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    child.on('error', (err) => {
      reject(new Error(`MA-NOTIFY-CAST-SPAWN-FAIL: ${err.message}`));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const tail: string = stderr.trim().slice(-500) || stdout.trim().slice(-500);
        reject(new Error(`MA-NOTIFY-CAST-EXIT-${code}: ${tail}`));
      }
    });
  });

  await logAction({
    actor: 'agent',
    kind: 'ship',
    summary: `[notify-cast] sent: "${action.args.text.slice(0, 80)}" (target=${action.args.target ?? 'All Speakers'})`,
    extra: {
      target: action.args.target ?? 'All Speakers',
      throttleId: action.args.throttleId,
    },
  });
}

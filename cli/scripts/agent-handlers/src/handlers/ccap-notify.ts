// scripts/agent-handlers/src/handlers/ccap-notify.ts
// Tier 1 — FR #1 communication-forms Phase 1.
// Shell-out a `ccap notify send` parancsra (CCAP Notification UI csatorna).

import { spawn } from 'node:child_process';
import { logAction } from '../action-log.js';
import type { CcapNotifyAction } from '../types.js';

export async function handleCcapNotify(action: CcapNotifyAction): Promise<void> {
  const args: string[] = ['notify', 'send', '--title', action.args.title];
  if (action.args.type) args.push('--type', action.args.type);
  if (action.args.description) args.push('--description', action.args.description);
  if (action.args.priority) args.push('--priority', action.args.priority);
  if (action.args.options) args.push('--options', action.args.options);
  if (action.args.sessionId) args.push('--session', action.args.sessionId);
  if (action.args.wait) args.push('--wait');

  await new Promise<void>((resolve, reject) => {
    const child = spawn('ccap', args, { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    let stderr: string = '';
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    child.on('error', (err) => reject(new Error(`ccap spawn error: ${err.message}`)));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ccap notify send exit ${code}${stderr.trim() ? `: ${stderr.trim()}` : ''}`));
    });
  });

  await logAction({
    actor: 'agent',
    kind: 'ship',
    summary: `[ccap-notify] sent: "${action.args.title}" (type=${action.args.type ?? 'message'})`,
    extra: {
      type: action.args.type,
      priority: action.args.priority,
      sessionId: action.args.sessionId,
      wait: action.args.wait,
    },
  });
}

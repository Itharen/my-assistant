// scripts/agent-handlers/src/paths.ts
// Resolves the my-assistant project root by walking up from this file.
// Used by all handlers to locate __agent/, current/, etc.

import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

let cachedRoot: string | null = null;

export function projectRoot(): string {
  if (cachedRoot) return cachedRoot;
  const fromEnv = process.env.MY_ASSISTANT_ROOT;
  if (fromEnv && fs.existsSync(path.join(fromEnv, '__agent'))) {
    cachedRoot = fromEnv;
    return fromEnv;
  }
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, '__agent')) && fs.existsSync(path.join(dir, 'CLAUDE.md'))) {
      cachedRoot = dir;
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: assume scripts/agent-handlers/src → up 3 levels
  const here = path.dirname(fileURLToPath(import.meta.url));
  const fallback = path.resolve(here, '..', '..', '..');
  cachedRoot = fallback;
  return fallback;
}

/**
 * Tick-state-fájl per-agent routing.
 * - `assistant-cron` → `assistant-agent-cron-tick.json`
 * - `development`    → `development-agent-tick.json`
 *
 * Backward-compat: `agentTickJson()` (no-arg) megőrzi a régi viselkedést
 * (`assistant-cron`).
 */
function tickStateFile(agent: 'assistant-cron' | 'development' = 'assistant-cron'): string {
  const fileName: string =
    agent === 'development'
      ? 'development-agent-tick.json'
      : 'assistant-agent-cron-tick.json';
  return path.join(projectRoot(), '__agent', 'state', fileName);
}

export const paths = {
  root: () => projectRoot(),
  agent: () => path.join(projectRoot(), '__agent'),
  status: () => path.join(projectRoot(), '__agent', 'STATUS.md'),
  userInput: () => path.join(projectRoot(), '__agent', 'USER_INPUT.md'),
  state: () => path.join(projectRoot(), '__agent', 'state'),
  agentTickJson: () => tickStateFile('assistant-cron'),                    // backward-compat
  tickStateFile,                                                            // új: per-agent routing
  actionLogDir: () => path.join(projectRoot(), '__agent', 'log', 'actions'),
};

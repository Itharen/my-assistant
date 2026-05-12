// scripts/agent-handlers/src/handlers/user-input-new.ts
// Tier 1 — appends a [NEW] block to __agent/USER_INPUT.md.
// Format follows the convention defined in USER_INPUT.md itself.

import { promises as fs } from 'node:fs';
import { paths } from '../paths.js';
import type { UserInputNewAction } from '../types.js';

function nowIsoBudapestShort(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export async function handleUserInputNew(action: UserInputNewAction): Promise<void> {
  const file = paths.userInput();
  const block =
    `\n## [NEW] ${action.args.title}\n` +
    `**Típus:** ${action.args.kind}\n` +
    `**Beérkezett:** ${nowIsoBudapestShort()} (agent-generated)\n` +
    `**Domain:** ${action.args.domain}\n\n` +
    `${action.args.body}\n`;

  // Read current file, find the marker, insert the new block right after it
  // (so newest blocks stay on top, matching USER_INPUT.md convention).
  const content = await fs.readFile(file, 'utf8');
  const marker = '<!-- ÚJ BLOKKOK IDE, A LEGÚJABB FELÜL -->';
  if (content.includes(marker)) {
    const updated = content.replace(marker, marker + block);
    await fs.writeFile(file, updated, 'utf8');
  } else {
    // Fallback: just append at the end
    await fs.appendFile(file, block, 'utf8');
  }
}

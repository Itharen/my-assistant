// scripts/agent-handlers/src/handlers/update-status.ts
// Tier 1 — updates a single field in the YAML block of __agent/STATUS.md.
// Only `next_action` and `last_event_type` are allowed (enforced in schema).

import { promises as fs } from 'node:fs';
import { paths } from '../paths.js';
import type { UpdateStatusAction } from '../types.js';

export async function handleUpdateStatus(action: UpdateStatusAction): Promise<void> {
  const file = paths.status();
  const content = await fs.readFile(file, 'utf8');

  const { field, value } = action.args;

  // Match the YAML field line. The values may be plain strings or quoted.
  // We rewrite the line to a quoted form to avoid YAML hazards.
  const lineRegex = new RegExp(`^${escapeRegex(field)}:\\s*.*$`, 'm');
  const escaped = value.replace(/"/g, '\\"');
  const replacement = `${field}: "${escaped}"`;

  let updated: string;
  if (lineRegex.test(content)) {
    updated = content.replace(lineRegex, replacement);
  } else {
    // Field not found — try to insert into the YAML block (after `state:` line).
    const stateLine = /^state:.*$/m;
    if (stateLine.test(content)) {
      updated = content.replace(stateLine, (m) => `${m}\n${replacement}`);
    } else {
      // Last resort — append at top of file.
      updated = `${replacement}\n${content}`;
    }
  }

  await fs.writeFile(file, updated, 'utf8');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

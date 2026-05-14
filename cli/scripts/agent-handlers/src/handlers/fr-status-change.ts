// scripts/agent-handlers/src/handlers/fr-status-change.ts
// Tier 1 — FR #2 automatic-status-recording Phase 1.
// Az FR-fájl `## Status` szakaszán cseréli a `fromStatus` substring-et
// `toStatus`-ra. Preflight: ha nincs `fromStatus` a Status-blokk-ban,
// strukturált error (MA-FR-STATUS-MISMATCH) — autonóm dispatcher nem ír
// felül váratlanul módosult fájlt.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { logAction } from '../action-log.js';
import { paths } from '../paths.js';
import type { FrStatusChangeAction } from '../types.js';

function resolveFrPath(frPath: string): string {
  return path.isAbsolute(frPath) ? frPath : path.join(paths.root(), frPath);
}

/**
 * Visszaadja a `## Status` heading-ig tartó offset-et + a Status-blokk
 * határait (start = heading utáni első karakter, end = következő `## ` /
 * `---` / EOF előtt).
 */
function findStatusBlock(content: string): { headingIdx: number; blockStart: number; blockEnd: number } | null {
  // Multi-line: `## Status` szigorúan sor-eleji, opcionális trailing whitespace
  const m: RegExpMatchArray | null = content.match(/^## Status\s*$/m);
  if (!m || m.index === undefined) return null;
  const headingIdx: number = m.index;
  const headingEnd: number = headingIdx + m[0].length;
  const blockStart: number = headingEnd;
  // Next section boundary: ^## or ^--- (with optional newline before)
  const rest: string = content.slice(blockStart);
  const boundary: RegExpMatchArray | null = rest.match(/\n(##\s|---\s*$)/m);
  const blockEnd: number = boundary?.index !== undefined ? blockStart + boundary.index : content.length;
  return { headingIdx, blockStart, blockEnd };
}

export async function handleFrStatusChange(action: FrStatusChangeAction): Promise<void> {
  const fileAbs: string = resolveFrPath(action.args.frPath);

  let content: string;
  try {
    content = await fs.readFile(fileAbs, 'utf-8');
  } catch (err) {
    const errno: NodeJS.ErrnoException = err as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') {
      throw new Error(`MA-FR-FILE-NOT-FOUND: ${fileAbs}`);
    }
    const msg: string = err instanceof Error ? err.message : String(err);
    throw new Error(`MA-FR-READ-FAIL: ${msg} (file=${fileAbs})`);
  }

  const block = findStatusBlock(content);
  if (!block) {
    throw new Error(`MA-FR-STATUS-MISSING: '## Status' heading not found in ${fileAbs}`);
  }

  const statusBlock: string = content.slice(block.blockStart, block.blockEnd);
  if (!statusBlock.includes(action.args.fromStatus)) {
    throw new Error(
      `MA-FR-STATUS-MISMATCH: fromStatus="${action.args.fromStatus}" not found in current Status block of ${fileAbs}`,
    );
  }

  const newStatusBlock: string = statusBlock.replace(action.args.fromStatus, action.args.toStatus);
  const newContent: string = content.slice(0, block.blockStart) + newStatusBlock + content.slice(block.blockEnd);

  const tmp: string = `${fileAbs}.tmp`;
  try {
    await fs.writeFile(tmp, newContent, 'utf-8');
    await fs.rename(tmp, fileAbs);
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : String(err);
    throw new Error(`MA-FR-WRITE-FAIL: ${msg} (file=${fileAbs})`);
  }

  await logAction({
    actor: 'agent',
    kind: 'ship',
    summary: `[fr-status-change] ${action.args.frPath}: "${action.args.fromStatus}" → "${action.args.toStatus}"`,
    ref: action.args.frPath,
    extra: {
      fromStatus: action.args.fromStatus,
      toStatus: action.args.toStatus,
      reason: action.args.reason,
    },
  });
}

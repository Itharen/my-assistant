// scripts/agent-handlers/src/handlers/plan-step-mark-done.ts
// Tier 1 — FR #2 automatic-status-recording Phase 1.
// A plan-fájlban megkeresi az első sort ami tartalmazza a `stepRef`
// substring-et, és ha még nincs benne ✅, hozzáfűzi a sor végéhez.
// Idempotens: ha már ✅, skip + log note (NEM error).

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { logAction } from '../action-log.js';
import { paths } from '../paths.js';
import type { PlanStepMarkDoneAction } from '../types.js';

function resolvePlanPath(planPath: string): string {
  return path.isAbsolute(planPath) ? planPath : path.join(paths.root(), planPath);
}

export async function handlePlanStepMarkDone(action: PlanStepMarkDoneAction): Promise<void> {
  const fileAbs: string = resolvePlanPath(action.args.planPath);

  let content: string;
  try {
    content = await fs.readFile(fileAbs, 'utf-8');
  } catch (err) {
    const errno: NodeJS.ErrnoException = err as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') {
      throw new Error(`MA-PLAN-FILE-NOT-FOUND: ${fileAbs}`);
    }
    const msg: string = err instanceof Error ? err.message : String(err);
    throw new Error(`MA-PLAN-READ-FAIL: ${msg} (file=${fileAbs})`);
  }

  const lines: string[] = content.split('\n');
  let matchedIdx: number = -1;
  for (let i: number = 0; i < lines.length; i++) {
    if (lines[i]!.includes(action.args.stepRef)) {
      matchedIdx = i;
      break;
    }
  }

  if (matchedIdx === -1) {
    throw new Error(
      `MA-PLAN-STEP-NOT-FOUND: stepRef="${action.args.stepRef}" not found in ${fileAbs}`,
    );
  }

  const original: string = lines[matchedIdx]!;

  // Idempotens: ha már ✅ a sorban (bárhol) → skip + log note.
  if (original.includes('✅')) {
    await logAction({
      actor: 'agent',
      kind: 'note',
      summary: `[plan-step-mark-done] already done (idempotent skip): ${action.args.stepRef}`,
      ref: action.args.planPath,
      extra: {
        code: 'MA-PLAN-STEP-ALREADY-DONE',
        stepRef: action.args.stepRef,
        evidence: action.args.evidence,
      },
    });
    return;
  }

  // Append ✅ a sor végéhez. Markdown-tábla case: az utolsó `|` előtt
  // van tartalom, oda fűzzük be. Egyéb (heading, list-item): sor végéhez.
  let modified: string;
  const trimmed: string = original.trimEnd();
  if (trimmed.endsWith('|')) {
    // Tábla-sor: keresd az utolsó `|`-ig tartó tartalmat, és tegyél ✅ a cella végére
    const lastPipeIdx: number = trimmed.lastIndexOf('|', trimmed.length - 2);
    if (lastPipeIdx !== -1) {
      const cellContent: string = trimmed.slice(lastPipeIdx + 1, trimmed.length - 1).trimEnd();
      modified =
        trimmed.slice(0, lastPipeIdx + 1) +
        cellContent +
        ' ✅' +
        trimmed.slice(trimmed.length - 1) +
        (original.length > trimmed.length ? original.slice(trimmed.length) : '');
    } else {
      modified = `${trimmed} ✅`;
    }
  } else {
    modified = `${trimmed} ✅${original.length > trimmed.length ? original.slice(trimmed.length) : ''}`;
  }

  lines[matchedIdx] = modified;
  const newContent: string = lines.join('\n');

  const tmp: string = `${fileAbs}.tmp`;
  try {
    await fs.writeFile(tmp, newContent, 'utf-8');
    await fs.rename(tmp, fileAbs);
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : String(err);
    throw new Error(`MA-PLAN-WRITE-FAIL: ${msg} (file=${fileAbs})`);
  }

  await logAction({
    actor: 'agent',
    kind: 'ship',
    summary: `[plan-step-mark-done] ${action.args.planPath}: marked "${action.args.stepRef}" ✅`,
    ref: action.args.planPath,
    extra: {
      stepRef: action.args.stepRef,
      evidence: action.args.evidence,
    },
  });
}

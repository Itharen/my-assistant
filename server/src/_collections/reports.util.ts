// Reports util — fájl-alapú agregátorok a Reports panel (FR #3g Phase 1) read
// endpointjaihoz. 3 forrás:
//
//   - `current/feature-requests/*.md` → FR-board (status + last ship)
//   - `__agent/log/cycles/cycle-N.md` → cycle history
//   - `__agent/log/actions/<date>.jsonl` → recent ships
//
// FR #3g Phase 1 (cycle 95). Pattern: wave-markers.util.ts (action-log scan)
// + wave-jsonl.util.ts (fs-read no-throw + path resolution).

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { emitServerActionLog } from './action-log.util';

/** Output shape egy FR-row-hoz. */
export interface ReportFr_Row {
  /** File-név `current/feature-requests/`-ben (kiterjesztés nélkül). */
  id: string;
  title: string;
  status: string;
  lastModifiedMs: number;
}

/** Output shape egy cycle-archív row-hoz. */
export interface ReportCycle_Row {
  cycleId: number;
  date: string;
  title: string;
  commitSha: string;
  filePath: string;
}

/** Output shape egy recent-ship action-log entry-hez. */
export interface ReportShip_Row {
  ts: string;
  actor: string;
  summary: string;
  ref: string;
  loc_delta: string;
  ldp: string;
}

/** Resolve repo root abszolút útja (3 szint up: server/build/_collections vagy server/src/_collections). */
function resolveRepoRoot(): string {
  const here: string = path.dirname(fileURLToPath(import.meta.url));

  return path.resolve(here, '..', '..', '..');
}

/** Olvas + filter a `current/feature-requests/*.md`-en, status mező extract. */
export async function listFeatureRequests(): Promise<ReportFr_Row[]> {
  const dir: string = path.join(resolveRepoRoot(), 'current', 'feature-requests');
  const result: ReportFr_Row[] = [];

  try {
    const files: string[] = await fs.readdir(dir);

    for (const fname of files) {
      if (!fname.endsWith('.md')) continue;

      const filePath: string = path.join(dir, fname);
      try {
        const stat = await fs.stat(filePath);
        const content: string = await fs.readFile(filePath, 'utf8');
        const id: string = fname.replace(/\.md$/, '');
        const title: string = extractFrTitle(content) ?? id;
        const status: string = extractFrStatus(content) ?? 'unknown';

        result.push({
          id,
          title,
          status,
          lastModifiedMs: stat.mtimeMs,
        });
      } catch (err) {
        const e: Error = err instanceof Error ? err : new Error(String(err));

        await emitServerActionLog({
          actor: 'server',
          kind: 'error',
          summary: `[MA-REPORTS-FR-READ-FAIL] ${fname}: ${e.message.slice(0, 100)}`,
          extra: { errorCode: 'MA-REPORTS-FR-READ-FAIL', issuer: 'reports.util.listFeatureRequests', fname },
        });
      }
    }
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-REPORTS-FR-DIR-FAIL] ${e.message.slice(0, 100)}`,
      extra: { errorCode: 'MA-REPORTS-FR-DIR-FAIL', issuer: 'reports.util.listFeatureRequests' },
    });
  }

  // Sort by lastModifiedMs desc (legfrissebb előbb).
  result.sort((a, b): number => b.lastModifiedMs - a.lastModifiedMs);

  return result;
}

/** Olvas + parse `__agent/log/cycles/cycle-N.md`-eket. */
export async function listCycles(limit: number = 50): Promise<ReportCycle_Row[]> {
  const dir: string = path.join(resolveRepoRoot(), '__agent', 'log', 'cycles');
  const result: ReportCycle_Row[] = [];

  try {
    const files: string[] = await fs.readdir(dir);
    const cycleFiles: string[] = files.filter((f): boolean => /^cycle-\d+\.md$/.test(f));

    for (const fname of cycleFiles) {
      const filePath: string = path.join(dir, fname);
      try {
        const content: string = await fs.readFile(filePath, 'utf8');
        const match: RegExpMatchArray | null = fname.match(/^cycle-(\d+)\.md$/);
        const cycleId: number = match ? parseInt(match[1], 10) : 0;
        const title: string = extractCycleTitle(content) ?? fname;
        const date: string = extractCycleDate(content) ?? '';
        const commitSha: string = extractCycleCommit(content) ?? '';

        result.push({
          cycleId,
          date,
          title,
          commitSha,
          filePath: path.relative(resolveRepoRoot(), filePath),
        });
      } catch (err) {
        const e: Error = err instanceof Error ? err : new Error(String(err));

        await emitServerActionLog({
          actor: 'server',
          kind: 'error',
          summary: `[MA-REPORTS-CYCLE-READ-FAIL] ${fname}: ${e.message.slice(0, 100)}`,
          extra: { errorCode: 'MA-REPORTS-CYCLE-READ-FAIL', issuer: 'reports.util.listCycles', fname },
        });
      }
    }
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-REPORTS-CYCLE-DIR-FAIL] ${e.message.slice(0, 100)}`,
      extra: { errorCode: 'MA-REPORTS-CYCLE-DIR-FAIL', issuer: 'reports.util.listCycles' },
    });
  }

  // Sort by cycleId desc (legfrissebb előbb), limit-elve.
  result.sort((a, b): number => b.cycleId - a.cycleId);

  return result.slice(0, Math.max(1, limit));
}

/** Olvas + filter `__agent/log/actions/*.jsonl`-eket, kind=ship row-ok utolsó N. */
export async function listRecentShips(limit: number = 30, days: number = 14): Promise<ReportShip_Row[]> {
  const dir: string = path.join(resolveRepoRoot(), '__agent', 'log', 'actions');
  const result: ReportShip_Row[] = [];

  // Date-range: most-tól `days` napra visszafelé.
  const now: Date = new Date();
  const dateStrs: string[] = [];

  for (let i: number = 0; i <= days; i++) {
    const d: Date = new Date(now);
    d.setDate(d.getDate() - i);
    const y: number = d.getFullYear();
    const m: string = String(d.getMonth() + 1).padStart(2, '0');
    const dd: string = String(d.getDate()).padStart(2, '0');
    dateStrs.push(`${y}-${m}-${dd}`);
  }

  for (const dateStr of dateStrs) {
    const filePath: string = path.join(dir, `${dateStr}.jsonl`);

    try {
      const content: string = await fs.readFile(filePath, 'utf8');
      const lines: string[] = content.split(/\r?\n/).filter((l): boolean => l.trim().length > 0);

      for (const line of lines) {
        try {
          const raw: { ts?: string; actor?: string; kind?: string; summary?: string; ref?: string; extra?: { loc_delta?: string; ldp?: string } } =
            JSON.parse(line) as typeof raw;

          if (raw.kind !== 'ship' || !raw.ts) continue;

          result.push({
            ts: raw.ts,
            actor: raw.actor ?? 'unknown',
            summary: raw.summary ?? '',
            ref: raw.ref ?? '',
            loc_delta: raw.extra?.loc_delta ?? '',
            ldp: raw.extra?.ldp ?? '',
          });
        } catch {
          // Skip bad lines silently — already handled by emitter side.
        }
      }
    } catch {
      // No log for this day — skip silently.
    }
  }

  // Sort by ts desc + limit.
  result.sort((a, b): number => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return result.slice(0, Math.max(1, limit));
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** FR title az első `# FR:` / `# ...` heading-ből. */
function extractFrTitle(md: string): string | null {
  const m: RegExpMatchArray | null = md.match(/^#\s+(.+?)$/m);

  return m ? m[1].trim() : null;
}

/** FR status az utolsó `## Status` szekció első nem-üres sorából (vagy `Status:` inline). */
function extractFrStatus(md: string): string | null {
  // Próbáljuk `## Status` szekciót először.
  const m: RegExpMatchArray | null = md.match(/##\s+Status\s*\n+([^\n#]+)/);

  if (m) {
    return m[1].trim().replace(/^\*\*|\*\*$/g, '').slice(0, 200);
  }
  // Fallback: első `🟢` / `🟡` / `🚧` / `✅` / `🅿️` emoji-tartalmazó sor.
  const lines: string[] = md.split(/\r?\n/);

  for (const line of lines) {
    if (/[🟢🟡🚧✅🅿️🔴]/.test(line)) {
      return line.trim().slice(0, 200);
    }
  }

  return null;
}

/** Cycle title (`# Cycle N — DATE`) extract. */
function extractCycleTitle(md: string): string | null {
  const m: RegExpMatchArray | null = md.match(/^#\s+(Cycle\s+\d+.*?)$/m);

  return m ? m[1].trim() : null;
}

/** Cycle date (a title-ből: `Cycle N — YYYY-MM-DD`). */
function extractCycleDate(md: string): string | null {
  const m: RegExpMatchArray | null = md.match(/^#\s+Cycle\s+\d+\s*[—-]\s*(\d{4}-\d{2}-\d{2})/m);

  return m ? m[1] : null;
}

/** Commit sha extract a `**Commit:** <sha>` sorból. */
function extractCycleCommit(md: string): string | null {
  const m: RegExpMatchArray | null = md.match(/\*\*Commit:\*\*\s*([a-f0-9]{7,40})/);

  return m ? m[1] : null;
}

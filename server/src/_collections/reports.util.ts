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

/** FR #3g Phase 2 (cycle 97): Dev I/O panel-hez STATUS_DEV YAML snapshot. */
export interface ReportStatusDev_Snapshot {
  cycle: number | null;
  phase: string;
  phaseNotes: string;
  lastCycleId: number | null;
  lastCycleSha: string;
  activePlan: string;
  activePlanStep: string;
  raw: string;
}

/** Action-log row Dev I/O activity feed-hez (Phase 2). */
export interface ReportAgentLog_Row {
  ts: string;
  actor: string;
  kind: string;
  summary: string;
  ref: string;
}

/** AGENT_BUS.md egy bejegyzés (Phase 2). */
export interface ReportAgentBus_Row {
  id: string;
  status: 'OPEN' | 'ANSWERED' | 'ACTED' | 'DROPPED' | 'UNKNOWN';
  title: string;
  from: string;
  to: string;
  kind: string;
  created: string;
  updated: string;
  preview: string;
}

/** FR #3g Phase 3 (cycle 99): User I/O panel — USER_INPUT.md bejegyzés. */
export interface ReportUserInput_Row {
  status: 'NEW' | 'DONE' | 'UNKNOWN';
  title: string;
  type: string;
  domain: string;
  receivedAt: string;
  body: string;
}

/** Open-questions.md egy bejegyzés. */
export interface ReportOpenQuestion_Row {
  qid: string;
  question: string;
  context: string;
  importance: string;
  status: string;
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

/**
 * FR #3g Phase 2 (cycle 97): STATUS_DEV.md snapshot olvasás + YAML-ish parse.
 * A fájl tetején van egy ```yaml block; regex-kompatibilis parse.
 */
export async function readStatusDev(): Promise<ReportStatusDev_Snapshot> {
  const filePath: string = path.join(resolveRepoRoot(), '__agent', 'STATUS_DEV.md');
  const empty: ReportStatusDev_Snapshot = {
    cycle: null, phase: '', phaseNotes: '',
    lastCycleId: null, lastCycleSha: '',
    activePlan: '', activePlanStep: '',
    raw: '',
  };

  try {
    const content: string = await fs.readFile(filePath, 'utf8');
    const yamlMatch: RegExpMatchArray | null = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
    const yamlBlock: string = yamlMatch ? yamlMatch[1] : '';

    return {
      cycle: parseYamlInt(yamlBlock, /^cycle:\s*(\d+)/m),
      phase: parseYamlString(yamlBlock, /^phase:\s*([^\s#]+)/m),
      phaseNotes: parseYamlMultiline(yamlBlock, /^phase_notes:\s*\|\s*\n([\s\S]*?)(?=^\w|^#|^$)/m),
      lastCycleId: parseYamlInt(yamlBlock, /cycle_id:\s*(\d+)/m),
      lastCycleSha: parseYamlString(yamlBlock, /commit_sha:\s*([^\n#]+)/m),
      activePlan: parseYamlString(yamlBlock, /active_plan:[\s\S]*?path:\s*([^\n#]+)/m),
      activePlanStep: parseYamlString(yamlBlock, /active_plan:[\s\S]*?current_step:\s*"?([^"\n#]+)"?/m),
      raw: yamlBlock.slice(0, 4000),
    };
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-REPORTS-STATUS-DEV-FAIL] ${e.message.slice(0, 150)}`,
      extra: { errorCode: 'MA-REPORTS-STATUS-DEV-FAIL', issuer: 'reports.util.readStatusDev' },
    });

    return empty;
  }
}

/** Action-log JSONL szűrt olvasás (default: ma, actor=development-agent). */
export async function listAgentLog(opts: { date?: string; actor?: string; limit?: number } = {}): Promise<ReportAgentLog_Row[]> {
  const date: string = opts.date ?? new Date().toISOString().slice(0, 10);
  const actorFilter: string = opts.actor ?? 'development-agent';
  const limit: number = Math.max(1, Math.min(500, opts.limit ?? 100));
  const filePath: string = path.join(resolveRepoRoot(), '__agent', 'log', 'actions', `${date}.jsonl`);
  const result: ReportAgentLog_Row[] = [];

  try {
    const content: string = await fs.readFile(filePath, 'utf8');
    const lines: string[] = content.split(/\r?\n/).filter((l): boolean => l.trim().length > 0);

    for (const line of lines) {
      try {
        const raw: { ts?: string; actor?: string; kind?: string; summary?: string; ref?: string } =
          JSON.parse(line) as typeof raw;

        if (!raw.ts || !raw.actor) continue;
        if (actorFilter !== '*' && raw.actor !== actorFilter) continue;

        result.push({
          ts: raw.ts,
          actor: raw.actor,
          kind: raw.kind ?? 'unknown',
          summary: raw.summary ?? '',
          ref: raw.ref ?? '',
        });
      } catch {
        // Skip bad lines.
      }
    }
  } catch {
    // No log file for this day — return empty.
  }

  // Most-recent first.
  result.sort((a, b): number => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return result.slice(0, limit);
}

/**
 * AGENT_BUS.md bejegyzés-parser. Egy bejegyzés-fej formátum:
 *
 *     ## [STATUS] AGB-2026-05-17-NN — Title
 *     **From:** x
 *     **To:** y
 *     **Kind:** z
 *     **Created:** ...
 *     **Updated:** ...
 *
 *     body...
 */
export async function listAgentBus(limit: number = 30): Promise<ReportAgentBus_Row[]> {
  const filePath: string = path.join(resolveRepoRoot(), '__agent', 'AGENT_BUS.md');
  const result: ReportAgentBus_Row[] = [];

  try {
    const content: string = await fs.readFile(filePath, 'utf8');
    // Split a fő bejegyzés-fejekre.
    const headerRe: RegExp = /^## \[(OPEN|ANSWERED|ACTED|DROPPED)\] (AGB[-A-Z0-9]+|AGB-EXAMPLE-\d+)\s*—\s*(.+?)$/gm;
    let match: RegExpExecArray | null;
    const entries: { idx: number; status: string; id: string; title: string }[] = [];

    while ((match = headerRe.exec(content)) !== null) {
      entries.push({
        idx: match.index,
        status: match[1],
        id: match[2],
        title: match[3].trim(),
      });
    }

    // Skip the AGB-EXAMPLE-001 séma-illusztráció.
    const real = entries.filter((e): boolean => !e.id.startsWith('AGB-EXAMPLE'));

    for (let i: number = 0; i < real.length; i++) {
      const e = real[i];
      const endIdx: number = i + 1 < real.length ? real[i + 1].idx : Math.min(e.idx + 2000, content.length);
      const block: string = content.slice(e.idx, endIdx);

      result.push({
        id: e.id,
        status: e.status as ReportAgentBus_Row['status'],
        title: e.title,
        from: parseFieldFromBlock(block, /\*\*From:\*\*\s*(.+?)$/m),
        to: parseFieldFromBlock(block, /\*\*To:\*\*\s*(.+?)$/m),
        kind: parseFieldFromBlock(block, /\*\*Kind:\*\*\s*(.+?)$/m),
        created: parseFieldFromBlock(block, /\*\*Created:\*\*\s*(.+?)$/m),
        updated: parseFieldFromBlock(block, /\*\*Updated:\*\*\s*(.+?)$/m),
        preview: extractAgbPreview(block),
      });
    }
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-REPORTS-AGENT-BUS-FAIL] ${e.message.slice(0, 150)}`,
      extra: { errorCode: 'MA-REPORTS-AGENT-BUS-FAIL', issuer: 'reports.util.listAgentBus' },
    });
  }

  // Most-recent first (created ts descending).
  result.sort((a, b): number => (b.created || '').localeCompare(a.created || ''));

  return result.slice(0, Math.max(1, limit));
}

/**
 * FR #3g Phase 3 (cycle 99): USER_INPUT.md `## [STATUS] Title` block parser.
 * Skip-eli a séma-példa blockokat (sablon-fejlécek).
 */
export async function listUserInput(limit: number = 30): Promise<ReportUserInput_Row[]> {
  const filePath: string = path.join(resolveRepoRoot(), '__agent', 'USER_INPUT.md');
  const result: ReportUserInput_Row[] = [];

  try {
    const content: string = await fs.readFile(filePath, 'utf8');
    const headerRe: RegExp = /^## \[(NEW|DONE)\]\s+(.+?)$/gm;
    let match: RegExpExecArray | null;
    const entries: { idx: number; status: 'NEW' | 'DONE'; title: string }[] = [];

    while ((match = headerRe.exec(content)) !== null) {
      const title: string = match[2].trim();

      // Skip schema illustrations (placeholder titles).
      if (title === '{rövid cím}') continue;

      entries.push({ idx: match.index, status: match[1] as 'NEW' | 'DONE', title });
    }

    for (let i: number = 0; i < entries.length; i++) {
      const e = entries[i];
      const endIdx: number = i + 1 < entries.length ? entries[i + 1].idx : Math.min(e.idx + 3000, content.length);
      const block: string = content.slice(e.idx, endIdx);

      result.push({
        status: e.status,
        title: e.title,
        type: parseFieldFromBlock(block, /\*\*Típus:\*\*\s*(.+?)$/m),
        domain: parseFieldFromBlock(block, /\*\*Domain:\*\*\s*(.+?)$/m),
        receivedAt: parseFieldFromBlock(block, /\*\*(?:Beérkezett|Feldolgozva):\*\*\s*(.+?)$/m),
        body: extractUserInputBody(block),
      });
    }
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-REPORTS-USER-INPUT-FAIL] ${e.message.slice(0, 150)}`,
      extra: { errorCode: 'MA-REPORTS-USER-INPUT-FAIL', issuer: 'reports.util.listUserInput' },
    });
  }

  // Most-recent first (assume newest are at top of file already per format conv).
  return result.slice(0, Math.max(1, limit));
}

/**
 * FR #3g Phase 4a (cycle 101): új [NEW] blokk append USER_INPUT.md-be.
 * A blokk a `<!-- ÚJ BLOKKOK IDE, A LEGÚJABB FELÜL -->` HTML-komment után kerül be.
 * Hibás title-cím (üres) → MA-USER-INPUT-APPEND-INVALID-PAYLOAD.
 */
export async function appendUserInputBlock(payload: {
  title: string;
  type: string;
  domain: string;
  text: string;
}): Promise<{ ok: boolean; ts: string; errorCode?: string; message?: string }> {
  const ts: string = nowIsoBudapestShort();
  const title: string = (payload.title ?? '').trim();
  const type: string = (payload.type ?? 'instruction').trim();
  const domain: string = (payload.domain ?? 'meta').trim();
  const text: string = (payload.text ?? '').trim();

  if (!title) {
    return {
      ok: false,
      ts,
      errorCode: 'MA-USER-INPUT-APPEND-INVALID-PAYLOAD',
      message: 'title required',
    };
  }

  const filePath: string = path.join(resolveRepoRoot(), '__agent', 'USER_INPUT.md');
  const block: string = `\n## [NEW] ${title}\n**Típus:** ${type}\n**Beérkezett:** ${ts}\n**Domain:** ${domain}\n\n${text}\n\n`;

  try {
    const content: string = await fs.readFile(filePath, 'utf8');
    const anchor: string = '<!-- ÚJ BLOKKOK IDE, A LEGÚJABB FELÜL -->';
    const anchorIdx: number = content.indexOf(anchor);

    let next: string;

    if (anchorIdx === -1) {
      // Fallback: append at end.
      next = content.trimEnd() + '\n' + block;
    } else {
      const insertAt: number = anchorIdx + anchor.length;
      next = content.slice(0, insertAt) + '\n' + block + content.slice(insertAt);
    }

    await fs.writeFile(filePath, next, { encoding: 'utf8' });

    await emitServerActionLog({
      actor: 'server',
      kind: 'state-change',
      summary: `user-input new [NEW] block: ${title.slice(0, 80)}`,
      extra: { issuer: 'reports.util.appendUserInputBlock', title, type, domain, ts },
    });

    return { ok: true, ts };
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));
    const errorCode: string = 'MA-USER-INPUT-APPEND-WRITE-FAIL';

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[${errorCode}] ${e.message.slice(0, 150)}`,
      extra: { errorCode, issuer: 'reports.util.appendUserInputBlock', title, stack: e.stack },
    });

    return { ok: false, ts, errorCode, message: e.message };
  }
}

/**
 * [NEW] → [DONE] státusz-átállítás title-alapú lookup-pal. A body megmarad,
 * a fejléc-mezők frissülnek (**Beérkezett:** → **Feldolgozva:** + **Eredmény:**).
 */
export async function markUserInputDone(payload: {
  title: string;
  result?: string;
}): Promise<{ ok: boolean; ts: string; errorCode?: string; message?: string }> {
  const ts: string = nowIsoBudapestShort();
  const title: string = (payload.title ?? '').trim();
  const result: string = (payload.result ?? 'user-via-ui').trim();

  if (!title) {
    return {
      ok: false,
      ts,
      errorCode: 'MA-USER-INPUT-DONE-INVALID-PAYLOAD',
      message: 'title required',
    };
  }

  const filePath: string = path.join(resolveRepoRoot(), '__agent', 'USER_INPUT.md');

  try {
    const content: string = await fs.readFile(filePath, 'utf8');
    // Header keresés: `## [NEW] <title>` exact-prefix match.
    const escapedTitle: string = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const headerRe: RegExp = new RegExp(`^## \\[NEW\\] ${escapedTitle}\\s*$`, 'm');
    const headerMatch: RegExpMatchArray | null = content.match(headerRe);

    if (!headerMatch) {
      return {
        ok: false,
        ts,
        errorCode: 'MA-USER-INPUT-DONE-NOT-FOUND',
        message: `[NEW] block with title "${title}" not found`,
      };
    }

    const headerIdx: number = headerMatch.index ?? -1;

    if (headerIdx < 0) {
      return {
        ok: false,
        ts,
        errorCode: 'MA-USER-INPUT-DONE-NOT-FOUND',
        message: 'header index resolution failed',
      };
    }

    // Találjuk a következő `## ` header indexét — az adott blokk vége.
    const nextHeaderIdx: number = content.slice(headerIdx + headerMatch[0].length).search(/^## /m);
    const blockEnd: number = nextHeaderIdx === -1 ? content.length : headerIdx + headerMatch[0].length + nextHeaderIdx;
    const block: string = content.slice(headerIdx, blockEnd);

    // Transzformálás: `[NEW]` → `[DONE]`, `**Beérkezett:** XX` → `**Feldolgozva:** ts` + `**Eredmény:** result`.
    const transformedHeader: string = block.replace(/^## \[NEW\] /m, '## [DONE] ');
    const transformedHeaderWithFields: string = transformedHeader.replace(
      /\*\*Beérkezett:\*\*\s*[^\n]+/m,
      `**Feldolgozva:** ${ts}\n**Eredmény:** ${result}`,
    );

    const next: string = content.slice(0, headerIdx) + transformedHeaderWithFields + content.slice(blockEnd);

    await fs.writeFile(filePath, next, { encoding: 'utf8' });

    await emitServerActionLog({
      actor: 'server',
      kind: 'state-change',
      summary: `user-input [NEW]→[DONE]: ${title.slice(0, 80)}`,
      extra: { issuer: 'reports.util.markUserInputDone', title, result, ts },
    });

    return { ok: true, ts };
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));
    const errorCode: string = 'MA-USER-INPUT-DONE-WRITE-FAIL';

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[${errorCode}] ${e.message.slice(0, 150)}`,
      extra: { errorCode, issuer: 'reports.util.markUserInputDone', title, stack: e.stack },
    });

    return { ok: false, ts, errorCode, message: e.message };
  }
}

/** Europe/Budapest ISO timestamp, percre kerekítve (`YYYY-MM-DD HH:mm`). */
function nowIsoBudapestShort(): string {
  const d: Date = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Open-questions.md parser. Sorok: `Q-ID | question | context | importance | status`
 * vagy markdown-list bejegyzések. MVP: a fájl szöveges szakaszait scrape-eli.
 */
export async function listOpenQuestions(limit: number = 50): Promise<ReportOpenQuestion_Row[]> {
  const filePath: string = path.join(resolveRepoRoot(), 'current', 'open-questions.md');
  const result: ReportOpenQuestion_Row[] = [];

  try {
    const content: string = await fs.readFile(filePath, 'utf8');
    // Q-ID pattern: Q-YYYY-MM-DD-NN OR Q-{topic}-N (e.g. Q-3x3-1, Q-WAVE-2).
    const qidRe: RegExp = /\b(Q-[A-Za-z0-9-]+-\d+|Q-[a-z]+-\d+|Q-ver-\d+|Q-WAVE-\d+)\b/g;
    const lines: string[] = content.split(/\r?\n/);
    const seenIds: Set<string> = new Set<string>();

    for (const line of lines) {
      let m: RegExpExecArray | null;

      qidRe.lastIndex = 0;
      while ((m = qidRe.exec(line)) !== null) {
        const qid: string = m[1];

        if (seenIds.has(qid)) continue;
        seenIds.add(qid);

        // Status hint: keresünk `answered`, `dropped`, `open`, `postponed` szót.
        const lower: string = line.toLowerCase();
        let status: string = 'open';

        if (lower.includes('answered') || lower.includes('resolved')) status = 'answered';
        else if (lower.includes('dropped')) status = 'dropped';
        else if (lower.includes('postponed') || lower.includes('deferred')) status = 'postponed';

        // Importance hint: l / m / h egy karakter.
        const impMatch: RegExpMatchArray | null = line.match(/\|\s*(l|m|h)\s*\|/);
        const importance: string = impMatch ? impMatch[1] : '';

        result.push({
          qid,
          question: line.replace(new RegExp(qid, 'g'), '').trim().slice(0, 240),
          context: '',
          importance,
          status,
        });
      }
    }
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-REPORTS-OPEN-Q-FAIL] ${e.message.slice(0, 150)}`,
      extra: { errorCode: 'MA-REPORTS-OPEN-Q-FAIL', issuer: 'reports.util.listOpenQuestions' },
    });
  }

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

/** YAML int parse — visszaad null-t ha nincs match. */
function parseYamlInt(yaml: string, re: RegExp): number | null {
  const m: RegExpMatchArray | null = yaml.match(re);

  return m ? parseInt(m[1], 10) : null;
}

/** YAML string parse — visszaad '' ha nincs match. Trim + quote strip. */
function parseYamlString(yaml: string, re: RegExp): string {
  const m: RegExpMatchArray | null = yaml.match(re);

  if (!m) return '';

  return m[1].trim().replace(/^["']|["']$/g, '').replace(/\s*#.*$/, '').trim();
}

/** YAML multi-line value (pipe `|` block). */
function parseYamlMultiline(yaml: string, re: RegExp): string {
  const m: RegExpMatchArray | null = yaml.match(re);

  if (!m) return '';
  // Strip indent (first line's leading whitespace).
  const lines: string[] = m[1].split(/\r?\n/);
  const minIndent: number = lines.filter((l): boolean => l.trim().length > 0)
    .map((l): number => l.match(/^ */)?.[0].length ?? 0)
    .reduce((min, n): number => Math.min(min, n), 999);

  return lines.map((l): string => l.slice(minIndent)).join('\n').trim();
}

/** AGENT_BUS block-ból mezőt parsol. */
function parseFieldFromBlock(block: string, re: RegExp): string {
  const m: RegExpMatchArray | null = block.match(re);

  return m ? m[1].trim() : '';
}

/** AGB body preview — első nem-üres, nem-header sor a fejléc-mezők után. */
function extractAgbPreview(block: string): string {
  const lines: string[] = block.split(/\r?\n/);
  let pastHeader: boolean = false;

  for (const l of lines) {
    if (l.startsWith('**Updated:**')) { pastHeader = true; continue; }
    if (!pastHeader) continue;
    const trimmed: string = l.trim();

    if (trimmed.length === 0) continue;
    if (trimmed.startsWith('---')) continue;
    if (trimmed.startsWith('##')) break;

    return trimmed.slice(0, 200);
  }

  return '';
}

/** USER_INPUT body extract — minden, ami a fejléc-mezők után jön (cap 2000ch). */
function extractUserInputBody(block: string): string {
  const lines: string[] = block.split(/\r?\n/);
  let pastHeader: boolean = false;
  const bodyLines: string[] = [];

  for (const l of lines) {
    if (l.startsWith('**Beérkezett:**') || l.startsWith('**Feldolgozva:**') || l.startsWith('**Domain:**') || l.startsWith('**Forrás:**') || l.startsWith('**Eredmény:**') || l.startsWith('**Típus:**')) {
      pastHeader = true;
      continue;
    }
    if (!pastHeader) continue;
    if (l.startsWith('##')) break;

    bodyLines.push(l);
  }

  return bodyLines.join('\n').trim().slice(0, 2000);
}

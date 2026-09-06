// Státusz-kivonat összeállítása — EGY hívás, ami egy helyen adja a képet.
//
// 🔴 Az organizer az ELSŐDLEGES forrás a feladatokra és határidőkre (owner: „az organizerből
// kell frissíteni a feladatokat, határidőket"). Ha nem válaszol, azt JELEZZÜK — nem
// csendben nullát adunk vissza.

import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

import { buildHeadline, classifyTasks } from './status.classifier.js';
import type { StatusDigest, StatusSource, StatusTask } from './status.models.js';

const execFileAsync = promisify(execFile);

/** Az `fo` CLI hívása — a meglévő stock-mirror minta szerint (Windowson node + fo.js). */
export class FoCommandRunner {

  constructor(
    private readonly command: string = defaultFoCommand(),
    private readonly prefixArgs: string[] = defaultFoPrefixArgs(),
    private readonly timeoutMs: number = 60_000,
  ) {}

  async run(args: string[]): Promise<string> {
    const result = await execFileAsync(this.command, [...this.prefixArgs, ...args], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout: this.timeoutMs,
      windowsHide: true,
    });

    return result.stdout;
  }
}

/** A kivonat előállítása. A hívó a `sources` alapján látja, mennyire megbízható. */
export async function buildStatusDigest(params: {
  runner?: FoCommandRunner;
  now?: Date;
} = {}): Promise<StatusDigest> {
  const runner: FoCommandRunner = params.runner ?? new FoCommandRunner();
  const now: Date = params.now ?? new Date();
  const sources: StatusSource[] = [];
  let tasks: StatusTask[] = [];

  try {
    tasks = await loadOrganizerTasks(runner);
    sources.push({ name: 'organizer/tasks', status: 'ok', itemCount: tasks.length });
  } catch (err: unknown) {
    sources.push({
      name: 'organizer/tasks',
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
      remedy: 'Ellenőrizd az organizer elérhetőségét: `fo organizer.ping --pretty`. '
        + 'Amíg nem válaszol, a kivonat HIÁNYOS — a nulla nem jelent teendő-mentességet.',
    });
  }

  const isPartial: boolean = sources.some((source) => source.status === 'failed');
  const buckets = classifyTasks(tasks, now);

  return {
    generatedAt: now.toISOString(),
    headline: buildHeadline(buckets, isPartial),
    buckets,
    sources,
    isPartial,
  };
}

/** Egy oldal mérete. Nagyobb oldal → kevesebb körbefordulás. */
const PAGE_SIZE: number = 100;

/** Biztonsági korlát, hogy egy hibás kurzor ne pörgessen végtelen ciklusba. */
const MAX_PAGES: number = 25;

/**
 * Nyitott feladatok az organizerből — MINDEN oldal.
 *
 * 🔴 MÉRT HIBA VOLT (2026-09-06, review-kör 1): az `fo tasks.list` paraméter nélkül
 * **csak az első 10 tételt** adja vissza (`totalCount` 131 mellett!), és `nextCursor`-t
 * ad a folytatáshoz. Lapozás nélkül a kivonat a feladatok ~92%-át NÉMÁN elhagyta —
 * pontosan az a hibafajta, ami ellen a kivonat készült („a hiányzó adat ne látszódjon
 * »nincs teendő«-nek").
 */
async function loadOrganizerTasks(runner: FoCommandRunner): Promise<StatusTask[]> {
  const collected: StatusTask[] = [];
  let cursor: string | undefined;

  for (let page: number = 0; page < MAX_PAGES; page += 1) {
    const args: string[] = ['tasks.list', '--limit', String(PAGE_SIZE)];

    if (cursor) args.push('--cursor', cursor);

    const result = parseTasksEnvelope(await runner.run(args));

    collected.push(...result.tasks);

    if (!result.nextCursor) return collected;

    cursor = result.nextCursor;
  }

  // Ha ide jutunk, a lapozás nem ért véget — ezt NEM nyeljük el.
  throw new Error(
    `Az organizer lapozása ${MAX_PAGES} oldal után sem ért véget (${collected.length} tétel beolvasva). `
    + 'Lehet hibás kurzor vagy váratlanul nagy adatmennyiség.',
  );
}

function parseTasksEnvelope(stdout: string): { tasks: StatusTask[]; nextCursor?: string } {
  const parsed: unknown = JSON.parse(stdout);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Az fo tasks.list nem objektumot adott vissza.');
  }

  const envelope = parsed as { ok?: unknown; result?: unknown; error?: unknown };

  if (envelope.ok !== true) {
    throw new Error(`Az fo tasks.list hibát adott: ${JSON.stringify(envelope.error ?? envelope)}`);
  }

  const result = (envelope.result ?? {}) as { items?: unknown; nextCursor?: unknown };
  const items: unknown = result.items;

  if (!Array.isArray(items)) throw new Error('Az fo tasks.list válaszában nincs "items" tömb.');

  const tasks: StatusTask[] = items
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    // A már elvégzett feladat nem teendő.
    .filter((entry) => entry['done'] !== true)
    .map((entry) => ({
      ref: readString(entry, 'ref'),
      title: readString(entry, 'title'),
      priority: typeof entry['priority'] === 'number' ? entry['priority'] : undefined,
      dueDate: readString(entry, 'dueDate'),
      notifyAt: readString(entry, 'notifyAt'),
      recurrenceType: readString(entry, 'recurrenceType'),
    }));

  const nextCursor: unknown = result.nextCursor;

  return {
    tasks,
    nextCursor: typeof nextCursor === 'string' && nextCursor.length > 0 ? nextCursor : undefined,
  };
}

function readString(source: Record<string, unknown>, key: string): string {
  const value: unknown = source[key];

  return typeof value === 'string' ? value : '';
}

function defaultFoCommand(): string {
  return process.platform === 'win32' ? process.execPath : 'fo';
}

function defaultFoPrefixArgs(): string[] {
  if (process.platform !== 'win32') return [];

  return [resolve(dirname(process.execPath), 'node_modules', '@futdevpro', 'organizer-cli', 'bin', 'fo.js')];
}

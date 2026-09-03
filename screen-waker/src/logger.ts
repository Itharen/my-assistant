import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultActionLogRoot: string = path.resolve(packageRoot, '..', '__agent', 'log', 'actions');

type ActionKind = 'error' | 'external-action';

function clock(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Budapest',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

function budapestTimestamp(date: Date): string {
  const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts: Intl.DateTimeFormatPart[] = formatter.formatToParts(date);
  const part: (type: Intl.DateTimeFormatPartTypes) => string = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item: Intl.DateTimeFormatPart): boolean => item.type === type)?.value ?? '';
  const localAsUtc: number = Date.UTC(
    Number(part('year')),
    Number(part('month')) - 1,
    Number(part('day')),
    Number(part('hour')),
    Number(part('minute')),
    Number(part('second')),
  );
  const offsetMinutes: number = Math.round((localAsUtc - date.getTime()) / 60_000);
  const sign: string = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset: number = Math.abs(offsetMinutes);
  const offset: string = `${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, '0')}:${String(
    absoluteOffset % 60,
  ).padStart(2, '0')}`;

  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part(
    'second',
  )}${offset}`;
}

function errorDetail(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message;
  return String(error);
}

export class Logger {
  public constructor(
    private readonly debugEnabled: boolean,
    private readonly actionLogRoot: string = defaultActionLogRoot,
  ) {}

  public info(message: string): void {
    process.stdout.write(`${clock(new Date())} ${message}\n`);
  }

  public debug(message: string): void {
    if (this.debugEnabled) this.info(`[debug] ${message}`);
  }

  public async error(message: string, error: unknown): Promise<void> {
    const detail: string = errorDetail(error);
    process.stderr.write(`${clock(new Date())} ERROR ${message}: ${detail}\n`);
    await this.action('error', `${message}: ${detail}`);
  }

  public async action(kind: ActionKind, summary: string, extra?: Record<string, unknown>): Promise<void> {
    const now: Date = new Date();
    const entry: Record<string, unknown> = {
      ts: budapestTimestamp(now),
      actor: 'screen-waker',
      kind,
      summary,
      ref: 'screen-waker',
    };
    if (extra) entry.extra = extra;

    try {
      await mkdir(this.actionLogRoot, { recursive: true });
      const fileName: string = `${budapestTimestamp(now).slice(0, 10)}.jsonl`;
      await appendFile(path.join(this.actionLogRoot, fileName), `${JSON.stringify(entry)}\n`, 'utf8');
    } catch (error: unknown) {
      process.stderr.write(`${clock(new Date())} ERROR action log write failed: ${errorDetail(error)}\n`);
    }
  }
}

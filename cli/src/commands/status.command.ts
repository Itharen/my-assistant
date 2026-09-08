// `ma status digest` — a hiteles, aktuális státusz-kivonat egy hívásban.
//
// Ez az óránkénti Assistant-tick BEMENETE: a tick ebből dönti el, van-e miről szólni.
// Alapból ember-olvasható; `--json`-nal gépi envelope.

import { parseArgs } from 'node:util';

import { buildStatusDigest } from '../status/status.digest.js';
import { localTimeHeader } from '../utils/local-time.js';
import type { StatusDigest, StatusTask } from '../status/status.models.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

export async function runStatusCommand(subcommand: string, args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args,
    options: { json: { type: 'boolean' }, pretty: { type: 'boolean' } },
    strict: false,
  });

  if (subcommand !== 'digest') {
    process.stderr.write(`Ismeretlen status subcommand: "${subcommand}". Használat: digest\n`);
    process.exitCode = 1;
    return;
  }

  const digest: StatusDigest = await buildStatusDigest();

  if (parsed.values.json) {
    writeEnvelope(ok('status.digest', requestId, startedAt, digest), Boolean(parsed.values.pretty));
  } else {
    process.stdout.write(render(digest));
  }

  // Hiányos kivonat = nem-nulla kilépési kód, hogy scriptből is kiderüljön.
  if (digest.isPartial) process.exitCode = 1;
}

function render(digest: StatusDigest): string {
  // ⏰ HELYI IDŐ, nem UTC. Mért hiba (owner, 2026-09-08 08:55): itt `...T01:02:38.765Z`
  // állt, amikor **03:02** volt az owner óráján — és ebből téves következtetést vont le.
  // ⚠️ A `digest.generatedAt` **marad ISO** (gépi mező, a `--json` fogyasztói számítanak rá);
  // csak az EMBER-OLVASHATÓ kiirás vált.
  const lines: string[] = [
    '',
    '  STÁTUSZ-KIVONAT',
    `  ${localTimeHeader(new Date(digest.generatedAt))}`,
    '',
  ];

  lines.push(`  ${digest.headline}`);
  lines.push('');

  appendBucket(lines, '⏮️  ELMÚLT (lejárt, még nyitva)', digest.buckets.overdue);
  appendBucket(lines, '🔜 EGY ÓRÁN BELÜL', digest.buckets.withinHour);
  appendBucket(lines, '📅 MA', digest.buckets.today);
  appendBucket(lines, '➕ DÁTUM NÉLKÜL, MAGAS PRIORITÁSÚ', digest.buckets.undatedHighPriority);

  lines.push('  ── Források ──');

  for (const source of digest.sources) {
    lines.push(`  ${source.status === 'ok' ? '✅' : '🔴'} ${source.name}`
      + (source.itemCount === undefined ? '' : ` — ${source.itemCount} tétel`));

    if (source.error) lines.push(`       ${source.error}`);
    if (source.remedy) lines.push(`       → TEENDŐ: ${source.remedy}`);
  }

  lines.push('');

  return lines.join('\n');
}

function appendBucket(lines: string[], title: string, tasks: StatusTask[]): void {
  lines.push(`  ── ${title} — ${tasks.length} db ──`);

  if (tasks.length === 0) {
    lines.push('       (nincs)');
  } else {
    for (const task of tasks) {
      const due: string = task.dueDate || task.notifyAt;
      const priority: string = task.priority === undefined ? '' : ` [P=${task.priority}]`;

      lines.push(`  • ${task.title}${priority}${due ? ` — ${due}` : ''}`);
    }
  }

  lines.push('');
}

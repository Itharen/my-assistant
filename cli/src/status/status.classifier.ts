// A státusz-kivonat besorolója — TISZTA függvények, futó rendszer nélkül tesztelhetők.
//
// A rekeszek egymást kizárják: egy feladat PONTOSAN egy helyre kerül. Enélkül ugyanaz a
// tétel többször jelenne meg a kivonatban, és a „mennyi dolgom van" érzet hamis lenne.

import {
  HIGH_PRIORITY_THRESHOLD,
  WITHIN_HOUR_MS,
  type StatusBuckets,
  type StatusTask,
} from './status.models.js';

/**
 * Besorolja a feladatokat idő-rekeszekbe.
 *
 * A besorolás alapja a `dueDate`, és ha az üres, a `notifyAt` — mert egy emlékeztető-idő
 * ugyanúgy „mikor kell vele foglalkozni" jelentésű.
 */
export function classifyTasks(tasks: StatusTask[], now: Date): StatusBuckets {
  const buckets: StatusBuckets = {
    overdue: [],
    withinHour: [],
    today: [],
    undatedHighPriority: [],
  };

  const dayStart: Date = startOfLocalDay(now);
  const dayEnd: Date = new Date(dayStart.getTime() + 24 * 60 * 60_000);

  for (const task of tasks) {
    const due: Date | null = parseDue(task);

    if (!due) {
      if ((task.priority ?? 0) >= HIGH_PRIORITY_THRESHOLD) buckets.undatedHighPriority.push(task);
      continue;
    }

    if (due.getTime() < now.getTime()) {
      buckets.overdue.push(task);
      continue;
    }

    if (due.getTime() <= now.getTime() + WITHIN_HOUR_MS) {
      buckets.withinHour.push(task);
      continue;
    }

    // A „ma" a HELYI nap vége, nem a most+24h — a 23:00-kor esedékes ma van, a holnap 09:00 nem.
    if (due.getTime() < dayEnd.getTime()) buckets.today.push(task);
  }

  sortBucket(buckets.overdue);
  sortBucket(buckets.withinHour);
  sortBucket(buckets.today);
  buckets.undatedHighPriority.sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));

  return buckets;
}

/** Egy mondatos összegzés — magában is értelmes, kód-hivatkozás nélkül. */
export function buildHeadline(buckets: StatusBuckets, isPartial: boolean): string {
  const parts: string[] = [];

  if (buckets.overdue.length > 0) parts.push(`${buckets.overdue.length} lejárt`);
  if (buckets.withinHour.length > 0) parts.push(`${buckets.withinHour.length} egy órán belül`);
  if (buckets.today.length > 0) parts.push(`${buckets.today.length} ma`);
  if (buckets.undatedHighPriority.length > 0) {
    parts.push(`${buckets.undatedHighPriority.length} dátum nélküli, magas prioritású`);
  }

  const base: string = parts.length === 0
    ? 'Nincs időzített teendő.'
    : `${parts.join(' · ')}.`;

  // 🔴 A hiányos kivonatnál a nulla NEM azt jelenti, hogy nincs teendő.
  return isPartial
    ? `⚠️ HIÁNYOS KIVONAT (egy forrás nem válaszolt) — ${base} A számok nem teljesek.`
    : base;
}

/** A `dueDate`, ha van; különben a `notifyAt`. Érvénytelen értékre `null`. */
function parseDue(task: StatusTask): Date | null {
  for (const candidate of [task.dueDate, task.notifyAt]) {
    if (typeof candidate !== 'string' || candidate.trim().length === 0) continue;

    const parsed: Date = new Date(candidate);

    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

/** Előbb a korábbi határidő; azonos időnél a magasabb prioritás. */
function sortBucket(bucket: StatusTask[]): void {
  bucket.sort((left, right) => {
    const leftDue: Date | null = parseDue(left);
    const rightDue: Date | null = parseDue(right);
    const difference: number = (leftDue?.getTime() ?? 0) - (rightDue?.getTime() ?? 0);

    if (difference !== 0) return difference;

    return (right.priority ?? 0) - (left.priority ?? 0);
  });
}

function startOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

// Kommunikációs csatorna-diagnosztika — adatmodellek.
//
// Owner-követelmény (2026-09-06): „kéne legyen nagyon alapos hibakezelési rendszerünk,
// ami deskriptív infót ad neked arról, hogy mi nem jó, mi hiányzik."
//
// Ezért minden ellenőrzés HÁROM dolgot mond meg, nem egyet:
//   mi az állapot · mit MÉRTÜNK · MIT KELL TENNI.
//
// 🔴 És a „nem tudom" is EREDMÉNY: az `unknown` állapot külön létezik, hogy egy meg nem
// mérhető dolog SOHA ne látszódjon „rendben"-nek.

/** Egy ellenőrzés kimenetele. */
export type CommCheckStatus =
  /** Működik, mérve. */
  | 'ok'
  /** Nincs beállítva / nincs megépítve — ismert, várt hiány. */
  | 'missing'
  /** Létezik, de rosszul vagy csak részben működik. */
  | 'degraded'
  /** Mérve, és hibás. */
  | 'broken'
  /** ⚠️ NEM SIKERÜLT MEGÁLLAPÍTANI — ez nem „rendben". */
  | 'unknown';

export interface CommCheck {
  /** Stabil azonosító — script és napló ezt használja. */
  id: string;
  /** Melyik csatornához/rétegbe tartozik. */
  /** ⭐ Az `ldp` SZANDEKOSAN elol: ha az nem fut, alatta semmi nem fut. */
  area: 'ldp' | 'ccap' | 'discord' | 'speaker' | 'presence';
  /** Ember-olvasható cím. */
  label: string;
  status: CommCheckStatus;
  /** Amit MÉRTÜNK — tény, nem vélemény. */
  detail: string;
  /** MIT KELL TENNI. `ok` esetén elhagyható; minden más esetben KÖTELEZŐ. */
  remedy?: string;
}

export interface CommDoctorReport {
  checkedAt: string;
  /** Összegzés: a legrosszabb állapot dönt. */
  overall: CommCheckStatus;
  /** Egy mondat, ami megmondja, mi a következő teendő. */
  headline: string;
  counts: Record<CommCheckStatus, number>;
  checks: CommCheck[];
}

/** A súlyossági sorrend — az összegzésnél a legrosszabb nyer. */
const SEVERITY: Record<CommCheckStatus, number> = {
  ok: 0,
  missing: 1,
  unknown: 2,
  degraded: 3,
  broken: 4,
};

export function summarizeChecks(checks: CommCheck[], checkedAt: string): CommDoctorReport {
  const counts: Record<CommCheckStatus, number> = {
    ok: 0, missing: 0, degraded: 0, broken: 0, unknown: 0,
  };

  for (const check of checks) counts[check.status] += 1;

  const worst: CommCheck | undefined = [...checks]
    .sort((left, right) => SEVERITY[right.status] - SEVERITY[left.status])[0];

  const overall: CommCheckStatus = worst?.status ?? 'unknown';

  return {
    checkedAt,
    overall,
    headline: buildHeadline(overall, worst, counts),
    counts,
    checks,
  };
}

function buildHeadline(
  overall: CommCheckStatus,
  worst: CommCheck | undefined,
  counts: Record<CommCheckStatus, number>,
): string {
  if (overall === 'ok') return `Minden ellenőrzés rendben (${counts.ok} db).`;

  if (!worst) return 'Nem futott le egyetlen ellenőrzés sem.';

  return `${counts.ok} rendben · ${counts.missing} hiányzik · ${counts.degraded} részleges · `
    + `${counts.broken} hibás · ${counts.unknown} nem megállapítható. `
    + `Legsürgősebb: ${worst.label} — ${worst.remedy ?? 'nincs megadva teendő.'}`;
}

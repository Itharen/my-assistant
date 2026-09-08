// FUT-E AZ LDP? — a workflow-trigger KÖTELEZŐ első ellenőrzése.
//
// > **Owner-kérés (2026-09-07):** *„a workflow triggerekkor ellenőrizned kellene mindig h fut
// > e a my assistant LDP"*
//
// 🔴 MIÉRT EZ AZ ELSŐ: az LDP a **default futtatási mód** (`ldp-default-runtime.md`), és
// **alatta él minden** — a szerver, a Discord-figyelő, a jelenlét-figyelő, a konzol-pulzus.
// Ha az LDP nem fut, akkor NEM CSAK a build áll: a **csatorna is néma**, és az owner
// üzenetei sehova nem érkeznek meg. Az összes többi ellenőrzés ilyenkor félrevezető.
//
// ⚠️ A LEGFONTOSABB TERVEZÉSI PONT: **a fájl megléte NEM bizonyíték.** A `status.json` ott
// marad a lemezen akkor is, ha a folyamat rég meghalt — és akkor „fut"-nak látszana. Ezért a
// **FOLYAMATOT** is megnézzük a benne lévő `pid` alapján.
//
// *(Ugyanaz a hibaosztály, ami a jelenlét-figyelőt 112 napig halottan tartotta: a
// konfiguráció megléte nem azonos a működéssel.)*

import { existsSync, readFileSync, statSync } from 'node:fs';
import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';

/** Ennél régebbi állapot-fájl gyanús, még ha a folyamat él is. */
export const LDP_STATUS_STALE_MS: number = 30 * 60_000;

export type LdpState =
  /** Fut, friss állapottal. */
  | 'running'
  /** Van állapot-fájl, de a folyamat MÁR NEM ÉL. */
  | 'dead'
  /** Fut, de az állapot-fájl régen frissült — gyanús. */
  | 'stale'
  /** Soha nem futott ebben a munkakönyvtárban. */
  | 'absent';

export interface LdpStatus {
  state: LdpState;
  pid?: number;
  phase?: string;
  /** Az állapot-fájl kora. */
  ageMs?: number;
  /** Ember-olvasható összegzés. */
  detail: string;
  /** MIT KELL TENNI, ha baj van. */
  remedy?: string;
}

/**
 * Él-e a folyamat? A `kill(pid, 0)` nem küld jelet, csak létezést kérdez.
 *
 * ⚠️ Olvasási/jogosultsági hibánál `false`-t adunk — az ÓVATOS irány: inkább jelezzünk
 * feleslegesen, mint hogy egy halott LDP-t élőnek mondjunk.
 */
export function isProcessAlive(pid: number, killer: (p: number, s: number) => void = process.kill): boolean {
  try {
    killer(pid, 0);

    return true;
  } catch (err) {
    const code: string | null = SwallowedFailure_Util.readErrorCode(err);

    // Nincs ilyen folyamat — ez a BIZTOS nemleges valasz.
    if (code === 'ESRCH') {
      return false;
    }

    // ⭐ Az `EPERM` azt jelenti, hogy a folyamat LETEZIK, csak nem kuldhetunk neki jelet.
    // A korabbi vak `false` ezt „halottnak" mondta — vagyis egy mas jogosultsaggal futo
    // LDP-t elveszettnek jelentett volna, es ujraindulast surgetett volna feleslegesen.
    if (code === 'EPERM') {
      return true;
    }
    SwallowedFailure_Util.report('comm.ldp-check.isProcessAlive', err);

    return false;
  }
}

/**
 * Az LDP állapota a státusz-fájlból ÉS a folyamatból.
 *
 * 🔴 Hibát SOHA nem dob: egy ellenőrzés nem akaszthatja meg a kört.
 */
export function readLdpStatus(
  statusFile: string,
  now: Date = new Date(),
  aliveCheck: (pid: number) => boolean = (pid) => isProcessAlive(pid),
): LdpStatus {
  const remedy: string = 'Indítsd el a saját terminálablakában: `dc ldp` — alatta él a szerver, '
    + 'a Discord-figyelő, a jelenlét-figyelő és a konzol-pulzus.';

  try {
    if (!existsSync(statusFile)) {
      return {
        state: 'absent',
        detail: 'Nincs LDP állapot-fájl — az LDP ebben a munkakönyvtárban soha nem futott.',
        remedy,
      };
    }

    const parsed = JSON.parse(readFileSync(statusFile, 'utf-8')) as { pid?: number; phase?: string };
    const ageMs: number = now.getTime() - statSync(statusFile).mtimeMs;
    const pid: number | undefined = typeof parsed.pid === 'number' ? parsed.pid : undefined;

    if (pid === undefined) {
      return {
        state: 'dead',
        ageMs,
        detail: 'Az állapot-fájlban NINCS folyamat-azonosító — nem tudjuk igazolni, hogy fut.',
        remedy,
      };
    }

    // ⭐ ITT DŐL EL: a fájl megléte nem bizonyíték, a FOLYAMAT az.
    if (!aliveCheck(pid)) {
      return {
        state: 'dead',
        pid,
        ageMs,
        ...(parsed.phase ? { phase: parsed.phase } : {}),
        detail: `⚠️ Az LDP NEM FUT (a ${pid} folyamat már nem él), pedig az állapot-fájl megvan. `
          + 'Ilyenkor a Discord-csatorna is NÉMA.',
        remedy,
      };
    }

    if (ageMs > LDP_STATUS_STALE_MS) {
      return {
        state: 'stale',
        pid,
        ageMs,
        ...(parsed.phase ? { phase: parsed.phase } : {}),
        detail: `A folyamat (${pid}) él, de az állapot-fájl ${Math.round(ageMs / 60_000)} perce `
          + 'nem frissült — elképzelhető, hogy beragadt.',
        remedy: 'Nézd meg a terminálablakot; ha tényleg áll, indítsd újra: `dc ldp`.',
      };
    }

    return {
      state: 'running',
      pid,
      ageMs,
      ...(parsed.phase ? { phase: parsed.phase } : {}),
      detail: `Fut (pid ${pid}${parsed.phase ? `, fázis: ${parsed.phase}` : ''}).`,
    };
  } catch (err: unknown) {
    return {
      state: 'absent',
      detail: `Az LDP állapotát nem tudtam megállapítani: ${err instanceof Error ? err.message : String(err)}`,
      remedy,
    };
  }
}

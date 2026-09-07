// TÁVVEZÉRLÉS-FELISMERÉS — „a gépnél ül, vagy csak TÁVOLRÓL nyúl hozzá?"
//
// > **Owner (2026-09-07 09:38):** *„Óh.... Most jövök rá h lehet megzavartam a jelenlét
// > figyelést távvezérléssel..."*
//
// 🔴 A PROBLÉMA, MÉRVE: a jelenlét-mérés a Windows `GetLastInputInfo`-jára épül, a
// **RustDesk pedig a KONZOL-munkamenetbe injektálja a bevitelt** (a `query session` szerint a
// munkamenet `console`, nem `rdp-tcp`). Ezért a távoli kattintás **bájtra ugyanúgy néz ki**,
// mint a helyi — az üresjárati időből ez SOHA nem lesz megkülönböztethető.
//
// ⭐ A MEGOLDÁS: nem az inputot vizsgáljuk, hanem azt, hogy **volt-e nyitott távoli
// munkamenet** abban a pillanatban. A RustDesk kapcsolat-kezelője (`cm`) ezt naplózza.
//
// **Élő bizonyíték (2026-09-07):** a jelenlét-mérés 09:15:33-kor „aktív"-ot mutatott, pedig az
// owner az AI Summiton volt. A RustDesk-napló szerint ekkor **09:15:27 → 09:23:10** között
// távoli munkamenet állt fenn. A rejtély megoldva, és a jel használható.
//
// ⚠️ A FÁJLNÉV NEM A MUNKAMENET IDEJE! A RustDesk forgatja a naplót, és az új fájl a
// **KÖVETKEZŐ** munkamenet idejéről kapja a nevét: a `RustDesk_r2026-09-07_09-15-27.log`
// valójában a **09-05 07:52:27**-es munkamenetet tartalmazza. ⛔ Ezért SOHA nem a fájlnevet
// elemezzük, hanem a TARTALMAT.

import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Egy távoli munkamenet ideje. A `endedAt` hiánya = MÉG NYITVA. */
export interface RemoteSessionInterval {
  startedAt: Date;
  endedAt?: Date;
}

/** Ennyi napi naplófájlnál többet nem olvasunk be — védőkorlát a régi naplók ellen. */
export const REMOTE_LOG_FILE_LIMIT: number = 12;

/** A nyitva maradt munkamenetet ennyi idő után már nem tekintjük élőnek. */
export const OPEN_SESSION_MAX_MS: number = 12 * 60 * 60_000;

/**
 * Egy RustDesk `cm`-napló tartalmából kiolvassa a munkamenet-időszakokat.
 *
 * A napló két, párba állítható sort ad:
 *   `Got new connection`  → a munkamenet KEZDETE
 *   `connection closed`   → a munkamenet VÉGE
 *
 * 🔴 A lezáratlan munkamenetet **NEM dobjuk el**: ha a RustDesk összeomlott vagy a gépet
 * kikapcsolták, a záró sor hiányzik — de a munkamenet akkor is fennállt. Nyitva hagyjuk, és a
 * kort a hívó korlátozza (`OPEN_SESSION_MAX_MS`), különben egy régi, félbemaradt bejegyzés
 * **örökre** „távoli"-nak jelölne mindent.
 */
export function parseRemoteSessions(logText: string): RemoteSessionInterval[] {
  const sessions: RemoteSessionInterval[] = [];
  let open: RemoteSessionInterval | null = null;

  for (const line of logText.split('\n')) {
    const timestamp: Date | null = parseLogTimestamp(line);

    if (!timestamp) continue;

    if (line.includes('Got new connection')) {
      // Két egymást követő nyitás lezáró nélkül: az elsőt lezáratlanul megtartjuk.
      if (open) sessions.push(open);

      open = { startedAt: timestamp };
      continue;
    }

    if (line.includes('connection closed') && open) {
      sessions.push({ startedAt: open.startedAt, endedAt: timestamp });
      open = null;
    }
  }

  if (open) sessions.push(open);

  return sessions;
}

/** `[2026-09-07 09:15:27.483941 +02:00] DEBUG …` → `Date`. Hibás sorra `null`. */
function parseLogTimestamp(line: string): Date | null {
  const match = /^\[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})[.\d]*\s*([+-]\d{2}:\d{2})?\]/.exec(line);

  if (!match) return null;

  const parsed: Date = new Date(`${match[1]}T${match[2]}${match[3] ?? ''}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Fennállt-e távoli munkamenet az adott pillanatban?
 *
 * ⚠️ A lezáratlan munkamenetet csak `OPEN_SESSION_MAX_MS`-ig vesszük élőnek — enélkül egy
 * félbemaradt bejegyzés minden későbbi mérést „távoli"-nak minősítene.
 */
export function isRemoteAt(sessions: RemoteSessionInterval[], when: Date): boolean {
  const whenMs: number = when.getTime();

  return sessions.some((session: RemoteSessionInterval): boolean => {
    const startMs: number = session.startedAt.getTime();

    if (whenMs < startMs) return false;

    const endMs: number = session.endedAt
      ? session.endedAt.getTime()
      : startMs + OPEN_SESSION_MAX_MS;

    return whenMs <= endMs;
  });
}

/** A RustDesk kapcsolat-kezelő naplóinak könyvtára. */
export function resolveRemoteLogDir(userHome: string = homedir()): string {
  return join(userHome, 'AppData', 'Roaming', 'RustDesk', 'log', 'cm');
}

/**
 * A közelmúlt távoli munkamenetei.
 *
 * 🔴 Hibát SOHA nem dob: ha a napló nem olvasható (nincs RustDesk, jogosultsági hiba), üres
 * listát adunk — vagyis „nem tudunk távoli munkamenetről". Ez az ÓVATOS irány: a jelenlét
 * ilyenkor annyit tud, amennyit eddig is tudott, nem kevesebbet.
 */
export async function readRemoteSessions(
  logDir: string = resolveRemoteLogDir(),
): Promise<RemoteSessionInterval[]> {
  try {
    if (!existsSync(logDir)) return [];

    const names: string[] = (await readdir(logDir)).filter((n: string) => n.endsWith('.log'));
    // ⚠️ A fájlnév NEM a munkamenet ideje (lásd a fejlécet), ezért a MÓDOSÍTÁSI IDŐ szerint
    // valasztjuk ki a legfrissebbeket — az viszont megbízható.
    const withTimes: { name: string; mtimeMs: number }[] = [];

    for (const name of names) {
      try {
        withTimes.push({ name, mtimeMs: (await stat(join(logDir, name))).mtimeMs });
      } catch {
        continue;
      }
    }

    const recent = withTimes
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, REMOTE_LOG_FILE_LIMIT);

    const sessions: RemoteSessionInterval[] = [];

    for (const file of recent) {
      try {
        sessions.push(...parseRemoteSessions(await readFile(join(logDir, file.name), 'utf-8')));
      } catch {
        continue;
      }
    }

    return sessions;
  } catch {
    return [];
  }
}

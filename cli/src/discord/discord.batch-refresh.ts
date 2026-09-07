// A KÖTEG FRISSÍTÉSE KIKÜLDÉS ELŐTT — a legfrissebb változat menjen át, ne a régi.
//
// > **Owner-kérés (2026-09-07):** *„Jó lenne ha a discord msg kezelés frissítené küldés előtt
// > a msg-eket. (Ha időközben még gyűjtés/küldés előtt javítom/módosítom, akkor a friss menjen
// > neked."*
//
// 🔴 MIÉRT SZÁMÍT: a köteg akár percekig gyűlik (amíg a session dolgozik). Ha az owner ezalatt
// **kijavít** egy elgépelést vagy **átfogalmaz** egy utasítást, a régi szöveg alapján
// cselekednék — miközben ő már azt hiszi, a javított változat érvényes. Ez pontosan az a fajta
// néma félreértés, ami ellen a tükör-üzenet is védi a hangüzenetet.
//
// Ez a fájl a **tiszta döntési logika**: Discord-kapcsolat nélkül tesztelhető. A tényleges
// lekérdezést a hívó (`discord.listener.ts`) adja be függvényként.

/** Amit a köteg egy eleméről tudni kell a frissítéshez. */
export interface RefreshableEntry {
  messageId: string;
  content: string;
}

/** A Discordtól visszakapott aktuális állapot. */
export type CurrentMessageState =
  /** Létezik, ez a mostani szövege. */
  | { kind: 'present'; content: string }
  /** Az owner TÖRÖLTE. */
  | { kind: 'deleted' }
  /**
   * Nem sikerült lekérdezni (hálózat, jogosultság, időtúllépés).
   *
   * ⚠️ KÜLÖN eset a törléstől: bizonytalanságból SOHA nem dobunk el üzenetet.
   */
  | { kind: 'unknown' };

export interface RefreshOutcome<T extends RefreshableEntry> {
  /** A kötegbe visszaírandó, frissített lista. */
  entries: T[];
  /** Hány üzenet szövege változott. */
  updatedCount: number;
  /** Hány üzenetet ejtettünk, mert az owner törölte. */
  removedCount: number;
  /** Hány üzenetnél nem tudtuk megállapítani az állapotot — ezeket VÁLTOZATLANUL megtartjuk. */
  unresolvedCount: number;
}

/**
 * A köteg frissítése az aktuális Discord-állapot alapján.
 *
 * A három eset szándékosan külön van kezelve:
 *
 * | Állapot | Mit teszünk | Miért |
 * |---|---|---|
 * | `present` | a **friss** szöveget vesszük | ez az owner kérése |
 * | `deleted` | **kiejtjük** a kötegből | ha visszavonta, ne cselekedjek rá |
 * | `unknown` | **változatlanul megtartjuk** | ⛔ egy hálózati hiba NEM törölhet üzenetet |
 *
 * 🔴 Az `unknown` ág a legfontosabb: a „nem tudom" és a „törölve" összemosása **néma
 * üzenet-vesztés** lenne — pontosan az a hibaosztály, ami ellen az egész csatorna épült.
 */
export function refreshBatchEntries<T extends RefreshableEntry>(
  entries: T[],
  currentStates: Map<string, CurrentMessageState>,
): RefreshOutcome<T> {
  const kept: T[] = [];
  let updatedCount: number = 0;
  let removedCount: number = 0;
  let unresolvedCount: number = 0;

  for (const entry of entries) {
    const state: CurrentMessageState = currentStates.get(entry.messageId) ?? { kind: 'unknown' };

    if (state.kind === 'deleted') {
      removedCount += 1;
      continue;
    }

    if (state.kind === 'unknown') {
      unresolvedCount += 1;
      kept.push(entry);
      continue;
    }

    // 🔴 SOHA nem írunk felül meglévő tartalmat ÜRESSEL.
    //
    // A HANGÜZENET miatt kritikus: ott a kötegben az **átirat** áll, a Discord-üzenet törzse
    // viszont ÜRES (a hang csatolmány). Enélkül a frissítés kitörölné a felismert szöveget,
    // és a hangüzenet — ami idáig eljutott — pont az utolsó lépésnél veszne el.
    // Mellékesen véd minden olyan esetre is, amikor a lekérdezés hiányos adatot ad vissza.
    if (state.content.trim().length === 0 && entry.content.trim().length > 0) {
      unresolvedCount += 1;
      kept.push(entry);
      continue;
    }

    if (state.content !== entry.content) {
      updatedCount += 1;
      kept.push({ ...entry, content: state.content });
      continue;
    }

    kept.push(entry);
  }

  return { entries: kept, updatedCount, removedCount, unresolvedCount };
}

/** Rövid, ember-olvasható összegzés a naplóhoz. `null`, ha nem történt semmi érdemi. */
export function describeRefresh(outcome: RefreshOutcome<RefreshableEntry>): string | null {
  const parts: string[] = [];

  if (outcome.updatedCount > 0) parts.push(`${outcome.updatedCount} üzenet FRISSÜLT`);
  if (outcome.removedCount > 0) parts.push(`${outcome.removedCount} törölve lett, kiejtve`);
  if (outcome.unresolvedCount > 0) {
    parts.push(`${outcome.unresolvedCount} nem volt lekérdezhető (változatlanul megy)`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

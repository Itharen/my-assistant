// ÁTVÉTELI NYUGTA — „megvan, dolgozom".
//
// > **Owner (2026-09-07 09:54):** *„Nah most csak nem jelez a discord »typing« (lejárt) vagy
// > nem jutotttak el ezek az üzenetek hozzád?"*
//
// 🔴 A HIÁNY, AMIT EZ PÓTOL — és amit MÉRÉSSEL igazoltunk: az üzenetek **hiánytalanul
// megérkeztek** (a köteg üres volt, a kézbesítés megtörtént), az ownernek mégis **meg kellett
// kérdeznie**. Vagyis a rendszer működött, a **visszajelzése** nem.
//
// Két oka volt:
//   1. a „gépel…" jelzés **15 perc után lejár** (biztonsági szelep) — utána néma a csatorna;
//   2. a köteg **percekig-tízpercekig vár**, amíg a session dolgozik, és eddig SEMMI nem
//      mondta meg, hogy az üzenetek egyáltalán megérkeztek.
//
// ⇒ A nyugta egy **rövid, EGYSZERI** üzenet: megvan N üzenet, dolgozom. Nem válasz — csak
// annyit állít, hogy **megérkezett**. *(A válasz-kötelezettséget szándékosan NEM törli:
// `discord.reply-tracker.ts` → `OutboundKind`.)*
//
// ⭐ Ez ugyanannak az elvnek a folytatása, mint a küldés utáni visszaolvasás és a
// tükör-üzenet: **ahol az adat átmegy egy határon, ott vissza kell jelezni.**

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/** Ennyi várakozás után küldünk nyugtát. Ennél rövidebb késésnél csak zaj lenne. */
export const RECEIPT_AFTER_MS: number = 90_000;

export interface ReceiptDecisionInput {
  /** Hány üzenet vár a kötegben. */
  pendingCount: number;
  /** A legrégebbi várakozó üzenet kora. */
  oldestAgeMs: number;
  /** Kiküldtük-e MÁR a nyugtát erre a kötegre. */
  alreadyAcknowledged: boolean;
}

export interface ReceiptDecision {
  shouldSend: boolean;
  /** Miért — naplózáshoz. */
  reason: string;
}

/**
 * Küldjünk-e most átvételi nyugtát?
 *
 * ⛔ **KÖTEGENKÉNT LEGFELJEBB EGYSZER.** A kiküldési kör 15 mp-enként fut; ismétlés nélkül
 * ez percenként négy „megvan" üzenetet jelentene — az nem megnyugtatás, hanem **spam**.
 */
export function decideReceipt(input: ReceiptDecisionInput): ReceiptDecision {
  if (input.pendingCount === 0) {
    return { shouldSend: false, reason: 'Nincs várakozó üzenet.' };
  }

  if (input.alreadyAcknowledged) {
    return { shouldSend: false, reason: 'Erre a kötegre már ment nyugta — nem ismételjük.' };
  }

  if (input.oldestAgeMs < RECEIPT_AFTER_MS) {
    return {
      shouldSend: false,
      reason: `A legrégebbi üzenet még csak ${Math.round(input.oldestAgeMs / 1000)} mp-es — `
        + `${Math.round(RECEIPT_AFTER_MS / 1000)} mp alatt a nyugta csak zaj lenne.`,
    };
  }

  return {
    shouldSend: true,
    reason: `${input.pendingCount} üzenet vár ${Math.round(input.oldestAgeMs / 60_000)} perce — `
      + 'jelezzük, hogy megérkeztek.',
  };
}

/**
 * A nyugta szövege.
 *
 * ⭐ SZÁNDÉKOSAN RÖVID és **nem ígér határidőt**: azt az egy dolgot mondja meg, ami hiányzott —
 * hogy **megérkezett**. *(`discord-message-style.md`: mi történt + mi a teendő.)*
 */
export function composeReceiptMessage(pendingCount: number): string {
  const what: string = pendingCount === 1 ? 'az üzeneted' : `mind a ${pendingCount} üzeneted`;

  return `📥 Megvan ${what} — épp dolgozom, ezért még nem válaszoltam. Jövök vele.`;
}

/**
 * A nyugta-jelolo fajlja.
 *
 * 🔴 MIERT FAJLBAN, es nem csak memoriaban: a figyelot a szerver felugyeli, a szerver pedig
 * **minden LDP-korben ujraindul**. Memoriaban tartva a jelolo ilyenkor elveszne, es a meg
 * mindig varo kotegre **ujabb nyugta** menne ki — fejlesztes kozben akar percenkent.
 * A fajl tulEli az ujrainditast, tehat a „kotegenkent egyszer" tenyleg egyszer marad.
 */
export function resolveReceiptMarkerPath(userHome: string = homedir()): string {
  return join(userHome, '.config', 'my-assistant', 'discord', 'receipt-marker.json');
}

/** Melyik kotegre ment mar nyugta. Hibanal `null` — olyankor inkabb kuldunk egyet. */
export async function readAcknowledgedOldestId(
  path: string = resolveReceiptMarkerPath(),
): Promise<string | null> {
  try {
    if (!existsSync(path)) return null;

    const parsed = JSON.parse(await readFile(path, 'utf-8')) as { oldestMessageId?: unknown };

    return typeof parsed.oldestMessageId === 'string' ? parsed.oldestMessageId : null;
  } catch {
    return null;
  }
}

/** A jelolo kiirasa. Hibat SOHA nem dob — egy jelolo nem akaszthatja meg a csatornat. */
export async function writeAcknowledgedOldestId(
  oldestMessageId: string | null,
  path: string = resolveReceiptMarkerPath(),
): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify({ oldestMessageId }), 'utf-8');
  } catch {
    // Elnyelve: ha nem tudjuk rogziteni, legfeljebb egy folosleges nyugta megy ki.
    // Az OVATOS irany itt a tobb jelzes, nem a kevesebb.
  }
}

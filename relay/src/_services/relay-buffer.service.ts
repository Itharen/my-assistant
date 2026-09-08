// A RELAY PUFFERE — és ami a legfontosabb benne: NEM ARCHÍVUM.
//
// > **Owner (2026-09-07):** *„semmiképp nem a my assistant servert. És mindenképp secure
// > kell legyen."*
//
// A relay egyetlen dolga, hogy **átmenetileg megőrizze** azt, amit a telefon küldött, amíg a
// my-assistant le nem húzza. ⛔ Nem értelmezi, nem elemzi, nem tárolja hosszan.
//
// 🔴 A KÉT TERVEZÉSI ELV, AMI ITT MINDENT MEGHATÁROZ:
//
// 1. **Csak IGAZOLT átadás után törlünk.** A lehúzás önmagában NEM elég: ha a válasz elveszik
//    az úton, az adat elveszne. Ezért a törlés külön, NYUGTÁZOTT lépés (`acknowledge`).
//    *(Ugyanaz az elv, mint a Discord-kötegnél: „a köteg csak IGAZOLT átadás után ürül".)*
//
// 2. **Ami itt van, azt el lehet lopni.** Ezért minél rövidebb ideig legyen itt, és minél
//    kevesebb. A lejárat NEM kényelmi funkció, hanem a támadási felület csökkentése.

import { DyFM_Error } from '@futdevpro/fsm-dynamo';

/** Egy pufferelt tétel. A `payload` a relay számára ÁTLÁTSZATLAN — nem értelmezzük. */
export interface BufferedItem {
  /** A tétel azonosítója — a nyugtázás ezzel hivatkozik rá. */
  id: string;
  /** Mikor érkezett (ISO). */
  receivedAt: string;
  /** A telefon nyers küldeménye. ⛔ A relay NEM néz bele. */
  payload: unknown;
}

/**
 * Ennyi tételnél többet nem tartunk.
 *
 * ⚠️ VÉDŐKORLÁT: a relay **közös gépen** fut. Egy elszabadult (vagy kiszivárgott tokennel
 * visszaélő) kliens nem tölthet meg egy megosztott lemezt. A legrégebbi esik ki.
 */
export const MAX_BUFFERED_ITEMS: number = 5_000;

/** Ennyi idő után a tétel akkor is kiesik, ha SOHA senki nem húzta le. */
export const ITEM_MAX_AGE_MS: number = 7 * 24 * 60 * 60_000;

export interface PruneOutcome {
  kept: BufferedItem[];
  /** Hány tétel esett ki kor miatt. */
  expiredCount: number;
  /** Hány tétel esett ki darabszám-korlát miatt. */
  overflowCount: number;
}

/**
 * A puffer karbantartása — tiszta függvény.
 *
 * A sorrend szándékos: **előbb a lejárat, aztán a darabszám.** Fordítva egy régi, amúgy is
 * lejáró tétel kiszoríthatna egy frisset.
 */
export function pruneBuffer(
  items: BufferedItem[],
  now: Date = new Date(),
  maxItems: number = MAX_BUFFERED_ITEMS,
  maxAgeMs: number = ITEM_MAX_AGE_MS,
): PruneOutcome {
  try {
    const nowMs: number = now.getTime();
    const notExpired: BufferedItem[] = items.filter((item: BufferedItem): boolean => {
      const receivedMs: number = new Date(item.receivedAt).getTime();

      // Az értelmezhetetlen időbélyeget MEGTARTJUK: bizonytalanságból nem dobunk el adatot.
      return Number.isNaN(receivedMs) || nowMs - receivedMs <= maxAgeMs;
    });
    const expiredCount: number = items.length - notExpired.length;
    // Túlcsordulásnál a LEGRÉGEBBI esik ki — a friss helyzet többet ér, mint a régi.
    const kept: BufferedItem[] = notExpired.length > maxItems
      ? notExpired.slice(notExpired.length - maxItems)
      : notExpired;

    return { kept, expiredCount, overflowCount: notExpired.length - kept.length };
  } catch (error) {
    // ⚠️ Ez a függvény MINDEN végpontról meghívódik. Ha egy sérült tétel miatt elszáll, a
    // hívó egy nyers `TypeError`-t kapna — a relay pedig azt a stacket küldené ki a hálózatra.
    // A kanonikus kód helyette AZONOSÍTHATÓ, és nem szivárogtat belső részletet.
    throw new DyFM_Error({
      error: error,
      errorCode: 'MA-RELAY-BUFFER-PRUNE-FAILED',
      message: 'A puffer karbantartása elszállt.',
    });
  }
}

/**
 * A NYUGTÁZOTT tételek eltávolítása.
 *
 * 🔴 Ez az EGYETLEN út, amin adat kikerül a pufferből „sikeresen". A puszta lehúzás nem töröl:
 * ha a válasz elveszik a hálózaton, a tétel **itt marad**, és a következő lehúzás újra hozza.
 * Inkább küldjük kétszer, mint egyszer sem — a duplikátumot a fogadó oldal kiszűri az `id`
 * alapján, az elveszett helyzetet viszont **semmi** nem hozza vissza.
 */
export function removeAcknowledged(items: BufferedItem[], acknowledgedIds: string[]): BufferedItem[] {
  try {
    const acknowledged: Set<string> = new Set(acknowledgedIds);

    return items.filter((item: BufferedItem): boolean => !acknowledged.has(item.id));
  } catch (error) {
    // 🔴 A törlési út a legérzékenyebb: ha itt elszáll, a hívó nem tudja, hogy a tételek
    // TÖRLŐDTEK-e vagy sem. A kanonikus kód mellett a lényeg, hogy a kivétel NEM néma —
    // a nyugtázás bukása látszik, és a tételek a következő lehúzáskor újra jönnek.
    throw new DyFM_Error({
      error: error,
      errorCode: 'MA-RELAY-BUFFER-ACK-REMOVE-FAILED',
      message: 'A nyugtázott tételek eltávolítása elszállt.',
    });
  }
}

/**
 * Az időbélyeg-alapú azonosító.
 *
 * ⚠️ Szándékosan **nem** tartalmaz semmit a tartalomból — az azonosító naplóba és URL-be is
 * kerülhet, tehát nem szivároghat belőle helyzet-információ.
 */
export function createItemId(now: Date, randomPart: string): string {
  try {
    return `${now.getTime().toString(36)}-${randomPart}`;
  } catch (error) {
    // ⚠️ Azonosító nélkül a tétel NEM nyugtázható ⇒ soha nem törlődne. Ezért itt a némán
    // előálló hibás azonosító rosszabb, mint a hangos bukás: az ingest inkább dőljön el.
    throw new DyFM_Error({
      error: error,
      errorCode: 'MA-RELAY-ITEM-ID-FAILED',
      message: 'A tétel-azonosító előállítása elszállt.',
    });
  }
}

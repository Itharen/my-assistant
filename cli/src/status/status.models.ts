// Státusz-kivonat — adatmodellek.
//
// Owner-kérés (2026-09-06): „egy egyszerűsítő státuszrefresh eszközt, ami készít neked egy
// hiteles, aktuális státuszkivonatot, amiben egy helyen benne van minden info. amik lesznek
// ma, meg amik lesznek egy órán belül, meg amik elmúltak. Meg majd még amit kérek a jövőben."
//
// 🔴 A hiányzó adat NEM „nincs teendő". Ha egy forrás nem érhető el, azt a kivonat
// EXPLICIT jelzi (`sources[].status = 'failed'`), különben egy néma organizer-hiba
// „minden rendben"-nek látszana — pontosan az a hibafajta, amit el akarunk kerülni.

/** Egy feladat a kivonatban — csak amit a döntéshez tényleg használunk. */
export interface StatusTask {
  /** Organizer-hivatkozás, pl. `org:task:6a98…`. */
  ref: string;
  title: string;
  /** Prioritás, ha van (magasabb szám = fontosabb). */
  priority?: number;
  /** Határidő ISO formában; üres, ha nincs. */
  dueDate: string;
  /** Emlékeztető ideje ISO formában; üres, ha nincs. */
  notifyAt: string;
  recurrenceType: string;
}

/** A kivonat idő-alapú rekeszei. */
export interface StatusBuckets {
  /** ⏮️ Lejárt és még nyitva. */
  overdue: StatusTask[];
  /** 🔜 A következő 60 percben esedékes. */
  withinHour: StatusTask[];
  /** 📅 Ma esedékes (de nem az elkövetkező órában). */
  today: StatusTask[];
  /**
   * ➕ Dátum nélküli, de magas prioritású tételek.
   *
   * ⚠️ Ez az assistant KIEGÉSZÍTÉSE, nem owner-kérés — azért kell, mert a feladatok
   * túlnyomó részének nincs `dueDate`-je, és nélküle a kivonat üresnek látszana.
   * Owner-megerősítésre vár.
   */
  undatedHighPriority: StatusTask[];
}

/** Egy adatforrás állapota a kivonat elkészítésekor. */
export interface StatusSource {
  name: string;
  status: 'ok' | 'failed';
  /** Hány tételt adott. */
  itemCount?: number;
  /** Hiba esetén: mi történt és mit kell tenni. */
  error?: string;
  remedy?: string;
}

export interface StatusDigest {
  generatedAt: string;
  /** Egy mondat, ami magában is értelmes. */
  headline: string;
  buckets: StatusBuckets;
  /** 🔴 Forrás-állapotok — ha bármelyik `failed`, a kivonat HIÁNYOS. */
  sources: StatusSource[];
  /** Igaz, ha legalább egy forrás elesett — a hívó ilyenkor nem hihet a nulláknak. */
  isPartial: boolean;
}

/** A dátum nélküli tételek innen számítanak „magas prioritásúnak". */
export const HIGH_PRIORITY_THRESHOLD: number = 100;

/** A „hamarosan" ablak hossza. */
export const WITHIN_HOUR_MS: number = 60 * 60_000;

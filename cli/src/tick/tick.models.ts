// Óránkénti Assistant-tick — adatmodellek.
//
// A tick eldönti: van-e miről szólni, MELYIK csatornán, vagy inkább csendben marad.
// A szabályok forrása: `__agent/flows/recurring/hourly-assistant-tick/README.md`.

import type { StatusTask } from '../status/status.models.js';

/**
 * A két munkamód — NEM napszakhoz, hanem az ébrenléthez kötve (owner, 2026-09-06):
 * „Daytime workflow, meg nighttime workflow, amik nem valódi napszakidőszakhoz vannak
 * kötve, hanem ahhoz, hogy én mikor vagyok ébren, és mikor nem."
 */
export type TickMode = 'daytime' | 'nighttime';

export type TickAction =
  /** Megy üzenet. */
  | 'notify'
  /** Van mondanivaló, de VÁR (éjszaka gyűjt, ébredéskor összesít). */
  | 'hold'
  /** Nincs miről szólni — csendes tick. */
  | 'silent';

export type TickChannel = 'speaker' | 'discord';

export interface TickDecision {
  mode: TickMode;
  action: TickAction;
  /** Csak `notify` esetén van értéke. */
  channel: TickChannel | null;
  /** Amiről szólnánk / amit gyűjtünk. */
  items: StatusTask[];
  /** Miért ez a döntés — a naplóba és a diagnosztikába megy. */
  reason: string;
}

export interface TickConfig {
  /**
   * Ugyanarról a tételről ennyi időn belül nem szólunk újra.
   *
   * ⚠️ Ez az assistant KIEGÉSZÍTÉSE, nem owner-kérés. Indok: a tick óránként fut, és egy
   * lejárt feladat óránként újra és újra kimenne — az ismétlés zajjá tenné a csatornát,
   * és pont a fontos üzenetek vesznének el benne. Owner-megerősítésre vár.
   */
  repeatSuppressionMs: number;
}

export const DEFAULT_TICK_CONFIG: TickConfig = {
  repeatSuppressionMs: 6 * 60 * 60_000,
};

/** Melyik tételről mikor szóltunk utoljára — `ref` → ISO időbélyeg. */
export type NotifiedHistory = Record<string, string>;

// 🔍 MI SZÁMÍT ÜZEMÁLLAPOT-HIBÁNAK a `doctor now` szemében? (22. tétel)
//
// > **Owner, 2026-09-12 17:30:** *„Most az ÉN saját retrospektív jegyzetem jelenik meg »utolsó
// > hibaként« — az a bejegyzés, amiben LEÍRTAM a teszt-szemét problémát. Nem rendszer-hiba, hanem
// > **krónika**… A megkülönböztető jel MÁR OTT VAN: az `actor` mező."*
//
// ## 🔴 AZ OK SZERKEZETI, ⛔ nem elírás
//
// A `CLAUDE.md` **előírja**, hogy a szemantikus tanulságot `kind: 'error'` bejegyzésként írjuk le
// *(„hiba, aminek tanulsága van")*. ⇒ **Ugyanabban a naplóban** van a **gép** hibája és az
// **utólagos elemzés** róla. Az önreferencia elkerülhetetlen: a hiba **leírása** lett „a legutóbbi
// hiba". ⇒ Nem a naplózást kell megváltoztatni, hanem az **olvasót** megtanítani szétválasztani.
//
// ## 🔬 A MÉRÉS — 52 nap, 4 131 `kind: 'error'` bejegyzés, actor szerint
//
// | actor | db | Mi ez valójában |
// |---|---|---|
// | `cli` | 3 156 | ⚙️ **futásidejű** — ez kell a diagnosztikának |
// | `server` | 796 | ⚙️ **futásidejű** |
// | `claude` | 100 | 📖 **krónika** — agent-session prózája *(az owner ezt kérte kihagyni)* |
// | `codex` | 46 | 📖 **krónika** — mérve ugyanaz az osztály *(„Organizer shopping-item write blocked…")* |
// | `agent` | 23 | ⚙️ **futásidejű** — mérve: `[notify-discord] POST failed … fetch failed` |
// | `agent-dispatcher` | 6 | ⚙️ **futásidejű** — mérve: `dispatch: JSON parse error …` |
// | `development-agent` | 3 | ⚠️ **VEGYES** *(„Build fail: client …" vs. prózai tanulság)* |
// | `assistant-agent-cron` | 1 | ⚙️ **futásidejű** — `fo tasks.list AUTH-fail` |
//
// ⭐ **EZÉRT NEM „minden, ami nem cli/server"** a szabály: az `agent`, `agent-dispatcher` és
// `assistant-agent-cron` bejegyzések **mért módon GÉPI hibák** — egy fordított logikájú szűrő
// **29 valódi hibát** tüntetett volna el. ⇒ **Nevesített, szűk lista**, ⛔ nem tagadás.
//
// ⚠️ A `development-agent` **szándékosan BENNE MARAD** *(vegyes tartalom)*: a „mutassuk meg, ha
// bizonytalan" irány a helyes — az owner szavaival *„a második a rosszabb"*, ha megtanuljuk
// figyelmen kívül hagyni a mezőt.

import { ActionLogTestOrigin_Util } from '../action-log/action-log.test-origin.js';

/**
 * 📖 AZ AGENT-SESSIONÖK, amiknek a `kind: 'error'` bejegyzése **krónika**, ⛔ nem üzemállapot.
 *
 * ⚠️ MIÉRT NEVESÍTETT LISTA: l. a fájl fejlécének mérését — a „nem `cli`/`server`" szabály
 * **29 valódi gépi hibát** dobott volna el.
 */
const CHRONICLE_ACTORS: readonly string[] = ['claude', 'codex'];

/** A napló-sorok szétválasztása: mi üzemállapot, és mi krónika/teszt. */
export class DoctorNowErrorSource_Util {

  /** Az agent-session actorok — a diagnosztikához és a teszthez. */
  static readonly CHRONICLE_ACTORS: readonly string[] = CHRONICLE_ACTORS;

  /**
   * Mi ez a hiba-bejegyzés?
   *
   * @param entry egy napló-sor lényege — ⭐ **szűk** bemenet, hogy a döntés tesztelhető legyen
   *   fájl-olvasás nélkül.
   * @returns a két „⛔ ez nem üzemállapot" jelzés. ⚠️ Ha **mindkettő** hamis, a bejegyzés
   *   **valódi** rendszer-hiba.
   */
  static classify(entry: { actor?: unknown; extra?: Record<string, unknown>; ref?: string }): {
    isTestOrigin: boolean;
    isChronicle: boolean;
  } {
    return {
      isTestOrigin: ActionLogTestOrigin_Util.isTestEntry({
        ...(entry.extra ? { extra: entry.extra } : {}),
        ...(entry.ref === undefined ? {} : { ref: entry.ref }),
      }),
      isChronicle: typeof entry.actor === 'string' && CHRONICLE_ACTORS.includes(entry.actor),
    };
  }
}

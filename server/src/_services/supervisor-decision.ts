// 🧭 A FELÜGYELŐ DÖNTÉSE — tiszta függvény, hogy a „miért nem indított újra?" kérdés
// egyáltalán megválaszolható legyen.
//
// 🔴 MÉRT ESET (2026-09-08 11:30–11:39): a Discord-figyelő folyamata meghalt, az újraellenőrzés
// köze **60 mp**, mégis **9+ percig** nem indult újra — és **egyetlen napló-bejegyzés sem**
// született róla. A figyelő nélkül a Discord-üzenetek nem érkeznek meg, tehát ez az owner
// csatornája volt néma.
//
// ⚠️ **A kérdés megválaszolhatatlan volt**, mert a felügyelő döntése **sehol nem hagyott nyomot**:
// nem lehetett tudni, hogy „megnéztem, más fut", „hiányzik egy fájl", vagy „meg sem néztem".
//
// ## 🔴 A KÉT HIBA, AMIT EZ FELTÁRT
//
// 1. **Az őrfeltétel nem ütemezett újra.** Az eredeti kód így indult:
//    ```ts
//    if (this.stopping || this.child) return;   // ⛔ újraütemezés NÉLKÜL
//    ```
//    Ha a `child` hivatkozás bármiért beragad *(elmaradt `exit` esemény)*, a felügyelő
//    **véglegesen abbahagyja a felügyeletet** — és soha többé nem néz vissza.
//    ⇒ **A felügyelő nem hagyhatja abba a felügyeletet.** Minden ág újraütemez, kivéve a
//    szándékos leállást.
//
// 2. **Nem volt önjavítás elmaradt `exit`-re.** Ha a `child` be van állítva, de a folyamat
//    **halott**, azt észre kell venni — nem elég a `child !== null`-ra hagyatkozni.
//    *(Ez ugyanaz a tanulság, ami ma már négyszer előjött: egy mező NEVE nem a jelentése.)*

/** Mit tegyen a felügyelő ebben a körben. */
export type SupervisorAction =
  /** Szándékos leállás — ⛔ ez az EGYETLEN ág, ami nem ütemez újra. */
  | 'skip-stopping'
  /** Él a gyermek, minden rendben — csak visszanézünk később. */
  | 'watch-child'
  /** 🔴 A `child` be van állítva, de a folyamat HALOTT — elmaradt `exit`. Önjavítás. */
  | 'reclaim-dead-child'
  /** Hiányzik valami a futtatáshoz — ritkán próbálkozunk. */
  | 'blocked-prerequisites'
  /** Máshol már fut — nem indítunk másodikat. */
  | 'defer-foreign'
  /** Indítunk. */
  | 'start';

export interface SupervisorDecision {
  action: SupervisorAction;
  /** Mikor nézzünk vissza (ms). `null` = soha többé (csak szándékos leállásnál). */
  rescheduleMs: number | null;
  /** Ember-olvasható indoklás — ⛔ a döntés soha nem néma. */
  detail: string;
}

export interface SupervisorInput {
  stopping: boolean;
  /** A nyilvántartott gyermek folyamat-azonosítója, vagy `null`, ha nincs. */
  childPid: number | null;
  /** ÉL-e ténylegesen az a folyamat. ⚠️ Ez a `childPid` létezésétől FÜGGETLEN tény. */
  childAlive: boolean;
  prerequisitesOk: boolean;
  runningElsewhere: boolean;
}

/** Milyen sűrűn nézünk vissza egy élő gyermekre. */
export const CHILD_WATCH_MS: number = 60_000;

/** Milyen sűrűn nézünk vissza, ha máshol fut egy példány. */
export const FOREIGN_RECHECK_MS: number = 60_000;

/** Hiányzó előfeltételnél ritkábban — ez konfigurációs hiány, nem átmeneti zavar. */
export const BLOCKED_RECHECK_MS: number = 5 * 60_000;

/**
 * A felügyelő következő lépése.
 *
 * ⭐ **A LEGFONTOSABB GARANCIA:** a `skip-stopping` KIVÉTELÉVEL **minden** ág ad
 * `rescheduleMs`-t. A felügyelő nem hagyhatja abba a felügyeletet — ha abbahagyja, a
 * felügyelt folyamat halála **csendes és tartós** lesz. Pontosan ez történt 11:30-kor.
 */
export function decideSupervisorAction(input: SupervisorInput): SupervisorDecision {
  if (input.stopping) {
    return {
      action: 'skip-stopping',
      rescheduleMs: null,
      detail: 'A szerver leáll — nem indítunk újat.',
    };
  }

  // 🔴 ÖNJAVÍTÁS: a nyilvántartott gyermek halott. Ha csak a `child !== null`-t néznénk, a
  // felügyelő örökre azt hinné, hogy minden rendben.
  if (input.childPid !== null && !input.childAlive) {
    return {
      action: 'reclaim-dead-child',
      rescheduleMs: 0,
      detail: `A nyilvántartott gyermek (pid ${input.childPid}) HALOTT, de a kilépés-esemény `
        + 'elmaradt — elengedem és azonnal újraindítom.',
    };
  }

  if (input.childPid !== null) {
    return {
      action: 'watch-child',
      rescheduleMs: CHILD_WATCH_MS,
      detail: `Él a gyermek (pid ${input.childPid}) — visszanézek később.`,
    };
  }

  if (!input.prerequisitesOk) {
    return {
      action: 'blocked-prerequisites',
      rescheduleMs: BLOCKED_RECHECK_MS,
      detail: 'Hiányzik valami a futtatáshoz — ritkábban próbálkozom.',
    };
  }

  if (input.runningElsewhere) {
    return {
      action: 'defer-foreign',
      rescheduleMs: FOREIGN_RECHECK_MS,
      detail: 'Máshol már fut egy példány — nem indítok másodikat, csak visszanézek.',
    };
  }

  return { action: 'start', rescheduleMs: null, detail: 'Nem fut senki — indítom.' };
}

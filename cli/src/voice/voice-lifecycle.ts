// 🚪 MIKOR KELL KILÉPNI A HANG-CSATORNÁBÓL. **Tiszta döntés, mellékhatás nélkül.**
//
// > **Owner, 2026-09-10 18:28:** *„amikor leáll a szerver, illetve újraindul, olyankor **ki
// > kéne lépjél a csatornáról**, hogy **ne higgyem azt, hogy itt vagy**, miközben éppen
// > újraindul a szerver és nem vagy itt."*
//
// ⭐ ÉS AZ ŐT SZAVAIVAL, hogy miért fájó: *„azt hiszem, hogy itt vagy, és figyelsz, miközben
// nem is."* — a bent-ülés **ígéret**. Ha nem tartjuk, az rosszabb, mint ha eleve nem lennénk ott.
//
// ## 🔴 A MÉRT GYÖKÉR-OK (2026-09-10)
//
// A figyelő **csak `SIGINT`-et** kezelt (`comm.command.ts`: `process.once('SIGINT', …)`).
// A szerver felügyelője viszont `child.kill()`-t hív, aminek a Node-ban az alapértelmezett
// jele a **`SIGTERM`** ⇒ a `listener.stop()` **soha nem futott le**, a hang-kapcsolat nem
// bomlott le tisztán, és a Discord még percekig bent lévőnek mutatta a botot.
//
// ⚠️ **ÉS WINDOWSON MÉG A `SIGTERM` SEM ELÉG.** A Node a `child.kill()`-t Windowson
// `TerminateProcess`-re képezi, ami ⛔ **nem elkapható** — a gyermeknek nincs alkalma
// takarítani. Ezért a jel-kezelő **egymagában sosem lenne megbízható megoldás**.
//
// ## ⭐ EZÉRT HÁROM, EGYMÁST KIEGÉSZÍTŐ HORGONY
//
// | horgony | mit fog el | miért kell |
// |---|---|---|
// | `signal` | `SIGINT` / `SIGTERM` | a rendes, POSIX-os leállás |
// | `parent-gone` | a szülő `stdin`-je bezárult | ⭐ **Windowson ez az EGYETLEN, ami működik** — és akkor is, ha a szerver ÖSSZEOMLIK |
// | `service-unreachable` | a szolgáltatás nem válaszol | a mai eset: **kézzel indított** figyelő ült bent, miközben a szerver nem futott |
//
// ⛔ A `parent-gone` **nem** a szülő PID-jének figyelése: azt csak időzítővel lehetne, ami
// szemétnek is lassabb. A csővezeték záródása **azonnali és esemény-vezérelt**.

/** Ami a hang-jelenlét megszűnését kiváltja. */
export type VoiceLifecycleEvent =
  /** `SIGINT` vagy `SIGTERM`. */
  | 'signal'
  /** A felügyelő szülő-folyamat eltűnt *(a `stdin` bezárult)*. */
  | 'parent-gone'
  /** A szolgáltatás nem érhető el — a bent-ülés hamis ígéret lenne. */
  | 'service-unreachable'
  /** Kifejezett, kódból kért leállás. */
  | 'explicit-stop';

/** Amit tenni kell. */
export interface VoiceLifecycleAction {
  /** Ki kell-e lépni a hang-csatornából. */
  leave: boolean;
  /** Le kell-e állítani a folyamatot is. */
  exitProcess: boolean;
  /**
   * MIÉRT — ez kerül a napló-sorba és a kilépés-eseménybe.
   *
   * ⭐ Az owner ma reggel 24 belépést és **nulla kilépést** látott a naplóban. Az ok nélküli
   * kilépés majdnem annyira használhatatlan, mint a hiányzó: nem derül ki belőle, hogy
   * *rendes leállás* volt-e, vagy *elveszett a szerver*.
   */
  reason: string;
}

/**
 * Ennyit várunk a kilépés után, mielőtt a folyamat leáll.
 *
 * 🔴 MIÉRT KELL EGYÁLTALÁN VÁRNI: a `connection.destroy()` egy **hálózati** üzenetet küld a
 * Discord gateway-nek. Ha a folyamat azonnal meghal, az üzenet **nem megy ki**, és a bot
 * a Discord szerint **bent marad** — pontosan az a hamis jelenlét, amit meg akarunk szüntetni.
 *
 * ⚠️ Rövid, mert a szülő is vár ránk: egy hosszú várakozás a szerver újraindítását késleltetné.
 */
export const VOICE_LEAVE_GRACE_MS: number = 700;

/**
 * Mit tegyünk egy életciklus-esemény hatására. **Tiszta függvény.**
 *
 * @param event a bekövetkezett esemény.
 * @returns a teendő + a naplózandó ok.
 */
export function decideVoiceLifecycleAction(event: VoiceLifecycleEvent): VoiceLifecycleAction {
  switch (event) {
    case 'signal':
      return {
        leave: true,
        exitProcess: true,
        reason: 'rendes leállítás (jel) — kilépés a hang-csatornából',
      };

    case 'parent-gone':
      // ⚠️ A folyamat MAGA is leáll: felügyelő nélkül árva lenne, és pont az árva figyelő
      // ült ma bent a csatornában, miközben a szerver nem futott.
      return {
        leave: true,
        exitProcess: true,
        reason: 'a felügyelő szerver eltűnt — kilépés, hogy ne mutassunk hamis jelenlétet',
      };

    case 'service-unreachable':
      // ⛔ ITT NEM ÁLLUNK LE: a szolgáltatás lehet, hogy csak ÚJRAINDUL. A csatornából
      // kilépünk (nem hazudunk jelenlétet), de a figyelő él, és újra beléphet, ha a
      // szolgáltatás visszajön. ⭐ Ez a „bent-ülés a SZOLGÁLTATÁST jelezze" elv lényege.
      return {
        leave: true,
        exitProcess: false,
        reason: 'a szolgáltatás nem érhető el — kilépés, amíg vissza nem jön',
      };

    case 'explicit-stop':
      return {
        leave: true,
        exitProcess: false,
        reason: 'kifejezett leállítás',
      };

    default:
      // ⛔ Ismeretlen esemény: az ÓVATOS irány a kilépés. Bent maradni azt jelentené, hogy
      // egy általunk nem értett állapotban is jelenlétet ígérünk.
      return {
        leave: true,
        exitProcess: false,
        reason: `ismeretlen életciklus-esemény (${String(event)}) — óvatosságból kilépünk`,
      };
  }
}

/**
 * FELÜGYELT-E A FIGYELŐ, azaz a szolgáltatás része-e. **Tiszta függvény.**
 *
 * > **Handoff-feltétel (2026-09-10):** *„…és belépés csak akkor, ha a lánc tényleg kiszolgál."*
 *
 * ## ⭐ HOGYAN LEHET EZT TUDNI — mérés, nem feltevés
 *
 * A szerver a figyelőt `stdio: ['pipe', …]`-pal indítja ⇒ a gyermek `stdin`-je **cső**.
 * Kézzel, terminálból indítva viszont **tty**. A kettő megkülönböztethető, és pontosan azt
 * a különbséget adja, ami kell: *„a szolgáltatás indított-e engem?"*
 *
 * 🔴 MIÉRT FONTOS: 2026-09-10-én egy **kézzel indított** figyelő ült a hang-csatornában,
 * miközben a szerver nem futott. Az owner ebből azt olvasta, hogy jelen vagyok és figyelek.
 * A bent-ülés a **szolgáltatást** hivatott jelezni, nem egy véletlen folyamatot.
 *
 * ⚠️ NEM tiltja a kézi indítást: a szöveges figyelés attól működik. Csak a hang-jelenlétet
 * tartja vissza — mert az ÍGÉRET, a szöveg-olvasás pedig nem.
 *
 * @param stdinIsTty a `process.stdin.isTTY` értéke.
 * @param allowUnsupervised az `MA_VOICE_ALLOW_UNSUPERVISED` kapcsoló — tudatos felülbírálás
 *        *(élő próbához kell, különben a 3. pont igazolása lehetetlen lenne)*.
 */
export function decideVoiceJoinPermission(
  stdinIsTty: boolean,
  allowUnsupervised: boolean,
): { allowed: boolean; reason: string } {
  if (!stdinIsTty) {
    return { allowed: true, reason: 'a szolgáltatás felügyeli ezt a figyelőt' };
  }

  if (allowUnsupervised) {
    return {
      allowed: true,
      reason: 'kézi indítás, de kifejezetten engedélyezve (MA_VOICE_ALLOW_UNSUPERVISED)',
    };
  }

  return {
    allowed: false,
    reason: 'KÉZI indítás felügyelet nélkül — nem lépek be, hogy ne mutassak hamis jelenlétet '
      + '(felülbírálás: MA_VOICE_ALLOW_UNSUPERVISED=1)',
  };
}

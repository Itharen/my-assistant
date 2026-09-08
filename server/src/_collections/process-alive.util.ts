// ÉL-E EGY FOLYAMAT — egyetlen, HELYES válasz az egész szerverben.
//
// 🔴 MIÉRT KÜLÖN FÁJL: ez a néhány sor **két helyen** létezett szó szerint
// (`supervised-child.isPidAlive`, `discord-listener.isProcessAlive`), és **mindkettőben
// ugyanaz a hiba** volt benne.
//
// ## A hiba, amit a másolás megkétszerezett
//
// A `process.kill(pid, 0)` nem küld jelet, csak létezést kérdez — de **kétféleképpen** dobhat:
//
// | hibakód | mit jelent | a helyes válasz |
// |---|---|---|
// | `ESRCH` | nincs ilyen folyamat | **nem él** |
// | `EPERM` | VAN ilyen folyamat, csak nincs jogunk jelet küldeni neki | ⭐ **ÉL** |
//
// A korábbi `catch { return false; }` az `EPERM`-et is „halottnak" jelentette. ⚠️ Ez nem
// elméleti: egy másik felhasználó (vagy emelt jogú) alatt futó folyamatot a felügyelő
// halottnak látott volna — és **elindított volna mellé egy másodikat**. Pontosan az az
// ikerfolyamat-helyzet, amit a felügyelőnek meg kellene akadályoznia.

import { SwallowedFailure_Util } from './swallowed-failure.util.js';

/** Folyamat-életjel vizsgálat — statikus util. */
export class ProcessAlive_Util {

  /**
   * Fut-e még az adott azonosítójú folyamat?
   *
   * @param pid a vizsgált folyamat azonosítója.
   * @returns `true`, ha a folyamat létezik *(akkor is, ha nem küldhetünk neki jelet)*.
   *
   * ⚠️ Ismeretlen hibánál `false` a válasz — de ⛔ **nem némán**: az ismeretlen eset naplózódik,
   * mert a „nem tudom" és a „biztosan halott" nem ugyanaz.
   */
  static isAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);

      return true;
    } catch (err) {
      const code: string | null = SwallowedFailure_Util.readErrorCode(err);

      if (code === 'ESRCH') {
        return false;
      }

      // ⭐ A LÉNYEG: az `EPERM` azt jelenti, hogy a folyamat LÉTEZIK — a jel küldése bukott el,
      // nem a létezés-vizsgálat.
      if (code === 'EPERM') {
        return true;
      }
      SwallowedFailure_Util.report('process-alive', err);

      return false;
    }
  }
}

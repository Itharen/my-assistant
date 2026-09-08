// 🔁 ÚJRA-BELÉPÉS KIESÉS UTÁN — a hiányzó fél a kapcsolat-kezelésben.
//
// 🔴 MÉRT HIÁNY (2026-09-08 10:57:54, éles): a bot kiesett a hang-csatornából —
//
// ```
// MA-VOICE-DROPPED · „honnie-place" · 5 mp után bontva
//   ok: a türelmi időn belül nem jött vissza (The operation was aborted)
// ```
//
// …és **soha nem lépett vissza**. Az utolsó belépés **10:49:18** volt, a kiesés **10:57:54** —
// a csatorna azóta **üres**. ⇒ Az owner beszélhetett volna, és semmi nem történik.
//
// ⚠️ **A napló ezt már elkapta** *(ez a reggel megépített kapcsolat-napló érdeme)*, de a
// **cselekvés hiányzott**: tudtuk, hogy kiestünk, és nem csináltunk vele semmit.
//
// ## ⛔ MIÉRT NEM VÉGTELEN AZ ÚJRAPRÓBÁLÁS
//
// Ha a belépés azért bukik, mert **elveszett a jogosultság** vagy **törölték a csatornát**, a
// végtelen próbálkozás **nem gyógyít**, csak zajt termel és a Discord felé is rate-limitet hív.
// Ezért **véges, növekvő szünetű** sorozat, és a végén **kimondjuk, hogy feladtuk** — hogy az
// owner tudja: innen **emberi beavatkozás** kell.

/** A szünetek két próbálkozás között. A hossz egyben a próbálkozások SZÁMA is. */
export const REJOIN_DELAYS_MS: number[] = [5_000, 15_000, 60_000, 300_000];

/** Egy újra-belépési döntés. */
export interface RejoinPlan {
  /** Próbálkozzunk-e még. */
  shouldRetry: boolean;
  /** Mennyi idő múlva. `0`, ha nincs több próbálkozás. */
  delayMs: number;
  /** Ember-olvasható indoklás — ⛔ a döntés soha nem néma. */
  detail: string;
}

/**
 * Mi legyen a következő lépés a `attempt`-edik kiesés után.
 *
 * @param attempt Hányadik EDDIGI sikertelen próbálkozás után döntünk (0 = most estünk ki
 *                először, még nem próbáltunk vissza).
 */
export function planVoiceRejoin(attempt: number): RejoinPlan {
  // ⚠️ A negatív/tört bemenet nem dönthet „végtelen próbálkozás" felé — lefelé kerekítünk,
  // és nullánál nem megyünk lejjebb.
  const safe: number = Math.max(0, Math.floor(attempt));
  const delay: number | undefined = REJOIN_DELAYS_MS[safe];

  if (delay === undefined) {
    return {
      shouldRetry: false,
      delayMs: 0,
      detail: `⛔ FELADOM az újra-belépést ${REJOIN_DELAYS_MS.length} sikertelen próbálkozás után. `
        + 'A hang-csatorna innentől ÜRES marad — ez már emberi beavatkozást kíván '
        + '(jogosultság, törölt csatorna vagy rossz azonosító).',
    };
  }

  return {
    shouldRetry: true,
    delayMs: delay,
    detail: `Újra-belépés ${Math.round(delay / 1000)} mp múlva `
      + `(${safe + 1}. próbálkozás a ${REJOIN_DELAYS_MS.length}-ból).`,
  };
}

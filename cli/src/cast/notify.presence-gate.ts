// 🔴 HANGSZÓRÓS KAPU — ez dönti el, megszólalhat-e a bemondás.
//
// Owner-szabály (2026-09-06, szó szerint):
//   „ez a Google Home-on keresztüli kommunikáció, ez a legerősebb, amivel fel tudod kelteni
//    a figyelmemet. Ezt is szeretném, hogy erőszeretettel használd, de fontos szabály, hogy
//    ezt csak akkor használhatod, hogyha ébren vagyok. És itthon vagyok."
//
//   „Az arról, hogy itthon vagyok-e, egyelőre elég lesz az, hogy használom a gépemet."
//   „Az, hogy ébren vagyok-e, az abból jöhet, hogy itthon vagyok jelet kapsz, tehát a
//    számítógépnél vagyok, akkor ébren vagyok, illetve, hogy ha discordon válaszolok,
//    akkor is ébren vagyok, legalább egy órát még."
//
// 🔴 ISMERETLEN ⇒ TILT. Ha a jel hiányzik, NEM szólal meg. Az „ismeretlen" nem
// „valószínűleg igen" — ez a kapu létezésének értelme.
//
// ⚠️ A kapu az AUTOMATA használatot szabályozza. Az owner által KÉZZEL kért bemondás
// átengedhető (`allowManualOverride`), de az mindig NAPLÓZOTT és explicit.

import type { PresenceSnapshot } from '../presence/presence.reader.js';

/** Discord-válasz után ennyi ideig számít ébrenlétnek (owner: „legalább egy órát még"). */
export const DISCORD_AWAKE_WINDOW_MS: number = 60 * 60_000;

export interface PresenceGateInput {
  presence: PresenceSnapshot;
  /** Az owner legutóbbi Discord-üzenetének ideje, ha van. */
  lastDiscordReplyAt?: Date;
  now: Date;
}

export interface PresenceGateDecision {
  /** Megszólalhat-e a hangszóró. */
  allowed: boolean;
  /** Miért — ember-olvasható, naplóba és diagnosztikába megy. */
  reason: string;
  /** A két jel külön is látszik, hogy hibakeresésnél ne kelljen találgatni. */
  signals: {
    isHome: PresenceSnapshot['isHome'];
    isAwake: 'yes' | 'unknown';
    awakeSource: 'presence' | 'discord-reply' | 'none';
  };
}

/**
 * A kapu kiértékelése. Tiszta függvény — egységteszttel ellenőrizhető, futó gép nélkül.
 *
 * A logika sorrendje szándékos:
 *   1. ITTHON van (a gépénél) → ébren is van → ENGEDÉLY
 *   2. Nincs a gépénél, de nemrég válaszolt Discordon → ÉBREN igen, de ITTHON nem → TILT
 *      (az owner mindkettőt kérte; a Discord-válasz csak az ébrenlétet igazolja, a jelenlétet nem)
 *   3. Minden más → TILT
 */
export function evaluatePresenceGate(input: PresenceGateInput): PresenceGateDecision {
  const discordAgeMs: number | null = input.lastDiscordReplyAt
    ? input.now.getTime() - input.lastDiscordReplyAt.getTime()
    : null;
  const isDiscordAwake: boolean = discordAgeMs !== null
    && discordAgeMs >= 0
    && discordAgeMs <= DISCORD_AWAKE_WINDOW_MS;

  if (input.presence.isHome === 'yes') {
    return {
      allowed: true,
      reason: `ITTHON és ÉBREN: ${input.presence.reason}`,
      signals: { isHome: 'yes', isAwake: 'yes', awakeSource: 'presence' },
    };
  }

  if (isDiscordAwake) {
    const minutes: number = Math.round((discordAgeMs ?? 0) / 60_000);

    return {
      allowed: false,
      reason: `ÉBREN igen (${minutes} perce válaszolt Discordon), de NEM a gépénél `
        + `(${input.presence.reason}). A hangszóróhoz MINDKETTŐ kell — most Discordon szólj.`,
      signals: { isHome: input.presence.isHome, isAwake: 'yes', awakeSource: 'discord-reply' },
    };
  }

  return {
    allowed: false,
    reason: input.presence.isHome === 'unknown'
      ? `TILTVA — nem tudjuk, itthon van-e: ${input.presence.reason} `
        + 'Az „ismeretlen" nem „valószínűleg igen".'
      : `TILTVA — nincs a gépénél és nem válaszolt Discordon az elmúlt órában. ${input.presence.reason}`,
    signals: { isHome: input.presence.isHome, isAwake: 'unknown', awakeSource: 'none' },
  };
}

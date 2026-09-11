// A hangszórós kapu futtatása valós adatokkal — összeszedi a jeleket és kiértékel.
//
// Ez a réteg köti össze a tiszta döntés-logikát (`evaluatePresenceGate`) a lemezen lévő
// mérésekkel. Külön van, hogy a döntés maga futó gép nélkül is tesztelhető maradjon.
//
// ⭐ **A JELEK ÖSSZESZEDÉSE ÁTKÖLTÖZÖTT** *(2026-09-12)*: a jelenlét-olvasás és az utolsó
// Discord-válasz megkeresése a `presence.awake-runner`-ben lakik, mert azt **a szerver
// `/api/sleep-state` is használja**. ⛔ Két példányban a rendszer két különböző igazságot
// mondhatna ugyanarról az emberről — pontosan ez volt a mért hiba.
//
// 🔴 A kapu SOHA nem dobhat hibát: a runner `unknown`-t ad olvasási hibánál ⇒ TILT.

import { runAwakeDecision } from '../presence/presence.awake-runner.js';
import { evaluatePresenceGate, type PresenceGateDecision } from './notify.presence-gate.js';

/**
 * Kiértékeli a kaput a jelenlegi, mért állapot alapján.
 *
 * ⚠️ A kapu az ébrenlétnél **szigorúbb**: az owner **ITTHON**-t is kért, ezért a döntést a
 * `evaluatePresenceGate` mondja ki — az ébrenlét csak az egyik fele.
 */
export async function runPresenceGate(now: Date = new Date()): Promise<PresenceGateDecision> {
  const reading = await runAwakeDecision(now);

  return evaluatePresenceGate({
    presence: reading.presence,
    // ⭐ A NYERS időpont megy tovább, ⛔ nem a percre kerekített életkor: a kapu a türelmi
    // ablak határán így PONTOSAN ugyanazt látja, mint az ébrenlét-döntés.
    ...(reading.lastDiscordReplyAt ? { lastDiscordReplyAt: reading.lastDiscordReplyAt } : {}),
    now: now,
  });
}

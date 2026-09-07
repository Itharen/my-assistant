// TÜKÖR-ÜZENET — „ezt értettem, jól hallottam?"
//
// > **Owner-kérés (2026-09-07):** *„egy voice üzenetet … feldolgozzuk az STT-vel és ilyenkor
// > egyrészt egy mirror üzenetet is kéne küldjél, hogy lássam, hogy jól olvastad fel"*
//
// 🔴 A TÜKÖR NEM EXTRA, HANEM A KÉPESSÉG RÉSZE. Egy félrehallott hangüzenetre adott
// magabiztos válasz **rosszabb, mint a semmi** — a tükör az egyetlen pont, ahol az owner
// **még a cselekvés előtt** el tudja kapni a félreértést.
//
// (Ugyanaz az elv, mint a küldés utáni visszaolvasásnál: ahol az adat ÉRTELMEZÉSEN megy át,
// ott vissza kell igazolni.)

import type { SttResult } from './stt.models.js';

/**
 * A tükör-üzenet szövege.
 *
 * Tiszta függvény — hálózat és Discord nélkül tesztelhető.
 */
export function composeMirrorMessage(result: SttResult, meta?: { durationHint?: string }): string {
  const lines: string[] = [];

  if (!result.ok) {
    lines.push('🎙️ **Hangüzenet — a felismerés NEM sikerült.**');
    lines.push('');
    lines.push(result.detail);

    if (result.remedy) lines.push(`→ ${result.remedy}`);

    lines.push('');
    lines.push('📌 **Nem tippelek arra, mit mondtál** — írd le, vagy küldd újra.');

    return lines.join('\n');
  }

  if (result.suspicious) {
    lines.push('🎙️ **Hangüzenet — ⚠️ BIZONYTALAN felismerés.**');
    lines.push('');
    lines.push(result.text ? `> ${result.text}` : '> *(üres)*');
    lines.push('');
    lines.push(`⚠️ ${result.suspicionReason ?? 'Az átirat gyanús.'}`);
    lines.push('');
    lines.push('📌 **NEM cselekszem rá.** Ha ez tényleg ezt jelentette, erősítsd meg — '
      + 'ha nem, küldd újra vagy írd le.');

    return lines.join('\n');
  }

  lines.push('🎙️ **Hangüzenet — ezt értettem:**');
  lines.push('');
  lines.push(`> ${result.text}`);
  lines.push('');
  lines.push(`✅ Felismerve ${formatSeconds(result.elapsedMs)}${meta?.durationHint ?? ''}. `
    + '**Ha félreértettem, szólj** — most válaszolok rá.');

  return lines.join('\n');
}

/** Másodperc egy tizedesre — a felhasználónak ennyi elég. */
function formatSeconds(ms: number): string {
  return `${Math.round(ms / 100) / 10} mp alatt`;
}

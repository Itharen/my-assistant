// ÁTIRAT-ŐR — megbízható-e, amit a felismerés visszaadott?
//
// 🔴 MÉRT OK (2026-09-07 08:05): az első élő próbán egy csendes/zajos hangmintára a
// szolgáltatás ezt adta vissza:
//
//     "Продолжение следует..."      (oroszul: „folytatása következik")
//
// Ez a Whisper-családú modellek **közismert hallucinációja**: csendre vagy zajra a
// tanítóanyagból vett gyakori feliratot köp ki. A válasz `status: processed` volt, tehát a
// szolgáltatás szempontjából **minden rendben** — a hiba a mi oldalunkon látszik csak.
//
// ⚠️ MIÉRT VESZÉLYES: az owner **hangüzenetére adott válasz** épülne rá. Egy félrehallott
// üzenetre adott magabiztos válasz **rosszabb, mint a semmi** — ezért ez a szűrő nem
// kényelmi extra, hanem a képesség része.

/** Ismert hallucináció-minták. Kisbetűsítve, ékezet-érzékenyen hasonlítunk. */
const KNOWN_HALLUCINATIONS: string[] = [
  'продолжение следует',
  'субтитры сделал',
  'субтитры создавал',
  'редактор субтитров',
  'thanks for watching',
  'thank you for watching',
  'subscribe to my channel',
  'feliratozta',
  '[zene]',
  '[music]',
  'amara.org',
];

/**
 * Ennél rövidebb átiratot önmagában nem tekintünk megbízhatónak.
 *
 * ⚠️ ASSZISZTENS-VÁLASZTÁS, nem owner-adat: egy „igen" vagy „ok" értelmes válasz lehet,
 * ezért NEM dobjuk el — csak **megjelöljük**, és a tükör-üzenetben rákérdezünk.
 */
export const SHORT_TRANSCRIPT_CHARS: number = 3;

export interface GuardVerdict {
  suspicious: boolean;
  reason?: string;
}

/**
 * Megbízhatónak látszik-e az átirat?
 *
 * ⛔ SOHA nem dob el szöveget — csak **megjelöl**. A döntés a felhasználóé; a mi dolgunk,
 * hogy a bizonytalanság **látható** legyen.
 */
export function inspectTranscript(text: string): GuardVerdict {
  const trimmed: string = text.trim();

  if (!trimmed) {
    return {
      suspicious: true,
      reason: 'A felismerés ÜRES szöveget adott — valószínűleg nem volt benne beszéd.',
    };
  }

  const lowered: string = trimmed.toLowerCase();
  const hit: string | undefined = KNOWN_HALLUCINATIONS.find((pattern) => lowered.includes(pattern));

  if (hit) {
    return {
      suspicious: true,
      reason: `Ismert modell-hallucináció mintája ("${hit}") — csendre/zajra adott szemét-kimenet, `
        + 'nem valódi beszéd.',
    };
  }

  if (trimmed.length < SHORT_TRANSCRIPT_CHARS) {
    return {
      suspicious: true,
      reason: `Nagyon rövid átirat (${trimmed.length} karakter) — lehet, hogy csak zaj volt.`,
    };
  }

  return { suspicious: false };
}

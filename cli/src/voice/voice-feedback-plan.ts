// 🗺️ A VISSZAJELZÉS-TÁBLA — mit hall és mit lát az owner egy adott kimenetelnél.
//
// ⭐ MIÉRT KÜLÖN, TESZTELT MODUL, és nem a figyelő belsejében inline:
//
// Ez a döntési tábla **kicsi, de sűrű**, és a hibái **némák** — egy rossz ág nem borul fel,
// csak épp nem szól, vagy rosszat mond. A figyelő callbackjeiben viszont **nem tesztelhető**:
// élő Discord-kapcsolat kellene hozzá.
//
// 🔴 **ÉS ITT MÁR KÉT VALÓS HIBA VOLT** *(2026-09-07, mindkettő olvasással találva, nem
// teszttel — ezért kell teszt)*:
//
//   1. a **duplikátum** „veszteségnek" látszott — pedig a híd csak azért nem tette be, mert
//      MÁR feldolgoztuk *(→ `classifyRecordingOutcome`)*;
//   2. a **„hallak" jelzés féke elnyelte** az „eldobva" jelzést, mert egy közös féken osztoztak
//      *(→ két sáv a `voice-cues.ts`-ben)*.
//
// ⇒ Amit kétszer elrontottam, azt nem hagyom lefedetlenül (`core-e2e-automata` szellemében:
// a megépített funkcionalitáshoz teszt tartozik).
//
// ⛔ EZ A MODUL NEM CSINÁL SEMMIT — csak **eldönti, mi történjen**. A lejátszás és a küldés a
// hívóé. Így a döntés önmagában, mellékhatás nélkül vizsgálható.

import type { RecordingHandled } from './voice-recording-outcome.js';
import type { VoiceCue } from './voice-cues.js';
import type { MissedSpeech } from './voice-missed-speech.js';
import type { VoiceDropObservation } from './voice-drop-probe.js';

/** Mi történjen egy eseménynél. `null` = ne szóljon / ne jelentsen. */
export interface VoiceFeedbackPlan {
  /** 🔊 Melyik hangjelzés szóljon — vagy `null`, ha egyik sem. */
  cue: VoiceCue | null;
  /** 🔇 Kerüljön-e a kiesés-összefoglalóba — és milyen okkal. */
  missed: MissedSpeech | null;
}

/**
 * A feldolgozott felvétel kimenetele → visszajelzés.
 *
 * | Kimenetel | 🔊 hang | 🔇 jelentés | Miért |
 * |---|---|---|---|
 * | bekerült a kötegbe | `understood` | — | siker: az owner folytathatja |
 * | gyanús átirat | `unsure` | `not-understood` | **hallottam**, csak nem bízom benne |
 * | a felismerés bukott | `error` | `recognition-failed` | technikai hiba, nem az owner hibája |
 * | duplikátum / idegen beszélő | — | — | ⛔ **se nem siker, se nem veszteség** |
 *
 * 🔴 AZ UTOLSÓ SOR A LÉNYEG: a duplikátumnál **csend** a helyes válasz. Ha szólnánk, az owner
 * azt hinné, hogy elveszett valami — pedig épp az ellenkezője történt: már megkaptuk.
 */
export function planFeedbackForOutcome(outcome: RecordingHandled): VoiceFeedbackPlan {
  if (outcome.queued) return { cue: 'understood', missed: null };

  // 🎤 BULI-ZAJ ⇒ TELJES CSEND: ⛔ se hang, ⛔ se jelentés.
  //
  // 🔴 EZ A LEGFONTOSABB ÁG EBBEN A FÜGGVÉNYBEN, és MÉRT (2026-09-12): a nyitott mikrofon
  // **243** ilyen tételt termelt EGY este alatt. Ha mindegyik `not-understood`-ként jelentődne,
  // az owner **243 kiesés-jelentést** kapna a hang-csatornába — ⚠️ vagyis a zaj-szűrő maga
  // lenne a legnagyobb zajforrás.
  //
  // ⚠️ ÉS A HANG SEM SZÓLHAT: az `unsure` jelzés minden zaj-tételnél megszólalna — éjjel,
  // vendégek mellett. ⛔ A szűrt zaj a mérésben látszik (saját napló-kód), ⛔ nem a szobában.
  if (outcome.isNoise) return { cue: null, missed: null };

  if (outcome.missed === 'not-understood') {
    return {
      cue: 'unsure',
      missed: {
        kind: 'not-understood',
        // ⭐ AMIT ÉRTETTÜNK, ÁTMEGY A JELENTÉSBE (owner, 2026-09-11 01:29). ⛔ Ez NEM a
        // hallucináció-őr lazítása: gyanús átiratra továbbra sem cselekszünk — csak
        // megmondjuk, mit hallottunk, hogy **ő** dönthessen.
        ...(outcome.heard?.trim() ? { heard: outcome.heard.trim() } : {}),
        ...(outcome.reason?.trim() ? { reason: outcome.reason.trim() } : {}),
      },
    };
  }

  if (outcome.missed === 'recognition-failed') {
    return { cue: 'error', missed: { kind: 'recognition-failed' } };
  }

  // ⚪ Duplikátum vagy idegen beszélő — nem az owner elveszett mondata.
  return { cue: null, missed: null };
}

/**
 * A némán eldobott felvétel → visszajelzés.
 *
 * ⛔ **AZ ÜRES FÁJLRÓL NEM SZÓLUNK.** Ott a fejlécen túl nem volt semmi, tehát **tényleg nem
 * volt mit felismerni** — a „nem jutott át" üzenet ilyenkor **zaj** lenne, és pont a
 * láthatóságot rontaná, amiért az egész készült.
 *
 * ⭐ A `discarded-by-recorder` viszont **a valódi veszteség**: volt hang, és a felvevő
 * beszéd-validációja dobta ki. Ilyenkor szól ÉS jelentünk — a másodperc-adattal együtt.
 */
export function planFeedbackForDrop(observation: VoiceDropObservation): VoiceFeedbackPlan {
  if (observation.reason === 'empty-file') return { cue: null, missed: null };

  return {
    cue: 'dropped',
    missed: { kind: 'discarded-by-recorder', seconds: observation.lostAudioSeconds },
  };
}

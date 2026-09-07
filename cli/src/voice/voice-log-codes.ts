// 🔗 A HANG-LÁNC NAPLÓ-SZÓKINCSE — EGY helyen, mert két oldal használja.
//
// 🔴 A MÉRT KOCKÁZAT, amiért ez a fájl létezik *(2026-09-08, a journey írása közben találva)*:
// a kódokat **az író** (`discord.listener.ts`) és **az olvasó** (`voice-funnel-report.ts`)
// eddig **külön-külön, sztring-literálként** tartalmazta. Egy átnevezés az egyik oldalon
// **némán** elrontotta volna a másikat:
//
//   ⚠️ a tölcsér nem hibázna — egyszerűen **NULLÁT jelentene**, és úgy nézne ki, mintha nem
//   veszett volna el semmi. ⇒ Pontosan az a hibaosztály, ami ellen az egész mérés készült:
//   **a néma, jóindulatúnak látszó adatvesztés.**
//
// ⭐ Ezért a szókincs **egyetlen** forrásból jön, és a journey **oda-vissza** végigviszi:
// az író által kiadott kódot az olvasó ténylegesen fel is dolgozza (`voice.journey-e2e.spec.ts`).

/** Amit a hang-lánc a napi akció-naplóba ír — és amit a tölcsér-jelentés visszaolvas. */
export const VOICE_LOG_CODES = {
  /** 🎙️ Megszólalás érzékelve (kumulatív számlálóval). */
  speechDetected: 'MA-VOICE-SPEECH-DETECTED',
  /** ✅ Bekerült a kötegbe. */
  queued: 'MA-VOICE-SPEECH-QUEUED',
  /** 🔴 Az owner beszélt, de nem lett belőle semmi. */
  dropped: 'MA-VOICE-SPEECH-DROPPED',
  /** ⚪ Duplikátum vagy idegen beszélő — se siker, se veszteség. */
  skipped: 'MA-VOICE-SPEECH-SKIPPED',
  /** 🎚️ A felvevő némán eldobta a kész felvételt. */
  droppedSilently: 'MA-VOICE-SPEECH-DROPPED-SILENTLY',
  /** ⚠️ A szonda saját hibája (pl. olvashatatlan könyvtár). */
  probeError: 'MA-VOICE-PROBE-ERROR',
  /** ⚠️ A kiesés-jelentés nem ment ki. */
  missedReportFailed: 'MA-VOICE-MISSED-REPORT-FAILED',
  /** ⚠️ Egy hangjelzés lejátszása elbukott. */
  cueFailed: 'MA-VOICE-CUE-FAILED',
} as const;

export type VoiceLogCode = typeof VOICE_LOG_CODES[keyof typeof VOICE_LOG_CODES];

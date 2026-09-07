// STT — a saját FDP AI beszédfelismerés adatszerkezetei.
//
// A szerződés MÉRVE (2026-09-07 08:05), az élő szolgáltatáson:
//
//   POST http://127.0.0.1:38321/api/recognition
//        ?confidence_threshold=0.55&skip_classification=1
//   Headers: Content-Type: audio/<típus>  ·  Filename: <fájlnév>
//   Body:    NYERS audio-bájtok  ⚠️ NEM multipart
//   Válasz:  { status, message, result: { text }, file_path,
//              audio_category, classification_result, classification_confidence }
//   Késleltetés: ~2,0 s (bemelegedett modellel)
//
// ⚠️ Az OpenAI-kompatibilis `/v1/audio/transcriptions` is létezik, de a fenti az, amit a
// működő CCAP-implementáció használ — ezért ezt vesszük át.

/** Ahogy az FDP AI válaszol. Minden mező opcionális: a szolgáltatás verziója változhat. */
export interface SttRawResponse {
  status?: string;
  message?: string;
  result?: { text?: string };
  /** Régebbi/alternatív alak — a CCAP-kód mindkettőt kezelte. */
  text?: string;
  confidence?: number;
  file_path?: string;
  audio_category?: string | null;
  classification_result?: unknown;
  classification_confidence?: number | null;
}

export interface SttResult {
  ok: boolean;
  /** A felismert szöveg (üres, ha nem volt beszéd). */
  text: string;
  /** Ember-olvasható állapot. */
  detail: string;
  /** MIT KELL TENNI, ha nem sikerült. */
  remedy?: string;
  /** Mennyi ideig tartott — a felhasználói visszajelzéshez. */
  elapsedMs: number;
  /**
   * ⚠️ Gyanús-e az átirat (üres vagy ismert modell-hallucináció).
   * Ilyenkor NEM cselekszünk rá, csak megmutatjuk.
   */
  suspicious: boolean;
  /** Miért gyanús. */
  suspicionReason?: string;
}

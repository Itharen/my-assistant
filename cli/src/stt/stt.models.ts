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
  /**
   * 🎤 BULI-ZAJ-e *(rövid + nem magyar)* — ⚠️ a `suspicious` egy RÉSZHALMAZA.
   *
   * ⭐ MIÉRT KÜLÖN: a *„nem értettem"* és a *„ez a környezet beszélt"* **más jelenség**, más
   * teendővel — és a nyitott mikrofonnál **kapacitás-probléma**. A hívó ezért ⛔ nem
   * jelent róla az ownernek, de a mérésben **külön sorban** látszik.
   */
  isNoise?: boolean;
  /**
   * 🧩 Darabolva ismertük fel? *(Csak akkor van itt érték, ha TÖBB részlet volt.)*
   *
   * ⚠️ A hiánya azt jelenti: **egy** hívás, ⛔ nem azt, hogy „biztosan teljes".
   */
  segmentation?: SttSegmentation;
}

/**
 * 🧩 A DARABOLÁS KIMONDOTT KÉPE — ha a hang nem fért a felismerő ablakába.
 *
 * > **A feladat kikötése (owner, 2026-09-11 15:54):** ha a teljes feldolgozás **technikai
 * > korlátba** ütközik, az **kimondva** jelenjen meg — ⛔ néma csonkolás nincs.
 *
 * ⚠️ MIÉRT KELL EZ A HÍVÓNAK, ÉS NEM CSAK A NAPLÓNAK: a darabolás **javít** a helyzeten, de
 * nem kockázat nélkül — a határon lévő szó elcsúszhat, és egy darab felismerése el is bukhat.
 * ⇒ Az owner **látja** a jelölésben, hogy hány részletből állt össze a szöveg.
 */
export interface SttSegmentation {
  /** Hány darabból állt össze az átirat. */
  parts: number;
  /** 🔴 Hány darab felismerése bukott el ⇒ ennyi helyen HIÁNYOS a szöveg. */
  failedParts: number;
  /** ⚠️ Hány vágás esett beszéd közben *(ott szó csúszhatott el)*. */
  midSpeechCuts: number;
  /** A felismerő MÉRT ablaka másodpercben — a jelölés ezzel magyarázza magát. */
  windowSecs: number;
}

// 🔬 A FELISMERŐ 30 MÁSODPERCES ABLAKA — és hogyan férünk bele.
//
// > **Owner, 2026-09-11 15:54 + 15:55 (élesben, KÉTSZER egymás után):** *„Úgy látom, hogy **még
// > mindig levágta az előző üzenetemnek a végét**… Át kéne adni a devnek, hogy a **hosszabb
// > hangüzeneteket is fel kell tudjuk dolgozni**."* · *„**Megint levágta a javításomat a
// > végéről**…"*
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 A MÉRÉS — ⛔ NEM hipotézis. Ugyanaz a megőrzött hangfájl, HÁROM független próba.
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
// **Alany:** a 01:01-es, **56,9 másodperces** felvétel az archívumból *(a megőrzés — 1. tétel —
// nélkül ez a mérés **lehetetlen** lett volna: a hang már nem létezne)*.
//
// **(1) FELEZÉS — a szöveg MEGDUPLÁZÓDIK ugyanabból a hangból:**
//
// ```
// teljes fájl (56,9 mp)     → 295 karakter      ⟵ itt ér véget: „…ezt megoldja,"
// első fél  (28,5 mp)       → 279 karakter
// második fél (28,5 mp)     → 348 karakter
//                             ─────────────
//                             627 karakter      ⟵ 2,1-szer ennyi szöveg
// ```
// ⇒ A második fél szövege **egyáltalán NEM szerepel** a teljes fájl átiratában.
//
// **(2) PREFIX-SOROZAT — a határ PONTOSAN 30,0 másodpercnél van:**
//
// ```
//  15 mp → 148 kar     28 mp → 280 kar     35 mp → 295 kar  ⟵ ugyanaz a vég
//  20 mp → 200 kar     30 mp → 295 kar     40 mp → 295 kar  ⟵ ugyanaz a vég
//  25 mp → 252 kar     32 mp → 295 kar     56 mp → 295 kar  ⟵ ugyanaz a vég
// ```
// ⇒ 30,0 mp-ig **monoton nő**, onnantól **teljesen befagy**. Ez a Whisper-családú modellek
// klasszikus **30 másodperces receptív ablaka**, hosszú-hang darabolás nélkül.
//
// **(3) KIZÁRÁS — ⛔ NEM a WAV-fejléc a hibás:** a felvevő fejléce hibás hosszt állít
// *(22 369,6 mp minden fájlon)*, de **javított** fejléccel a válasz **karakterre azonos**
// *(295 = 295)*. ⇒ A fejléc gyanú **kizárva**, ⛔ nem „valószínűleg nem az".
//
// ## ⭐ AMIT EZ A MÉRÉS KIZÁRT — és miért fontos KIMONDANI
//
// | Feltevés | Mérés |
// |---|---|
// | a szegmentálás zárja le korán *(`AfterSilence` 1000 ms)* | ⛔ **NEM** — a 34-57 mp-es felvételek **megvannak**, csak az átiratuk csonka |
// | a felvevő dobja el | ⛔ **NEM** — a fájlok teljes hosszban a lemezen vannak |
// | a felismerés UTÁNI út veszíti el | ⛔ **NEM** — a csonka szöveg **hiánytalanul** bekerült a kötegbe |
//
// 🔴 **EBBŐL KÖVETKEZIK: a 9. tételben leszögezett beszéd-észlelést NEM kell megváltoztatni.**
// ⇒ Nincs szükség owner-döntésre a szegmentálásról *(a handoff kikötése)*, mert a szegmentálás
// **nem a ludas** — és ezt **mérés** mondja ki, ⛔ nem feltevés.
//
// ## 🔴 ÉS AMI A LEGROSSZABB VOLT BENNE: A VESZTESÉG NÉMA
//
// A tölcsér-jelentés ezeket a megszólalásokat **✅ SIKERKÉNT** számolta — hiszen bekerültek a
// kötegbe. ⇒ A 78%-os átviteli arány **nem is látta** ezt a veszteséget. ⚠️ Mérve: a nap 84
// megőrzött felvétele közül **11 volt 28 mp-nél hosszabb** *(13%)*, és ezek a szövegük
// **40-50%-át** vesztették el — a statisztika szerint „hibátlanul".
//
// ⛔ **AZ FDP AI SZOLGÁLTATÁSHOZ NEM NYÚLUNK** *(`fdp-ai-never-restart`; a kód nem is a mi
// repónkban van)*. ⇒ A darabolás **a mi oldalunkon** történik, a szolgáltatás változatlan
// használatával.

/** Egy WAV-fájl mért felépítése. ⚠️ Szándékosan nem exportált. */
interface WavLayout {
  /** Ahol a PCM-adat kezdődik. */
  dataOffset: number;
  /** Egy másodperc hány bájt. */
  bytesPerSecond: number;
  /** Egy mintakeret hány bájt *(csatorna × bájt/minta)* — a vágás EZZEL igazodik. */
  frameBytes: number;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
}

/** Egy darab a felismerőnek. ⚠️ Szándékosan nem exportált. */
interface AudioChunk {
  /** Kész, **helyes fejléccel** ellátott WAV. */
  audio: Uint8Array;
  /** Hol kezdődik az eredetiben, másodpercben. */
  startSecs: number;
  /** Hol végződik az eredetiben, másodpercben. */
  endSecs: number;
  /**
   * 🔴 A vágás **beszéd közben** esett?
   *
   * ⚠️ Ilyenkor a határon lévő szó **elcsúszhat** *(a mérésben: „saját | megoldása")*. ⛔ Ezt
   * nem hallgatjuk el — a hívó **kimondja** a jelölésben *(a `⚠️ GYANÚS TAGOLÁS` mintájára)*.
   */
  cutMidSpeech: boolean;
}

/** A darabolás terve és eredménye. */
export class SttAudioWindow_Util {

  /**
   * 🔴 A FELISMERŐ ABLAKA — **mérve**, ⛔ nem dokumentációból olvasva.
   *
   * A prefix-sorozat szerint az átirat **pontosan 30,0 másodpercnél** fagy be.
   */
  static readonly RECOGNIZER_WINDOW_SECS: number = 30;

  /**
   * Ennyi hangot adunk egy hívásba.
   *
   * ⚠️ MIÉRT 28 ÉS NEM 30: a 30 a **mért plafon**, nem a biztonságos üzemi érték. A 28 mp-es
   * prefix a mérésben **hiánytalanul** átjött *(280 karakter, még növekvő szakaszon)*, és a
   * 2 másodperc tartalék elnyeli a csend-kereső vágás igazítását.
   */
  static readonly CHUNK_SECS: number = 28;

  /**
   * Ennyi másodpercen keresünk csendet a határ ELŐTT.
   *
   * ⚠️ A keresés **visszafelé** megy: inkább legyen egy darab rövidebb, mint hogy szó közben
   * vágjunk. A mért keret-eloszlásnál *(lásd `QUIET_ENERGY`)* 5 másodpercben **50 keret** van,
   * amiből statisztikailag több is csendes.
   */
  static readonly CUT_SEARCH_SECS: number = 5;

  /** A vizsgált keret hossza — ennyi hangból számolunk energiát. */
  static readonly FRAME_MS: number = 100;

  /**
   * 🔬 A „szóköz" energia-küszöbe — **mérve** a nap 8 legutóbbi felvételén *(1502 keret)*.
   *
   * ```
   * p1=0   p5=21   p10=65   p25=504   median=1381   p75=2264   p95=4307
   * ```
   * ⇒ A beszéd java **500 felett** van, a szünet **200 alatt**. A 200-as küszöb alá a keretek
   * **16,4%-a** esik, tehát bőven van hova vágni — ⛔ és nem keverjük össze a beszéddel.
   */
  static readonly QUIET_ENERGY: number = 200;

  /**
   * Egy WAV-fájl felépítése — vagy `null`, ha nem értelmezhető WAV.
   *
   * 🔴 **A DEKLARÁLT ADAT-HOSSZT SZÁNDÉKOSAN NEM HASZNÁLJUK.** Mérve: a felvevő fejléce
   * **22 369,6 másodpercet** állít **minden** fájlon *(a folyam-írás maradéka)*. ⇒ Ha ezt
   * elhinnénk, a darabolás **képzelt** hanggal dolgozna. A valódi hossz a **fájl mérete**.
   *
   * ⚠️ A `null` **nem hiba**: a nem-WAV bemenet *(pl. Discord-`ogg`)* teljesen érvényes — a
   * hívó ilyenkor **egyetlen** hívással dolgozik, pontosan úgy, ahogy eddig.
   */
  static describe(audio: Uint8Array): WavLayout | null {
    if (audio.byteLength < 44) return null;

    const view = new DataView(audio.buffer, audio.byteOffset, audio.byteLength);
    const tag = (offset: number): string => String.fromCharCode(
      audio[offset] ?? 0,
      audio[offset + 1] ?? 0,
      audio[offset + 2] ?? 0,
      audio[offset + 3] ?? 0,
    );

    if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;

    let channels: number = 0;
    let sampleRate: number = 0;
    let bitsPerSample: number = 0;
    let offset: number = 12;

    // ⚠️ A `fmt ` és a `data` közé MÁS blokk is kerülhet *(pl. `LIST`)* — ezért végigmegyünk a
    // blokk-láncon, ⛔ nem fix 44 bájtot feltételezünk.
    while (offset + 8 <= audio.byteLength) {
      const id: string = tag(offset);
      const size: number = view.getUint32(offset + 4, true);

      if (id === 'fmt ' && offset + 24 <= audio.byteLength) {
        channels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        bitsPerSample = view.getUint16(offset + 22, true);
      }

      if (id === 'data') {
        const frameBytes: number = channels * (bitsPerSample / 8);

        if (!frameBytes || !sampleRate) return null;

        return {
          dataOffset: offset + 8,
          bytesPerSecond: sampleRate * frameBytes,
          frameBytes: frameBytes,
          channels: channels,
          sampleRate: sampleRate,
          bitsPerSample: bitsPerSample,
        };
      }

      // ⚠️ A blokk-hossz páratlan is lehet, ilyenkor egy kitöltő bájt követi.
      offset += 8 + size + (size % 2);
    }

    return null;
  }

  /**
   * A hang hossza másodpercben — a **fájlméretből**, ⛔ nem a fejléc állításából.
   *
   * @returns a hossz, vagy `null`, ha nem értelmezhető WAV.
   */
  static durationSecs(audio: Uint8Array): number | null {
    const layout: WavLayout | null = SttAudioWindow_Util.describe(audio);

    if (!layout) return null;

    return (audio.byteLength - layout.dataOffset) / layout.bytesPerSecond;
  }

  /**
   * A hangot **a felismerő ablakába férő** darabokra vágja.
   *
   * @returns a darabok, vagy **üres lista**, ha a hang nem WAV ⇒ a hívó egyben dolgozza fel.
   *
   * ## ⭐ MIT AD, HA A HANG RÖVID
   *
   * ⚠️ Az ablaknál rövidebb hangnál **egyetlen** darabot ad, ami a **bemenet maga** — ⛔ nem
   * újracsomagolt. Indok: a rövid eset a **túlnyomó többség** *(a nap 84 felvételéből 73)*, és
   * ott a mai, **élesben bizonyított** út egy bájtot sem változik.
   */
  static split(audio: Uint8Array): AudioChunk[] {
    const layout: WavLayout | null = SttAudioWindow_Util.describe(audio);

    if (!layout) return [];

    const pcmLength: number = audio.byteLength - layout.dataOffset;
    const totalSecs: number = pcmLength / layout.bytesPerSecond;

    if (pcmLength <= 0) return [];

    // ⭐ A RÖVID ESET VÁLTOZATLAN: ugyanaz a bájtsor megy ki, mint eddig.
    if (totalSecs <= SttAudioWindow_Util.RECOGNIZER_WINDOW_SECS) {
      return [{ audio: audio, startSecs: 0, endSecs: totalSecs, cutMidSpeech: false }];
    }

    const pcm: Uint8Array = audio.subarray(layout.dataOffset);
    const chunkBytes: number = SttAudioWindow_Util.alignDown(
      Math.round(SttAudioWindow_Util.CHUNK_SECS * layout.bytesPerSecond),
      layout.frameBytes,
    );
    const chunks: AudioChunk[] = [];
    let start: number = 0;

    while (start < pcmLength) {
      const ideal: number = Math.min(start + chunkBytes, pcmLength);
      const last: boolean = ideal >= pcmLength;
      const cut = last
        ? { at: pcmLength, midSpeech: false }
        : SttAudioWindow_Util.findCut({ pcm: pcm, start: start, ideal: ideal, layout: layout });

      chunks.push({
        audio: SttAudioWindow_Util.toWav(pcm.subarray(start, cut.at), layout),
        startSecs: start / layout.bytesPerSecond,
        endSecs: cut.at / layout.bytesPerSecond,
        cutMidSpeech: cut.midSpeech,
      });

      start = cut.at;
    }

    return chunks;
  }

  /**
   * A vágási pont: a **legcsendesebb** keret a határ előtti sávban.
   *
   * ⚠️ Ha a legcsendesebb keret sem éri el a mért szóköz-küszöböt, a vágás a **határon** marad,
   * és `midSpeech: true` jelzéssel megy tovább — ⛔ a jelzés elhagyása lenne a néma csonkolás.
   */
  private static findCut(input: {
    pcm: Uint8Array;
    start: number;
    ideal: number;
    layout: WavLayout;
  }): { at: number; midSpeech: boolean } {
    const frame: number = SttAudioWindow_Util.alignDown(
      Math.round((SttAudioWindow_Util.FRAME_MS / 1000) * input.layout.bytesPerSecond),
      input.layout.frameBytes,
    );
    const band: number = Math.round(
      SttAudioWindow_Util.CUT_SEARCH_SECS * input.layout.bytesPerSecond,
    );
    const from: number = Math.max(input.start + frame, input.ideal - band);

    let bestAt: number = input.ideal;
    let bestEnergy: number | null = null;

    for (let offset: number = from; offset + frame <= input.ideal; offset += frame) {
      const energy: number = SttAudioWindow_Util.frameEnergy({
        pcm: input.pcm,
        offset: offset,
        length: frame,
        bitsPerSample: input.layout.bitsPerSample,
      });

      if (bestEnergy === null || energy < bestEnergy) {
        bestEnergy = energy;
        // ⭐ A keret KÖZEPÉN vágunk: így a szóköz mindkét darabban megmarad egy kicsit, és a
        // felismerő nem egy levágott hang-indítást kap.
        bestAt = offset + Math.floor(frame / 2);
      }
    }

    // 🔴 NEM TALÁLTUNK SZÓKÖZT ⇒ a vágás a HATÁRON marad, ⛔ nem a sáv elején.
    //
    // ⚠️ MÉRT HIBA, a teszt fogta meg (2026-09-11): végig hangos hangnál MINDEN keret energiája
    // azonos, tehát a „legcsendesebb" a sáv **első** kerete lett ⇒ minden darab **5 mp-rel
    // rövidebb** lett a kelleténél, és ezzel **fölöslegesen több** darab keletkezett. A több
    // darab pedig több vágás-hely, tehát több elcsúszó szó — ⇒ a kár VALÓDI, nem esztétikai.
    const midSpeech: boolean = bestEnergy === null
      || bestEnergy > SttAudioWindow_Util.QUIET_ENERGY;

    return {
      at: SttAudioWindow_Util.alignDown(midSpeech ? input.ideal : bestAt, input.layout.frameBytes),
      midSpeech: midSpeech,
    };
  }

  /**
   * Egy keret átlagos hangerőssége.
   *
   * ⚠️ Csak **16 bites** mintát értelmezünk; más mélységnél `0`-t adunk, ami **csendnek**
   * látszik ⇒ a vágás a sáv elejére esne. Ezért a hívó a `midSpeech`-et ilyenkor is
   * kimondja: ⛔ a „nem tudom megmérni" nem lehet néma.
   */
  private static frameEnergy(input: {
    pcm: Uint8Array;
    offset: number;
    length: number;
    bitsPerSample: number;
  }): number {
    if (input.bitsPerSample !== 16) return Number.MAX_SAFE_INTEGER;

    const view = new DataView(input.pcm.buffer, input.pcm.byteOffset, input.pcm.byteLength);
    const end: number = Math.min(input.offset + input.length, input.pcm.byteLength - 1);
    let sum: number = 0;
    let count: number = 0;

    for (let at: number = input.offset; at + 1 < end; at += 2) {
      sum += Math.abs(view.getInt16(at, true));
      count += 1;
    }

    return count ? Math.round(sum / count) : Number.MAX_SAFE_INTEGER;
  }

  /** Egy PCM-szakasz **helyes fejléccel** ellátva. */
  private static toWav(pcm: Uint8Array, layout: WavLayout): Uint8Array {
    const out = new Uint8Array(44 + pcm.byteLength);
    const view = new DataView(out.buffer);
    const write = (offset: number, text: string): void => {
      for (let index: number = 0; index < text.length; index += 1) {
        out[offset + index] = text.charCodeAt(index);
      }
    };

    write(0, 'RIFF');
    view.setUint32(4, 36 + pcm.byteLength, true);
    write(8, 'WAVE');
    write(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, layout.channels, true);
    view.setUint32(24, layout.sampleRate, true);
    view.setUint32(28, layout.bytesPerSecond, true);
    view.setUint16(32, layout.frameBytes, true);
    view.setUint16(34, layout.bitsPerSample, true);
    write(36, 'data');
    // ⭐ ITT A HELYES HOSSZ — szemben a felvevő 22 369 másodperces állításával.
    view.setUint32(40, pcm.byteLength, true);
    out.set(pcm, 44);

    return out;
  }

  /** Mintakeret-határra igazítás — ⛔ egy fél minta a hangot zörejjé tenné. */
  private static alignDown(value: number, frameBytes: number): number {
    return Math.max(frameBytes, Math.floor(value / frameBytes) * frameBytes);
  }
}

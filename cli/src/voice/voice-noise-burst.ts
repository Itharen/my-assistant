// 🎤 NYITOTT MIKROFON GYANÚJA — a zaj-özön jelzése, ⛔ nem a hangos figyelmeztetés.
//
// > **Owner, 2026-09-12 02:43:** *„Na mi a fék van? **Semmi nem megy** most már, teljesen nem
// > működik."* · **02:51:** *„most elkezdte nekem itt feldolgozni a My Assistant rendszere az
// > **összes a buliból származó zajt**."*
//
// ## 🔴 MIÉRT KELL JELZÉS — ez KAPACITÁS-probléma, nem szűrési szépséghiba
//
// Mérve *(`ma comm voice-funnel --day 2026-09-12`)*: **722 érzékelés / 259 felvétel / 16 valódi
// input** EGY este alatt — szemben egy normál nap **123 / 9 / 96**-jával. ⚠️ Ugyanebben az
// ablakban a `comm doctor` és a tölcsér **120 s fölé** nyúlt *(reggel: másodpercek)*, a memória
// pedig **100,5/127 GB**-on állt 17 GB Memory Compression-nel. ⇒ Az owner *„semmi nem megy"*
// élménye **valós** volt.
//
// ⇒ A szűrés önmagában **nem elég**: ha a mikrofon nyitva marad, a lánc **továbbra is** felvesz
// és felismer mindent. ⭐ Ezért kell **jelzés**, hogy valaki *(az asszisztens)* szólhasson.
//
// ## ⛔ AMIT EZ A MODUL NEM TESZ
//
// ⛔ **Nem hív `cast notify`-t** és ⛔ nem küld üzenetet. *(A handoff kikötése: „a hangos
// figyelmeztetést ÉN küldöm — a `cast notify`-t NE te hívd."* És a hétvégén az owner
// **ünnepel**, ⇒ semmilyen élő megszólalás.)*
// ⭐ Ez a modul **egyetlen dolgot** ad: a **szignált**, indoklással.

/** A zaj-özön képe. ⚠️ Szándékosan nem exportált: a döntés viszi. */
interface NoiseBurstVerdict {
  /** 🎤 Gyanús-e, hogy nyitva maradt a mikrofon. */
  isBurst: boolean;
  /** A legsűrűbb ablakban ennyi zaj-tétel volt. */
  peakCount: number;
  /** Az ablak hossza percben — hogy a szám értelmezhető legyen. */
  windowMinutes: number;
  /** A legsűrűbb ablak kezdete ISO-ban, ha volt egyáltalán zaj. */
  peakWindowStart?: string;
  /** ⭐ Ember-olvasható indoklás — ⛔ nem puszta logikai érték. */
  reason: string;
}

/** A nyitott-mikrofon gyanú kiértékelése — tiszta függvény. */
export class VoiceNoiseBurst_Util {

  /**
   * Ilyen hosszú ablakokban számolunk.
   *
   * ⚠️ MIÉRT 10 PERC: rövidebb ablak egy-két véletlen zajra is riadót fújna, hosszabb pedig
   * **elmosná** a sűrűséget *(egy egész éjszakára átlagolva a buli is „kevésnek" tűnne)*.
   */
  static readonly WINDOW_MINUTES: number = 10;

  /**
   * 🔬 EGY ABLAKBAN ENNYI ZAJ-TÉTEL FELETT GYANÚS — **mérve**, ⛔ nem fejből.
   *
   * A napi akció-naplókból kiszámoltam, hány eldobott megszólalás jut egy 10 perces ablakra:
   *
   * ```
   * NORMÁL ablakok (09-08 … 09-11):   1 · 2 · 3 · 3 · 3 · 3 · 4 · 4      ⟵ max 4
   * A BULI ablakai (09-12 01:20-01:59):  66 · 84 · 63 · 42               ⟵ min 42
   * ```
   *
   * 🔴 A két halmaz között **10× üres sáv** van *(4 → 42)*. A **12**-es küszöb ebbe a sávba
   * esik: a megfigyelt normál csúcs **3×**-a, és a megfigyelt zaj-minimum **3,5×** alatta.
   * ⇒ Így ⛔ nem riad egy szokásos estére, és ⛔ nem hallgat egy bulira.
   */
  static readonly BURST_THRESHOLD: number = 12;

  /**
   * Nyitva maradt-e a mikrofon?
   *
   * @param input a zaj-tételek időbélyegei *(bármilyen sorrendben)* és a „most".
   * @returns a gyanú, **indoklással**.
   *
   * ⚠️ **A CSÚSZÓ ABLAK az egyes tételekhez igazodik**, ⛔ nem fix negyed-órákhoz: egy
   * óra-határon átnyúló özön különben **kettévágódna**, és mindkét fele a küszöb alatt
   * maradhatna — pont a legrosszabb esetben hallgatnánk.
   */
  static evaluate(input: { timestamps: readonly Date[]; now?: Date }): NoiseBurstVerdict {
    const windowMs: number = VoiceNoiseBurst_Util.WINDOW_MINUTES * 60_000;
    // ⭐ MILLISZEKUNDUMOKKAL dolgozunk, ⛔ nem `Date`-objektumokkal.
    //
    // ⚠️ MIÉRT: a `Date[]` indexelése `Date | undefined`-ot ad, amit csak `as` átcímkézéssel
    // lehetne elhallgatni — az pedig azt **állítaná**, hogy tudjuk, amit nem. A `number[]` is
    // `undefined`-ot adhat, de ott a `?? 0` **valódi** alapérték, nem hazugság.
    const valid: number[] = input.timestamps
      .map((date: Date): number => date.getTime())
      .filter((value: number): boolean => !Number.isNaN(value))
      .sort((left: number, right: number): number => left - right);

    if (!valid.length) {
      return {
        isBurst: false,
        peakCount: 0,
        windowMinutes: VoiceNoiseBurst_Util.WINDOW_MINUTES,
        reason: 'Nincs zaj-tétel az időszakban — a mikrofon-gyanúnak nincs alapja.',
      };
    }

    let peakCount: number = 0;
    let peakStartMs: number = valid[0] ?? 0;

    // ⭐ CSÚSZÓ ABLAK: minden tételtől előre nézünk egy ablak-hosszat.
    for (let index: number = 0; index < valid.length; index += 1) {
      const startMs: number = valid[index] ?? 0;
      const limit: number = startMs + windowMs;
      let count: number = 0;

      for (let next: number = index; next < valid.length; next += 1) {
        if ((valid[next] ?? 0) > limit) break;
        count += 1;
      }

      if (count > peakCount) {
        peakCount = count;
        peakStartMs = startMs;
      }
    }

    const isBurst: boolean = peakCount >= VoiceNoiseBurst_Util.BURST_THRESHOLD;

    return {
      isBurst: isBurst,
      peakCount: peakCount,
      windowMinutes: VoiceNoiseBurst_Util.WINDOW_MINUTES,
      peakWindowStart: new Date(peakStartMs).toISOString(),
      reason: isBurst
        ? `🎤 NYITOTT MIKROFON GYANÚJA: ${peakCount} zaj-tétel ${VoiceNoiseBurst_Util.WINDOW_MINUTES} `
          + `perc alatt (küszöb: ${VoiceNoiseBurst_Util.BURST_THRESHOLD}, mért normál csúcs: 4). `
          + 'A környezet beszéde megy a hang-csatornába — ez KAPACITÁS-probléma is, nem csak '
          + 'szűrési kérdés. ⇒ Szólni kell az ownernek, hogy zárja a mikrofont.'
        : `${peakCount} zaj-tétel a legsűrűbb ${VoiceNoiseBurst_Util.WINDOW_MINUTES} perces `
          + `ablakban — a ${VoiceNoiseBurst_Util.BURST_THRESHOLD}-es küszöb alatt, ez szokásos `
          + 'háttérzaj.',
    };
  }
}

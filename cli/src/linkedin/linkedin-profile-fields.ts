// 🔗 A PROFIL-FRISSÍTÉS MEZŐI — a döntés, hálózat és felület nélkül.
//
// > **Owner, 2026-09-11 01:52:** *„most az első majd az kell legyen, hogy a **profilt kéne
// > frissítsük**. Amúgy lehet, hogy ahhoz is adhatnál majd egy felületet, meg valami **easy to
// > use, copy-paste-es megoldást**, ugye azt sem tudjuk automatizálni teljesen."*
//
// ## 🔴 A KORLÁT, AMI A TERVET MEGHATÁROZZA
//
// A LinkedIn hivatalos API-ja **csak olvas** ⇒ a profilt **nem tudjuk átírni**. Az owner is így
// mondta: *„azt sem tudjuk automatizálni teljesen."*
//
// ⇒ **A cél nem az automatizálás, hanem a SÚRLÓDÁS-MENTES ÁTVITEL.** A LinkedIn-en **mezőnként**
// kell beilleszteni, ezért a felület is mezőnként dolgozik — ⛔ **nem egy nagy blobot** ad,
// ahogy a feladat külön kikötötte.
//
// ## ⭐ EZ A MODUL A DÖNTÉS, NEM A FELÜLET
//
// Itt dől el, **mi látszik** mezőnként: a mostani és a javasolt szöveg, a hosszak, a
// LinkedIn-limit, hogy **túllóg-e**, és hogy az owner **beillesztette-e már**. ⛔ Sem HTTP, sem
// fájl, sem DOM — ezért **teljesen tesztelhető**.

/** Egy profil-mező azonosítója. ⚠️ Szándékosan nem exportált: a `FIELDS` adja a listát. */
type ProfileFieldKey = 'headline' | 'summary' | 'industry' | 'location';

/** Egy mező leíró adatai. */
interface ProfileFieldSpec {
  key: ProfileFieldKey;
  /** Ahogy a LinkedIn-en hívják — ⚠️ azon a néven keresse, ahol beilleszti. */
  label: string;
  /**
   * A LinkedIn karakter-korlátja.
   *
   * ⭐ MIÉRT KELL: *„ha túllóg, ott derüljön ki, ne a beillesztésnél"* — a feladat kikötése.
   * Egy beillesztésnél levágott szöveg **némán** veszít tartalmat.
   */
  limit: number;
  /** A `profile-current.json` mezőneve — ⚠️ MÉRT kulcsok, a LinkedIn exportjából. */
  sourceKey: string;
}

/** Amit egy mezőről a felületnek tudnia kell. */
interface ProfileField {
  key: ProfileFieldKey;
  label: string;
  limit: number;
  /** A LinkedIn-en MOST szereplő szöveg. */
  current: string;
  /** A JAVASOLT szöveg — ⚠️ üres, ha az asszisztens még nem írta meg. */
  proposed: string;
  currentLength: number;
  proposedLength: number;
  /** 🔴 Túllóg-e a javaslat a LinkedIn korlátján. */
  isOverLimit: boolean;
  /** ⭐ Van-e egyáltalán mit beilleszteni *(van javaslat, és más, mint a mostani)*. */
  hasChange: boolean;
  /** ✅ Az owner már beillesztette — mezőnként, hogy félbeszakítás után tudja, hol tartott. */
  isPasted: boolean;
}

/** A profil-frissítés összesítése. */
interface ProfileUpdatePlan {
  fields: ProfileField[];
  /** Hány mezőn van tennivaló. */
  changeCount: number;
  /** Hányat illesztett már be. */
  pastedCount: number;
  /** 🔴 Hány mező lóg túl a limiten — ⛔ ezeket nem lehet beilleszteni. */
  overLimitCount: number;
  /** ⭐ Kész-e: minden változó mező beillesztve. */
  isComplete: boolean;
  /** ⚠️ Megvan-e egyáltalán a javaslat. */
  hasProposal: boolean;
}

/**
 * A kezelt mezők.
 *
 * ⭐ **MÉRT KULCSOK** *(`current/linkedin/profile-current.json`, 2026-09-11)*: a LinkedIn
 * exportja `Headline`, `Summary`, `Industry`, `Geo Location` néven adja őket. ⛔ Nem tippeltük.
 *
 * ⚠️ A limitek a LinkedIn közzétett korlátai: a **headline 220**, az **about/summary 2600**
 * karakter. A `industry` és a `location` **választható** érték a LinkedIn felületén, nem
 * szabad szöveg — ott a korlát csak biztonsági felső határ.
 */
const FIELDS: readonly ProfileFieldSpec[] = [
  { key: 'headline', label: 'Headline', limit: 220, sourceKey: 'Headline' },
  { key: 'summary', label: 'About', limit: 2_600, sourceKey: 'Summary' },
  { key: 'industry', label: 'Industry', limit: 200, sourceKey: 'Industry' },
  { key: 'location', label: 'Location', limit: 200, sourceKey: 'Geo Location' },
];

/** A profil-frissítés mezői. */
export class LinkedinProfileFields_Util {

  /** A kezelt mezők leírása — a felület és a teszt ebből dolgozik. */
  static readonly SPECS: readonly ProfileFieldSpec[] = FIELDS;

  /**
   * Egy mező kiolvasása **ismeretlen alakú** adatból.
   *
   * ⚠️ A profil-JSON a LinkedIn exportjából jön: **idegen adat**. Egy `as` átcímkézés azt
   * állítaná, hogy ismerjük az alakját — ⭐ helyette szerkezetileg olvasunk.
   */
  static readText(source: unknown, key: string): string {
    if (!source || typeof source !== 'object') return '';

    for (const [name, value] of Object.entries(source)) {
      if (name === key) return typeof value === 'string' ? value.trim() : '';
    }

    return '';
  }

  /**
   * A frissítési terv összeállítása. **Tiszta függvény.**
   *
   * @param input a mostani profil, a javasolt profil, és hogy mit illesztett már be.
   * @returns mezőnkénti terv + összesítés.
   *
   * ⚠️ **A javaslat HIÁNYA nem hiba**: az asszisztens írja meg *(⛔ nem a DEV)*. Ilyenkor a
   * `hasProposal: false` jön, és a felület ezt **kimondja** — ⛔ nem néz ki üresen elromlottnak.
   */
  static buildPlan(input: {
    current: unknown;
    proposed: unknown;
    /** Amit már beillesztett — a mező kulcsai. */
    pasted?: readonly string[];
  }): ProfileUpdatePlan {
    const pasted: ReadonlySet<string> = new Set(input.pasted ?? []);
    const fields: ProfileField[] = FIELDS.map((spec: ProfileFieldSpec): ProfileField => {
      const current: string = LinkedinProfileFields_Util.readText(input.current, spec.sourceKey);
      const proposed: string = LinkedinProfileFields_Util.readText(input.proposed, spec.sourceKey);

      return {
        key: spec.key,
        label: spec.label,
        limit: spec.limit,
        current: current,
        proposed: proposed,
        currentLength: current.length,
        proposedLength: proposed.length,
        isOverLimit: proposed.length > spec.limit,
        // ⚠️ AZONOS SZÖVEG NEM VÁLTOZÁS: ⛔ ne küldjük át a LinkedIn-re azért, hogy ugyanaz
        // legyen — az csak munka, és az owner idejét viszi.
        hasChange: proposed.length > 0 && proposed !== current,
        isPasted: pasted.has(spec.key),
      };
    });
    const changing: ProfileField[] = fields.filter((f: ProfileField): boolean => f.hasChange);

    return {
      fields: fields,
      changeCount: changing.length,
      pastedCount: changing.filter((f: ProfileField): boolean => f.isPasted).length,
      overLimitCount: fields.filter((f: ProfileField): boolean => f.isOverLimit).length,
      // ⭐ „Kész" = MINDEN változó mező beillesztve. ⚠️ Ha nincs javaslat, akkor nincs is mit
      // beilleszteni — ⛔ az NEM „kész", hanem „még nincs miből".
      isComplete: changing.length > 0
        && changing.every((f: ProfileField): boolean => f.isPasted),
      hasProposal: fields.some((f: ProfileField): boolean => f.proposed.length > 0),
    };
  }

  /**
   * A beillesztés-jelölés frissítése. **Tiszta függvény.**
   *
   * @returns az ÚJ halmaz — ⛔ a bemenetet nem módosítja.
   *
   * ⭐ MIÉRT KELL EGYÁLTALÁN: *„különben nem tudja, hol tartott, ha félbeszakad"* — a feladat
   * kikötése. Négy mezőt beilleszteni több percnyi kattintás; egy telefonhívás közbevág.
   */
  static togglePasted(
    pasted: readonly string[],
    key: string,
    isPasted: boolean,
  ): string[] {
    const known: boolean = FIELDS.some((spec: ProfileFieldSpec): boolean => spec.key === key);

    // ⛔ ISMERETLEN KULCSOT NEM JEGYZÜNK FEL: egy elírás különben némán felhalmozódna az
    // állapot-fájlban, és senki nem értené, mit jelent.
    if (!known) return [...pasted];

    const next: Set<string> = new Set(pasted);

    if (isPasted) next.add(key);
    else next.delete(key);

    // ⚠️ A MEZŐ-SORREND szerint rendezve: így az állapot-fájl **olvasható**, és két egymás
    // utáni írás ⛔ nem ad értelmetlen diffet.
    return FIELDS
      .map((spec: ProfileFieldSpec): string => spec.key)
      .filter((key_: string): boolean => next.has(key_));
  }
}

// ✍️ A POSZT-PISZKOZATOK LISTÁJA — a felület tiszta döntései.
//
// > **Owner sorrendje:** profil → **posztok** → üzenetek. A profil-vonal kész, ⇒ a posztok jönnek.
//
// ## 🔴 A KORLÁT UGYANAZ, MINT A PROFILNÁL
//
// A LinkedIn API **csak olvas** ⇒ a posztot **nem tudjuk kiküldeni**. ⇒ A cél nem az
// automatizálás, hanem a **súrlódás-mentes átvitel**: posztonként egy másolható szöveg,
// karakterszám a limithez mérve, és posztonként pipa arról, hogy megvan.
//
// ⛔ **AMI SZÁNDÉKOSAN NINCS** *(a feladat szó szerinti tiltása, `one-function-is-enough`)*:
// ütemezés, automatikus kiküldés, statisztika, kép-generálás, szerkesztő.
//
// 🔴 **A POSZT SZÖVEGE NEM A MI DOLGUNK.** A tartalmi szabályok az asszisztensé
// *(`current/principles/linkedin-post-writing.md`)*. Ez a modul **olvas és számol** — ⛔ nem
// generál és ⛔ nem módosít egyetlen karaktert sem.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// ⚠️ MÉRT KORREKCIÓ A FELADAT-LEÍRÁSHOZ (2026-09-11 18:10)
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
// A handoff azt írta: *„A piszkozatok helye: `current/linkedin/drafts/`"*. **Megnéztem, és az
// a mappa MÁST tartalmaz:**
//
// ```
// current/linkedin/drafts/README.md      → „# ✍️ LinkedIn VÁLASZ-piszkozatok"
// current/linkedin/drafts/*.md           → `thread:` azonosító, „kinek:", „mirol:"
// ```
//
// ⇒ Azok **üzenet-válaszok** a LinkedIn-postaládához *(`ma linkedin reply draft --thread …`)*,
// és az owner sorrendjében az **üzenetek a HARMADIK** tétel. 🔴 Ha ezt a mappát olvasnám
// „posztok" néven, akkor **(a)** átugranám az owner sorrendjét, és **(b)** egy „posztok"
// panelen jelenítenék meg **óradíjat és telefonszámot** — azok az üzenet-piszkozatokban
// benne vannak. ⛔ Ez nem elírás-szintű különbség.
//
// ⭐ **AMIT A HANDOFF VALÓBAN KÉR, ÉS AMIT ÁTVESZEK:** a **két-fájlos alak**
// *(`.body.txt` = a pontos kimenő szöveg · `.md` = az indoklás)*. Az **jó minta**, és
// változatlanul ezt olvassuk — csak a **posztok saját mappájából**:
//
// ```
// current/linkedin/post-drafts/<azonosító>.body.txt   ← EZ megy ki (a poszt szövege)
// current/linkedin/post-drafts/<azonosító>.md         ← az indoklás (nekem is, az ownernek is)
// ```
//
// 📌 A handoff maga jelezte, hogy *„a piszkozatok helyéről szólok külön"* ⇒ a hely **nyitott
// volt**; ez a döntés kimondja, és a mappa **létrejöttéig** a panel a **helyes üres állapotot**
// mutatja.

/** Egy beolvasott piszkozat-fájlpár — ⚠️ nyers bemenet, a hívó adja. */
interface PostDraftSource {
  /** A fájlnév törzse *(`.body.txt` és `.md` nélkül)* — ez az azonosító. */
  id: string;
  /** 🔴 A PONTOS kimenő szöveg a `.body.txt`-ből. ⛔ Ezt nem alakítjuk. */
  body: string;
  /** Az indoklás-fájl teljes szövege, ha van. ⚠️ A hiánya nem hiba. */
  markdown?: string;
}

/** Egy poszt-piszkozat a felületen. ⚠️ Szándékosan nem exportált. */
interface PostDraft {
  id: string;
  /** A megjelenítendő cím — a dátum + a szöveg eleje. */
  title: string;
  /** 🔴 A MÁSOLHATÓ szöveg — pontosan az, ami kimegy. */
  body: string;
  length: number;
  limit: number;
  /** 🔴 Túllóg-e — ⭐ ITT derül ki, ⛔ nem a beillesztésnél. */
  isOverLimit: boolean;
  /** Az indoklásból: miért így. ⚠️ Üres, ha nincs `.md`. */
  why: string;
  /** Az indoklás `statusz:` mezője, ha van. */
  status: string;
  /** ✅ Az owner már kiposztolta. */
  isPosted: boolean;
}

/** A poszt-piszkozatok összesítése. ⚠️ Szándékosan nem exportált. */
interface PostDraftsPlan {
  drafts: PostDraft[];
  draftCount: number;
  postedCount: number;
  overLimitCount: number;
  /** ⭐ Van-e egyáltalán piszkozat — ⛔ a hiánya NEM hiba. */
  hasDrafts: boolean;
  /** Hol keresi a rendszer a piszkozatokat — ⚠️ az üres állapot ezt KIMONDJA. */
  draftsPath: string;
}

/** A poszt-piszkozat lista döntései. */
export class LinkedinPostDrafts_Util {

  /**
   * 🔴 A LinkedIn poszt karakter-korlátja.
   *
   * 📌 A handoff adja meg *(2026-09-11 18:05: „LinkedIn poszt-limit (3 000 kar.)")*.
   * ⚠️ **Nem én mértem** — a LinkedIn felületén dől el. Ha egyszer elutasít egy ennél
   * rövidebb szöveget, ezt a számot **mérés alapján** kell javítani, ⛔ nem tippel.
   */
  static readonly POST_LIMIT: number = 3000;

  /** A piszkozat-mappa a repón belül — ⭐ EGY helyen, hogy a panel is ki tudja mondani. */
  static readonly DRAFTS_DIRECTORY: string = 'current/linkedin/post-drafts';

  /**
   * A piszkozat-lista összeállítása. **Tiszta függvény.**
   *
   * @param input a beolvasott fájlpárok és hogy mit posztolt már ki.
   * @returns a lista + összesítés.
   *
   * ⚠️ **A piszkozatok HIÁNYA nem hiba**: a szöveget az asszisztens írja *(⛔ nem a DEV)*.
   * Ilyenkor `hasDrafts: false` jön, és a felület ezt **kimondja** — ⛔ nem néz ki
   * üresen elromlottnak. *(Ez a profil-panel `hasProposal`-jának megfelelője.)*
   */
  static buildList(input: {
    sources: readonly PostDraftSource[];
    /** Amit már kiposztolt — a piszkozat-azonosítók. */
    posted?: readonly string[];
  }): PostDraftsPlan {
    const posted: ReadonlySet<string> = new Set(input.posted ?? []);
    const drafts: PostDraft[] = [...input.sources]
      // ⚠️ A LEGFRISSEBB ELŐRE: a fájlnév dátummal kezdődik, tehát a fordított név-sorrend
      // egyben idő-sorrend. ⛔ Nem a fájlrendszer sorrendjére hagyatkozunk.
      .sort((left: PostDraftSource, right: PostDraftSource): number => right.id.localeCompare(left.id))
      .map((source: PostDraftSource): PostDraft => {
        // 🔴 A SZÖVEGET NEM ALAKÍTJUK: csak a záró/nyitó üres sorokat vágjuk le, mert azok a
        // fájl-végi újsorból jönnek, ⛔ nem az owner szövegéből.
        const body: string = source.body.replace(/^\n+/u, '').replace(/\s+$/u, '');

        return {
          id: source.id,
          title: LinkedinPostDrafts_Util.describeTitle(source.id, body),
          body: body,
          length: body.length,
          limit: LinkedinPostDrafts_Util.POST_LIMIT,
          isOverLimit: body.length > LinkedinPostDrafts_Util.POST_LIMIT,
          why: LinkedinPostDrafts_Util.readWhy(source.markdown ?? ''),
          status: LinkedinPostDrafts_Util.readMetaField(source.markdown ?? '', 'statusz'),
          isPosted: posted.has(source.id),
        };
      });

    return {
      drafts: drafts,
      draftCount: drafts.length,
      postedCount: drafts.filter((draft: PostDraft): boolean => draft.isPosted).length,
      overLimitCount: drafts.filter((draft: PostDraft): boolean => draft.isOverLimit).length,
      hasDrafts: drafts.length > 0,
      draftsPath: LinkedinPostDrafts_Util.DRAFTS_DIRECTORY,
    };
  }

  /**
   * A megjelenítendő cím: a dátum + a szöveg eleje.
   *
   * ⚠️ MIÉRT NEM A FÁJLNÉV: a fájlnév kötőjeles és rövidített *(`2026-09-11-ai-agents`)* —
   * ránézésre **nem mondja meg**, miről szól a poszt. A szöveg első sora igen.
   */
  static describeTitle(id: string, body: string): string {
    const date: string = id.match(/^(\d{4}-\d{2}-\d{2})/u)?.[1] ?? '';
    const firstLine: string = body
      .split('\n')
      .map((line: string): string => line.trim())
      .find((line: string): boolean => line.length > 0) ?? '';
    const opener: string = firstLine.length > 70 ? `${firstLine.slice(0, 70)}…` : firstLine;

    // ⚠️ Cím nélküli *(üres)* poszt is LÁTSZIK — ⛔ egy üres sor hibának tűnne a listában.
    if (!opener) return date ? `${date} — (üres piszkozat)` : '(üres piszkozat)';

    return date ? `${date} — ${opener}` : opener;
  }

  /**
   * Az indoklás-markdown egy front-matter mezője.
   *
   * ⚠️ **SZÁNDÉKOSAN EGYSZERŰ**: a `kulcs: érték` alakot olvassa a fájl elejéről. ⛔ Nem
   * teljes YAML-értelmező — az a piszkozat-fájlok alakjához képest túlzás lenne, és egy
   * rosszul értelmezett kulcs miatt **hamis** státuszt írnánk ki.
   */
  static readMetaField(markdown: string, field: string): string {
    // ⚠️ CSAK A FRONT-MATTERBEN keresünk, ⛔ nem az egész fájlban. Indok: a törzsben is
    // előfordulhat `statusz:` szó *(idézetben, példában)*, és akkor **hamis** státuszt írnánk
    // a panelre. A `---`-ek közti rész az egyetlen hely, ahol a mező **állítás**.
    for (const line of LinkedinPostDrafts_Util.frontMatterLines(markdown)) {
      const separator: number = line.indexOf(':');

      if (separator <= 0) continue;

      if (line.slice(0, separator).trim().toLowerCase() === field.toLowerCase()) {
        return line.slice(separator + 1).trim();
      }
    }

    return '';
  }

  /**
   * A front-matter sorai — vagy **üres lista**, ha a fájl nem azzal kezdődik.
   *
   * ⚠️ A front-matter **nem kötelező**: az asszisztens írhat sima szöveget is. ⛔ Ilyenkor
   * nincs mit értelmezni, és ez **nem hiba**.
   */
  private static frontMatterLines(markdown: string): string[] {
    const text: string = markdown.trim();

    if (!text.startsWith('---')) return [];

    const closing: number = text.indexOf('\n---', 3);

    if (closing === -1) return [];

    return text
      .slice(3, closing)
      .split('\n')
      .map((line: string): string => line.trim())
      .filter((line: string): boolean => line.length > 0);
  }

  /**
   * Az indoklás emberi része — a front-matter UTÁN.
   *
   * ⭐ MIÉRT KELL A PANELRE: a poszt mellé odakerül, hogy **miért így** szól. ⚠️ Enélkül az
   * owner egy szöveget látna, indoklás nélkül — és pont a döntéshez kellene a miért.
   */
  static readWhy(markdown: string): string {
    const text: string = markdown.trim();

    if (!text) return '';

    if (!text.startsWith('---')) return text;

    // A front-matter záró `---`-je utáni rész.
    const closing: number = text.indexOf('\n---', 3);

    return closing === -1 ? '' : text.slice(closing + 4).trim();
  }

  /**
   * A „kiposztoltam" jelölés frissítése. **Tiszta függvény.**
   *
   * @returns az ÚJ halmaz — ⛔ a bemenetet nem módosítja.
   *
   * ⚠️ **ISMERETLEN AZONOSÍTÓT NEM JEGYZÜNK FEL**: egy elírás különben némán felhalmozódna az
   * állapot-fájlban. ⭐ A `known` lista a **tényleg létező** piszkozatokból jön.
   */
  static togglePosted(
    posted: readonly string[],
    id: string,
    isPosted: boolean,
    known: readonly string[],
  ): string[] {
    if (!known.includes(id)) return [...posted];

    const next: Set<string> = new Set(posted);

    if (isPosted) next.add(id);
    else next.delete(id);

    // ⚠️ Rendezve: az állapot-fájl így **olvasható**, és két egymás utáni írás ⛔ nem ad
    // értelmetlen diffet.
    return [...next].sort((left: string, right: string): number => left.localeCompare(right));
  }
}

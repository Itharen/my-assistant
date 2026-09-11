// 😴 ÉBREN VAN-E AZ OWNER? — ⭐ MÉRÉSBŐL, ⛔ nem fix órarendből.
//
// ## 🔴 MIÉRT LÉTEZIK EZ A MODUL — 5 698 MINTÁN MÉRVE
//
// A szerver `/api/sleep-state` végpontja **fix órarendből tippelt**
// *(`02:00-10:00 = alvás-ablak`)*, és a `comm doctor` ezt régóta sárgán jelezte.
//
// ⭐ **A TELJES JELENLÉT-ADATON MEGMÉRTEM**, mennyire tér el a tipp a mérhető valóságtól
// *(8 napi fájl, 5 698 perc-minta, 2026-05-07 … 09-12)*:
//
// ```
// osztályozás                                  EGYEZIK        ELTÉR
// (a) idleState szerint                        56,1%          43,9%   (5 437 értékelhető)
// (b) idleSeconds ≥ 10 perc                    61,5%          38,5%   (5 698)
// (c) idleSeconds ≥ 1 óra                      64,7%          35,3%   (5 698)
// ```
//
// 🔴 **Az eltérés MINDHÁROM olvasatban 35-44%** — a fix órarend gyakorlatilag **érme-feldobás**.
// ⇒ Strukturális ok: a **csúszó, ~26 órás** alvás-ciklus *(`current/principles/sleep-system.md`)*
// egy **fix** órarenddel összeférhetetlen. A jel viszont **ott van a lemezen**.
//
// ## ⚠️ AMIT A HANDOFF ÁLLÍTOTT, ÉS AMIT A MÉRÉS MOND
//
// A handoff *(00:10)* két konkrét esetet nevezett meg a tipp cáfolatául. ⭐ Utánaszámoltam, és
// **a két példa NEM cáfolja** — a beállított ablakkal *(`02:00-10:00`, env felülírás nincs)*:
//
// | Időpont | Mit ad a FIX órarend | A valóság | |
// |---|---|---|---|
// | 09-11 **09:00** | 09 az ablakban ⇒ **alszik** | aludt *(idle 6,1 óra)* | ⭐ EGYEZIK |
// | 09-12 **00:06** | 00 az ablakon kívül ⇒ **ébren** | ébren volt *(idle 0 mp)* | ⭐ EGYEZIK |
//
// ⇒ A két idézett pillanatban a tipp **véletlenül eltalálta**. ⛔ Ez viszont **nem érv a tipp
// mellett**: a fenti 35-44% mutatja, hogy **máskor rendszeresen téved**. ⭐ A csere indoka tehát
// **erősebb**, mint a handoffban szereplő két anekdota — de **más**, és ezt kimondom.
// *(Ha a „reggel = ébren" tipp NEM a `/api/sleep-state`-ből jött, akkor egy másik, nem
// mért forrásból — az pedig külön tétel.)*
//
// ## 🔴 MIÉRT NEM KOZMETIKA: ERRE ÉPÜL A HANGSZÓRÓ-KAPU
//
// Rossz ébrenlét-döntés ⇒ **megszólal a Google Home**, amikor alszik. ⛔ És 2026-09-12/13-án
// **vendégek** vannak *(`private-topics-and-audience`)* — egy téves *„ébren van"* **a szobába**
// szólna. ⇒ Ezért a szabály:
//
// > **⚠️ BIZONYTALANSÁGNÁL AZ „ALSZIK" ÁG NYER.** A téves csend **olcsó**, a téves hangos
// > **nem az**. Az `unknown` ⛔ nem „valószínűleg ébren".
//
// ## ⭐ AMI MÁR MEGVOLT — és amit ez a modul NEM épít újra
//
// A **jelenlét-olvasó** *(`presence.reader.ts`)* már kész: kezeli a **BOM**-ot, a `timestamp`
// mezőt, az `idleSeconds`-öt, és **három állapotot** ad *(`yes` / `no` / `unknown`)*.
// ⛔ Ezt nem írjuk újra. Az owner-szabály *„Discord-válasz ⇒ még egy óra ébrenlét"* pedig a
// hangszóró-kapuban élt — ⭐ innentől **itt** lakik, EGY helyen, és a kapu **ezt** használja.

import type { PresenceSnapshot } from './presence.reader.js';

/** Az ébrenlét három állapota. ⚠️ Szándékosan nem exportált: a döntés viszi. */
type AwakeState = 'awake' | 'asleep' | 'unknown';

/** Melyik jel döntött. ⚠️ Szándékosan nem exportált. */
type AwakeSignal = 'presence-active' | 'discord-reply' | 'presence-idle' | 'none';

/** Az ébrenlét-döntés — ⭐ mindig INDOKLÁSSAL, ⛔ nem puszta logikai érték. */
interface AwakeDecision {
  /** 🔴 A három ág: ébren · alszik · nincs adat. */
  state: AwakeState;
  /**
   * 🔴 **CSAK az `awake` igaz.** Az `unknown` ⇒ `false`.
   *
   * ⚠️ MIÉRT KÜLÖN MEZŐ: hogy a hívónak ⛔ **ne kelljen** a három állapotot értelmeznie, és
   * ⛔ ne tudja véletlenül „valószínűleg ébren"-ként olvasni a `unknown`-t. A biztonságos
   * olvasat **be van építve**.
   */
  isAwake: boolean;
  /** Melyik jel döntött — a hibakereséshez, ⛔ hogy ne kelljen találgatni. */
  signal: AwakeSignal;
  /** ⭐ Ember-olvasható indoklás: **melyik** jel, **milyen friss**. */
  reason: string;
  /** A döntő jel életkora percben, ha volt jel. */
  ageMinutes?: number;
}

/** Az ébrenlét-döntés — tiszta függvény, futó gép nélkül tesztelhető. */
export class PresenceAwake_Util {

  /**
   * 🕐 Discord-válasz után ennyi ideig számít ébrenlétnek.
   *
   * > **Owner (2026-09-06, szó szerint):** *„hogyha discordon válaszolok, akkor is ébren
   * > vagyok, **legalább egy órát még**."*
   *
   * ⭐ Ez a **türelmi ablak**: a válasz utáni órában akkor is ébren van, ha épp nem gépel.
   */
  static readonly DISCORD_AWAKE_WINDOW_MS: number = 60 * 60_000;

  /**
   * Ébren van-e az owner?
   *
   * @param input a jelenlét-mérés, az utolsó Discord-válasz ideje, és a „most".
   * @returns a három állapot egyike, **indoklással**.
   *
   * ## A SORREND SZÁNDÉKOS
   *
   * 1. **friss, AKTÍV jelenlét-mérés** ⇒ ébren *(a legerősebb jel: épp használja a gépét)*
   * 2. **friss Discord-válasz** *(≤ 1 óra)* ⇒ ébren *(nincs a gépnél, de válaszolt)*
   * 3. **friss, de TÉTLEN mérés** ⇒ alszik *(vagy nincs a gépnél — l. lent)*
   * 4. bármi más ⇒ **nincs adat**
   *
   * ⚠️ **A 3. ÁG PONTOS JELENTÉSE:** *„friss mérés, de régóta nincs bevitel"*. Ez ⛔ nem
   * bizonyítja az **alvást** — lehet, hogy csak nincs a gépnél. ⭐ De a **következmény
   * ugyanaz** *(ne szólaljon meg a hangszóró)*, ezért az `asleep` ágra tesszük, és az
   * indoklás **kimondja**, hogy melyikről van szó.
   */
  static decide(input: {
    presence: PresenceSnapshot;
    /** Az owner legutóbbi Discord-üzenetének ideje, ha van. */
    lastDiscordReplyAt?: Date;
    now: Date;
  }): AwakeDecision {
    // ── 1. A GÉPÉT HASZNÁLJA — a legerősebb jel ───────────────────────────────────────────
    if (input.presence.isHome === 'yes') {
      return {
        state: 'awake',
        isAwake: true,
        signal: 'presence-active',
        reason: `ÉBREN — a gépét használja. ${input.presence.reason}`,
        ...(input.presence.ageMinutes === undefined ? {} : { ageMinutes: input.presence.ageMinutes }),
      };
    }

    // ── 2. DISCORD-VÁLASZ a türelmi ablakon belül ─────────────────────────────────────────
    const discordAgeMs: number | null = input.lastDiscordReplyAt
      ? input.now.getTime() - input.lastDiscordReplyAt.getTime()
      : null;
    // ⚠️ A NEGATÍV életkort kizárjuk: egy JÖVŐBELI időbélyeg *(elcsúszott óra, hibás adat)*
    // ⛔ nem számít friss válasznak. Enélkül egy rossz időbélyeg **örök ébrenlétet** adna.
    const isDiscordFresh: boolean = discordAgeMs !== null
      && discordAgeMs >= 0
      && discordAgeMs <= PresenceAwake_Util.DISCORD_AWAKE_WINDOW_MS;

    if (isDiscordFresh) {
      const minutes: number = Math.round((discordAgeMs ?? 0) / 60_000);

      return {
        state: 'awake',
        isAwake: true,
        signal: 'discord-reply',
        reason: `ÉBREN — ${minutes} perce válaszolt Discordon (a türelmi ablak `
          + `${PresenceAwake_Util.DISCORD_AWAKE_WINDOW_MS / 60_000} perc). `
          + `A gépénél viszont nincs: ${input.presence.reason}`,
        ageMinutes: minutes,
      };
    }

    // ── 3. FRISS, DE TÉTLEN mérés ⇒ alszik (vagy nincs a gépnél) ──────────────────────────
    if (input.presence.isHome === 'no') {
      return {
        state: 'asleep',
        isAwake: false,
        signal: 'presence-idle',
        reason: `ALSZIK (vagy nincs a gépnél) — friss mérés, de régóta nincs bevitel, és `
          + `Discordon sem válaszolt az elmúlt órában. ${input.presence.reason}`,
        ...(input.presence.ageMinutes === undefined ? {} : { ageMinutes: input.presence.ageMinutes }),
      };
    }

    // ── 4. NINCS ADAT — ⛔ és ez NEM „valószínűleg ébren" ─────────────────────────────────
    return {
      state: 'unknown',
      isAwake: false,
      signal: 'none',
      reason: `NEM TUDJUK, ébren van-e: ${input.presence.reason} `
        + 'Discord-válasz sem volt az elmúlt órában. ⛔ A bizonytalanság „alszik"-ként '
        + 'viselkedik: a téves csend olcsó, a téves hangos megszólalás nem.',
      ...(input.presence.ageMinutes === undefined ? {} : { ageMinutes: input.presence.ageMinutes }),
    };
  }
}

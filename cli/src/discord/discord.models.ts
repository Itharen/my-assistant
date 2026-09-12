// Discord-híd adatmodellek.
//
// A híd feladata: a Discordon érkező owner-üzeneteket KÖTEGELVE, EGYETLEN prompttal
// juttatni be a CC sessionbe a CCAP-on keresztül.
//
// Owner-indoklás (2026-09-06): „minden egyes prompt egy hosszabb futást eredményez, és
// ezért lenne fontos, hogy minél több infó kerüljön be egy-egy promptba."

/** Az előtag, amit MINDEN Discordról érkező üzenet megkap (owner-előírás, 2026-09-06). */
export const DISCORD_INBOUND_PREFIX: string = 'INCOMING_USER_MSG_ON_DISCORD:';

/** Egy beérkezett, még be nem juttatott Discord-üzenet. */
export interface DiscordInboundMessage {
  /** Discord üzenet-azonosító — a duplikátum-szűréshez. */
  messageId: string;
  /** A küldő Discord felhasználó-azonosítója. */
  authorId: string;
  /** Megjelenített név — csak naplózáshoz/kontextushoz. */
  authorName: string;
  /** A csatorna, ahonnan jött. */
  channelId: string;
  /** Az üzenet szövege. */
  content: string;
  /** Mikor érkezett (ISO 8601, Europe/Budapest offszettel). */
  receivedAt: string;
  /**
   * 🔗 Melyik üzenetre VÁLASZOLT az owner.
   *
   * 🔴 Enélkül a *„ezt az üzenetet próbáld újraolvasni"* kérés **értelmezhetetlen**: a
   * szöveg nem mondja meg, MELYIKRE gondolt — azt kizárólag a válasz-referencia hordozza.
   * Owner (2026-09-08 14:49): *„kelleni fog **reply reference** és on demand read…"*
   *
   * ⭐ Az asszisztens ezzel hívhatja a `ma stt transcript <messageId>`-t.
   * Elhagyható: hiánya = az üzenet nem válasz volt.
   */
  referencedMessageId?: string;
}

/** A kötegelő döntése: küldjünk-e most, és ha nem, miért nem. */
export interface DiscordFlushDecision {
  shouldFlush: boolean;
  /** Ember-olvasható indok — a naplóba és a diagnosztikába megy. */
  reason: string;
  pendingCount: number;
}

/** Egy kötegelt kiküldés eredménye. */
export interface DiscordFlushResult {
  /** Hány üzenetet vitt be ez a kiküldés. */
  deliveredCount: number;
  /**
   * Igaz, ha a CCAP SORBA TETTE (foglalt volt a session).
   *
   * 🔴 A SORBA ÁLLÍTÁS NEM KÉZBESÍTÉS — mérve 2026-09-07: öt így „kézbesített" owner-üzenet
   * soha nem érkezett meg a sessionbe. Ilyenkor a `deliveredCount` **0**, és a köteg
   * várakozó marad.
   */
  queued: boolean;
  /**
   * ⏳ A **LEGRÉGEBBI** üzenet kora a kézbesítés pillanatában *(23. tétel)*.
   *
   * 🔴 MIÉRT UTAZIK EL A NYUGTÁIG: az owner *„Átment N üzeneted"*-et **szállítási**
   * visszaigazolásnak olvasta, pedig a köteg **percekkel** korábbi beszédet visz be. ⇒ A
   * nyugta mostantól **kimondja**, mennyit várt — és ehhez ez a szám kell.
   *
   * ⚠️ `null` = ⛔ **nem mérhető** *(hibás időbélyeg)*. A 0 ⛔ nem ugyanaz: az azt állítaná,
   * hogy nem is várt.
   */
  oldestWaitMs: number | null;
  /** A ténylegesen elküldött prompt — naplózáshoz. */
  promptPreview: string;
  /** Ember-olvasható kiegészítés, ha a kiküldés nem a szokásos módon zárult. */
  detail?: string;
}

/** A kötegelő beállításai. */
export interface DiscordBatchConfig {
  /**
   * Összegyűjtési ablak: ennyi ideig VÁRUNK egy üzenet érkezése után, hátha jön még.
   * Owner-cél: minél több info EGY promptba.
   *
   * ## ⭐ MÉRVE 2026-09-11 06:10 — a 20 s-ot ez váltotta 30 s-ra
   *
   * > **Owner, 2026-09-11 02:28:** *„várjon legalább egy **másfél-két beszélgetés időnyit**"*
   *
   * Az élő naplóból **260** értékelhető szünet két megszólalás-kezdet között:
   *
   * | mérés | érték |
   * |---|---|
   * | median | **8 s** |
   * | p75 | **23 s** |
   * | p90 | 97 s |
   * | 20 s alatti szünet | 184/260 — **71%** |
   * | 30 s alatti szünet | 204/260 — **78%** |
   * | 45 s alatti szünet | 216/260 — 83% |
   *
   * ⇒ A **20 s pont a p75 ALATT** volt: az esetek **~29%-ában** a következő megszólalás az
   * ablak letelte UTÁN érkezett, tehát a köteg **idő előtt** ment ki.
   *
   * ⭐ **30 s**: átfogja a p75-öt *(78% vs 71%)*, +10 s késleltetés árán. ⛔ 45 s-ra nem mentünk:
   * onnan a haszon már csak +5 százalékpont, a késleltetés viszont további 15 s.
   *
   * ⚠️ **Ez az ablak NEM a „még beszél" eset megoldása** — az **valószínűségi**. A tényleges
   * védelem a `decideFlush` **megszólalás-kapuja** *(hetedik kapu)*, ami **tényt** néz.
   */
  collectWindowMs: number;
  /**
   * Biztonsági felső korlát: ennyi idő után akkor is küldünk, ha a session foglalt.
   * Enélkül egy hosszan futó session alatt az üzenetek korlátlanul állnának.
   */
  maxHoldMs: number;
}

/** Alapértékek — a `collectWindowMs` MÉRT érték, a `maxHoldMs` nagyvonalú. */
export const DEFAULT_BATCH_CONFIG: DiscordBatchConfig = {
  // ⭐ 2026-09-11: 20 000 → 30 000, mérésből (260 szünet, p75 = 23 s). L. a típus doksiját.
  collectWindowMs: 30_000,
  maxHoldMs: 15 * 60_000,
};

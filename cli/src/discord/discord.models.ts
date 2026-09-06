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
  /** Igaz, ha a CCAP sorba tette (foglalt volt a session). */
  queued: boolean;
  /** A ténylegesen elküldött prompt — naplózáshoz. */
  promptPreview: string;
}

/** A kötegelő beállításai. */
export interface DiscordBatchConfig {
  /**
   * Összegyűjtési ablak: ennyi ideig VÁRUNK egy üzenet érkezése után, hátha jön még.
   * Owner-cél: minél több info EGY promptba. Mérés alapján finomítandó.
   */
  collectWindowMs: number;
  /**
   * Biztonsági felső korlát: ennyi idő után akkor is küldünk, ha a session foglalt.
   * Enélkül egy hosszan futó session alatt az üzenetek korlátlanul állnának.
   */
  maxHoldMs: number;
}

/** Alapértékek — a `collectWindowMs` szándékosan rövid, a `maxHoldMs` nagyvonalú. */
export const DEFAULT_BATCH_CONFIG: DiscordBatchConfig = {
  collectWindowMs: 20_000,
  maxHoldMs: 15 * 60_000,
};

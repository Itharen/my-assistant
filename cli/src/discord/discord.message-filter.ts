// Bejövő Discord-üzenetek szűrése — TISZTA logika, Discord-kapcsolat nélkül tesztelhető.
//
// 🔴 Ez a biztonsági határ: eldönti, hogy egy üzenet EGYÁLTALÁN eljuthat-e a CC sessionbe.
// Bármi, ami átcsúszik itt, PROMPTKÉNT fut le nálam — ezért a szűrő ALAPÉRTELMEZÉSE az
// ELUTASÍTÁS, és minden elfogadási feltételt kifejezetten teljesíteni kell.
//
// Owner-előírás (2026-09-06): csak az owner üzenete jöhet, a dedikált csatornából.

/** A Discordtól kapott nyers üzenet — csak az a néhány mező, amit a döntéshez használunk. */
export interface IncomingDiscordMessage {
  messageId: string;
  channelId: string;
  authorId: string;
  authorName: string;
  /** Igaz, ha a küldő maga is bot (köztük a MI botunk). */
  isFromBot: boolean;
  content: string;
}

export interface MessageFilterConfig {
  /** A dedikált csatorna, ahol az ownerrel beszélgetünk. */
  allowedChannelId: string;
  /** Az owner Discord felhasználó-azonosítója. */
  allowedAuthorId: string;
}

export interface MessageFilterVerdict {
  accepted: boolean;
  /** Miért — naplózáshoz. Elutasításnál KÖTELEZŐEN kitöltött. */
  reason: string;
}

/**
 * Eldönti, feldolgozzuk-e az üzenetet.
 *
 * A sorrend szándékos: előbb a konfigurációs hiányt jelezzük (különben a „rossz csatorna"
 * üzenet félrevezetne), aztán a küldő-alapú szűrést, végül a tartalmat.
 */
export function filterIncomingMessage(
  message: IncomingDiscordMessage,
  config: MessageFilterConfig,
): MessageFilterVerdict {
  if (!config.allowedChannelId || !config.allowedAuthorId) {
    return {
      accepted: false,
      reason: 'Hiányos konfiguráció: nincs megadva a csatorna vagy az owner azonosítója. '
        + 'Amíg ez hiányzik, SEMMIT nem fogadunk el.',
    };
  }

  // A saját botunk üzenetei is idetartoznak — enélkül visszhang-hurokba futnánk:
  // válaszolunk → a válaszunkat üzenetként látjuk → újra feldolgozzuk.
  if (message.isFromBot) {
    return { accepted: false, reason: 'Bot küldte (köztük a sajátunk) — visszhang-hurok elkerülése.' };
  }

  if (message.channelId !== config.allowedChannelId) {
    return {
      accepted: false,
      reason: `Nem a dedikált csatornából jött (${message.channelId}).`,
    };
  }

  if (message.authorId !== config.allowedAuthorId) {
    return {
      accepted: false,
      reason: `Nem az owner küldte (${message.authorName || message.authorId}).`,
    };
  }

  if (message.content.trim().length === 0) {
    return { accepted: false, reason: 'Üres üzenet (pl. csak csatolmány) — nincs mit átadni.' };
  }

  return { accepted: true, reason: 'Owner üzenete a dedikált csatornából.' };
}

/** A szűrő konfigurációja környezeti változókból. Hiányzó érték üres sztring. */
export function readMessageFilterConfig(): MessageFilterConfig {
  return {
    allowedChannelId: (process.env['MA_DISCORD_CHANNEL_ID'] ?? '').trim(),
    allowedAuthorId: (process.env['MA_DISCORD_USER_ID'] ?? '').trim(),
  };
}

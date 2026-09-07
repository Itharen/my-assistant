// Bejövő Discord-üzenetek szűrése — TISZTA logika, Discord-kapcsolat nélkül tesztelhető.
//
// 🔴 Ez a biztonsági határ: eldönti, hogy egy üzenet EGYÁLTALÁN eljuthat-e a CC sessionbe.
// Bármi, ami átcsúszik itt, PROMPTKÉNT fut le nálam — ezért a szűrő ALAPÉRTELMEZÉSE az
// ELUTASÍTÁS, és minden elfogadási feltételt kifejezetten teljesíteni kell.
//
// Owner-előírás (2026-09-06): csak az owner üzenete jöhet, a dedikált csatornából.

import { isAudioAttachment, type DiscordAttachment } from './discord.voice-message.js';

/** A Discordtól kapott nyers üzenet — csak az a néhány mező, amit a döntéshez használunk. */
export interface IncomingDiscordMessage {
  messageId: string;
  channelId: string;
  authorId: string;
  authorName: string;
  /** Igaz, ha a küldő maga is bot (köztük a MI botunk). */
  isFromBot: boolean;
  content: string;
  /**
   * A csatolmányok.
   *
   * 🔴 A Discord HANGÜZENETE üres `content`-tel érkezik — a hang egy csatolmány. E mező
   * nélkül a szűrő „üres üzenetnek" látta és **eldobta** őket (mérve 2026-09-07).
   * Elhagyható, hogy a régi hívók ne törjenek el; hiánya = nincs csatolmány.
   */
  attachments?: DiscordAttachment[];
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
  /** Igaz, ha az üzenet HANGOT tartalmaz — ilyenkor STT + tükör-üzenet következik. */
  hasAudio?: boolean;
  /** Igaz, ha NEM-hang csatolmány érkezett — ilyenkor az inboxba mentés következik. */
  hasFiles?: boolean;
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

  const hasText: boolean = message.content.trim().length > 0;
  const hasAudio: boolean = (message.attachments ?? []).some(isAudioAttachment);

  // ⭐ A HANGÜZENET is tartalom, csak nem szöveg. Enélkül némán elveszne (mérve 2026-09-07).
  if (hasAudio) {
    return {
      accepted: true,
      reason: hasText
        ? 'Owner hangüzenete kísérő szöveggel, a dedikált csatornából.'
        : 'Owner hangüzenete a dedikált csatornából.',
      hasAudio: true,
    };
  }

  // 📥 CSATOLMÁNY szöveg nélkül. ⭐ 2026-09-07-ig ELUTASÍTOTTUK — az owner rádobott egy fájlt,
  // és az némán elveszett volna. A fájlt LEMENTJÜK (`discord.file-intake.ts`), a hivatkozását
  // pedig a figyelő fűzi az üzenethez; a szűrőnek innentől csak át kell engednie.
  const hasFiles: boolean = (message.attachments ?? []).length > 0;

  if (!hasText && hasFiles) {
    return {
      accepted: true,
      reason: 'Owner csatolmánya szöveg nélkül — az inboxba mentjük.',
      hasFiles: true,
    };
  }

  if (!hasText) {
    return { accepted: false, reason: 'Üres üzenet — nincs mit átadni.' };
  }

  if (hasFiles) {
    return { accepted: true, reason: 'Owner üzenete csatolmánnyal.', hasFiles: true };
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

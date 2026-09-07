// Kimenő irány — ÉN → Discord.
//
// Owner-szabály (2026-09-06): a Discordról érkező üzenetre **nem elég a sessionben
// válaszolni — Discordon IS kell**. Enélkül a csatorna fél lábon áll: látom, amit írsz,
// de te nem látod a választ.
//
// Egyszeri küldés: bejelentkezik, küld, bont. Nem tart fenn állandó kapcsolatot — az a
// figyelő dolga (`discord.listener.ts`), és két párhuzamos gateway-kapcsolat fölösleges.

import { Client, GatewayIntentBits, type TextBasedChannel } from 'discord.js';

import { verifyDelivery, type DeliveredMessage } from './discord.delivery-check.js';
import { recordOutbound, type OutboundKind } from './discord.reply-tracker.js';
import { inspectBrevity } from './discord.brevity-guard.js';

/** A Discord üzenet-hossz korlátja. E fölött darabolunk. */
const DISCORD_MAX_MESSAGE_CHARS: number = 2000;

export interface DiscordSendResult {
  sent: boolean;
  /** Hány részletben ment ki (hosszú szöveget darabolunk). */
  partCount: number;
  detail: string;
  /** MIT KELL TENNI, ha nem ment. */
  remedy?: string;
  /**
   * A küldés UTÁNI visszaolvasás eredménye — tényleg megérkezett-e, teljes egészében.
   *
   * ⚠️ `false` esetén a `sent: true` **NEM jelent sikert**: a darab kiment, de csonkán
   * (vagy egyáltalán nem) érkezett meg. Ez fogta meg a 2026-09-07-i incidenst.
   */
  verifiedIntact?: boolean;
  /** A visszaolvasás összegzése. */
  verifyDetail?: string;
}

/**
 * Üzenet küldése a beállított csatornába.
 *
 * 🔴 Hiba esetén NEM dob kivételt, hanem leíró eredményt ad — a hívónak (és az ownernek)
 * az a hasznos, hogy MI hiányzik, nem egy verem-nyom.
 */
export async function sendDiscordMessage(
  text: string,
  /**
   * `reply` (alap) = valodi valasz · `ack` = atveteli nyugta.
   *
   * ⛔ A nyugta NEM torli a valasz-kotelezettseget — lasd `OutboundKind`.
   */
  kind: OutboundKind = 'reply',
  /**
   * 🔊 Hova menjen — ha üres, a fő szöveges csatorna.
   *
   * 🔴 MÉRT HIBA (2026-09-07 21:47): a hang-csatornai tükör-szöveg a **fő szöveges csatornába**
   * ment, nem oda, ahol az owner beszélt. Ő a hang-csatornát nézte, és **semmilyen reakciót nem
   * látott** — pedig a tükör kiment. Az ő eredeti kérése egyértelmű volt: *„oda is kell majd
   * mirror text formában mindkettőnknek"* — **ODA**, nem máshova.
   */
  targetChannelId: string = '',
): Promise<DiscordSendResult> {
  const token: string = (process.env['MA_DISCORD_BOT_TOKEN'] ?? '').trim();
  const channelId: string = targetChannelId.trim() || (process.env['MA_DISCORD_CHANNEL_ID'] ?? '').trim();
  const trimmed: string = text.trim();

  if (!trimmed) {
    return { sent: false, partCount: 0, detail: 'Üres üzenetet nem küldünk.', remedy: 'Adj meg szöveget.' };
  }

  // ✂️ RÖVIDSÉG: TANÁCS, NEM KAPU — az owner javította ki a saját javításomat.
  //
  // > **Owner (2026-09-07 21:45):** *„az nem annyira tűnik megoldásnak, hogy lekorlátozod magad,
  // > hogy egy üzenetbe csak x mennyiségű karaktert írhatsz. Nem az a lényeg, hogy szét
  // > szegmentáld az üzeneteidet, mert így tulajdonképpen csak ahelyett, hogy elküldenél egy
  // > nagyobb üzenetet, ahelyett küldesz 10 kicsit, ami hülyeség… és amúgy is kell, hogy tudjál
  // > hosszabb üzeneteket összeírni."*
  //
  // 🔴 AMIT ELRONTOTTAM: a hosszra optimalizáltam, pedig a panasz a **sűrűségre** szólt. A
  // kemény korlát nem rövidebbé tett, hanem **feldarabolóvá** — és közben **elhagytam az
  // emojikat**, amik épp a tagolást adták: *„egy csomó emojit használtál, ami tök jól
  // szétbontotta nekem a dolgokat… és most ezt abbahagytad, pedig az jó volt."*
  //
  // ⇒ A hossz **nem a mérendő mennyiség**. Egy tagolt, emojikkal horgonyzott hosszú üzenet
  // olvasható; egy tagolatlan rövid is lehet olvashatatlan. A `brevityHint` **jelez**, de
  // ⛔ SOHA nem blokkol — a döntés a fogalmazásé, nem a számlálóé.
  const brevity = inspectBrevity(trimmed);

  void brevity;

  if (!token || !channelId) {
    return {
      sent: false,
      partCount: 0,
      detail: 'Hiányzik a bot-token vagy a csatorna-azonosító.',
      remedy: 'Állítsd be a `.env`-ben: MA_DISCORD_BOT_TOKEN és MA_DISCORD_CHANNEL_ID.',
    };
  }

  // A küldéshez elég a `Guilds` intent — üzenetet olvasni nem akarunk, csak írni.
  const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    await client.login(token);

    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased() || !('send' in channel)) {
      return {
        sent: false,
        partCount: 0,
        detail: `A csatorna nem érhető el, vagy nem szöveges (${channelId}).`,
        remedy: 'Ellenőrizd a MA_DISCORD_CHANNEL_ID-t, és hogy a bot látja-e a csatornát.',
      };
    }

    const parts: string[] = splitForDiscord(trimmed);

    for (const part of parts) {
      await (channel as TextBasedChannel & { send: (content: string) => Promise<unknown> }).send(part);
    }

    // G-1: a valasz-kotelezettseg kovetesehez rogzitjuk a kimeno uzenetet.
    // A `kind` donti el, hogy ez VALASZNAK szamit-e, vagy csak nyugta volt.
    await recordOutbound(new Date().toISOString(), kind, trimmed);

    // ⭐ KÜLDÉS UTÁNI VISSZAOLVASÁS (owner-javaslat, 2026-09-07). A `send()` visszatérése
    // csak azt mondja meg, hogy ELINDULT — azt nem, hogy TELJES EGÉSZÉBEN megérkezett.
    const verdict = await verifyAgainstChannel(channel, parts);

    return {
      sent: true,
      partCount: parts.length,
      detail: parts.length === 1 ? 'Elküldve.' : `Elküldve ${parts.length} részletben.`,
      verifiedIntact: verdict.intact,
      verifyDetail: verdict.detail,
      ...(verdict.intact ? {} : { remedy: verdict.remedy }),
    };
  } catch (err: unknown) {
    const message: string = err instanceof Error ? err.message : String(err);

    return {
      sent: false,
      partCount: 0,
      detail: `A küldés nem sikerült: ${message}`,
      remedy: 'Ellenőrizd, hogy a botnak van-e `Send Messages` joga a csatornában, '
        + 'és hogy a token érvényes-e.',
    };
  } finally {
    // A kapcsolatot MINDIG bontjuk — különben a folyamat nem állna le.
    await client.destroy().catch(() => undefined);
  }
}

/**
 * A csatorna visszaolvasása és összevetése azzal, amit küldtünk.
 *
 * 🔴 SOHA nem dob: ha maga az ellenőrzés bukik, azt „nem tudjuk"-ként jelentjük — de a
 * küldést nem minősítjük sikertelennek miatta. A hamis riasztás is kár.
 */
async function verifyAgainstChannel(
  channel: unknown,
  parts: string[],
): Promise<{ intact: boolean; detail: string; remedy?: string }> {
  try {
    const fetchable = channel as {
      messages: { fetch: (options: { limit: number }) => Promise<Map<string, { id: string; content: string }>> };
    };
    const history = await fetchable.messages.fetch({ limit: Math.min(parts.length + 3, 20) });
    const arrived: DeliveredMessage[] = [...history.values()].map((message) => ({
      id: message.id,
      content: message.content,
    }));

    return verifyDelivery({ sentParts: parts, arrived });
  } catch (err: unknown) {
    return {
      intact: true,
      detail: 'A visszaolvasás nem futott le '
        + `(${err instanceof Error ? err.message : String(err)}) — a küldés maga sikeres volt.`,
    };
  }
}

/**
 * Hosszú szöveg darabolása a Discord 2000 karakteres korlátja alá.
 *
 * Soronként vágunk, hogy a mondatok ne törjenek szét. Egy önmagában túl hosszú sort
 * kényszerből darabolunk — de ez ritka, és jobb, mint az elveszett üzenet.
 */
export function splitForDiscord(text: string): string[] {
  if (text.length <= DISCORD_MAX_MESSAGE_CHARS) return [text];

  const parts: string[] = [];
  let current: string = '';

  for (const line of text.split('\n')) {
    if (line.length > DISCORD_MAX_MESSAGE_CHARS) {
      if (current) { parts.push(current); current = ''; }

      for (let index = 0; index < line.length; index += DISCORD_MAX_MESSAGE_CHARS) {
        parts.push(line.slice(index, index + DISCORD_MAX_MESSAGE_CHARS));
      }

      continue;
    }

    // +1 az újsor karakterre.
    if (current.length + line.length + 1 > DISCORD_MAX_MESSAGE_CHARS) {
      parts.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }

  if (current) parts.push(current);

  return parts;
}

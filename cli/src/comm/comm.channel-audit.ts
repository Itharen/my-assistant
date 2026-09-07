// 🔎 CSATORNA-ELLENŐRZÉS — a Discordot magát kérdezzük meg, nem a saját nyilvántartásunkat.
//
// > **Owner (2026-09-07):** *„vissza kéne olvasd a discord üzeneteket időnként amíg nem
// > százas az eszközünk ami neked küldi."*
//
// 🔴 MIÉRT KELL EZ A `comm history` MELLÉ — ez a lényegi különbség:
//
//   `comm history`  → a SAJÁT tárainkat olvassa vissza *(köteg + archívum + kimenő)*
//   `comm audit`    → a **DISCORD CSATORNÁT** kérdezi le, és **összeveti** a sajátunkkal
//
// ⭐ A saját nyilvántartás visszaolvasása **nem bizonyít semmit**, ha maga a rögzítés hibás.
// Ha a figyelő állt, ha a szűrő félredobott, ha a bot nem látta az üzenetet — a saját
// tárunkban **ugyanaz a hiány** lesz, mint a valóságban, csak épp nem tűnik fel. Az egyetlen
// független forrás a **csatorna**.
//
// ⛔ Ez CSAK OLVAS. Nem tesz kötegbe, nem küld, nem töröl — a leletet a hívó dolga eldönteni.

import { Client, GatewayIntentBits, type Message, type TextBasedChannel } from 'discord.js';

import { resolveDiscordBatchPaths } from '../discord/discord.batch-store.js';
import { readJsonlSafe } from './comm.history.js';

/** Ennyi üzenetet nézünk vissza a csatornából. */
export const AUDIT_LIMIT: number = 100;

/** Egy üzenet, ami a Discordon MEGVAN, de a mi tárainkban NINCS. */
export interface MissingMessage {
  messageId: string;
  at: string;
  authorName: string;
  /** Az első sor — hogy ránézésre kiderüljön, mit hagytunk ki. */
  preview: string;
  /** Volt-e csatolmánya *(hangüzenet is ide tartozik)*. */
  hasAttachment: boolean;
}

export interface ChannelAuditReport {
  ok: boolean;
  /** Hány owner-üzenetet látott a csatornán az ellenőrzés. */
  scanned: number;
  /** Amit a saját tárainkban NEM találtunk meg. */
  missing: MissingMessage[];
  detail: string;
  remedy?: string;
}

/**
 * A csatorna visszaolvasása és összevetése a saját tárainkkal.
 *
 * 🔴 Hibát NEM dob: egy sikertelen ellenőrzés nem akaszthatja meg a kört. A `ok: false`
 * eredmény **kimondja**, hogy nem tudtuk megnézni — ⛔ soha nem hallgatunk arról, hogy az
 * ellenőrzés maga bukott. Az „nem találtam hiányt" és a „nem tudtam megnézni" nagyon nem
 * ugyanaz, és pont ez a különbség vész el a legkönnyebben.
 */
export async function auditDiscordChannel(limit: number = AUDIT_LIMIT): Promise<ChannelAuditReport> {
  const token: string = (process.env['MA_DISCORD_BOT_TOKEN'] ?? '').trim();
  const channelId: string = (process.env['MA_DISCORD_CHANNEL_ID'] ?? '').trim();
  const ownerId: string = (process.env['MA_DISCORD_USER_ID'] ?? '').trim();

  if (!token || !channelId || !ownerId) {
    return {
      ok: false,
      scanned: 0,
      missing: [],
      detail: 'Hiányzik a bot-token, a csatorna- vagy az owner-azonosító.',
      remedy: 'Állítsd be a `.env`-ben: MA_DISCORD_BOT_TOKEN, MA_DISCORD_CHANNEL_ID, MA_DISCORD_USER_ID.',
    };
  }

  const knownIds: Set<string> = await readKnownMessageIds();
  // ⚠️ A `MessageContent` privilegizált jog — enélkül üres törzset kapnánk, és MINDEN üzenet
  // „hiányosnak" látszana. A figyelő ugyanezt a négyest kéri.
  const client: Client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  try {
    await client.login(token);

    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased() || !('messages' in channel)) {
      return {
        ok: false,
        scanned: 0,
        missing: [],
        detail: `A csatorna nem érhető el, vagy nem szöveges (${channelId}).`,
        remedy: 'Ellenőrizd a MA_DISCORD_CHANNEL_ID-t, és hogy a bot látja-e a csatornát.',
      };
    }

    const history = await (channel as TextBasedChannel & {
      messages: { fetch: (options: { limit: number }) => Promise<Map<string, Message>> };
    }).messages.fetch({ limit: limit });

    const missing: MissingMessage[] = [];
    let scanned: number = 0;

    for (const message of history.values()) {
      // ⛔ Csak az OWNER üzenetei érdekelnek: a sajátunkat sosem tettük kötegbe, tehát a
      // hiányuk nem hiba lenne, hanem a normál működés — és elárasztaná a leletet.
      if (message.author.id !== ownerId) continue;

      scanned += 1;

      if (knownIds.has(message.id)) continue;

      missing.push({
        messageId: message.id,
        at: new Date(message.createdTimestamp).toISOString(),
        authorName: message.author.username,
        preview: previewOf(message),
        hasAttachment: message.attachments.size > 0,
      });
    }

    missing.sort((a, b) => a.at.localeCompare(b.at));

    return {
      ok: true,
      scanned: scanned,
      missing: missing,
      detail: missing.length === 0
        ? `${scanned} owner-üzenet a csatornán, mind megvan nálunk.`
        : `🔴 ${missing.length} owner-üzenet van a csatornán, ami NÁLUNK NINCS MEG (${scanned} átnézve).`,
      ...(missing.length > 0
        ? {
          remedy: 'Olvasd el őket alább, és kezeld a tartalmukat. Ha ismétlődik, a figyelő '
            + 'vagy a szűrő hibás — nézd meg: `ma comm doctor`.',
        }
        : {}),
    };
  } catch (err: unknown) {
    return {
      ok: false,
      scanned: 0,
      missing: [],
      detail: `A csatorna lekérdezése elbukott — ${err instanceof Error ? err.message : String(err)}`,
      remedy: 'Ellenőrizd a bot-tokent és a hálózatot. ⚠️ Ez NEM azt jelenti, hogy nincs hiány '
        + '— azt jelenti, hogy nem tudtuk megnézni.',
    };
  } finally {
    await client.destroy().catch(() => undefined);
  }
}

/**
 * Minden üzenet-azonosító, amit MÁR ismerünk — a kötegből ÉS az archívumból.
 *
 * ⚠️ MINDKETTŐ kell: az archívum a bejuttatottakat tartja, a köteg a még várakozókat.
 * Csak az egyiket nézve a másik halmaz **hamisan hiányzónak** látszana.
 */
async function readKnownMessageIds(): Promise<Set<string>> {
  const paths = resolveDiscordBatchPaths();
  const ids: Set<string> = new Set();

  for (const file of [paths.archiveFile, paths.pendingFile]) {
    for (const entry of await readJsonlSafe(file)) {
      const id: unknown = entry['messageId'];

      if (typeof id === 'string' && id) ids.add(id);
    }
  }

  return ids;
}

/** Az üzenet rövid előnézete — hangüzenetnél a csatolmány tényét mondjuk meg. */
function previewOf(message: Message): string {
  const text: string = message.content.trim();

  if (text) return text.length > 120 ? `${text.slice(0, 120)}…` : text;

  if (message.attachments.size > 0) {
    const first = [...message.attachments.values()][0];

    return `*(nincs szöveg — csatolmány: ${first?.name ?? 'ismeretlen'})*`;
  }

  return '*(üres)*';
}

/**
 * Ember-olvasható lelet.
 *
 * ⛔ TÁBLÁZAT NÉLKÜL — a Discord nem rendereli (owner, 2026-09-07).
 */
export function formatChannelAudit(report: ChannelAuditReport): string {
  const lines: string[] = [];

  if (!report.ok) {
    lines.push(`⚠️ NEM TUDTAM MEGNÉZNI — ${report.detail}`);
    if (report.remedy) lines.push(`→ ${report.remedy}`);

    return lines.join('\n');
  }

  lines.push(report.missing.length === 0 ? `✅ ${report.detail}` : report.detail);

  for (const entry of report.missing) {
    const mark: string = entry.hasAttachment ? '🎙️' : '🔴';

    lines.push(`${mark} ${entry.at.slice(5, 16).replace('T', ' ')} — ${entry.preview}`);
  }

  if (report.remedy) lines.push(`→ ${report.remedy}`);

  return lines.join('\n');
}

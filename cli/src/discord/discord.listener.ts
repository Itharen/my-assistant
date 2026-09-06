// Discord-figyelő — a SAJÁT botunk kapcsolata (owner-döntés 2026-09-06: saját bot, saját kezelés).
//
// A felelőssége szándékosan szűk:
//   Discord-üzenet  →  szűrés  →  a KÖTEGBE tétel.
//
// ⛔ Innen SEMMI nem megy közvetlenül a CC sessionbe. A bejuttatás a kötegelőn és a CCAP
// hivatalos `prompt` végpontján át történik (`DiscordBridge`) — így az owner „a CCAP nem
// kerülhető meg" előírása szerkezetileg is teljesül, nem csak jó szándékból.
//
// ⚠️ A tényleges gateway-kapcsolat CSAK élő bot-tokennel próbálható ki. Ami token nélkül is
// ellenőrizhető — a szűrés és a hiányzó konfiguráció kezelése —, az egységtesztelt.

import { Client, Events, GatewayIntentBits, Partials, type Message } from 'discord.js';

import { logAction } from '../action-log/action-log.client.js';
import { DiscordBridge } from './discord.bridge.js';
import { HEARTBEAT_INTERVAL_MS, writeHeartbeat } from './discord.heartbeat.js';
import { checkReplyObligation } from './discord.reply-tracker.js';
import { TypingIndicator } from './discord.typing-indicator.js';
import {
  filterIncomingMessage,
  readMessageFilterConfig,
  type IncomingDiscordMessage,
  type MessageFilterConfig,
} from './discord.message-filter.js';

/**
 * Milyen sűrűn nézzük meg, hogy a köteg kiküldhető-e.
 *
 * 🔴 MÉRT HIÁNY (2026-09-06): eddig a figyelő CSAK gyűjtött — a kiküldést kézi
 * `ma comm flush` végezte. Így az owner üzenete a köteg-fájlban maradt, és kívülről
 * pontosan úgy nézett ki, mintha meg sem érkezett volna. A csatorna nem lehet
 * „mindig élő", ha az utolsó lépéshez ember kell.
 */
const FLUSH_TICK_MS: number = 15_000;

/** Ismétlődő kiküldési hibából legfeljebb ennyente naplózunk egyet — ne fulladjon a napló. */
const FLUSH_ERROR_LOG_INTERVAL_MS: number = 5 * 60_000;

/** Ennyi korábbi üzenetet nézünk át induláskor. */
const BACKFILL_LIMIT: number = 50;

/**
 * Ennél régebbi üzenetet NEM veszünk fel a visszamenőleges beolvasásnál.
 *
 * 🔴 MÉRT OK (2026-09-06): időkorlát nélkül az első indítás **8 db, 4,5 hónapos** üzenetet
 * húzott be egy korábbi integrációból, és ezeket egyetlen promptként rám zúdította volna.
 * A backfill célja a **leállás alatt kimaradt** üzenetek pótlása — nem a csatorna
 * történelmének újrajátszása.
 */
const BACKFILL_MAX_AGE_MS: number = 12 * 60 * 60_000;

/** Discord-üzenet → a saját, szűk adatszerkezetünk. Egy helyen, hogy ne csússzon szét. */
function toIncoming(message: Message): IncomingDiscordMessage {
  return {
    messageId: message.id,
    channelId: message.channelId,
    authorId: message.author.id,
    authorName: message.author.username,
    isFromBot: message.author.bot,
    content: message.content,
  };
}

export interface DiscordListenerStartResult {
  started: boolean;
  /** Ember-olvasható állapot — a hívó ezt írja ki. */
  detail: string;
  /** MIT KELL TENNI, ha nem indult el. */
  remedy?: string;
}

export class DiscordListener {

  private client: Client | null = null;

  /** Az életjel-időzítő, hogy a leállításnál el tudjuk engedni. */
  private heartbeatTimer: NodeJS.Timeout | null = null;

  /** Hány üzenetet dolgoztunk fel az indulás óta — az életjelbe kerül. */
  private processedCount: number = 0;

  /** A kiküldési kör időzítője. */
  private flushTimer: NodeJS.Timeout | null = null;

  /** A „gépel…" visszajelzés karbantartója. */
  private typing: TypingIndicator | null = null;

  /** Mikor naplóztunk utoljára kiküldési hibát — a napló-elárasztás ellen. */
  private lastFlushErrorLoggedAt: number = 0;

  /**
   * Fut-e ÉPP egy kiküldés.
   *
   * 🔴 MIÉRT KELL: a `setInterval` nem várja meg az előző kört. Ha a CCAP lassan válaszol
   * (>15 mp), két kiküldés futna EGYSZERRE — mindkettő ugyanazt a köteget olvasná és
   * ELKÜLDENÉ, majd mindkettő véglegesítene. Az owner ugyanazt az üzenetet kapná kétszer,
   * és a köteg elejéről a duplájat törölnénk — vagyis üzenet is VESZHETNE.
   */
  private flushInFlight: boolean = false;

  constructor(private readonly bridge: DiscordBridge = new DiscordBridge()) {}

  /**
   * Csatlakozás és figyelés indítása.
   *
   * 🔴 Hiányzó konfigurációnál NEM dobunk kivételt, hanem leíró eredményt adunk vissza:
   * a hívó (és az owner) számára az a hasznos, hogy MI hiányzik, nem egy verem-nyom.
   */
  async start(): Promise<DiscordListenerStartResult> {
    const token: string = (process.env['MA_DISCORD_BOT_TOKEN'] ?? '').trim();
    const config: MessageFilterConfig = readMessageFilterConfig();

    if (!token) {
      return {
        started: false,
        detail: 'Nincs bot-token (MA_DISCORD_BOT_TOKEN).',
        remedy: 'Developer Portal → Bot → Reset Token, majd a `.env`-be. '
          + 'Lépések: __documentations/dev/DISCORD_BOT_SETUP.md',
      };
    }

    if (!config.allowedChannelId || !config.allowedAuthorId) {
      return {
        started: false,
        detail: 'Hiányzik a csatorna- vagy az owner-azonosító.',
        remedy: 'Állítsd be a `.env`-ben: MA_DISCORD_CHANNEL_ID és MA_DISCORD_USER_ID. '
          + 'Enélkül nem tudnánk kiszűrni, hogy csak az owner üzenetét fogadjuk el.',
      };
    }

    // A MessageContent privilegizált jog — ha a portálon nincs bekapcsolva, a kapcsolat
    // `4014` záró-kóddal bomlik le. A hibaüzenet erre külön figyelmeztet.
    //
    // 🔴 PRIVÁT ÜZENET (DM) TÁMOGATÁS (owner, 2026-09-06: „a channel az egy private message
    // channel kéne legyen"): a DM-ekhez KÜLÖN intent kell (`DirectMessages`) — a
    // `GuildMessages` NEM fedi le. Ráadásul a DM-csatorna gyakran nincs a gyorsítótárban,
    // amikor az üzenet megérkezik, ezért a `Partials.Channel` is KELL, különben a discord.js
    // egyszerűen ELDOBJA az eseményt, és úgy tűnne, mintha nem is írtál volna.
    const client: Client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message],
    });

    // 🔴 A `handleMessage` SOHA nem utasíthat el ígéretet: `void`-olt hívás, tehát egy
    // kiszökő hiba `unhandledRejection` lenne → a globális kezelő `process.exit(1)`-et hív,
    // és ezzel a FIGYELŐ MEGHALNA. Egy „mindig élő" csatornánál ez elfogadhatatlan, ezért
    // a hívás itt is védve van, a `handleMessage` pedig belül is elnyeli a saját hibáit.
    client.on(Events.MessageCreate, (message: Message) => {
      void this.handleMessage(message, config).catch((err: unknown) => {
        process.stderr.write(
          `[discord/listener] váratlan hiba az üzenet-feldolgozásban: `
          + `${err instanceof Error ? err.stack ?? err.message : String(err)}\n`,
        );
      });
    });

    try {
      await client.login(token);
    } catch (err: unknown) {
      const message: string = err instanceof Error ? err.message : String(err);

      return {
        started: false,
        detail: `A bejelentkezés nem sikerült: ${message}`,
        remedy: message.includes('4014') || message.toLowerCase().includes('intent')
          ? 'A Developer Portalon kapcsold BE a MESSAGE CONTENT INTENT-et (Bot fül).'
          : 'Ellenőrizd a tokent és a hálózatot. Részletek: __documentations/dev/DISCORD_BOT_SETUP.md',
      };
    }

    this.client = client;

    // 🔴 Életjel: enélkül a figyelő csendben elhalhatna, és kívülről pontosan úgy nézne ki,
    // mintha az owner nem írt volna. (A jelenlét-figyelő 112 napig volt így halott.)
    const botTag: string = client.user?.tag ?? 'ismeretlen';

    await this.beat(botTag);
    this.heartbeatTimer = setInterval(() => {
      void this.beat(botTag);
    }, HEARTBEAT_INTERVAL_MS);
    // Az időzítő ne tartsa életben a folyamatot, ha minden más leállt.
    this.heartbeatTimer.unref();

    // 🔴 VISSZAMENŐLEGES BEOLVASÁS: a Discord NEM küldi újra azt, ami akkor érkezett, amikor
    // nem voltunk csatlakozva. Enélkül minden üzenet ELVESZNE, amit a figyelő leállása alatt
    // írsz — és kívülről ez pontosan úgy nézne ki, mintha nem is írtál volna.
    const backfilled: number = await this.backfill(client, config);

    // A kiküldés ETTŐL a körtől automatikus — enélkül a köteg addig állna, amíg valaki
    // kézzel le nem futtatja a `ma comm flush`-t.
    this.startFlushLoop();

    // „Gépel…" visszajelzés, hogy a várakozás ne tűnjön halott csatornának (owner-kérés).
    this.startTypingIndicator(client, config);

    return {
      started: true,
      detail: `Csatlakozva mint ${botTag}.`
        + (backfilled > 0 ? ` ${backfilled} korábbi üzenet pótlólag beolvasva.` : ''),
    };
  }

  /** Kapcsolat bontása — a hívó életciklusának végén. */
  async stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.typing?.stop();
    this.typing = null;

    if (!this.client) return;

    await this.client.destroy();
    this.client = null;
  }

  /**
   * Egy beérkezett üzenet feldolgozása: szűrés, majd kötegbe tétel.
   *
   * Az elutasítást is naplózzuk — enélkül egy rosszul beállított azonosító némán elnyelné
   * az owner üzeneteit, és az a leglassabban észrevehető hibafajta.
   */
  private async handleMessage(message: Message, config: MessageFilterConfig): Promise<void> {
    const incoming: IncomingDiscordMessage = toIncoming(message);
    const verdict = filterIncomingMessage(incoming, config);

    if (!verdict.accepted) {
      // A saját botunk visszhangját nem naplózzuk — az normál működés, csak zajt csinálna.
      if (!incoming.isFromBot) {
        await this.safeLog({
          kind: 'note',
          summary: `[discord/listener] Üzenet elutasítva — ${verdict.reason}`,
          extra: { code: 'MA-DISCORD-MESSAGE-REJECTED', messageId: incoming.messageId },
        });
      }

      return;
    }

    try {
      const isNew: boolean = await this.bridge.enqueue({
        messageId: incoming.messageId,
        authorId: incoming.authorId,
        authorName: incoming.authorName,
        channelId: incoming.channelId,
        content: incoming.content,
        receivedAt: new Date().toISOString(),
      });

      this.processedCount += 1;
      await this.beat(this.client?.user?.tag ?? '');
      await this.safeLog({
        kind: 'note',
        summary: isNew
          ? `[discord/listener] Üzenet kötegbe téve (${incoming.content.length} karakter).`
          : '[discord/listener] Duplikátum — a Discord újraküldte ugyanazt az eseményt.',
        extra: { code: 'MA-DISCORD-MESSAGE-QUEUED', messageId: incoming.messageId, isNew },
      });
    } catch (err: unknown) {
      // 🔴 Itt NEM nyelünk el semmit: ha a kötegbe tétel bukik, az üzenet elveszne.
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-DISCORD-ENQUEUE-FAILED: az üzenet NEM került a kötegbe — '
          + `${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-DISCORD-ENQUEUE-FAILED', messageId: incoming.messageId },
      });
    }
  }

  /**
   * A leállás alatt érkezett üzenetek pótlólagos beolvasása.
   *
   * A `Read Message History` jogosultsággal elkérjük a csatorna utolsó üzeneteit, és a
   * szűrőn átmenőket kötegbe tesszük — kihagyva azt, amit **már kézbesítettünk**
   * (`hasBeenDelivered`), különben minden indítás megismételné a régi üzeneteket.
   *
   * Hibát SOHA nem dob: ha a beolvasás nem megy, a figyelő attól még fusson tovább.
   *
   * @returns hány üzenetet pótoltunk.
   */
  private async backfill(client: Client, config: MessageFilterConfig): Promise<number> {
    try {
      const channel = await client.channels.fetch(config.allowedChannelId);

      if (!channel || !channel.isTextBased()) return 0;

      const history = await channel.messages.fetch({ limit: BACKFILL_LIMIT });
      // A Discord újtól régi felé ad; nekünk időrendben kell.
      const ordered: Message[] = [...history.values()].reverse();
      let added: number = 0;

      const oldestAcceptedMs: number = Date.now() - BACKFILL_MAX_AGE_MS;

      for (const message of ordered) {
        // Régi üzenet: a backfill nem történelem-visszajátszás.
        if (message.createdTimestamp < oldestAcceptedMs) continue;

        const incoming: IncomingDiscordMessage = toIncoming(message);

        if (!filterIncomingMessage(incoming, config).accepted) continue;
        if (await this.bridge.getStore().hasBeenDelivered(incoming.messageId)) continue;

        const isNew: boolean = await this.bridge.enqueue({
          ...incoming,
          receivedAt: new Date(message.createdTimestamp).toISOString(),
        });

        if (isNew) added += 1;
      }

      if (added > 0) {
        await this.safeLog({
          kind: 'note',
          summary: `[discord/listener] ${added} korábbi üzenet pótlólag beolvasva (a leállás alatt érkeztek).`,
          extra: { code: 'MA-DISCORD-BACKFILL', added },
        });
      }

      return added;
    } catch (err: unknown) {
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-DISCORD-BACKFILL-FAILED: a korábbi üzenetek beolvasása '
          + `nem sikerült — ${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-DISCORD-BACKFILL-FAILED' },
      });

      return 0;
    }
  }

  /** Az automatikus kiküldési kör indítása. */
  private startFlushLoop(): void {
    this.flushTimer = setInterval((): void => {
      void this.flushTick();
    }, FLUSH_TICK_MS);

    // Az időzítő ne tartsa életben a folyamatot önmagában.
    this.flushTimer.unref();
  }

  /**
   * Egy kiküldési kör.
   *
   * A döntést a híd hozza (`decideFlush`) — itt csak megkérdezzük, és naplózzuk az
   * eredményt. 🔴 SOHA nem dob: egy CCAP-kimaradás nem döntheti meg a figyelőt, különben
   * a bejövő üzenetek is elvesznének.
   */
  private async flushTick(): Promise<void> {
    if (this.flushInFlight) return;

    this.flushInFlight = true;

    try {
      const result = await this.bridge.flush();

      if (!result) return;

      // Sikeres átadás után nullázzuk a hiba-fékét: a következő zavart azonnal lássuk.
      this.lastFlushErrorLoggedAt = 0;

      await this.safeLog({
        kind: 'note',
        summary: `[discord/listener] ${result.deliveredCount} üzenet átadva a CC sessionnek `
          + `(sorba állítva: ${result.queued ? 'igen' : 'nem'}).`,
        extra: {
          code: 'MA-DISCORD-BATCH-DELIVERED',
          deliveredCount: result.deliveredCount,
          queued: result.queued,
        },
      });
    } catch (err: unknown) {
      const now: number = Date.now();

      // Az ELSŐ hibát mindig kiírjuk; utána ritkítunk, hogy egy tartós CCAP-kimaradás
      // ne temesse maga alá a naplót — de a tény soha ne tűnjön el.
      if (now - this.lastFlushErrorLoggedAt < FLUSH_ERROR_LOG_INTERVAL_MS) return;

      this.lastFlushErrorLoggedAt = now;

      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-DISCORD-FLUSH-FAILED: a köteg NEM ment át a CC sessionnek — '
          + `${err instanceof Error ? err.message : String(err)}`,
        extra: {
          code: 'MA-DISCORD-FLUSH-FAILED',
          remedy: 'Ellenőrizd, hogy fut-e a CCAP (localhost:39050), és hogy megvan-e a saját '
            + 'CC session: `ma ccap whoami`. Az üzenetek addig a kötegben MARADNAK, nem vesznek el.',
        },
      });
    } finally {
      this.flushInFlight = false;
    }
  }

  /**
   * A „gépel…" visszajelzés indítása.
   *
   * Owner-kérés (2026-09-06): amíg az üzenet feldolgozás alatt van, lássa, hogy dolgozunk.
   * A Discord jelzése ~10 mp után lejár, ezért ismételni kell — ezt a `TypingIndicator` viszi.
   */
  private startTypingIndicator(client: Client, config: MessageFilterConfig): void {
    this.typing = new TypingIndicator(
      async (): Promise<void> => {
        const channel = await client.channels.fetch(config.allowedChannelId);

        if (channel && channel.isTextBased() && 'sendTyping' in channel) {
          await (channel as { sendTyping: () => Promise<void> }).sendTyping();
        }
      },
      async (): Promise<{ pendingCount: number; owesReply: boolean }> => ({
        pendingCount: (await this.bridge.getStore().readPending()).length,
        owesReply: (await checkReplyObligation()).owesReply,
      }),
      (message: string): void => {
        process.stderr.write(`${message}
`);
      },
    );

    this.typing.start();
  }

  /** Egy életjel-frissítés. Sosem dob hibát (a `writeHeartbeat` elnyeli). */
  private async beat(botTag: string): Promise<void> {
    await writeHeartbeat({
      updatedAt: new Date().toISOString(),
      botTag,
      processedCount: this.processedCount,
      pid: process.pid,
    });
  }

  /**
   * Naplózás, ami SOHA nem dönti meg a figyelőt.
   *
   * 🔴 Miért kell: a napló-írás lemez-műveletet végez, tehát elszállhat (tele a lemez,
   * jogosultsági hiba). Egy `void`-olt hívási láncban ez `unhandledRejection` lenne, amire
   * a globális kezelő `process.exit(1)`-gyel válaszol — vagyis EGY NAPLÓZÁSI HIBA MEGÖLNÉ
   * A CSATORNÁT. Végső mentsvárként a stderr marad: a hiba így is LÁTHATÓ, nem néma.
   */
  private async safeLog(entry: Parameters<typeof logAction>[0]): Promise<void> {
    try {
      await logAction(entry);
    } catch (err: unknown) {
      process.stderr.write(
        `[discord/listener] a napló-írás nem sikerült: `
        + `${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  }
}

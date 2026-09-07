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
import type { DiscordInboundMessage } from './discord.models.js';
import { HEARTBEAT_INTERVAL_MS, writeHeartbeat } from './discord.heartbeat.js';
import { checkReplyObligation, recordOutbound } from './discord.reply-tracker.js';
import {
  markVoiceHeard,
  replyToVoice,
  type VoiceAcknowledgeTarget,
} from './discord.voice-acknowledge.js';
import { TypingIndicator } from './discord.typing-indicator.js';
import {
  filterIncomingMessage,
  readMessageFilterConfig,
  type IncomingDiscordMessage,
  type MessageFilterConfig,
} from './discord.message-filter.js';
import {
  describeRefresh,
  refreshBatchEntries,
  type CurrentMessageState,
} from './discord.batch-refresh.js';
import { composeDeliveryNotice } from './discord.receipt.js';
import { sendDiscordMessage, splitForDiscord } from './discord.sender.js';
import {
  composeTranscriptForBatch,
  downloadVoiceAttachment,
  selectVoiceAttachment,
  type DiscordAttachment,
} from './discord.voice-message.js';
import { transcribeAudio } from '../stt/stt.client.js';
import { composeMirrorMessage } from '../stt/stt.mirror.js';
import {
  MAX_ATTEMPTS,
  SttRetryQueue,
  composeGiveUpMessage,
  type SttRetryEntry,
} from '../stt/stt.retry-queue.js';

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

/**
 * Ennyi hang-azonositot tartunk szamon a duplikatum-szures miatt.
 *
 * ⚠️ Vedokorlat: a figyelo **hetekig fut egyfolytaban**, es egy korlatlanul novo halmaz
 * lassan szivargo memoria lenne. A hanguzenet ritka, tehat ez a keret bosegesen eleg —
 * a lenyeg, hogy legyen FELSO HATAR.
 */
const TRANSCRIBED_MEMORY_LIMIT: number = 500;

/** Discord-üzenet → a saját, szűk adatszerkezetünk. Egy helyen, hogy ne csússzon szét. */
function toIncoming(message: Message): IncomingDiscordMessage {
  return {
    messageId: message.id,
    channelId: message.channelId,
    authorId: message.author.id,
    authorName: message.author.username,
    isFromBot: message.author.bot,
    content: message.content,
    attachments: [...message.attachments.values()].map((a): DiscordAttachment => ({
      id: a.id,
      url: a.url,
      name: a.name,
      size: a.size,
      ...(a.contentType ? { contentType: a.contentType } : {}),
      ...(typeof a.duration === 'number' ? { durationSecs: a.duration } : {}),
    })),
  };
}

/**
 * A kötegbe kerülő alak.
 *
 * ⛔ A **csatolmányok szándékosan kimaradnak**: a Discord letöltési linkjei ALÁÍRTAK és
 * LEJÁRNAK, tehát a tárolásuk félrevezető lenne (később már nem működnek), ráadásul
 * fölöslegesen hizlalná a köteg-fájlt. Ami a hangból számít — az átirat —, az addigra
 * már a `content`-ben van.
 */
function toBatchEntry(incoming: IncomingDiscordMessage): Omit<IncomingDiscordMessage, 'attachments'> {
  const { attachments: _attachments, ...rest } = incoming;

  return rest;
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

  /**
   * Amit ebben a futásban MÁR átírtunk hangból.
   *
   * 🔴 MIÉRT KELL: a hang-út **drága** (mérve: 77,6 mp) és **látható mellékhatása van** —
   * kimegy a tükör-üzenet. A Discord viszont ugyanazt az eseményt újraküldheti. A kötegelő
   * duplikátum-szűrése csak a KÖTEGBE tételnél csap le, vagyis a felismerés és a tükör
   * addigra már MEGTÖRTÉNT volna. Ezért itt, a drága lépés ELŐTT szűrünk.
   */
  private readonly transcribedMessageIds: Set<string> = new Set();

  /**
   * 🔴 A hangok, amiket nem sikerült felismerni — hogy NE VESSZENEK EL.
   *
   * MÉRVE 2026-09-07: 2 hangüzenet veszett el véglegesen, mert nem volt újrapróbálás.
   */
  private readonly retryQueue: SttRetryQueue = new SttRetryQueue();

  /**
   * Fut-e ÉPP egy felismerés.
   *
   * ⭐ EZ AZ ALKALMAZKODÁS MAGA. Az owner szerint a RAM-ingadozást nem megoldani kell, hanem
   * alkalmazkodni hozzá — ez a jelző gondoskodik arról, hogy SOHA ne induljon két felismerés
   * egyszerre. Különben az újrapróbáló pont a legrosszabb pillanatban tetézné a terhelést,
   * ami ellen létezik.
   */
  private sttInFlight: boolean = false;



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

    // 🎙️ HANGÜZENET: a szöveget előbb elő kell állítani — STT + TÜKÖR-ÜZENET.
    // Ha nem sikerül megbízhatóan, a kötegbe SEMMI nem kerül (lásd a metódus doksiját).
    if (verdict.hasAudio) {
      const spoken: string | null = await this.transcribeVoiceMessage(incoming, message);

      if (spoken === null) return;

      incoming.content = incoming.content.trim()
        ? `${incoming.content.trim()}\n\n${spoken}`
        : spoken;
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
   * Hangüzenet → szöveg, TÜKÖR-ÜZENETTEL.
   *
   * A menet: csatolmány kiválasztása → letöltés → STT → **tükör-üzenet a Discordra** →
   * a kötegbe kerülő, megjelölt átirat.
   *
   * 🔴 A DÖNTÉS, AMI A LEGFONTOSABB: **bizonytalan vagy sikertelen felismerésnél `null`-t
   * adunk**, tehát a kötegbe SEMMI nem kerül. Ilyenkor a tükör-üzenet már elment az ownernek
   * *(„NEM cselekszem rá")*, ő pedig újraküldi vagy leírja. Egy félrehallott mondat
   * ugyanis a kötegben már az **ő szó szerinti utasításának látszana** — és arra
   * cselekednék. Inkább ne értsük, mint félreértsük.
   *
   * Hibát SOHA nem dob: a hangfeldolgozás nem döntheti meg a figyelőt.
   *
   * @returns a kötegbe teendő, megjelölt átirat — vagy `null`, ha nem szabad továbbadni.
   */
  private async transcribeVoiceMessage(
    incoming: IncomingDiscordMessage,
    /**
     * 👂 Maga a Discord-üzenet — ezen jelenik meg a fül-reakció, és ERRE megy a válasz.
     *
     * Owner, 2026-09-07: *„tudsz-e dobni egy fül emojit a hangüzenetekre, és tudsz-e
     * riplájolni a hangüzenetekre, hogy összeköthessük"*.
     */
    source: VoiceAcknowledgeTarget,
  ): Promise<string | null> {
    // ⛔ Ugyanazt a hangot nem ismerjük fel kétszer: drága, és MÁSODIK tükör-üzenetet küldene.
    if (this.transcribedMessageIds.has(incoming.messageId)) return null;

    this.transcribedMessageIds.add(incoming.messageId);
    this.forgetOldestTranscribedIds();

    // 👂 A LEGELSŐ dolog: jelezzük, hogy EZT az üzenetet meghallottuk. A felismerés percekig
    // tarthat (RAM-terheléskor mérve 5 percig is) — addig ez az EGYETLEN visszajelzés arról,
    // hogy melyik hangüzeneten dolgozom.
    const heard = await markVoiceHeard(source);

    if (!heard.ok) {
      await this.safeLog({
        kind: 'error',
        summary: `[discord/listener] MA-DISCORD-VOICE-REACT-FAILED: ${heard.detail}`,
        extra: { code: 'MA-DISCORD-VOICE-REACT-FAILED', messageId: incoming.messageId, remedy: heard.remedy },
      });
    }

    const selection = selectVoiceAttachment(incoming.attachments ?? []);

    if (!selection.attachment) {
      // Ide elvileg nem jutunk (a szűrő már látott hangot) — de ha mégis, MONDJUK MEG.
      await this.reportVoiceProblem(
        incoming,
        source,
        `Nem találtam feldolgozható hangot. ${selection.rejection ?? ''}`,
      );

      return null;
    }

    const attachment = selection.attachment;
    const download = await downloadVoiceAttachment(attachment);

    if (!download.ok || !download.bytes) {
      await this.reportVoiceProblem(
        incoming,
        source,
        `A hangüzenet letöltése nem sikerült. ${download.detail}`,
        download.remedy,
      );

      return null;
    }

    this.sttInFlight = true;

    let result;

    try {
      result = await transcribeAudio({
        audio: download.bytes,
        filename: attachment.name,
        ...(attachment.contentType ? { contentType: attachment.contentType } : {}),
      });
    } finally {
      this.sttInFlight = false;
    }

    // 🔴 A SZOLGÁLTATÁS BUKOTT (időtúllépés, hálózat, hibás válasz) → A HANG ELTEHETŐ.
    // Ez az a pont, ahol 2026-09-07-én 2 hangüzenet VÉGLEG elveszett. Most nem veszik el:
    // eltesszük a bájtokat, és később — más terhelés mellett — újrapróbáljuk.
    //
    // ⚠️ CSAK a bukást tesszük el, a GYANÚS ÁTIRATOT NEM: az utóbbi nem múló zavar, hanem
    // maga az eredmény. Újrapróbálva ugyanazt a hallucinációt kapnánk, csak sokadszorra.
    if (!result.ok) {
      await this.queueForRetry(incoming, attachment, download.bytes, result.detail);
    }

    // ⭐ A TÜKÖR MINDIG MEGY — sikernél, bizonytalanságnál és bukásnál is. Ez az egyetlen
    // pont, ahol az owner MÉG A CSELEKVÉS ELŐTT elkaphatja a félreértést.
    await this.sendMirror(composeMirrorMessage(result), incoming.messageId, source);

    if (!result.ok || result.suspicious) {
      await this.safeLog({
        kind: 'note',
        summary: '[discord/listener] MA-DISCORD-VOICE-NOT-TRUSTED: a hangüzenet átirata nem '
          + `megbízható, ezért NEM került a kötegbe — ${result.suspicionReason ?? result.detail}`,
        extra: {
          code: 'MA-DISCORD-VOICE-NOT-TRUSTED',
          messageId: incoming.messageId,
          ok: result.ok,
          suspicious: result.suspicious,
        },
      });

      return null;
    }

    await this.safeLog({
      kind: 'note',
      summary: `[discord/listener] Hangüzenet felismerve (${result.text.length} karakter, `
        + `${Math.round(result.elapsedMs / 1000)} mp) — tükör elküldve.`,
      extra: { code: 'MA-DISCORD-VOICE-TRANSCRIBED', messageId: incoming.messageId },
    });

    return composeTranscriptForBatch({
      transcript: result.text,
      ...(attachment.durationSecs === undefined ? {} : { durationSecs: attachment.durationSecs }),
    });
  }

  /**
   * KEZBESITESI ERTESITO — „most ment el neked X uzenet".
   *
   * > **Owner-korrekcio (2026-09-07):** *„Nem kell folyton irni, hogy megvannak az
   * > uzenetek... Eleg ha a typing frissitve van es esetleg arrol kuldhetsz egy rovid
   * > 2 szavas valaszt, hogy na most ment el neked x uzenet"*
   *
   * ⭐ Ez az EGYETLEN pillanat, amirol a „gepel…" jelzes NEM tud beszelni: hogy a koteg
   * **atment**. A varakozasrol nem szolunk kulon — azt a typing lefedi.
   *
   * Hibat SOHA nem dob: egy ertesito elmaradasa nem befolyasolhatja a kikuldest, ami
   * ekkorra mar sikeresen megtortent.
   */
  private async notifyDelivered(deliveredCount: number): Promise<void> {
    try {
      const sent = await sendDiscordMessage(composeDeliveryNotice(deliveredCount), 'ack');

      if (!sent.sent) {
        await this.safeLog({
          kind: 'error',
          summary: `[discord/listener] MA-DISCORD-NOTICE-FAILED: a kezbesitesi ertesito nem ment ki — ${sent.detail}`,
          extra: { code: 'MA-DISCORD-NOTICE-FAILED', deliveredCount },
        });
      }
    } catch (err: unknown) {
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-DISCORD-NOTICE-FAILED: a kezbesitesi ertesito kozben hiba — '
          + `${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-DISCORD-NOTICE-FAILED', deliveredCount },
      });
    }
  }

  /** A duplikatum-halmaz felso hatarnak tartasa — a `Set` beszurasi sorrendet tart. */
  private forgetOldestTranscribedIds(): void {
    while (this.transcribedMessageIds.size > TRANSCRIBED_MEMORY_LIMIT) {
      const oldest: string | undefined = this.transcribedMessageIds.values().next().value;

      if (oldest === undefined) return;

      this.transcribedMessageIds.delete(oldest);
    }
  }

  /** A tükör-üzenet kiküldése. A küldési hiba nem akaszthatja meg a feldolgozást. */
  private async sendMirror(
    text: string,
    messageId: string,
    /**
     * Ha megvan a forrás-üzenet, a tükör **VÁLASZKÉNT** megy rá — így a Discordon
     * összekötve marad a hang és az átirata (owner-kérés, 2026-09-07).
     */
    source?: VoiceAcknowledgeTarget,
  ): Promise<void> {
    // ⭐ ELSŐ PRÓBA: válasz a hangüzenetre. Ez az egyetlen mód, ami LÁTHATÓAN összeköti az
    // átiratot a forrásával — és ráadásul olcsóbb is, mert a figyelő kapcsolatát használja.
    if (source && await this.replyMirror(text, messageId, source)) return;

    try {
      const sent = await sendDiscordMessage(text);

      if (!sent.sent || sent.verifiedIntact === false) {
        await this.safeLog({
          kind: 'error',
          summary: '[discord/listener] MA-DISCORD-MIRROR-UNDELIVERED: a tükör-üzenet nem '
            + `igazoltan érkezett meg — ${sent.verifyDetail ?? sent.detail}`,
          extra: { code: 'MA-DISCORD-MIRROR-UNDELIVERED', messageId },
        });
      }
    } catch (err: unknown) {
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-DISCORD-MIRROR-FAILED: a tükör-üzenet küldése elbukott — '
          + `${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-DISCORD-MIRROR-FAILED', messageId },
      });
    }
  }

  /**
   * Egy sikertelen felismerés hangjának eltevése későbbre.
   *
   * Hibát SOHA nem dob: ha maga az eltevés bukik, azt naplózzuk — de a tükör-üzenet
   * (ami ekkor még hátravan) nem maradhat el miatta.
   */
  private async queueForRetry(
    incoming: IncomingDiscordMessage,
    attachment: DiscordAttachment,
    audio: Uint8Array,
    failure: string,
  ): Promise<void> {
    try {
      const entry: SttRetryEntry | null = await this.retryQueue.enqueue({
        messageId: incoming.messageId,
        channelId: incoming.channelId,
        authorId: incoming.authorId,
        authorName: incoming.authorName,
        filename: attachment.name,
        ...(attachment.contentType ? { contentType: attachment.contentType } : {}),
        ...(attachment.durationSecs === undefined ? {} : { durationSecs: attachment.durationSecs }),
        audio: audio,
        failure: failure,
      });

      await this.safeLog({
        kind: 'note',
        summary: entry
          ? `[discord/listener] A hangüzenet ELTÉVE újrapróbálásra (${MAX_ATTEMPTS - 1} próba van hátra) — ${failure}`
          : `[discord/listener] MA-DISCORD-VOICE-NO-RETRY: nincs több próbálkozási lépcső — ${failure}`,
        extra: { code: 'MA-DISCORD-VOICE-QUEUED-FOR-RETRY', messageId: incoming.messageId, queued: entry !== null },
      });
    } catch (err: unknown) {
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-STT-RETRY-ENQUEUE-FAILED: a hangot NEM sikerült eltenni '
          + `újrapróbálásra, ezért VÉGLEG elveszhet — ${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-STT-RETRY-ENQUEUE-FAILED', messageId: incoming.messageId },
      });
    }
  }

  /**
   * ⏳ EGY esedékes újrapróbálás — a kiküldési körből hívva.
   *
   * A három kapu, ami előtte áll, mind ugyanazt szolgálja: **ne mi legyünk a RAM-csúcs**.
   *   1. fut-e épp felismerés (`sttInFlight`),
   *   2. esedékes-e egyáltalán valami (`takeDue`),
   *   3. körönként **legfeljebb egy** tétel.
   *
   * Hibát SOHA nem dob: az újrapróbáló nem döntheti meg a figyelőt.
   */
  private async runDueRetry(): Promise<void> {
    if (this.sttInFlight) return;

    try {
      const entry: SttRetryEntry | null = await this.retryQueue.takeDue();

      if (!entry) return;

      const audio: Uint8Array | null = await this.retryQueue.readAudio(entry.messageId);

      if (!audio) {
        // A leíró megvan, a hang nincs — ebből már sosem lesz átirat. NEM hallgatjuk el.
        await this.retryQueue.remove(entry.messageId);
        await this.safeLog({
          kind: 'error',
          summary: '[discord/listener] MA-STT-RETRY-AUDIO-MISSING: a leíró megvan, de a hang '
            + 'nincs meg — ebből a tételből már nem lesz átirat.',
          extra: { code: 'MA-STT-RETRY-AUDIO-MISSING', messageId: entry.messageId },
        });
        await this.sendMirror(composeGiveUpMessage(entry), entry.messageId);

        return;
      }

      this.sttInFlight = true;

      let result;

      try {
        result = await transcribeAudio({
          audio: audio,
          filename: entry.filename,
          ...(entry.contentType ? { contentType: entry.contentType } : {}),
        });
      } finally {
        this.sttInFlight = false;
      }

      if (!result.ok || result.suspicious) {
        await this.handleRetryFailure(entry, result.suspicionReason ?? result.detail);

        return;
      }

      await this.deliverRetriedTranscript(entry, result.text);
    } catch (err: unknown) {
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-STT-RETRY-FAILED: váratlan hiba az újrapróbálás közben — '
          + `${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-STT-RETRY-FAILED' },
      });
    }
  }

  /** Egy újrapróbálás bukása: vagy továbblépünk a következő lépcsőre, vagy SZÓLUNK. */
  private async handleRetryFailure(entry: SttRetryEntry, failure: string): Promise<void> {
    const updated: SttRetryEntry | null = await this.retryQueue.recordFailure(entry.messageId, failure);

    if (updated) {
      await this.safeLog({
        kind: 'note',
        summary: `[discord/listener] Az újrapróbálás (${updated.attempts}/${MAX_ATTEMPTS}) sem sikerült — `
          + `következő: ${updated.nextAttemptAt}`,
        extra: { code: 'MA-STT-RETRY-RESCHEDULED', messageId: entry.messageId, attempts: updated.attempts },
      });

      return;
    }

    // 🔴 ITT VESZIK EL A TARTALOM. Ez NEM maradhat némán — az owner különben azt hiszi,
    // tudom, amit mondott.
    await this.safeLog({
      kind: 'error',
      summary: `[discord/listener] MA-STT-RETRY-GIVEN-UP: ${MAX_ATTEMPTS} próba után feladtam — `
        + `a hangüzenet tartalma elveszett. Utoljára: ${failure}`,
      extra: { code: 'MA-STT-RETRY-GIVEN-UP', messageId: entry.messageId },
    });
    await this.sendMirror(composeGiveUpMessage({ ...entry, lastFailure: failure }), entry.messageId);
  }

  /**
   * ⭐ A CÉL: a későn felismert szöveg ugyanúgy a KÖTEGBE kerül, mintha elsőre sikerült volna.
   *
   * ⚠️ A tükör csak azt mondja meg az ownernek, hogy megvan. Ha itt megállnánk, a tartalom
   * **hozzám** még mindig nem jutna el — vagyis a sor a cél előtt egy lépéssel bukna el.
   */
  private async deliverRetriedTranscript(entry: SttRetryEntry, text: string): Promise<void> {
    const transcript: string = composeTranscriptForBatch({
      transcript: text,
      ...(entry.durationSecs === undefined ? {} : { durationSecs: entry.durationSecs }),
    });

    await this.bridge.enqueue({
      messageId: entry.messageId,
      authorId: entry.authorId,
      authorName: entry.authorName,
      channelId: entry.channelId,
      content: transcript,
      receivedAt: new Date().toISOString(),
    });

    await this.retryQueue.remove(entry.messageId);
    await this.safeLog({
      kind: 'note',
      summary: `[discord/listener] ✅ Az újrapróbálás SIKERÜLT — a ${entry.attempts}. próba után `
        + `megvan a szöveg (${text.length} karakter), és a kötegbe került.`,
      extra: { code: 'MA-STT-RETRY-SUCCEEDED', messageId: entry.messageId, attempts: entry.attempts },
    });
    await this.sendMirror(
      `✅ **Megvan a hangüzenet, amit korábban nem tudtam felismerni.**\n`
        + `*(a ${entry.attempts}. próbálkozásra sikerült)*\n\n${text}`,
      entry.messageId,
    );
  }

  /**
   * A tükör VÁLASZKÉNT a hangüzenetre.
   *
   * 🔴 A MEGKERÜLÉSNEK UGYANAZT A SZERZŐDÉST KELL TELJESÍTENIE, mint a `sendDiscordMessage`-nek:
   * ugyanaz a 2000-karakteres darabolás (`splitForDiscord`) és ugyanaz a kimenő-rögzítés
   * (`recordOutbound`). Enélkül a válasz-kötelezettség követése némán elromlana — egy
   * „gyorsabb út", ami közben kikapcsol egy őrt, rosszabb, mint a lassú út.
   *
   * ⚠️ A tükör `'ack'`: NEM törli a válasz-kötelezettséget. Az átirat visszhangja nem válasz
   * arra, amit az owner kért — azzal még tartozom.
   *
   * @returns `true`, ha a válasz-lánc kiment; `false`, ha a hívónak a csatornára kell esnie.
   */
  private async replyMirror(
    text: string,
    messageId: string,
    source: VoiceAcknowledgeTarget,
  ): Promise<boolean> {
    try {
      const outcome = await replyToVoice(source, splitForDiscord(text.trim()));

      if (!outcome.ok) {
        await this.safeLog({
          kind: 'error',
          summary: `[discord/listener] MA-DISCORD-MIRROR-REPLY-FAILED: ${outcome.detail} — `
            + 'átváltok a csatornára.',
          extra: { code: 'MA-DISCORD-MIRROR-REPLY-FAILED', messageId, remedy: outcome.remedy },
        });

        return false;
      }

      await recordOutbound(new Date().toISOString(), 'ack', text);

      return true;
    } catch (err: unknown) {
      // Ide csak akkor jutunk, ha maga a rögzítés/darabolás bukik — a válasz már kiment.
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-DISCORD-MIRROR-REPLY-FAILED: váratlan hiba a válasz-láncban — '
          + `${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-DISCORD-MIRROR-REPLY-FAILED', messageId },
      });

      return false;
    }
  }

  /** Hangüzenet-probléma: az ownernek is MEGMONDJUK, nem csak a naplóba tesszük. */
  private async reportVoiceProblem(
    incoming: IncomingDiscordMessage,
    source: VoiceAcknowledgeTarget,
    detail: string,
    remedy?: string,
  ): Promise<void> {
    await this.safeLog({
      kind: 'error',
      summary: `[discord/listener] MA-DISCORD-VOICE-FAILED: ${detail}`,
      extra: { code: 'MA-DISCORD-VOICE-FAILED', messageId: incoming.messageId },
    });

    await this.sendMirror(
      `🎙️ **Hangüzenet — nem tudtam feldolgozni.**\n\n${detail}`
        + (remedy ? `\n→ ${remedy}` : '')
        + '\n\n📌 **Nem tippelek arra, mit mondtál** — írd le, vagy küldd újra.',
      incoming.messageId,
      source,
    );
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
        const verdict = filterIncomingMessage(incoming, config);

        if (!verdict.accepted) continue;
        if (await this.bridge.getStore().hasBeenDelivered(incoming.messageId)) continue;

        // 🔴 A HANGOT ITT IS FEL KELL ISMERNI. Enelkul a leallas alatt erkezett hanguzenet
        // URES tartalommal kerulne a kotegbe — vagyis a backfill pont azt veszitene el,
        // amiert letezik. (Merve 2026-09-07: a backfill NEM a handleMessage-en megy at.)
        if (verdict.hasAudio) {
          const spoken: string | null = await this.transcribeVoiceMessage(incoming, message);

          if (spoken === null) continue;

          incoming.content = incoming.content.trim()
            ? `${incoming.content.trim()}

${spoken}`
            : spoken;
        }

        const isNew: boolean = await this.bridge.enqueue({
          ...toBatchEntry(incoming),
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
      // ⏳ Ugyanez a ketyegés viszi az STT-újrapróbálást is — nem kell külön időzítő.
      // ⭐ Külön időzítő azt is jelentené, hogy KÉT dolog indíthatna felismerést egymásról
      // nem tudva; így viszont egyetlen ütem van, és a `sttInFlight` egy helyen véd.
      void this.runDueRetry();
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
  /**
   * A varakozo koteg frissitese a Discord AKTUALIS allapotarol — kikuldes ELOTT.
   *
   * > **Owner (2026-09-07):** *„Jo lenne ha a discord msg kezeles frissitene kuldes elott a
   * > msg-eket. (Ha idokozben meg gyujtes/kuldes elott javitom/modositom, akkor a friss
   * > menjen neked."*
   *
   * A koteg akar percekig gyulhet, amig a session dolgozik. Ha az owner ezalatt kijavit egy
   * elgepelest vagy atfogalmaz egy utasitast, a REGI szoveg alapjan cselekednek — miközben o
   * mar a javitott valtozatot hiszi ervenyesnek.
   *
   * 🔴 Hibat SOHA nem dob es SOHA nem urit koteget: ha a lekerdezes nem megy, a **regi
   * tartalom megy at valtozatlanul**. Egy halozati zavar nem vehet el uzenetet — az sokkal
   * rosszabb lenne, mint egy elavult szoveg.
   */
  private async refreshPendingFromDiscord(
    pending: DiscordInboundMessage[],
  ): Promise<DiscordInboundMessage[]> {
    const client: Client | null = this.client;

    if (!client || pending.length === 0) return pending;

    try {
      const states: Map<string, CurrentMessageState> = new Map();

      for (const item of pending) {
        states.set(item.messageId, await this.readCurrentMessageState(client, item));
      }

      const outcome = refreshBatchEntries(pending, states);

      // Ha semmi nem valtozott, NEM irjuk ujra a fajlt — folosleges IO es folosleges kockazat.
      if (outcome.updatedCount === 0 && outcome.removedCount === 0) return pending;

      // 🔴 A tarba is vissza kell irni: a veglegesites a tar ELSO N elemet archivalja, tehat a
      // tar es a kikuldott koteg nem csuszhat szet (lasd a `flush` beforeSend szerzodeset).
      await this.bridge.getStore().applyPendingRefresh({
        refreshed: outcome.entries,
        knownIds: pending.map((item) => item.messageId),
      });
      await this.safeLog({
        kind: 'note',
        summary: `[discord/listener] Koteg frissitve kikuldes elott — ${describeRefresh(outcome) ?? 'nincs valtozas'}.`,
        extra: {
          code: 'MA-DISCORD-BATCH-REFRESHED',
          updatedCount: outcome.updatedCount,
          removedCount: outcome.removedCount,
          unresolvedCount: outcome.unresolvedCount,
        },
      });

      return outcome.entries;
    } catch (err: unknown) {
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-DISCORD-REFRESH-FAILED: a koteg frissitese nem sikerult, '
          + `a REGI tartalom megy at valtozatlanul — ${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-DISCORD-REFRESH-FAILED' },
      });

      // ⛔ A frissites elmaradasa SOSEM allithatja meg a kikuldest.
      return pending;
    }
  }

  /**
   * Egy uzenet aktualis allapota a Discordon.
   *
   * ⚠️ A „torolve" es a „nem tudom" KULON eset. A Discord a nemletezo uzenetre `10008`
   * (`Unknown Message`) hibakodot ad — CSAK ezt vesszuk torlesnek. Barmi mas (halozat,
   * jogosultsag, idotullepes) `unknown`, es olyankor **megtartjuk** az uzenetet.
   */
  private async readCurrentMessageState(
    client: Client,
    entry: { messageId: string; channelId: string },
  ): Promise<CurrentMessageState> {
    try {
      const channel = await client.channels.fetch(entry.channelId);

      if (!channel || !channel.isTextBased()) return { kind: 'unknown' };

      // 🔴 `force: true` KOTELEZO: a discord.js alapbol a GYORSITOTARBOL ad vissza, ami
      // eppen a REGI, szerkesztes elotti szoveg lenne — vagyis a frissites nemán
      // hatastalan maradna. (MessageUpdate esemenyre nem iratkozunk fel.)
      const message = await channel.messages.fetch({ message: entry.messageId, force: true });

      return { kind: 'present', content: message.content };
    } catch (err: unknown) {
      const code: unknown = (err as { code?: unknown })?.code;

      // 10008 = Unknown Message — ez a BIZONYOS torles.
      return code === 10008 ? { kind: 'deleted' } : { kind: 'unknown' };
    }
  }

  private async flushTick(): Promise<void> {
    if (this.flushInFlight) return;

    this.flushInFlight = true;

    try {
      // ⭐ A frissites a KULDES PILLANATABAN fut (`beforeSend`), nem a kor elejen: igy
      // pontosan akkor kerdezzuk le a Discordot, amikor szamit — es nem percenkent negyszer,
      // feleslegesen, mikozben a koteg ugyis var.
      const result = await this.bridge.flush({
        beforeSend: (pending) => this.refreshPendingFromDiscord(pending),
      });

      // ⛔ A VARAKOZASROL NEM SZOLUNK (owner-korrekcio, 2026-09-07): arrol a „gepel…"
      // jelzes ugyis beszel — egy kulon uzenet ugyanazt mondana el meg egyszer, szavakkal.
      if (!result) return;

      // Sikeres átadás után nullázzuk a hiba-fékét: a következő zavart azonnal lássuk.
      this.lastFlushErrorLoggedAt = 0;

      // ⭐ Az owner ERROL ker rovid jelzest — a varakozasrol nem.
      await this.notifyDelivered(result.deliveredCount);

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

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

import { join } from 'node:path';

import { Client, Events, GatewayIntentBits, Partials, type Message } from 'discord.js';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { decideVoiceJoinPermission } from '../voice/voice-lifecycle.js';
import { VoiceReadAloudWatcher } from '../voice/voice-read-aloud-watcher.js';
import { VoiceServiceWatch } from '../voice/voice-service-watch.js';
import { speakInVoiceChannel } from '../voice/voice-speaker.js';
import { resolveOutboundLogPath } from './discord.reply-tracker.js';
import { logAction } from '../action-log/action-log.client.js';
import { DiscordBridge } from './discord.bridge.js';
import { saveInboxAttachments } from './discord.file-intake.js';
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
import { composeDeliveryNotice, shouldSendDeliveryNotice } from './discord.receipt.js';
import { sendDiscordMessage, splitForDiscord } from './discord.sender.js';
import {
  composeTranscriptForBatch,
  downloadVoiceAttachment,
  isAudioAttachment,
  selectVoiceAttachment,
  type DiscordAttachment,
} from './discord.voice-message.js';
import { resolveProjectRoot } from '../utils/project-root.js';
import {
  VoiceChannelPresence,
  readVoicePresenceConfig,
} from '../voice/voice-channel-presence.js';
import {
  classifyRecordingOutcome,
  startVoiceRecording,
  type RecordingHandled,
  type RecordingOutcomeCode,
  type SpeechAttemptStats,
} from '../voice/voice-channel-recorder.js';
import { composeVoiceChannelEntry } from '../voice/voice-channel-bridge.js';
import { planRetryDelivery, type RetryDeliveryPlan } from '../stt/stt.retry-delivery.js';
import type {
  VoiceDropObservation,
  VoiceDropProbe,
  VoiceFunnelStats,
} from '../voice/voice-drop-probe.js';
import { VOICE_LOG_CODES } from '../voice/voice-log-codes.js';
import { MissedSpeechReporter } from '../voice/voice-missed-speech.js';
import {
  describeConnectionEvent,
  type VoiceConnectionEvent,
} from '../voice/voice-connection-log.js';
import { VoiceCuePlayer } from '../voice/voice-cues.js';
import { planVoiceRejoin, type RejoinPlan } from '../voice/voice-rejoin-plan.js';
import {
  planFeedbackForDrop,
  planFeedbackForOutcome,
  type VoiceFeedbackPlan,
} from '../voice/voice-feedback-plan.js';
import { transcribeAudio } from '../stt/stt.client.js';
import { TranscriptLedger } from '../stt/stt.transcript-ledger.js';
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
    // 🔗 A válasz-referencia (T-68/2): erre mutat rá az owner, amikor *„ezt olvasd újra"*.
    ...(message.reference?.messageId ? { referencedMessageId: message.reference.messageId } : {}),
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
  /**
   * 📒 A hangüzenet ↔ transzkript nyilvántartás (T-68).
   *
   * Owner: *„a rendszernek rögzítenie kéne, hogy melyik üzenetekhez melyik transzkript
   * tartozik… és ilyenkor ezeket majd visszamenőlegesen is fel kell tudjad oldani."*
   */
  private readonly ledger: TranscriptLedger = new TranscriptLedger();

  /**
   * ⭐ A sor a FELADÁS PILLANATÁBAN átadja a tételt — **mielőtt** a hangot törölné.
   *
   * 🔴 Enélkül a visszamenőleges feloldás lehetetlen: mérve, a `remove()` a `.bin`-t is
   * törli, tehát a tartalom véglegesen elvész abban a másodpercben.
   */
  private readonly retryQueue: SttRetryQueue = new SttRetryQueue(
    undefined,
    async (entry: SttRetryEntry): Promise<void> => {
      await this.ledger.recordFailed(
        {
          messageId: entry.messageId,
          channelId: entry.channelId,
          authorName: entry.authorName,
          filename: entry.filename,
          ...(entry.durationSecs === undefined ? {} : { durationSecs: entry.durationSecs }),
          failure: entry.lastFailure ?? '(ismeretlen ok — ez maga is hiba)',
          attempts: entry.attempts,
        },
        this.retryQueue.audioPathOf(entry.messageId),
      );
    },
  );

  /**
   * Fut-e ÉPP egy felismerés.
   *
   * ⭐ EZ AZ ALKALMAZKODÁS MAGA. Az owner szerint a RAM-ingadozást nem megoldani kell, hanem
   * alkalmazkodni hozzá — ez a jelző gondoskodik arról, hogy SOHA ne induljon két felismerés
   * egyszerre. Különben az újrapróbáló pont a legrosszabb pillanatban tetézné a terhelést,
   * ami ellen létezik.
   */
  private sttInFlight: boolean = false;

  /** 🔊 A hang-csatornai jelenlét — owner: „mindig ülj bent amikor megy a my assistant". */
  private readonly voicePresence: VoiceChannelPresence = new VoiceChannelPresence();
  private readAloud: VoiceReadAloudWatcher | null = null;

  /**
   * A FOLYAMATBAN LÉVŐ hang-esemény-írások.
   *
   * ⭐ MIÉRT KELL NYILVÁNTARTANI: a leállás során írt „kiléptem" sor az EGYETLEN nyoma
   * annak, hogy tisztán mentünk ki. Ha a folyamat előbb hal meg, mint ahogy az írás
   * befejeződik, a napló ugyanazt a hazug képet adja, mint eddig: csupa belépés, nulla kilépés.
   */
  private readonly pendingVoiceEventWrites: Set<Promise<void>> = new Set<Promise<void>>();
  private serviceWatch: VoiceServiceWatch | null = null;

  /** 🔍 Az élő eldobás-szonda — a `stop()`-nak le KELL állítania (különben duplán mérne). */
  private dropProbe: VoiceDropProbe | null = null;

  /** 🔇 A kiesés-jelentő — ami NEM jutott át, az is látszik a hang-csatornában. */
  private missedSpeech: MissedSpeechReporter | null = null;

  /** 🔊 A hangjelzések — aki BESZEL, az nem a kepernyot nezi (owner, 21:49). */
  private cues: VoiceCuePlayer | null = null;

  /**
   * 🔴 A hang-jelenlét ALLAPOTA — ez utazik az eletjelben a diagnosztikaig.
   *
   * ⚠️ `configured: false` = a hang-csatorna nincs beallitva ⇒ **jogos csend**.
   * A `configured: true, joined: false` viszont **HIBA**, amit LATNI kell.
   */
  private voicePresenceState: { configured: boolean; joined: boolean; channelName?: string } = {
    configured: false,
    joined: false,
  };



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
        // 🔊 A hang-csatornába belépéshez KELL — enélkül a `joinVoiceChannel` némán
        // sosem érne `Ready` állapotba, csak időtúllépéssel bukna.
        GatewayIntentBits.GuildVoiceStates,
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

    // 🔊 BELÉPÉS A HANG-CSATORNÁBA. ⚠️ SZÁNDÉKOSAN NEM várjuk meg és nem tesszük fatálissá:
    // a szöveges csatorna az elsődleges út, és egy hang-hiba NEM némíthatja el.
    void this.joinVoiceChannel();

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

    // 🔍 A SZONDÁT IS LE KELL ÁLLÍTANI. ⚠️ Enélkül egy `stop()` → `start()` páros UGYANARRA a
    // könyvtárra KÉT mintavételezőt tenne: mindkettő jelentené ugyanazt az eldobást, és a
    // „mennyi hang veszett el" szám **duplázódna**. Egy hazudó mérés rosszabb, mint a semmi.
    this.dropProbe?.stop();
    this.dropProbe = null;

    // ⚠️ A `stop()` a fuggoben levo kieseseket meg KIKULDI — leallaskor sem nyeljuk el azt,
    // amit az owner mondott es nem jutott at.
    // ⚠️ MEGVARJUK: a fuggoben levo kiesesek meg kimennek. Elereszve a folyamat leallhatna a
    // kuldes elott, es az owner utolso, at nem jutott megszolalasai NEMAN vesznenek el.
    await this.missedSpeech?.stop();
    this.missedSpeech = null;

    this.serviceWatch?.stop();
    this.serviceWatch = null;

    this.readAloud?.stop();
    this.readAloud = null;

    this.cues?.detach();
    this.cues = null;

    this.voicePresence.leave();

    // ⭐ MEGVÁRJUK a „kiléptem" sor kiírását. ⛔ Enélkül a folyamat kilépne előbb, és a
    // leállás nyomtalan lenne — a naplóból nem derülne ki, hogy TISZTÁN mentünk ki.
    await this.flushVoiceEventWrites();

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

    // 📥 CSATOLMÁNY: azonnal lementjük, mert a Discord linkje LEJÁR. A hivatkozás a szövegbe
    // kerül — ⚠️ ez az EGYETLEN nyoma, hogy fájl érkezett (a `toBatchEntry` a csatolmányokat
    // szándékosan eldobja). Enélkül az owner fájlja némán elveszne (mérve 2026-09-07).
    if (verdict.hasFiles) {
      const intake: string = await this.saveAttachmentsToInbox(incoming);

      if (intake) {
        incoming.content = incoming.content.trim()
          ? `${incoming.content.trim()}\n\n${intake}`
          : intake;
      }
    }

    try {
      const isNew: boolean = await this.bridge.enqueue({
        messageId: incoming.messageId,
        authorId: incoming.authorId,
        authorName: incoming.authorName,
        channelId: incoming.channelId,
        content: incoming.content,
        receivedAt: new Date().toISOString(),
        // 🔗 A válasz-referencia TOVÁBBADÁSA (T-68/2) — enélkül az asszisztens nem tudja,
        // MELYIK üzenetre gondolt az owner, amikor azt mondja: „ezt olvasd újra".
        ...(incoming.referencedMessageId
          ? { referencedMessageId: incoming.referencedMessageId }
          : {}),
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
   * 🔊 Belépés a hang-csatornába — és bent maradás.
   *
   * > **Owner (2026-09-07):** *„mindig ülj bent amikor megy a my assistant"*
   *
   * ⭐ MIÉRT ITT, a figyelőben: a hang-jelenlét ugyanahhoz a Discord-klienshez tartozik, ami a
   * szöveges üzeneteket viszi — így **egy** kapcsolat van, egy életciklussal. Külön indítandó
   * folyamat előbb-utóbb nem indulna el, és a nem-indulás **csendes** lenne
   * (`ldp-default-runtime.md`).
   *
   * 🔴 A HIÁNYZÓ KONFIGURÁCIÓ NEM HIBA, DE NEM IS NÉMA: ha nincs megadva a szerver/csatorna,
   * naplózzuk — így később nem kell találgatni, miért nem ül bent.
   */
  /**
   * 🩺 A SZOLGÁLTATÁS-FIGYELŐ INDÍTÁSA.
   *
   * > **Owner, 2026-09-10 18:28:** *„amikor leáll a szerver, illetve újraindul, olyankor ki
   * > kéne lépjél a csatornáról, hogy ne higgyem azt, hogy itt vagy."*
   *
   * ⭐ A kilépés UTÁN is élünk: a szerver lehet, hogy csak **újraindul**. Amikor visszajön,
   * **visszalépünk** — mert a néma kimaradás ugyanolyan félrevezető, mint a hamis jelenlét.
   */
  private startServiceWatch(): void {
    const healthUrl: string = (process.env['MA_SERVER_HEALTH_URL'] ?? '').trim()
      || 'http://localhost:39335/api/healthz';

    this.serviceWatch?.stop();
    this.serviceWatch = new VoiceServiceWatch({
      healthUrl: healthUrl,
      onLeave: async (action): Promise<void> => {
        this.voicePresence.leave();
        // ⭐ MEGVÁRJUK a napló-írást: a „kiléptem" sor az EGYETLEN nyoma annak, hogy
        // tisztán mentünk ki. (Ez az a hiba, ami a 24-belépés / 0-kilépés képet adta.)
        await this.flushVoiceEventWrites();
        await this.safeLog({
          kind: 'note',
          summary: `[discord/listener] MA-VOICE-SERVICE-LEFT: ${action.reason}`,
          extra: { code: 'MA-VOICE-SERVICE-LEFT' },
        });
      },
      onRejoin: async (): Promise<void> => {
        await this.joinVoiceChannel();
      },
      onNote: (detail: string): void => {
        void this.safeLog({
          kind: 'note',
          summary: `[discord/listener] MA-VOICE-SERVICE-WATCH: ${detail}`,
          extra: { code: 'MA-VOICE-SERVICE-WATCH' },
        });
      },
    });
    this.serviceWatch.start();
  }

  /**
   * 🗣️ A FELOLVASÓ INDÍTÁSA — a kimenő napló figyelése.
   *
   * > **Owner, 2026-09-10 18:27:** *„És a voice-ra, hogyha ott vagyok, akkor **fel is olvasod**."*
   *
   * ## ⭐ HOGYAN TUDJUK, HOGY BENT VAN — mérés, nem feltevés
   *
   * A `GuildVoiceStates` intent már be van kötve, tehát a gyorsítótárban ott van, ki van a
   * csatornában. ⛔ NEM a beszéd-eseményekből következtetünk: aki bent ül és hallgat, az is
   * bent van — és épp neki szól a felolvasás.
   *
   * ⚠️ A jelenlétet MINDEN üzenetnél újra kérdezzük. Egy induláskor eltárolt érték azt
   * jelentené, hogy a közben kilépő ownernek is „felolvasnánk" a semmibe, a belépőnek pedig
   * nem — és a hiba mindkét irányban NÉMA lenne.
   */
  private async startReadAloud(): Promise<void> {
    const ownerId: string = (process.env['MA_DISCORD_USER_ID'] ?? '').trim();
    const config = readVoicePresenceConfig();

    if (!ownerId || !config) {
      await this.safeLog({
        kind: 'note',
        summary: '[discord/listener] MA-VOICE-READ-ALOUD-OFF: hiányzik az owner-azonosító '
          + 'vagy a hang-csatorna beállítása — nincs felolvasás.',
        extra: { code: 'MA-VOICE-READ-ALOUD-OFF' },
      });

      return;
    }

    this.readAloud?.stop();
    this.readAloud = new VoiceReadAloudWatcher({
      logPath: resolveOutboundLogPath(),
      isOwnerPresent: (): boolean => this.isOwnerInVoiceChannel(ownerId, config.channelId),
      speak: async (text: string): Promise<void> => {
        const player = this.cues?.audioPlayer;

        if (!player) return;

        const result = await speakInVoiceChannel({ text: text, player: player });

        // ⛔ A felolvasás kimenetele SOSEM néma: a `spoken: false` OKA is naplózódik,
        // különben csak annyi látszana, hogy „nem szólalt meg".
        await this.safeLog({
          kind: result.spoken ? 'note' : 'error',
          summary: `[discord/listener] MA-VOICE-READ-ALOUD: ${result.detail}`,
          extra: {
            code: 'MA-VOICE-READ-ALOUD',
            spoken: result.spoken,
            ...(result.characterCount === undefined ? {} : { characterCount: result.characterCount }),
          },
        });
      },
      onNote: (detail: string): void => {
        void this.safeLog({
          kind: 'note',
          summary: `[discord/listener] MA-VOICE-READ-ALOUD-SKIP: ${detail}`,
          extra: { code: 'MA-VOICE-READ-ALOUD-SKIP' },
        });
      },
    });

    await this.readAloud.start();
  }

  /**
   * Bent van-e az owner a hang-csatornában?
   *
   * ⚠️ A `voiceStates` gyorsítótárból olvasunk — ezt a `GuildVoiceStates` intent tartja
   * frissen, tehát ez MÉRT állapot, nem feltevés.
   *
   * ⛔ Hibát nem dob: ha a gyorsítótár nem elérhető, az ÓVATOS válasz a `false` — inkább ne
   * olvassunk fel a semmibe, mint hogy egy hibás olvasás miatt beszéljünk hozzá, amikor
   * nincs is ott. A szöveg mindkét esetben megérkezik.
   */
  private isOwnerInVoiceChannel(ownerId: string, voiceChannelId: string): boolean {
    try {
      const guild = this.client?.guilds.cache.find(
        (candidate): boolean => candidate.voiceStates.cache.has(ownerId),
      );
      const state = guild?.voiceStates.cache.get(ownerId);

      return state?.channelId === voiceChannelId;
    } catch (err: unknown) {
      SwallowedFailure_Util.report('discord.listener.isOwnerInVoiceChannel', err);

      return false;
    }
  }

  private async joinVoiceChannel(): Promise<void> {
    const config = readVoicePresenceConfig();

    if (!config) {
      await this.safeLog({
        kind: 'note',
        summary: '[discord/listener] Hang-csatorna NINCS beállítva — nem lépek be. '
          + '(MA_DISCORD_GUILD_ID + MA_DISCORD_VOICE_CHANNEL_ID)',
        extra: { code: 'MA-VOICE-NOT-CONFIGURED' },
      });

      return;
    }

    if (!this.client) return;

    // 🚪 BELÉPÉS CSAK AKKOR, HA A LÁNC TÉNYLEG KISZOLGÁL (owner, 2026-09-10 18:28).
    //
    // 🔴 A MÉRT ESET: egy KÉZZEL indított figyelő ült a hang-csatornában, miközben a szerver
    // nem futott — az owner ebből azt olvasta, hogy jelen vagyok. A bent-ülés a
    // **szolgáltatást** hivatott jelezni, nem egy véletlen folyamatot.
    //
    // ⚠️ A szöveges figyelés ettől FÜGGETLENÜL működik: csak a hang-jelenlétet tartjuk vissza,
    // mert az ÍGÉRET — a szöveg-olvasás nem.
    const permission = decideVoiceJoinPermission(
      process.stdin.isTTY === true,
      (process.env['MA_VOICE_ALLOW_UNSUPERVISED'] ?? '').trim() === '1',
    );

    if (!permission.allowed) {
      await this.safeLog({
        kind: 'note',
        summary: `[discord/listener] MA-VOICE-JOIN-WITHHELD: ${permission.reason}`,
        extra: { code: 'MA-VOICE-JOIN-WITHHELD' },
      });
      this.voicePresenceState = { configured: true, joined: false };

      return;
    }

    // 🔴 A „BE VAN ÁLLÍTVA" TÉNYT AZONNAL RÖGZÍTJÜK — a belépés MEGKÍSÉRLÉSE ELŐTT.
    //
    // ⚠️ MÉRT HAZUG DIAGNÓZIS (2026-09-08 13:03): a `voice` mező csak a belépés UTÁN került az
    // életjelbe, ezért indulás után ~2 percig a `ma comm doctor` azt mondta, hogy
    // **„a hang-csatorna nincs beállítva"** — miközben be volt állítva, és a bot épp be is
    // lépett (`MA-VOICE-JOINED 13:02:03`).
    //
    // ⇒ A hiányzó mező KÉT dolgot jelenthetett: „nincs beállítva" VAGY „még nem jelentette".
    // A kettő összemosása pont az a hazug diagnózis, ami rosszabb a diagnózis hiányánál.
    this.voicePresenceState = { configured: true, joined: false };

    // 🔴 A FIGYELŐ BEKÖTÉSE A BELÉPÉS ELŐTT — különben a belépés eseménye elveszne.
    // Mérve 2026-09-08: 24 belépés / 0 kilépés a naplóban, mert a leválásnak nem volt csatornája.
    this.voicePresence.setEventSink((event: VoiceConnectionEvent): void => {
      // 🔴 A PROMISE-T MEGTARTJUK, NEM ELDOBJUK — MÉRVE 2026-09-10 19:38.
      //
      // Itt korábban `void` állt, vagyis az írás **versenyzett a folyamat halálával**. A
      // leállási úton a `stop()` visszatért, a folyamat kilépett, és a „kiléptem" sor
      // **sosem ért a naplóba** ⇒ pontosan az a 24-belépés / 0-kilépés kép, amit az owner
      // kifogásolt. A belépésnél nem tűnt fel, mert utána a folyamat még sokáig él.
      const write: Promise<void> = this.recordVoiceConnectionEvent(event);

      this.pendingVoiceEventWrites.add(write);
      void write.finally((): void => {
        this.pendingVoiceEventWrites.delete(write);
      });
    });

    const result = await this.voicePresence.join(this.client, config);

    // ⚠️ A TEENDŐ külön sor: a `join-failed` eseményben csak az OK fér el, a javítási javaslat
    // viszont pont az, amit az owner keres — ezt nem hagyjuk el.
    if (!result.joined && result.remedy) {
      await this.safeLog({
        kind: 'note',
        summary: `[discord/listener] Teendő a hang-csatornához: ${result.remedy}`,
        extra: { code: 'MA-VOICE-JOIN-FAILED', guildName: result.guildName ?? null },
      });
    }

    // 🔴 AZ ÁLLAPOT ELTEVÉSE — hogy a diagnosztika és a konzol IS lássa, bent vagyunk-e.
    // ⚠️ Enélkül egy elbukott belépés TELJESEN néma: az owner beszélne a csatornába, ahol a
    // bot nincs bent, és semmi nem mondaná meg, miért nem történik semmi.
    this.voicePresenceState = {
      configured: true,
      joined: result.joined,
      ...(result.channelName ? { channelName: result.channelName } : {}),
    };

    if (result.joined) await this.startVoiceRecording(config.channelId);
  }

  /** Hány újra-belépési kísérlet volt az utolsó SIKERES kapcsolat óta. */
  private voiceRejoinAttempts: number = 0;

  /** A folyamatban lévő újra-belépés időzítője — ⛔ hogy ne induljon kettő. */
  private voiceRejoinTimer: NodeJS.Timeout | null = null;

  /**
   * 🔁 Újra-belépés ütemezése kiesés után.
   *
   * ⛔ **Nem végtelen:** ha a belépés azért bukik, mert elveszett a jogosultság vagy törölték a
   * csatornát, a végtelen próbálkozás nem gyógyít — csak zajt termel. A sorozat végén
   * **kimondjuk, hogy feladtuk**, hogy az owner tudja: innen emberi beavatkozás kell.
   */
  private scheduleVoiceRejoin(): void {
    if (this.voiceRejoinTimer) return;

    const plan: RejoinPlan = planVoiceRejoin(this.voiceRejoinAttempts);

    void this.safeLog({
      kind: plan.shouldRetry ? 'note' : 'error',
      summary: `[discord/listener] 🔁 ${plan.detail}`,
      extra: { code: plan.shouldRetry ? 'MA-VOICE-REJOIN-SCHEDULED' : 'MA-VOICE-REJOIN-GIVEUP' },
    });
    process.stdout.write(`[voice] 🔁 ${plan.detail}
`);

    if (!plan.shouldRetry) return;

    this.voiceRejoinAttempts += 1;
    this.voiceRejoinTimer = setTimeout((): void => {
      this.voiceRejoinTimer = null;
      void this.joinVoiceChannel();
    }, plan.delayMs);

    // ⛔ A visszalépés-kísérlet nem tarthatja életben a folyamatot leállításkor.
    this.voiceRejoinTimer.unref?.();
  }

  /**
   * 🔌 EGY KAPCSOLAT-ESEMÉNY RÖGZÍTÉSE — **két helyre**, mért okkal.
   *
   * 1. **A szerver logjára** (`stdout`) — ⭐ EZ AZ ÚJ. Owner: *„a szerver logjában kell látnom"*.
   *    A `safeLog` **kizárólag** az akció-naplóba ír (mérve), ami az ownernek láthatatlan.
   * 2. **Az akció-naplóba** — hogy visszamenőleg mérhető és grep-elhető legyen.
   *
   * ⭐ ÉS FRISSÍTI A JELENLÉT-ÁLLAPOTOT: enélkül egy kiesés után a `ma comm doctor` és a
   * pulzus-sor **örökre azt mondaná, hogy bent ülünk** — a belépéskor eltett érték sosem
   * romlana el. Épp ez az a fajta hazug diagnózis, ami rosszabb, mint a diagnózis hiánya.
   */
  /**
   * Megvárja a folyamatban lévő hang-esemény-írásokat.
   *
   * ⚠️ `allSettled`, nem `all`: egy bukott írás nem akadályozhatja meg a többit — és a
   * leállást sem. A cél az, hogy amit KI TUDUNK írni, az ki is menjen.
   */
  private async flushVoiceEventWrites(): Promise<void> {
    if (!this.pendingVoiceEventWrites.size) return;

    await Promise.allSettled([ ...this.pendingVoiceEventWrites ]);
  }

  private async recordVoiceConnectionEvent(event: VoiceConnectionEvent): Promise<void> {
    const line = describeConnectionEvent(event);

    // ⚠️ `stdout`, nem `stderr`: ez normál működés-napló, nem hiba-csatorna — az LDP így
    // teszi a szerver rendes kimenetébe.
    process.stdout.write(`${line.console}
`);

    if (event.kind === 'dropped' || event.kind === 'left' || event.kind === 'join-failed') {
      this.voicePresenceState = {
        ...this.voicePresenceState,
        configured: true,
        joined: false,
        ...(event.channelName ? { channelName: event.channelName } : {}),
      };
    }

    if (event.kind === 'joined' || event.kind === 'reconnected') {
      this.voicePresenceState = {
        ...this.voicePresenceState,
        configured: true,
        joined: true,
        ...(event.channelName ? { channelName: event.channelName } : {}),
      };
      // ⭐ Sikeres kapcsolat ⇒ tiszta lap: a következő kiesés megint a teljes sorozatot kapja.
      this.voiceRejoinAttempts = 0;
    }

    // 🔁 KIESÉS UTÁN VISSZA IS KELL LÉPNI. Mérve 2026-09-08: a bot 10:57:54-kor kiesett, és
    // ⛔ SOHA nem lépett vissza — a csatorna üresen maradt. A naplózás elkapta, a CSELEKVÉS
    // hiányzott: tudtuk, hogy kiestünk, és nem csináltunk vele semmit.
    // ⚠️ A szándékos kilépést (`left`) NEM követi újra-belépés — abból épp kifelé tartunk.
    if (event.kind === 'dropped' || event.kind === 'join-failed') this.scheduleVoiceRejoin();

    await this.safeLog({
      kind: line.level,
      summary: line.summary,
      extra: {
        code: line.code,
        ...(event.channelName ? { channelName: event.channelName } : {}),
        ...(event.reason ? { reason: event.reason } : {}),
        ...(event.offlineMs === undefined ? {} : { offlineMs: event.offlineMs }),
      },
    });
  }

  /**
   * 🎙️ A FELVÉTEL elindítása a hang-csatornán — CSAK sikeres belépés után.
   *
   * 🔴 LUSTA BETÖLTÉS, MÉRT OKKAL: az átemelt hang-lánc hidegindítása **19,5 s**
   * (mérve 2026-09-07). Ha ez a figyelő indulási útvonalán lenne, minden szerver-indulás
   * ennyivel csúszna — és a Discord-csatorna ennyivel tovább lenne néma. Itt viszont már
   * bent ülünk, tehát a késés senkit nem tart fel.
   *
   * ⚠️ A bukás NEM fatális: a szöveges csatorna a fő út, azt egy hang-hiba nem némíthatja el.
   */
  private async startVoiceRecording(channelId: string): Promise<void> {
    const connection = this.voicePresence.activeConnection;

    if (!connection) return;

    // 🔇 A KIESES-JELENTO. Owner 22:08: „fingom nincs, hogy mi ment at, mi nem." Eddig a
    // sikertelen felismeres TELJES CSENDET adott — a „nem ertettem" es a „meg sem hallottam"
    // megkulonboztethetetlen volt. ⭐ Osszevonva kuld, kulonben a mai ~99%-os eldobas-arany
    // mellett szetspammelne a csatornat (`voice-missed-speech.ts`).
    await this.missedSpeech?.stop();
    this.missedSpeech = new MissedSpeechReporter({
      channelId: channelId,
      speakerName: 'Itharen',
      onError: (detail: string): void => {
        void this.safeLog({
          kind: 'error',
          summary: `[discord/listener] MA-VOICE-MISSED-REPORT-FAILED: ${detail}`,
          extra: { code: VOICE_LOG_CODES.missedReportFailed },
        });
      },
    });

    // 🔊 HANGJELZESEK. Owner 21:49: „voltak hangvisszajelzesek… hallottad, hogy mit mondtam,
    // erted, hogy mit mondtam". ⭐ Aki BESZEL, az nem a kepernyot nezi: a szoveges tukor
    // UTOLAG igazol, a hang KOZBEN mond valamit. A ketto nem helyettesiti egymast.
    // ⛔ A transzplantalt `playSound` NEM hasznalhato: sajat CCAP-kapcsolatot epitene
    // (`CCAP_MasterService`), ami nalunk nem letezik — ezert az adapter MELLE kerult.
    this.cues?.detach();
    this.cues = new VoiceCuePlayer({
      onError: (detail: string): void => {
        void this.safeLog({
          kind: 'error',
          summary: `[discord/listener] MA-VOICE-CUE-FAILED: ${detail}`,
          extra: { code: VOICE_LOG_CODES.cueFailed },
        });
      },
    });
    this.cues.attach(connection);

    // 🗣️ FELOLVASÁS, HA AZ OWNER BENT VAN (owner, 2026-09-10 18:27: „a voice-ra, hogyha ott
    // vagyok, akkor fel is olvasod").
    //
    // ⭐ A KIMENŐ NAPLÓT figyeljük, nem új csatornát: a `recordOutbound` minden üzenetet
    // beír oda PONTOSAN EGYSZER. Így a felolvasás nem hoz létre új üzenet-eseményt.
    await this.startReadAloud();

    // 🩺 A HANG-JELENLÉT A SZOLGÁLTATÁST JELEZZE, NE A FOLYAMATOT (owner, 2026-09-10 18:28).
    // ⚠️ MÉRVE: a jel- és `stdin`-alapú horgony hatástalan, mert a `tsx` közbeiktat egy
    // folyamatot, és a figyelő a szerver UNOKÁJA — l. `voice-service-watch.ts` fejlécét.
    this.startServiceWatch();

    const result = await startVoiceRecording({
      connection: connection,
      ownerUserId: (process.env['MA_DISCORD_USER_ID'] ?? '').trim(),
      ownerName: 'Itharen',
      channelId: channelId,
      // 🔴 A NEMA ELDOBAS LATHATOVA TETELE. Owner 22:08: „beszéltem, beszéltem, tulajdonképpen
      // annak egy százaléka lett aztán transzkriptálva". Enelkul sem o, sem en nem tudjuk,
      // HANY megszolalas veszett el — es a szuro allitgatasa puszta talalgatas lenne.
      // 🔊 A „dolgozom rajta" jelzés — a FELDOLGOZÁS kezdetén, nem a felvételkor.
      onProcessingStart: (): void => void this.cues?.play('heard'),
      onSpeechAttempt: (stats: SpeechAttemptStats): void => {
        // 🔇 ITT MAR NEM SZOLALUNK MEG — owner, 2026-09-10 18:07 (hangcsatorna):
        // „meg mindig a typing hangot hallom, pedig ennek a hangnak akkor kene lejatszodni,
        //  amikor elkezdett feldolgozni az uzeneteket, es nem pedig amikor elkezdett felvenni."
        // A hang (CCAP `typing.mp3`) nala „dolgozom rajta"-t jelent => a PILLANAT volt rossz,
        // nem a hang. Atkerult az `onProcessingStart`-ra (l. lentebb).

        void this.safeLog({
          kind: 'note',
          summary: `[discord/listener] 🎙️ Megszólalás érzékelve — ${stats.detected} észlelt / `
            + `${stats.delivered} eljutott a feldolgozásig.`,
          extra: {
            code: VOICE_LOG_CODES.speechDetected,
            detected: stats.detected,
            delivered: stats.delivered,
            droppedSoFar: stats.detected - stats.delivered,
          },
        });
      },
      // 🔍 A NEMA ELDOBAS — masodpercben. Ez valaszolja meg az owner 22:08-as kerdeset:
      // „beszeltem, beszeltem… leginkabb semmi nem ment at". A `detected - delivered` kulonbseg
      // ezt NEM tudta megmondani, mert osszemosta az osszeolvadt megszolalast a valodi
      // veszteseggel (`voice-drop-probe.ts`).
      onSpeechDropped: (observation: VoiceDropObservation): void => {
        void this.safeLog({
          kind: 'error',
          summary: `[discord/listener] MA-VOICE-SPEECH-DROPPED-SILENTLY: `
            + `${observation.lostAudioSeconds} mp hang ELVESZETT (${observation.reason}).`,
          extra: {
            code: VOICE_LOG_CODES.droppedSilently,
            filename: observation.filename,
            lostAudioSeconds: observation.lostAudioSeconds,
            maxSizeBytes: observation.maxSizeBytes,
            lifetimeMs: observation.lifetimeMs,
            reason: observation.reason,
            remedy: observation.reason === 'discarded-by-recorder'
              ? 'A felvevő beszéd-validációja (minSpeechDuration / speechThreshold / ZCR) dobta ki. '
                + 'A küszöb csak ELÉG MÉRÉS UTÁN állítható — és MELLÉ, nem az átemelt kódba.'
              : 'A felvétel a fejlécen túl üres volt — itt tényleg nem volt mit felismerni.',
          },
        });

        // 🗺️ A visszajelzes-tabla dont, nem ez a callback — igy TESZTELHETO
        // (`voice-feedback-plan.ts`). Az ures fajlrol pl. szandekosan hallgatunk.
        this.applyVoiceFeedback(planFeedbackForDrop(observation));
      },
      // 🔴 A HANG NEM VESZHET EL. Merve 2026-09-08 01:35: 3 felvetel bukott 5 perces STT-
      // idotullepessel, es MIND VEGLEG ELVESZETT — a SttRetryQueue letezett, de a
      // hang-csatorna utja nem hasznalta. A WAV-ot a felvevo takaritasa torli.
      onRecognitionFailed: (info: { audio: Uint8Array; filename: string; failure: string }): void => {
        void this.queueVoiceChannelForRetry(channelId, info);
      },
      onProbeError: (detail: string): void => {
        void this.safeLog({
          kind: 'error',
          summary: `[discord/listener] MA-VOICE-PROBE-ERROR: ${detail}`,
          extra: { code: VOICE_LOG_CODES.probeError },
        });
      },
      onHandled: (outcome: RecordingHandled): void => {
        // ⚠️ HAROM KIMENETEL, HAROM KOD — az osztalyozas TESZTELT fuggvenyben all
        // (`classifyRecordingOutcome`), mert ezt mar ketszer elrontottam.
        const outcomeCode: RecordingOutcomeCode = classifyRecordingOutcome(outcome);

        void this.safeLog({
          kind: outcomeCode === VOICE_LOG_CODES.dropped ? 'error' : 'note',
          summary: `[discord/listener] ${outcomeCode === VOICE_LOG_CODES.queued ? '🎙️ Hang-csatorna:' : `${outcomeCode}:`} `
            + `${outcome.detail}`,
          extra: {
            code: outcomeCode,
            fromOwner: outcome.fromOwner,
            transcribed: outcome.transcribed,
            // 🔴 A KEZBESITETT DARABSZAM ITT IS KIMEGY. Merve 2026-09-08 01:35: a
            // `MA-VOICE-SPEECH-DETECTED` sor CSAK uj megszolalaskor irodik, tehat a KESOBB
            // befejezodo feldolgozasok (az STT percekig tart!) sosem kerultek naploba =>
            // a tolcser `delivered` szama strukturalisan ALULMERT. A kimenetel-sor viszont
            // mindig akkor kel, amikor tenyleg befejezodott valami.
            deliveredSoFar: this.dropProbe?.funnel.filesDelivered ?? null,
            ...(outcome.missed ? { missed: outcome.missed } : {}),
          },
        });

        // 🗺️ Ugyanaz a TESZTELT tabla dont itt is. ⭐ Duplikatumnal es idegen beszelonel
        // CSEND a helyes valasz — ha szolnank, az owner azt hinne, elveszett valami.
        this.applyVoiceFeedback(planFeedbackForOutcome(outcome));
      },
    });

    await this.safeLog({
      kind: result.started ? 'note' : 'error',
      summary: result.started
        ? '[discord/listener] 🎙️ A hang-csatorna felvétele elindult.'
        : `[discord/listener] MA-VOICE-RECORDING-FAILED: ${result.detail}`,
      extra: {
        code: result.started ? 'MA-VOICE-RECORDING-STARTED' : 'MA-VOICE-RECORDING-FAILED',
        ...(result.remedy ? { remedy: result.remedy } : {}),
      },
    });

    // ⚠️ A KORÁBBI szondát mindenképp leállítjuk, mielőtt az újat eltesszük — egy
    // újracsatlakozás különben két mintavételezőt hagyna ugyanazon a könyvtáron.
    this.dropProbe?.stop();
    this.dropProbe = result.probe ?? null;
  }

  /**
   * 🔴 Egy hang-csatornas felvetel eltevese ujraprobalasra.
   *
   * ⭐ MIERT A MEGLEVO SORBA, es miert nem uj: a `SttRetryQueue` mar viszi a novekvo
   * varakozasi lepcsoket, a feladas-uzenetet es a `comm doctor` lathatosagat. Egy kulon ut
   * mindezt UJRA megkovetelne, es minden hibajat kulon kellene megtalalni.
   *
   * ⚠️ A `source: 'voice-channel'` NEM diszites: ez donti el, hogy a sikeres ujraprobalas
   * `🔊 HANGCSATORNA`-kent kerul a kotegbe, es hogy a tukor a HANG-csatornaba megy — nem a
   * fo chatbe, es nem valaszkent egy nem letezo uzenetre.
   *
   * Hibat SOHA nem dob: ha maga az eltevés bukik, azt naploval jelezzuk.
   */
  private async queueVoiceChannelForRetry(
    channelId: string,
    info: { audio: Uint8Array; filename: string; failure: string },
  ): Promise<void> {
    try {
      const entry: SttRetryEntry | null = await this.retryQueue.enqueue({
        // ⚠️ A fajlnev az azonosito — megszolalasonkent egyedi, es a sor ugyanezt hasznalja
        // duplikacio-vedelemre. (Ez NEM Discord-uzenet-azonosito, ezert kell a `source`.)
        messageId: info.filename,
        channelId: channelId,
        authorId: (process.env['MA_DISCORD_USER_ID'] ?? '').trim(),
        authorName: 'Itharen',
        filename: info.filename,
        contentType: 'audio/wav',
        audio: info.audio,
        failure: info.failure,
        source: 'voice-channel',
      });

      await this.safeLog({
        kind: 'note',
        summary: entry
          ? `[discord/listener] 🔊 A hang-csatornas felvetel ELTEVE ujraprobalasra `
            + `(${MAX_ATTEMPTS - 1} proba van hatra) — ${info.failure}`
          : `[discord/listener] MA-VOICE-NO-RETRY: nincs tobb probalkozasi lepcso — ${info.failure}`,
        extra: { code: 'MA-VOICE-QUEUED-FOR-RETRY', messageId: info.filename, queued: entry !== null },
      });
    } catch (err: unknown) {
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-VOICE-RETRY-ENQUEUE-FAILED: a hangot NEM sikerult eltenni '
          + `ujraprobalasra, ezert VEGLEG elveszhet — ${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-VOICE-RETRY-ENQUEUE-FAILED', messageId: info.filename },
      });
    }
  }

  /**
   * A visszajelzés-terv VÉGREHAJTÁSA — hang + kiesés-jelentés.
   *
   * ⭐ A **döntés** a tesztelt `voice-feedback-plan.ts`-ben van; itt csak a mellékhatás
   * történik. Így a „mi szóljon" kérdés élő Discord-kapcsolat nélkül is vizsgálható.
   *
   * ⚠️ Mindkét lépés `?.` mögött: ha a hang-lánc nem áll fel, az a szöveges csatornát
   * **nem némíthatja el**.
   */
  private applyVoiceFeedback(plan: VoiceFeedbackPlan): void {
    if (plan.cue) void this.cues?.play(plan.cue);
    if (plan.missed) this.missedSpeech?.note(plan.missed);
  }

  /**
   * A nem-hang csatolmányok lementése az inboxba.
   *
   * ⭐ MIÉRT A REPÓBA, és nem a futásidejű `~/.config` alá: az inbox **munka-bemenet**, amit a
   * következő körben kézzel dolgozok fel — ott kell lennie, ahol dolgozom, és látszania kell a
   * `git status`-ban. *(A hangfájlokkal ellentétben, amik átmeneti nyersanyagok.)*
   *
   * Hibát SOHA nem dob: egy le nem tölthető fájl nem döntheti meg a figyelőt — a bukás a
   * visszaadott szövegben látszik, és naplóba is kerül.
   *
   * @returns a kötegbe fűzendő megjegyzés, vagy üres sztring, ha nincs mit közölni.
   */
  private async saveAttachmentsToInbox(incoming: IncomingDiscordMessage): Promise<string> {
    const files = (incoming.attachments ?? []).filter((a): boolean => !isAudioAttachment(a));

    if (!files.length) return '';

    try {
      const result = await saveInboxAttachments({
        attachments: files,
        inboxDir: join(resolveProjectRoot(), '__agent', 'inbox'),
      });

      await this.safeLog({
        kind: result.failed.length ? 'error' : 'note',
        summary: result.failed.length
          ? `[discord/listener] MA-DISCORD-INBOX-PARTIAL: ${result.saved.length} fájl lementve, `
            + `${result.failed.length} NEM — ${result.failed.map((f): string => f.originalName).join(', ')}`
          : `[discord/listener] ${result.saved.length} csatolmány az inboxba mentve.`,
        extra: {
          code: result.failed.length ? 'MA-DISCORD-INBOX-PARTIAL' : 'MA-DISCORD-INBOX-SAVED',
          messageId: incoming.messageId,
          saved: result.saved.map((f): string => f.storedName),
          failed: result.failed,
        },
      });

      return result.note;
    } catch (err: unknown) {
      const detail: string = err instanceof Error ? err.message : String(err);

      await this.safeLog({
        kind: 'error',
        summary: `[discord/listener] MA-DISCORD-INBOX-FAILED: a csatolmányok NEM lettek lementve — ${detail}`,
        extra: { code: 'MA-DISCORD-INBOX-FAILED', messageId: incoming.messageId },
      });

      // 🔴 A hiba a SZÖVEGBE is bekerül: így az üzenettel EGYÜTT látom, hogy fájl jött és elveszett.
      return `📥 CSATOLMÁNY érkezett, de a lementése ELBUKOTT: ${detail}`;
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

    // 🔴 A MEMÓRIA-HALMAZ CSAK EZT A FUTÁST VÉDI — az ÚJRAINDÍTÁST NEM.
    //
    // Az LDP folyamatosan újraindít; minden indulásnál üres halmazzal kezdünk. Ha a Discord
    // ezután újraküldi ugyanazt a hangüzenetet *(gateway-ismétlés, újracsatlakozás)*, a
    // felismerés ÚJRA lefutna — percekig tartó FDP AI-hívás, majd egy **második tükör-üzenet**
    // az ownernek ugyanarról a hangról.
    //
    // > **Owner (2026-09-07):** *„elkerüljük a duplikációkat és ismételt üzenetküldéseket"*
    //
    // ⭐ A tartós nyilvántartás *(köteg + archívum)* ezt tudja — csak meg kellett kérdezni.
    // ⚠️ A sorrend SZÁNDÉKOS: a drága lépés ELŐTT kérdezünk, nem utána.
    if (await this.bridge.getStore().isKnownMessage(incoming.messageId)) {
      await this.safeLog({
        kind: 'note',
        summary: '[discord/listener] A hangüzenetet MÁR feldolgoztuk egy korábbi futásban — '
          + 'nem ismerjük fel újra, és nem küldünk második tükröt.',
        extra: { code: 'MA-DISCORD-VOICE-ALREADY-PROCESSED', messageId: incoming.messageId },
      });

      return null;
    }

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
        // ⭐ A Discord megadja a hangüzenet hosszát — ez az arány-ellenőrzés bemenete.
        ...(attachment.durationSecs === undefined ? {} : { audioDurationSecs: attachment.durationSecs }),
      });
    } catch (err: unknown) {
      // ⚠️ Itt nem a felismeres BUKASA jon (azt a `result.ok` viszi), hanem egy VARATLAN
      // kivetel. Eddig csak a `finally` allt itt, tehat a kivetel a keretbol kiszokott, es
      // az egesz uzenet-feldolgozas nemán megszakadt — a hang pedig NEM kerult a sorba.
      SwallowedFailure_Util.report('discord.listener.transcribeAudio', err);
      throw err;
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

    // 📒 A PÁROSÍTÁS RÖGZÍTÉSE (T-68) — a siker is bekerül, nem csak a bukás. Az owner
    // kérdése *„melyik üzenethez melyik transzkript tartozik"* önmagában érték.
    await this.recordTranscript({
      messageId: incoming.messageId,
      channelId: incoming.channelId,
      authorName: incoming.authorName,
      filename: attachment.name,
      ...(attachment.durationSecs === undefined ? {} : { durationSecs: attachment.durationSecs }),
      transcript: result.text,
      attempts: 1,
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
    // 🔴 A HALLGATÁS AZ ALAPÉRTELMEZÉS — egyetlen üzenetre NEM nyugtázunk.
    // Mérve 2026-09-08: 17 ilyen nyugta ment ki egy nap alatt. Owner: „össze lett spam-elve".
    if (!shouldSendDeliveryNotice(deliveredCount)) return;

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
    /**
     * A csatorna, ahonnan a forras-uzenet valo — ⭐ CSAK az ujraprobalasi uton kell.
     *
     * 🔴 Ekkor ugyanis a `source` objektum mar NINCS meg (a sor csak azonositokat orzott
     * meg), es enelkul a tukor „a semmibe" menne: az owner egy VEGLEG-NEM-SIKERULT uzenetet
     * kap, es nem tudja, MELYIK hanguzenetrol van szo. Merve 2026-09-08 13:48.
     */
    channelId?: string,
  ): Promise<void> {
    // ⭐ ELSŐ PRÓBA: válasz a hangüzenetre. Ez az egyetlen mód, ami LÁTHATÓAN összeköti az
    // átiratot a forrásával — és ráadásul olcsóbb is, mert a figyelő kapcsolatát használja.
    const target: VoiceAcknowledgeTarget | null = source
      ?? (channelId ? await this.fetchReplyTarget(channelId, messageId) : null);

    if (target && await this.replyMirror(text, messageId, target)) return;

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
        await this.sendGiveUp(entry, composeGiveUpMessage(entry));

        return;
      }

      this.sttInFlight = true;

      let result;

      try {
        result = await transcribeAudio({
          audio: audio,
          filename: entry.filename,
          ...(entry.contentType ? { contentType: entry.contentType } : {}),
          ...(entry.durationSecs === undefined ? {} : { audioDurationSecs: entry.durationSecs }),
        });
      } catch (err: unknown) {
        // A kulso `catch` naplozza (`MA-STT-RETRY-FAILED`), de a `sttInFlight` zar miatt ez a
        // keret sajat jogan is erdekes: enelkul nem derulne ki, hogy a felismero-hivas maga
        // szallt el, nem az ot koveto kezbesites.
        SwallowedFailure_Util.report('discord.listener.retry.transcribeAudio', err);
        throw err;
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

  /**
   * 📒 Egy SIKERES felismerés rögzítése a nyilvántartásba.
   *
   * ⛔ **SOHA NEM DOB.** A nyilvántartás **kísérő** funkció: ha elhasal, az nem viheti magával
   * a kézbesítést. ⚠️ De ⛔ **nem néma**: a bukás naplóba kerül, különben csak annyi látszana,
   * hogy „hiányzik egy bejegyzés", és senki nem tudná, miért.
   */
  private async recordTranscript(input: Parameters<TranscriptLedger['recordResolved']>[0]): Promise<void> {
    try {
      await this.ledger.recordResolved(input);
    } catch (err: unknown) {
      await this.safeLog({
        kind: 'error',
        summary: '[discord/listener] MA-STT-LEDGER-WRITE-FAILED: a transzkript-nyilvántartás '
          + `írása nem sikerült — ${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-STT-LEDGER-WRITE-FAILED', messageId: input.messageId },
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
    await this.sendGiveUp(entry, composeGiveUpMessage({ ...entry, lastFailure: failure }));
  }

  /**
   * A FELADÁS-üzenet — oda, ahonnan a hang jött.
   *
   * 🔴 Ez a legfontosabb üzenet az egész sorban: itt mondjuk ki, hogy **a tartalom elveszett**.
   * ⚠️ Ha egy hang-csatornás tételnél a fő chatbe menne, az owner **pont ezt nem látná** ott,
   * ahol beszélt — ugyanaz a hibaosztály, amit a friss átiratnál 21:47-kor már javítottunk.
   */
  private async sendGiveUp(entry: SttRetryEntry, text: string): Promise<void> {
    await this.sendByPlan(planRetryDelivery(entry), text, entry.messageId, entry.channelId);
  }

  /**
   * ⭐ A CÉL: a későn felismert szöveg ugyanúgy a KÖTEGBE kerül, mintha elsőre sikerült volna.
   *
   * ⚠️ A tükör csak azt mondja meg az ownernek, hogy megvan. Ha itt megállnánk, a tartalom
   * **hozzám** még mindig nem jutna el — vagyis a sor a cél előtt egy lépéssel bukna el.
   */
  private async deliverRetriedTranscript(entry: SttRetryEntry, text: string): Promise<void> {
    // 🔊 A HANG-CSATORNAS FELVETEL MASKEPP KEZBESITENDO — merve 2026-09-08 02:15.
    //
    // ⚠️ Ket dolog lenne HIBAS a hanguzenet-uton: (a) `🎙️ HANGÜZENET`-kent jelolne, elfedve,
    // hogy ELO BESZEDROL van szo *(mas bizonytalansag — a szegmentalas is hibazhat)*;
    // (b) a tukor egy NEM LETEZO uzenetre valaszolna, mert ott a `messageId` a WAV fajlneve.
    // 🗺️ A DÖNTÉS tesztelt fuggvenyben all (`stt.retry-delivery.ts`), mert itt harom
    // viselkedes ter el a ket forras kozott — es mindharmat el lehetett volna rontani.
    // 📒 A KÉSŐI siker is a nyilvántartásba kerül — ⭐ és a `firstSeenAt` megmarad, tehát
    // utólag látszik, MENNYI IDŐ alatt oldódott fel.
    await this.recordTranscript({
      messageId: entry.messageId,
      channelId: entry.channelId,
      authorName: entry.authorName,
      filename: entry.filename,
      ...(entry.durationSecs === undefined ? {} : { durationSecs: entry.durationSecs }),
      transcript: text,
      attempts: entry.attempts,
    });

    const plan: RetryDeliveryPlan = planRetryDelivery(entry);
    const transcript: string = plan.markAs === 'voice-channel'
      ? composeVoiceChannelEntry({ transcript: text, speakerName: entry.authorName })
      : composeTranscriptForBatch({
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
    const mirror: string = `${plan.headline}\n`
      + `*(a ${entry.attempts}. próbálkozásra sikerült)*\n\n${text}`;

    await this.sendByPlan(plan, mirror, entry.messageId);
  }

  /**
   * A tükör kiküldése a TERV szerint.
   *
   * ⭐ ODA megy, ahol elhangzott: a hang-csatornás tétel tükre a HANG-csatornába, nem a fő
   * chatbe. *(Ugyanaz a hibaosztály, amit 21:47-kor a friss átiratnál már javítottunk.)*
   */
  private async sendByPlan(
    plan: RetryDeliveryPlan,
    text: string,
    messageId: string,
    /**
     * A forras-uzenet csatornaja — ⭐ EZ KELL A VALASZHOZ.
     *
     * 🔴 MERT HIANY (owner, 2026-09-08 13:48): *„Adtal egy ilyet de nem tudom mire vonatkozik,
     * ilyenkor kellene a reply."* Az ujraprobalasnal a forras-uzenet OBJEKTUMA mar nincs
     * kezben, csak az azonositoja — ezert a tukor sima csatorna-uzenetkent ment ki, es az
     * owner nem tudta, MELYIK hanguzenetrol van szo.
     */
    channelId?: string,
  ): Promise<void> {
    if (plan.mirror.to === 'channel') {
      await this.sendToChannel(text, plan.mirror.channelId, messageId);

      return;
    }

    await this.sendMirror(text, messageId, undefined, channelId);
  }

  /**
   * Egy uzenet EGY KONKRET csatornaba — a hang-csatornas tukrokhoz.
   *
   * ⚠️ Hibat sosem dob: a kezbesites bukasat naplozzuk, de a sor tovabb dolgozik.
   */
  private async sendToChannel(text: string, channelId: string, messageId: string): Promise<void> {
    const sent = await sendDiscordMessage(text, 'ack', channelId);

    if (sent.sent) return;

    await this.safeLog({
      kind: 'error',
      summary: `[discord/listener] MA-VOICE-RETRY-MIRROR-UNDELIVERED: ${sent.detail}`,
      extra: { code: 'MA-VOICE-RETRY-MIRROR-UNDELIVERED', messageId: messageId, channelId: channelId },
    });
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
  /**
   * A forras-uzenet LEKERESE az azonositoja alapjan — hogy VALASZOLNI tudjunk ra.
   *
   * ⛔ SOHA NEM DOB. Ha a lekeres bukik (torolt uzenet, elveszett jogosultsag, halott
   * kapcsolat), `null`-t adunk, es a hivo sima csatorna-uzenetre valt. ⚠️ A bukas viszont
   * NEM nema: naplozzuk, kulonben csak annyi latszana, hogy „megint nem valasz jott".
   */
  private async fetchReplyTarget(
    channelId: string,
    messageId: string,
  ): Promise<VoiceAcknowledgeTarget | null> {
    if (!this.client) return null;

    try {
      const channel = await this.client.channels.fetch(channelId);

      if (!channel || !channel.isTextBased()) return null;

      return await channel.messages.fetch(messageId) as unknown as VoiceAcknowledgeTarget;
    } catch (err: unknown) {
      await this.safeLog({
        kind: 'note',
        summary: '[discord/listener] MA-DISCORD-REPLY-TARGET-MISSING: a forras-uzenet nem '
          + `kerheto le, sima csatorna-uzenetre valtok — ${err instanceof Error ? err.message : String(err)}`,
        extra: { code: 'MA-DISCORD-REPLY-TARGET-MISSING', channelId, messageId },
      });

      return null;
    }
  }

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

      // 10008 = Unknown Message — ez a BIZONYOS torles, VART eset. Minden mas viszont
      // „nem tudom": halozat, jogosultsag, tulterheles. ⛔ Eddig mindketto ugyanolyan nema
      // volt, pedig az elso vegleges tenyt allit, a masodik csak bizonytalansagot.
      if (code === 10008) {
        return { kind: 'deleted' };
      }
      SwallowedFailure_Util.report('discord.listener.fetchReplyTarget', err);

      return { kind: 'unknown' };
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
    // 🔊 A HANG-TÖLCSÉR IS UTAZIK — így a konzol-pulzus meg tudja mutatni (T-52).
    // ⚠️ Ha nincs élő szonda, a mező KIMARAD — nem nullázódik. A „nem fut" és a „fut, de
    // nem történt semmi" két különböző állapot, és a pulzus is másképp mutatja őket.
    // ⚠️ A `voice` mező akkor kerül bele, ha a hang-csatorna BE VAN ÁLLÍTVA — akkor is, ha a
    // belépés elbukott. ⭐ Így a `voice` HIÁNYA egyértelműen azt jelenti: „nincs beállítva"
    // *(jogos csend)*, a `joined: false` pedig azt: „be van állítva, de NINCS BENT" *(hiba)*.
    const funnel: VoiceFunnelStats | undefined = this.dropProbe?.funnel;
    const presence = this.voicePresenceState;

    await writeHeartbeat({
      updatedAt: new Date().toISOString(),
      botTag,
      processedCount: this.processedCount,
      pid: process.pid,
      ...(presence.configured
        ? {
          voice: {
            joined: presence.joined,
            ...(presence.channelName ? { channelName: presence.channelName } : {}),
            speechStarts: funnel?.speechStarts ?? 0,
            filesOpened: funnel?.filesOpened ?? 0,
            filesDelivered: funnel?.filesDelivered ?? 0,
            filesDropped: funnel?.filesDropped ?? 0,
            lostAudioSeconds: funnel?.lostAudioSeconds ?? 0,
          },
        }
        : {}),
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

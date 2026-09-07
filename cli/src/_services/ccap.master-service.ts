// 🔌 ILLESZTŐ a régi CCAP `CCAP_MasterService` helyére.
//
// > **Owner (2026-09-07):** *„semmit nem szabad változtatni a kódban jelenleg, mert nagyon
// > törékeny az a kód, de cserében meg egész jól működött."*
//
// ⭐ EZÉRT VAN EZ A FÁJL PONTOSAN ITT. Az átemelt voice-modul így hivatkozik rá:
// `../../../_services/ccap.master-service` — ami a `cli/src/_modules/voice/_services/`-ből
// **pontosan ide** mutat. ⇒ Az átemelt fájlokban az import-sor **változatlan maradhat**;
// csak a `.js` kiterjesztés kerül rá, amit az ESM amúgy is megkövetel.
//
// 🔴 A FELÜLET **MÉRT**, NEM TALÁLT: a három modul (voice · voice-output · elevenlabs) a
// `ccap_MS`-ből összesen **ÖT** tulajdonságot használ — semmi mást:
//
//   llmChat_CS (3×) · voiceChannel (2×) · io_CS (1×) · discordServer (1×) ·
//   defaultMessagingProvider (1×)
//
// ⛔ Ezért NEM emeltük át az eredeti 1258 soros ős-szolgáltatást: az nyolc adatszolgáltatót
// húzna be, amiket a hang-út **nem is hív**. A törékeny kód megőrzése nem azt jelenti, hogy
// a KÖRNYEZETÉT is átmásoljuk — csak azt, hogy amit hív, azt megkapja.
//
// Terv: `__agent/plans/voice-control-transplant/hyperplan.plan.md`

import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import type {
  DyNTS_Bot_MessageWrapper,
  DyNTS_Bot_MessagingProvider_ServiceBase,
} from '@futdevpro/nts-dynamo/bot';
import type { Channel, Client, Guild } from 'discord.js';

import { VoiceChannelBridge } from '../voice/voice-channel-bridge.js';

/**
 * Az LLM-felülvizsgáló felülete, ahogy a `cv-result-review` hívja.
 *
 * ⚠️ Csak annyi, amennyit a hívó tényleg használ — nem a teljes Dynamo-interfész.
 */
export interface LlmChatAdapter {
  requestSimpleMessageInConversation(params: {
    conversation: unknown;
    message: string;
    issuer: string;
    [key: string]: unknown;
  }): Promise<string>;
}

/** A be-/kimeneti felület, ahogy a `cv-result-review` hívja. */
export interface BotIoAdapter {
  handleMessageWithOptionalPreFlag(params: {
    conversation: unknown;
    message: unknown;
    addPreFlag: string;
    issuer: string;
    [key: string]: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<DyNTS_Bot_MessageWrapper<any, any>>;
}

/**
 * 🔴 AZ LLM-FELÜLVIZSGÁLAT NÁLUNK **ÁTERESZT** — és ez szándékos döntés, nem csonk.
 *
 * A régi bot a felismerés UTÁN két kérdést tett fel egy LLM-nek:
 *   1. beleillik-e a beszélgetésbe (`OK` / `NOISE` / `OUTOFCONTEXT` / `MISPELLED`)
 *   2. javítsd a helyesírást és a félrehallást
 *
 * ⭐ MINDKETTŐ MEGVAN NÁLUNK — csak MÁSHOL, és jobb helyen:
 *   - az **ítéletet ÉN hozom**, a teljes beszélgetés, a feladatok és a szabályok ismeretében;
 *   - a félrehallást a `stt.flags.ts` **megjelöli**, ⛔ nem írja át *(a döntés az owneré)*;
 *   - a hallucinációt a `stt.transcript-guard.ts` mért mintákra szűri.
 *
 * Egy köztes modell ennél **kevesebbet** tud, tehát rosszabbul dönt — ezért nem hívunk egyet.
 *
 * ⚠️ DE NEM NÉMÁN: minden hívást **naplózunk**. Egy csendes „mindig OK" pontosan az a
 * hibafajta, amit a projekt tilt — így viszont LÁTSZIK, ha az ág mégis számítana.
 */
class PassThroughLlmChat implements LlmChatAdapter {

  async requestSimpleMessageInConversation(params: { message: string }): Promise<string> {
    DyFM_Log.info('[voice-adapter] llmChat_CS ÁTERESZT — a felülvizsgálat a CC sessionben '
      + `történik, nem itt. (kérés: ${params.message.slice(0, 80)}…)`);

    // ⭐ `OK` = „az értelmezés rendben". A hívó ezt várja; a valódi mérlegelés a kötegben,
    // nálam történik. ⛔ Az átiratot NEM módosítjuk — a javítgatás pont az a magabiztos
    // beavatkozás, amit az STT-nél elkerülünk.
    return 'OK';
  }
}

/**
 * A be-/kimenet: a felismert szöveg átadása az asszisztensnek.
 *
 * 🔴 EZ A LEGFONTOSABB LEKÉPEZÉS AZ EGÉSZ ILLESZTŐBEN. A `cv-result-review` egyetlen
 * dolgot hív innen — `handleMessageWithOptionalPreFlag` egy `🔊` előtaggal —, és pontosan
 * ez az a pont, ahol a hang-csatornából jövő szöveg **eljut hozzám**.
 *
 * ⭐ Nálunk ez a **meglévő Discord-köteg**. Így a hang-csatorna NEM külön út: ugyanabba a
 * kötegbe folyik, mint a Discord-hangüzenetek — ugyanazzal a duplikáció-védelemmel, ugyanazzal
 * a válasz-kötelezettséggel, és ugyanúgy visszanézhetően (`ma comm history`).
 *
 * ✅ **BEKÖTVE (5. szakasz):** a `VoiceChannelBridge` teszi a kötegbe, és küldi a
 * tükör-szöveget. ⛔ Üres szövegnél NEM hallgat: leíró hibát naplóz.
 */
class BatchBoundBotIo implements BotIoAdapter {

  private readonly bridge: VoiceChannelBridge = new VoiceChannelBridge();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleMessageWithOptionalPreFlag(params: {
    message?: unknown;
    addPreFlag: string;
    issuer: string;
    [key: string]: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<DyNTS_Bot_MessageWrapper<any, any>> {
    const spoken: string = readTranscript(params.message);

    // ⛔ Üres szöveget NEM juttatunk be — de MEGMONDJUK. A néma eldobás itt pont azt
    // veszítené el, amiért az egész hang-út létezik.
    if (!spoken) {
      DyFM_Log.error('[voice-adapter] MA-VOICE-IO-EMPTY: a hang-csatornából ÜRES szöveg '
        + `érkezett (${params.addPreFlag}) — nem tettem a kötegbe.`);

      return null as never;
    }

    const outcome = await this.bridge.handleOwnerSpeech({
      // ⚠️ A szegmens-azonosító a DUPLIKÁCIÓ-VÉDELEM alapja. Ha a hang-modul nem ad
      // stabilat, az idő+szöveg lenyomata áll be helyette — így egy újraindítás után
      // ugyanaz a mondat nem kerül be másodszor.
      messageId: readSegmentId(params) ?? fallbackSegmentId(spoken),
      channelId: readString(params['channelId']) || 'voice-channel',
      speakerId: readString(params['userId']) || params.issuer || 'owner',
      speakerName: readString(params['userDisplayName']) || 'Itharen',
      transcript: spoken,
    });

    DyFM_Log.info(`[voice-adapter] io_CS → köteg: ${outcome.detail}`);

    return null as never;
  }
}

/** A szöveg kinyerése abból, amit a hang-modul átad — több alakot is elfogad. */
function readTranscript(message: unknown): string {
  if (typeof message === 'string') return message.trim();

  if (message && typeof message === 'object') {
    const record = message as Record<string, unknown>;

    for (const key of ['content', 'text', 'transcription']) {
      const value: unknown = record[key];

      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }

  return '';
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** A hang-modul által adott szegmens-azonosító, ha van. */
function readSegmentId(params: Record<string, unknown>): string | null {
  for (const key of ['segmentId', 'messageId', 'id']) {
    const value: unknown = params[key];

    if (typeof value === 'string' && value) return value;
  }

  return null;
}

/**
 * Tartalom-alapú azonosító, ha a hang-modul nem ad sajátot.
 *
 * ⚠️ SZÁNDÉKOSAN a szövegből képződik: így ugyanaz a mondat ugyanazt az azonosítót kapja,
 * és a köteg duplikáció-szűrője **újraindítás után is** felismeri. Egy véletlenszerű
 * azonosító pont ezt a védelmet kapcsolná ki.
 */
function fallbackSegmentId(text: string): string {
  let hash: number = 0;

  for (let index: number = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }

  return `voice-${Math.abs(hash).toString(36)}-${text.length}`;
}

/**
 * A `CCAP_MasterService` helyettesítője — **csak** a mért öt tulajdonsággal.
 *
 * A Discord-oldali értékeket a hang-figyelő állítja be indításkor (`configure`), mert azok
 * csak élő kapcsolatnál léteznek. ⚠️ Beállítás előtt olvasva **leíró hibát** dobunk, nem
 * `undefined`-et adunk vissza: a `undefined` továbbcsorogna, és a hiba máshol bukna ki.
 */
export class CCAP_MasterService {

  private static instance: CCAP_MasterService | null = null;

  static getInstance(): CCAP_MasterService {
    if (!CCAP_MasterService.instance) CCAP_MasterService.instance = new CCAP_MasterService();

    return CCAP_MasterService.instance;
  }

  private discordClient: Client | null = null;
  private guild: Guild | null = null;
  private channel: Channel | null = null;

  readonly llmChat_CS: LlmChatAdapter = new PassThroughLlmChat();
  readonly io_CS: BotIoAdapter = new BatchBoundBotIo();

  /** A hang-figyelő adja át az élő Discord-objektumokat. */
  configure(params: { client: Client; guild: Guild; voiceChannel: Channel }): void {
    this.discordClient = params.client;
    this.guild = params.guild;
    this.channel = params.voiceChannel;
  }

  get client(): Client {
    return this.require(this.discordClient, 'client');
  }

  get discordServer(): Guild {
    return this.require(this.guild, 'discordServer');
  }

  get voiceChannel(): Channel {
    return this.require(this.channel, 'voiceChannel');
  }

  get botClientId(): string {
    return this.discordClient?.user?.id ?? '';
  }

  get botDisplayName(): string {
    return this.discordClient?.user?.displayName ?? '';
  }

  /**
   * A kimenő üzenet-küldő.
   *
   * ⏳ A `voice-output` bekötésekor kap valódi implementációt (4-5. szakasz). Addig a
   * hozzáférés **leíró hibát** ad — ⛔ nem `undefined`-et, amit a hívó észrevétlenül
   * továbbadna.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get defaultMessagingProvider(): DyNTS_Bot_MessagingProvider_ServiceBase<any, any, any> {
    throw new Error('[voice-adapter] MA-VOICE-ADAPTER-NOT-WIRED: a `defaultMessagingProvider` '
      + 'még nincs bekötve — a `voice-output` a terv 4-5. szakaszában jön. '
      + 'Terv: __agent/plans/voice-control-transplant/hyperplan.plan.md');
  }

  /** Beállítatlan érték helyett LEÍRÓ hiba — soha nem néma `undefined`. */
  private require<T>(value: T | null, name: string): T {
    if (value === null) {
      throw new Error(`[voice-adapter] MA-VOICE-ADAPTER-NOT-CONFIGURED: a \`${name}\` még nincs `
        + 'beállítva. A hang-figyelőnek indításkor meg kell hívnia a `configure(...)`-t az élő '
        + 'Discord-kliensel, a szerverrel és a hang-csatornával.');
    }

    return value;
  }
}

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
 * ⏳ A tényleges bekötés a terv **4-5. szakaszában** jön, a felvevő oldallal együtt. Addig
 * **jelez**, hogy hívták — ⛔ a néma elnyelés itt ugyanaz a hiba lenne, mint bárhol máshol.
 */
class BatchBoundBotIo implements BotIoAdapter {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleMessageWithOptionalPreFlag(params: { addPreFlag: string }): Promise<DyNTS_Bot_MessageWrapper<any, any>> {
    // ⛔ NEM néma `null`: ha ezt hívják, mielőtt a kötegbe kötés elkészül, az LÁTHATÓ hiba
    // legyen. Egy üres visszatérés itt csendben elnyelné a felismert szöveget — pontosan azt,
    // amiért az egész hang-út létezik.
    throw new Error(`[voice-adapter] MA-VOICE-IO-NOT-WIRED: io_CS hívás (${params.addPreFlag}), `
      + 'de a Discord-kötegbe kötés még nem készült el (a terv 4-5. szakasza). '
      + 'Terv: __agent/plans/voice-control-transplant/hyperplan.plan.md');
  }
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

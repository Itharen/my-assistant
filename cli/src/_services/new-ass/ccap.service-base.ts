// 🔌 ILLESZTŐ a régi CCAP `CCAP_ServiceBase` helyére.
//
// ⭐ A HELY SZÁNDÉKOS: az átemelt `cv.service-base.ts` így hivatkozik rá —
// `../../../_services/new-ass/ccap.service-base` —, ami a `cli/src/_modules/voice/_services/`-ből
// **pontosan ide** mutat. ⇒ Az átemelt fájl import-sora **változatlan**; csak a `.js`
// kiterjesztés kerül rá, amit az ESM megkövetel.
//
// 🔴 MÉRT TÉNY, AMI EZT A FÁJLT ENNYIRE KICSIVÉ TESZI (2026-09-07): a voice-modul **12**
// szolgáltatása közvetlenül a `DyNTS_SingletonService`-ből származik, és **EGYETLENEGY**
// épül erre az ősre: a `cv-result-review.control-service.ts`.
//
// ⚠️ És épp az az egy az, aminek a feladatát *(a felismerés utáni LLM-felülvizsgálatot)*
// nálunk **én** látom el. Vagyis az eredeti 95 soros ős — a nyolc adatszolgáltatójával,
// a tudás-tárral és a master-kontextussal — **egyetlen, amúgy is átvezetett** hívó miatt
// jönne át. Ezért nem hozzuk át: csak azt adjuk meg, amit ez az egy hívó tényleg elér.
//
// ⛔ Ez NEM az átemelt kód átírása. A `voice/` fájljai bájtra változatlanok maradnak;
// csak az van MÁS, ami ALATTUK van — pontosan úgy, ahogy az átemelési szabály engedi:
// `current/principles/transplant-not-rewrite.md`

import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import type { DyFM_AI_Message } from '@futdevpro/fsm-dynamo/ai';
import type { Client, Guild } from 'discord.js';

import { CCAP_MasterService, type LlmChatAdapter } from '../ccap.master-service.js';

export class CCAP_ServiceBase extends DyNTS_SingletonService {

  readonly ccap_MS: CCAP_MasterService = CCAP_MasterService.getInstance();

  /**
   * Bőbeszédű naplózás.
   *
   * ⚠️ `protected`, mert az átemelt kód **34 helyen** olvassa `this.debugLog`-ként. A
   * láthatóság szűkítése itt nem szigorítás volna, hanem **fordítási hiba** a hívóknál.
   */
  protected debugLog: boolean = false;

  get discordServer(): Guild {
    return this.ccap_MS.discordServer;
  }

  get client(): Client {
    return this.ccap_MS.client;
  }

  get botClientId(): string {
    return this.ccap_MS.botClientId;
  }

  get botDisplayName(): string {
    return this.ccap_MS.botDisplayName;
  }

  get llmChat_CS(): LlmChatAdapter {
    return this.ccap_MS.llmChat_CS;
  }

  /**
   * A csatorna korábbi üzenetei AI-beszélgetésként.
   *
   * 🔴 NÁLUNK ÜRES LISTÁT AD — és ez tudatos, nem hiányzó implementáció.
   *
   * A régi botban ez a **beszélgetés-előzményt** adta annak az LLM-nek, ami a felismerést
   * felülvizsgálta. ⭐ Nálunk **nincs ilyen köztes LLM**: az átirat a Discord-kötegbe kerül,
   * és **én** kapom meg — nekem pedig az előzmény **már megvan**, sokkal teljesebben, mint
   * amit egy csatorna-lekérdezés adna.
   *
   * ⇒ Ide előzményt gyűjteni fölösleges hálózati kör lenne olyasvalakinek, aki már tudja.
   *
   * ⚠️ De **jelzünk**, ha mégis hívják: ha ez az ág egyszer számítani kezd, az derüljön ki
   * a naplóból, ne egy néma üres listából.
   */
  async gatherMessagesInChannel(_channel: unknown, _issuer: string): Promise<DyFM_AI_Message[]> {
    return [];
  }
}

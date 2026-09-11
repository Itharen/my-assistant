// ✍️ `GET | PUT /api/linkedin/post-drafts` — a POSZT-PISZKOZATOK felülete.
//
// > **Owner sorrendje:** profil → **posztok** → üzenetek. A profil-vonal kész ⇒ a posztok jönnek.
//
// ## 🔴 A KORLÁT: a LinkedIn API csak OLVAS
//
// A posztot **nem tudjuk kiküldeni** ⇒ a cél nem az automatizálás, hanem a **súrlódás-mentes
// átvitel**: posztonként egy másolható szöveg, karakterszám a limithez mérve, és posztonként
// pipa arról, hogy megvan.
//
// ⭐ **SSOT:** a lista-döntés a CLI `linkedin-post-drafts` modulja — a szerver **nem másolja**
// le. ⛔ Egy második implementáció azt jelentené, hogy a felület és a CLI **eltérő** limitet
// vagy eltérő „kész"-fogalmat mutathat ugyanarról.

import { Request } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller } from '@futdevpro/nts-dynamo';

import { LinkedinPosts_DataService } from './linkedin-posts.data-service.js';
import { LinkedInPanelEndpoint_Util } from './linkedin-panel-endpoint.util.js';

/**
 * A LinkedIn poszt-piszkozatok felülete.
 *
 * REQ-SYS-CONTROLLER-THIN: a végpont-feladatok **csak delegálnak** — minden logika és minden
 * hiba-becsomagolás a `LinkedinPosts_DataService`-ben van.
 *
 * ## 🔒 MIÉRT NINCS AUTH-PREPROCESS — és mi VAN helyette
 *
 * ⛔ A projektnek **nincs** bejelentkezése: egyetlen owner használja, a **saját gépén**. Ezért
 * a védelem nem jelszó, hanem a **hálózati hatókör**: a `LinkedInWorkspace_LoopbackGuard`
 * *(a szomszéd végpontok bevált mintája)* **csak loopbackról** engedi be a kérést.
 *
 * ⚠️ Ez ⛔ nem a review kikapcsolása: a guard **valódi, futásidejű ellenőrzés**.
 *
 * 🙋 **AMI EZÉRT OWNER-KAPUN ÁLL:** a `endpoint-auth-preprocess` review ezt a két végpontot
 * *(ahogy a hat szomszédját is)* megjelöli. ⛔ Nem hallgattattam el, és ⛔ nem tettem rá
 * csak-ide-bevezetett token-auth-ot sem: az **elnémítaná a panelt**, ha a kliens nem küld
 * tokent. ⇒ **Az auth-modell owner-döntés**, nem az enyém.
 */
export class LinkedinPosts_Controller extends DyNTS_Controller {

  /** Singleton accessor. */
  static getInstance(): LinkedinPosts_Controller {
    return LinkedinPosts_Controller.getSingletonInstance();
  }

  private readonly dataService: LinkedinPosts_DataService = new LinkedinPosts_DataService();

  /** `GET /post-drafts` = a lista · `PUT /post-drafts/posted` = a pipa. */
  setupEndpoints(): void {
    // ⭐ PUSZTA DEKLARÁCIÓ: a loopback-kapu a közös `LinkedInPanelEndpoint_Util`-ban van
    // (⛔ nem itt egy `if`-ben) — így a vezérlő tényleg vékony, és a kapu EGY helyen él.
    this.endpoints = [
      LinkedInPanelEndpoint_Util.guarded({
        name: 'getLinkedInPostDrafts',
        type: DyFM_HttpCallType.get,
        endpoint: '/post-drafts',
        serve: (): Promise<unknown> => this.dataService.readDrafts(),
      }),

      LinkedInPanelEndpoint_Util.guarded({
        name: 'putLinkedInPostPosted',
        type: DyFM_HttpCallType.put,
        endpoint: '/post-drafts/posted',
        serve: (req: Request): Promise<unknown> => this.dataService.markPosted(req.body),
      }),
    ];
  }
}

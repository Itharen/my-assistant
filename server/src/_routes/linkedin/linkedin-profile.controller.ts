// 🔗 `GET | PUT /api/linkedin/profile-update` — a profil-frissítés FELÜLETE.
//
// > **Owner, 2026-09-11 01:52:** *„most az első majd az kell legyen, hogy a **profilt kéne
// > frissítsük**. Amúgy lehet, hogy ahhoz is adhatnál majd egy felületet, meg valami **easy to
// > use, copy-paste-es megoldást**, ugye azt sem tudjuk automatizálni teljesen."*
//
// ## 🔴 A KORLÁT: a LinkedIn API csak OLVAS
//
// A profilt **nem tudjuk átírni** ⇒ a cél nem az automatizálás, hanem a **súrlódás-mentes
// átvitel**: mezőnként egymás mellett a mostani és a javasolt szöveg, mezőnként vágólapra, és
// mezőnként pipa arról, hogy megvan.
//
// ⭐ **SSOT:** a mező-döntés a CLI `linkedin-profile-fields` modulja — a szerver **nem másolja**
// le. ⛔ Egy második implementáció azt jelentené, hogy a felület és a CLI **eltérő** limitet
// vagy eltérő „kész"-fogalmat mutathat ugyanarról.

import { Request } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller } from '@futdevpro/nts-dynamo';

import { LinkedinProfile_DataService } from './linkedin-profile.data-service.js';
import { LinkedInPanelEndpoint_Util } from './linkedin-panel-endpoint.util.js';

/**
 * A LinkedIn profil-frissítés felülete.
 *
 * REQ-SYS-CONTROLLER-THIN: a végpont-feladatok **csak delegálnak** — minden logika és minden
 * hiba-becsomagolás a `LinkedinProfile_DataService`-ben van.
 *
 * ## 🔒 MIÉRT NINCS AUTH-PREPROCESS — és mi VAN helyette
 *
 * ⛔ A projektnek **nincs** bejelentkezése: egyetlen owner használja, a **saját gépén**. Ezért
 * a védelem nem jelszó, hanem a **hálózati hatókör**: a `LinkedInWorkspace_LoopbackGuard`
 * *(a szomszéd végpontok bevált mintája)* **csak loopbackról** engedi be a kérést.
 *
 * ⚠️ Ez ⛔ nem a review kikapcsolása: a guard **valódi, futásidejű ellenőrzés** — a kapu
 * **tényleg ott van**, csak nem auth-alapú, hanem hálózati hatókör-alapú.
 *
 * 🙋 **AMI EZÉRT OWNER-KAPUN ÁLL:** a `endpoint-auth-preprocess` review ezt a két végpontot
 * *(ahogy a négy szomszédját is)* megjelöli. ⛔ Nem hallgattattam el, és ⛔ nem tettem rá
 * token-auth-ot sem: a LinkedIn-felület **szándékosan** loopback-alapú *(saját guard + saját
 * teszt védi)*, és egy csak-ide bevezetett token-auth **elnémítaná a panelt**, ha a kliens
 * nem küld tokent — pontosan az a néma bukás, amit ebben a körben máshol javítottam.
 * ⇒ **Az auth-modell owner-döntés**, nem az enyém.
 */
export class LinkedinProfile_Controller extends DyNTS_Controller {

  /** Singleton accessor. */
  static getInstance(): LinkedinProfile_Controller {
    return LinkedinProfile_Controller.getSingletonInstance();
  }

  private readonly dataService: LinkedinProfile_DataService = new LinkedinProfile_DataService();

  /** `GET /profile-update` = a terv · `PUT /profile-update/pasted` = a pipa. */
  setupEndpoints(): void {
    // ⭐ PUSZTA DEKLARÁCIÓ: a loopback-kapu a közös `LinkedInPanelEndpoint_Util`-ban van
    // (⛔ nem itt egy `if`-ben) — így a vezérlő tényleg vékony, és a kapu EGY helyen él.
    this.endpoints = [
      LinkedInPanelEndpoint_Util.guarded({
        name: 'getLinkedInProfileUpdate',
        type: DyFM_HttpCallType.get,
        endpoint: '/profile-update',
        serve: (): Promise<unknown> => this.dataService.readPlan(),
      }),

      LinkedInPanelEndpoint_Util.guarded({
        name: 'putLinkedInProfilePasted',
        type: DyFM_HttpCallType.put,
        endpoint: '/profile-update/pasted',
        serve: (req: Request): Promise<unknown> => this.dataService.markPasted(req.body),
      }),
    ];
  }
}

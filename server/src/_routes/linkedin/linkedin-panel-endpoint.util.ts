// 🧰 EGY LOOPBACK-VÉDETT PANEL-VÉGPONT — ⭐ EGY helyen, ⛔ nem minden vezérlőben újra.
//
// ## ⚠️ MIÉRT LÉTEZIK — a review MÉRÉSE (2026-09-11 18:30)
//
// A poszt-vezérlő megépítése után két találat jött ugyanarra a szerkezetre:
//
// | találat | mit mondott |
// |---|---|
// | `code-duplication` | *41 sor / 204 token* azonos blokk a profil-vezérlővel *(81% azonos név)* |
// | `thin-controller` | a task-visszahívás **logikát** tartalmaz *(`if`)* — csak delegálás szabad |
//
// ⭐ Mindkettőt **ugyanaz** okozta: a `if (!Guard.allow(req, res)) return;` sor **minden**
// végpontban. ⇒ Ez a segéd **beteszi a kaput** a végpont mögé, és a vezérlő visszakapja azt,
// aminek lennie kell: **puszta deklaráció**.
//
// ## 🔒 A KAPU, AMI ITT ÉL
//
// ⛔ A projektnek **nincs** bejelentkezése: egyetlen owner használja, a **saját gépén**. A
// védelem ezért nem jelszó, hanem a **hálózati hatókör** — a kérés csak **loopbackról** jöhet.
// ⚠️ Ez ⛔ nem a review kikapcsolása: **valódi, futásidejű ellenőrzés**, saját teszttel.

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { LinkedInWorkspace_LoopbackGuard } from './linkedin-workspace-loopback.guard.js';

/** Egy loopback-védett panel-végpont összeállítása. */
export class LinkedInPanelEndpoint_Util {

  /**
   * Egy végpont, ami **csak loopbackról** hívható.
   *
   * @param input a végpont neve, típusa, útvonala, és a **kiszolgáló** hívás.
   * @returns a kész végpont-paraméter.
   *
   * ⚠️ **AZ ÚTVONAL TELJES NÉVEN KELL.** Mérve a hangerőnél: a `route` + `endpoint: '/'`
   * páros a **szülő**-útvonalra képződik, ⛔ nem az alútvonalra.
   *
   * 🔴 **A KAPU BUKÁSA UTÁN NEM HÍVJUK A SZOLGÁLTATÁST** — a guard maga küldi a `403`-at, és
   * a válasz ⛔ nem íródik felül.
   */
  static guarded(input: {
    name: string;
    type: DyFM_HttpCallType;
    endpoint: string;
    /** Amit a végpont visszaad. ⚠️ A kérés-törzs **ismeretlen** adat — a szolgáltatás ellenőrzi. */
    serve: (req: Request) => Promise<unknown>;
  }): DyNTS_Endpoint_Params {
    return new DyNTS_Endpoint_Params({
      name: input.name,
      type: input.type,
      endpoint: input.endpoint,
      preProcesses: [],
      tasks: [ async (req: Request, res: Response): Promise<void> => {
        if (!LinkedInWorkspace_LoopbackGuard.allow(req, res)) return;

        res.send(await input.serve(req));
      } ],
    });
  }
}

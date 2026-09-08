// A RELAY HÁROM VÉGPONTJA.
//
//   POST /api/relay/ingest   ← a telefon ír        (ingest-token)
//   GET  /api/relay/pull     ← a my-assistant olvas (pull-token)
//   POST /api/relay/ack      ← a my-assistant nyugtáz, EKKOR törlünk (pull-token)
//
// ⭐ A HÁROM VÉGPONT AZ ARCHITEKTÚRA: a my-assistant **kezdeményez** minden olvasást, a relay
// SOHA nem hív befelé. Ezért nem kell egyetlen bejövő port sem otthon — ez volt az owner
// kemény korlátja *(„a my assistant server nem lesz elérhető kívülről")*.

import { Request, Response } from 'express';

import { DyFM_Error, DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { authorize, envNameFor, readPresentedToken, type RelayTokenKind } from '../../_services/relay-auth.service.js';
import {
  createItemId,
  pruneBuffer,
  removeAcknowledged,
  type BufferedItem,
} from '../../_services/relay-buffer.service.js';

/**
 * A puffer a MEMÓRIÁBAN él.
 *
 * ⭐ SZÁNDÉKOS DÖNTÉS, nem egyszerűsítés: amit nem írunk lemezre, azt **nem is lehet onnan
 * ellopni**, és egy újraindítás automatikusan kitakarít. A helyzet-adat percekig van itt.
 *
 * ⚠️ Az ára: újraindításkor a még le nem húzott tételek elvesznek. Ezt **elfogadjuk** —
 * a helyzet-adat gyorsan romlandó, és a következő küldés úgyis jön. Egy elveszett pont
 * olcsóbb, mint egy lemezen felejtett előzmény.
 */
let buffer: BufferedItem[] = [];

/** Teszthez / diagnosztikához: a jelenlegi tartalom. */
export function readBuffer(): BufferedItem[] {
  return buffer;
}

/** Teszthez: a puffer visszaállítása. */
export function resetBuffer(): void {
  buffer = [];
}

/** Egységes elutasítás — kívülről NEM megkülönböztethető, hogy MIÉRT. */
function reject(res: Response): void {
  try {
    res.status(401).send({ ok: false, error: 'unauthorized' });
  } catch (error) {
    // ⚠️ Ha a válasz már elment (dupla `send`, megszakadt kapcsolat), az `express` dob. Ez a
    // keret eddig NYOMTALAN volt: az elutasítás elszállt, a hívó pedig időtúllépést látott
    // volna a „401" helyett. A kanonikus kód ezt AZONOSÍTHATÓVÁ teszi.
    throw new DyFM_Error({
      error: error,
      errorCode: 'MA-RELAY-REJECT-SEND-FAILED',
      message: 'Az elutasító válasz kiküldése elszállt.',
    });
  }
}

/** A kérés hitelesítése a megadott fajtájú titokkal. */
function checkAuth(req: Request, kind: RelayTokenKind): boolean {
  try {
    const expected: string = (process.env[envNameFor(kind)] ?? '').trim();

    return authorize(readPresentedToken(req), expected).ok;
  } catch (error) {
    // 🔴 BIZTONSÁGI HATÁR: itt a nyers hiba a TOKEN-összehasonlítás környezetét vinné magával
    // a hálózatra. Ezért a kivétel kanonikus kóddá alakul — a részlet a szerver oldalán marad.
    // ⛔ És mivel dobunk (nem `false`-t adunk), a hitelesítés bukása SOHA nem lesz „átengedés".
    throw new DyFM_Error({
      error: error,
      errorCode: 'MA-RELAY-AUTH-CHECK-FAILED',
      message: 'A kérés hitelesítése elszállt.',
    });
  }
}

export class Relay_Controller extends DyNTS_Controller {
  static getInstance(): Relay_Controller {
    return Relay_Controller.getSingletonInstance();
  }

  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'postIngest',
        type: DyFM_HttpCallType.post,
        endpoint: '/ingest',
        preProcesses: [],
        tasks: [ async (req: Request, res: Response): Promise<void> => {
          if (!checkAuth(req, 'ingest')) {
            reject(res);

            return;
          }

          const item: BufferedItem = {
            id: createItemId(new Date(), Math.random().toString(36).slice(2, 10)),
            receivedAt: new Date().toISOString(),
            payload: req.body,
          };

          buffer = pruneBuffer([...buffer, item]).kept;

          // ⚠️ Az OwnTracks JSON-TOMBOT var valaszkent; barmi mas hibanak latszik nala.
          res.send([]);
        } ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'getPull',
        type: DyFM_HttpCallType.get,
        endpoint: '/pull',
        preProcesses: [],
        tasks: [ async (req: Request, res: Response): Promise<void> => {
          if (!checkAuth(req, 'pull')) {
            reject(res);

            return;
          }

          // ⛔ A lehuzas NEM torol. A torles a nyugtazas dolga (`/ack`) — ha ez a valasz
          // elveszne az uton, az adat itt marad, es a kovetkezo lehuzas ujra hozza.
          buffer = pruneBuffer(buffer).kept;

          res.send({ ok: true, items: buffer });
        } ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'postAck',
        type: DyFM_HttpCallType.post,
        endpoint: '/ack',
        preProcesses: [],
        tasks: [ async (req: Request, res: Response): Promise<void> => {
          if (!checkAuth(req, 'pull')) {
            reject(res);

            return;
          }

          const body = req.body as { ids?: unknown };
          const ids: string[] = Array.isArray(body?.ids)
            ? body.ids.filter((id): id is string => typeof id === 'string')
            : [];

          const before: number = buffer.length;

          buffer = removeAcknowledged(buffer, ids);

          res.send({ ok: true, removed: before - buffer.length, remaining: buffer.length });
        } ],
      }),
    ];
  }
}

// OwnTracks FOGADÓ VÉGPONT — ide küldi a telefon a helyzetet.
//
// > **Owner-döntés (2026-09-07):** OwnTracks, állítható gyakoriság, és ⛔ az otthoni
// > koordinátát NEM tároljuk. Kanonikus: `current/principles/location-retention.md`.
//
// A telefon HTTP-módban egy JSON-t POST-ol ide. A válasz egy JSON-tömb (üres is lehet) —
// az OwnTracks ezt várja, és ebbe lehetne parancsokat visszaküldeni.
//
// 🔴 BIZTONSÁGI HATÁR: ez a végpont **kívülről** kap adatot, ezért
//   1. **megosztott titokkal** védett (`MA_LOCATION_TOKEN`) — enélkül NEM fogad semmit;
//   2. a bemenetet **szigorúan ellenőrzi** (`parseOwnTracksLocation`);
//   3. a tárolási szabályt **típusszinten** kényszeríti (`toStoredLocation`).
//
// ⚠️ A titok a `.env`-ben él, ⛔ SOHA nem a repóban (`fdp-keystore-secrets`).

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { emitServerActionLog } from '../../_collections/action-log.util';
import { appendLocation } from '../../_services/location/location-store.service.js';
import { decideHomeState, parseOwnTracksLocation, toStoredLocation } from '../../_services/location/location.retention.js';
import type { HomeState, StoredLocation } from '../../_services/location/location.models.js';

/**
 * A megosztott titok.
 *
 * 🔴 Ha NINCS beállítva, a végpont **mindent elutasít**. Szándékosan: egy védtelen
 * helyzet-végpont rosszabb, mint egy nem működő — az elsőt nem vennénk észre.
 */
function readToken(): string {
  return (process.env['MA_LOCATION_TOKEN'] ?? '').trim();
}

/** A kérésben érkező titok — fejlécből vagy query-ből (az OwnTracks mindkettőt tudja). */
function readPresentedToken(req: Request): string {
  const header: unknown = req.headers['x-ma-location-token'];
  const query: unknown = req.query['token'];

  if (typeof header === 'string' && header.trim()) return header.trim();
  if (typeof query === 'string' && query.trim()) return query.trim();

  return '';
}

export class Location_Controller extends DyNTS_Controller {
  static getInstance(): Location_Controller {
    return Location_Controller.getSingletonInstance();
  }

  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'postOwnTracks',
        type: DyFM_HttpCallType.post,
        endpoint: '/owntracks',
        preProcesses: [],
        tasks: [ async (req: Request, res: Response): Promise<void> => {
          const expected: string = readToken();

          if (!expected) {
            // ⛔ Nincs beallitva titok -> nem fogadunk. A hibauzenet NEM arulja el, hogy a
            // szerver oldalan hianyzik — kivulrol ugyanaz, mint a rossz token.
            res.status(401).send({ ok: false, error: 'unauthorized' });

            await emitServerActionLog({
              kind: 'error',
              summary: '[location] MA-LOCATION-NO-TOKEN: erkezett helyzet-adat, de a '
                + 'MA_LOCATION_TOKEN nincs beallitva — elutasitva.',
            });

            return;
          }

          if (readPresentedToken(req) !== expected) {
            res.status(401).send({ ok: false, error: 'unauthorized' });

            return;
          }

          const location = parseOwnTracksLocation(req.body);

          // Az OwnTracks tobbfele uzenetet kuld (`transition`, `waypoint`, `lwt`). Ami nem
          // helyzet, arra 200-at adunk ures tombbel — kulonben a telefon hibat jelezne.
          if (!location) {
            res.send([]);

            return;
          }

          const state: HomeState = decideHomeState(location);
          const stored: StoredLocation = toStoredLocation(location, state);
          const written: boolean = await appendLocation(stored);

          if (!written) {
            await emitServerActionLog({
              kind: 'error',
              summary: '[location] MA-LOCATION-WRITE-FAILED: a helyzetet nem sikerult eltarolni.',
            });
          }

          // ⛔ A valaszban SEM adunk vissza koordinatat — csak annyit, hogy megvolt.
          res.send([]);
        } ],
      }),
    ];
  }
}

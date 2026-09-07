// A relay app-bootstrap — `DyNTS_AppExtended` (`@futdevpro/nts-dynamo`).
//
// Mintaforras: `server/src/app.server.ts` (ugyanez a projekt), a dynamo-alapokon
// (owner: "Legyen ez is dynamo alapokon").
//
// A relay SZANDEKOSAN sokkal kevesebbet csinal, mint a fo szerver:
// nincs Mongo, nincs auth-alrendszer, nincs socket, nincs statikus kliens.
// Egy puffer es harom vegpont. Amit nem epitunk be, azt nem is lehet kihasznalni.

import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import {
  DyNTS_App_Params,
  DyNTS_GlobalService_Settings,
  DyNTS_Http_Settings,
  DyNTS_RoutingModule,
} from '@futdevpro/nts-dynamo';
import {
  DyNTS_AppExtended,
  DyNTS_SocketPresence,
  DyNTS_SocketServerService,
} from '@futdevpro/nts-dynamo/socket';

import { Relay_Controller } from './_routes/location/relay.controller.js';

/** A relay HTTP-portja — FDP-konvencio, XY=34 (DEC-MA-010). */
export const RELAY_DEFAULT_PORT: number = 39345;

export class App extends DyNTS_AppExtended {

  getAppParams(): DyNTS_App_Params {
    DyFM_Log.testInfo(`my-assistant-relay starting (env: ${process.env.FDP_ENV ?? 'local'})`);

    return new DyNTS_App_Params({
      name: 'my-assistant Relay',
      title: 'my-assistant-relay',
      version: '0.1.0',
      dbName: '',
      dbUri: '',
      systemShortCodeName: 'MAR',
    });
  }

  getPortSettings(): DyNTS_Http_Settings {
    return { httpPort: Number(process.env.MA_RELAY_PORT ?? RELAY_DEFAULT_PORT) };
  }

  override getApiBasePath(): string {
    return '/api';
  }

  /**
   * A relaynek NINCS globalis szolgaltatas-keszlete: se auth, se DB-modell, se
   * error-handler-alrendszer. Ez SZANDEKOS — amit nem epitunk be, azt nem is lehet
   * kihasznalni egy kozos gepen futo, kivulrol elerheto szolgaltatasban.
   */
  getGlobalServiceCollection(): DyNTS_GlobalService_Settings {
    return {} as DyNTS_GlobalService_Settings;
  }

  /** ⛔ Nincs socket: a relay egy puffer, nem valos-ideju csatorna. */
  getSocketServices(): DyNTS_SocketServerService<DyNTS_SocketPresence>[] {
    return [];
  }

  override getRoutingModules(): DyNTS_RoutingModule[] {
    return [
      new DyNTS_RoutingModule({
        route: '/relay',
        controllers: [ Relay_Controller.getInstance() ],
      }),
    ];
  }
}

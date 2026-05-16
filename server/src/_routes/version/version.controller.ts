// Version-info controller — `GET /api/version` unauth endpoint.
// Visszaadja a server `package.json` `version` mezőjét + boot-időt + opcionális
// git-sha-t (process.env-ből, ha LDP build-step setteli — Phase 6.C).
//
// FR #3f socket-and-version-sync Phase 6.B (cycle 80).
// Pattern: standalone DyNTS_Controller (mint a wave-jsonl), no preProcesses (unauth).

import { Request, Response } from 'express';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { emitServerActionLog } from '../../_collections/action-log.util';

/** Server boot ts — modul-load idejekor, később mind a request response-ban visszaadjuk. */
const BOOT_TS: string = new Date().toISOString();

/** Version response shape — kliens / external monitor parse-elhet. */
interface VersionInfo_Response {
  version: string;
  bootTime: string;
  gitSha: string;
  env: string;
}

/** Reads server `package.json` version field. Hibás eset → 'unknown'. */
async function readPackageVersion(): Promise<string> {
  try {
    const here: string = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath: string = path.resolve(here, '..', '..', '..', 'package.json');
    const raw: string = await fs.readFile(pkgPath, 'utf8');
    const parsed: { version?: string } = JSON.parse(raw) as { version?: string };

    return parsed.version ?? 'unknown';
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-VERSION-READ-FAIL] ${e.message.slice(0, 200)}`,
      extra: { errorCode: 'MA-VERSION-READ-FAIL', issuer: 'version.controller.readPackageVersion', stack: e.stack },
    });

    return 'unknown';
  }
}

/** Version-info HTTP controller. Unauth GET endpoint a verzió + boot-time + git-sha lekérdezésére. */
export class Version_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): Version_Controller {
    return Version_Controller.getSingletonInstance();
  }

  /** Regisztrálja a `GET /` (rooted under `/api/version`) endpoint-ot. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getVersion',
        type: DyFM_HttpCallType.get,
        endpoint: '/',
        // NO preProcesses → unauth (public version-info, status-page friendly).
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const version: string = await readPackageVersion();
            const info: VersionInfo_Response = {
              version,
              bootTime: BOOT_TS,
              gitSha: process.env.MA_BUILD_HASH ?? process.env.GIT_SHA ?? '',
              env: process.env.FDP_ENV ?? 'local',
            };

            res.send(info);
          },
        ],
      }),
    ];
  }
}

// Version-broadcast socket service — minden csatlakozó kliensnek `server:hello`
// event-et küld (boot + per-presence), és 30s tickkel ellenőrzi a server
// `package.json` `version` field változását. Verzió-bump esetén
// `server:version` broadcast minden aktív klienssel.
//
// FR #3f socket-and-version-sync Phase 2.A + 2.B (cycle 58).
// Pattern source: master-prompter Notification_SocketServerService.
//
// Channel: PUBLIC / UNAUTH — a `server:hello` + `server:version` event-ek
// nem tartalmaznak user-data-t, csak version + ts + env. A Phase 5+ user-data
// push-okhoz az auth-handshake külön implementálandó (egy újabb service-szel
// vagy ezen service auth-bővítésével).

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as SocketIO from 'socket.io';

import {
  DyNTS_SocketPresence,
  DyNTS_SocketServerService,
  DyNTS_SocketServerService_Params,
} from '@futdevpro/nts-dynamo/socket';
import { DyFM_SocketEvent } from '@futdevpro/fsm-dynamo/socket';

import { emitServerActionLog } from '../../_collections/action-log.util';

/** Minimal subscription request — a publikus version-channel-hez user-data nem kell. */
export interface VersionSubscription_Request {
  clientId?: string;
}

/** Tick interval — 30s, ahogy a plan-docban szerepel (Q-ver-9 dev-mode kompromisszum később). */
const TICK_INTERVAL_MS: number = 30_000;

/** Resolves a server `package.json` abszolút path-ját — ESM-compat (`fileURLToPath`). */
function resolvePackageJsonPath(): string {
  // Server build layout: server/build/_services/socket-services/foo.js → up 4 = server/
  // Server source layout: server/src/_services/socket-services/foo.ts → up 4 = server/
  const here: string = path.dirname(fileURLToPath(import.meta.url));

  return path.resolve(here, '..', '..', '..', 'package.json');
}

/** Olvassa a `package.json` `version` mezőjét runtime-ban — bump-detekcióhoz fs-ből, nem cache-elve. */
async function readPackageVersion(): Promise<string> {
  try {
    const raw: string = await fs.readFile(resolvePackageJsonPath(), 'utf8');
    const parsed: { version?: string } = JSON.parse(raw) as { version?: string };

    return parsed.version ?? 'unknown';
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-SOCKET-VERSION-READ-FAIL] ${e.message.slice(0, 200)}`,
      extra: { errorCode: 'MA-SOCKET-VERSION-READ-FAIL', issuer: 'version-broadcast.readPackageVersion', stack: e.stack },
    });

    return 'unknown';
  }
}

/**
 * Version-broadcast service. Singleton — `getInstance()`-szel példányosul a
 * `DyNTS_SocketServerService.getSingletonInstance()` pattern szerint.
 *
 * **Konstruktorban** indít egy 30s setInterval-t (Phase 2.B) — az első tick a
 * konstruktor után 30s múlva fut, ekkorra a socket-server biztosan készen áll
 * (a bootstrap a getServiceParams() után készíti elő).
 *
 * **Új kliens subscribe** (Phase 2.A) — `getPresenceFromSubscriptionEventContent`
 * setImmediate-en küldi a `server:hello` event-et az új presence-nek.
 */
export class VersionBroadcast_SocketServerService extends DyNTS_SocketServerService<DyNTS_SocketPresence, VersionSubscription_Request> {

  /** Singleton accessor — DyNTS_SocketServerService.getSingletonInstance() wrapper. */
  static getInstance(): VersionBroadcast_SocketServerService {
    return VersionBroadcast_SocketServerService.getSingletonInstance();
  }

  /** Az utolsó broadcast-olt verzió — mismatch-detekcióhoz a tickben. */
  private lastBroadcastVersion: string | null = null;

  /** A 30s tick interval handle — `unref()`-elve hogy ne tartsa életben a processz-t. */
  private tickHandle: NodeJS.Timeout | null = null;

  /** Konstruktor — singleton-init-kor indul a 30s tick. */
  constructor() {
    super();

    this.tickHandle = setInterval((): void => {
      void this.tickAndBroadcastIfChanged();
    }, TICK_INTERVAL_MS);
    this.tickHandle.unref();
  }

  /** Socket-szerviz paramétereit adja vissza — name = 'MA Version Broadcast', port default (HTTP-multiplex). */
  getServiceParams(): DyNTS_SocketServerService_Params {
    return new DyNTS_SocketServerService_Params({
      name: 'MA Version Broadcast',
    });
  }

  /**
   * Publikus subscription — minimal auth, bárki csatlakozhat. A presence
   * `issuerLocalId`-je a kliens által küldött `clientId` vagy a socket.id fallback.
   * Sikeres subscribe után setImmediate-en `server:hello` event a friss
   * presence-nek (boot broadcast Phase 2.A).
   */
  protected override async getPresenceFromSubscriptionEventContent(
    content: VersionSubscription_Request,
    socket: SocketIO.Socket,
  ): Promise<DyNTS_SocketPresence> {
    const clientId: string = content?.clientId ?? socket.id;
    const presence: DyNTS_SocketPresence = new DyNTS_SocketPresence({
      issuerLocalId: clientId,
      sockets: [ socket ],
      issuer: 'public',
    });

    setImmediate((): void => {
      void this.sendHelloToPresence(clientId);
    });

    return presence;
  }

  /** Üres incoming events tömb — ez a service csak broadcast (S→C only). */
  getIncomingEvents(): DyFM_SocketEvent<unknown>[] {
    return [];
  }

  /** `server:hello` event egy adott presence-nek (új subscriber). */
  private async sendHelloToPresence(clientId: string): Promise<void> {
    try {
      const version: string = await readPackageVersion();
      const payload: { version: string; ts: string; env: string } = {
        version,
        ts: new Date().toISOString(),
        env: process.env.FDP_ENV ?? 'local',
      };

      await this.sendEventForId(clientId, 'server:hello', payload, 'version-broadcast');

      // Első hello — initial baseline-szinkron a tick-state-tel.
      if (!this.lastBroadcastVersion) {
        this.lastBroadcastVersion = version;
      }
    } catch (err) {
      const e: Error = err instanceof Error ? err : new Error(String(err));

      await emitServerActionLog({
        actor: 'server',
        kind: 'error',
        summary: `[MA-SOCKET-HELLO-FAIL] ${e.message.slice(0, 200)}`,
        extra: { errorCode: 'MA-SOCKET-HELLO-FAIL', issuer: 'version-broadcast.sendHelloToPresence', clientId, stack: e.stack },
      });
    }
  }

  /**
   * 30s tick — olvassa a friss verziót, és ha eltér az utoljára broadcast-olttól,
   * `server:version` event-et küld minden aktív kliensnek. Az első tick
   * `lastBroadcastVersion=null` esetén baseline-t ment, NEM broadcast-ol (no
   * spurious reload connect-kor).
   */
  private async tickAndBroadcastIfChanged(): Promise<void> {
    try {
      const currentVersion: string = await readPackageVersion();

      if (this.lastBroadcastVersion === null) {
        this.lastBroadcastVersion = currentVersion;

        return;
      }

      if (this.lastBroadcastVersion === currentVersion) {
        return;
      }

      const previousVersion: string = this.lastBroadcastVersion;

      this.lastBroadcastVersion = currentVersion;

      const payload: { version: string; previousVersion: string; requireReload: boolean; ts: string } = {
        version: currentVersion,
        previousVersion,
        requireReload: true,
        ts: new Date().toISOString(),
      };

      await this.broadcastEvent('server:version', payload, 'version-broadcast');

      await emitServerActionLog({
        actor: 'server',
        kind: 'state-change',
        summary: `server:version broadcast (${previousVersion} -> ${currentVersion}, requireReload=true)`,
        extra: { issuer: 'version-broadcast.tickAndBroadcastIfChanged', previousVersion, currentVersion },
      });
    } catch (err) {
      const e: Error = err instanceof Error ? err : new Error(String(err));

      await emitServerActionLog({
        actor: 'server',
        kind: 'error',
        summary: `[MA-SOCKET-VERSION-BROADCAST-FAIL] ${e.message.slice(0, 200)}`,
        extra: { errorCode: 'MA-SOCKET-VERSION-BROADCAST-FAIL', issuer: 'version-broadcast.tickAndBroadcastIfChanged', stack: e.stack },
      });
    }
  }
}

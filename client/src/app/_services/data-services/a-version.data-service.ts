// Version data-service — BehaviorSubject state a server + client verzió-info-hoz.
// A `A_Socket_ControlService` írja a `serverVersion` + `lastUpdateTs` mezőket a
// `server:hello` és `server:version` event-ekből, a `clientVersion` build-time
// import a `package.json`-ból (Angular allowJson).
//
// FR #3f socket-and-version-sync Phase 3.B (cycle 59).

import { Injectable } from '@angular/core';
import { BehaviorSubject, type Observable } from 'rxjs';

// Build-time: Angular tsconfig `resolveJsonModule: true` → import package.json
// version. Cycle 59-ben még a `package.json`-t importáljuk; Phase 6-ban
// külön build-hash + git-sha inject.
import packageJson from '../../../../package.json';

/** Version state — server + client verzió + last server-broadcast timestamp. */
export interface A_VersionState_Interface {
  serverVersion: string | null;
  clientVersion: string;
  lastUpdateTs: string | null;
  requireReload: boolean;
}

@Injectable({ providedIn: 'root' })
/** Version data-service — BehaviorSubject state a server + client verzió-info-hoz. */
export class A_Version_DataService {

  private readonly state_BS: BehaviorSubject<A_VersionState_Interface>;

  /** Konstruktor — initial state-tel a clientVersion-t a build-time package.json-ból olvassa. */
  constructor() {
    this.state_BS = new BehaviorSubject<A_VersionState_Interface>({
      serverVersion: null,
      clientVersion: (packageJson as { version: string }).version,
      lastUpdateTs: null,
      requireReload: false,
    });
  }

  /** Pillanatkép a state-ről (sync olvasás). */
  current(): A_VersionState_Interface {
    return this.state_BS.value;
  }

  /** Observable stream a state változásokra. */
  state$(): Observable<A_VersionState_Interface> {
    return this.state_BS.asObservable();
  }

  /** Új server-verzió érkezett — frissíti a state-et + lastUpdateTs-t. */
  setServerVersion(version: string, requireReload: boolean = false): void {
    const prev: A_VersionState_Interface = this.state_BS.value;
    this.state_BS.next({
      ...prev,
      serverVersion: version,
      lastUpdateTs: new Date().toISOString(),
      requireReload: requireReload && prev.serverVersion !== null && prev.serverVersion !== version,
    });
  }

  /** Reload-flag reset (pl. user dismissed banner). */
  clearReloadFlag(): void {
    this.state_BS.next({ ...this.state_BS.value, requireReload: false });
  }
}

// Socket client service — connect a server `VersionBroadcast` socket-szerviz-ére
// path=`/socket` (DyNTS_defaultSocketPath; NEM Socket.IO default `/socket.io`).
// Subscribe → `server:hello` + `server:version` event-eket handle-eli, és a
// `A_Version_DataService` BehaviorSubject-jébe írja a verziókat.
//
// Public/unauth csatorna — Phase 3.A scope a verzió-info-bar-hoz. Phase 5+
// user-data push-okhoz auth-handshake külön.
//
// FR #3f socket-and-version-sync Phase 3.A (cycle 59).
// Pattern source: master-prompter A_SocketClient_ControlService.

import { inject, Injectable } from '@angular/core';

import {
  DyFM_SocketClient_Params,
  DyFM_SocketClient_ServiceBase,
  DyFM_SocketEvent,
} from '@futdevpro/fsm-dynamo/socket';

import { A_Error_ControlService } from './a-error.control-service';
import { A_Version_DataService } from '../data-services/a-version.data-service';
import { A_DomainEvent_DataService, type A_DomainEvent_Interface } from '../data-services/a-domain-event.data-service';

/** Minimal subscription request — public channel, csak clientId. */
export interface A_SocketSubscription_Request {
  clientId: string;
}

/** server:hello event payload. */
interface A_ServerHello_Payload {
  version: string;
  ts: string;
  env: string;
}

/** server:version event payload. */
interface A_ServerVersion_Payload {
  version: string;
  previousVersion: string;
  requireReload: boolean;
  ts: string;
}

@Injectable({ providedIn: 'root' })
/** Public socket client — connect + subscribe → A_Version_DataService update server:hello/version event-ekből. */
export class A_Socket_ControlService extends DyFM_SocketClient_ServiceBase<A_SocketSubscription_Request> {

  private readonly version_DS: A_Version_DataService = inject(A_Version_DataService);
  private readonly domainEvent_DS: A_DomainEvent_DataService = inject(A_DomainEvent_DataService);
  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  /** clientId — egy session-id-szerű generált string (no localStorage szándékosan). */
  private readonly clientId: string = `ma-client-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;

  /** Connect params — address: same-origin (window.location), path: '/socket' KRITIKUS! */
  getParams(): DyFM_SocketClient_Params {
    return new DyFM_SocketClient_Params({
      name: 'MA Version Socket',
      address: this.resolveSocketAddress(),
      socketOptions: {
        transports: [ 'websocket' ],
        reconnectionDelay: 1000,
        path: '/socket', // DyNTS_defaultSocketPath — NEM '/socket.io'!
      },
    });
  }

  /** Incoming events — server:hello + server:version → A_Version_DataService; domain:* → A_DomainEvent_DataService. */
  getIncomingEvents(): DyFM_SocketEvent<unknown>[] {
    return [
      new DyFM_SocketEvent({
        eventKey: 'server:hello',
        tasks: [
          async (content: unknown): Promise<void> => {
            this.handleServerHello(content as A_ServerHello_Payload);
          },
        ],
      }),
      new DyFM_SocketEvent({
        eventKey: 'server:version',
        tasks: [
          async (content: unknown): Promise<void> => {
            this.handleServerVersion(content as A_ServerVersion_Payload);
          },
        ],
      }),
      // FR #3f Phase 5.C (cycle 82): domain:<topic> push-eventek route-olása
      // a kliens event-bus-on át. A topic-specifikus subscriber-ek (pl.
      // D_Dashboard_ControlService) saját maga dönt a reakcióról (refresh / merge).
      new DyFM_SocketEvent({
        eventKey: 'domain:wave',
        tasks: [
          async (content: unknown): Promise<void> => {
            this.handleDomainEvent(content as A_DomainEvent_Interface);
          },
        ],
      }),
      new DyFM_SocketEvent({
        eventKey: 'domain:insight',
        tasks: [
          async (content: unknown): Promise<void> => {
            this.handleDomainEvent(content as A_DomainEvent_Interface);
          },
        ],
      }),
      new DyFM_SocketEvent({
        eventKey: 'domain:capture',
        tasks: [
          async (content: unknown): Promise<void> => {
            this.handleDomainEvent(content as A_DomainEvent_Interface);
          },
        ],
      }),
    ];
  }

  /** Domain-event handler — emit-eli a kliens-oldali bus-ra, hogy a feature-subscriber-ek reagálhassanak. */
  private handleDomainEvent(payload: A_DomainEvent_Interface): void {
    try {
      if (!payload?.topic || !payload?.op) {
        return;
      }
      this.domainEvent_DS.emit(payload);
    } catch (err) {
      this.error_CS.showError(err, 'a-socket.handleDomainEvent');
    }
  }

  /** Subscribe payload — public channel, csak clientId. */
  async getSubscriptionContent(): Promise<A_SocketSubscription_Request> {
    return { clientId: this.clientId };
  }

  /** Boot-broadcast handler — első hello-ra a baseline serverVersion settelődik. */
  private handleServerHello(payload: A_ServerHello_Payload): void {
    try {
      if (!payload?.version) {
        return;
      }
      this.version_DS.setServerVersion(payload.version, false);
    } catch (err) {
      this.error_CS.showError(err, 'a-socket.handleServerHello');
    }
  }

  /** Verzió-bump broadcast handler — requireReload=true ha tényleg eltér a baseline. */
  private handleServerVersion(payload: A_ServerVersion_Payload): void {
    try {
      if (!payload?.version) {
        return;
      }
      this.version_DS.setServerVersion(payload.version, !!payload.requireReload);
    } catch (err) {
      this.error_CS.showError(err, 'a-socket.handleServerVersion');
    }
  }

  /** Same-origin socket address — browser env-ben `window.location.origin`. */
  private resolveSocketAddress(): string {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }

    return 'http://localhost:39245';
  }
}

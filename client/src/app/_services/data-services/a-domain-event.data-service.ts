// Domain-event bus — kliens-oldali event-stream a server `domain:<topic>` socket
// push-eventjeihez. Az `A_Socket_ControlService` ide pumpálja az eventeket,
// és bármely feature-module (pl. `D_Dashboard_ControlService`) feliratkozhat
// rá a saját refresh-trigger-jeihez.
//
// FR #3f socket-and-version-sync Phase 5.C (cycle 82).
// Pattern: event-bus a tight-coupling elkerülésére (A_Socket NEM ismeri a
// feature-module-okat — csak emit-el, a subscriber dolga a route-olás).

import { Injectable } from '@angular/core';
import { Subject, type Observable } from 'rxjs';

/** Topic-vezetett domain-event payload, master-prompter notification-pattern adaptáció. */
export interface A_DomainEvent_Interface {
  topic: string;
  op: 'create' | 'update' | 'delete';
  payload: unknown;
  ts: string;
}

@Injectable({ providedIn: 'root' })
/** Application-wide domain-event bus — minden socket-push event ezen át megy a feature-subscriber-ekhez. */
export class A_DomainEvent_DataService {

  private readonly event_S: Subject<A_DomainEvent_Interface> = new Subject<A_DomainEvent_Interface>();

  /** Subscribe a teljes event-stream-re (minden topic). A topic-szűrés a hívó dolga. */
  events$(): Observable<A_DomainEvent_Interface> {
    return this.event_S.asObservable();
  }

  /** Új event emit — A_Socket_ControlService domain:* handler-ből hívva. */
  emit(event: A_DomainEvent_Interface): void {
    this.event_S.next(event);
  }
}

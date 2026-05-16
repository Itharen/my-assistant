import { Component, inject } from '@angular/core';

import { A_Socket_ControlService } from './_services/control-services/a-socket.control-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
/**
 * Root app component — title + boot-injects A_Socket_ControlService (FR #3f Phase 3.A).
 *
 * Az `inject(A_Socket_ControlService)` egyenértékű a provideIn:'root' singleton
 * első használatával — a DyFM_SocketClient_ServiceBase auto-connect-el a
 * konstruktorból. Subscribe a kliens életciklusa elején lefut.
 */
export class AppComponent {
  readonly title: string = 'my-assistant';

  /** Trigger A_Socket_ControlService singleton-instantiation → auto-connect + subscribe. */
  private readonly socket: A_Socket_ControlService = inject(A_Socket_ControlService);
}

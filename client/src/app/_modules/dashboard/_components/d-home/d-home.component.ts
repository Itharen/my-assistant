// Dashboard container — 2×2 grid layout. Owns nothing of its own besides
// kicking the control-service's polling on/off; each panel reads the snapshot
// off the `state$ | async` stream piped down via @Input.

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { type Observable } from 'rxjs';

import { D_Dashboard_ControlService } from '../../_services/d-dashboard.control-service';
import {
  D_Dashboard_DataService,
  type D_DashboardState_Interface
} from '../../_services/d-dashboard.data-service';
import { D_Tasks_Component } from '../d-tasks/d-tasks.component';
import { D_Waves_Component } from '../d-waves/d-waves.component';
import { D_Insights_Component } from '../d-insights/d-insights.component';
import { D_Capture_Component } from '../d-capture/d-capture.component';

@Component({
  standalone: true,
  selector: 'd-home',
  templateUrl: './d-home.component.html',
  styleUrl: './d-home.component.scss',
  imports: [
    CommonModule,
    D_Tasks_Component,
    D_Waves_Component,
    D_Insights_Component,
    D_Capture_Component,
  ],
})
/** Dashboard container — 2×2 grid root, polling lifecycle + state$ stream átadása a sub-panel-eknek. */
export class D_Home_Component implements OnInit, OnDestroy {
  readonly state$: Observable<D_DashboardState_Interface>;

  /** Inicializál egy D_Home_Component-et — beköti a data state$-streamet. */
  constructor(
    private readonly control: D_Dashboard_ControlService,
    data: D_Dashboard_DataService,
  ) {
    this.state$ = data.state$;
  }

  /** Mount-on bekapcsolja a dashboard polling-ot. */
  ngOnInit(): void {
    this.control.startPolling();
  }

  /** Unmount-on leállítja a dashboard polling-ot. */
  ngOnDestroy(): void {
    this.control.stopPolling();
  }

  /** Manuális dashboard refresh — egyetlen snapshot lekérés a polling cikluson kívül. */
  handleRefresh(): void {
    void this.control.refresh();
  }
}

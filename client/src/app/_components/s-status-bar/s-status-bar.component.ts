// Status-bar standalone komponens — footer-be ágyazva, mindig látható.
// Megjeleníti a server + client verziót, és a server utolsó update-jét.
//
// FR #3f socket-and-version-sync Phase 4.A (cycle 59).

import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  A_Version_DataService,
  type A_VersionState_Interface,
} from '../../_services/data-services/a-version.data-service';

@Component({
  standalone: true,
  selector: 's-status-bar',
  templateUrl: './s-status-bar.component.html',
  styleUrl: './s-status-bar.component.scss',
  imports: [ CommonModule ],
})
/** Footer status-bar — server vX · client vY · last-update HH:mm. */
export class S_StatusBar_Component implements OnInit, OnDestroy {

  private readonly version_DS: A_Version_DataService = inject(A_Version_DataService);

  state: A_VersionState_Interface = this.version_DS.current();

  private sub: Subscription | null = null;

  /** Iratkozik a verzió-state observable-re. */
  ngOnInit(): void {
    this.sub = this.version_DS.state$().subscribe(
      (s: A_VersionState_Interface): void => { this.state = s; },
    );
  }

  /** Cleanup subscription. */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.sub = null;
  }

  /** HH:mm formátum a lastUpdateTs-ből — null ha nincs. */
  formatTime(ts: string | null): string {
    if (!ts) {
      return '—';
    }
    try {
      const d: Date = new Date(ts);

      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '—';
    }
  }
}

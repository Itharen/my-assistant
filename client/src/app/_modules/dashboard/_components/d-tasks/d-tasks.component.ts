// Tasks panel (top-left, big). Reads from organizer via the server's
// /dashboard aggregator (`fo tasks.list` shell-out). Read-only for now —
// organizer-partial state means writes need user-confirmation, not a
// one-click dashboard button. Icons + lists are precomputed on each snapshot
// change so the template stays method-call-free (no re-runs per CD cycle).

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import {
  type A_DashboardSnapshot,
  type A_FoTaskItem
} from '../../../../_models/server-envelope.interface';

interface D_TaskRow_Interface {
  item: A_FoTaskItem;
  icon: string;
}

function iconFor(item: A_FoTaskItem): string {
  if (item.done) {
    return '✅';
  }

  if (item.priority !== null && item.priority >= 150) {
    return '🔴';
  }

  if (item.priority !== null && item.priority >= 100) {
    return '🟡';
  }

  return '🔹';
}

@Component({
  standalone: true,
  selector: 'd-tasks',
  templateUrl: './d-tasks.component.html',
  styleUrl: './d-tasks.component.scss',
  imports: [ CommonModule ],
})
/** Tasks panel — organizer-tasks read-only listája, open vs done csoportokra szétválasztva. */
export class D_Tasks_Component {
  isAvailable: boolean = false;
  error: string | undefined;
  openRows: D_TaskRow_Interface[] = [];
  doneRows: D_TaskRow_Interface[] = [];

  /** Snapshot setter — precomputálja az open / done sorokat és per-row icon-t. */
  @Input() set snapshot(value: A_DashboardSnapshot | null) {
    this.isAvailable = value?.tasks.available ?? false;
    this.error = value?.tasks.error;
    const items: A_FoTaskItem[] = value?.tasks.items ?? [];

    this.openRows = items
      .filter((t: A_FoTaskItem): boolean => !t.done)
      .map((item: A_FoTaskItem): D_TaskRow_Interface => ({ item, icon: iconFor(item) }));
    this.doneRows = items
      .filter((t: A_FoTaskItem): boolean => t.done)
      .map((item: A_FoTaskItem): D_TaskRow_Interface => ({ item, icon: iconFor(item) }));
  }
}

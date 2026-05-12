// Dashboard data layer. Holds the latest snapshot as a BehaviorSubject so the
// container and all four panel components can subscribe to the same stream and
// stay in sync without each running its own HTTP poll. Refresh is triggered
// by the control-service (poll, post-mutation invalidation, manual refresh).

import { Injectable } from '@angular/core';
import { BehaviorSubject, type Observable } from 'rxjs';

import {
  type A_DashboardSnapshot,
  type A_WaveKind,
  type A_WaveRow
} from '../../../_models/server-envelope.interface';

/** Dashboard reaktív state shape-ja — loading/snapshot/error/lastFetchedAt mezőkkel. */
export interface D_DashboardState_Interface {
  isLoading: boolean;
  snapshot: A_DashboardSnapshot | null;
  error: string | null;
  lastFetchedAt: string | null;
}

const EMPTY_STATE: D_DashboardState_Interface = {
  isLoading: true,
  snapshot: null,
  error: null,
  lastFetchedAt: null,
};

@Injectable({ providedIn: 'root' })
/** Dashboard data layer — egyetlen BehaviorSubject-en át osztja meg a state-et az összes panel-lel. */
export class D_Dashboard_DataService {
  private readonly state_BS: BehaviorSubject<D_DashboardState_Interface> =
    new BehaviorSubject<D_DashboardState_Interface>(EMPTY_STATE);

  /** Public read-only stream — consumers should `state$ | async`. */
  readonly state$: Observable<D_DashboardState_Interface> = this.state_BS.asObservable();

  /** Synchronous snapshot — for non-template consumers (e.g. control-service guards). */
  current(): D_DashboardState_Interface {
    return this.state_BS.value;
  }

  /** Loading state-et állít be — érintetlenül hagyja a snapshot-ot és törli az error-t. */
  setLoading(): void {
    this.state_BS.next({ ...this.state_BS.value, isLoading: true, error: null });
  }

  /** Új snapshot beállítása — loading off, error törlés, lastFetchedAt frissítés. */
  setSnapshot(snapshot: A_DashboardSnapshot): void {
    this.state_BS.next({
      isLoading: false,
      snapshot,
      error: null,
      lastFetchedAt: new Date().toISOString(),
    });
  }

  /** Error állapot beállítása — loading off, error message megőrzés. */
  setError(message: string): void {
    this.state_BS.next({ ...this.state_BS.value, isLoading: false, error: message });
  }

  /** Static helper — egy adott wave kind sorozatát adja vissza a snapshot-ból. */
  static seriesFor(snapshot: A_DashboardSnapshot | null, kind: A_WaveKind): A_WaveRow[] {
    return snapshot?.waves.series[kind] ?? [];
  }

  /** Static helper — egy adott wave kind legutóbbi értékét adja vissza, ha van. */
  static latestValue(snapshot: A_DashboardSnapshot | null, kind: A_WaveKind): number | null {
    const row: A_WaveRow | undefined = snapshot?.waves.latest[kind];

    return row ? row.value : null;
  }
}

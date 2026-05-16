// Version-reload-banner standalone komponens — sticky top banner, amely a
// server-verzió-bump után megjelenik (`A_Version_DataService.requireReload`).
// Prod módban 5s countdown + "Reload Now" / "Dismiss" gomb. Dev módban
// (Angular `isDevMode()`) silent reload (LDP / dc bump-version során a kliens
// csendben újratöltődik, nem zavar).
//
// FR #3f socket-and-version-sync Phase 4.B (cycle 60).

import { CommonModule } from '@angular/common';
import { Component, inject, isDevMode, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  A_Version_DataService,
  type A_VersionState_Interface,
} from '../../_services/data-services/a-version.data-service';

const PROD_COUNTDOWN_SEC: number = 5;
const DEV_SILENT_RELOAD_DELAY_MS: number = 1000;

@Component({
  standalone: true,
  selector: 's-version-reload-banner',
  templateUrl: './s-version-reload-banner.component.html',
  styleUrl: './s-version-reload-banner.component.scss',
  imports: [ CommonModule ],
})
/** Banner-komponens: server-verzió-bump után countdown + reload UX. Dev-mode silent. */
export class S_VersionReloadBanner_Component implements OnInit, OnDestroy {

  private readonly version_DS: A_Version_DataService = inject(A_Version_DataService);

  /** Megjeleníteni a banner-t — csak prod-módban és requireReload=true esetén. */
  isVisible: boolean = false;

  /** Countdown másodperc — `PROD_COUNTDOWN_SEC`-tól csökken. */
  countdownSec: number = PROD_COUNTDOWN_SEC;

  private stateSub: Subscription | null = null;
  private countdownHandle: ReturnType<typeof setInterval> | null = null;
  private silentReloadHandle: ReturnType<typeof setTimeout> | null = null;
  private alreadyTriggered: boolean = false;

  /** Subscribe a verzió-state-re; requireReload=true → countdown/silent reload trigger. */
  ngOnInit(): void {
    this.stateSub = this.version_DS.state$().subscribe(
      (s: A_VersionState_Interface): void => { this.handleStateChange(s); },
    );
  }

  /** Cleanup: subscription + timer-ek. */
  ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
    this.stateSub = null;
    this.cancelCountdown();
    if (this.silentReloadHandle) {
      clearTimeout(this.silentReloadHandle);
      this.silentReloadHandle = null;
    }
  }

  /** Most-reload gomb — közvetlen `location.reload()`. */
  handleReloadNow(): void {
    this.triggerReload();
  }

  /** Dismiss gomb — flag clear + countdown cancel. A user a következő bump-ra újra meglátja. */
  handleDismiss(): void {
    this.cancelCountdown();
    this.isVisible = false;
    this.alreadyTriggered = false;
    this.version_DS.clearReloadFlag();
  }

  /** State-change handler: ha új requireReload, indítsd a dev-silent vagy prod-banner flow-t. */
  private handleStateChange(s: A_VersionState_Interface): void {
    if (!s.requireReload) {
      this.isVisible = false;

      return;
    }

    if (this.alreadyTriggered) {
      return;
    }
    this.alreadyTriggered = true;

    if (isDevMode()) {
      this.startSilentReload();

      return;
    }
    this.startProdCountdown();
  }

  /** Dev-mode: 1s delay (LDP-rebuild graceful), majd location.reload(). */
  private startSilentReload(): void {
    this.silentReloadHandle = setTimeout((): void => {
      this.triggerReload();
    }, DEV_SILENT_RELOAD_DELAY_MS);
  }

  /** Prod-mode: 5s countdown banner. Tick-enként csökken; 0-nál reload. */
  private startProdCountdown(): void {
    this.countdownSec = PROD_COUNTDOWN_SEC;
    this.isVisible = true;
    this.countdownHandle = setInterval((): void => {
      this.countdownSec--;
      if (this.countdownSec <= 0) {
        this.triggerReload();
      }
    }, 1000);
  }

  /** Cancel countdown timer (Dismiss vagy ngOnDestroy). */
  private cancelCountdown(): void {
    if (this.countdownHandle) {
      clearInterval(this.countdownHandle);
      this.countdownHandle = null;
    }
  }

  /** Reload trigger — location.reload(). Test-environment SAFE: window.location ellenőrzés. */
  private triggerReload(): void {
    this.cancelCountdown();
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  }
}

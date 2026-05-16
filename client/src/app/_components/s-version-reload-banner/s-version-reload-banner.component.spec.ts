import { ComponentFixture, TestBed } from '@angular/core/testing';

import { A_Version_DataService } from '../../_services/data-services/a-version.data-service';
import { S_VersionReloadBanner_Component } from './s-version-reload-banner.component';

// Karma test env: Angular's isDevMode() returns true (no production build flag).
// So the dev-silent-reload path is exercised by default. We spy on the
// component's `triggerReload` method (protected, accessed via cast) to verify
// the side-effect WITHOUT actually reloading — Chrome forbids redefining
// `window.location.reload`. Prod-countdown path would require an isDevMode
// mock — skipped here, covered by code review.

describe('S_VersionReloadBanner_Component', () => {
  let fixture: ComponentFixture<S_VersionReloadBanner_Component>;
  let component: S_VersionReloadBanner_Component;
  let version_DS: A_Version_DataService;
  let triggerReloadSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [S_VersionReloadBanner_Component],
    }).compileComponents();

    fixture = TestBed.createComponent(S_VersionReloadBanner_Component);
    component = fixture.componentInstance;
    version_DS = TestBed.inject(A_Version_DataService);

    // Spy on `triggerReload` (protected — cast through `unknown` to satisfy
    // strict-template TypeScript). `callThrough: false` (default) prevents
    // actual reload + countdown-cancel side-effects from running.
    triggerReloadSpy = spyOn(component as unknown as { triggerReload: () => void }, 'triggerReload');

    jasmine.clock().install();

    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    fixture.destroy();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('banner not visible initially (requireReload false)', () => {
    expect(component.isVisible).toBeFalse();
    const html: string = fixture.nativeElement.textContent ?? '';
    expect(html).not.toContain('Reload Now');
  });

  it('does not show banner when requireReload remains false', () => {
    version_DS.setServerVersion('1.0.0', false);
    fixture.detectChanges();
    expect(component.isVisible).toBeFalse();
    expect(triggerReloadSpy).not.toHaveBeenCalled();
  });

  it('dev-mode: schedules silent reload after 1s grace when requireReload becomes true', () => {
    // Baseline set first (no flag), then a real version-change with flag.
    version_DS.setServerVersion('1.0.0', false);
    version_DS.setServerVersion('1.0.1', true);
    fixture.detectChanges();

    // Dev path: NOT visible (silent reload). 1s grace timer.
    expect(component.isVisible).toBeFalse();
    expect(triggerReloadSpy).not.toHaveBeenCalled();

    jasmine.clock().tick(1100);
    expect(triggerReloadSpy).toHaveBeenCalledTimes(1);
  });

  it('alreadyTriggered guard prevents double-fire on repeat emissions', () => {
    version_DS.setServerVersion('1.0.0', false);
    version_DS.setServerVersion('1.0.1', true);
    // Re-emit the same requireReload-true state — handleStateChange should skip.
    version_DS.setServerVersion('1.0.1', true);

    jasmine.clock().tick(1100);
    expect(triggerReloadSpy).toHaveBeenCalledTimes(1);
  });

  it('handleDismiss clears banner state and reload-flag', () => {
    version_DS.setServerVersion('1.0.0', false);
    version_DS.setServerVersion('1.0.1', true);

    component.handleDismiss();
    fixture.detectChanges();

    expect(component.isVisible).toBeFalse();
    expect(version_DS.current().requireReload).toBeFalse();
  });

  it('handleReloadNow triggers reload immediately', () => {
    component.handleReloadNow();
    expect(triggerReloadSpy).toHaveBeenCalledTimes(1);
  });

  it('ngOnDestroy cleans up pending silent-reload timer (no reload after destroy)', () => {
    version_DS.setServerVersion('1.0.0', false);
    version_DS.setServerVersion('1.0.1', true);
    // Destroy before the 1s silent-reload timer fires.
    fixture.destroy();

    jasmine.clock().tick(2000);
    expect(triggerReloadSpy).not.toHaveBeenCalled();
  });
});

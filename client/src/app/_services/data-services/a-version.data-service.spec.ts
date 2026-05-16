import { TestBed } from '@angular/core/testing';

import {
  A_Version_DataService,
  type A_VersionState_Interface,
} from './a-version.data-service';

describe('A_Version_DataService', () => {
  let ds: A_Version_DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    ds = TestBed.inject(A_Version_DataService);
  });

  it('initializes with clientVersion populated and serverVersion null', () => {
    const s: A_VersionState_Interface = ds.current();
    expect(s.serverVersion).toBeNull();
    expect(s.clientVersion).toBeTruthy();
    expect(s.lastUpdateTs).toBeNull();
    expect(s.requireReload).toBeFalse();
  });

  it('sets serverVersion + lastUpdateTs on first setServerVersion (no requireReload)', () => {
    ds.setServerVersion('1.0.0', false);
    const s: A_VersionState_Interface = ds.current();
    expect(s.serverVersion).toBe('1.0.0');
    expect(s.lastUpdateTs).not.toBeNull();
    expect(s.requireReload).toBeFalse();
  });

  it('does NOT raise requireReload on initial server hello even with requireReload=true', () => {
    // First setServerVersion: serverVersion was null before, so even if caller
    // passes requireReload=true, the guard suppresses spurious reload-on-connect.
    ds.setServerVersion('1.0.0', true);
    expect(ds.current().requireReload).toBeFalse();
  });

  it('raises requireReload when version changes and caller flags it', () => {
    ds.setServerVersion('1.0.0', false);
    ds.setServerVersion('1.0.1', true);
    expect(ds.current().requireReload).toBeTrue();
    expect(ds.current().serverVersion).toBe('1.0.1');
  });

  it('does NOT raise requireReload when version is unchanged', () => {
    ds.setServerVersion('1.0.0', false);
    ds.setServerVersion('1.0.0', true);
    expect(ds.current().requireReload).toBeFalse();
  });

  it('clearReloadFlag resets requireReload but keeps serverVersion', () => {
    ds.setServerVersion('1.0.0', false);
    ds.setServerVersion('1.0.1', true);
    expect(ds.current().requireReload).toBeTrue();
    ds.clearReloadFlag();
    expect(ds.current().requireReload).toBeFalse();
    expect(ds.current().serverVersion).toBe('1.0.1');
  });

  it('state$() emits on subscribe and on update', (done: DoneFn) => {
    const emissions: A_VersionState_Interface[] = [];
    const sub = ds.state$().subscribe((s: A_VersionState_Interface): void => {
      emissions.push(s);
    });
    ds.setServerVersion('2.0.0', false);
    setTimeout((): void => {
      expect(emissions.length).toBeGreaterThanOrEqual(2);
      expect(emissions[emissions.length - 1]!.serverVersion).toBe('2.0.0');
      sub.unsubscribe();
      done();
    }, 10);
  });
});

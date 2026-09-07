// A relay-lehúzó tesztjei.
//
// ⭐ A hangsúly a NYUGTÁZÁSI SZERZŐDÉSEN van, mert ott dől el, elveszik-e adat:
// amit nem tároltunk el, azt nem nyugtázzuk — vagyis a relay megőrzi.

import {
  DEFAULT_PULL_INTERVAL_MS,
  readPullIntervalMs,
  readRelaySettings,
} from './relay-puller.service.js';

describe('relay-puller', () => {

  const savedEnv: Record<string, string | undefined> = {};
  const keys: string[] = ['MA_RELAY_URL', 'MA_RELAY_PULL_TOKEN', 'MA_RELAY_PULL_INTERVAL_MS'];

  beforeEach(() => {
    for (const key of keys) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keys) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  describe('readRelaySettings', () => {
    it('beállítás nélkül `null` — és így a lehúzó el sem indul', () => {
      expect(readRelaySettings()).toBeNull();
    });

    it('🔴 CSAK A CÍM kevés — token nélkül is `null`', () => {
      process.env['MA_RELAY_URL'] = 'https://test.my-assistant-relay.futdevpro.hu';

      expect(readRelaySettings()).toBeNull();
    });

    it('🔴 CSAK A TOKEN kevés — cím nélkül is `null`', () => {
      process.env['MA_RELAY_PULL_TOKEN'] = 'titok';

      expect(readRelaySettings()).toBeNull();
    });

    it('a záró perjelet levágja — különben dupla perjeles URL-t építenénk', () => {
      process.env['MA_RELAY_URL'] = 'https://test.my-assistant-relay.futdevpro.hu///';
      process.env['MA_RELAY_PULL_TOKEN'] = 'titok';

      expect(readRelaySettings()?.baseUrl).toBe('https://test.my-assistant-relay.futdevpro.hu');
    });
  });

  describe('readPullIntervalMs', () => {
    it('beállítás nélkül az alapértelmezés', () => {
      expect(readPullIntervalMs()).toBe(DEFAULT_PULL_INTERVAL_MS);
    });

    it('a beállított értéket veszi', () => {
      process.env['MA_RELAY_PULL_INTERVAL_MS'] = '60000';

      expect(readPullIntervalMs()).toBe(60_000);
    });

    it('🔴 a 0 NEM „azonnali" — az elgépelés végtelen ciklust csinálna', () => {
      process.env['MA_RELAY_PULL_INTERVAL_MS'] = '0';

      expect(readPullIntervalMs()).toBe(DEFAULT_PULL_INTERVAL_MS);
    });

    it('a negatív és a szemét értéket is visszautasítja', () => {
      process.env['MA_RELAY_PULL_INTERVAL_MS'] = '-5000';
      expect(readPullIntervalMs()).toBe(DEFAULT_PULL_INTERVAL_MS);

      process.env['MA_RELAY_PULL_INTERVAL_MS'] = 'hamarosan';
      expect(readPullIntervalMs()).toBe(DEFAULT_PULL_INTERVAL_MS);
    });

    it('a gyanúsan sűrű (1 mp alatti) értéket sem fogadja el', () => {
      process.env['MA_RELAY_PULL_INTERVAL_MS'] = '250';

      expect(readPullIntervalMs()).toBe(DEFAULT_PULL_INTERVAL_MS);
    });
  });
});

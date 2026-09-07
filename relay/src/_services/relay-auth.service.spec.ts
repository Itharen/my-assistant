import { authorize, constantTimeEquals, envNameFor } from './relay-auth.service.js';

describe('authorize', () => {

  it('🔴 HA A TITOK NINCS BEALLITVA, MINDENT ELUTASIT', () => {
    // Egy vedtelen, nyitott relay rosszabb, mint egy nem mukodo: az elsot nem vennenk eszre.
    const outcome = authorize('barmi', '');

    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toContain('nincs beallitva');
  });

  it('elutasit, ha a keres nem mutatott be titkot', () => {
    expect(authorize('', 'a-valodi-titok').ok).toBe(false);
  });

  it('elutasitja a rossz titkot', () => {
    expect(authorize('rossz', 'a-valodi-titok').ok).toBe(false);
  });

  it('elfogadja a helyes titkot', () => {
    expect(authorize('a-valodi-titok', 'a-valodi-titok').ok).toBe(true);
  });

  it('⛔ az indoklas SOHA nem tartalmazza magat a titkot', () => {
    const secret = 'SZUPER-TITKOS-ERTEK';

    for (const outcome of [authorize('rossz', secret), authorize('', secret), authorize(secret, '')]) {
      expect(outcome.reason).not.toContain(secret);
    }
  });
});

describe('constantTimeEquals', () => {

  it('azonos sztringekre igaz', () => {
    expect(constantTimeEquals('abc123', 'abc123')).toBe(true);
  });

  it('elteroekre hamis', () => {
    expect(constantTimeEquals('abc123', 'abc124')).toBe(false);
  });

  it('kulonbozo hosszra hamis', () => {
    expect(constantTimeEquals('abc', 'abcd')).toBe(false);
  });

  it('ures sztringekre igaz (a hivo zarja ki az ures esetet)', () => {
    expect(constantTimeEquals('', '')).toBe(true);
  });

  it('a MASODIK karakterben eltero sem csuszik at', () => {
    expect(constantTimeEquals('xy', 'xz')).toBe(false);
  });
});

describe('envNameFor', () => {

  it('🔴 KET KULON titok — az ingest NEM tud olvasni', () => {
    // A telefon a legkitettebb elem. Kozos titoknal egy ellopott telefonnal le lehetne kerni
    // a teljes pufferelt elozmenyt — pont azt, amit vedeni akarunk.
    expect(envNameFor('ingest')).toBe('MA_RELAY_INGEST_TOKEN');
    expect(envNameFor('pull')).toBe('MA_RELAY_PULL_TOKEN');
    expect(envNameFor('ingest')).not.toBe(envNameFor('pull'));
  });
});

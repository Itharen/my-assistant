import {
  isRemoteAt,
  OPEN_SESSION_MAX_MS,
  parseRemoteSessions,
} from './presence.remote-session.js';

// VALODI naplo-reszlet a 2026-09-07-i meresbol - ez a munkamenet fedi le azt a 09:15:33-as
// "aktiv" mintat, ami miatt az egesz felismeres keszult.
const REAL_LOG: string = [
  '[2026-09-07 09:15:27.483941 +02:00] DEBUG [src\\ui_cm_interface.rs:851] Got new connection',
  '[2026-09-07 09:15:27.484020 +02:00] DEBUG [src\\ui_cm_interface.rs:805] ipc task begin',
  '[2026-09-07 09:15:27.484500 +02:00] DEBUG [src\\ui_cm_interface.rs:547] conn_id: 1312',
  '[2026-09-07 09:23:10.712830 +02:00] INFO [src\\ui_cm_interface.rs:558] cm ipc connection closed from connection request',
  '[2026-09-07 09:23:10.713000 +02:00] DEBUG [src\\ui_cm_interface.rs:830] ipc task end',
].join('\n');

describe('parseRemoteSessions', () => {

  it('kiolvassa a valodi munkamenetet a MERT naplobol', () => {
    const sessions = parseRemoteSessions(REAL_LOG);

    expect(sessions.length).toBe(1);
    expect(sessions[0]?.startedAt.toISOString()).toBe(new Date('2026-09-07T09:15:27+02:00').toISOString());
    expect(sessions[0]?.endedAt?.toISOString()).toBe(new Date('2026-09-07T09:23:10+02:00').toISOString());
  });

  it('ures naplobol ures listat ad', () => {
    expect(parseRemoteSessions('')).toEqual([]);
  });

  it('a zajos sorokon atlep', () => {
    expect(parseRemoteSessions('valami\nmas\n[hibas] sor').length).toBe(0);
  });

  it('a LEZARATLAN munkamenetet MEGTARTJA — az is fennallt', () => {
    const sessions = parseRemoteSessions(
      '[2026-09-07 10:00:00.000000 +02:00] DEBUG Got new connection',
    );

    expect(sessions.length).toBe(1);
    expect(sessions[0]?.endedAt).toBeUndefined();
  });

  it('ket nyitas lezaras nelkul: MINDKETTOT megtartja', () => {
    const sessions = parseRemoteSessions([
      '[2026-09-07 10:00:00.000000 +02:00] DEBUG Got new connection',
      '[2026-09-07 11:00:00.000000 +02:00] DEBUG Got new connection',
    ].join('\n'));

    expect(sessions.length).toBe(2);
  });

  it('tobb egymast koveto munkamenetet kulon kezel', () => {
    const sessions = parseRemoteSessions([
      '[2026-09-07 09:15:27.000000 +02:00] DEBUG Got new connection',
      '[2026-09-07 09:23:10.000000 +02:00] INFO cm ipc connection closed from connection request',
      '[2026-09-07 09:58:38.000000 +02:00] DEBUG Got new connection',
      '[2026-09-07 09:59:29.000000 +02:00] INFO cm ipc connection closed from connection request',
    ].join('\n'));

    expect(sessions.length).toBe(2);
    expect(sessions[1]?.startedAt.getHours()).toBe(9);
    expect(sessions[1]?.startedAt.getMinutes()).toBe(58);
  });
});

describe('isRemoteAt', () => {

  const sessions = parseRemoteSessions(REAL_LOG);

  it('🔴 A MERT ESET: a 09:15:33-as "aktiv" minta TAVOLI volt', () => {
    // Ez a konkret minta inditotta az egeszet: az owner az AI Summiton volt, megis
    // "aktiv"-ot mertunk. A tavoli munkamenet magyarazza.
    expect(isRemoteAt(sessions, new Date('2026-09-07T09:15:33+02:00'))).toBe(true);
  });

  it('a munkamenet ELOTT nem tavoli', () => {
    expect(isRemoteAt(sessions, new Date('2026-09-07T09:10:00+02:00'))).toBe(false);
  });

  it('a munkamenet UTAN nem tavoli', () => {
    expect(isRemoteAt(sessions, new Date('2026-09-07T09:30:00+02:00'))).toBe(false);
  });

  it('a hatarokat bezarolag kezeli', () => {
    expect(isRemoteAt(sessions, new Date('2026-09-07T09:15:27+02:00'))).toBe(true);
    expect(isRemoteAt(sessions, new Date('2026-09-07T09:23:10+02:00'))).toBe(true);
  });

  it('ures listaval sosem tavoli', () => {
    expect(isRemoteAt([], new Date())).toBe(false);
  });

  it('a LEZARATLAN munkamenet a korlaton BELUL tavoli', () => {
    const open = [{ startedAt: new Date('2026-09-07T10:00:00+02:00') }];

    expect(isRemoteAt(open, new Date('2026-09-07T11:00:00+02:00'))).toBe(true);
  });

  it('⚠️ a LEZARATLAN munkamenet a korlaton TUL mar NEM tavoli', () => {
    // Kulonben egy felbemaradt bejegyzes OROKRE "tavoli"-nak jelolne minden kesobbi merest.
    const open = [{ startedAt: new Date('2026-09-07T10:00:00+02:00') }];
    const wayLater = new Date(new Date('2026-09-07T10:00:00+02:00').getTime() + OPEN_SESSION_MAX_MS + 1000);

    expect(isRemoteAt(open, wayLater)).toBe(false);
  });
});

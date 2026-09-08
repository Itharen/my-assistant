// A kapcsolat-napló tesztjei.
//
// 🔴 MIÉRT LÉTEZIK: a kiesés **ritka és nem reprodukálható** — éjjel történik, beszéd közben,
// hálózati zökkenőtől. Élesben kivárni nem lehet; a napló-sorát viszont **most** el kell
// dönteni, mert amikor bekövetkezik, már késő rájönni, hogy hiányos.
//
// 📌 A mért kiindulás: 24 `MA-VOICE-JOINED` és **0** kilépés-esemény a napi naplóban.

import {
  describeConnectionEvent,
  VOICE_CONNECTION_CODES,
  type VoiceConnectionEvent,
  type VoiceConnectionEventKind,
} from './voice-connection-log.js';

const when: Date = new Date('2026-09-08T09:41:07+02:00');

const ALL_KINDS: VoiceConnectionEventKind[] = [
  'joined', 'left', 'disconnected', 'reconnected', 'dropped', 'join-failed',
];

describe('describeConnectionEvent — minden állapot-változás nyomot hagy', () => {

  it('MINDEN fajtának van saját, grep-elhető kódja', () => {
    // ⚠️ Ha két fajta ugyanazt a kódot kapná, a napló összemosná őket — pont azt a
    // megkülönböztetést veszítenénk el, amiért ez a modul készült.
    const codes: string[] = ALL_KINDS.map((kind) => VOICE_CONNECTION_CODES[kind]);

    expect(new Set(codes).size).toBe(ALL_KINDS.length);
  });

  it('MINDEN fajta ad konzol-sort ÉS napló-összefoglalót — egyik sem üres', () => {
    for (const kind of ALL_KINDS) {
      const line = describeConnectionEvent({ kind: kind }, when);

      expect(line.console.length).toBeGreaterThan(0);
      expect(line.summary.length).toBeGreaterThan(0);
      expect(line.code).toBe(VOICE_CONNECTION_CODES[kind]);
    }
  });

  it('a konzol-sor HELYI időt visel, nem UTC-t', () => {
    // 🔴 Mért hiba: 03:02-kor 01:02 jelent meg. A napló-sor ugyanebbe a csapdába esne.
    const line = describeConnectionEvent({ kind: 'joined' }, when);

    expect(line.console).toContain('09:41:07');
    expect(line.console).not.toContain('07:41');
  });

  it('a konzol-sor `[voice]` előtaggal megy — így kiszűrhető a szerver logjából', () => {
    expect(describeConnectionEvent({ kind: 'joined' }, when).console.startsWith('[voice] ')).toBeTrue();
  });

  describe('🔴 KIESÉS — ez volt a teljesen néma eset', () => {

    const dropped: VoiceConnectionEvent = {
      kind: 'dropped',
      channelName: 'honnie-place',
      reason: 'a türelmi időn belül nem jött vissza',
      offlineMs: 47_000,
    };

    it('`error` szintű — nem egy megjegyzés a többi közt', () => {
      expect(describeConnectionEvent(dropped, when).level).toBe('error');
    });

    it('KIMONDJA a következményt: az addigi beszéd nem jutott el', () => {
      // ⚠️ Enélkül a sor csak technikai tény. A következmény teszi értelmezhetővé.
      expect(describeConnectionEvent(dropped, when).console).toContain('NEM jutott el');
    });

    it('MEGMONDJA, mennyi ideig tartott — ez a kiesés mértékegysége', () => {
      expect(describeConnectionEvent(dropped, when).console).toContain('47 mp');
    });

    it('megnevezi a csatornát, amiből kiestünk', () => {
      expect(describeConnectionEvent(dropped, when).console).toContain('honnie-place');
    });

    it('⛔ hiányzó ok esetén sem hallgat — kimondja, hogy az ok maga is hiba', () => {
      // 🔴 A néma `catch` pont ezt csinálta: eltüntette az okot. Ha egyszer mégis ok nélkül
      // érkezik esemény, azt LÁTNI kell, nem elnyelni.
      const line = describeConnectionEvent({ kind: 'dropped', offlineMs: 1_000 }, when);

      expect(line.console).toContain('ok ismeretlen');
    });
  });

  describe('⚠️ leválás vs. 🔴 kiesés — a kettő NEM ugyanaz', () => {

    it('a leválás még NEM hiba — a Discord magától vissza szokta hozni', () => {
      const line = describeConnectionEvent({ kind: 'disconnected', reason: 'bontás' }, when);

      expect(line.level).toBe('note');
      expect(line.console).not.toContain('KIESTEM');
    });

    it('a visszatérés LÁTSZIK, a kiesés hosszával — ebből derül ki, hogy zajos a vonal', () => {
      const line = describeConnectionEvent({ kind: 'reconnected', offlineMs: 2_400 }, when);

      expect(line.level).toBe('note');
      expect(line.console).toContain('Visszajött');
      expect(line.console).toContain('2 mp');
    });

    it('a két fajta MÁS kódot kap — különben a statisztika összemosná őket', () => {
      expect(VOICE_CONNECTION_CODES.disconnected).not.toBe(VOICE_CONNECTION_CODES.dropped);
    });
  });

  describe('👋 szándékos kilépés', () => {

    it('`note` szintű — a leállás nem hiba', () => {
      const line = describeConnectionEvent({ kind: 'left', reason: 'szándékos leállás' }, when);

      expect(line.level).toBe('note');
    });

    it('MEGKÜLÖNBÖZTETHETŐ a kieséstől — ez a mérés lelke', () => {
      // 🔴 Ha a szándékos leállás és a kiesés egy kódon menne, a „hányszor estem ki?"
      // kérdésre a napló hamis, felfelé torzított választ adna.
      const left = describeConnectionEvent({ kind: 'left' }, when);
      const dropped = describeConnectionEvent({ kind: 'dropped' }, when);

      expect(left.code).not.toBe(dropped.code);
      expect(left.level).not.toBe(dropped.level);
    });
  });

  describe('a belépés ágai', () => {

    it('a sikeres belépés `note`, és megnevezi a csatornát', () => {
      const line = describeConnectionEvent({ kind: 'joined', channelName: 'honnie-place' }, when);

      expect(line.level).toBe('note');
      expect(line.console).toContain('honnie-place');
    });

    it('a bukott belépés `error`, és viszi az okot', () => {
      const line = describeConnectionEvent({
        kind: 'join-failed',
        reason: 'Missing Permissions',
      }, when);

      expect(line.level).toBe('error');
      expect(line.console).toContain('Missing Permissions');
    });
  });

  it('egyetlen sor — a konzol-kimenetet nem töri szét', () => {
    for (const kind of ALL_KINDS) {
      expect(describeConnectionEvent({ kind: kind }, when).console).not.toContain('\n');
    }
  });
});

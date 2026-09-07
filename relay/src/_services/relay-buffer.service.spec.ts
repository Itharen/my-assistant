import {
  createItemId,
  ITEM_MAX_AGE_MS,
  pruneBuffer,
  removeAcknowledged,
  type BufferedItem,
} from './relay-buffer.service.js';

const NOW = new Date('2026-09-07T12:00:00+02:00');

function item(id: string, receivedAt: string): BufferedItem {
  return { id, receivedAt, payload: { lat: 1, lon: 2 } };
}

function agedMinutes(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString();
}

describe('pruneBuffer', () => {

  it('a friss teteleket megtartja', () => {
    const outcome = pruneBuffer([item('a', agedMinutes(5))], NOW);

    expect(outcome.kept.length).toBe(1);
    expect(outcome.expiredCount).toBe(0);
  });

  it('a lejart tetelt kiejti — a puffer NEM archivum', () => {
    const old = new Date(NOW.getTime() - ITEM_MAX_AGE_MS - 1000).toISOString();
    const outcome = pruneBuffer([item('a', old)], NOW);

    expect(outcome.kept.length).toBe(0);
    expect(outcome.expiredCount).toBe(1);
  });

  it('darabszam-korlatnal a LEGREGEBBI esik ki — a friss helyzet tobbet er', () => {
    const items = [item('regi', agedMinutes(30)), item('kozep', agedMinutes(20)), item('uj', agedMinutes(1))];
    const outcome = pruneBuffer(items, NOW, 2);

    expect(outcome.kept.map((i) => i.id)).toEqual(['kozep', 'uj']);
    expect(outcome.overflowCount).toBe(1);
  });

  it('🔴 ELOBB a lejarat, AZTAN a darabszam', () => {
    // Forditva egy amugy is lejaro regi tetel kiszoritana egy frisset.
    const expired = new Date(NOW.getTime() - ITEM_MAX_AGE_MS - 1000).toISOString();
    const items = [item('lejart', expired), item('friss1', agedMinutes(2)), item('friss2', agedMinutes(1))];
    const outcome = pruneBuffer(items, NOW, 2);

    expect(outcome.kept.map((i) => i.id)).toEqual(['friss1', 'friss2']);
    expect(outcome.overflowCount).toBe(0);
  });

  it('⚠️ az ertelmezhetetlen idobelyeget MEGTARTJA — bizonytalansagbol nem dobunk el adatot', () => {
    expect(pruneBuffer([item('a', 'nem-datum')], NOW).kept.length).toBe(1);
  });

  it('ures pufferen nem hasal el', () => {
    expect(pruneBuffer([], NOW).kept).toEqual([]);
  });
});

describe('removeAcknowledged', () => {

  it('a nyugtazott tetelt eltavolitja', () => {
    const items = [item('a', agedMinutes(1)), item('b', agedMinutes(1))];

    expect(removeAcknowledged(items, ['a']).map((i) => i.id)).toEqual(['b']);
  });

  it('🔴 amit NEM nyugtaztak, az MARAD — inkabb ketszer, mint egyszer sem', () => {
    // Ha a lehuzas valasza elveszne a halozaton, a tetel itt marad es ujra jon.
    // A duplikatumot a fogado kiszuri az id alapjan; az elveszett helyzetet SEMMI nem hozza vissza.
    const items = [item('a', agedMinutes(1)), item('b', agedMinutes(1))];

    expect(removeAcknowledged(items, []).length).toBe(2);
  });

  it('ismeretlen azonositora nem hasal el', () => {
    expect(removeAcknowledged([item('a', agedMinutes(1))], ['nincs-ilyen']).length).toBe(1);
  });
});

describe('createItemId', () => {

  it('⛔ NEM tartalmaz semmit a tartalombol — naploba es URL-be is kerulhet', () => {
    const id = createItemId(NOW, 'abc123');

    expect(id).toContain('abc123');
    expect(id).not.toContain('lat');
    expect(id).not.toContain('lon');
  });

  it('kulonbozo veletlen-reszre kulonbozo azonosito', () => {
    expect(createItemId(NOW, 'aaa')).not.toBe(createItemId(NOW, 'bbb'));
  });
});

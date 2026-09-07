import {
  describeRefresh,
  refreshBatchEntries,
  type CurrentMessageState,
  type RefreshableEntry,
} from './discord.batch-refresh.js';

function entry(messageId: string, content: string): RefreshableEntry {
  return { messageId, content };
}

function states(map: Record<string, CurrentMessageState>): Map<string, CurrentMessageState> {
  return new Map(Object.entries(map));
}

describe('refreshBatchEntries', () => {

  it('a JAVITOTT szoveget veszi at — ez az owner kerese', () => {
    const outcome = refreshBatchEntries(
      [entry('m1', 'ez elgepeles volt')],
      states({ m1: { kind: 'present', content: 'ez mar a javitott szoveg' } }),
    );

    expect(outcome.entries[0]?.content).toBe('ez mar a javitott szoveg');
    expect(outcome.updatedCount).toBe(1);
  });

  it('a valtozatlan uzenetet nem szamolja frissitesnek', () => {
    const outcome = refreshBatchEntries(
      [entry('m1', 'ugyanaz')],
      states({ m1: { kind: 'present', content: 'ugyanaz' } }),
    );

    expect(outcome.updatedCount).toBe(0);
    expect(outcome.entries.length).toBe(1);
  });

  it('a TOROLT uzenetet kiejti', () => {
    const outcome = refreshBatchEntries(
      [entry('m1', 'meggondoltam magam')],
      states({ m1: { kind: 'deleted' } }),
    );

    expect(outcome.entries.length).toBe(0);
    expect(outcome.removedCount).toBe(1);
  });

  it('🔴 a LEKERDEZHETETLEN uzenetet MEGTARTJA — halozati hiba nem torolhet', () => {
    const outcome = refreshBatchEntries(
      [entry('m1', 'fontos utasitas')],
      states({ m1: { kind: 'unknown' } }),
    );

    expect(outcome.entries[0]?.content).toBe('fontos utasitas');
    expect(outcome.removedCount).toBe(0);
    expect(outcome.unresolvedCount).toBe(1);
  });

  it('a hianyzo allapotot is `unknown`-kent kezeli (nem ejti ki)', () => {
    const outcome = refreshBatchEntries([entry('m1', 'megmarad')], states({}));

    expect(outcome.entries.length).toBe(1);
    expect(outcome.unresolvedCount).toBe(1);
  });

  it('🔴 HANGUZENET: az URES friss tartalom NEM irja felul az atiratot', () => {
    // A Discord-hanguzenet torzse URES (a hang csatolmany), a kotegben viszont az ATIRAT all.
    // Enelkul a frissites kitorolne a felismert szoveget az utolso lepesnel.
    const outcome = refreshBatchEntries(
      [entry('m1', '🎙️ HANGÜZENET — gépi átirat: nezd meg a vonatot')],
      states({ m1: { kind: 'present', content: '' } }),
    );

    expect(outcome.entries[0]?.content).toContain('nezd meg a vonatot');
    expect(outcome.updatedCount).toBe(0);
    expect(outcome.unresolvedCount).toBe(1);
  });

  it('a csak-szokozos friss tartalom sem torolhet', () => {
    const outcome = refreshBatchEntries(
      [entry('m1', 'valodi tartalom')],
      states({ m1: { kind: 'present', content: '   ' } }),
    );

    expect(outcome.entries[0]?.content).toBe('valodi tartalom');
  });

  it('megtartja a sorrendet es a tobbi mezot', () => {
    const outcome = refreshBatchEntries(
      [
        { messageId: 'm1', content: 'egy', authorName: 'Owner' },
        { messageId: 'm2', content: 'ketto', authorName: 'Owner' },
      ] as (RefreshableEntry & { authorName: string })[],
      states({
        m1: { kind: 'present', content: 'EGY' },
        m2: { kind: 'present', content: 'ketto' },
      }),
    );

    expect(outcome.entries.map((e) => e.messageId)).toEqual(['m1', 'm2']);
    expect(outcome.entries[0]?.content).toBe('EGY');
    expect((outcome.entries[0] as { authorName: string }).authorName).toBe('Owner');
  });

  it('vegyes koteget helyesen kezel', () => {
    const outcome = refreshBatchEntries(
      [entry('m1', 'regi'), entry('m2', 'torolni'), entry('m3', 'marad')],
      states({
        m1: { kind: 'present', content: 'uj' },
        m2: { kind: 'deleted' },
        m3: { kind: 'unknown' },
      }),
    );

    expect(outcome.updatedCount).toBe(1);
    expect(outcome.removedCount).toBe(1);
    expect(outcome.unresolvedCount).toBe(1);
    expect(outcome.entries.map((e) => e.messageId)).toEqual(['m1', 'm3']);
  });

  it('ures kotegen nem hasal el', () => {
    expect(refreshBatchEntries([], states({})).entries).toEqual([]);
  });
});

describe('describeRefresh', () => {

  it('null, ha nem tortent semmi', () => {
    expect(describeRefresh({
      entries: [], updatedCount: 0, removedCount: 0, unresolvedCount: 0,
    })).toBeNull();
  });

  it('megnevezi, mi tortent', () => {
    const text = describeRefresh({
      entries: [], updatedCount: 2, removedCount: 1, unresolvedCount: 3,
    });

    expect(text).toContain('2 üzenet FRISSÜLT');
    expect(text).toContain('1 törölve');
    expect(text).toContain('3 nem volt lekérdezhető');
  });
});

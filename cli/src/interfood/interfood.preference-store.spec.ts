import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { InterfoodToolError } from './interfood.error.js';
import { InterfoodPreferenceStore } from './interfood.preference-store.js';

describe('InterfoodPreferenceStore', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ma-interfood-preferences-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('atomically persists an explicit preference and updates the same scoped key', async () => {
    const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
    await store.set({ scope: 'exact-food', key: 'Food:109', stance: 'prefer', reason: 'Első értékelés' });
    const state = await store.set({
      scope: 'exact-food',
      key: 'food:109',
      stance: 'favorite',
      reason: 'Megerősítve',
      excludedPatterns: [' darált '],
    });
    expect(state.entries.length).toBe(1);
    expect(state.entries[0]?.stance).toBe('favorite');
    expect(state.entries[0]?.excludedPatterns).toEqual(['darált']);
    expect((await store.load()).entries[0]?.reason).toBe('Megerősítve');
  });

  it('rejects a pairwise preference cycle without persisting it', async () => {
    const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
    await store.compare('A', 'B', 'A jobb');
    await store.compare('B', 'C', 'B jobb');
    await expectAsync(store.compare('C', 'A', 'C jobb')).toBeRejectedWithError(InterfoodToolError);
    expect((await store.load()).comparisons.length).toBe(2);
  });

  it('persists an explicit portion rule and upgrades a legacy state without portion rules', async () => {
    const path: string = join(directory, 'preferences.json');
    await writeFile(path, JSON.stringify({
      schemaVersion: '1.0.0',
      updatedAt: new Date(0).toISOString(),
      entries: [],
      comparisons: [],
    }), 'utf8');
    const store = new InterfoodPreferenceStore(path);
    expect((await store.load()).portionRules).toEqual([]);

    const state = await store.setPortionRule({
      foodNamePattern: ' Lasagne ',
      preferredPortionClass: 'small',
      excludedFoodNamePatterns: ['burgonyapüré'],
      reason: 'Owner portion decision',
    });
    expect(state.portionRules).toEqual([
      jasmine.objectContaining({
        foodNamePattern: 'lasagne',
        preferredPortionClass: 'small',
        excludedFoodNamePatterns: ['burgonyapüré'],
        source: 'explicit-user',
      }),
    ]);
  });

  it('prevents inferred or observed evidence from overwriting an explicit owner decision', async () => {
    const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
    await store.set({
      scope: 'exact-food',
      key: 'food:109',
      stance: 'favorite',
      reason: 'Explicit owner decision',
      source: 'explicit-user',
    });

    await expectAsync(store.set({
      scope: 'exact-food',
      key: 'food:109',
      stance: 'dislike',
      reason: 'Weak inferred signal',
      source: 'inferred',
      confidence: 'tentative',
    })).toBeRejectedWithError(/lower-authority preference/);
    await expectAsync(store.set({
      scope: 'exact-food',
      key: 'food:109',
      stance: 'neutral',
      reason: 'Observed order signal',
      source: 'confirmed-order',
      confidence: 'observed',
    })).toBeRejectedWithError(/lower-authority preference/);

    expect((await store.load()).entries[0]).toEqual(jasmine.objectContaining({
      stance: 'favorite',
      source: 'explicit-user',
      reason: 'Explicit owner decision',
    }));
  });
});

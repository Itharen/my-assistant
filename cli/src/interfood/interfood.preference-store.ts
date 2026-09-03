import { randomUUID } from 'node:crypto';

import { InterfoodToolError } from './interfood.error.js';
import {
  InterfoodPreference,
  InterfoodPreferenceComparison,
  InterfoodPreferenceConfidence,
  InterfoodPreferenceScope,
  InterfoodPreferenceSource,
  InterfoodPreferenceState,
  InterfoodPreferenceStance,
  InterfoodPortionPreferenceRule,
} from './interfood.models.js';
import { readJsonIfExists, writeJsonAtomically } from './interfood.paths.js';

const SCOPES: readonly string[] = ['exact-food', 'food-name-pattern', 'food-type', 'category', 'ingredient-pattern'];
const STANCES: readonly string[] = ['favorite', 'prefer', 'neutral', 'fallback', 'dislike', 'avoid', 'hard-reject'];

export class InterfoodPreferenceStore {
  public constructor(private readonly path: string) {}

  public async load(): Promise<InterfoodPreferenceState> {
    const value: unknown | undefined = await readJsonIfExists(this.path);
    if (value === undefined) return emptyState();
    return parseState(value);
  }

  public async set(input: {
    scope: InterfoodPreferenceScope;
    key: string;
    stance: InterfoodPreferenceStance;
    reason: string;
    source?: InterfoodPreferenceSource;
    confidence?: InterfoodPreferenceConfidence;
    excludedPatterns?: string[];
  }): Promise<InterfoodPreferenceState> {
    const state: InterfoodPreferenceState = await this.load();
    const now: string = new Date().toISOString();
    const normalizedKey: string = normalizePreferenceKey(input.key);
    const existing: InterfoodPreference | undefined = state.entries.find(
      (entry: InterfoodPreference): boolean => entry.scope === input.scope && entry.key === normalizedKey,
    );
    const requestedSource: InterfoodPreferenceSource = input.source ?? 'explicit-user';
    if (existing !== undefined && preferenceSourcePriority(requestedSource) < preferenceSourcePriority(existing.source)) {
      throw new InterfoodToolError(
        'MA-INTERFOOD-PREFERENCE-PRECEDENCE',
        'A lower-authority preference cannot overwrite the existing decision.',
        {
          scope: input.scope,
          key: normalizedKey,
          existingSource: existing.source,
          requestedSource,
        },
      );
    }
    const next: InterfoodPreference = {
      id: existing?.id ?? randomUUID(),
      scope: input.scope,
      key: normalizedKey,
      stance: input.stance,
      source: requestedSource,
      confidence: input.confidence ?? 'confirmed',
      excludedPatterns: [...new Set((input.excludedPatterns ?? []).map(normalizePreferenceKey))],
      reason: input.reason.trim(),
      createdAt: existing?.createdAt ?? now,
      lastConfirmedAt: now,
    };
    const entries: InterfoodPreference[] = state.entries.filter((entry: InterfoodPreference) => entry.id !== next.id);
    entries.push(next);
    return this.save({ ...state, updatedAt: now, entries });
  }

  public async compare(preferredKey: string, overKey: string, reason: string): Promise<InterfoodPreferenceState> {
    const preferred: string = normalizePreferenceKey(preferredKey);
    const over: string = normalizePreferenceKey(overKey);
    if (preferred === over) {
      throw new InterfoodToolError('MA-INTERFOOD-PREFERENCE-CYCLE', 'A food cannot be preferred over itself.');
    }
    const state: InterfoodPreferenceState = await this.load();
    const comparison: InterfoodPreferenceComparison = {
      id: randomUUID(),
      preferredKey: preferred,
      overKey: over,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };
    const comparisons: InterfoodPreferenceComparison[] = [...state.comparisons, comparison];
    const cycles: string[][] = comparisonCycles(comparisons);
    if (cycles.length > 0) {
      throw new InterfoodToolError(
        'MA-INTERFOOD-PREFERENCE-CYCLE',
        'The new pairwise preference would create a cycle that needs clarification.',
        { cycles },
      );
    }
    return this.save({ ...state, updatedAt: comparison.createdAt, comparisons });
  }

  public async setPortionRule(input: {
    foodNamePattern: string;
    preferredPortionClass: 'small' | 'full';
    excludedFoodNamePatterns?: string[];
    reason: string;
  }): Promise<InterfoodPreferenceState> {
    const state: InterfoodPreferenceState = await this.load();
    const now: string = new Date().toISOString();
    const foodNamePattern: string = normalizePreferenceKey(input.foodNamePattern);
    const excludedFoodNamePatterns: string[] = [...new Set(
      (input.excludedFoodNamePatterns ?? []).map(normalizePreferenceKey),
    )];
    const existing: InterfoodPortionPreferenceRule | undefined = state.portionRules.find(
      (rule: InterfoodPortionPreferenceRule): boolean => rule.foodNamePattern === foodNamePattern,
    );
    const next: InterfoodPortionPreferenceRule = {
      id: existing?.id ?? randomUUID(),
      foodNamePattern,
      preferredPortionClass: input.preferredPortionClass,
      excludedFoodNamePatterns,
      source: 'explicit-user',
      confidence: 'confirmed',
      reason: input.reason.trim(),
      createdAt: existing?.createdAt ?? now,
      lastConfirmedAt: now,
    };
    const portionRules: InterfoodPortionPreferenceRule[] = state.portionRules.filter(
      (rule: InterfoodPortionPreferenceRule): boolean => rule.id !== next.id,
    );
    portionRules.push(next);
    return this.save({ ...state, updatedAt: now, portionRules });
  }

  private async save(state: InterfoodPreferenceState): Promise<InterfoodPreferenceState> {
    await writeJsonAtomically(this.path, state);
    return state;
  }
}

function preferenceSourcePriority(source: InterfoodPreferenceSource): number {
  return source === 'explicit-user' ? 3 : source === 'confirmed-order' ? 2 : 1;
}

export function comparisonCycles(comparisons: InterfoodPreferenceComparison[]): string[][] {
  const edges: Map<string, string[]> = new Map();
  for (const comparison of comparisons) {
    edges.set(comparison.preferredKey, [...(edges.get(comparison.preferredKey) ?? []), comparison.overKey]);
  }
  const cycles: string[][] = [];
  const visiting: string[] = [];
  const visited: Set<string> = new Set();
  const walk = (node: string): void => {
    const position: number = visiting.indexOf(node);
    if (position >= 0) {
      cycles.push([...visiting.slice(position), node]);
      return;
    }
    if (visited.has(node)) return;
    visiting.push(node);
    for (const next of edges.get(node) ?? []) walk(next);
    visiting.pop();
    visited.add(node);
  };
  for (const node of edges.keys()) walk(node);
  return cycles;
}

export function requirePreferenceScope(value: unknown): InterfoodPreferenceScope {
  if (typeof value !== 'string' || !SCOPES.includes(value)) {
    throw new InterfoodToolError('MA-INTERFOOD-PREFERENCE', `Invalid preference scope: ${String(value)}.`, { allowed: SCOPES });
  }
  return value as InterfoodPreferenceScope;
}

export function requirePreferenceStance(value: unknown): InterfoodPreferenceStance {
  if (typeof value !== 'string' || !STANCES.includes(value)) {
    throw new InterfoodToolError('MA-INTERFOOD-PREFERENCE', `Invalid preference stance: ${String(value)}.`, { allowed: STANCES });
  }
  return value as InterfoodPreferenceStance;
}

export function normalizePreferenceKey(value: string): string {
  const normalized: string = value.trim().toLocaleLowerCase('hu-HU').normalize('NFKC').replace(/\s+/g, ' ');
  if (!normalized) throw new InterfoodToolError('MA-INTERFOOD-PREFERENCE', 'Preference key cannot be empty.');
  return normalized;
}

function emptyState(): InterfoodPreferenceState {
  return {
    schemaVersion: '1.0.0',
    updatedAt: new Date(0).toISOString(),
    entries: [],
    comparisons: [],
    portionRules: [],
  };
}

function parseState(value: unknown): InterfoodPreferenceState {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new InterfoodToolError('MA-INTERFOOD-PREFERENCE-SCHEMA', 'Preference state must be an object.');
  }
  const state: Record<string, unknown> = value as Record<string, unknown>;
  if (state.schemaVersion !== '1.0.0' || !Array.isArray(state.entries) || !Array.isArray(state.comparisons)) {
    throw new InterfoodToolError('MA-INTERFOOD-PREFERENCE-SCHEMA', 'Unsupported preference state schema.');
  }
  return {
    ...(value as InterfoodPreferenceState),
    entries: (state.entries as InterfoodPreference[]).map((entry: InterfoodPreference): InterfoodPreference => ({
      ...entry,
      excludedPatterns: Array.isArray(entry.excludedPatterns) ? entry.excludedPatterns : [],
    })),
    portionRules: Array.isArray(state.portionRules)
      ? state.portionRules as InterfoodPortionPreferenceRule[]
      : [],
  };
}

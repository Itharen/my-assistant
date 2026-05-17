// Spec for cast/tts.ts — resolveVoice pure resolver.
// Cycle 117 (safe-orthogonal spec-coverage).
//
// Pattern: cast/groups.spec.ts — pure Jasmine describe/it/expect.
// `fetchTtsMp3` NEM tesztelt: WebSocket network call (msedge-tts) — integration-only.

import { resolveVoice } from './tts.js';

describe('cast/tts.ts — resolveVoice', () => {

  it('returns the explicit `voice` option when provided (non-empty)', () => {
    expect(resolveVoice({ text: 'x', voice: 'hu-HU-NoemiNeural' })).toBe('hu-HU-NoemiNeural');
  });

  it('honors explicit voice even when lang is also set (voice takes precedence)', () => {
    expect(resolveVoice({ text: 'x', voice: 'en-GB-RyanNeural', lang: 'hu' })).toBe('en-GB-RyanNeural');
  });

  it('falls back to language default when voice is missing', () => {
    expect(resolveVoice({ text: 'x', lang: 'hu' })).toBe('hu-HU-TamasNeural');
    expect(resolveVoice({ text: 'x', lang: 'en' })).toBe('en-US-GuyNeural');
    expect(resolveVoice({ text: 'x', lang: 'de' })).toBe('de-DE-ConradNeural');
    expect(resolveVoice({ text: 'x', lang: 'fr' })).toBe('fr-FR-HenriNeural');
  });

  it('defaults to hu (TamasNeural) when both voice and lang are missing', () => {
    expect(resolveVoice({ text: 'x' })).toBe('hu-HU-TamasNeural');
  });

  it('falls back to TamasNeural for unknown lang code', () => {
    expect(resolveVoice({ text: 'x', lang: 'jp' })).toBe('hu-HU-TamasNeural');
    expect(resolveVoice({ text: 'x', lang: 'unknown' })).toBe('hu-HU-TamasNeural');
  });

  it('treats empty-string voice as missing (lang fallback applies)', () => {
    expect(resolveVoice({ text: 'x', voice: '', lang: 'en' })).toBe('en-US-GuyNeural');
  });
});

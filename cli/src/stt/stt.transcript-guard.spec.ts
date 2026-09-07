import { inspectTranscript } from './stt.transcript-guard.js';

describe('inspectTranscript', () => {
  it('accepts a normal Hungarian sentence', () => {
    expect(inspectTranscript('Kerlek nezd meg, mikor indul a vonat.').suspicious).toBe(false);
  });

  it('flags the EXACT hallucination we measured on 2026-09-07', () => {
    // Elo probaan egy csendes mintara ezt adta vissza a szolgaltatas, status: processed.
    const verdict = inspectTranscript('Продолжение следует...');

    expect(verdict.suspicious).toBe(true);
    expect(verdict.reason).toContain('hallucin');
  });

  it('flags an empty transcript', () => {
    expect(inspectTranscript('   ').suspicious).toBe(true);
  });

  it('flags known subtitle-credit hallucinations', () => {
    expect(inspectTranscript('Субтитры сделал DimaTorzok').suspicious).toBe(true);
    expect(inspectTranscript('Thanks for watching!').suspicious).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(inspectTranscript('THANKS FOR WATCHING').suspicious).toBe(true);
  });

  it('flags a very short transcript but does NOT discard it', () => {
    const verdict = inspectTranscript('a');

    expect(verdict.suspicious).toBe(true);
    expect(verdict.reason).toContain('rövid');
  });

  it('accepts a short but meaningful answer', () => {
    // "igen" ertelmes valasz - nem szabad gyanusnak jelolni.
    expect(inspectTranscript('igen').suspicious).toBe(false);
  });

  it('flags a hallucination even when embedded in other text', () => {
    expect(inspectTranscript('hello Продолжение следует').suspicious).toBe(true);
  });
});

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

describe('inspectTranscript — BUKOTT FELISMERÉS (owner mérése, 2026-09-07)', () => {

  it('🔴 A MÉRT ESET: 9 mp hangból „Köszönöm" — a puszta hossz-küszöb ÁTENGEDTE volna', () => {
    const verdict = inspectTranscript('Köszönöm', { audioDurationSecs: 9 });

    expect(verdict.suspicious).toBe(true);
    expect(verdict.reason).toContain('9 másodperc');
    expect(verdict.reason).toContain('küldje újra');
  });

  it('hanghossz NÉLKÜL is elkapja a csupasz töltelék-szót', () => {
    expect(inspectTranscript('Köszönöm').suspicious).toBe(true);
    expect(inspectTranscript('thank you').suspicious).toBe(true);
    expect(inspectTranscript('you').suspicious).toBe(true);
  });

  it('⛔ a töltelék-szó CSAK önmagában gyanús — mondat részeként NEM', () => {
    const verdict = inspectTranscript('Köszönöm, akkor ezt csináld meg holnap reggel.');

    expect(verdict.suspicious).toBe(false);
  });

  it('a záró írásjel nem menti meg a csupasz tölteléket', () => {
    expect(inspectTranscript('Köszönöm.').suspicious).toBe(true);
  });

  it('⚠️ ÉRDEMI szöveget hosszú hangnál sem jelöl meg', () => {
    const real = 'Na most jelentem, hogy amikor hazaértem, olyan fárasztó volt ez a nap, '
      + 'hogy el is aludtam, és most ébredtem fel.';

    expect(inspectTranscript(real, { audioDurationSecs: 16 }).suspicious).toBe(false);
  });

  it('rövid hangnál NEM számol arányt — ott a szórás túl nagy', () => {
    // 2 mp hangból 3 karakter: aránytalan lenne, de ilyen rövidnél ez normális.
    expect(inspectTranscript('Jó.', { audioDurationSecs: 2 }).suspicious).toBe(false);
  });
});

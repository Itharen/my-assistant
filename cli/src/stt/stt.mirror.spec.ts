import { composeMirrorMessage } from './stt.mirror.js';
import type { SttResult } from './stt.models.js';

const base: SttResult = {
  ok: true, text: '', detail: '', elapsedMs: 2000, suspicious: false,
};

describe('composeMirrorMessage', () => {
  it('shows the transcript back, quoted', () => {
    const message = composeMirrorMessage({ ...base, text: 'Nezd meg a vonatot' });

    expect(message).toContain('> Nezd meg a vonatot');
    expect(message).toContain('ezt értettem');
  });

  it('invites a correction on the happy path', () => {
    const message = composeMirrorMessage({ ...base, text: 'valami' });

    expect(message).toContain('félreértettem');
  });

  it('marks a suspicious transcript and refuses to act on it', () => {
    const message = composeMirrorMessage({
      ...base, text: 'Продолжение следует', suspicious: true,
      suspicionReason: 'Ismert modell-hallucináció mintája.',
    });

    expect(message).toContain('BIZONYTALAN');
    expect(message).toContain('NEM cselekszem rá');
  });

  it('never claims to know what was said when recognition failed', () => {
    const message = composeMirrorMessage({
      ...base, ok: false, detail: 'HTTP 500', remedy: 'Nezd meg a health-et.',
    });

    expect(message).toContain('NEM sikerült');
    expect(message).toContain('Nem tippelek');
    expect(message).toContain('Nezd meg a health-et.');
  });

  it('shows an explicit placeholder instead of a blank quote when empty', () => {
    const message = composeMirrorMessage({
      ...base, text: '', suspicious: true, suspicionReason: 'ÜRES.',
    });

    expect(message).toContain('*(üres)*');
  });

  it('reports the elapsed time in seconds', () => {
    expect(composeMirrorMessage({ ...base, text: 'ok', elapsedMs: 2040 })).toContain('2 mp');
  });
});

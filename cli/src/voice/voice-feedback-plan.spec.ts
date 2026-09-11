import { planFeedbackForDrop, planFeedbackForOutcome } from './voice-feedback-plan.js';
import type { RecordingHandled } from './voice-recording-outcome.js';
import type { VoiceDropObservation } from './voice-drop-probe.js';

function outcome(overrides: Partial<RecordingHandled>): RecordingHandled {
  return {
    fromOwner: true,
    transcribed: false,
    queued: false,
    detail: 'teszt',
    ...overrides,
  };
}

function drop(overrides: Partial<VoiceDropObservation>): VoiceDropObservation {
  return {
    filename: 'recording-owner-1.wav',
    maxSizeBytes: 100_000,
    lostAudioSeconds: 2.5,
    lifetimeMs: 1500,
    reason: 'discarded-by-recorder',
    ...overrides,
  };
}

describe('planFeedbackForOutcome — mit hall és mit lát az owner', () => {
  it('✅ a kötegbe került felvételnél a SIKER hangja szól, jelentés nélkül', () => {
    const plan = planFeedbackForOutcome(outcome({ queued: true, transcribed: true }));

    expect(plan.cue).toBe('understood');
    expect(plan.missed).toBeNull();
  });

  it('❓ gyanús átiratnál a „nem értem" hang szól ÉS jelentünk', () => {
    const plan = planFeedbackForOutcome(outcome({ missed: 'not-understood' }));

    expect(plan.cue).toBe('unsure');
    expect(plan.missed).toEqual({ kind: 'not-understood' });
  });

  it('⭐ AMIT ÉRTETTÜNK és az OK ÁTMEGY a jelentésbe (owner, 2026-09-11 01:29)', () => {
    // ⛔ Ez NEM a hallucináció-őr lazítása: gyanús átiratra továbbra sem cselekszünk —
    // csak megmondjuk, mit hallottunk, hogy Ő dönthessen.
    const plan = planFeedbackForOutcome(outcome({
      missed: 'not-understood',
      heard: '  Jag måste bara vara  ',
      reason: ' nyelv-eltérés ',
    }));

    expect(plan.missed).toEqual({
      kind: 'not-understood',
      heard: 'Jag måste bara vara',
      reason: 'nyelv-eltérés',
    });
  });

  it('⚠️ ÜRES átirat/ok nem kerül be — az üres idézőjel semmit nem mond', () => {
    const plan = planFeedbackForOutcome(outcome({
      missed: 'not-understood',
      heard: '   ',
      reason: '',
    }));

    expect(plan.missed).toEqual({ kind: 'not-understood' });
  });

  it('❌ bukott felismerésnél a HIBA hangja szól ÉS jelentünk', () => {
    const plan = planFeedbackForOutcome(outcome({ missed: 'recognition-failed' }));

    expect(plan.cue).toBe('error');
    expect(plan.missed).toEqual({ kind: 'recognition-failed' });
  });

  it('🔴 DUPLIKÁTUMNÁL CSEND — se hang, se jelentés', () => {
    const plan = planFeedbackForOutcome(outcome({
      transcribed: true,
      queued: false,
      detail: 'Ezt a szegmenst már feldolgoztuk.',
    }));

    expect(plan.cue).toBeNull();
    expect(plan.missed).toBeNull();
  });

  it('🔴 IDEGEN beszélőnél is CSEND — nem az owner elveszett mondata', () => {
    const plan = planFeedbackForOutcome(outcome({ fromOwner: false }));

    expect(plan.cue).toBeNull();
    expect(plan.missed).toBeNull();
  });

  it('⭐ a siker SOHA nem jelent kiesést (a két mező nem lehet egyszerre kitöltve)', () => {
    const cases: RecordingHandled[] = [
      outcome({ queued: true, transcribed: true }),
      outcome({ missed: 'not-understood' }),
      outcome({ missed: 'recognition-failed' }),
      outcome({ transcribed: true }),
      outcome({ fromOwner: false }),
    ];

    for (const c of cases) {
      const plan = planFeedbackForOutcome(c);

      if (plan.missed) expect(plan.cue).not.toBe('understood');
    }
  });
});

describe('planFeedbackForDrop — a némán eldobott felvétel', () => {
  it('🎚️ a felvevő eldobta: szól ÉS jelent, a MÁSODPERCCEL együtt', () => {
    const plan = planFeedbackForDrop(drop({ lostAudioSeconds: 3.4 }));

    expect(plan.cue).toBe('dropped');
    expect(plan.missed).toEqual({ kind: 'discarded-by-recorder', seconds: 3.4 });
  });

  it('⛔ az ÜRES felvételről NEM szólunk — ott tényleg nem volt beszéd', () => {
    const plan = planFeedbackForDrop(drop({ reason: 'empty-file', lostAudioSeconds: 0 }));

    expect(plan.cue).toBeNull();
    expect(plan.missed).toBeNull();
  });

  it('a 0 másodperces, de NEM üres felvételt is jelenti (a felvevő akkor is eldobta)', () => {
    const plan = planFeedbackForDrop(drop({ lostAudioSeconds: 0, maxSizeBytes: 100 }));

    expect(plan.cue).toBe('dropped');
    expect(plan.missed?.seconds).toBe(0);
  });
});

import { planRetryDelivery, RetryOutcomeAction, SttRetryOutcome_Util } from './stt.retry-delivery.js';

describe('planRetryDelivery — hogyan kézbesítsük a KÉSŐN felismert átiratot', () => {
  it('🔊 hang-csatornás felvétel: HANGCSATORNA-jelölés + a tükör ODA, ahol elhangzott', () => {
    const plan = planRetryDelivery({ source: 'voice-channel', channelId: 'hang-csatorna-1' });

    expect(plan.markAs).toBe('voice-channel');
    expect(plan.mirror).toEqual({ to: 'channel', channelId: 'hang-csatorna-1' });
    expect(plan.headline).toContain('hang-csatornában');
  });

  it('🎙️ hangüzenet: a tükör VÁLASZKÉNT megy — így marad összekötve a forrásával', () => {
    const plan = planRetryDelivery({ source: 'voice-message', channelId: 'fo-csatorna' });

    expect(plan.markAs).toBe('voice-message');
    expect(plan.mirror).toEqual({ to: 'reply' });
    expect(plan.headline).toContain('hangüzenet');
  });

  it('⭐ FORRÁS NÉLKÜL a régi úton kézbesít — a lemezen már ott lévő tételek nem törnek el', () => {
    const plan = planRetryDelivery({ channelId: 'fo-csatorna' });

    expect(plan.markAs).toBe('voice-message');
    expect(plan.mirror).toEqual({ to: 'reply' });
  });

  it('🔴 a hang-csatornás tükör SOHA nem válasz — ott a messageId a WAV fájlneve', () => {
    const plan = planRetryDelivery({ source: 'voice-channel', channelId: 'c1' });

    // ⚠️ Ha válaszként menne, egy NEM LÉTEZŐ üzenetre válaszolna.
    expect(plan.mirror.to).not.toBe('reply');
  });

  it('⭐ a két forrás MÁS bevezetőt kap — az owner tudja, mire vonatkozik', () => {
    const channel = planRetryDelivery({ source: 'voice-channel', channelId: 'c1' });
    const message = planRetryDelivery({ source: 'voice-message', channelId: 'c1' });

    expect(channel.headline).not.toBe(message.headline);
  });
});

describe('SttRetryOutcome_Util — mi legyen az újrapróbálás kimenetelével (20. tétel)', () => {

  it('🔴 A ZAJ NEM BUKÁS — kiesik a sorból, riasztás NÉLKÜL', () => {
    // > Owner, 05:30: „sok »végleges nem sikerült felismerni« üzenet… azt írja, buli zaj, de
    // > hát a bulinak már régen vége." — mérve: 169 riasztás / éjszaka, ebből 43 BULI-ZAJ.
    expect(SttRetryOutcome_Util.decide({ ok: true, suspicious: true, isNoise: true }))
      .toBe(RetryOutcomeAction.dropAsNoise);
  });

  it('🔴 POZITÍV KONTROLL: a SORREND számít — a zaj-jelölés ERŐSEBB a „gyanús"-nál', () => {
    // ⚠️ A zaj MINDIG `suspicious` is (részhalmaz). Ha a `suspicious` döntene előbb, a zaj
    // visszakerülne a sorba, és minden a régi hibába futna — pont ezt méri ez a teszt.
    const asNoise = SttRetryOutcome_Util.decide({ ok: true, suspicious: true, isNoise: true });
    const asDoubtful = SttRetryOutcome_Util.decide({ ok: true, suspicious: true });

    expect(asNoise).toBe(RetryOutcomeAction.dropAsNoise);
    expect(asDoubtful).toBe(RetryOutcomeAction.retry);
    expect(asNoise).not.toBe(asDoubtful);
  });

  it('⭐ a technikai bukás TOVÁBBRA IS újrapróbálandó — a hang nem veszhet el', () => {
    expect(SttRetryOutcome_Util.decide({ ok: false })).toBe(RetryOutcomeAction.retry);
    expect(SttRetryOutcome_Util.decide({ ok: false, isNoise: false })).toBe(RetryOutcomeAction.retry);
  });

  it('✅ a tiszta átirat KÉZBESÍTENDŐ', () => {
    expect(SttRetryOutcome_Util.decide({ ok: true })).toBe(RetryOutcomeAction.deliver);
    expect(SttRetryOutcome_Util.decide({ ok: true, suspicious: false })).toBe(RetryOutcomeAction.deliver);
  });
});

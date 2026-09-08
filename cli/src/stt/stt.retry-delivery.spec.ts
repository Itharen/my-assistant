import { planRetryDelivery } from './stt.retry-delivery.js';

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

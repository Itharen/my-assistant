import { decideFlush } from './discord.bridge.js';
import { composeBatchPrompt } from './discord.batch-composer.js';
import { DISCORD_INBOUND_PREFIX, type DiscordInboundMessage } from './discord.models.js';

const CONFIG = { collectWindowMs: 20_000, maxHoldMs: 15 * 60_000 };
const NOW = new Date('2026-09-06T14:00:00+02:00');

function message(overrides: Partial<DiscordInboundMessage> = {}): DiscordInboundMessage {
  return {
    messageId: overrides.messageId ?? 'm1',
    authorId: overrides.authorId ?? 'owner-1',
    authorName: overrides.authorName ?? 'Owner',
    channelId: overrides.channelId ?? 'chan-1',
    content: overrides.content ?? 'Teszt üzenet',
    receivedAt: overrides.receivedAt ?? NOW.toISOString(),
  };
}

/** Adott számú másodperccel a NOW ELŐTT érkezett üzenet. */
function ageSeconds(seconds: number): string {
  return new Date(NOW.getTime() - seconds * 1000).toISOString();
}

describe('decideFlush', () => {
  it('does not flush an empty batch', () => {
    const decision = decideFlush({ pending: [], isBusyProcessing: false, queuedItemCount: 0, now: NOW, config: CONFIG });

    expect(decision.shouldFlush).toBe(false);
    expect(decision.pendingCount).toBe(0);
  });

  it('holds messages while the session is busy — this is the whole point of batching', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(60) })],
      isBusyProcessing: true,
      queuedItemCount: 0,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBe(false);
    expect(decision.reason).toContain('gyűjtünk tovább');
  });

  it('flushes when the session is free and the burst has gone quiet', () => {
    const decision = decideFlush({
      pending: [
        message({ messageId: 'a', receivedAt: ageSeconds(120) }),
        message({ messageId: 'b', receivedAt: ageSeconds(30) }),
      ],
      isBusyProcessing: false,
      queuedItemCount: 0,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBe(true);
    expect(decision.pendingCount).toBe(2);
  });

  it('keeps collecting while a burst is still arriving, even if the session is free', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(2) })],
      isBusyProcessing: false,
      queuedItemCount: 0,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBe(false);
    expect(decision.reason).toContain('Összegyűjtési ablak');
  });

  it('opens the safety valve when the oldest message waited past the hold limit — even if busy', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(16 * 60) })],
      isBusyProcessing: true,
      queuedItemCount: 0,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBe(true);
    expect(decision.reason).toContain('Biztonsági szelep');
  });
});

describe('composeBatchPrompt', () => {
  it('returns an empty string for an empty batch so the caller never sends nothing', () => {
    expect(composeBatchPrompt([])).toBe('');
  });

  it('prefixes the prompt and keeps every message in arrival order', () => {
    const prompt = composeBatchPrompt([
      message({ messageId: 'a', content: 'Első', receivedAt: ageSeconds(120) }),
      message({ messageId: 'b', content: 'Második', receivedAt: ageSeconds(60) }),
      message({ messageId: 'c', content: 'Harmadik', receivedAt: ageSeconds(30) }),
    ]);

    expect(prompt.startsWith(DISCORD_INBOUND_PREFIX)).toBe(true);
    expect(prompt).toContain('3 új üzenet');
    expect(prompt.indexOf('Első')).toBeLessThan(prompt.indexOf('Második'));
    expect(prompt.indexOf('Második')).toBeLessThan(prompt.indexOf('Harmadik'));
  });

  it('always restates the Discord reply obligation', () => {
    const prompt = composeBatchPrompt([message()]);

    expect(prompt).toContain('Discordon IS');
  });

  it('marks truncation visibly instead of silently cutting content', () => {
    const prompt = composeBatchPrompt([message({ content: 'x'.repeat(40_000) })]);

    expect(prompt).toContain('csonkolva');
  });
});

describe('composeBatchPrompt — idobelyeg es KOR', () => {

  const sent: string = '2026-09-07T09:00:00+02:00';

  function aged(content: string, receivedAt: string) {
    return { ...message({ content }), receivedAt };
  }

  it('kiirja a KEZBESITES idejet — enelkul nincs mihez viszonyitani', () => {
    const prompt = composeBatchPrompt([aged('szia', sent)], new Date('2026-09-07T09:01:00+02:00'));

    expect(prompt).toContain('kézbesítve: 2026-09-07 09:01');
  });

  it('a FRISS uzenetnel nem ir kort — az csak zaj lenne', () => {
    const prompt = composeBatchPrompt([aged('szia', sent)], new Date('2026-09-07T09:01:00+02:00'));

    expect(prompt).not.toContain('perce');
  });

  it('percben irja a kort', () => {
    const prompt = composeBatchPrompt([aged('szia', sent)], new Date('2026-09-07T09:28:00+02:00'));

    expect(prompt).toContain('28 perce');
  });

  it('🔴 egy oranal regebbi uzenetet MEGJELOL — a kesoi valasz rossz valasz lehet', () => {
    const prompt = composeBatchPrompt([aged('mikor induljak?', sent)], new Date('2026-09-07T10:35:00+02:00'));

    expect(prompt).toContain('1 ó 35 perce');
    expect(prompt).toContain('RÉGI');
  });

  it('az abszolut idobelyeg tovabbra is ott van', () => {
    const prompt = composeBatchPrompt([aged('szia', sent)], new Date('2026-09-07T09:30:00+02:00'));

    expect(prompt).toContain('2026-09-07 09:00');
  });

  it('hibas idobelyegen nem hasal el', () => {
    const prompt = composeBatchPrompt([aged('szia', 'nem-datum')], new Date('2026-09-07T09:30:00+02:00'));

    expect(prompt).toContain('szia');
  });
});

describe('decideFlush — a CCAP SORA is szamit (owner, 2026-09-07)', () => {

  // Owner: "latom, hogy message queue-ba kerultek az uzeneteim es nem lett megvarva, hogy a
  // session-od vegezzen (ha running vagy van message a queue-ban akkor csak gyujtunk)"

  it('🔴 NEM kuld, ha a CCAP soraban mar all egy tetel — akkor sem, ha a session szabad', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(60) })],
      isBusyProcessing: false,
      queuedItemCount: 1,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBe(false);
    expect(decision.reason).toContain('sorában már áll');
  });

  it('NEM kuld, ha a sor ZAROLT', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(60) })],
      isBusyProcessing: false,
      queuedItemCount: 0,
      isQueueLocked: true,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBe(false);
    expect(decision.reason).toContain('ZÁROLT');
  });

  it('ures sor + szabad session + elcsendesedes eseten KULD', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(60) })],
      isBusyProcessing: false,
      queuedItemCount: 0,
      isQueueLocked: false,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBe(true);
  });

  it('⚠️ a BIZTONSAGI SZELEP a tele sort is felulirja — kulonben orokre allna a koteg', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(9999) })],
      isBusyProcessing: true,
      queuedItemCount: 5,
      isQueueLocked: true,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBe(true);
    expect(decision.reason).toContain('Biztonsági szelep');
  });
});

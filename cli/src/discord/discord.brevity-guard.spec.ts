import {
  MAX_MESSAGE_CHARS,
  MAX_MESSAGE_LINES,
  inspectBrevity,
} from './discord.brevity-guard.js';

describe('discord.brevity-guard', () => {

  it('a rövid üzenet átmegy', () => {
    const verdict = inspectBrevity('Igazad van. Rövidítek.');

    expect(verdict.acceptable).toBe(true);
    expect(verdict.reason).toBeUndefined();
  });

  it('⭐ a HOSSZÚ üzenet is átmehet — az owner javította ki a korlátomat (2026-09-07 21:45)', () => {
    // „amúgy is kell, hogy tudjál hosszabb üzeneteket összeírni" — pl. a holnapi
    // programból összeállított ajánlás. ⇒ 1100 karakter MÁR NEM kifogás.
    expect(inspectBrevity('a'.repeat(1100)).acceptable).toBe(true);
  });

  it('csak a TÉNYLEG szélsőséges hosszra jelez — és akkor is CSAK jelez, nem blokkol', () => {
    const verdict = inspectBrevity('a'.repeat(MAX_MESSAGE_CHARS + 1));

    expect(verdict.acceptable).toBe(false);
    expect(verdict.reason).toContain(String(MAX_MESSAGE_CHARS));
  });

  it('⚠️ a SOR-korlátot külön nézi — telefonon a sorok száma a fal, nem a karakter', () => {
    const many: string = Array.from({ length: MAX_MESSAGE_LINES + 2 }, (): string => 'ok').join('\n');
    const verdict = inspectBrevity(many);

    expect(verdict.acceptable).toBe(false);
    expect(verdict.chars).toBeLessThan(MAX_MESSAGE_CHARS);
    expect(verdict.reason).toContain('soros');
  });

  it('⛔ SOHA nem csonkol — a teendőt adja meg, nem levágott szöveget', () => {
    const verdict = inspectBrevity('b'.repeat(MAX_MESSAGE_CHARS + 50));

    expect(verdict.remedy).toContain('Fogalmazd át');
  });

  it('a pontosan a határon lévő üzenet még átmegy', () => {
    expect(inspectBrevity('c'.repeat(MAX_MESSAGE_CHARS)).acceptable).toBe(true);
  });

  it('üres szövegre nem panaszkodik — arról a küldő dönt', () => {
    const verdict = inspectBrevity('   ');

    expect(verdict.acceptable).toBe(true);
    expect(verdict.lines).toBe(0);
  });
});

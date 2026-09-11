import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DiscordBridge, decideFlush } from './discord.bridge.js';
import { composeBatchPrompt } from './discord.batch-composer.js';
import {
  DEFAULT_BATCH_CONFIG,
  DISCORD_INBOUND_PREFIX,
  type DiscordInboundMessage,
} from './discord.models.js';

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

  it('🔴 a tartási korlát lejárta ELLENÉRE sem küld foglalt sessionbe — ez nyelt el 5 üzenetet', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(16 * 60) })],
      isBusyProcessing: true,
      queuedItemCount: 0,
      now: NOW,
      config: CONFIG,
    });

    // MÉRT HIBA (2026-09-07): korábban ITT `true` állt („küldünk, foglaltság ellenére is").
    // A foglalt sessionbe küldött prompt a CCAP SORÁBA áll, mi pedig kézbesítettnek jelöltük
    // — az owner öt üzenete így tűnt el úgy, hogy minden szint SIKERT jelentett rá.
    expect(decision.shouldFlush).toBe(false);
    expect(decision.reason).toContain('A session dolgozik');
    // ⭐ De a lejárt korlát LÁTSZIK az indoklásban — nem némán maradunk veszteg.
    expect(decision.reason).toContain('tartási korlát LEJÁRT');
  });

  it('a lejárt tartási korlát az összegyűjtési ablakot VISZONT felülírja — szabad sessionnél', () => {
    const decision = decideFlush({
      // Friss üzenet (a gyűjtő-ablakon belül), DE a köteg legrégebbije rég vár.
      pending: [message({ receivedAt: ageSeconds(16 * 60) }), message({ receivedAt: ageSeconds(1) })],
      isBusyProcessing: false,
      queuedItemCount: 0,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBe(true);
    expect(decision.reason).toContain('tartási korlát is lejárt');
  });
});

describe('decideFlush — ⏳ A MEGSZÓLALÁS-KAPU (a HETEDIK; owner, 2026-09-11)', () => {

  // > **Owner, 2026-09-11 02:28:** *„az üzenetcsomagot csak akkor szabad elküldeni, ha nem
  // > kezdtünk el következő üzenetet se… meg kell várni, hogy abból mi lesz."*
  //
  // > **Owner, 2026-09-11 03:27 — élesben, MÁSODSZOR:** *„Na, baszd meg, még én beszélek, a
  // > csomó[g] nem megy át."*
  //
  // 🔴 MÉRT RÉS (2026-09-11 06:04): a döntés HAT kaput ismert, de ilyet SOHA — az
  // elcsendesedési ablak akkor is letelhetett, amikor az owner ÉPP BESZÉLT.

  it('🔴 FOLYAMATBAN LÉVŐ megszólalásnál NEM küld — még akkor sem, ha elcsendesedett', () => {
    // Ez a mért hiba: a 20 (most 30) mp-es ablak letelt, a session szabad, a sor üres —
    // és a köteg kiment, MIKÖZBEN az owner beszélt.
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(120) })],
      isBusyProcessing: false,
      queuedItemCount: 0,
      isSpeechInProgress: true,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBeFalse();
    expect(decision.reason).toContain('ÉPP BESZÉL');
  });

  it('⭐ a megszólalás LEZÁRULTA után kimegy', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(120) })],
      isBusyProcessing: false,
      queuedItemCount: 0,
      isSpeechInProgress: false,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBeTrue();
  });

  it('⚠️ a `maxHoldMs` szelep FÖLÜLÍRJA a kaput — owner: „HACSAK nem vár nagyon sok üzenet"', () => {
    // ⛔ Egy hosszú monológ alatt nem állhatnak korlátlanul az üzenetek. A szelep MARAD.
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(16 * 60) })],
      isBusyProcessing: false,
      queuedItemCount: 0,
      isSpeechInProgress: true,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBeTrue();
    expect(decision.reason).toContain('tartási korlát');
  });

  it('⭐ a FOGLALTSÁG-kapuk ERŐSEBBEK: foglalt sessionbe a szelep sem küld', () => {
    // A sorrend számít: a „beállunk a sorba = eltűnés" hiba (2026-09-07, 5 elnyelt üzenet)
    // védelme ELŐBB dönt, mint a megszólalás-kapu.
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(16 * 60) })],
      isBusyProcessing: true,
      queuedItemCount: 0,
      isSpeechInProgress: true,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBeFalse();
    expect(decision.reason).toContain('A session dolgozik');
  });

  it('⛔ a kapu NEM ad hamis biztonságot: megadás nélkül a régi viselkedés marad', () => {
    // ⚠️ Egy hang-lánc nélküli futás (CLI-parancs, teszt) NE várjon olyan megszólalásra,
    // amiről nem is tudhat.
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(120) })],
      isBusyProcessing: false,
      queuedItemCount: 0,
      now: NOW,
      config: CONFIG,
    });

    expect(decision.shouldFlush).toBeTrue();
  });

  it('🔴 KÖZBEN ÉRKEZŐ megszólalás: a kapu a KÖVETKEZŐ körben is fog', () => {
    // A kiküldési kör 15 mp-enként fut. Ha az owner a kör KÖZÖTT szólal meg, a következő
    // döntésnek MÁR tudnia kell róla — ez a „közben új megszólalás érkezik" eset.
    const pending = [message({ receivedAt: ageSeconds(120) })];
    const first = decideFlush({
      pending, isBusyProcessing: false, queuedItemCount: 0,
      isSpeechInProgress: false, now: NOW, config: CONFIG,
    });

    expect(first.shouldFlush).toBeTrue();

    const second = decideFlush({
      pending, isBusyProcessing: false, queuedItemCount: 0,
      isSpeechInProgress: true, now: NOW, config: CONFIG,
    });

    expect(second.shouldFlush).toBeFalse();
    expect(second.reason).toContain('ÉPP BESZÉL');
  });
});

describe('DEFAULT_BATCH_CONFIG — ⭐ a MÉRT összegyűjtési ablak', () => {

  it('30 másodperc, mérésből — ⛔ nem tippelve', () => {
    // MÉRVE 2026-09-11 06:10, 260 értékelhető szünet két megszólalás-kezdet között:
    //   median 8 s · p75 = 23 s · p90 = 97 s
    //   20 s alatt: 71%  ·  30 s alatt: 78%  ·  45 s alatt: 83%
    // A 20 s a p75 ALATT volt ⇒ az esetek ~29%-ában idő előtt ment ki a köteg.
    expect(DEFAULT_BATCH_CONFIG.collectWindowMs).toBe(30_000);
  });

  it('a biztonsági szelep VÁLTOZATLAN — a kapuk nem ragadhatnak be', () => {
    expect(DEFAULT_BATCH_CONFIG.maxHoldMs).toBe(15 * 60_000);
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

  it('states the reply rule CONDITIONALLY and names silence as a valid answer', () => {
    const prompt = composeBatchPrompt([message()]);

    // Owner, 2026-09-11: a feltétel nélküli válaszkényszer ébren tartotta — a lábléc
    // mostantól a FÓKUSZ-hoz köti a választ, és kimondja, hogy a hallgatás is válasz.
    expect(prompt).toContain('FÓKUSZ');
    expect(prompt).toContain('HALLGATÁS a helyes válasz');
    expect(prompt).not.toContain('Válasz-kötelezettség');
  });

  it('tells the agent to stay silent while the owner is asleep — not even an emoji', () => {
    const prompt = composeBatchPrompt([message()]);

    expect(prompt).toContain('alszik');
    expect(prompt).toContain('semmit ne küldj');
    expect(prompt).toContain('még emojit sem');
  });

  it('asks for a single emoji as the ack for the agent own tasks', () => {
    const prompt = composeBatchPrompt([message()]);

    // Owner, 2026-09-11: „azt szerettem, amikor egy darab emojit küldtél" — a saját
    // feladataimról nyugta jár, nem néma csend, és nem is szöveg.
    expect(prompt).toContain('EGY DARAB EMOJIT');
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

  it('🔴 a tele sorba SEM kuld, barmilyen regi is a koteg', () => {
    const decision = decideFlush({
      pending: [message({ receivedAt: ageSeconds(9999) })],
      isBusyProcessing: true,
      queuedItemCount: 5,
      isQueueLocked: true,
      now: NOW,
      config: CONFIG,
    });

    // ⭐ Az owner szabalya: „ha running vagy van message a queue-ban akkor csak gyujtunk".
    // A sorba kuldes nem varakoztatas — merve: a sorba tett prompt SOSEM erkezett meg.
    // A koteg latszik a `doctor`-ban es a konzol-pulzusban, tehat a varakozas NEM nema.
    expect(decision.shouldFlush).toBe(false);
  });
});

describe('DiscordBridge.flush — 🔴 a SORBA ÁLLÍTÁS NEM KÉZBESÍTÉS', () => {

  /** Csak annyi tár, amennyit a `flush` érint — és megjegyzi, véglegesítettünk-e. */
  function makeStore(pending: DiscordInboundMessage[]): { store: unknown; committed: number[] } {
    const committed: number[] = [];

    return {
      store: {
        readPending: async (): Promise<DiscordInboundMessage[]> => pending,
        commitDelivered: async (count: number): Promise<void> => { committed.push(count); },
      },
      committed: committed,
    };
  }

  /** Hamis CCAP: szabad session, és a `sendPrompt` a kért módon válaszol. */
  function makeCcap(queued: boolean): unknown {
    return {
      inspectRuntime: async (): Promise<unknown> => ({
        isBusyProcessing: false,
        queuedItemCount: 0,
        isQueueLocked: false,
      }),
      sendPrompt: async (): Promise<{ queued: boolean; raw: unknown }> => ({ queued: queued, raw: {} }),
      // ⭐ 2026-09-08 ÓTA: a cél a RÖGZÍTÉSBŐL jön (`__agent/config/owner-message-target.json`),
      // NEM a `CLAUDE_CODE_SESSION_ID` környezeti változóból. A listát a rögzítés ellenőrzésére
      // kérdezzük le — a `claudeSessionId`-nak is egyeznie kell, nem csak a `sessionId`-nak.
      listCcSessions: async (): Promise<unknown[]> => ([{ sessionId: 's-1', claudeSessionId: 'cc-teszt' }]),
    };
  }

  const old: DiscordInboundMessage[] = [message({ receivedAt: ageSeconds(60) })];

  /**
   * Ideiglenes repó-gyökér a KÉZBESÍTÉSI CÉL rögzítésével.
   *
   * 🔴 MÉRT INCIDENS 2026-09-08: az owner üzenetei a DEV sessionbe mentek, mert a cél a
   * `CLAUDE_CODE_SESSION_ID`-ból jött, a figyelő pedig az LDP alatt fut — annak a sessionnek
   * a környezetével, amelyik az LDP-t indította. ⇒ A teszt mostantól **fájlt** ír, nem
   * környezeti változót: pontosan azt a köteléket ellenőrzi, ami éles is érvényes.
   */
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await mkdtemp(join(tmpdir(), 'bridge-target-'));
    await mkdir(join(repoRoot, '__agent', 'config'), { recursive: true });
    await writeFile(
      join(repoRoot, '__agent', 'config', 'owner-message-target.json'),
      JSON.stringify({ sessionId: 's-1', claudeSessionId: 'cc-teszt', label: 'Teszt' }),
      'utf-8',
    );
  });

  it('🔴 `queued: true` esetén IS véglegesít — az újraküldés DUPLIKÁCIÓT okozna', async () => {
    const { store, committed } = makeStore(old);
    const bridge = new DiscordBridge(store as never, makeCcap(true) as never, CONFIG, repoRoot);

    const result = await bridge.flush({ now: NOW, force: true });

    // Owner (2026-09-07): „Az nem jó ha újraküldöd amit már sorba állítottunk.... Az megint
    // duplikáció...". MÉRVE: a sorba tett prompt MEGÉRKEZIK, csak késve — tehát az
    // újraküldés mindkét példányt kézbesítené.
    expect(result?.queued).toBe(true);
    expect(result?.deliveredCount).toBe(1);
    expect(committed).toEqual([1]);
    // De NEM hallgatjuk el: a sorba kerülés maga a rendellenesség.
    expect(result?.detail ?? '').toContain('NEM VÁRT');
  });

  it('igazolt átvételnél viszont véglegesít', async () => {
    const { store, committed } = makeStore(old);
    const bridge = new DiscordBridge(store as never, makeCcap(false) as never, CONFIG, repoRoot);

    const result = await bridge.flush({ now: NOW, force: true });

    expect(result?.queued).toBe(false);
    expect(result?.deliveredCount).toBe(1);
    expect(committed).toEqual([1]);
  });
});

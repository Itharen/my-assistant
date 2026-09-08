// A KONZOL-SOR — egyetlen sor, ami ránézésre elárulja, mi történik a rendszerben.
//
// > **Owner-kérés (2026-09-07):** *„Majd szeretném, hogy egy sor logot is tegyünk a My
// > Assistant projektbe, hogy amikor ránézek a konzolra, az is árulkodjon nekem arról, hogy
// > mi minden történik a rendszerben."*
//
// 🔴 MIÉRT ÍGY: a szerver konzolja eddig **egyetlen sort** írt (indulás), utána néma volt.
// A némaság és a „minden rendben" kívülről MEGKÜLÖNBÖZTETHETETLEN — pontosan ez a hibafajta
// tartotta a jelenlét-figyelőt **112 napig** halottan úgy, hogy senki nem vette észre.
//
// ⭐ A SOR A VALÓSÁGOT MÉRI, NEM A KONFIGURÁCIÓT. Nem azt kérdezzük, „be van-e állítva",
// hanem azt, hogy „ÉL-E MOST" — az életjel- és minta-fájlok FRISSESSÉGÉBŐL. Mérve
// 2026-09-07: egy állapot-mező NEVE nem a jelentése (`status.json` → `serverRunning: false`
// futó szerver mellett), ezért a pulzus soha nem hisz egy jelzőbitnek.
//
// ⛔ NEM duplikál üzleti logikát: a válasz-kötelezettség megítélése a `ma comm doctor`
// dolga (SSOT). Itt csak NYERS TÉNYEK vannak — hány üzenet vár, mikor ment ki az utolsó.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';

import { reportSwallowedFailure } from '../_collections/swallowed-failure.util.js';
import { resolveListenerHeartbeatFile } from './discord-listener.service.js';
import { resolvePresencePaths } from './presence-monitor.service.js';

/** Milyen sűrűn írjuk ki a sort. Elég ritka, hogy ne szemetelje tele a konzolt. */
export const PULSE_INTERVAL_MS: number = 60_000;

/** Az első sor ennyivel az indulás után jön — addig felállnak a figyelők. */
const FIRST_PULSE_DELAY_MS: number = 20_000;

/**
 * Ennél régebbi Discord-életjel esetén a figyelőt halottnak tekintjük.
 *
 * ⚠️ UGYANAZT A KÉRDÉST teszi fel, mint a `ma comm doctor`, ezért az értéke a CLI
 * `discord.heartbeat.ts` → `HEARTBEAT_STALE_MS` párja (5 perc). Ha az változik, ez is
 * változzon — különben a konzol és a diagnosztika **mást állítana ugyanarról**.
 * ⛔ NEM keverendő a `discord-listener.service.ts` `HEARTBEAT_FRESH_MS`-ével (3 perc): az
 * MÁS kérdésre válaszol — „induljon-e egy MÁSODIK figyelő?".
 */
export const DISCORD_STALE_MS: number = 5 * 60_000;

/**
 * Ennyi kor fölött az életjel már **GYANÚS**, de még nem halott.
 *
 * 🔴 MÉRT OK (2026-09-08 11:30): a figyelő **percenként** ver. Egy 4 perces életjel tehát
 * már **három kimaradt ütés** — a pulzus mégis sima `✅`-t írt rá, egészen az 5 perces
 * halál-határig. ⚠️ Ma ez **13 percig** takart el egy valódi kiesést: a figyelő folyamata
 * élt, de nem vert, és a konzolon végig `✅` állt.
 *
 * ⭐ Két kimaradt ütés a határ: egy elveszett ütés még lehet gép-terhelés, kettő már minta.
 */
export const DISCORD_SLOW_MS: number = 2 * 60_000;

/** Ennél régebbi jelenlét-minta esetén nincs érvényes mérésünk. */
export const PRESENCE_STALE_MS: number = 3 * 60_000;

/** Ennyi napra megyünk vissza a jelenlét-mintákért (éjfél-átfordulás miatt). */
const PRESENCE_LOOKBACK_DAYS: number = 3;

/** Egy alrendszer állapota — `absent` = soha nem is futott. */
export type PulseState = 'alive' | 'stale' | 'absent';

export interface SystemPulseSnapshot {
  /** A mérés pillanata. */
  now: Date;
  /** Mióta fut a szerver-folyamat. */
  uptimeMs: number;
  discord: {
    state: PulseState;
    ageMs?: number;
    botTag?: string;
    processedCount?: number;
  };
  presence: {
    state: PulseState;
    ageMs?: number;
    /** A logger `idleState` mezője — `active` / `idle`. */
    idleState?: string;
  };
  /** Hány beérkezett üzenet vár még átadásra. */
  pendingInbound: number;
  /**
   * 🎙️ Hány hangüzenet vár ÚJRAPRÓBÁLÁSRA.
   *
   * 🔴 MIÉRT KERÜLT A PULZUSBA (owner, 2026-09-07: *„nem ártana valami kezelés, figyelés"*):
   * a várakozó hang **tartalma még nem jutott el hozzám**. Ez pontosan az az állapot, ami
   * kívülről ÚGY NÉZ KI, mintha minden rendben volna — és 2026-09-07-én így veszett el
   * két üzenet. Ha a soron áll valami, azt LÁTNI kell.
   */
  sttRetryPending: number;
  /**
   * 🔊 A HANG-CSATORNA tölcsére — `undefined`, ha a hang-lánc nem fut.
   *
   * 🔴 MIÉRT KERÜLT A PULZUSBA (T-52, owner 2026-09-07 21:47): *„a konzolban nem látom azokat
   * a visszajelzéseket, amiket anno a CCAP-ban"*. **Megmérve 2026-09-08 04:10:** az LDP
   * konzol-kimenetében a beszéd-feldolgozásról **NULLA** sor volt — sem az átemelt felvevő
   * naplói, sem a saját eseményeink nem jutottak oda. Az owner beszélt, és a konzol néma volt.
   *
   * ⚠️ A `undefined` és a „csupa nulla" NEM ugyanaz: az előbbi azt jelenti, hogy a hang-lánc
   * **nem fut**; az utóbbi azt, hogy fut, de **még nem hangzott el semmi**.
   */
  voice?: PulseVoiceFunnel;
  /** Mikor ment ki az utolsó üzenet. `undefined` = még soha. */
  lastOutboundAgeMs?: number;
}

/** A hang-tölcsér számai a pulzushoz. */
export interface PulseVoiceFunnel {
  /**
   * 🔴 Bent van-e a bot a hang-csatornában. `undefined` = régi formátumú életjel.
   *
   * ⚠️ A `undefined` NEM hamis: olyankor **nem állítunk semmit**.
   */
  joined?: boolean;
  channelName?: string;
  speechStarts: number;
  filesOpened: number;
  filesDelivered: number;
  filesDropped: number;
  lostAudioSeconds: number;
}

/**
 * A konzol-sor szövege.
 *
 * Tiszta függvény — fájlrendszer és idő nélkül tesztelhető.
 */
export function composePulseLine(pulse: SystemPulseSnapshot): string {
  const parts: string[] = [
    `🫀 ${formatClock(pulse.now)} · fut ${formatDuration(pulse.uptimeMs)}`,
    `💬 Discord ${describeDiscord(pulse.discord)}`,
    `🏠 jelenlét ${describePresence(pulse.presence)}`,
    `📬 ${describeInbox(pulse.pendingInbound)}`,
    // Csak akkor foglal helyet, ha VAN mit mondania — a nulla nem hir.
    ...(pulse.sttRetryPending > 0 ? [`🎙️ ${pulse.sttRetryPending} hang újrapróbálásra vár`] : []),
    ...describeVoice(pulse.voice),
    `↩ kimenő ${pulse.lastOutboundAgeMs === undefined ? '— még soha' : formatAge(pulse.lastOutboundAgeMs)}`,
  ];

  return parts.join(' │ ');
}

function describeDiscord(discord: SystemPulseSnapshot['discord']): string {
  if (discord.state === 'absent') return '🔴 nincs életjel';
  if (discord.state === 'stale') return `🔴 HALOTT (${formatAge(discord.ageMs ?? 0)})`;

  const tag: string = discord.botTag ? ` ${discord.botTag}` : '';
  const seen: string = discord.processedCount === undefined
    ? ''
    : `, ${discord.processedCount} üz`;

  // ⚠️ A KÖZTES FOKOZAT. A `stale` (5 perc) az a pont, ahol kimondjuk, hogy HALOTT — de a
  // figyelő percenként ver, tehát már 2 percnél baj van. A sima `✅` addig azt sugallja,
  // hogy minden rendben, holott épp NEM ver.
  const icon: string = (discord.ageMs ?? 0) > DISCORD_SLOW_MS ? '⚠️ AKADOZIK' : '✅';

  return `${icon}${tag} (${formatAge(discord.ageMs ?? 0)}${seen})`;
}

function describePresence(presence: SystemPulseSnapshot['presence']): string {
  if (presence.state === 'absent') return '🔴 nincs mérés';
  if (presence.state === 'stale') return `🔴 ELAVULT (${formatAge(presence.ageMs ?? 0)})`;

  // A magyar szó többet mond a konzolon, mint a nyers mezőérték.
  const mood: string = presence.idleState === 'active' ? 'aktív' : 'tétlen';

  return `✅ ${mood} (${formatAge(presence.ageMs ?? 0)})`;
}

function describeInbox(pending: number): string {
  return pending > 0 ? `⚠️ ${pending} üzenet vár` : 'köteg üres';
}

/** `HH:MM` — a konzolon ennél pontosabb nem kell. */
function formatClock(now: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');

  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Kor emberi alakban: `42mp` · `7p` · `2ó 15p`. */
/**
 * 🔊 A hang-szegmens — vagy semmi.
 *
 * ⭐ HÁROM ÁLLAPOT, és mindhárom mást jelent:
 *
 * | Helyzet | Mit ír | Miért |
 * |---|---|---|
 * | a hang-lánc **nem fut** | *(semmi)* | nincs miről jelenteni; a hiány nem hír |
 * | fut, de **nem hangzott el semmi** | *(semmi)* | ⭐ „a nulla nem hír" — ugyanaz az elv, mint a köteg-szegmensnél |
 * | **volt beszéd** | `🔊 hang 9 → 3 feldolgozva` | ez az, amit az owner hiányolt a konzolról |
 *
 * ⚠️ A megszólalás és a felvétel **különbsége NEM veszteség** *(beleolvadás)* — ezért a
 * szegmens csak a **valódi** eldobást jelöli ⚠️-vel, másodperccel együtt.
 */
export function describeVoice(voice: PulseVoiceFunnel | undefined): string[] {
  // ⛔ Nincs `voice` mező = a hang-csatorna NINCS BEÁLLÍTVA ⇒ jogos csend, nem hír.
  if (!voice) return [];

  // 🔴 BE VAN ÁLLÍTVA, DE NINCS BENT — ez HIBA, és eddig TELJESEN néma volt.
  // Az owner beszélne a csatornába, ahol a bot nincs bent: nincs hangjelzés, nincs tükör,
  // nincs magyarázat. ⚠️ A `joined === undefined` (régi életjel) NEM számít hibának.
  if (voice.joined === false) {
    return [`🔊 hang 🔴 NINCS BENT${voice.channelName ? ` a(z) „${voice.channelName}" csatornában` : ''}`];
  }

  if (voice.speechStarts === 0) return [];

  const lost: string = voice.filesDropped > 0
    ? ` · ⚠️ ${voice.filesDropped} elveszett (${voice.lostAudioSeconds} mp)`
    : '';

  return [`🔊 hang ${voice.speechStarts} → ${voice.filesDelivered} feldolgozva${lost}`];
}

export function formatAge(ms: number): string {
  return formatDuration(ms);
}

function formatDuration(ms: number): string {
  const totalSec: number = Math.max(0, Math.round(ms / 1000));

  if (totalSec < 60) return `${totalSec}mp`;

  const totalMin: number = Math.round(totalSec / 60);

  if (totalMin < 60) return `${totalMin}p`;

  const hours: number = Math.floor(totalMin / 60);

  return `${hours}ó ${totalMin % 60}p`;
}

/**
 * A pillanatkép összegyűjtése a VALÓS fájlokból.
 *
 * 🔴 SOHA nem dob kivételt: egy naplózó sor nem döntheti meg a szervert. Ami nem olvasható,
 * az `absent` — vagyis az ÓVATOS irányba téved. A hamis „minden rendben" lenne a veszélyes.
 */
export function collectPulse(now: Date = new Date()): SystemPulseSnapshot {
  // ⚠️ EGYSZER olvassuk ki: két hívás két fájl-olvasás lenne, és ha közben írja a figyelő,
  // a két eredmény akár el is térhetne egymástól.
  const voice: PulseVoiceFunnel | undefined = readVoiceFunnel();

  return {
    now,
    uptimeMs: Math.round(process.uptime() * 1000),
    discord: readDiscordHeartbeat(now),
    presence: readNewestPresenceSample(now),
    pendingInbound: countPendingInbound(),
    sttRetryPending: countSttRetryPending(),
    ...(voice ? { voice: voice } : {}),
    lastOutboundAgeMs: readLastOutboundAge(now),
  };
}

/**
 * 🔊 A hang-tölcsér kiolvasása a figyelő ÉLETJELÉBŐL.
 *
 * ⭐ Ugyanaz a fájl, amit a Discord-állapothoz is olvasunk — nincs új csatorna, nincs új
 * hibalehetőség. ⚠️ Hiányzó vagy hibás mező ⇒ `undefined`: a „nem tudom" **nem** nulla.
 */
function readVoiceFunnel(): PulseVoiceFunnel | undefined {
  try {
    const file: string = resolveListenerHeartbeatFile();

    if (!existsSync(file)) return undefined;

    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as { voice?: unknown };
    const voice: unknown = parsed.voice;

    if (typeof voice !== 'object' || voice === null) return undefined;

    const record = voice as Record<string, unknown>;
    const numberOr = (key: string): number =>
      typeof record[key] === 'number' ? record[key] as number : 0;

    return {
      // ⚠️ Csak akkor vesszük át, ha TÉNYLEG boolean — a régi életjelben nincs benne, és a
      // hiányzó mezőből NEM következtetünk „nincs bent"-re.
      ...(typeof record['joined'] === 'boolean' ? { joined: record['joined'] } : {}),
      ...(typeof record['channelName'] === 'string' ? { channelName: record['channelName'] } : {}),
      speechStarts: numberOr('speechStarts'),
      filesOpened: numberOr('filesOpened'),
      filesDelivered: numberOr('filesDelivered'),
      filesDropped: numberOr('filesDropped'),
      lostAudioSeconds: numberOr('lostAudioSeconds'),
    };
  } catch (err) {
    // ⚠️ Sérült életjel → nem tudjuk. Az óvatos válasz a hallgatás, nem a hamis nulla —
    // de a hallgatás csak a KIMENETRE vonatkozik, a naplóra nem.
    reportSwallowedFailure('system-pulse.voice-stats', err);

    return undefined;
  }
}

function readDiscordHeartbeat(now: Date): SystemPulseSnapshot['discord'] {
  try {
    const file: string = resolveListenerHeartbeatFile();

    if (!existsSync(file)) return { state: 'absent' };

    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as {
      updatedAt?: string;
      botTag?: string;
      processedCount?: number;
    };
    const updatedMs: number = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : Number.NaN;

    if (Number.isNaN(updatedMs)) return { state: 'absent' };

    const ageMs: number = now.getTime() - updatedMs;

    return {
      state: ageMs > DISCORD_STALE_MS ? 'stale' : 'alive',
      ageMs,
      ...(parsed.botTag ? { botTag: parsed.botTag } : {}),
      ...(typeof parsed.processedCount === 'number' ? { processedCount: parsed.processedCount } : {}),
    };
  } catch (err) {
    // ⚠️ Az `absent` itt „nem tudom"-ot jelent, nem „nincs figyelő". A különbség a naplóban látszik.
    reportSwallowedFailure('system-pulse.discord-heartbeat', err);

    return { state: 'absent' };
  }
}

/**
 * A legfrissebb jelenlét-minta.
 *
 * ⚠️ Több napra visszamegyünk: éjfél után a mai fájl még ÜRES, és csak az előző napiban van
 * mérés — ebbe a csapdába egyszer már beleestünk (`CONTINUATION.md`, 1. review-kör).
 */
function readNewestPresenceSample(now: Date): SystemPulseSnapshot['presence'] {
  try {
    const dataDir: string = resolvePresencePaths().dataDir;

    if (!existsSync(dataDir)) return { state: 'absent' };

    const files: string[] = readdirSync(dataDir)
      .filter((name: string): boolean => name.endsWith('.jsonl'))
      .sort()
      .slice(-PRESENCE_LOOKBACK_DAYS)
      .reverse();

    for (const name of files) {
      const sample = readLastSample(path.join(dataDir, name));

      if (!sample) continue;

      const ageMs: number = now.getTime() - sample.timestampMs;

      return {
        state: ageMs > PRESENCE_STALE_MS ? 'stale' : 'alive',
        ageMs,
        ...(sample.idleState ? { idleState: sample.idleState } : {}),
      };
    }

    return { state: 'absent' };
  } catch (err) {
    reportSwallowedFailure('system-pulse.presence-sample', err);

    return { state: 'absent' };
  }
}

/** Egy napi minta-fájl UTOLSÓ értelmes sora. A csonka/sérült sorokat átugorjuk. */
function readLastSample(file: string): { timestampMs: number; idleState?: string } | null {
  const lines: string[] = readFileSync(file, 'utf-8').split('\n');

  for (let i: number = lines.length - 1; i >= 0; i--) {
    // A BOM-ot is le kell vágni, különben a `JSON.parse` elhasal az első soron.
    // ⚠️ Szándékosan a \uFEFF ESCAPE, nem a nyers karakter: az utóbbi láthatatlan a
    // forrásban, és egy kódolás-váltó mentés némán kiejtheti.
    const line: string = lines[i].replace(/^\uFEFF/, '').trim();

    if (!line) continue;

    try {
      const parsed = JSON.parse(line) as { timestamp?: string; idleState?: string };
      const ms: number = parsed.timestamp ? new Date(parsed.timestamp).getTime() : Number.NaN;

      if (Number.isNaN(ms)) continue;

      return { timestampMs: ms, ...(parsed.idleState ? { idleState: parsed.idleState } : {}) };
    } catch (err) {
      // Egy csonka utolsó sor NORMÁLIS (épp írják) — ezért lépünk tovább. ⚠️ De ha MINDEN sor
      // értelmezhetetlen, az már hiba, és ennélkül „nincs jelenlét-adat"-ként jelent meg.
      reportSwallowedFailure(`system-pulse.presence-line:${file}`, err);
      continue;
    }
  }

  return null;
}

/** A Discord-tár gyökere. A CLI ugyanide ír (`discord.batch-store.ts`). */
function resolveDiscordStoreDir(): string {
  return path.join(homedir(), '.config', 'my-assistant', 'discord');
}

/**
 * Hány hang vár újrapróbálásra.
 *
 * ⚠️ A `.json` leírókat számoljuk, nem a `.bin`-eket: a leíró a tétel létezésének a jele,
 * a hang önmagában lehet árva maradék is.
 */
function countSttRetryPending(): number {
  try {
    const dir: string = path.join(path.dirname(resolveDiscordStoreDir()), 'stt-retry');

    if (!existsSync(dir)) return 0;

    return readdirSync(dir).filter((name: string): boolean => name.endsWith('.json')).length;
  } catch (err) {
    // A hamis NULLA a legveszélyesebb válasz: azt jelentené, hogy „nincs várakozó hang".
    reportSwallowedFailure('system-pulse.stt-retry-count', err);

    return 0;
  }
}

function countPendingInbound(): number {
  try {
    const file: string = path.join(resolveDiscordStoreDir(), 'pending-inbound.jsonl');

    if (!existsSync(file)) return 0;

    return readFileSync(file, 'utf-8')
      .split('\n')
      .filter((line: string): boolean => line.trim().length > 0)
      .length;
  } catch (err) {
    reportSwallowedFailure('system-pulse.pending-inbound-count', err);

    return 0;
  }
}

/**
 * Mikor ment ki az utolsó üzenet.
 *
 * A fájl MÓDOSÍTÁSI IDEJÉT nézzük, nem a tartalmát: a napló append-only, tehát az mtime
 * pontosan az utolsó bejegyzés ideje — és így egy nagy fájlt sem kell beolvasni.
 */
function readLastOutboundAge(now: Date): number | undefined {
  try {
    const file: string = path.join(resolveDiscordStoreDir(), 'outbound-log.jsonl');

    if (!existsSync(file)) return undefined;

    return now.getTime() - statSync(file).mtimeMs;
  } catch (err) {
    reportSwallowedFailure('system-pulse.last-outbound-age', err);

    return undefined;
  }
}

/**
 * A pulzus-szolgáltatás.
 *
 * `SystemPulse_Service.getInstance()` triggereli a singleton-példányt; az `app.server.ts`
 * `getRootServices()`-ben példányosítja boot-időben — ugyanaz a minta, mint a
 * `WeatherPoll_Service`-nél.
 */
export class SystemPulse_Service {

  private static instance: SystemPulse_Service | null = null;

  /** Singleton accessor. */
  static getInstance(): SystemPulse_Service {
    if (!SystemPulse_Service.instance) {
      SystemPulse_Service.instance = new SystemPulse_Service();
    }

    return SystemPulse_Service.instance;
  }

  private tickHandle: NodeJS.Timeout | null = null;

  private constructor() {
    setTimeout((): void => this.tick(), FIRST_PULSE_DELAY_MS).unref();

    this.tickHandle = setInterval((): void => this.tick(), PULSE_INTERVAL_MS);
    // Az `unref` miatt a pulzus SOSEM tartja életben a folyamatot — ha minden más leállt,
    // a szerver leáll, nem pedig egy naplózó időzítőn lóg.
    this.tickHandle.unref();
  }

  /** Egy sor kiírása. Hibát nem enged ki — a konzol-sor nem döntheti meg a szervert. */
  private tick(): void {
    try {
      // Szándékosan `console.log`: EZ egy konzolra szánt sor. Naplókeret-előtagok
      // (időbélyeg, szint, forrás) pont azt a ránézésre-olvashatóságot rontanák el,
      // amiért a sor létezik.
      console.log(composePulseLine(collectPulse()));
    } catch (err) {
      // Kihagyjuk ezt a kört — a következő jön. De NÉMÁN nem: egy elhasalt pulzus-sor
      // pontosan úgy néz ki, mint egy leállt szerver, és pont ezt kellene megkülönböztetnie.
      reportSwallowedFailure('system-pulse.pulse-tick', err);
    }
  }
}

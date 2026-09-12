// A Discord-figyelő ÉLETJELE.
//
// 🔴 MIÉRT LÉTEZIK: mérve 2026-09-06 — a jelenlét-figyelő **112 napig** halott volt anélkül,
// hogy bárki észrevette volna, mert semmi nem ellenőrizte, hogy fut-e. A Discord-csatorna
// ugyanebbe a csapdába sétálna: a folyamat elhalhat, a kapcsolat leszakadhat, és kívülről
// ez **pontosan úgy néz ki, mintha nem írtál volna** — a legcsendesebb hibafajta.
//
// Ezért a figyelő rendszeresen frissít egy életjel-fájlt, a diagnosztika pedig a fájl
// FRISSESSÉGÉT nézi. Nem azt kérdezzük, „be van-e állítva", hanem azt: „ÉL-E MOST".

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';

/** Ennyi idő után tekintjük halottnak a figyelőt. */
export const HEARTBEAT_STALE_MS: number = 5 * 60_000;

/** Ilyen sűrűn frissítjük az életjelet futás közben. */
export const HEARTBEAT_INTERVAL_MS: number = 60_000;

export interface DiscordHeartbeat {
  /** Mikor frissült utoljára (ISO). */
  updatedAt: string;
  /** A bot megjelenített neve — segít azonosítani, MELYIK bot fut. */
  botTag: string;
  /** Hány üzenetet dolgozott fel az indulás óta. */
  processedCount: number;
  /**
   * A figyelő folyamat-azonosítója.
   *
   * A felügyelő (`server/src/_services/discord-listener.service.ts`) ebből tudja
   * eldönteni, hogy egy friss életjel MÖGÖTT áll-e még élő folyamat — enélkül egy
   * épp most elhalt figyelő életjele percekig „foglaltnak" mutatná a csatornát.
   */
  pid?: number;
  /**
   * 🔊 A HANG-CSATORNA pillanatnyi tölcsére — hogy a konzolon LÁTSZÓDJON.
   *
   * 🔴 MÉRT HIÁNY (T-52, owner 2026-09-07 21:47): *„a konzolban nem látom azokat a
   * visszajelzéseket, amiket anno a CCAP-ban"*. **Megmérve 2026-09-08 04:10:** az LDP
   * konzol-kimenetében a beszéd-feldolgozásról **NULLA** sor van — sem az átemelt felvevő
   * `DyFM_Log`-jai, sem a saját `MA-VOICE-*` eseményeink nem jutnak oda.
   *
   * ⭐ MIÉRT ITT, ÉS NEM ÚJ MECHANIZMUS: a konzolon **már van** egy „mi történik most" sor
   * *(a pulzus)*, és ez az életjel **már** utazik a figyelőtől a szerverig. Egy új csatorna
   * csak új hibalehetőség lenne — a meglévő úton viszont ingyen jön a frissesség-ellenőrzés is.
   *
   * ⚠️ Opcionális: ha a hang-lánc nem áll fel, a mező **hiányzik** — nem nulla. A kettő nem
   * ugyanaz, és a pulzus is másképp mutatja.
   */
  voice?: DiscordHeartbeatVoice;
  /**
   * ⏱️ A PILLANAT — amit KIZÁRÓLAG a figyelő folyamat tud *(20. tétel, 3)*.
   *
   * > **Owner, 2026-09-12 05:33:** *„**Tudjad magadat diagnosztizálni**, hogy ilyenkor mi a fene
   * > történik például most?"*
   *
   * 🔴 MIÉRT KELL IDE: a `ma doctor now` egy **külön folyamat**. A köteg-kaput és a futó
   * felismerést ⛔ **nem látja** — azok memóriában élnek a figyelőben. Kívülről ugyanúgy
   * néznek ki, mint a semmi. ⇒ A figyelő **kiírja** őket, a diagnosztika pedig **olvassa**.
   *
   * ⭐ MIÉRT EZEN A CSATORNÁN: az életjel **már** utazik a figyelőtől a diagnosztikáig, és a
   * frissesség-ellenőrzés ingyen jön vele. Egy új mechanizmus csak új hibalehetőség lenne.
   *
   * ⚠️ Opcionális: ha **hiányzik**, az azt jelenti, hogy a figyelő még a **régi kódot** futtatja
   * — ⛔ nem azt, hogy „minden nyugodt". A diagnosztika ezt ki is mondja.
   */
  moment?: DiscordHeartbeatMoment;
}

/** ⏱️ A figyelő PILLANATNYI belső állapota — a `ma doctor now` bemenete. */
export interface DiscordHeartbeatMoment {
  /** 🔴 Fut-e ÉPP felismerés *(hangüzenet-út vagy újrapróbálás)*. */
  isRecognizing: boolean;
  /** ⏳ Zárva van-e a köteg-kapu *(ez tartja vissza a csomagot)*. */
  isGateClosed: boolean;
  /** 🎤 Zaj-özön miatt engedtük-e el a puszta észleléseket *(19. tétel)*. */
  isNoiseFlooded: boolean;
  /** Hány lezáratlan megszólalás-jel van. */
  openDetections: number;
  /** Hány felvétel van ÉPP feldolgozás alatt. */
  processingRecordings: number;
  /** Hány zaj-tétel gyűlt a mérési ablakban. */
  noiseInWindow: number;
  /** ⭐ A kapu állapotának ember-olvasható indoklása. */
  gateReason: string;
}

/** A hang-tölcsér számai, ahogy az élő szonda látja. */
export interface DiscordHeartbeatVoice {
  /**
   * 🔴 BENT VAN-E a bot a hang-csatornában.
   *
   * ⚠️ MÉRT HIÁNY (2026-09-08 06:24): ha a belépés **elbukik**, arról **SEMMI** nem szól —
   * sem a `comm doctor` *(mérve: 0 hang-sor)*, sem a konzol-pulzus *(nincs szonda ⇒ nincs
   * `voice` mező ⇒ hallgatás)*. ⇒ Az owner beszélne a csatornába, **ahol a bot nincs bent**:
   * nincs hangjelzés, nincs tükör, nincs magyarázat. Pontosan az a hibaosztály, amit ez a
   * projekt folyamatosan üldöz — *„a nem-indulás CSENDES"*.
   *
   * ⚠️ HÁROM ÁLLAPOT, és a `undefined` NEM hamis: a régi formátumú életjelekben a mező még
   * nincs benne. Olyankor **nem állítunk semmit** — a „nem tudom" nem „nincs bent".
   */
  joined?: boolean;
  /** Melyik csatornába lépett be — a diagnosztika így nevesíti. */
  channelName?: string;
  /** Hány megszólalást érzékelt a Discord. */
  speechStarts: number;
  /** Hány felvétel nyílt (a többi beleolvadt egy futóba — ⛔ NEM veszteség). */
  filesOpened: number;
  /** Hány jutott el a feldolgozásig. */
  filesDelivered: number;
  /** Hány tűnt el némán. */
  filesDropped: number;
  /** Mennyi hang veszett el összesen. */
  lostAudioSeconds: number;
}

/**
 * A `voice` blokk óvatos beolvasása.
 *
 * ⚠️ A `joined` CSAK akkor kerül át, ha tényleg `boolean` — a régi életjelekben nincs benne,
 * és a hiányból ⛔ **nem** következtetünk „nincs bent"-re. A „nem tudom" nem „nem".
 */
function parseVoice(raw: unknown): DiscordHeartbeatVoice | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;

  const bool = (key: string): boolean | undefined => {
    const value: unknown = field(raw, key);

    return typeof value === 'boolean' ? value : undefined;
  };
  const joined: boolean | undefined = bool('joined');
  const channelName: string = text(raw, 'channelName');

  return {
    ...(joined === undefined ? {} : { joined: joined }),
    ...(channelName ? { channelName: channelName } : {}),
    speechStarts: count(raw, 'speechStarts'),
    filesOpened: count(raw, 'filesOpened'),
    filesDelivered: count(raw, 'filesDelivered'),
    filesDropped: count(raw, 'filesDropped'),
    lostAudioSeconds: count(raw, 'lostAudioSeconds'),
  };
}

/**
 * ⏱️ A `moment` blokk óvatos beolvasása.
 *
 * ⚠️ A HIÁNY JELENTÉSE: *„a figyelő régi kódot futtat"*, ⛔ nem *„nincs semmi folyamatban"*.
 * Ezért `undefined`-et adunk vissza, és a hívó ezt **kimondja** — nem nullákat mutat.
 */
function parseMoment(raw: unknown): DiscordHeartbeatMoment | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;

  return {
    isRecognizing: field(raw, 'isRecognizing') === true,
    isGateClosed: field(raw, 'isGateClosed') === true,
    isNoiseFlooded: field(raw, 'isNoiseFlooded') === true,
    openDetections: count(raw, 'openDetections'),
    processingRecordings: count(raw, 'processingRecordings'),
    noiseInWindow: count(raw, 'noiseInWindow'),
    gateReason: text(raw, 'gateReason'),
  };
}

/**
 * Egy mező kiolvasása egy MÉG NEM ELLENŐRZÖTT objektumból.
 *
 * ⭐ MIÉRT EGY HELYEN: a JSON-ból jövő adat alakja **nem garantált**, tehát minden olvasásnál
 * ellenőrizni kell. Ha ez minden hívási helyen kézzel történne, a fájl tele lenne
 * `record[key]`-jel és `as` átcímkézéssel — most **egy** pont van, ami ezt a kockázatot viseli.
 */
function field(raw: unknown, key: string): unknown {
  if (typeof raw !== 'object' || raw === null) return undefined;

  const record: Record<string, unknown> = { ...raw };

  return record[key];
}

/** Egy szám-mező — a hiány/hibás típus **0**, mert ezek számlálók. */
function count(raw: unknown, key: string): number {
  const value: unknown = field(raw, key);

  return typeof value === 'number' ? value : 0;
}

/** Egy szöveg-mező — a hiány üres sztring, ⛔ nem `undefined` *(a hívók így egyszerűbbek)*. */
function text(raw: unknown, key: string): string {
  const value: unknown = field(raw, key);

  return typeof value === 'string' ? value : '';
}

export function resolveHeartbeatPath(userHome: string = homedir()): string {
  return join(userHome, '.config', 'my-assistant', 'discord', 'listener-heartbeat.json');
}

/** Életjel kiírása. Hibát NEM dob — az életjel sosem akaszthatja meg a figyelőt. */
export async function writeHeartbeat(
  heartbeat: DiscordHeartbeat,
  path: string = resolveHeartbeatPath(),
): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(heartbeat, null, 2), 'utf-8');
  } catch (err) {
    // A figyelot nem akaszthatja meg: ha az eletjelet nem tudjuk kiirni, a diagnosztika
    // „halott"-nak fogja latni — ami OVATOS iranyba teved. ⛔ De epp ezert kell nyom:
    // kulonben egy ELO figyelo tunne halottnak, es senki nem tudna, hogy csak az IRAS bukott.
    SwallowedFailure_Util.report('discord.heartbeat.write', err);
  }
}

export interface HeartbeatStatus {
  /** `alive` · `stale` (van fájl, de régi) · `absent` (soha nem futott). */
  state: 'alive' | 'stale' | 'absent';
  ageMs?: number;
  heartbeat?: DiscordHeartbeat;
}

/** Az életjel beolvasása és értékelése. */
export async function readHeartbeat(
  path: string = resolveHeartbeatPath(),
  now: Date = new Date(),
): Promise<HeartbeatStatus> {
  if (!existsSync(path)) return { state: 'absent' };

  try {
    const parsed: unknown = JSON.parse(await readFile(path, 'utf-8'));

    if (typeof parsed !== 'object' || parsed === null) return { state: 'absent' };

    const updatedAt: unknown = field(parsed, 'updatedAt');

    if (typeof updatedAt !== 'string') return { state: 'absent' };

    const timestamp: number = new Date(updatedAt).getTime();

    if (Number.isNaN(timestamp)) return { state: 'absent' };

    const ageMs: number = now.getTime() - timestamp;
    // ⚠️ A `voice` mezőt ÁT KELL VINNI. Enélkül a diagnosztika mindig „nincs beállítva"-t
    // látna — vagyis pont azt a néma félrejelentést csinálná, ami ellen készült.
    // ⭐ EGYSZER olvassuk ki: két hívás felesleges, és eltérhetne egymástól.
    const voice: DiscordHeartbeatVoice | undefined = parseVoice(field(parsed, 'voice'));
    // ⏱️ UGYANÍGY a PILLANAT: a `ma doctor now` ebből tudja, hogy fut-e felismerés és
    // zárva van-e a köteg-kapu. ⚠️ A hiánya „régi figyelő"-t jelent, ⛔ nem nyugalmat.
    const moment: DiscordHeartbeatMoment | undefined = parseMoment(field(parsed, 'moment'));
    const pid: unknown = field(parsed, 'pid');
    const heartbeat: DiscordHeartbeat = {
      updatedAt,
      botTag: text(parsed, 'botTag'),
      processedCount: count(parsed, 'processedCount'),
      ...(typeof pid === 'number' ? { pid: pid } : {}),
      ...(voice ? { voice: voice } : {}),
      ...(moment ? { moment: moment } : {}),
    };

    return { state: ageMs <= HEARTBEAT_STALE_MS ? 'alive' : 'stale', ageMs, heartbeat };
  } catch (err) {
    // Serult fajl → nem tudjuk, el-e. Az ovatos valasz: nem tekintjuk elonek. ⚠️ Az `absent`
    // itt „nem tudom"-ot jelent, nem „nincs figyelo" — a kettot csak a naplo kulonbozteti meg.
    SwallowedFailure_Util.report('discord.heartbeat.read', err);

    return { state: 'absent' };
  }
}

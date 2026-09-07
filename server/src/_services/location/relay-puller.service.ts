// 📥 RELAY-LEHÚZÓ — a my-assistant KIFELÉ nyúl a relayért, sosem fordítva.
//
// > **Owner-direktíva (2026-09-07):** *„A my assistant server nem lesz elérhető kívülről...
// > Vagy tudunk safe relay-t beállítani, építeni? (Van egy test szerverünk amire esetleg
// > lehet tenni egy relay-t, de semmiképp nem a my assistant servert. És mindenképp secure
// > kell legyen.)"*
//
// 🔴 EZ A MODUL A DIREKTÍVA MEGVALÓSÍTÁSA. A telefon a relaybe ír; a my-assistant szerver
// **INNEN HÚZ LE** — kifelé indított kapcsolattal, a RAVEN gépről. Ezért a my-assistant
// szerver soha nem kap bejövő kapcsolatot az internetről, és nem is kell nyitni felé portot.
//
// ⭐ MIÉRT PULL ÉS NEM PUSH — ez a lényegi biztonsági különbség:
//   - **push** esetén a relaynek el kellene ÉRNIE a my-assistant szervert ⇒ nyitott port,
//     tűzfal-lyuk, és a relay kompromittálása azonnal a belső hálózatot fenyegetné;
//   - **pull** esetén a relay **nem tud** kapcsolatot kezdeményezni felénk. Ha feltörik,
//     legrosszabb esetben hamis helyzet-adatot kínál — de **nem jut be**.
//
// ⛔ A LEHÚZÁS NEM TÖRÖL. A relay csak a NYUGTÁZÁSRA (`/ack`) felejt. Ha a válasz elveszne
// az úton, az adat ott marad, és a következő kör újra hozza. Fordított sorrendben (törlés
// lehúzáskor) egy megszakadt válasz **véglegesen** elnyelné a helyzetet.

import { DyFM_Log } from '@futdevpro/fsm-dynamo';

import { appendLocation } from './location-store.service.js';
import { decideHomeState, parseOwnTracksLocation, toStoredLocation } from './location.retention.js';
import type { HomeState, OwnTracksLocation, StoredLocation } from './location.models.js';

/**
 * Milyen sűrűn nézünk rá a relayre.
 *
 * > **Owner (2026-09-07):** *„nemtom mennyi időbként... Legyen állítható és majd
 * > finomhangoljuk."*
 *
 * ⇒ Az alapérték szándékosan ritka: a helyzet-adat nem valós idejű riasztás, és a sűrű
 * lekérdezés csak forgalmat és akkumulátort éget. A `MA_RELAY_PULL_INTERVAL_MS` felülírja.
 */
export const DEFAULT_PULL_INTERVAL_MS: number = 5 * 60_000;

/**
 * A fejléc, amiben a titok utazik.
 *
 * 🔴 MÉRT HIBA (2026-09-07): elsőre `Authorization: Bearer`-t küldtem — az általános szokás
 * miatt, nem mérés alapján. A relay viszont `x-ma-relay-token`-t olvas
 * (`relay-auth.service.ts` → `readPresentedToken`), tehát a lehúzó **soha nem hitelesítette
 * volna magát**: minden kör 401-gyel bukott volna.
 *
 * ⚠️ A típusellenőrzés és az egységtesztek EZT NEM FOGTÁK MEG — a két oldal külön fordul, és
 * külön is helyes volt. Csak az élő, végponttól végpontig próba buktatta le. A szerződést a
 * MÁSIK OLDALON kell megnézni, nem a szokásból következtetni.
 */
export const RELAY_TOKEN_HEADER: string = 'x-ma-relay-token';

/** Ennyi ideig várunk egy lehúzásra. Egy néma, örökké lógó kérés rosszabb, mint egy hiba. */
export const PULL_TIMEOUT_MS: number = 20_000;

export interface RelayPullOutcome {
  ok: boolean;
  /** Hány helyzetet tároltunk el ténylegesen. */
  storedCount: number;
  /** Hány tételt nyugtáztunk a relaynél. */
  ackedCount: number;
  /** Ember-olvasható állapot — hiba esetén az OK, nem csak az, hogy „nem sikerült". */
  detail: string;
  /** MIT KELL TENNI, ha nem sikerült. */
  remedy?: string;
}

/** A relay `/pull` válaszának alakja — minden mező óvatosan kezelve. */
interface RelayPullResponse {
  ok?: boolean;
  items?: { id?: unknown; payload?: unknown }[];
}

/** A relay címe és a lehúzó token. `null`, ha nincs beállítva. */
export function readRelaySettings(): { baseUrl: string; token: string } | null {
  const baseUrl: string = (process.env['MA_RELAY_URL'] ?? '').trim().replace(/\/+$/, '');
  const token: string = (process.env['MA_RELAY_PULL_TOKEN'] ?? '').trim();

  if (!baseUrl || !token) return null;

  return { baseUrl: baseUrl, token: token };
}

/** A beállított lekérdezési köz — hibás értéknél az alapértelmezés. */
export function readPullIntervalMs(): number {
  const raw: number = Number(process.env['MA_RELAY_PULL_INTERVAL_MS'] ?? '');

  // ⚠️ A 0 és a negatív szám NEM „azonnali" — az egy elgépelés, ami végtelen ciklust csinálna.
  if (!Number.isFinite(raw) || raw < 1_000) return DEFAULT_PULL_INTERVAL_MS;

  return raw;
}

/**
 * EGY lehúzási kör: lekérés → tárolás → nyugtázás.
 *
 * 🔴 CSAK AZT NYUGTÁZZUK, AMIT TÉNYLEGESEN ELTÁROLTUNK. Ha a tárolás bukik egy tételen, az
 * a tétel **nem** kerül a nyugtázandók közé, tehát a relay megőrzi és a következő kör újra
 * hozza. A „mindent nyugtázunk, aztán tárolunk" sorrend egy lemez-hibánál némán nyelné el
 * a helyzetet — és a hiány pontosan úgy néz ki, mint az, hogy nem is mozdultunk.
 *
 * Hibát SOHA nem dob: egy háttér-lehúzó nem döntheti meg a szervert.
 */
export async function runPullCycle(): Promise<RelayPullOutcome> {
  const settings = readRelaySettings();

  if (!settings) {
    return {
      ok: false,
      storedCount: 0,
      ackedCount: 0,
      detail: 'A relay nincs beállítva (MA_RELAY_URL és/vagy MA_RELAY_PULL_TOKEN hiányzik).',
      remedy: 'Állítsd be a `.env`-ben: MA_RELAY_URL=https://test.my-assistant-relay.futdevpro.hu '
        + 'és MA_RELAY_PULL_TOKEN=<a relay pull-tokenje>.',
    };
  }

  let response: Response;

  try {
    response = await fetchWithTimeout(`${settings.baseUrl}/api/relay/pull`, {
      method: 'GET',
      headers: { [RELAY_TOKEN_HEADER]: settings.token },
    });
  } catch (err: unknown) {
    const reason: string = err instanceof Error ? err.message : String(err);

    return {
      ok: false,
      storedCount: 0,
      ackedCount: 0,
      detail: `A relay nem érhető el — ${reason}`,
      remedy: 'Ellenőrizd, hogy a relay fut-e a test szerveren, és hogy a gateway átengedi-e '
        + '(test.my-assistant-relay.futdevpro.hu).',
    };
  }

  if (response.status === 401) {
    return {
      ok: false,
      storedCount: 0,
      ackedCount: 0,
      detail: 'A relay ELUTASÍTOTT (401) — a lehúzó token nem jó, vagy a relayen nincs beállítva.',
      // ⚠️ A relay SZÁNDÉKOSAN nem különbözteti meg a „nincs beállítva" és a „rossz token"
      // esetet — kívülről ez a különbség információ lenne egy támadónak. Ezért mindkettőt
      // fel kell sorolni: a hívó nem tudhatja, melyik.
      remedy: 'Vesd össze a MA_RELAY_PULL_TOKEN-t a relay ugyanilyen nevű környezeti '
        + 'változójával — mindkét oldalon ugyanannak kell lennie.',
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      storedCount: 0,
      ackedCount: 0,
      detail: `A relay ${response.status}-os választ adott.`,
      remedy: 'Nézd meg a relay naplóját a test szerveren.',
    };
  }

  const body = await safeJson(response);
  const items: { id?: unknown; payload?: unknown }[] = Array.isArray(body?.items) ? body.items : [];

  if (items.length === 0) {
    return { ok: true, storedCount: 0, ackedCount: 0, detail: 'Nincs új helyzet a relayen.' };
  }

  // ⚠️ HÁROM KÜLÖN SZÁMLÁLÓ, szándékosan. Egyetlen „skipped" összemosná azt, ami a
  // nyugtázandók közé KERÜL (értelmezhetetlen tartalom), azzal, ami NEM (azonosító
  // nélküli tétel) — és a végén hibás darabszámot jelentenénk az ownernek.
  const acknowledgeIds: string[] = [];
  let storedCount: number = 0;
  let unparsable: number = 0;
  let withoutId: number = 0;

  for (const item of items) {
    const id: string | null = typeof item.id === 'string' && item.id ? item.id : null;

    // ⛔ Azonosító nélkül nem tudunk nyugtázni. Ilyet a relay nem gyárt; ha mégis felbukkan,
    // JELEZZÜK — némán átugorva minden körben újra jönne, és sosem derülne ki, miért.
    if (!id) {
      withoutId += 1;
      continue;
    }

    const location: OwnTracksLocation | null = parseOwnTracksLocation(item.payload);

    // ⚠️ Az értelmezhetetlen tételt NYUGTÁZZUK, de nem tároljuk. Enélkül egy hibás bejegyzés
    // ÖRÖKRE a relayen ragadna, és minden kör újra elhozná — a sor sosem ürülne ki.
    if (!location) {
      unparsable += 1;
      acknowledgeIds.push(id);
      continue;
    }

    const state: HomeState = decideHomeState(location);
    const stored: StoredLocation = toStoredLocation(location, state);

    // ⛔ CSAK A SIKERES TÁROLÁST nyugtázzuk — a bukott tétel a relayen marad.
    if (await appendLocation(stored)) {
      storedCount += 1;
      acknowledgeIds.push(id);
    }
  }

  const ackedCount: number = await acknowledge(settings, acknowledgeIds);
  const notes: string[] = [];

  if (unparsable > 0) notes.push(`${unparsable} értelmezhetetlen`);
  if (withoutId > 0) notes.push(`${withoutId} azonosító nélküli`);

  const note: string = notes.length > 0 ? ` (${notes.join(', ')})` : '';

  if (withoutId > 0) {
    DyFM_Log.error(`[relay-puller] MA-RELAY-ITEM-WITHOUT-ID: ${withoutId} tétel azonosító nélkül `
      + 'érkezett — ezeket nem tudjuk nyugtázni, tehát a relayen maradnak.');
  }

  return {
    ok: true,
    storedCount: storedCount,
    ackedCount: ackedCount,
    detail: `${storedCount} helyzet eltárolva, ${ackedCount} nyugtázva${note}.`,
  };
}

/**
 * Nyugtázás — a relay CSAK ettől felejt.
 *
 * Hibát nem dob: ha a nyugtázás elmarad, az adat a relayen marad és jövő körben újra jön.
 * Ez **kellemetlen, de biztonságos** irány — az ellenkezője adatvesztés volna.
 */
async function acknowledge(settings: { baseUrl: string; token: string }, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  try {
    const response = await fetchWithTimeout(`${settings.baseUrl}/api/relay/ack`, {
      method: 'POST',
      headers: {
        [RELAY_TOKEN_HEADER]: settings.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: ids }),
    });

    if (!response.ok) {
      DyFM_Log.error(`[relay-puller] MA-RELAY-ACK-FAILED: a nyugtázás ${response.status}-t adott. `
        + 'A helyzetek a relayen maradnak, a következő kör újra hozza őket.');

      return 0;
    }

    const body = await safeJson(response);

    return typeof body?.removed === 'number' ? body.removed : ids.length;
  } catch (err: unknown) {
    DyFM_Log.error('[relay-puller] MA-RELAY-ACK-FAILED: a nyugtázás elbukott — '
      + `${err instanceof Error ? err.message : String(err)}. A helyzetek a relayen maradnak.`);

    return 0;
  }
}

/** `fetch` időkorláttal — egy örökké lógó kérés a lehúzót némán megállítaná. */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout((): void => controller.abort(), PULL_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** JSON-értelmezés, ami nem dob — a hibás válasz nem döntheti meg a kört. */
async function safeJson(response: Response): Promise<(RelayPullResponse & { removed?: number }) | null> {
  try {
    return await response.json() as RelayPullResponse & { removed?: number };
  } catch {
    return null;
  }
}

/**
 * A lehúzó ütemezett indítása.
 *
 * ⭐ A szerver alatt él (`ldp-default-runtime`): ami külön indítandó, az előbb-utóbb nem
 * indul el — és a nem-indulás CSENDES.
 *
 * ⚠️ Beállítás nélkül **nem indulunk el**, de ezt KIÍRJUK. A néma nem-indulás pontosan az a
 * hibafajta, ami a jelenlét-figyelőt 112 napig halottan tartotta úgy, hogy senki nem vette észre.
 */
export class RelayPuller_Service {

  private static instance: RelayPuller_Service | null = null;

  /** Singleton accessor — a `getRootServices()` ezt hívja. */
  static getInstance(): RelayPuller_Service {
    if (!RelayPuller_Service.instance) {
      RelayPuller_Service.instance = new RelayPuller_Service();
    }

    return RelayPuller_Service.instance;
  }

  private readonly timer: NodeJS.Timeout | null;

  private constructor() {
    this.timer = startRelayPuller();
  }

  /** Fut-e a lehúzó. `false`, ha nincs beállítva a relay. */
  isRunning(): boolean {
    return this.timer !== null;
  }
}

export function startRelayPuller(): NodeJS.Timeout | null {
  if (!readRelaySettings()) {
    DyFM_Log.testInfo('[relay-puller] NEM indul: a relay nincs beállítva '
      + '(MA_RELAY_URL + MA_RELAY_PULL_TOKEN). A telefon helyzete így nem jut el ide.');

    return null;
  }

  const intervalMs: number = readPullIntervalMs();

  DyFM_Log.testInfo(`[relay-puller] Indul — ${Math.round(intervalMs / 1000)} mp-enként húz le.`);

  const timer: NodeJS.Timeout = setInterval((): void => {
    void runPullCycle().then((outcome: RelayPullOutcome): void => {
      // ⛔ A „nincs új helyzet" NEM hír — azt nem naplózzuk, különben elfojtaná a valódi jelzéseket.
      if (!outcome.ok) {
        DyFM_Log.error(`[relay-puller] MA-RELAY-PULL-FAILED: ${outcome.detail}`
          + (outcome.remedy ? ` → ${outcome.remedy}` : ''));

        return;
      }

      if (outcome.storedCount > 0) DyFM_Log.testInfo(`[relay-puller] ${outcome.detail}`);
    });
  }, intervalMs);

  // Az időzítő ne tartsa életben a folyamatot önmagában.
  timer.unref();

  return timer;
}

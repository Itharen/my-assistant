// A RELAY HITELESÍTÉSE — két KÜLÖN titok, szándékosan.
//
// > **Owner (2026-09-07):** *„És mindenképp secure kell legyen."*
//
// 🔴 MIÉRT KETTŐ, ÉS NEM EGY:
//
// | Titok | Ki használja | Mit enged |
// |---|---|---|
// | `MA_RELAY_INGEST_TOKEN` | a **telefon** | CSAK beírni a pufferbe |
// | `MA_RELAY_PULL_TOKEN` | a **my-assistant** | lehúzni és nyugtázni |
//
// A telefon a **legkitettebb** elem: elveszhet, ellophatják, és a token benne van az app
// beállításaiban. Ha egyetlen közös titok lenne, egy ellopott telefonnal **le lehetne kérni a
// teljes pufferelt előzményt** — vagyis pont azt, amit védeni akarunk.
//
// ⇒ Az ingest-token **csak írni tud**. Egy ellopott telefonnal legfeljebb hamis helyzetet
// lehet BEküldeni; a már bent lévő adatot **nem lehet kiolvasni**.
//
// ⚠️ A titkok a környezetből jönnek, ⛔ SOHA nem a repóból (`fdp-keystore-secrets`).

import { Request } from 'express';

/** A titok fajtája. */
export type RelayTokenKind = 'ingest' | 'pull';

/** Melyik környezeti változó tartozik hozzá. */
export function envNameFor(kind: RelayTokenKind): string {
  return kind === 'ingest' ? 'MA_RELAY_INGEST_TOKEN' : 'MA_RELAY_PULL_TOKEN';
}

export interface AuthOutcome {
  ok: boolean;
  /** Naplóhoz — ⛔ SOHA nem tartalmaz titkot, csak az OKOT. */
  reason: string;
}

/**
 * A kérésben bemutatott titok.
 *
 * Fejlécből VAGY query-ből — az OwnTracks mindkettőt tudja, és a query néha az egyetlen út,
 * amit egy mobil-app kényelmesen enged.
 */
export function readPresentedToken(req: Request): string {
  const header: unknown = req.headers['x-ma-relay-token'];
  const query: unknown = req.query['token'];

  if (typeof header === 'string' && header.trim()) return header.trim();
  if (typeof query === 'string' && query.trim()) return query.trim();

  return '';
}

/**
 * Hitelesítés.
 *
 * 🔴 HA A TITOK NINCS BEÁLLÍTVA, MINDENT ELUTASÍTUNK. Szándékosan: egy védtelen, nyitott
 * relay rosszabb, mint egy nem működő — az elsőt nem vennénk észre, a másodikat azonnal.
 *
 * ⚠️ A `reason` a NAPLÓNAK szól. A hívó a válaszban **egységes** `401`-et ad, hogy kívülről
 * ne lehessen megkülönböztetni a „nincs beállítva" és a „rossz token" esetet — az különbség
 * információ lenne egy támadónak.
 */
export function authorize(presented: string, expected: string): AuthOutcome {
  if (!expected) {
    return { ok: false, reason: 'A titok nincs beallitva a szerveren — mindent elutasitunk.' };
  }

  if (!presented) return { ok: false, reason: 'A keres nem mutatott be titkot.' };

  if (!constantTimeEquals(presented, expected)) {
    return { ok: false, reason: 'A bemutatott titok nem egyezik.' };
  }

  return { ok: true, reason: 'Rendben.' };
}

/**
 * Állandó idejű összehasonlítás.
 *
 * ⚠️ A sima `===` **korábban kilép** az első eltérő karakternél, és a futásidő-különbségből
 * a titok karakterenként kitalálható. Egy hálózaton át ez nehéz, de nem lehetetlen — és a
 * védekezés itt gyakorlatilag ingyen van.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  // A hossz-különbséget nem lehet elrejteni, de a hossz önmagában nem árulja el a titkot.
  if (a.length !== b.length) return false;

  let difference: number = 0;

  for (let index: number = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return difference === 0;
}

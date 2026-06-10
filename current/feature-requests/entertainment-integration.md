# FR: Szórakoztatási szekciók integráció — Jellyfin + Steam

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag — később
> `fo feature-requests.create`-tel feltölthető.

---

## 2026-05-12 (22:23) — initial deklaráció

> Nem lenne rossz, ha valahogy a szórakoztatási szekcióimat is tudnánk
> integrálni, mint a Jellyfin és a Steam.

### Scope

- **Főként szerver-feature** (adat ingest, normalizálás, library + activity tracking)
- **Kliensen látszódjon** — szórakoztatási dashboard / library view / "most ezt
  néztem / játszottam" timeline
- Két különálló forrás, közös integrations modul alatt — később bővíthető
  (Spotify már bekötve, Plex / GOG / Epic / YouTube később lehet)

---

## Két fő szál

### A) Jellyfin integráció

| # | Megoldás | Pro | Kontra |
|---|---|---|---|
| 1 | **Jellyfin REST API** (server URL + API key) | 🆓 hivatalos, jól dokumentált, FOSS, library + playback events | a user-nek futnia kell egy Jellyfin szerver |
| 2 | Jellyfin webhook plugin | push-modell (kész event-ek) | extra plugin telepítés |

**Mit nyerhetünk:**
- Library listázás (filmek + sorozatok + epizódok + metadata)
- Watch history → automatikus `media-tracking` feed
  (FR `media-tracking.md` Phase 1 implementációja)
- "Most néztem" timeline event-ek
- In-progress series → új-episode notification target

### B) Steam integráció

| # | Megoldás | Pro | Kontra |
|---|---|---|---|
| 1 | **Steam Web API** (`GetOwnedGames`, `GetRecentlyPlayedGames`, `GetPlayerSummaries`, achievements) | 🆓 ingyenes (free API key), stabil | profile public kell, vagy authed |
| 2 | Steam Community XML feed | nincs key | korlátozott adat |
| 3 | SteamGridDB / IsThereAnyDeal | release / wishlist / ár | csak metadata, nem activity |

**Mit nyerhetünk:**
- Owned library (címek + playtime + achievements)
- Recently played → "ezzel játszottam most" timeline
- Wishlist (releases, sale alerts → opcionális, később)
- Playtime tracking → heti összegzés ("X órát játszottál ezen a héten")

---

## Architektúra (szerver-oldal)

```
server/src/_routes/jellyfin/
   jellyfin.controller.ts        # GET /jellyfin/library, /jellyfin/recent
   jellyfin.data-service.ts      # DB layer (library + history cache)
   jellyfin-ingest.service.ts    # scheduled poll vagy webhook receiver
   jellyfin-client.service.ts    # REST API wrapper

server/src/_routes/steam/
   steam.controller.ts           # GET /steam/library, /steam/recent, /steam/playtime
   steam.data-service.ts
   steam-ingest.service.ts       # scheduled poll (pl. naponta library, óránként recent)
   steam-client.service.ts       # Steam Web API wrapper
```

- Mindkettő közös **`media-tracking`** és **`activity-tracking`** modulhoz feed-et ad
- **Cache** MongoDB — Jellyfin library lassan változik (napi), Steam recent gyorsan (óránként)
- **Action-log** lifecycle + per-action (ingest start/end, errors)
- Mintát követjük a meglévő `_routes/spotify/` és `_routes/google/` route-okról
  (már bekötött pattern a repo-ban)

### Adat-folyam

```
Jellyfin server  →  jellyfin-ingest  →  media-item (status=watched/in-progress)
                                     →  watch-event (timeline)
                                     →  new-episode diff (media-tracking FR Phase 2 trigger)

Steam Web API    →  steam-ingest     →  game-item (owned + playtime)
                                     →  play-event (timeline)
                                     →  weekly-playtime aggregate
```

---

## Architektúra (kliens-oldal)

```
client/src/app/_modules/integrations/entertainment/
   entertainment.module.ts
   _components/
     entertainment-dashboard.component.ts   # összesített overview
     jellyfin-library.component.ts          # filmek/sorozatok grid
     jellyfin-recent.component.ts           # most nézett
     steam-library.component.ts             # játékok grid (playtime sort)
     steam-recent.component.ts              # most játszott + heti playtime
```

- **Dashboard widget:** "ma este mit néznél / játszanál" — recent + in-progress
- **Library view:** szűrhető lista (típus / státusz / műfaj)
- **Timeline:** közös `activity-tracking` timeline-ban szórakoztatási event-ek

---

## Adat-séma (vázlat)

```ts
JellyfinItem {
  ts: ISO
  jellyfinId: string
  type: 'movie' | 'tv-series' | 'episode'
  title: string
  year?: number
  seriesId?: string
  season?: number
  episode?: number
  durationSec?: number
  watchStatus: 'unwatched' | 'in-progress' | 'watched'
  lastPlayedAt?: ISO
  positionSec?: number       // in-progress resume point
}

SteamGame {
  ts: ISO
  steamAppId: number
  title: string
  playtimeMinTotal: number
  playtimeMinLast2Weeks: number
  lastPlayedAt?: ISO
  achievements?: { unlocked: number, total: number }
}

PlayEvent {
  ts: ISO
  source: 'jellyfin' | 'steam' | 'spotify' | ...
  refId: string              // jellyfinId / steamAppId / ...
  title: string
  kind: 'start' | 'progress' | 'stop' | 'finish'
  durationSec?: number       // session length
}
```

---

## Phase-elés

| Phase | Mit |
|---|---|
| 0 | ez a FR (most) |
| 1 | **Jellyfin** — server URL + API key beállítás, library ingest, `/jellyfin/library` endpoint, dashboard widget (recent + in-progress) |
| 2 | **Steam** — Web API key beállítás, owned + recently-played ingest, `/steam/library` + `/steam/recent` endpoint, dashboard widget |
| 3 | **Közös timeline** — `activity-tracking` modulba feed (mit néztem / játszottam kronológiai sorrendben) |
| 4 | **media-tracking FR Phase 2 hook** — Jellyfin library → új-episode diff (TVMaze / TMDb cross-check) |
| 5 | **Insight-ok** — heti playtime / watch-time aggregátum, "x órával többet játszottál mint múlt héten" típusú emlékeztető |
| 6 | Opcionális: wishlist / release-alert (Steam new-release, Jellyfin új-évad) |

---

## Open kérdések

| Q# | Kérdés | Fontosság |
|---|---|---|
| Q-ent-1 | Hol fut a Jellyfin? (lokál hálózat? remote? URL + auth elérési mód?) | high |
| Q-ent-2 | Steam profile public, vagy authed flow (OAuth) szükséges? | high |
| Q-ent-3 | Webhook plugin (push) vagy polling (pull) Jellyfin felé? | medium |
| Q-ent-4 | Ingest gyakoriság: Jellyfin recent → óránként? Steam recent → óránként? | medium |
| Q-ent-5 | Library full-resync gyakoriság: napi / heti? | low |
| Q-ent-6 | A meglévő `media-tracking.md` FR-rel összevonjuk-e a kliens-oldali UI-t? (javaslat: igen — Jellyfin a `media-tracking` library forrása) | medium |
| Q-ent-7 | Steam achievements — kiemeljük dashboard-ra, vagy csak detail-view? | low |
| Q-ent-8 | Egyéb szórakoztatási forrás később (Plex / GOG / Epic / YouTube history)? Prep-eljük a sémát? | low |

---

## Error-handling — Dynamo pattern kötelező 🔴

Magas prio (`current/principles/error-handling.md`):
- **Jellyfin API hibák** (auth fail / server down / library mismatch): `DyFM_Error` errorCode `MA-JELLYFIN-<CODE>` + `additionalContent: { endpoint, statusCode, jellyfinErrorBody }`
- **Steam Web API hibák** (rate limit / private profile / key invalid): `DyFM_Error` errorCode `MA-STEAM-<CODE>` + `additionalContent: { endpoint, steamErrorCode, retryAfter }`
- **Ingest scheduler** hibái: try/catch a service-szinten → `Errors_DataService.handleInternalError()` (silent failure tilos)
- **Kliens-oldal**: library + recent komponensek HTTP error → `A_Error_ControlService.showError(err, 'jellyfin'/'steam')` (no `[object Object]`)
- Lásd `current/feature-requests/runtime-error-api.md` (🟢 backlog 3b)

## Kapcsolódó

- `current/principles/error-handling.md` — debug-level error kötelező
- `current/feature-requests/media-tracking.md` — Jellyfin a "lokál mappa-scan" alternatívája, jobb metadata-val
- `current/feature-requests/activity-tracking.md` — közös timeline cél
- `server/src/_routes/spotify/` — már bekötött minta integráció (követjük a pattern-t)
- `server/src/_routes/google/` — már bekötött minta integráció
- `client/src/app/_modules/integrations/` — meglévő integrations modul-mappa (most jött létre)
- `current/principles/no-paid-solutions.md` — mindkét API ingyenes
- `current/principles/build-it-ourselves.md` — saját client wrapper, saját ingest

---

## Migráció organizer-be (later)

| Lokál | Organizer |
|---|---|
| Cím | `title: "Szórakoztatási integráció — Jellyfin + Steam"` |
| Initial deklaráció | `description` (markdown) |
| Phase-elés | `task-group` sub-task-okkal (Jellyfin / Steam phase-enként) |
| Open kérdések | `acceptanceCriteria[]` |
| Kapcsolódó | `relatedRefs[]` |

---

## Status

🅿️ Felírva. Phase 0 kész. 8 open Q a konkretizáláshoz. Az `_routes/spotify/` és
`_routes/google/` route-ok jó referenciaminta — kövessük azokat.

# FR: Filmek + sorozatok tracking + új-release figyelő

> **Forrás: a user szövege (2026-05-10).**

## A user szövege

> Nem lenne rossz, hogyha kezelnéd azt is, hogy milyen filmjeim és
> sorozataim vannak, és hogy esetleg valamilyen automatizmust kialakíthatnánk,
> hogy utána nézzünk, hogy Mondjuk, jött-e ki valamelyik sorozatból új rész,
> új évad, vagy jött-e ki valami olyan, ami engem érdekelhet?

## Cél (kettős)

1. **Library tracking** — a user filmjei + sorozatai listája
   - Mit nézett már (watched)
   - Mit néz éppen (in-progress)
   - Mit szeretne nézni (watchlist)
2. **Új-release figyelő** — automatizmus
   - Új rész egy aktív sorozatból
   - Új évad
   - Új release ami érdekelhet (műfaj-szűrt / szereplő-szűrt / hasonló-tartalom-alapján)

## Megoldás-jelöltek

| # | Megoldás | Pro | Kontra |
|---|---|---|---|
| 1 | TMDb (The Movie DB) API | ingyenes, REST, gazdag adat | manuális library-fenntartás |
| 2 | Trakt.tv | sync platform, "watched" tracking, scrobbler | regisztráció kell, free tier korlátos |
| 3 | TVDB / TVMaze | sorozat-spec, ingyen | kevesebb film |
| 4 | Saját scraper (IMDb / Mafab.hu / port.hu) | minden testreszabható | scraping-anti-bot |

## Adat-séma (vázlat)

```
media-item {
  ts: ISO
  type: 'movie' | 'tv-series' | 'documentary' | ...
  title: string
  year: number
  source: 'tmdb' | 'trakt' | 'manual'
  externalId?: string  // tmdbId / traktId
  status: 'watchlist' | 'in-progress' | 'watched' | 'dropped'
  rating?: 1-10
  lastWatchedAt?: ISO
  // for series:
  seasonsSeen?: number[]
  episodesSeen?: number[]  // global episode index
}

media-release-event {
  ts: ISO
  itemId: ref
  kind: 'new-episode' | 'new-season' | 'new-related-release'
  metadata: { episode?, season?, releaseDate?, ... }
  notified: boolean
}
```

## Kapcsolódik

- `current/architecture.md` L2 Monitoring (passzív megfigyelés) + L4 Server (DB)
- `current/feature-requests/ai-tech-news-scraping.md` — hasonló mintázat (rendszeres scraping)
- `current/feature-requests/news-aggregator-integration.md` — a meglévő scraper rendszerre is bekötés

## Phase-elés

| Phase | Mit |
|---|---|
| 0 | ez a FR (most) |
| 1 | TMDb / Trakt API választás + library import (manuális vagy CSV) |
| 2 | Új-release scheduled scrape (B-mode scripted task) |
| 3 | Notify integráció (cast / dashboard / email) |
| 4 | "Érdekelhet" recommendation (műfaj / szereplő / hasonlóság alapú) |

## Open kérdések

❓ Q-media-1: Trakt.tv account van? Vagy TMDb előnyben?
❓ Q-media-2: Library-import — manuális (kezdetben), vagy lévő forrás (Letterboxd / IMDb watchlist export)?
❓ Q-media-3: "Érdekelhet" finomítás — kezdetben széles háló, később filter?
❓ Q-media-4: Notification csatorna: cast (hangos), dashboard, email, vagy USER_INPUT [NEW] blokk?
❓ Q-media-5: Mai-este-nézés-jelölés — a tracking egyik jelzés-input lehet ("most ezt néztem"), de ne legyen kötelező manuális log

## Implementáció — két szint

### A) Lokál mappa-scan + adat-kivonat

| # | Megközelítés | Pro | Kontra |
|---|---|---|---|
| 1 | Filename parsing regex (`Show.Name.S03E07.mkv`) | no-deps | edge-case-ek |
| 2 | `parse-torrent-title` Node lib / `guessit` Python | robosztus | extra dep |
| 3 | Mappa-struktúra (`Show/Season 03/Episode 07.mkv`) | tiszta | csak ha jól szervezett |
| 4 | Plex/Jellyfin/Kodi API | kész metadata | csak ha fut |
| 5 | MediaInfo/`ffprobe` | technikai adat | nem cím-orientált |

**Watch:** `chokidar` (Node real-time) vagy periodikus `Get-ChildItem -Recurse`.

### B) Új release detekció (külső forrás)

| # | Forrás | Auth | Mire jó |
|---|---|---|---|
| 1 | **TVMaze API** | nincs | sorozat + schedule + episode-lista |
| 2 | TMDb API | API-key (ingyen) | film + sorozat |
| 3 | Trakt.tv | OAuth | személyre szabott calendar |
| 4 | TVDb | API-key | tradicionális sorozat-DB |
| 5 | Sonarr/Radarr | API-key | ha már fut |
| 6 | EZTV/Showrss RSS | nincs | torrent-mind |

### Diff-workflow

```
1. Lokál scan → { show: "X", seasons: { 1: [1..10], 2: [1..5] } }
2. Show-cím → TVMaze keresés → tvmazeId + összes-episode
3. Diff:
   TVMaze: S02E10 megjelent | Lokál: S02E05 utolsó → 5 missing
   új évad detektálva → "Season 3 elkezdődött"
4. Periodikus B-mode task (heti/napi) → új diff
5. Notify ha változott
```

### Adat-kivonat séma

```json
{
  "scanTs": "ISO",
  "shows": [
    { "title": "...", "tvmazeId": 1234, "year": 2020,
      "seasons": { "1": [1..10], "2": [1..5] } }
  ],
  "movies": [...],
  "diff": [
    { "title": "...", "kind": "missing-episodes", "episodes": ["S03E07"] },
    { "title": "...", "kind": "new-season", "season": 4 }
  ]
}
```

### Új open kérdések — implementáció

| # | Kérdés |
|---|---|
| Q-media-impl-1 | Hol vannak a mappák? (NAS / lokál / cloud?) |
| Q-media-impl-2 | Plex / Jellyfin / Kodi fut? |
| Q-media-impl-3 | Trakt account? |
| Q-media-impl-4 | Sonarr / Radarr van? |
| Q-media-impl-5 | Filenév-pattern / mappa-struktúra (minta-fájl jó lenne) |
| Q-media-impl-6 | Movies is, vagy csak sorozatok? |

## Status

🅿️ Felírva. Phase 0 kész. Implementáció-tervezet hozzáfűzve. 6 open Q a konkretizáláshoz.

# FR: Hullám-panel UI — látás + kezelés

> **Forrás: user 2026-05-16 01:35** — "jó lenne látni és kezelni a hullámokat a felületen".

## Háttér

A dashboard 2026-05-11 v1-ben már 4 panel ship-elve (tasks/waves/insights/captures)
+ `/wave` POST endpoint. **De a hullám-panel jelenleg nem használható**: vagy nem
jelenik meg (UI-DIAG fogja kideríteni), vagy csak read-only / minimális.

A user a 3×3 snapshot-okat most **csak chat-en** tudja megosztani, én pedig
manuálisan appendelem a `__agent/state/3x3-log.jsonl`-be. Ez a manual loop a
RAG hiánya melletti **második legnagyobb friction-pont**.

## Cél

A `client/src/app/_modules/dashboard/` waves-paneljén:

| Funkció | Mit |
|---|---|
| **Olvas** | Utolsó N snapshot megjelenítése idővonalon (astral/mental/anyag mind külön sávon, wave_vector iránynyíl) |
| **Mood-kontextus** | Snapshot mellett mood + note (verbatim) |
| **Új snapshot** (CRUD: C) | Form 3 dropdown/slider (`very-low / low / mid / high`) + mood szöveg + `note` opcionális + submit → POST `/wave` |
| **Trend** | Mini-chart az utolsó 7-14 napra (asztrál hullám-vonal, ezen látsszon a fluktuáció) |
| **Holdfázis overlay** (kapcsolódik az asztrál-holdciklus hipotézishez) | Háttér-csíkozás a hold fázisai szerint |

## Adat-forrás

- Server `/wave` endpoint létezik (`POST` minimum, lehet hogy `GET` is — UI-DIAG ellenőrzi)
- `__agent/state/3x3-log.jsonl` az **append-only forrás-of-truth** — szervernek innen kell beolvasnia / másolnia a DB-be
- DB schema v2: `waves` tábla már létezik (2026-05-11 db.core-service.ts ship)

## Phase-elés

| Phase | Mit | Felelős | Függ |
|---|---|---|---|
| 0 | ez a FR | chat ✅ | — |
| 1 | UI-DIAG: jelenlegi wave-panel állapot diagnózisa | Dev Agent | `AGB-2026-05-16-01` B-rész |
| 2 | Wave-panel **olvas** (utolsó N snapshot timeline) | Dev Agent | Phase 1 |
| 3 | Wave-panel **új snapshot** form (CRUD: C) — POST `/wave` | Dev Agent | Phase 2 |
| 4 | `3x3-log.jsonl` → `waves` tábla **sync** (egyszeri import script + auto-sync) | Dev Agent | Phase 3 |
| 5 | Trend chart (idővonal-grafikon, dátum-tick + zoomolható intervallum) | Dev Agent | Phase 3 |
| 5a | **X-tengely címkék**: dátum-tick-ek a chart alján (2026-05-16, vagy "ma -3d", attól függően mit mutat — automatikus dense/sparse skálázás az intervallum hossza szerint) | Dev Agent | Phase 5 |
| 5b | **Sinus/cosinus görbe-fit** a snapshot-okra (least-squares, periódus = becsült hullámhossz) — vizualizáció a discrete pontok + a folytonos hullám-rekonstrukció együttese | Dev Agent | Phase 5 |
| 5c | **Intervallum-választó** UI control (preset gombok: 24h / 3d / 7d / 30d / 60d / 90d + custom range date-picker) | Dev Agent | Phase 5 |
| 5d | **Fullscreen gomb** — a wave-panel teljes képernyősre tehető (esc kilép) | Dev Agent | Phase 5 |
| 5e | **Törések + hatások markerek** (3×3 külső hatás-események vizualizációja a chart-on) + **hover tooltip** | Dev Agent | Phase 5 |
| 6 | Holdfázis overlay (calc kliens-oldalon a 2000-01-06 reference óta) | Dev Agent | Phase 5 |

### Phase 5e részletek (törések + hatások markerek + tooltip, user 2026-05-16)

A `current/principles/three-by-three-system.md` "Külső hatások a hullámra"
szakasz definiálja:

| Esemény-típus | Megjelenés a chart-on |
|---|---|
| **Töri-erő** (instant up-down vektor — pl. "buli", "vihar-event", "nagy hír") | **függőleges szaggatott vonal** az adott ts-nél, ⚡ ikonnal a tetején |
| **Megoszló-erő** (tartós nyomás — pl. "betegség", "deadline-stress", "kollektíva-rezgés") | **háttér-csíkozás** az időtartam alatt, halvány színnel |
| **Pozitív trigger** (eső, hold-átmenet, NZT, etc.) | **függőleges pontozott vonal**, 🌧️ / 🌙 / 💊 ikonnal |
| **Hagyományos snapshot pont** | a meglévő 3-csatorna pontok |

**Adatforrás (3 lehetséges):**

1. **Action-log szűrve** — `kind:"note"` + `extra.event_class IN ("3x3-trigger", "törés", "megoszló-erő")`
   - Előny: SSoT (egy fájl)
   - Hátrány: jelenleg manuálisan jelölgetjük az `extra` mezőben
2. **Dedikált event-log** — `__agent/state/3x3-events.jsonl` (új) — `{ts, kind:"törés|megoszló|trigger", subtype:"rain|storm|NZT|...", duration_min, note}`
   - Előny: tiszta, gyorsabban filtered
   - Hátrány: új fájl, sync-need
3. **DB events tábla** — server DB v3 új tábla, FK `waves`-hez
   - Előny: server-side query, joinolható
   - Hátrány: server-feltétel (ESM migration után)

→ **Phase 5e MVP:** **Opció 1** (action-log szűrve), amíg a 2/3 nem érett.
A Cron Job + chat ide log-ol explicit `event_class` mezővel (új konvenció).

**Hover tooltip (mindenre):**

Bármely chart-elemen (pont / vonal / sáv / marker / fit-görbe) **hover** →
tooltip megjelenik:

| Elem | Tooltip tartalma |
|---|---|
| Snapshot pont | `ts (HH:mm dátum) · asztrál=mid · mentál=low · anyag=low-mid · mood: "..." · note: "..."` |
| Töri-esemény (függőleges szaggatott) | `ts · TÖRÉS · subtype: storm · note: "vihar 17:30-18:00" · forrás: action-log #ID` |
| Megoszló-esemény (háttér-csík) | `kezdet → vég · MEGOSZLÓ · subtype: deadline-stress · note: "..."` |
| Pozitív trigger (pontozott) | `ts · TRIGGER · subtype: rain · "Esik! Nézz ki." automatikus` |
| Fit-görbe pont (Phase 5b után) | `interpolált érték · fit-residual · csatorna` |
| Holdfázis overlay sáv (Phase 6 után) | `fázis: waning crescent · új hold -3,5 nap` |

UI keret: Material/Tailwind tooltip komponens. Mobil: tap-on hold helyett.

### Phase 5/5a/5c/5d részletek (user 2026-05-16 #2)

**X-tengely tick-ek (5a):**
- Intervallum < 48h → óránkénti tick (`14:00`, `15:00`)
- 48h ≤ Intervallum < 14 nap → napi tick (`05-13`, `05-14`)
- 14 nap ≤ Intervallum < 90 nap → 3-naponkénti tick (`05-13`, `05-16`, `05-19`)
- ≥ 90 nap → heti tick
- Tick-szám automatikus density-cap (max ~8-10 címke, hogy ne legyen zsúfolt)
- Mai dátum **kiemelve** (vastag / színes)

**Intervallum-választó (5c):**
- Preset gombok sora a panel tetején: **24h · 3d · 7d · 30d · 60d · 90d · custom**
- Custom: két date-picker (from/to)
- Default: **7d** (vagy az utolsó user-választás localStorage-ban)
- Az új intervallum kiválasztásakor a chart re-render + új fit (5b) re-compute

**Fullscreen gomb (5d):**
- Ikon (pl. `⛶` vagy Material `fullscreen`) a panel jobb felső sarkában
- Klikk → `<dialog>` vagy CSS `position: fixed` overlay az egész viewport-on
- Esc / X-gomb → kilép, panel visszaáll
- A többi panel ne tűnjön el a memóriából (state-megőrzés)

### Phase 5b részletek (sin/cos fit, user 2026-05-16)

A 3 hullám-csatorna mindegyikére (asztrál / mentál / anyag) **külön** illesszünk
egy sinusoid-ot a `y(t) = A · sin(2π·t/T + φ) + B` formában, ahol:

- `T` = periódus (hullámhossz). **Asztrálra hipotézis:** ~29,5 nap (holdciklus,
  lásd `current/3x3-research/findings.md`). Mentál/anyag: ismeretlen → empirikus
  least-squares fit
- `A` = amplitúdó (max - min) / 2
- `φ` = fázis-eltolás (időbeli)
- `B` = középérték (mid)

Kliens-oldalon: numerikus least-squares (pl. `mlsq` / saját) vagy szerver-oldali
endpoint `GET /wave/fit?channel=asztral&days=60` ami visszaadja `{A, T, phi, B,
residual}`. A panel render-eli: **discrete pontok (snapshot-ok) + folytonos
illesztett görbe** együtt.

**Cél:** a user vizuálisan **lássa** a hullámzás-mintát + a fázist (most fent /
csúcson / lefelé / lent), és **predikció-szerűen** is használható (következő
csúcs/mélypont várható időpontja).

## Status

🟢 **Aktív FR** — backlog `#3b-WAVE-UI` (a `#3b-UI-DIAG` után közvetlenül).

## Kapcsolódik

- `current/feature-requests/tasks-dashboard-aggregated-view.md` (#3d) — testvér panel
- `current/feature-requests/runtime-error-api.md` (#3b) — error-rögzítés a UI hibákhoz
- `current/3x3-research/findings.md` — asztrál-holdciklus hipotézis (Phase 6 overlay erre alapoz)
- `current/principles/three-by-three-system.md` — vektor-szabály (a beavatkozás csak amplitúdóra, nem irányra — a UI is ezt **tükrözze**: snapshot **rögzít**, NEM "változtat" iránnyal)

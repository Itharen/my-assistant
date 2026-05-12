# FR: Organizer napi + heti nézet UI

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-05-07 — initial deklaráció

> Amúgy az sem lenne utolsó, hogyha lenne egy felület, mint például az
> organizeren belül, ahova meg tudjuk jeleníteni, hogy lássam, hogy milyen
> feladatok vannak előttem, mondjuk a mai nap és vagy holnap, illetve hát
> kéne egy napi nézet, meg egy heti nézet, és az sem lenne utolsó, hogyha
> ezt a kettőt egyszerre meg tudnám jeleníteni, és váltogatni, hogy mondjuk
> egyszer a kis nézet, a heti, és a nagy nézet a napi, és aztán
> megcseréljük. Ez most csak egy hirtelen ötlet volt, amit majd jegyezzünk
> fel. Majd ezt mint a feature request el kell küldeni az organizernek,
> hogyha végre alkalmas lesz rá, hogy ilyet fogadjon.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Cél

Az organizer kliens-UI bővítése egy **dual-pane scheduler nézettel**, ami
egyszerre mutatja a **napi** és **heti** task-listát/naptár-eseményeket.

### Fő feature-k

| # | Feature | Leírás |
|---|---|---|
| 1 | **Napi nézet** | Ma + (opcionálisan) holnap; task-ok deadline szerint, esemény-blokkok |
| 2 | **Heti nézet** | Aktuális hét (H-V), task-ok napra szétosztva, deadline + recurring |
| 3 | **Dual pane** | Mindkettő egyszerre jelenik meg (split layout) |
| 4 | **Pane swap** | A "kis" és "nagy" nézet közötti váltás — pl. heti nézet kicsiben, napi nagyban → swap-ról az ellenkezője |

### Implementációs javaslat (assistant-tipp)

- **Komponens-szerkezet**: két panel-component (`<DayView>`, `<WeekView>`),
  egy parent `<DualScheduler>` ami swap-state-et kezel
- **Data source**: a meglévő `task.*` + `calendar.*` MCP query-k (cross-domain),
  esetleg egy új `organizer.scheduler.*` aggregator endpoint a frontendnek
- **Layout primitive**: CSS grid 2 régióval (large + small), swap = grid-area
  rotation
- **Routing**: `/scheduler` mint új route (a meglévő `/tasks` és `/calendar`
  ad hoc fúziójának alternatívája)

### Kapcsolódó FR-ek

- `calendar-integration.md` — ha a heti nézetbe a Teams + Google meetingek is
  bekerülnek, az integráció előfeltétel
- `activity-tracking.md` — ha az activity-state (most-mit-csinálsz) is megjelenik
  a napi nézetben
- A `current/principles/recurring-tasks.md` recurring-szabályai → automatikusan
  jelenjenek meg a megfelelő napon (pl. szerda = takarítás)

### Open kérdések

- **Q-orgview-1**: Default méret-arány a dual-pane-en? (50/50, 70/30, 30/70?)
- **Q-orgview-2**: A heti nézet "ma" oszlopa kiemelt-e? (highlight + auto-scroll)
- **Q-orgview-3**: Multi-day events (több napra húzódó task) hogyan jelenjen meg?
- **Q-orgview-4**: Üres nap = "free slot" jelölés? (segíti az "ide ütemezhetünk" döntést)
- **Q-orgview-5**: Mobil nézet esetén dual-pane → tabbed swap (nincs hely 2-re)?

---

## Status

- 📝 Lokál FR alapanyag — még nem küldött az organizer-nek
- 🚧 Az organizer kliens jelenleg `/tasks` + `/calendar` modulokat külön kezeli
  (lásd `__agent/references/organizer-modules.md`)
- ⏳ FR-batch upload az organizer-be: várja a `feature-requests.create`
  verifikációt + a kritikus tömeget (lásd `methodology-authority.md`)

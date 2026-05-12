# BACKLOG — `my-assistant`

> Middle-term feature backlog. Nem időre kötött, nem prioritás-rangsorolt — itt élnek azok a feature-igények, amik **megvalósítandók de még nem ütemezettek**. Rangsorolás amikor egy item közeledik a végrehajtáshoz: emeld át a [`TODO.md`](TODO.md)-ba.
>
> Forrás-elv: minden BACKLOG item van mögötte vagy egy `current/feature-requests/<topic>.md` (user-szöveg) vagy egy `current/principles/<topic>.md` (user-szabály), vagy mindkettő. Ha nincs, ne kerüljön ide.

---

## CLI bővítés

- **`ma cast notify` chunking** — > 200 char szöveg darabolása, sorrendben push. (Forrás: `cli/README.md` Korlátok)
- **`ma cast preset` schedule** — nap-szerinti automatikus volume-átállás (pl. 23:00 után 0.3-ra). (Forrás: `current/feature-requests/device-volume-scheduling.md`)
- **`ma server` subcommand-csoport** — server health-check, CRUD-helper-ek (`ma server status`, `ma server actions list`, `ma server tick <file.json>`)
- **`ma actions` shortcut** — egyszerű action-log query / append (`ma actions list --kind error`, `ma actions append --summary "..."`)

## Server bővítés

- **Phase 2 dual-write integration**: Claude `.claude/settings.json` hookok átkonvertálása file-write helyett `POST /actions`-re (server-down fallback file-ra). Forrás: `current/feature-requests/server-app-architecture.md`
- **Phase 2 task-create / task-update handler** — `cli/scripts/agent-handlers/src/handlers/task-{create,update}.ts` placeholder-ek implementálása `fo tasks.create` shell-out-tal
- **Notification scheduler** — `pending_notifications` queue cron-szerű drain (kilépéskor sleep-ből)
- **Recurring state engine** — `recurring_state.next_due_at` automatikus kiszámítása halogatás-szorzós eszkalációval. Forrás: `current/principles/recurring-tasks.md`
- **`/health-data` ingest** — fit / sleep adat sample (Forrás: `current/principles/{fit,sleep,health}-system.md`)

## Client bővítés

- **`actions` modul** — paged action-log viewer szűrésekkel (kind, actor, range)
- **`user-input` modul** — pending blokkok megtekintése + új blokk POST form
- **`activity` modul** — activity-monitor stream + AFK / sleep marker megjelenítés
- **`recurring` modul** — recurring task lista + manuális "kész"-jelölés

## Cross-cutting

- **Migration to organizer** — minden modulhoz: lokál JSON → `fo {modul}.create` script-elt batch import. Trigger: `__agent/SOURCE_OF_TRUTH.md` egy modul `local` → `organizer-verified` váltás
- **ESLint setup** mind a 3 sub-projekten (Pattern audit P2 follow-up)
- **`pre-flight-check` + `check-dev-leftovers` pipeline-step** mindhárom CDP-be (Pattern audit P2)
- **Full-FDP migráció** (csak ha tényleg kell): `@futdevpro/*` packages, mongoose, CommonJS — lásd Pattern audit P3

## Long-term (Phase 3+)

- **Cloud sync** — ha az organizer prod-ra megy, a my-assistant DB-t fokozatosan a server-re POST-oljuk
- **Mobile widget** (Android quick-actions) — recurring task gyors-jelölés (rendelkezésre álló idő optimum kihasználás)
- **Voice INPUT magyarul** — Whisper lokál integráció (low prio, lásd `current/feature-requests/google-home-integration.md`)

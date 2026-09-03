# BACKLOG — `my-assistant`

> Middle-term feature backlog. Nem időre kötött, nem prioritás-rangsorolt — itt élnek azok a feature-igények, amik **megvalósítandók de még nem ütemezettek**. Rangsorolás amikor egy item közeledik a végrehajtáshoz: emeld át a [`TODO.md`](TODO.md)-ba.
>
> Forrás-elv: minden BACKLOG item van mögötte vagy egy `current/feature-requests/<topic>.md` (user-szöveg) vagy egy `current/principles/<topic>.md` (user-szabály), vagy mindkettő. Ha nincs, ne kerüljön ide.

- [TASK] (BL-20260813-001) ⭐ [E2E-JOURNEY-MUSTHAVE] MUST-HAVE: user-journey alapú E2E (②J) — journey-katalógus + automata journey-tesztek
  status: ❌ open
  priority: high
  source: user
  area: tests/e2e-user-journey
  details: Owner-direktíva (2026-08-13): az end-to-end tesztek alá tartozik és MUST HAVE a user-journey alapú e2e, ami a FONTOSABB FUNKCIÓINKAT feature-teszteli. Teendő: (1) JOURNEY-KATALÓGUS felállítása — a projekt kritikus user-útjainak verziókezelt listája (`plans/e2e-3layer-rollout/subs/SUB-<projekt>.md` §2 vagy `__documentations/`), journey↔feature traceability-vel MINDKÉT irányban; (2) minden katalógus-tétel AUTOMATIZÁLÁSA `e2e/.../journeys/` alatt, 1 spec = 1 journey, `serial` futással; (3) a hat kötelező tulajdonság mindegyike: cross-feature (2-3+ funkció egy úton) · sorrendhelyes (valódi user-sorrend) · ÁLLAPOT-TOVÁBBADÁS (az N. lépés az (N-1). lépésben TÉNYLEGESEN létrehozott entitáson dolgozik, nem friss fixture-ből) · lépésenkénti BUSINESS-ASSERT (létrejött / látszik a listában / változott az egyenleg-jog-állapot — a puszta URL- vagy render-ellenőrzés smoke, 0 journey-coverage) · az ÉRTÉKET ADÓ KIMENETIG fut el (nem a dashboardnál áll meg) · CLEANUP (hard-delete); (4) VARIÁNS-JOURNEY-K ahol értelmezettek: elutasítás/decline, részleges, fallback, megszakítás+folytatás, jogosultság-korlátozott (happy-path-only journey = részleges, NEM lefedett); (5) backend-only projektnél a journey a fogyasztó állapot-hordozó endpoint-szekvenciája (auth→create→use→modify→delete), lépésenként kontraktus- + authz-asserttel — a "nincs UI" NEM mentesít; (6) CI-bekötés: LDP (lokál target) ÉS CICD (test-szerver target) is futtassa; (7) riportban KÉT külön szám: feature-coverage a feature-katalógus ellen + journey-coverage a journey-katalógus ellen. ADDITÍV, NEM helyettesítő: a ②J nem váltja ki a per-feature ②-t, és a ② nem elégíti ki a ②J-t — mindkettő kell. RELEASE-GATE: hiányzó vagy PIROS kritikus-journey = az érintett funkcionalitás NINCS KÉSZ. Foundation: @futdevpro/dynamo-e2e + @futdevpro/fdp-e2e-helpers (ne kézi smoke, ne duplikálj). Rule: core-e2e-user-journey · doktrína: e2e-three-layer-architecture.md §2d · írás-recept: e2e-writing-rules.md §2b.

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

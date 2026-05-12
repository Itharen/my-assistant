# 2026-05-11 — Dashboard L3 + same-port serving + pattern audit

## Kontextus

A rendszer L3 dashboard-ja addig csak `/status` skeleton volt. A user **4-szekciós dashboard**-ot kért:

- **Top-left (big)** — feladatok (organizer-partial, `fo tasks.list` read-only)
- **Top-right (big)** — asztrál / mentál / anyag hullámok
- **Bottom-left (small)** — AI insights ("amit észrevettem")
- **Bottom-right (small)** — quick capture + 3-sliderös energy snapshot

Plusz a user kérte, hogy a klienst a szerver szolgálja ki ugyanazon a porton (CCAP-minta inverze: kliens `/`, API `/api`), egyetlen `npm start` (= `dc ldp`) indítson mindent.

## Mit csináltunk

**L4 (server)**
- DB migration v2: `waves`, `insights`, `captures` táblák + 6 index
- 3 új data-model (`Wave_DataModel`, `Insight_DataModel`, `Capture_DataModel`) — `Action_DataModel`-mintát követve
- 4 új route folder: `dashboard/` (aggregator), `wave/`, `insight/`, `capture/`
- `_collections/fo-tasks.util.ts` — `fo tasks.list` shell-out, 3s timeout, `available=false` fail-safe
- Új `_services/core-services/static-client.core-service.ts` — `express.static` + SPA fallback, 503-as placeholder ha hiányzik a kliens-build
- `app.server.ts` refactor — `Router` mount `/api`-n, scoped `authMiddleware`, scoped 404 envelope, static a root-on
- Action-log emit minden POST endpoint-on (KRITIKUS rule)

**L3 (client)**
- `dashboard/` modul lazy-route-tal, `A_Route.dashboard` default redirect
- 5 komponens (`d-home` container + 4 panel), 2 service (`*.data-service`, `*.control-service`)
- Inline SVG line-chart a hullámokhoz (build-it-ourselves principle, no chart lib)
- `api-config.const.ts` → `defaultBaseUrl: '/api'` (same-origin)
- `app.component.html` nav-bar: Dashboard link első helyen

**Pattern conformance audit (a user explicit kérése)**
- One-export-per-file fix: `DashboardSnapshot_Interface`, `FoTaskItem_Interface`, `FoTasksResult_Interface` átköltöztetve `_models/interfaces/`-be
- Template method-call eliminálva: minden ikon precomputálva `@Input() set snapshot()` setter-ben (CD-overhead csökken)
- `is`-prefix booleanok: `isBusy`, `isAvailable`, `isLoading`, `isUrgent`, `isInFlight`
- `BehaviorSubject` ↔ `Observable` szétválasztás: belső `state_BS`, expose `state$`
- Double-cast eliminálva `capture.controller.ts`-ben (külön `energy` változó)
- 3 új smoke spec (`*.data-model.spec.ts`) — 11 új test, jasmine 30/30 green
- Event handlerek `handle*` prefixre cserélve (`handleSubmit`, `handleSetMode`, `handleRefresh`, `handleDismiss`)
- `view$ | async as v` Angular pattern adoptálva (`d-home.html`) az `s-home` lokál minta szerint

## Tanulság

1. **Saját maga referencia projekt**: az új komponenseknél az `s-home` Angular pattern követése (async pipe + no template methods) erősebb anchor mint a CCAP rule. A "kövesd a lokál mintát" mindig megelőzi a "kövesd a CCAP-ot" elvet, ha a lokál pattern már bevett.

2. **`fo` CLI in-band shell-out viable**: `execFileSync` 3s timeout + `available=false` fallback → a dashboard akkor sem törik el, ha az organizer test env teljesen halott. Egy thread blokkolva max 3s — single-user, lokál rendszerben elfogadható.

3. **Energy snapshot 1 gesture → 3 wave row**: ahelyett, hogy a kliens 3 külön POST-ot küldjön, a szerver fanout-ol. Egy capture row + 3 wave row egy tranzakcióban. Egyszerűbb UI, atomikus íras.

4. **Pattern audit lépcsős hozzáállás**: `pattern-audit.md` P0–P3 lépcsős kategorizációja (must / should / nice / intentional divergence) bevált — nem akarjuk minden CCAP-rule-t betartani, csak ami a lokál minta-koherenciát erősíti.

5. **Same-port serving cleanest design**: `/api` prefix + root static + SPA fallback → no CORS, no port-mismatch, no proxy.conf. CCAP egy `/api/app/`-szel csinálja (egyetlen prefix mindenre), my-assistant inverze: kliens `/`, API `/api`. A user kérése jobb is — `/` egy dashboard URL minden böngészőben "csak működik".

## Linkek

- Action-log: `__agent/log/actions/2026-05-11.jsonl` — 7 entry (decision/state-change/ship)
- Pattern audit reference: `__agent/references/pattern-audit.md` (2026-05-08 verified, ez a session a kiterjesztés)
- Architektúra: `current/architecture.md` § 2 (L3 + L4)
- Source-of-truth: `__agent/SOURCE_OF_TRUTH.md` — `tasks: organizer-partial` állapot változatlan (csak READ-et csinálunk a dashboard-ból)

## Hátralévő / nyitott

- D1: A-mode tick → automatikus `POST /insight` (most csak manuális source-ok)
- D2: Voice capture UI (a `kind: 'voice'` slot kész szerver-oldalon)
- D3: Hullám-chart x-axis time labels + hover tooltip
- D4: Dashboard layout drag-resize
- D5: Spec coverage a 4 új route-ra (most csak a 3 DAO-ra van)
- D6: `proxy.conf.json` ha valaha kell `ng serve` standalone dev mode

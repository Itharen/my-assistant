# my-assistant — Architecture

**Last verified:** 2026-05-17 (cycle 110 doc-sync; covers marathon 92-109)
**Audience:** developers / Claude sessions; canonical implementation reference.

> **Recent additions** (cycle 51-109, see [`CHANGELOG.md`](CHANGELOG.md) milestones 0.1.112 + 0.1.171):
> - **Socket layer** — server `VersionBroadcast_SocketServerService` + `broadcastDomainEvent(topic, op, payload)`; client `A_Socket_ControlService` + `A_DomainEvent_DataService` (Subject event-bus) — push-driven refresh path-orthogonal a poll mellett.
> - **Reports module** (`client/_modules/reports/`) — 3 panel (R_Home/R_DevIO/R_UserIO) — 9 GET + 3 POST unauth endpoint (`server/_routes/reports/`), inline-write USER_INPUT + AGB-reply + status-shift, Phase 5 auto-refresh.
> - **Sleep + Weather services** — `SleepState_Service` (`/api/sleep-state` env-overridable window) + `WeatherPoll_Service` (OpenMeteo 15min, dry→rain 3x3-trigger emit).
> - **Wave panel Phase 5a-e** — x-tick density, sin/cos LSQ fit overlay, interval picker + localStorage, fullscreen, marker overlay (action-log scan).
> - **Tests:** 88 → 102 spec (cycle 106-108 burst: wave-sinusoid-fit + error-extract + d-dashboard.data-service).

---

## Két szintű referencia-rendszer

A my-assistant két architektúra-doksit tart egyszerre:

1. **Ez a fájl** (`__documentations/ARCHITECTURE.md`) — formális FDP-pattern doksi, a többi FDP-projekt `ARCHITECTURE.md` mintáját követi (lásd `LIVE-projects/ccap-revisioned/__documentations/ARCHITECTURE.md`)
2. **`__agent/references/architecture.md`** — AI-quick-ref (kompakt, scannable, abszolút útvonalakkal)

A két doksi **ugyanazt a tartalmat** fedi le; ez itt formálisabb / verbose-abb, az `__agent/references/architecture.md` rövidebb, gyors-keresésre. **Ha eltérnek, a `__agent/references/architecture.md`-t tekintsd kanonikusnak** (live-updated).

➜ **A részletes implementációs referencia: [`../__agent/references/architecture.md`](../__agent/references/architecture.md)**

---

## Áttekintés (rövid)

A my-assistant **3-tier monorepo**:

```
my-assistant/
├── cli/         ★ TS Node CLI (`ma`)         — pattern partner: organizer-cli/cli/
├── server/      ★ Express + SQLite           — pattern partner: organizer/server/
├── client/      ★ Angular 18 (NgModule)      — pattern partner: organizer/client/
├── pipeline.config.json    workspace LDP (`dc ldp`)
├── __specifications/       business / functional spec (KÖTELEZŐ entry: main.md)
├── __documentations/       this folder — implementation docs (FDP minta)
└── __agent/                governance (workflow / status / references)
```

A három sub-projekt **HTTP-n keresztül** kommunikál (server az integráció pontja). Egyik sem importálja a másikat fordítási időben.

## Sub-projekt belépők

| | Forrás | Pipeline | Spec | Implementation README |
|---|---|---|---|---|
| **CLI** | `cli/src/` | `cli/pipeline.cicd.config.json` | [`../__specifications/modules/cli.md`](../__specifications/modules/cli.md) | [`../cli/README.md`](../cli/README.md) |
| **Server** | `server/src/` | `server/pipeline.cicd.config.json` | [`../__specifications/modules/server.md`](../__specifications/modules/server.md) | [`../server/README.md`](../server/README.md) |
| **Client** | `client/src/` | `client/pipeline.cicd.config.json` | [`../__specifications/modules/client.md`](../__specifications/modules/client.md) | [`../client/README.md`](../client/README.md) |

## Cross-cutting features

- [`../__specifications/features/action-log.md`](../__specifications/features/action-log.md) — action-log audit-naplózás
- [`../__specifications/features/tick-engine.md`](../__specifications/features/tick-engine.md) — A-mode dispatcher
- [`../__specifications/features/activity-monitoring.md`](../__specifications/features/activity-monitoring.md) — activity-monitor PowerShell ingest

## Pipeline

| Pipeline | Hol | `pnpm` script-ek |
|---|---|---|
| **LDP** (Live Dev) | `pipeline.config.json` (root) | `pnpm start` / `pnpm ldp` (= `dc ldp`) |
| **CDP-cli** | `cli/pipeline.cicd.config.json` | `dc cdp` cli/-ben |
| **CDP-server** | `server/pipeline.cicd.config.json` | `dc cdp` server/-ben |
| **CDP-client** | `client/pipeline.cicd.config.json` | `dc cdp` client/-ben |

## Decisions log

Tartós architektúra-döntések, indoklással: [`DECISIONS.md`](DECISIONS.md).

## Pattern audit

A my-assistant pattern-megfelelőségi audit (cli/server/client vs FDP partner-ek): [`../__agent/references/pattern-audit.md`](../__agent/references/pattern-audit.md). Részletes kompliance + szándékos eltérések + roadmap full-FDP-re.

## Workspace context

A workspace-szintű inventory (FDP / NPM / OGS projektek + központi `documentations/` belépők + per-project doc-belépők): [`../__agent/references/workspace-projects.md`](../__agent/references/workspace-projects.md).

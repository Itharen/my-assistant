# Cycle 6 — 2026-05-12

**Branch:** main
**Commit:** `db23d62`
**Trigger:** user megfigyelése — LDP nem trigger-elt mindenre + workflow nem írta elő az LDP-t

> **Megjegyzés:** A commit message tévesen "cycle 5"-öt mond. A chat (#5)
> közben párhuzamosan futtatott egy saját cycle 5-öt (`274fbbf` close).
> Az enyém valójában cycle 6.

## Összefoglaló

Két strukturális workflow-hiányosság javítása:

1. **LDP watch coverage hiányos** — `pipeline.config.json` csak `src/` + 3
   `package.json`-t watch-elt. Tsconfig / spec / workspace-yaml változásokra
   nem trigger-elt → false-negative állapotok.
2. **LDP-first nem volt kötelező a workflow-ban** — `02-audit` és
   `08-verify-local` kézi `pnpm typecheck` / `pnpm test`-et írtak elő, NEM
   az LDP `status.json` olvasását → dupla munka + race condition.

## Új LDP watch paths

`pipeline.config.json` `watch.paths`-be:
- `./cli/spec`, `./server/spec` (spec mappák — eddig kimaradt)
- `./cli/tsconfig.json`, `./server/tsconfig.json`, `./client/tsconfig.json`
- `./cli/pnpm-workspace.yaml`, `./pnpm-workspace.yaml`
- `./pipeline.config.json` (self — config reload)
- `yaml` extension hozzáadva

## Új alapelv

**WORKFLOW_DEV 22. (LDP-first)** — `logs/live-dev-pipeline/status.json` a
build/test állapot kanonikus forrása. Kézi `pnpm typecheck` / `pnpm test`
csak fallback ha LDP nem fut / nem trigger-elt.

`02-audit.md` + `08-verify-local.md` átdolgozva: LDP `status.json` olvasás
elsődleges, kézi parancsok csak fallback (és jegyzett a `phase_notes`-ban).

## Build/test eredmény

- **CLI/server/client typecheck:** ✅ (fallback kézi — LDP `waiting-for-restart`
  2h-ja stale, pipeline.config.json reload manuális `dc ldp` restart kell)

## Új open question

**Q-ldp-1**: A `dc ldp` képes-e config-reload-ra, vagy minden `pipeline.config.json`
módosítás után manuális restart kell? (felvenni `open-questions.md`-be)

## Stats

- **Files:** 4 (pipeline.config + 3 workflow doc) + 4 chat-bundled dep-touch
- **Commit:** db23d62
- **Build status:** success (fallback)

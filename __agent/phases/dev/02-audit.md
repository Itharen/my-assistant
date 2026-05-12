# Phase 02 — Audit

> Build / typecheck / test baseline **az LDP `status.json`-ból** + runtime error scan.

## Mit csinálj

> **LDP-FIRST szabály (KRITIKUS — 22. alapelv):** A build/test állapot kanonikus
> forrása a **`logs/live-dev-pipeline/status.json`**. A LDP (`dc ldp`)
> folyamatosan fut és minden releváns file-change-re re-builddel. **NE futtass
> kézzel `pnpm typecheck` / `pnpm test`-et**, ha az LDP elérhető — duplázott
> munka + race condition.

1. **LDP `status.json` olvasás** (elsődleges):
   ```
   cat logs/live-dev-pipeline/status.json
   ```
   Mezők: `phase`, `pipelineComplete`, `exitCode`, `steps[*].status`,
   `steps[*].errors[]`, `steps[*].testSummary`. A `startedAt` mező megmondja
   mennyire friss (ha >5 perc + a working tree azóta változott → re-trigger).

2. **LDP nem fut / stale** (ritka, fallback):
   ```
   cd cli       && pnpm typecheck
   cd server    && pnpm typecheck
   cd client    && pnpm typecheck
   ```
   Tesztet csak ha tényleg muszáj — minden esetben jegyezzük a `phase_notes`-ban
   hogy fallback futott (NEM a SoT-ot olvastuk).

3. **Server health-check** (ha él):
   ```
   curl http://127.0.0.1:39200/healthz
   ```
4. **Action-log** rekord-ok kategorizálva (`bash` típusú entries
   alapján).

5. **Pipeline-state check** (Phase 2+ — `03-collect-tasks` `#0a/0b` priority):
   - **LDP** (`dc ldp` watch-állapot, Phase 2): fail step van-e?
     → `events/dev/on-ldp-fail.md`
   - **CDP** (`fdp build-results --project my-assistant`, Phase 2): utolsó push pipeline OK?
     → `events/dev/on-cdp-fail.md`
   - Phase 1-ben **no-op** (nincs `pipeline.config.json` / Overseer-integráció).

6. **Runtime error scan** (KRITIKUS — 20. alapelv):
   - Olvasd be: `__agent/log/actions/<today>.jsonl` + `<yesterday>.jsonl`
   - Filter: `kind: error` rekordok
   - Számold: 0-2 / 3-9 / 10+
   - Eredmény → `STATUS_DEV.phase_notes`: error-count + top-3-summary
   - Server REST-en is (ha lesz `/errors` endpoint Phase 2+): nézd meg
     onnan is

   Prioritás:
   - **10+ error 24h-n belül**: ez a cycle **dedikált error cleanup**
     (`STATUS_DEV.package.anchor_id: "error-cleanup-<date>"`,
     ugorj `06-implement`-re a top error-okkal)
   - **3-9 error**: candidate-pool top, normál `03-collect-tasks` flow
   - **0-2**: figyelmen kívül (nem urgens)

## Failing baseline

| Mit találtál | Akció |
|---|---|
| Typecheck failel | `events/dev/on-build-fail.md` — ez urgens, mielőtt más task-ot felveszel |
| Test failel | `events/dev/on-test-fail.md` |
| Build OK + Test OK | Folytasd `03-collect-tasks`-re |

## STATUS_DEV update

```yaml
last_cycle:
  build_status: success | failed | not-run
  test_status: success | failed | not-run
```

## Action-log emit

```json
{ "kind": "note", "summary": "Audit: cli/server/client typecheck + test status",
  "extra": { "cli": "...", "server": "...", "client": "..." } }
```

## Kilépés

`STATUS_DEV.phase` → `collect-tasks`

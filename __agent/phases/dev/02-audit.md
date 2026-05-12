# Phase 02 — Audit

> Build / typecheck / test baseline a working tree-n.

## Mit csinálj

1. **Pnpm typecheck** mindhárom projekten:
   ```
   cd cli       && pnpm typecheck
   cd server    && pnpm typecheck
   cd client    && pnpm typecheck
   ```
2. **Pnpm test** ahol releváns:
   ```
   cd cli       && pnpm test
   cd server    && pnpm test
   cd client    && pnpm test
   ```
3. **Server health-check** (ha él):
   ```
   curl http://127.0.0.1:39200/healthz
   ```
4. **Action-log** rekord-ok kategorizálva (`bash` típusú entries
   alapján).

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

# Phase 08 — Verify local

> Build / test / smoke a teljes érintett scope-on.

## Mit csinálj

1. **Pnpm typecheck** minden érintett projekten (cli/server/client):
   ```
   cd cli       && pnpm typecheck
   cd server    && pnpm typecheck
   cd client    && pnpm typecheck
   ```
2. **Pnpm test** (jasmine / karma):
   ```
   cd cli       && pnpm test
   cd server    && pnpm test
   cd client    && pnpm test
   ```
3. **Coverage** (Phase 2 után automatikusan jegyezve):
   ```
   pnpm test:coverage
   ```

## Smoke teszt (manuális / kód-specifikus)

| Mit változtattál | Smoke |
|---|---|
| CLI `ma cast` változás | `pnpm list-interfaces`, `pnpm discover` |
| Server endpoint | `curl <endpoint>` |
| Dispatcher handler | `pnpm smoke` (sample-output.json) |
| Client component | `pnpm start` + browser-check (Phase 2+) |

## Failing scenarios

| Mit találtál | Akció |
|---|---|
| Typecheck failel | `events/dev/on-build-fail.md` |
| Test failel | `events/dev/on-test-fail.md` |
| Coverage csökkent | New feature mellé unit teszt — vissza `06-implement` |
| Smoke fail | `06-implement` re-iteráció |

## STATUS_DEV update

```yaml
last_cycle:
  build_status: success
  test_status: success
```

## Action-log emit

```json
{ "kind": "note", "summary": "Verify-local: build+test mind zöld",
  "extra": { "typecheck": "ok", "test": "ok", "coverage": "..." } }
```

## Kilépés

`STATUS_DEV.phase` → `update-docs`

# Phase 08 — Verify local

> Build / test / smoke **az LDP `status.json`-on át** (22. alapelv).

## Mit csinálj

> **LDP-FIRST szabály:** A `06-implement` után a working tree változott. Az
> LDP figyeli a fájlokat (`pipeline.config.json` `watch.paths`) és
> automatikusan re-buildel + re-tesztel. **Olvasd a `status.json`-t**, ne
> futtasd kézzel a parancsokat.

1. **Várj az LDP-re** (max 60 sec a debounce + step időtartam után):
   ```
   cat logs/live-dev-pipeline/status.json
   ```
   - Friss `startedAt` (a `06-implement` óta)?
   - `pipelineComplete: true` + `exitCode: 0` → ✅ kilépés `update-docs`-ra
   - `pipelineComplete: false` + `phase: <running step>` → várj még
   - `exitCode != 0` → lásd "Failing scenarios"

2. **LDP NEM trigger-elt rá a változásra** (ritka):
   - Ellenőrizd: a módosított fájl benne van-e a `pipeline.config.json`
     `watch.paths`-ban? Ha nem → **`events/dev/on-architecture-decision.md`**
     (bővítés user-OK-val).
   - Ha igen, de a `startedAt` nem frissült → manuálisan trigger-elhető
     (érintsd meg az egyik watch-fájlt) vagy fallback kézi parancsokkal:
     ```
     cd cli       && pnpm typecheck && pnpm test
     cd server    && pnpm typecheck && npm run build-base && npx jasmine --config=spec/support/jasmine.json
     cd client    && pnpm typecheck && npx ng test --watch=false --browsers=ChromeHeadless
     ```
     Jegyezd `phase_notes`-ba hogy fallback futott.

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

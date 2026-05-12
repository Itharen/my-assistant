# Event — on-ldp-fail

> **Live Development Pipeline** (`dc ldp`) hiba a fejlesztés közben futó
> watch-pipeline-ban. Forrás: `pipeline.config.json` step-jeinek nodemon-os
> futása.

## Mikor trigger

- `dc ldp` aktív és egy step exit-code ≠ 0
- File-change után rebuild fail (typecheck / lint / unit-test)
- Watch-rebuild crash (server / client / cli)

## Phase 1 megjegyzés

A my-assistant projektben **még nincs** `pipeline.config.json` és `dc ldp`
setup. Ez az event-handler **placeholder** — Phase 2+-ban aktiválódik
amikor a LDP infrastructure beépül (`cli/`, `server/`, `client/` egyenkénti
watch).

## Detekció

Phase 2-höz tervezett források (priority sorrendben):

| Forrás | Mit ad |
|---|---|
| `cli/__agent/log/actions/<today>.jsonl` | `kind: "error"` `actor: "ldp"` entries |
| LDP runtime stdout / stderr capture | last 100 sor |
| `pipeline.config.json` step-spec | melyik step failelt |

## Mit csinálj

1. **Hiba kategorizálás:**
   - **Typecheck fail egy projektben** → `events/dev/on-build-fail.md`
   - **Test fail** → `events/dev/on-test-fail.md`
   - **Server crash** → runtime ok, lásd `events/dev/on-runtime-error.md`
   - **Package konfliktus** → `events/dev/on-package-issue.md`
   - **Ismeretlen** → `events/dev/on-user-needed.md`

2. **LDP-szintű reset** (Phase 2):
   - `dc ldp --restart` (ha implementálva)
   - Watch-state újraindítás

3. **STATUS_DEV update:**
   ```yaml
   last_cycle:
     build_status: failed
   phase_notes: |
     LDP fail: <step> at <fájl>:<sor>. Javítás folyamatban / restart.
   ```

4. **Maximum 3 javítási próbálkozás** — utána `events/dev/on-user-needed.md`

## Action-log emit

```json
{ "kind": "error",
  "summary": "LDP fail: <step>, <hibaüzenet>",
  "extra": { "pipeline": "ldp", "step": "...", "error": "..." } }
```

## Priority

A `03-collect-tasks` priority-sorrendben **#0a** (a legmagasabb a build-fail után —
LDP fail = a fejlesztő aktívan blokkolva). LDP fix előbb, mint bármi más
candidate.

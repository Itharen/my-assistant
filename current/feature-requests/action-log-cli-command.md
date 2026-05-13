# FR: Action-log mint CLI command (A+B+sync)

> **Forrás:** user 2026-05-13.

## Háttér

Jelenleg az action-log írása **3 különböző csatornán** megy:

| Csatorna | Mit | Hova |
|---|---|---|
| `cli/scripts/action-log/hook.ps1` | Claude Code hook event-ek | `__agent/log/actions/<day>.jsonl` |
| `cli/scripts/action-log/append.ps1` | Manuális PS-script log | ugyanaz |
| `cli/src/action-log/action-log.client.ts` | CLI saját lifecycle | ugyanaz |

Probléma: PS scriptek nehezen tesztelhetők, DB-integráció hiánya,
duplikált logika, encoding/path bugok (lásd 2026-05-13 hook fix).

## Cél

**Egyetlen CLI command** legyen a kanonikus belépés. Hook = thin PS wrapper.
Fájl + DB dual-write + sync.

## API

```
ma action-log emit --kind <K> --summary <S> [--actor <A>] [--ref <R>] [--extra <JSON>] [--ts <ISO>]
ma action-log sync [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--dry-run]
ma action-log list [--from <ISO>] [--to <ISO>] [--kind <K>] [--actor <A>] [--limit N]
```

`emit`:
1. Build entry (ts default = now, actor default = `cli` ill. `--actor` override)
2. **Append fájl** `__agent/log/actions/<day>.jsonl` (mindig — fájl a fallback)
3. **POST server** `http://127.0.0.1:39245/actions` (best-effort, timeout 500ms)
   - 2xx → OK, `db-synced: true`
   - egyéb → log warning stderr-re, `db-synced: false`
4. JSON envelope stdout-ra: `{ ok, action, requestId, elapsedMs, result }`

`sync`:
1. Olvasd be a `__agent/log/actions/<day>.jsonl` fájlokat
2. GET `/actions?from=<from>&to=<to>` — server-side meglévő entry-k
3. Diff (ts + kind + summary kulcson) → POST a hiányzókat
4. Output: `{ added: N, skipped: M, errors: K }`

`list`:
- Server GET `/actions` proxy, JSON envelope-ben

## Hook PS wrapper (új minimal verzió)

```powershell
# UserPromptSubmit / PostToolUse / SessionStart / Stop:
$raw = ''
if ($input) { foreach ($l in $input) { $raw += $l } }
if (-not $raw) { exit 0 }
$payload = $raw | ConvertFrom-Json
# Determine kind, summary based on hook_event_name + tool_name
# (existing switch logic, ~60 lines)
$kind = ...
$summary = ...
& node "$projectRoot\cli\build\main.js" action-log emit --actor claude --kind $kind --summary $summary
```

Ezzel a PS-ben csak a payload→kind/summary mapping marad (event-handler logic),
minden más TS-ben.

## Server feltétel (B része)

A `POST /actions` endpoint **még nem létezik**. Külön FR-ek függvénye:
- `current/feature-requests/runtime-error-api.md` (DyNTS_Logs_Service) — kapcsolódik
- Új mini-FR: `actions` tábla + `_routes/actions/actions.controller.ts` + DataService

Ha a `POST /actions` még nincs, az `emit` POST-ja **404-et kap, csak fájl marad**
— ez akceptábilis átmenet (graceful degradation).

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | chat ✅ |
| 1 | `ma action-log emit` CLI command (csak fájl-write, server POST stub) | Dev Agent ✅ cycle 25 |
| 2 | Hook PS wrapper update — `ma action-log emit`-re vált | Dev Agent ✅ cycle 25 |
| 3 | Server `actions` tábla + `POST /actions` + `GET /actions` | Dev Agent (külön FR-ként?) |
| 4 | `emit` POST-ot bekapcsolni (dual-write) | Dev Agent |
| 5 | `ma action-log sync` reconciliation | Dev Agent |
| 6 | `ma action-log list` query proxy | Dev Agent |

Phase 1+2 egy cycle / plan-doc (kis), Phase 3 külön FR (server-side), Phase 4-6
külön cycle.

## Status

🟢 **Aktív FR.** Phase 1+2 shipped cycle 25-ben — plan-doc
`__agent/plans/action-log-cli-command.plan.md`. Phase 3-6 külön green-light-ra
vár.

## Kapcsolódik

- `current/feature-requests/communication-forms.md` — testvér (handler-pattern)
- `current/feature-requests/automatic-status-recording.md` — kapcsolódó FR-handlers
- `current/feature-requests/runtime-error-api.md` — server-side logs infrastructure
- `cli/scripts/action-log/DEPRECATED.md` — migráció-roadmap
- `cli/src/action-log/action-log.client.ts` — meglévő writer alapja

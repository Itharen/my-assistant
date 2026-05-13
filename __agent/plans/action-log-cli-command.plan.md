# Plan — Action-log CLI command (FR #3e)

> **Cél:** Egyetlen CLI command (`ma action-log emit`) legyen a kanonikus
> belépés az action-log írásra. Hook = thin PS wrapper, fájl + (későbbi)
> DB dual-write + sync.
>
> **Forrás-FR:** `current/feature-requests/action-log-cli-command.md`
> **AGB green-light:** AGB-2026-05-13-05 (chat → dev-agent, 2026-05-13T19:52).
> **Scope:** csak Phase 1+2 (Phase 3-6 külön green-light-ra vár).

---

## Phase 1 — `ma action-log emit` CLI command ⚡

### 1.1 `cli/src/action-log/action-log.client.ts` (refactor)

Widening for actor/ts/kind:

```ts
export interface ActionLogEntry {
  kind: string;           // VIDEÍTVE — ActionLogKind union megmarad helper-ként, de string is ok
  summary: string;
  actor?: string;         // default: 'cli'
  ref?: string;
  extra?: Record<string, unknown>;
  ts?: string;            // ISO; default = nowIsoBudapest()
}
```

Backward-compat: meglévő callers (`main.ts` global error handler, command runners) változatlanul működnek (kind: string accept-eli a literal union értékeket, actor/ts default-tal).

### 1.2 `cli/src/commands/action-log-emit.command.ts` (új)

```ts
export async function runActionLogEmitCommand(args: string[]): Promise<void>
```

- `parseArgs` flags: `--kind --summary [--actor --ref --extra --ts --pretty]`
- `--extra` JSON string → parse → object
- Validáció: `--kind` és `--summary` required
- `await logAction({ kind, summary, actor, ref, extra, ts })` — fájl-write
- Server POST stub (Phase 3 lesz a tényleges) — Phase 1-ben `db-synced: false`
- Output JSON envelope: `{ ok: true, action: 'action-log.emit', result: { written, 'db-synced', day } }`

### 1.3 `cli/src/commands/action-log-emit.command.spec.ts` (új)

- Smoke: `runActionLogEmitCommand(['--kind', 'note', '--summary', 'test'])` → no throw, envelope ok
- Missing required → exit code 2 + EnvelopeFail
- `--extra` invalid JSON → exit code 2 + EnvelopeFail

### 1.4 `cli/src/main.ts` (wire)

- Új import: `runActionLogEmitCommand`
- `COMMAND_TREE['action-log'] = { emit: runActionLogEmitCommand }`
- `printGroupHelp('action-log')` ágra branch

### 1.5 Verify

- LDP `tsc-cli` + `cli-test` zöld
- Smoke: `node cli/build/main.js action-log emit --kind note --summary "test" --pretty` → envelope ok, fájl-bejegyzés `__agent/log/actions/<day>.jsonl`-ben

---

## Phase 2 — Hook PS wrapper update

### 2.1 `cli/scripts/action-log/hook.ps1` (rewrite)

Megmarad:
- `$input` reader + payload parse
- Event → kind/summary mapping (~60 sor switch)
- Project root detection

Cserélve:
- Direkt file append → `& node "$projectRoot\cli\build\main.js" action-log emit --actor claude --kind $kind --summary $summary [--ref $ref] [--ts $ts]`
- Hibatűrés: continue-on-error marad (swallow → never break user workflow)

### 2.2 `cli/scripts/action-log/append.ps1` (rewrite, ha létezik)

Ugyanígy delegál `ma action-log emit`-re.

### 2.3 Smoke

- Claude Code újraindítás után az alap 4 hook event (SessionStart / UserPromptSubmit / PostToolUse / Stop) működik
- Action-log entry-k a megfelelő day-fájlba kerülnek
- `actor: claude` field megmarad (a hook expliciten passes --actor claude)
- Encoding UTF-8 (a CLI biztosítja)

---

## Phase 3-6 (külön plan / külön green-light)

| Phase | Mit |
|---|---|
| 3 | Server `actions` tábla + `POST /actions` + `GET /actions` |
| 4 | `emit` POST dual-write (`db-synced: true` ténylegesen) |
| 5 | `ma action-log sync` reconciliation |
| 6 | `ma action-log list` query proxy |

Kihagyva ebben a plan-ben.

---

## Validation summary (per phase)

| Phase | Verify | Várt |
|---|---|---|
| 1 | LDP tsc-cli + cli-test (+ új spec) zöld | 21+1+ specs, exit 0 |
| 2 | LDP zöld + Claude Code újraindítás után hook-event-ek log-olnak | `__agent/log/actions/<today>.jsonl`-ben friss entries `actor:claude` |

---

## Risks & rollbacks

- **`build/main.js` nem létezik a hook futáskor:** ha az LDP nem futott vagy build failed, a hook 404-et kapna. Fallback: `try{} catch{ }` PS-ben swallowed marad — egy session nem log-ol, de nem törik a workflow. Az LDP-zöld feltétel a Phase 2 előtt.
- **Encoding regression:** a PS direkt-write UTF-8 (`UTF8Encoding(false)`) volt. A CLI is UTF-8 — `fs.appendFile` default. Konzisztens.
- **`logAction` no-throw kontraktus:** a refactor megőrzi a try/catch swallow-t. Tesztelve a spec-ben.
- **`actor` default ütközés:** existing main.ts hívások `actor` field NÉLKÜL hívják logAction-t → default `'cli'`. Hook majd explicit `--actor claude`. Ok.

---

## Status

🔄 **Phase 1+2 cycle 25-ben (folyamatban).** Phase 3-6 következő plan-ekben /
külön green-light-okra.

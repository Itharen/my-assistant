# Feature: Tick engine (A-mode dispatcher)

> A-mode agent strukturált JSON output validálása, tier-gating, és végrehajtása. Két implementáció él párhuzamosan: file-alapú (`cli/scripts/agent-handlers/`, DEPRECATED) és server-alapú (`server/src/_modules/tick-engine/`, kanonikus Phase 2-től).

**Forrás-FR:** `current/feature-requests/triggering-system-architecture.md`
**Forrás-plan:** `__agent/plans/triggering-A-mode-health-check.plan.md`
**Belépési pont (agent prompt):** `__agent/triggers/A-mode-entrypoint.md`

---

## 1. Mi az A-mode

A-mode egy ütemezett (cron-szerű) agent-fut, ami:

1. Beolvas egy strukturált input-set-et (`__agent/STATUS.md`, `__agent/log/actions/<today>.jsonl`, `__agent/USER_INPUT.md`, sleep-state, recurring-state, stb.)
2. Eldönti, hogy szükséges-e bármi akció (`urgens` / `soft-nudge` / `no-action`)
3. Strukturált JSON-t emit a CCAP runtime-nak / dispatcher-nek
4. A dispatcher validál, tier-gate, és végrehajt

A-mode = "aktív mode" (lehet B-mode szkriptelt automatizáció külön plan-ben).

## 2. Output JSON kontrakt (`AgentOutput`)

```ts
interface AgentOutput {
  verdict: 'urgens' | 'soft-nudge' | 'no-action';
  reason: string;                                // non-empty, miért ezt a verdict-et választotta
  actions: AgentAction[];                        // max 5 / tick
  tickMeta: {
    tickedAt: string;                            // ISO timestamp
    inputDigest: string;                         // hash a betöltött input-okra
  };
}
```

### 2.1 Action-fajták

| `type` | `tier` | Kötelező `args` |
|---|---|---|
| `log` | 0 | `kind`, `summary`, `ref?` |
| `user-input-new` | 1 | `title`, `kind` ∈ {task, feedback, approval, rejection, feature-request, instruction}, `domain`, `body` |
| `update-status` | 1 | `field` ∈ {next_action, last_event_type}, `value` |
| `notify-cast` | 1 | `text`, `target?`, `throttleId?` |
| `task-create` | 2 | `title`, `description` (KÖTELEZŐ "Forrás-szabály:" referencia), `priority?`, `dueDate?` |
| `task-update` | 2 | `ref`, `ifMatch` (etag), `patch` |

### 2.2 Tier policy (KÖTELEZŐ)

| Tier | Mit jelent |
|---|---|
| **0** | Mindig fut (csak `log` típus) |
| **1** | Ha **NEM alszik**, fut. Ha **alszik**, queued (Phase 2 will route to `pending_notifications`) |
| **2** | Ha NEM alszik, fut. Ha alszik, queued. Schema-validation: description-ben "Forrás-szabály:" kötelező |
| **3** | **Soha** nem fut auto-execution (manuális user-jóváhagyás kell) |

Forrás: `__agent/triggers/A-mode-entrypoint.md` "Tier-szabályok" szekció.

## 3. Validáció (KÖTELEZŐ)

Minden `AgentOutput`-ot kötelezően validálunk:

- `verdict` ∈ {urgens, soft-nudge, no-action}
- `reason` non-empty string
- `actions` array, max 5 elem
- Minden action-en: `type` ∈ ismert lista, `tier` matches required-tier-for-type, `args` schema (lásd 2.1)
- `tickMeta.tickedAt` és `inputDigest` non-empty
- `task-create.description` mátchel `forr[áa]s-?szab[áa]ly` regex-re

Validation hiba → exit code 2 (file dispatcher) vagy HTTP 400 (server endpoint).

## 4. Implementáció — két layer

### 4.1 File-alapú (DEPRECATED, de live)

**Útvonal:** `cli/scripts/agent-handlers/src/dispatch.ts`
**Hívás:** `node cli/scripts/agent-handlers/src/dispatch.ts < agent-output.json` vagy `--file <path>`
**Tárolás:** state in `__agent/state/agent-tick.json`, action-log JSONL-ben
**Status:** Phase 1 live, Phase 2-3 cutover server-re

### 4.2 Server-alapú (kanonikus Phase 2-től)

**Útvonal:** `server/src/_routes/tick/tick.controller.ts` → `_modules/tick-engine/tick-engine.module.ts`
**Hívás:** `POST http://127.0.0.1:39245/tick` body = `AgentOutput` JSON
**Tárolás:** `agent_ticks` + `actions` SQLite táblákban, FK-val
**Status:** Phase 1 ready, Phase 2 cutover folyamatban

## 5. Sleep-window detection

Ha `is_sleeping = true`, a Tier 1+ action-ek skipped-ek (queued — Phase 2 `pending_notifications`).

A sleep detection forrásai (priority order):
1. **Activity-monitor inferred-sleep / inferred-wake event** (`server/activity-monitor/`)
2. **User-stated sleep / wake** (USER_INPUT chat)
3. **Naive fallback:** óra 02:00–08:00 (file dispatcher Phase 1)

Tervezett a server-alapú: `ActivityIngest_Module.state().isLikelyAsleep` (idle ≥ 8h).

Forrás-szabály: `current/principles/sleep-system.md` (csúszó alvás-ébrenlét ciklus).

## 6. Throttle (notify-cast esetén)

Ha az action `args.throttleId` szerepel, a server checkols:

- `POST /notification/throttle/check` `{ throttleId, minIntervalMs, text? }`
- Ha utolsó tüzelés óta < `minIntervalMs` → skip
- Egyébként execute + register a `notify_throttle` táblába

Forrás-szabály: `current/principles/cast-notifier-defaults.md` (de-dup minden bemondásnál).

## 7. Authority — mit szabad / mit nem

- **Tier 0 (log):** szabadon
- **Tier 1+ writes:** organizer-modulban user-confirmation kell (lásd `current/principles/methodology-authority.md`); my-assistant lokál csak write-confirm-ra
- **Tier 2 task-create:** "Forrás-szabály: ..." kötelező, hogy a task explicit utaljon arra a `current/principles/<topic>.md` fájlra, ami indokolja
- **Tier 3:** sosem auto-execute, csak manuális

## 8. Phase 2 placeholder handler-ek

A `notify-cast`, `task-create`, `task-update` handler-ek jelenleg **csak naplóznak** (placeholder), nem hívnak külső rendszert. Phase 2-ben:

- `notify-cast` → `ma cast notify --text ... --throttle-id ...` (server-CLI shell-out vagy in-process import)
- `task-create` → `fo tasks.create --title ... --description ... --priority ...` (organizer-MCP-n keresztül)
- `task-update` → `fo tasks.update --ref ... --if-match <etag> ...`

## 9. Kapcsolódó

- Implementáció (server): `server/src/_modules/tick-engine/`, `server/src/_routes/tick/`
- Implementáció (file dispatcher): `cli/scripts/agent-handlers/`
- Schema validator: `_modules/tick-engine/agent-output.validator.ts`
- Tier policy: `_modules/tick-engine/tier-policy.const.ts`
- Forrás-FR: `current/feature-requests/triggering-system-architecture.md`
- Plan: `__agent/plans/triggering-A-mode-health-check.plan.md`

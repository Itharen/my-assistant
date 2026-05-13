# Plan — Error-handling cleanup (CLI swallow eradication)

> **Cél:** A `current/principles/error-handling.md` univerzális hard rule
> ("SEMMI csendes catch") teljes érvényre juttatása a `cli/` kódbázisban.
>
> **Forrás-trigger:** user-mandate 2026-05-13 21:55 ("HOL VANNAK A KURVA
> HIBAKEZELÉSI RENDSZEREK!?!"). Audit: 18 csendes `catch {}` + 2 PS-hook
> `# Swallow`. A frissen ship-elt cycle 25 (FR #3e) örökölt swallow-okat,
> nem tisztított.
>
> **Kapcsolódik:** `current/feature-requests/runtime-error-api.md` (FR #3b,
> server-side `DyNTS_Logs_Service` install) — külön plan, ez a CLI-only.

---

## Audit (current state — cycle 26 elején)

| Fájl | Sor | Pattern | Megj. |
|---|---|---|---|
| `cli/src/action-log/action-log.client.ts` | 90 | `} catch { // swallow }` | log-helper, no-throw kontraktus |
| `cli/src/cast/cast-client.ts` | 55, 63, 110, 122, 134 | `catch { /* noop */ }` / `catch {}` | cleanup/idle/fallback |
| `cli/src/cast/discover.ts` | 104, 109 | `catch {}` | mDNS noise filter |
| `cli/src/cast/groups.ts` | 35 | `catch {}` | ? |
| `cli/src/cast/presets.ts` | 52, 65 | `catch {}` | ? |
| `cli/src/cast/tts.ts` | 54 | `catch {}` | ? |
| `cli/src/cast/volume.ts` | 211, 224, 235 | `catch {}` | ? |
| `cli/src/google/google-assistant.client.ts` | 45, 136 | `catch {}` | ? |
| `cli/src/spotify/spotify.client.ts` | 55 | `catch {}` | ? |
| `cli/scripts/action-log/hook.ps1` | bottom | `# Swallow` | hook no-break-workflow |
| `cli/scripts/action-log/append.ps1` | (új) | similar | append wrapper |

---

## Phase 1 — Action-log layer ⚡ (cycle 26)

### 1.1 `cli/src/action-log/action-log.client.ts` — Result pattern

- `logAction()` return type: `Promise<LogActionResult>` ahol
  `LogActionResult = { ok: true } | { ok: false; error: { code, message, stack?, details? } }`
- Belső catch: NE swallow-oljon — strukturált stderr emit (visible, non-recursive)
- `process.stderr.write(JSON.stringify({ code: 'MA-LOG-WRITE-FAIL', ... }))`
- Második (outer) catch a stderr-write esetén csendes (tényleg nincs mit tenni — stderr unwritable)
- Backward-compat: meglévő `void logAction({...})` callerek nem törnek
- A `kind`-okat principle-nek megfelelő `MA-<MODULE>-<CODE>` formátumra hozzuk (ld. error-handling.md)

### 1.2 `cli/src/action-log/action-log.client.spec.ts` — új specs

- `logAction()` happy-path returns `{ ok: true }`
- `logAction()` fail-path (MA_LOG_ROOT invalid) returns `{ ok: false, error }`
- Structured error has `code`, `message`, `stack` field
- Stderr emit observable (spy on `process.stderr.write`)

### 1.3 `cli/src/commands/action-log-emit.command.ts` — propagate fail

- `const result = await logAction({...})`
- Ha `!result.ok` → `writeEnvelope(fail('action-log.emit', requestId, startedAt, result.error.code, result.error.message, result.error))` + `process.exit(1)`
- Hook-caller így LÁTJA a hibát (stderr + envelope.error)

### 1.4 `cli/src/main.ts` — global error handler comment

- A `void logAction({...}).finally(() => process.exit(1))` patternt megőrizzük (re-throw nincs értelme — már error pipeline-ban vagyunk)
- Hozzáadunk magyarázó kommentet: WHY void here (recursive error avoidance)

### 1.5 `cli/scripts/action-log/hook.ps1` — stderr emit

- `# Swallow` kommentet replace `Write-Host`/stderr-emit-tel + WHY comment ("workflow break worse than missing log entry")
- Build-missing `exit 0` esetén is stderr emit: "[hook.ps1] cli build missing: ... — entry NOT logged"
- A try/catch outer-most `catch` ugyanígy stderr-emit-et csinál

### 1.6 `cli/scripts/action-log/append.ps1` — stderr emit

- Ugyanaz a pattern: `Write-Error -ErrorAction Continue` vagy `[System.Console]::Error.WriteLine` minden non-throw error helyre
- Exit code propagálódik (már most propagálja `$LASTEXITCODE`-ot)

### 1.7 Verify

- LDP `tsc-cli` + `cli-test` zöld (új spec-ek!)
- Smoke: `ma action-log emit --kind note --summary X` → envelope ok, file appended
- Smoke fail: `MA_LOG_ROOT=$'\\0'` (invalid) → envelope FAIL, stderr structured error, exit 1

---

## Phase 2 — Cast/* swallow audit (későbbi cycle)

Az `cli/src/cast/*.ts` 14 swallow-ja. Mindegyikre per-line decision:

- **Documented swallow** (cleanup, idle-disconnect, noise filter): comment WHY + `kind: 'note'`/stderr-emit a non-trivial case-ekben
- **Real error swallow**: `catch (err) { await logAction({ kind: 'error', summary: ... }); throw err; }` (or propagate to caller via Result)
- **Pattern source**: cast-client `try { client.close(); } catch { /* noop */ }` cleanup OK (close fail nem érdekes), de `discover.ts` mDNS-error swallow → log-only

---

## Phase 3 — Google/Spotify swallow audit (későbbi cycle)

`google-assistant.client.ts` (2) + `spotify.client.ts` (1) swallow. Hasonló per-line decision.

---

## Phase 4 — Server-side runtime-error-api (külön plan)

`current/feature-requests/runtime-error-api.md` FR #3b. Server `DyNTS_Logs_Service`
install + `_routes/errors/` controller + dual-write a CLI-ből (POST /api/errors/error/log).
Külön plan-doc + külön green-light.

---

## Validation summary (per phase)

| Phase | Verify | Várt |
|---|---|---|
| 1 | LDP cli-test (+ új specs) zöld | 28+ specs, exit 0 |
| 2 | LDP zöld + smoke kéz a kézi cast notify | log-emit minden cast error-ra |
| 3 | LDP zöld | google/spotify error-ok láthatóak action-log-ban |
| 4 | server `pnpm test` + curl `/api/errors/error/log` | DB-be perzisztálva |

---

## Risks & rollbacks

- **Recursive error in stderr-write:** ha még a stderr-write is failel (tty closed), valóban nincs hova logolni — outer try/catch csendes swallow ott OK (documented WHY).
- **PS Write-Error noise a hook-ban:** Claude Code-ban a hook stderr Claude session-be jut, így a user látja a log-fail-eket. Ez **kívánatos** (debug-level visibility a principle szerint), de zajos lehet — ha az gond, később per-tool-call filter.
- **Phase 1 cikluszáró nélkül indítva a cast-ot:** Phase 2-ig a cast swallow-ok megmaradnak, a user látja ezeket az audit-listán. Per-phase ship.

---

## Status

🔄 **Phase 1 cycle 26-ben (folyamatban).** Phase 2-3 külön cycle-ekben. Phase 4 külön plan + green-light.

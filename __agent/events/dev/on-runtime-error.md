# Event — on-runtime-error

> **Runtime hiba** a futó server / client / cli alkalmazásban. Forrás:
> errors-tábla (server SQLite), action-log `kind: "error"` entries,
> stderr capture.

## Mikor trigger

- Server errors-table-ben új sor (`getGlobalErrorHandler()` →
  `Errors_DataService.handleInternalError()`)
- `__agent/log/actions/<today>.jsonl` `kind: "error"` `actor in [server, cli, client]`
- Browser console error (client) — Phase 2+ ha frontend monitoring beépül
- CCAP / CLI tool crash (uncaught exception)

## Phase 1 megjegyzés

**Server errors-table:** a my-assistant server-en (`server/`) tervezve, de a
Phase 1 skeleton-ben **még nincs aktív** `Errors_DataService`. Az
error-handling principle (`current/principles/error-handling.md`) szerint
**minden fejlesztésnél debug-level error handling, semmi csendes swallow**.

**Action-log:** működik (FR `automatic-status-recording.md` + jelen
`__agent/log/actions/`). Az itteni `kind: "error"` entries adják a primary
forrást Phase 1-ben.

## Detekció

| Forrás | Phase | Mit ad |
|---|---|---|
| `__agent/log/actions/<today>.jsonl` `kind:"error"` | **Phase 1** ✅ | utolsó N error, actor + summary + extra |
| `server/data/*.sqlite` `errors` table | Phase 2 | full stack + context |
| Browser console (client) | Phase 2 | UI runtime exceptions |
| `fdp errors --range 24h` (Overseer integráció után) | Phase 2 | cross-project nézet |

## Mit csinálj

1. **Olvasd be** az utolsó 24h error-entry-ket az action-log-ból:
   ```
   grep '"kind":"error"' __agent/log/actions/<today>.jsonl
   ```

2. **Kategorizálás:**
   - **Saját új kód okozza** (utolsó cycle érintette ezt a fájlt) → fixáld
     inline, vissza `06-implement`
   - **Külső dependency** → `events/dev/on-package-issue.md`
   - **User-facing bug** (chat-from-user vagy diary-jelzés) → magas prio,
     fixáld
   - **Tranziens** (network / timeout, nem reprodukálható) → log csak, ne fix
   - **Ismeretlen / kontextus-hiányos** → `events/dev/on-user-needed.md`

3. **Root cause fix, nem swallow:**
   - `current/principles/error-handling.md` szerint: SEMMI csendes catch
   - Ha catch kell → log + re-throw / propagate; default = propagate

4. **STATUS_DEV update:**
   ```yaml
   last_cycle:
     build_status: success      # runtime != build
   phase_notes: |
     Runtime error fix: <component>, <hibaüzenet>. Root-cause: <...>.
   ```

5. **Maximum 3 javítási próbálkozás** — utána `events/dev/on-user-needed.md`

## Action-log emit (saját fix-műveletekhez)

```json
{ "kind": "ship",
  "summary": "Runtime fix: <component>, root-cause=<...>",
  "ref": "<érintett fájl>",
  "extra": { "error_kind": "...", "fixed_in": "..." } }
```

## Priority

A `03-collect-tasks` priority-sorrendben **#0c** — LDP + CDP után, de
mindenki más előtt. Runtime error = a user / rendszer aktívan használja és
hibásan működik → kötelező javítás minden FR-fejlesztés előtt.

## Pattern-ref

- `current/principles/error-handling.md` (debug-level, no swallow)
- Organizer server (`Errors_Controller`, `Errors_DataService`) — referencia
  implementáció (Phase 2-höz amikor a my-assistant server is felveszi)

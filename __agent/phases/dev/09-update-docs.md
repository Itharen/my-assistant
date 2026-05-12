# Phase 09 — Update docs

> FR-status, plan-step, architecture, CHANGELOG, README sync.

## Mit csinálj

1. **FR Status frissítés** — minden érintett `current/feature-requests/<fr>.md`:
   - `🟢 Aktív` → `✅ Shipped` (ha kész)
   - `🅿️ Parkolva` → `🟢 Aktív` (ha most kezdődött)
   - `🟡 Várakozó (kérdéssel)` (ha clarification kell — lásd `events/dev/on-user-needed.md`)

2. **Plan-step ✅ jelölés** az érintett plan-fájlokban
   - `__agent/plans/<plan>.plan.md` Phase táblázat sora
   - Ha a plan teljes → `Status: ✅ Shipped` a plan-fájl alján

3. **Architecture frissítés** ha új komponens / új réteg:
   - `current/architecture.md` L1-L5 tábla
   - `__agent/references/architecture.md` impl-szint

4. **CHANGELOG** (ha van — `__documentations/CHANGELOG.md`):
   - Új cycle entry dátummal + commit-sha placeholderrel

5. **Backlog frissítés** (`__agent/triggers/development-agent-backlog.md`):
   - Shipped FR-ek → ✅ szakaszba
   - Új FR-ek → megfelelő hullámba

6. **README** szinkronizálás a megfelelő projekt-mappákban
   (`cli/README.md`, `server/README.md`, `client/README.md`)

## Action-log emit

```json
{ "kind": "ship", "summary": "Docs frissítve: FR=X (Shipped), plan-step=Y, architecture",
  "extra": { "fr_changes": [...], "plan_steps_done": [...] } }
```

## STATUS_DEV update

```yaml
last_cycle:
  fr_status_changes:
    - { frPath: "...", fromStatus: "🟢 Aktív", toStatus: "✅ Shipped" }
  plan_steps_marked_done:
    - { planPath: "...", stepRef: "Phase 1" }
```

## Kilépés

`STATUS_DEV.phase` → `commit-push`

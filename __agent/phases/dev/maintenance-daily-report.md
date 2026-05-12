# Phase Maintenance — Daily Report

> Napi outcome-riport (előző nap összefoglaló).

## Mikor fut

- Új naptári nap első cycle-jében (Europe/Budapest)
- Csak egyszer / nap

## Mit csinálj

1. **Tegnapi action-log átfutása** (`__agent/log/actions/<yesterday>.jsonl`)

2. **Riport-fájl írása:** `__agent/reports/YYYY-MM/YYYY-MM-DD.md`
   ```markdown
   # Daily Report — <yesterday>

   ## Outcome
   - <1-3 mondat — mit hozott a nap>

   ## Cycles
   - Cycle N: <anchor>, commit-sha, FR-shipped

   ## Stats
   - FR shipped: K
   - Plan-step done: L
   - Builds passed/failed: P/Q
   - Action-log entries: R

   ## Open
   - Blocker / kérdés / clarification needed
   ```

3. **Action-log emit:**
   ```json
   { "kind": "ship", "summary": "Daily report: <yesterday>",
     "ref": "__agent/reports/YYYY-MM/YYYY-MM-DD.md" }
   ```

## Kilépés

`STATUS_DEV.phase` → `idle` (a megszakított cycle-folyamatba vissza)

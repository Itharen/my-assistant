# Phase 00 — Orient (Assist tick)

> Tick belépő. Minden tick rövid (~5-30 mp).

## Mit csinálj

1. **Olvasd be** (NO-CACHE):
   - `__agent/WORKFLOW_ASSIST.md`
   - `__agent/STATUS_ASSIST.md`
   - `__agent/state/assistant-agent-cron-tick.json` (dispatcher belső state)

2. **Last-tick gate (Loop-safety 7. alapelv):**
   - Ha `last_tick.ts + 30 perc > most` → `verdict: no-action`,
     `reason: "throttled — recent tick at <ts>"`, `actions: [log Tier 0]`,
     skip a többi fázist

3. **Sleep-window check (4. alapelv):**
   - `sleep-system.md` képlet vagy activity-monitor infer vagy default 02:00-08:00
   - Eredmény: `STATUS_ASSIST.sleep_state.is_sleeping`
   - Ha alszik → folytasd a tick-flow-t, **de** a Tier 1+ actions gate-eltek lesznek

4. **Phase update:**
   - `phase: orient` → `phase: read-state` után

5. **Action-log:**
   ```json
   { "kind": "flow-start", "summary": "Cron tick: sleeping=<bool>" }
   ```

## Kilépés

`STATUS_ASSIST.phase` → `read-state`

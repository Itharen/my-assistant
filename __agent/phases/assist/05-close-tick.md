# Phase 05 — Close tick

> Tick lezárás: STATUS_ASSIST update + action-log flow-end.

## Mit csinálj

A dispatcher (`cli/scripts/agent-handlers/`) jó részt automatikusan
elvégzi (`flow-end` log + state-frissítés a tick.json-ba). A TE
dolgod itt csak a YAML STATUS_ASSIST frissítése.

## STATUS_ASSIST update

```yaml
phase: idle                                # vissza idle-re
phase_notes: |
  Tick lezárva — <verdict>, <N> action.

last_tick:
  ts: <new ISO>
  tick_counter: <prev+1>
  daily_tick_count: <prev+1 vagy 1 ha új nap>
  current_day: YYYY-MM-DD
  verdict: <verdict>
  reason: <reason>
  actions_succeeded: <N>
  actions_failed: <M>
  actions_skipped: <K>
  is_sleeping: <bool>

sleep_state:
  is_sleeping: <bool>
  source: <forrás>
  inferred_at: <ISO>
  estimated_wake_at: <ISO ha alszik>
```

## Action-log emit (dispatcher fogja)

```json
{ "kind": "flow-end",
  "summary": "Cron tick done: ok=N, failed=M, skipped=K",
  "extra": { "details": [...] } }
```

## Kilépés

`STATUS_ASSIST.phase` → `idle`. A következő tickkor (óránként) újra
`00-orient`-ből indul.

# STATUS_ASSIST — Assistant Agent Cron Job állapot

```yaml
# Tick state (KÖTELEZŐ SSoT)
phase: idle                                # idle | orient | read-state | read-context | decide-verdict | emit-actions | close-tick

phase_notes: |
  Tick #4 lezárva 2026-05-12T17:34+02:00 — verdict=soft-nudge.
  Upwork P=100 lejárt -2 nap (mvp-focus) + 1 missed cleaning + TERA-check
  kedd-esedékes + tej elfogyott. Hullám-vektor lefelé → csendes csatorna
  (USER_INPUT [NEW] entry-vel), NEM hangos notify-cast. Dev Agent párhuzamosan
  cycle 1 phase=orient.

# Last tick metadata (a `cli/scripts/agent-handlers/src/dispatch.ts` is frissíti
# a `__agent/state/assistant-agent-cron-tick.json`-be — itt YAML-szintű duplikáció).
last_tick:
  ts: 2026-05-12T17:34:45+02:00            # ISO timestamp, last tick végén
  tick_counter: 4                          # össz-tick (lifetime)
  daily_tick_count: 1                      # mai naptári napon
  current_day: 2026-05-12                  # YYYY-MM-DD
  verdict: soft-nudge                      # urgens | soft-nudge | no-action
  reason: "Upwork P=100 lejárt -2 nap (mvp-focus releváns), DE hullám-vektor lefelé → csendes csatorna user-input-new entry-vel"
  actions_succeeded: 5                     # 3 log + 1 user-input-new + 1 update-status
  actions_failed: 0
  actions_skipped: 0
  is_sleeping: false                       # bool

# Sleep-state cache (a 04. alapelv detekció eredménye)
sleep_state:
  is_sleeping: false                       # bool — most alszik-e a user
  source: default-fallback                 # sleep-system-formula | activity-monitor-infer | default-fallback
  inferred_at: 2026-05-12T17:34:30+02:00   # ISO
  estimated_wake_at: null                  # ISO (sleep-window end) — N/A, mert nincs aktív sleep

# Pending notifications queue (alvás-vége csomag — Phase 2)
pending_notifications:
  count: 0
  queue_file: __agent/state/pending-notifications.json   # Phase 2

# Recurring miss-tracking
recurring_miss_count:
  cleaning: 1                              # 2026-05-06 szerda missed
  walk: 0
  bath: 1                                  # ~2026-05-10 missed (heti 2× szabály alapján becsült)
  food-order: 0                            # Interfood 05-29-ig fedett
  tera-check: 0                            # ma kedd ELSŐ esedékes — még nem missed
  fit: 0
  health: 0
```

---

## Pointers

- **Workflow**: `__agent/WORKFLOW_ASSIST.md`
- **Fázis-fájlok**: `__agent/phases/assist/`
- **Event-handlerek**: `__agent/events/assist/`
- **Tick log**: `__agent/log/ticks/`
- **Dispatcher belső state**: `__agent/state/assistant-agent-cron-tick.json`

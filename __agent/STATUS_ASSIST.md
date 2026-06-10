# STATUS_ASSIST — Assistant Agent Cron Job állapot

```yaml
# Tick state (KÖTELEZŐ SSoT)
phase: idle                                # idle | orient | read-state | read-context | decide-verdict | emit-actions | close-tick

phase_notes: |
  Tick #69 lezárva 2026-06-04T14:00+02:00 — verdict=soft-nudge.
  24h cron-gap. 0 új [NEW], 0 chat-aktivitás, diary stale 13 nap, 8. silent tick.
  TARTÓS LOW-ENGAGEMENT REGIME (deliberate, NEM welfare-emergency — napi 14:00
  pontos tick-trigger = alive-jel). MA csü 06-04 = Interfood ÚJ instance deadline
  (proaktív 1.0× zóna, legjobb on-time nap a rákövetkező hétre) + TERA-check (csü).
  Cleaning 06-03 elmúlt confirm nélkül → 5 missed. Hózárás 06-02 + TERA státusz
  ISMERETLEN (organizer AUTH-fail). ULTRA-light: on-time Interfood-mention, DE
  NINCS új [NEW]/push. State-tracking a fő érték. Ha Interfood ma slip → escalation
  újraindul, text/tracking-only marad.

# Last tick metadata
last_tick:
  ts: 2026-06-04T14:00:40+02:00
  tick_counter: 69
  daily_tick_count: 1
  current_day: 2026-06-04
  verdict: soft-nudge
  reason: "Interfood új instance deadline MA (proaktív on-time nap) + TERA; cleaning→5; tartós silence (8 tick) → ULTRA-light on-time mention, nincs új [NEW]/push; state-tracking a fő érték"
  actions_succeeded: 4                     # 4 log
  actions_failed: 0
  actions_skipped: 0
  is_sleeping: false

# Sleep-state cache
sleep_state:
  is_sleeping: false
  source: default-fallback                 # 0 activity-data; csütörtök 14:00 > 08:00 default-éber
  inferred_at: 2026-06-04T14:00:40+02:00
  estimated_wake_at: null
  bedtime_window_30min_active: false
  last_wake_event_at: null
  last_sleep_window_start_at: null

# Pending notifications queue
pending_notifications:
  count: 0
  queue_file: __agent/state/pending-notifications.json
  last_delivered_at: 2026-05-29T14:02:00+02:00
  last_delivered_count: 1                  # Interfood-eszkaláció (text-only)
  delivery_target: USER_INPUT.md

# Recurring miss-tracking (06-04 csütörtök)
recurring_miss_count:
  cleaning: 5                              # 06-03 szerda elmúlt confirm nélkül → 5; next szerda 06-10
  walk: 0                                  # uncertain
  bath: 2                                  # uncertain (~24+ nap slip)
  food-order: 0                            # Interfood ÚJ instance deadline MA 06-04 (proaktív zóna, még nem missed)
  tera-check: 2                            # MA csü 06-04 új esedékes (uncertain — organizer AUTH-fail)
  fit: 0                                   # yoga matrac ✅ eszköz
  health: 0                                # arc-mosás napi 3×
  matrac: 0                                # TOP PRIO MVP (P=110); uncertain, NEM auto-increment
  honap-zaras: 0                           # céges hózárás 06-02 — státusz ISMERETLEN (unverifiable)

# Fresh items 2026-06-04
fresh_items_2026_06_04:
  - { type: recurring-due-today, item: "Interfood ÚJ instance deadline", date: "2026-06-04 csü", zone: "proaktív 1.0× (legolcsóbb on-time nap a rákövetkező hétre)", note: "előző ciklus moot-ként lezárva; jövő-heti kaja-státusz ismeretlen → ez duplán fontos lehet" }
  - { type: recurring-due-today, item: "TERA-check (csü)", note: "2 missed; organizer AUTH-fail → nem verifikálható" }
  - { type: recurring-missed, item: "Cleaning", note: "06-03 elmúlt confirm nélkül → 5 missed; next szerda 06-10" }
  - { type: status-unknown, item: "Céges hózárás (06-02)", note: "unverifiable; ha nem készült el → havi-zárás csúszik" }
  - { type: presence-concern, item: "diary stale 13 nap + 8 silent tick", note: "deliberate low-engagement (napi pontos tick = alive-jel), NEM emergency" }

# Carry-over (05-22, 05-23)
fresh_items_carry:
  - { type: shopping-done, item: "Tesco/Decathlon/IKEA mind ✅", carry_open: ["IKEA kiskuka", "Skechers cipő"] }
  - { type: principle-update, files: ["shopping-lists.md (Tesco nap-feloldás)", "health-system.md (napi matrac TOP PRIO MVP)"] }
  - { type: top-prio-mvp, item: "napi matrac (minden nap kötelező lefekvés)", priority: 110, daily: true }
  - { type: domain2-fr, file: "ntfy-push-notification.md (#5b)", redirect: "Dev Agent (AGB-22-01)" }
  - { type: user-directive, value: "kevesebb chat-foglalkozás → low-nudge", impact: "csak kritikus exception → szabad új [NEW]" }
  - { type: domain2-devops, item: "NPM token rotation 2026-08-20" }

# Cron-loop health
cron_health:
  recent_gaps: ["24h (#58→#59)", "24h (#59→#60)", "24h (#60→#61)", "48h (#61→#62)", "72h (#62→#63)"]
  cause: "cron-loop external skip — instabil cadence; 05-28 deadline-napon NEM futott tick → ígért Interfood-reminder elmaradt"
  impact: "context-staleness; deadline-nap kihagyása konkrét kárt okozott (csü reminder elmaradt)"
  note: "chat-Claude pótolja a friss kontextust; assist-cron csak state-tracking + critical-exception push. ⚠️ a megbízhatatlan cadence miatt a deadline-ráutalt remindereket NEM lehet egyetlen jövőbeli tickre bízni"
```

---

## Pointers

- **Workflow**: `__agent/WORKFLOW_ASSIST.md`
- **Fázis-fájlok**: `__agent/phases/assist/`
- **Event-handlerek**: `__agent/events/assist/`
- **Tick log**: `__agent/log/ticks/`
- **Dispatcher belső state**: `__agent/state/assistant-agent-cron-tick.json`

# Event — on-sleep-window-start

> Bedtime-ablak közeleg (~30 perc múlva alvás).

## Trigger

- `sleep-system.md` képlet: `wakeAt + 18h` előtti 30p
- VAGY: activity-monitor 30+ perces csendes idle éjjel

## Mit csinálj

1. **Bedtime reminder** notify-cast (ha éber):
   ```json
   { "type": "notify-cast", "tier": 1,
     "args": { "text": "Lefekvési ablak nyitva — ~30 perc múlva alvás-window.",
               "target": "All Speakers", "throttleId": "bedtime-reminder" } }
   ```

2. **Pending notifications check** (`__agent/state/pending-notifications.json`):
   ha van halmozódó alvás-vége csomag, NE most küldd — várjon ébredésig

3. **STATUS_ASSIST update:**
   ```yaml
   sleep_state:
     estimated_sleep_at: ISO
   ```

## Action-log emit

```json
{ "kind": "note", "summary": "Sleep-window közeli — bedtime reminder elküldve" }
```

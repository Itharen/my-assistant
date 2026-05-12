# Event — on-sleep-window-end

> Ébredés-detektálás → alvás-vége csomag delivery.

## Trigger

- `sleep-system.md` képlet vége (`sleepAt + 7-9h`)
- VAGY: activity-monitor friss aktivitás hosszú idle után
- VAGY: user chat-üzenet a tickek között

## Mit csinálj

1. **Wake-event log:**
   ```json
   { "kind": "note", "summary": "Sleep-window vége: wake detected" }
   ```

2. **Pending notifications csomag delivery:**
   `__agent/state/pending-notifications.json`-ből vegyél ki minden
   elmaradt notif-ot, és összevontan add ki:
   ```json
   { "type": "notify-cast", "tier": 1,
     "args": { "text": "Jó reggelt! Alvás alatt N esemény: <összegzés>",
               "target": "All Speakers", "throttleId": "wake-bundle" } }
   ```
   + `ccap-notify` `--type message --priority info` a részletes lista
   (csendes csatorna)

3. **Daily summary:**
   - Mai esedékes recurring task-ok
   - Lejárt deadlinek
   - Open kérdések

4. **Pending queue clear:** a `pending-notifications.json`-ben mark all as
   `delivered`

5. **STATUS_ASSIST update:**
   ```yaml
   sleep_state:
     is_sleeping: false
     source: <forrás>
   pending_notifications:
     count: 0
   ```

## Action-log emit

```json
{ "kind": "flow-end",
  "summary": "Wake-bundle delivered: N esemény, daily summary kész" }
```

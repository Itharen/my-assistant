# Event — on-user-input

> `USER_INPUT.md` `[NEW]` + `domain: tasks/calendar/stock/diary/recurring/…`

## Mit csinálj

1. **Olvasd be** a `[NEW]` blokk teljes tartalmát
2. **Domain ellenőrzés**: `domain: dev` → NE érintsd (Dev Agent dolga)
3. **Kategorizáld** a `kind` mező szerint:
   - `task` → új feladat → `task-create` (Tier 2, ha clear-rule) vagy `user-input-new` Tier 1
   - `feedback` → principle update → csak user-OK után (`events/assist/on-user-needed.md`)
   - `instruction` → konkrét akció (pl. "ezt rakd a stock-ba")

4. **Action-log:** `kind: user-msg`, ref a USER_INPUT blokk-címhez

5. **Blokk lezárás:** `[NEW]` → `[DONE]` + Response

6. **Visszatérés** a tick-flow-ba — a verdict-be tedd "urgens" zónába
   (user input mindig elsőbbség)

## Action-log emit

```json
{ "kind": "decision",
  "summary": "User input felvéve (Domén 1): <title>" }
```

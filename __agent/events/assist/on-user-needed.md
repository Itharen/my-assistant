# Event — on-user-needed

> Bizonytalan input / ütköző szabály / clarification kérés.

## Mikor trigger

- 2 recurring szabály ütközik (pl. fürdés tiltott 00:00-07:00, de a séta-slot is)
- Egy task `dueDate`-je hiányzik vagy ellentmondó
- Egy USER_INPUT blokk értelmezhetetlen
- Stock-item státusza nem világos (rákcsa vs rágcsa típusú STT-bizonytalan)

## Csatorna-választás

| Sürgősség | Csatorna |
|---|---|
| **Most azonnal kéne válasz** | `ccap-notify --type question --wait` (Phase 2) |
| **Normál ütemben** | `user-input-new` Tier 1, `kind: instruction`, megfelelő `domain` |
| **Long-term (hetes)** | (Phase 2) `open-question-add` → AA) Dev vagy más kategória |

## Munka-folytatási szabály

- **Nem-blokkoló** (más task-ot tudsz végezni) → kérdezés után folytatás
- **Blokkoló** (más nincs) → `verdict: no-action` "blokkolva — Q-... választra vár"

## Action-log emit

```json
{ "kind": "note",
  "summary": "User needed (Cron): <téma>, csatorna=<X>, blokkolt=<bool>" }
```

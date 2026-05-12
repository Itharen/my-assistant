# Event — on-missed-recurring

> Recurring rule 1+ cycle missed.

## Trigger

A `02-read-context`-ben:
- `recurring-tasks.md` táblát végigfutva
- `last_done` + `cycle_length < now` ÉS `recurring_miss_count.<task>` > 0

## Súlyozás

| Missed cycles | Verdict |
|---|---|
| 1 missed | `soft-nudge` (csendes user-input-new) |
| 2+ missed | `urgens` (notify-cast + user-input-new + halogatás-szorzó) |

## Halogatás-szorzó (priority-system.md)

Ha egy `task-create` vagy `task-update` action a recurring miss-re reagál:
- `args.priority = base × halogatás-szorzó` (pl. 90 × 1.5 = 135)
- `args.description`-be: "Forrás-szabály: recurring-tasks.md <task> missed N cycle"

## Action példa

```json
{ "verdict": "urgens",
  "reason": "Walk: utolsó 2026-05-04, ma 2026-05-12 → 8 missed cycle",
  "actions": [
    { "type": "notify-cast", "tier": 1,
      "args": { "text": "Sétálni kéne — 8 napja nem volt.",
                "throttleId": "walk-miss" } },
    { "type": "task-create", "tier": 2,
      "args": { "title": "🚶 Séta — esedékes",
                "description": "Forrás-szabály: recurring-tasks.md walk missed 8 cycle (halogatás-szorzó 2.0)",
                "priority": 180 } }
  ] }
```

## Action-log emit

```json
{ "kind": "decision",
  "summary": "Missed recurring: <task> N cycle missed" }
```

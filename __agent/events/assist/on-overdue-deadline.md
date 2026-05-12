# Event — on-overdue-deadline

> Task `dueDate` lejárt + nincs `done`.

## Trigger

A `02-read-context`-ben `fo tasks.list` output: van `dueDate < now`
és `done == false` task.

## Mit csinálj

1. **Súlyozás priority + idő-eltelés szerint:**

| P-érték | Idő-eltelés | Súly |
|---|---|---|
| P >= 100 | <2h lejárt | **kritikus** — notify-cast hangos |
| P >= 100 | 2-24h | **urgens** — notify-cast + user-input-new |
| P >= 100 | >24h | **eszkalálódó** — task-update priority+10 (Tier 2) + user-input-new |
| P 80-99 | bármilyen | soft-nudge — user-input-new csendes |
| P <80 | bármilyen | log only |

2. **Sleep-aware gate:** ha alszik → pending-notifications-ba teszi
3. **Throttle:** ugyanaz a task-ref 4 órán belül max 1× notify

## Action példa

```json
{ "verdict": "urgens",
  "reason": "Task <X> lejárt 2026-... — P=105",
  "actions": [
    { "type": "notify-cast", "tier": 1,
      "args": { "text": "Lejárt task: <title>",
                "throttleId": "overdue-<task-id>" } },
    { "type": "user-input-new", "tier": 1,
      "args": { "title": "Lejárt: <title>", "kind": "task", "domain": "tasks",
                "body": "..." } }
  ] }
```

## Action-log emit

```json
{ "kind": "decision", "summary": "Overdue deadline: <task> — P=<X>, idő-eltelés=<Y>" }
```

# Phase 02 — Read context

> Asszisztensi kontextus olvasás (recurring, diary, organizer-tasks, activity).

## Mit olvass be

1. **`current/principles/recurring-tasks.md`** (Strukturált összefoglaló tábla)
   - Mely recurring szabályok aktívak
   - Utolsó-elvégzés dátumok
2. **`current/diary/diary.md`** (utolsó nap)
   - Mai státusz, energia-level, halasztott események
3. **`fo tasks.list --filter '{"done":false}' --limit 30`** (organizer)
   - dueDate közeli / lejárt task-ok
   - Magas-prio (P >= 100) tételek
4. **`activity-monitor/data/<today>.jsonl`** utolsó 30 perc
   - Aktív / idle
5. **`current/projects.md`** + **`current/life-goals.md`** + **`current/principles/mvp-focus.md`**
   - Pénzkereső projekt-state, hosszú-távú irány

## Recurring miss-detekció

A `recurring-tasks.md` táblát végigjárva:
- `cleaning`: utolsó vs ma — missed cycles
- `walk`, `bath`, `food-order`, `tera-check`, `fit`, `health`

Frissítsd a `STATUS_ASSIST.recurring_miss_count`-ot.

## Action-log emit

```json
{ "kind": "note", "summary": "Read-context: K lejárt task, M missed recurring",
  "extra": { "overdue_tasks": K, "missed_recurring": {...} } }
```

## Kilépés

`STATUS_ASSIST.phase` → `decide-verdict`

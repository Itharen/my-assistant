# Phase 01 — Read state

> A friss állapot olvasása (NO-CACHE, 5. alapelv).

## Mit olvass be

1. **`__agent/STATUS.md`** — globális chat-state (last_event, active_plans, next_action)
2. **`__agent/STATUS_DEV.md`** — a Dev Agent állapota (cycle, phase, active_plan)
3. **`__agent/USER_INPUT.md`** — van-e `[NEW]` blokk?
   - `domain: tasks/calendar/stock/diary/recurring/...` → a TE feladatod
   - `domain: dev` → NE érintsd (Dev Agent dolga)
4. **`__agent/log/actions/<today>.jsonl`** utolsó 100 sor — mi történt
   (chat, Dev Agent, user)

## Interrupt check

Ha `[NEW]` `domain: <Domén-1>` blokk → folytasd a fázis-flow-t,
de `03-decide-verdict`-ben tedd be a "urgens" zónába (felhasználói
input mindig elsőbbség).

## STATUS_ASSIST update

A `phase_notes`-be 1-2 sor: mit találtál (pl. "3 [NEW] domain=tasks,
Dev Agent cycle=2 phase=implement").

## Action-log emit

```json
{ "kind": "note", "summary": "Read-state: USER_INPUT N [NEW], Dev Agent phase=<X>",
  "extra": { "user_inputs_new": N, "dev_phase": "..." } }
```

## Kilépés

`STATUS_ASSIST.phase` → `read-context`

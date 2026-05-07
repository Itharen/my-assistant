# STATUS

```yaml
state: idle
active_flow: null
active_phase: null
last_event: 2026-05-07T16:42:00+02:00
last_event_type: principles-bootstrap + new-tasks

active_plans: []

notes: |
  User egy nagyobb input-set-et adott: korábbi session összefoglaló + new
  szabály-deklarációk (working style, prioritás-rendszer, ismétlődő feladatok,
  stock-rendszer, Google Home integráció kérés).

  Új struktúra:
  - current/principles/ létrehozva 4 fájllal (working-style, priority-system,
    recurring-tasks, stock-system) — user szövegei SZÓ SZERINT őrizve
  - CLAUDE.md bővítve: working style szakasz, időkezelés szakasz, alapelv-rögzítési meta-szabály

  Új organizer task-ok (3 db):
  - org:task:69fca4a1d440d3f484cedef9 — Céges hózárás (P=110, dueDate=ma)
  - {kaja-rendelés ref a diary-ben — P=105, dueDate=ma 22:00}
  - {Google Home research — P=50, no deadline}

  Diary entry 2026-05-07 felvéve a state-info-kkal (runners kész, agentek 2.5/4,
  Nietzsche dataset majdnem kész, hózárás új P1, gamedev extra).

  Open kérdések / nyitott szálak:
  - Mikor migráljuk a recurring-tasks szabályokat organizer-be? (most lokál szöveg)
  - Stock-rendszer: első konkrét item-eket mikor kezdjük felvenni?
  - Notifikáció / wakeup mechanizmus — Google Home integráció research blokkol
```

## Állapot átmenetek

- `idle` → új flow indítható (lásd `WORKFLOW.md` belépési pontok)
- `flow-active` → `active_flow` és `active_phase` ki van töltve
- `awaiting-input` → `USER_INPUT.md`-ben várok `[NEW]` blokkra
- `awaiting-approval` → user jóváhagyásra várok valamit (plan, action)
- `paused` → manuálisan szüneteltetve

## Mezők

| Mező | Típus | Leírás |
|---|---|---|
| `state` | enum | `idle` / `flow-active` / `awaiting-input` / `awaiting-approval` / `paused` |
| `active_flow` | string\|null | Pl. `recurring/daily-review`, `on-demand/month-closing` |
| `active_phase` | string\|null | A flow aktuális fázisa (`_intake`, `_subflow-1-...`, `_close`) |
| `last_event` | ISO timestamp | Utolsó esemény ideje |
| `last_event_type` | string | Pl. `user-input`, `flow-start`, `flow-complete`, `bootstrap` |
| `active_plans` | array | Aktív terv-fájlok listája (`plans/` alól) |

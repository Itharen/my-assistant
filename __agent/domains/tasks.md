# domain: tasks

## Scope

Egyedi feladatok és feladat-csoportok. Prioritás, deadline, blokkolók, projekt-hozzárendelés.

## Adatfájl

`data/tasks.md`

## Formátum

```markdown
# tasks

## Today
- [ ] {feladat címe} (P0)
  - Domain/projekt: {opcionális}
  - Deadline: {YYYY-MM-DD vagy "ma"}
  - Becslés: {óra}
  - 🚫 Blokkolva: {ha van}

## This week
- [ ] ... (P1)

## This month
- [ ] ... (P2)

## Backlog
- [ ] ... (P3)

## Done — {YYYY-MM} (archive)
- [x] ... (lezárva: YYYY-MM-DD)
```

## Kötelező mezők új feladatnál

- **Cím** — egy mondat
- **P-szint** — P0/P1/P2/P3 (lásd `WORKFLOW.md` prioritás-séma)

## Opcionális mezők

- Deadline, becslés, projekt, blokkoló, sub-task-ok

## Érintett flow-k

- `recurring/daily-review` — `Today` szekció karbantartása
- `recurring/weekly-planning` — `This week` szekció
- `on-demand/month-closing` — `This month` + `Done` archive
- `event-based/on-deadline-warning` — figyel a Today/This week deadline-okra
- `event-based/on-user-input` (task típus) — új feladat felvétel

## Migráció organizer-be

Mező map:

| my-assistant | organizer (`task.data-model.ts`) |
|---|---|
| Cím | `name` |
| P-szint | `priority` |
| Deadline | `dueDate` |
| Becslés | `estimatedHours` |
| Blokkoló | `blockedBy` |
| Sub-task | `subtasks` |

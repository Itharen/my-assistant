# Event — on-interrupt-resume

> Széttört cycle folytatása: a tick előző fázisban félbeszakadt.

## Mit csinálj

1. **Olvasd be** `STATUS_DEV.phase` + `phase_notes` mezőt
2. **Rekonstruáld** mit csináltál legutóbb az action-log alapján:
   - `__agent/log/actions/<today>.jsonl` utolsó 50 sor `actor: development-agent`
3. **Folytatás-döntés:**

| Fázis | Akció |
|---|---|
| `orient` | Ugorj `phases/dev/00-orient.md`-re — onnan friss-újraindít |
| `cleanup-git` | `git status` újraellenőrzés, folytasd `01-cleanup-git`-ből |
| `audit` | Build/test re-run, `02-audit` |
| `collect-tasks` | Backlog re-read, `03-collect-tasks` |
| `investigate` | `04-investigate` re-iteráció |
| `plan-package` | A `STATUS_DEV.package` mező alapján folytasd |
| `implement` | `STATUS_DEV.last_cycle.files_modified` alapján nézd meg melyik file-on tartottál — folytatás onnan |
| `review` | `07-review` re-run |
| `verify-local` | `08-verify-local` re-run |
| `update-docs` | `09-update-docs` re-run |
| `commit-push` | Ha pending changes vannak → `git status` + folytatás. Ha már commitolva → `13-close-cycle` |
| `close-cycle` | Cycle-log írás + `STATUS_DEV.phase: idle` |

## Action-log emit

```json
{ "kind": "note",
  "summary": "Interrupt resume: phase=<X> → folytatás",
  "extra": { "previous_phase": "...", "next_action": "..." } }
```

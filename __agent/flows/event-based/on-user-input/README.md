# on-user-input

**Trigger:** `USER_INPUT.md` legalább egy `[NEW]` blokkot tartalmaz.

## Cél

Új user input parse + routing.

## Lépések

1. Olvasd `USER_INPUT.md` — szedd ki az összes `[NEW]` blokkot, legrégebbiek először
2. Minden blokkra:
   - Detektáld a **típust** (task / feedback / approval / rejection / feature-request / instruction)
   - Detektáld a **domain**-t (vagy `meta` ha rendszerről szól)
   - Routing:

| Típus | Művelet |
|---|---|
| `task` | Adj hozzá `data/{domain}.md`-hez, P-szint becslés, esetleg jóváhagyás |
| `feedback` | Mentsd `log/feedback/{YYYY-MM-DD}.md`-be, ha tartós → `__agent/CONTEXT.md` v. memory |
| `approval` | Folytasd a függőben lévő flow-t / akciót |
| `rejection` | Toldalékold a plan-t / állítsd le az akciót |
| `feature-request` | `plans/` alá draft, jóváhagyás után implement |
| `instruction` | Alkalmazd most + ha tartós → memory-be |

3. Minden feldolgozott blokkot átírj `[NEW]` → `[DONE]` + feldolgozási metaadat

## Output

- Kívánt flow-k elindítva, vagy adatok frissítve
- `STATUS.md` frissítve a következő művelet szerint

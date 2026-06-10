# Phase 00 — Orient

> Belépési pont. Minden cycle ezzel indul.

## Mit csinálj

1. **Olvasd be** (NO-CACHE):
   - `__agent/WORKFLOW_DEV.md` — alapelvek emlékeztetője
   - `__agent/STATUS_DEV.md` — aktuális állapot
   - `__agent/USER_INPUT.md` — van-e `[NEW]` `domain: dev`?
   - `__agent/AGENT_BUS.md` — van-e `[OPEN]` `To: dev-agent` bejegyzés?

2. **Interrupt-check:**
   - Van `[NEW]` `domain: dev`? → ugrás `events/dev/on-user-input.md`-re,
     **utána** vissza ide
   - Van AGENT_BUS `[OPEN]` `To: dev-agent`? → dolgozd fel **mielőtt** a fázis-flow-t folytatnád:
     - `kind: green-light` → emeld be az `active_plan`-be (skip user-OK)
     - `kind: question` → válasz a bus-ba ANSWERED-del
     - `kind: announcement` → tudomásul (action-log note)
     - `kind: request` → cselekedj vagy answer-elj vissza miért nem
     - státusz → `ACTED` vagy `ANSWERED`
   - `STATUS_DEV.phase` szerint félbehagyott? (pl. `phase: implement` +
     `phase_notes` "interrupted") → `events/dev/on-interrupt-resume.md`

3. **Cycle-indítás döntés:**
   - Növeld a `cycle` mezőt `STATUS_DEV`-ben (`cycle: N` → `N+1`)
   - `phase: orient` → maradj itt amíg dönts
   - `phase_notes`-be írd a cycle-indító kontextust (1-2 mondat)

4. **Plan vs candidate döntés** (KRITIKUS, lásd 5. alapelv):
   - Van aktív plan (`active_plan.path != null` + `steps_remaining > 0`)?
     → folytasd a plan szerint (`phases/dev/05-plan-package.md`-be ugorj
     vissza a megfelelő plan-step-tel)
   - Nincs aktív plan? → folytasd a fázis-flow-t (`01-cleanup-git`)

5. **Action-log emit:**
   ```json
   { "kind": "flow-start", "summary": "Dev cycle N indul",
     "extra": { "cycle": N, "active_plan": "...", "phase": "orient" } }
   ```

6. **STATUS_DEV.phase** → `cleanup-git` (vagy `plan-package` ha plan-folytatás)

## Output

A `00-orient` nem ad ki `verdict`-et közvetlenül — átmenet a következő
fázisra. Csak ha **mind a fázisok kész** (vagy szándékosan kihagyhatóak),
akkor jön a `verdict` és az `actions[]`.

## Kilépés

- Plan-folytatás → ugrás `phases/dev/05-plan-package.md`
- Új cycle → ugrás `phases/dev/01-cleanup-git.md`

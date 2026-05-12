# Event — on-user-input

> `USER_INPUT.md` `[NEW]` blokk + `domain: dev` érkezett.

## Mit csinálj

1. **Olvasd be** a `[NEW]` blokk teljes tartalmát
2. **Kategorizáld** a `kind` mező szerint:
   - `task` → új feladat → backlog-ba vagy meglévő FR módosítás
   - `feedback` → workflow / pattern korrekció → principle update (csak user-OK után — `events/dev/on-architecture-decision.md`)
   - `approval` → Tier 3 javaslat OK-zás
   - `rejection` → cancel az aktuális plan-step / cycle
   - `feature-request` → új FR `current/feature-requests/`-be
   - `instruction` → konkrét cycle-akció

3. **Action-log:** `kind: user-msg`, ref a USER_INPUT blokk-címhez

4. **Blokk lezárás:** `[NEW]` → `[DONE]` + Response: `<mit csináltál>`
   (a meglévő mechanizmus szerint a chat helyett **te** lezárod a blokkot)

5. **Visszatérés:** a megszakított fázis-flow-ba (lásd `STATUS_DEV.phase_notes`-ben
   merre tartottál)

## Cluster-bundling

Ha a `[NEW]` blokk **több kapcsolódó tételt** említ, alkalmazd a related-cluster
discovery elvet (CCAP-minta 26. alapelv): bundleold a cycle-be vagy plan-be.

## Action-log emit

```json
{ "kind": "decision",
  "summary": "User input felvéve: <title>, kind=<X>, akció=<Y>" }
```

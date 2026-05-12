# Event — on-architecture-decision

> Nagy architekturális elágazás vagy workflow-doc módosítás → user-OK kell.

## Mikor trigger

- Új komponens-réteg (L1-L5) → `current/architecture.md` érintett
- Új principle / workflow-doc módosítás
- Cross-projekt függőség új-bevezetés
- FDP-mintát sértő új konstrukció (egyedi indok kell)
- `system-components.md` 7-komponens listájához bővítés / módosítás

## Mit csinálj

1. **NE módosítsd autonóm** — Tier 3-jellegű döntés
2. **USER_INPUT [NEW]** blokk létrehozás:
   - `title: "Architecture decision: <téma>"`
   - `kind: approval`
   - `domain: dev`
   - `body`: a kontextus + a 2-3 alternatíva + recommendation (ha van)

3. **Az aktuális cycle megáll** ezen a fázison — `STATUS_DEV.phase_notes`:
   "Várakozva architecture-decision Q-... választra"

4. **Action-log emit:**
   ```json
   { "kind": "decision",
     "summary": "Architecture decision posed: <téma>",
     "extra": { "alternatives": [...], "recommendation": "..." } }
   ```

5. **Folytatás** a következő tickkor — ha a user válaszolt, `events/dev/on-user-input.md`
   feldolgozza; ha nem, `verdict: no-action` "blokkolva user-input-ra".

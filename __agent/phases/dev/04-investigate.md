# Phase 04 — Investigate

> Pattern-ref keresés, kódbázis-mapping, spec olvasás.

## Mit csinálj

1. **Pattern-referencia keresés** (7. alapelv):
   - `current/architecture.md` L1-L5 — melyik rétegbe tartozik
   - `__agent/references/architecture.md` — tri-tier impl-minta
   - ⭐ **DEFAULT mintaforrás: `master-prompter`** (lásd WORKFLOW_DEV 7. alapelv)
     - `E:\Programming\Own\CURSOR\LIVE-projects\master-prompter\server\` — server-minta
     - `E:\Programming\Own\CURSOR\LIVE-projects\master-prompter\client\` — client-minta
     - Auth integráció, interceptors, guards, language service, FDP-naming
   - Másodlagos: `organizer` server + client
   - Hasonló feature a meglévő my-assistant kódbázisban (Grep / Glob)
   - FDP-stack minták ha applicable

2. **Érintett fájlok mapping:**
   - Új feature → új fájlok hova kerülnek
   - Refactor → mely fájlok érintettek (Grep imports / references)

3. **Spec konzultáció:**
   - `__specifications/` (ha van projekt-spec)
   - Érintett `current/feature-requests/<fr>.md` "Acceptance" / "Phase-elés"
   - Érintett `__agent/plans/<plan>.plan.md`

4. **Open kérdések ellenőrzés:**
   - `current/open-questions.md` van-e h-fontosság amire most ki kellene
     térni?
   - Ha ütközés / bizonytalanság → `events/dev/on-user-needed.md`

## Action-log emit

```json
{ "kind": "note", "summary": "Investigate: pattern=<ref>, érintett N fájl",
  "extra": { "pattern_ref": "...", "affected_files": [...] } }
```

## STATUS_DEV update

A `phase_notes`-be a kulcs-findings (3-5 sor).

## Kilépés

`STATUS_DEV.phase` → `plan-package`

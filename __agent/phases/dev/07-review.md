# Phase 07 — Review

> Pattern-match, architecture-conformance, code-quality.

## Mit csinálj

1. **Pattern-conformance**: a `04-investigate` mintájához viszonyítva
   nézd át a kódot (Read tool a teljes új/módosított fájlok)

2. **Architecture-conformance checklist:**
   - `current/architecture.md` szerinti rétegbe (L1-L5) illik a kód?
   - FDP-naming (ha applicable): `_models`, `_services`, `_routes`,
     `_modules`, `_collections`, postfix-konvenciók
   - Import-rend: Angular core → external → @futdevpro → shared → local

3. **Code-quality:**
   - Egy export per file?
   - 500+ soros fájl van? → refactor-jelölt
   - 3+ input param → object-param?
   - `as` casting → kerülendő
   - Commented-out kód → távolítsd el

4. **Test-coverage** (Phase 1 után releváns):
   - 75% küszöb (CCAP-mintán)
   - Új feature → unit teszt mellette

## Self-review iteráció

Ha review-ban hibát találsz:
- Kis hiba (typo, formatting) → fixáld inline + `STATUS_DEV.phase_notes` log
- Nagyobb hiba → vissza `06-implement`-re

## Action-log emit

```json
{ "kind": "note", "summary": "Review: N kérdés, M-elv megsértés, javítva",
  "extra": { "issues_found": N, "fixed_inline": M } }
```

## Kilépés

`STATUS_DEV.phase` → `verify-local`

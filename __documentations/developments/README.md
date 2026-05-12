# developments/

Dated session-doksik. Egy session vagy egy nagyobb feature lezárásakor egy rövid jegyzet kerül ide a tanulságokról, a kontextusról, hogy később vissza lehessen jönni.

**Convention** (matches `LIVE-projects/organizer/__documentations/developments/` és `ccap-revisioned/__documentations/developments/`):

- **Fájlnév:** `YYYY-MM-DD-<topic>.doc.md` (kebab-case, `.doc.md` postfix)
- **Mappa-szerkezet** (organizer és ccap minta — opcionális, csak ha sok fájl gyűlik):
  - `YYYY-MM/YYYY-MM-DD/<topic>.md`
- **Tartalom:** rövid kontextus, mit csináltunk, mi a tanulság, link a forrás-plan / FR / commit-ra
- **Hatály:** persistent; nem törlődik

## Kapcsolódó

- `__agent/log/actions/<day>.jsonl` — finomabb felbontású action-log (gép-által-parse-olható)
- `__documentations/CHANGELOG.md` — csak release / version-bump milestones
- `__documentations/DECISIONS.md` — csak tartós architektúra-döntések indoklással

A `developments/` jegyzet tipikus tartalom:

```markdown
# YYYY-MM-DD — Topic

## Kontextus
Milyen helyzetben volt a rendszer ebben a session-ben?

## Mit csináltunk
- Lépés 1
- Lépés 2

## Tanulság
Mit tanultunk? Milyen pattern működött / nem működött?

## Linkek
- Plan: __agent/plans/...
- Forrás-FR: current/feature-requests/...
- Commit: <SHA>
```

## Initial state (2026-05-08)

Ez a mappa most még üres. Az első dated jegyzetet az első nagy feature-lezárás után kell ideírni.

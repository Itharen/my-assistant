# Phase 05 — Plan package

> A cycle-csomag, plan-doc vagy master-plan kiválasztása.

## Mód-választás

| Méret | Mód | Output |
|---|---|---|
| **1-5 task / 1-2 fájl-touch / <500 LOC** | **A — cycle-csomag** | Cycle-en belül lezárandó, nincs külön plan-doc |
| **6-15 task / új modul / 500-2000 LOC** | **B — plan-doc** | Új `__agent/plans/<feature>.plan.md` |
| **Master-feature / cross-projekt** | **C — master-plan** | `__agent/plans/master-<feature>.plan.md` |

## A — cycle-csomag

1. A `STATUS_DEV.package.included_in_this_cycle` mezőbe írd a tételeket
2. Folytasd `06-implement`-re

## B — plan-doc

1. Hozz létre `__agent/plans/<feature>.plan.md`-t a 3 projekt-minta szerint:
   - Cél (1 mondat)
   - Scope (IN / OUT)
   - Phase-elés (Phase 0-N)
   - Open kérdések
   - Status
2. `STATUS_DEV.active_plan.path` → új plan-path
3. Az **első Phase-step**-et tedd `package.included_in_this_cycle`-be
4. A többi → `package.deferred_to_plan`

## C — master-plan

- Csak ha tényleg több projekt érintve / hetes-hónapos időskála
- Plan-doc szerkezet kibővítve: time-estimate, dependencies graph
- User-OK kötelező (Tier 3-jellegű) → `events/dev/on-architecture-decision.md`

## Action-log emit

```json
{ "kind": "decision", "summary": "Plan-package: A|B|C mód, anchor=X" }
```

## Kilépés

`STATUS_DEV.phase` → `implement`

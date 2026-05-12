# plans/

Implementációs / architektúra plan-ek **a fejlesztésekhez**. Ne keverjük az `__agent/plans/`-szal — az más célra van.

## Két plan-mappa van — KRITIKUS különbség

| Mappa | Hatály | Mit tartalmaz |
|---|---|---|
| **`__documentations/plans/`** (ez a mappa) | Implementation / architecture | Long-form fejlesztési plan-ek, technikai design-okmányok, refactor-tervek, FDP-pattern decisions |
| **`__agent/plans/`** | Governance / agent workflow | Cycle plan-ek, hyperplan-ek, master-plan-ek (`A-mode-MVP.plan.md`, `refactor-tri-tier.plan.md`) — agent által generált / agent-által-konzumált |

Az `__agent/plans/` plan-jeit **az agent maga is megírhatja és módosíthatja**, az `__documentations/plans/` plan-jei viszont **explicit user / dev döntés**.

## Convention

(matches `LIVE-projects/organizer/__documentations/plans/` és `ccap-revisioned/__documentations/plans/`)

- **Fájlnév:** `<topic>.plan.md` (kebab-case, `.plan.md` postfix)
- **Tartalom:**
  - Cél (1-2 mondat)
  - Indoklás (miért most, miért így)
  - Lépések (sorrendben, idő-becsléssel ha lehet)
  - Acceptance criteria (`[ ]` checkbox-ok)
  - Kockázatok / nyitott kérdések
  - Status (draft / awaiting-approval / approved / in-progress / done / rejected)
- **Hatály:** persistent; lezárt plan-eket archive-olni `__archive/`-ba lehet, de nem kötelező

## Initial state (2026-05-08)

Most még üres. Az első plan akkor kerül ide, amikor egy major feature-implementáció előtt formális tervezés kell.

A jelenleg élő plan-ek mind az `__agent/plans/` alatt vannak (cycle / agent-driven), nem itt.

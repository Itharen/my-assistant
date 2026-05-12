# FR: CCAP-CLI integráció a my-assistant rendszerbe

> **Forrás: a user szövege (2026-05-10).** Eszköz-érkezés várakozóban.

## A user szövege

> Most lefejlesztettem egy sor eszközt és egy extra toolt a CCAP-hez,
> CCAP-CLI-hez, ami elkészíti majd neked a leírást is a CCAP-CLI-hez, de
> még nem ért ki, majd ki fog... Akkor pedig integrálnunk kéne neked a
> CCAP-CLI-t.

## Cél

A CCAP-CLI integrálása a my-assistant rendszerbe — hasonlóan a `fo` CLI-hez,
de a CCAP rendszerrel kommunikál (agent-orchestratio, plan-execution, B-mode
trigger stb.).

## Várakozási státusz

🟡 **Eszköz még nem érkezett** — a user fejleszti, az auto-doc tool generál
majd egy leírást, **az alapján** tudunk integrálni.

Mire vár:
1. CCAP-CLI maga (bin / install path)
2. **Auto-generated leírás** a parancsokról (a tool dolga)
3. Bekötési integráció a my-assistant `__agent/` workflow-iba

## Mit kell csinálni mire megérkezik (előkészítés)

- A `fo` CLI mintáját követni (JSON envelope, action-log emit)
- Hely a referencia-leíráshoz: `__agent/references/ccap-cli.md` (új, később)
- Esetlegesen az A-mode entry-pointban felvenni mint új Input forrás (`ccap-cli ...`)

## Kapcsolódik

- `__agent/references/organizer.md` (`fo` CLI minta)
- `__agent/references/architecture.md` L5 Agent runtime
- `current/feature-requests/ccap-local-stabilization.md`

## Open kérdések

❓ Q-ccap-cli-1: Mikor érkezik az eszköz?
❓ Q-ccap-cli-2: Milyen parancsok várhatóak (subcommand-tree)?
❓ Q-ccap-cli-3: Auth (lokál bearer / OAuth / nincs)?
❓ Q-ccap-cli-4: A leírás-generátor formátuma (markdown / JSON / OpenAPI)?

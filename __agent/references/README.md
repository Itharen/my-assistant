# references/

Külső rendszerek dokumentációs jegyzetei. Nem authoritative — az adott rendszer
forráskódja az igazság-forrás (single source of truth).

Ezek a jegyzetek arra valók, hogy:
- a my-assistant rendszer hivatkozhasson a külső rendszer fő pontjaira (URL-ek, parancsok)
- migrációs döntéseknél (pl. organizer-be költözés) gyors kontextust adjanak
- ne kelljen minden session elején újra végigfésülni a külső projekt szerkezetét

> **Fontos:** ez a mappa AI-quick-ref célú jegyzeteket tartalmaz. A formális,
> projekt-szintű dokumentáció a `__documentations/`-ban, a business / functional
> spec a `__specifications/`-ban él. A három együtt:
>
> - **`__specifications/`** → mit kell csinálnia a rendszernek (üzleti / funkcionális spec, FDP minta)
> - **`__documentations/`** → hogyan van megépítve (architecture, decisions, changelog, local dev env, dated session-doksik)
> - **`__agent/references/`** → AI-quick-ref jegyzetek (workspace inventory, tri-tier architektúra-ref, pattern-audit, organizer integráció)

## Aktuális referenciák

### Workspace-szintű (átfogó)

| Fájl | Mit fed le |
|---|---|
| [`workspace-projects.md`](workspace-projects.md) | **Teljes workspace inventory** — FDP/NPM/OGS projektek + központi documentations/ + per-project doc-belépők (absolut path-okkal) |

### my-assistant projekt-belső

| Fájl | Mit fed le |
|---|---|
| [`architecture.md`](architecture.md) | my-assistant tri-tier (cli/server/client) architektúra — endpoints, DB séma, naming, setup |
| [`pattern-audit.md`](pattern-audit.md) | Pattern-megfelelőségi audit: cli/server/client vs organizer minta — compliance, szándékos eltérések, roadmap |

### Külső rendszerek (organizer-fókusz)

| Fájl | Mit fed le |
|---|---|
| [`organizer.md`](organizer.md) | Organizer projekt áttekintés: portok, env-ek, MCP endpoint, tesztrendszer, CLI |
| [`organizer-modules.md`](organizer-modules.md) | Organizer fő modulok inventory — implementált + tervezett |
| [`organizer-cli-setup.md`](organizer-cli-setup.md) | `fo` CLI telepítés, frissítés, troubleshooting ezen a gépen |

### Külső rendszerek (FDP infra)

| Fájl | Mit fed le |
|---|---|
| [`overseer-agent-access.md`](overseer-agent-access.md) | Overseer agent-oldali read-access: `fdp` parancsok, REST endpointok, auth, tipikus workflow-k |
| [`dynamo-cli.md`](dynamo-cli.md) | `dc` parancs-katalógus: scaffolding, LDP/CDP, AI test gen, batch ops, code review, configok |
| [`fdp-cli.md`](fdp-cli.md) | `fdp` parancs-katalógus: pipeline-report/notify, DevOps control, Overseer query, container-logs |

## Karbantartás

Minden referencia tetején legyen:
- `Last verified: YYYY-MM-DD` — mikor néztük meg utoljára a forrást
- Mely commit / verzió alapján készült (ha tudható)

Ha egy adat elavul (pl. portváltozás, új tool), frissíteni kell a jegyzetet.

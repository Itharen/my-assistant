# references/

Külső rendszerek dokumentációs jegyzetei. Nem authoritative — az adott rendszer
forráskódja az igazság-forrás (single source of truth).

Ezek a jegyzetek arra valók, hogy:
- a my-assistant rendszer hivatkozhasson a külső rendszer fő pontjaira (URL-ek, parancsok)
- migrációs döntéseknél (pl. organizer-be költözés) gyors kontextust adjanak
- ne kelljen minden session elején újra végigfésülni a külső projekt szerkezetét

## Aktuális referenciák

| Fájl | Mit fed le |
|---|---|
| [`organizer.md`](organizer.md) | Organizer projekt áttekintés: portok, env-ek, MCP endpoint, tesztrendszer, CLI |
| [`organizer-modules.md`](organizer-modules.md) | Organizer fő modulok inventory — implementált + tervezett |
| [`organizer-cli-setup.md`](organizer-cli-setup.md) | `fo` CLI telepítés, frissítés, troubleshooting ezen a gépen |

## Karbantartás

Minden referencia tetején legyen:
- `Last verified: YYYY-MM-DD` — mikor néztük meg utoljára a forrást
- Mely commit / verzió alapján készült (ha tudható)

Ha egy adat elavul (pl. portváltozás, új tool), frissíteni kell a jegyzetet.

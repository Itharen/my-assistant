# scripts/

Helper scriptek a my-assistant rendszer karbantartásához.

## Aktuális scriptek

| Script | Mit csinál | Mikor futtasd |
|---|---|---|
| `update-fo.ps1` | A `fo` CLI legfrissebb verzióját telepíti (git pull + build + global install + ping verify). Részletek: [`../__agent/references/organizer-cli-setup.md`](../__agent/references/organizer-cli-setup.md). | Új gép setup; vagy ha a CLI változott (új release / bugfix) |

## Használat

PowerShell-ből (Windows):
```powershell
E:\Programming\Own\CURSOR\my-assistant\scripts\update-fo.ps1
```

Ha execution policy hiba: `powershell -ExecutionPolicy Bypass -File scripts\update-fo.ps1`.

## Hozzáadási konvenció

- PowerShell scriptek: `*.ps1` (ez a Windows-os primary platform)
- Bash scriptek: `*.sh` (ha cross-platform kell)
- Minden script kommentált header-rel kezdődjön (cél, használat példa)
- Hibák `$ErrorActionPreference = 'Stop'`-pal — ne csendben hagyjuk őket

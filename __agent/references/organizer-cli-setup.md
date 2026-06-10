# Organizer CLI (`fo`) — telepítés és karbantartás

**Forrás:** `E:/Programming/Own/CURSOR/LIVE-projects/organizer-cli/`
**Git remote:** `git@github.com:futdevpro/organizer-cli.git` (master branch)
**Last verified:** 2026-05-07
**Aktuális gép:** itharen3 / Windows 11 / node v22.21.1 / pnpm 10.33.2

> Cél: ezen a gépen **mindig a legfrissebb `fo` legyen** telepítve, és authentikálva legyünk a **test** szerverre. Ez a dokumentum a telepítéstől a frissítésen át a hibaelhárításig minden lépést rögzít.

---

## 1. Áttekintés

| Komponens | Érték |
|---|---|
| Csomag | `@futdevpro/organizer-cli` |
| Bin command | `fo` |
| Forrás repo | `LIVE-projects/organizer-cli/cli/` (TS ESM, Node 20+) |
| Build folyamat | `pnpm i` → `tsc -p tsconfig.json` → `dist/` |
| Globális telepítés | `npm i -g --force` (a `cli/` mappából) |
| Globális bin path | `/c/nodejs/fo` (Windows) |
| Konfigfile mappa | `%APPDATA%\fo\Config\` (Windows) |

A CLI **JSON-RPC** kérést küld az Organizer test szerver `POST /api/mcp` endpointjára.
Az Organizer-ről részletek: [`organizer.md`](organizer.md).

---

## 2. Konfigurációs fájlok

A `fo` minden perzisztens állapotot a felhasználói config mappában tárol:

**Windows path:** `C:\Users\User\AppData\Roaming\fo\Config\`
**Linux/Mac path:** `~/.config/fo/`

| Fájl | Tartalom | Mikor jön létre |
|---|---|---|
| `dev-target.json` | Az aktuális target (`test` / `local`) | `fo dev-switch --target ...` |
| `api-key.test.enc.json` | Encrypted API key a test env-hez | `fo init` (test target alatt) |
| `api-key.local.enc.json` | Encrypted API key a lokál env-hez | `fo init` (local target alatt) |
| `auth-token.test.enc.json` | FDP Auth session token (külön flow) | `fo login` |

**Fontos:** target-váltáskor a `fo` **automatikusan** azt az API key-t használja, ami az
adott target-hez tartozik. Külön kell init-elni `local`-hoz és `test`-hez.

A titkos kulcs hardcoded a CLI-ben (Doc requirement), tehát az `enc.json` fájlok visszafejthetők
a CLI-vel — nem védenek erős támadás ellen, csak a "felhasználói gép kompromittálódott" alap szintű kockázat ellen.

---

## 3. Auth: API key beszerzése és tárolása

A test szerverre `fdp_mcp_...` prefixű API key-jel léphetünk be (FDP Auth user → API key).

### Helyi tárolás (this project)

Az aktuális gépen az API key a my-assistant projekt `.env` fájljában van:
```
my-assistant/.env
└─ FDP_ORGANIZER_API_KEY=fdp_mcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

A `.env` a `.gitignore`-ban szerepel (`my-assistant/.gitignore:6`). **Soha ne commitold.**

### Init parancs (egyszer kell, vagy key-frissítéskor)

```powershell
cd E:\Programming\Own\CURSOR\LIVE-projects\my-assistant
$env:FDP_ORGANIZER_API_KEY = (Get-Content .env | Select-String '^FDP_ORGANIZER_API_KEY=').Line.Split('=',2)[1]
fo dev-switch --target test
fo init --no-prompt --api-key $env:FDP_ORGANIZER_API_KEY
fo organizer.ping    # ellenőrzés
```

bash-ből (Git Bash):
```bash
cd /e/Programming/Own/CURSOR/LIVE-projects/my-assistant
export $(grep -v '^#' .env | xargs)
fo dev-switch --target test
fo init --no-prompt --api-key "$FDP_ORGANIZER_API_KEY"
fo organizer.ping
```

Sikeres ping után az `api-key.test.enc.json` el van mentve, és a key **nem kell többet** —
a CLI minden hívásnál innen olvassa.

---

## 4. Telepítés és frissítés (always-latest workflow)

A cél: amikor a `LIVE-projects/organizer-cli/` repo új verziót kap (git pull után),
azt egy parancsból installáljuk globálisan.

### A) Manuális frissítés (recommended)

```powershell
cd E:\Programming\Own\CURSOR\LIVE-projects\organizer-cli
git pull
cd cli
pnpm i
pnpm run build-base
npm i -g --force
fo --version    # ellenőrzés
```

### B) Egysoros (build-n-test)

A `cli/package.json`-ban van egy `build-n-test` script ami mindent egyben csinál:
```powershell
cd E:\Programming\Own\CURSOR\LIVE-projects\organizer-cli\cli
pnpm run build-n-test
```

Ez: `prep` → `build-base` → `test` → `npm i -g --force` → `fo --help` — egy lépésben
verifikálja is a telepítést.

### C) my-assistant refresh script

A my-assistant projekten belül van egy script ami a teljes flow-t lefuttatja
(git pull, build, install, ping):

```powershell
E:\Programming\Own\CURSOR\LIVE-projects\my-assistant\scripts\update-fo.ps1
```

Lásd: [`../../scripts/update-fo.ps1`](../../scripts/update-fo.ps1).

### Mikor frissítsünk

- Új session indulásakor, ha utolsó frissítés óta > 1 hét
- Ha `fo organizer.capabilities` új modult mutat amit a CLI nem ismer
- Ha hibára futunk amit a CLI changelog megemlít javítottként
- Friss release jelzés: `LIVE-projects/organizer-cli/__documentations/CHANGELOG.md` változik

---

## 5. Aktuális gép állapota (snapshot)

Ezt a szekciót **frissítsd**, amikor a setup módosul.

| Tétel | Érték | Forrás |
|---|---|---|
| `fo` verzió | 1.1.10 | `cli/package.json` |
| Repo HEAD commit | `b522c26` (2026-05-01) | `git log -1` |
| Aktív target | `test` | `%APPDATA%\fo\Config\dev-target.json` |
| Base URL | `https://test.organizer.futdevpro.hu/api/mcp` | dev-switch output |
| API key prefix | `fdp_mcp_0000...` | my-assistant `.env` |
| Auth status | ✅ verified ping (255 ms, 2026-05-07, `update-fo.ps1` futtatás után) | `fo organizer.ping` |
| Capabilities | `notes, tasks, calendar, shopping, stocks, wallet` (6) | `fo organizer.capabilities` |
| Régi `auth-token.test.enc.json` | jelen, de érintetlen — `fo login` flow-ból | `%APPDATA%\fo\Config\` |

---

## 6. Használat — alapparancsok

### Diagnosztika
```bash
fo --version                   # CLI verzió
fo organizer.ping              # connectivity check
fo organizer.capabilities      # mely modulok aktívak a szerveren
fo organizer.search --query "x"  # cross-domain keresés
```

### Listázás
```bash
fo notes.list --limit 10
fo tasks.list --limit 10 --filter-done false
fo calendar.list
fo shopping.list   # vagy shopping-lists.list — pontos név capabilities-ből
fo stocks.list
fo wallet.list
```

### Részletek
```bash
fo tasks.get --ref "org:task:<id>"
fo notes.get --ref "note:<id>"
```

### Módosítás (etag-szükséges)
```bash
fo tasks.get --ref "org:task:<id>"   # nézd meg az etag-et
fo tasks.update --ref "org:task:<id>" --if-match "<etag>" --title "Új"
```

### Output formátum
```bash
fo organizer.ping --format text   # human-friendly
fo organizer.ping --pretty        # default JSON pretty
fo organizer.ping --trace         # diagnosztikai meta stderr-en

# env változókkal:
FO_FORMAT=text fo organizer.ping
FO_TRACE=1 fo organizer.ping
FO_DEBUG=1 fo organizer.ping      # stack trace hibánál
```

### Target váltás
```bash
fo dev-switch --target test       # default
fo dev-switch --target local      # localhost:39125
```

> **Local target** csak akkor működik, ha a saját gépen fut az organizer server
> (`cd LIVE-projects/organizer/server && npm start`).

---

## 7. Hibaelhárítás

### `INVALID_ARGS — Invalid API key format: expected to start with 'fdp_'`
Az aktuális target API key-je elavult vagy hibás. Re-init kell:
```bash
fo init --no-prompt --api-key "$FDP_ORGANIZER_API_KEY"
```

### `AUTH` exit code 10
- API key érvényét vesztette → új key kell az FDP Auth-tól
- Rossz target → `fo dev-switch --target test`

### `NETWORK` exit code 11
- Test szerver nem elérhető → `curl -I https://test.organizer.futdevpro.hu` ellenőrzés
- DNS / VPN probléma a futdevpro.hu domain-re

### `REMOTE` exit code 12 (`-32603 Internal error`)
- Az MCP handler hibát adott — gyakori `tasks.create`-en, lásd [organizer.md ismert problémák](organizer.md#ismert-problémák-test-env-en)
- Workaround: UI-n keresztül létrehozás → CLI csak update/list

### `DEPTH_ZERO_SELF_SIGNED_CERT`
- Csak akkor jön ha self-signed cert van — test env-en LE cert van, így nem szabadna
- Ha mégis: `FO_TLS_INSECURE=1 fo organizer.ping`

### "TLS warning: NODE_TLS_REJECT_UNAUTHORIZED to 0 makes TLS insecure"
- A `fo dev-switch test` valamiért beállítja → ez **figyelmeztetés**, nem hiba
- A működést nem érinti, de érdemes a CLI changelog-ot követni a fix-re

### `fo --version` mellé egy `INVALID_ARGS` JSON envelope is megjelenik
- A CLI kiírja a verziót, ÉS egy hibás JSON envelope-t is — **exit code 0**, működik
- Esztétikai bug; nem akadályoz semmit
- Ha verziót programmatically akarsz olvasni, használd a `cli/package.json` `version` mezőjét

### `pnpm install` "ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY"
- Csak script futtatáskor jön (TTY nélkül), amikor pnpm törölné a `node_modules`-t
- Fix: `$env:CI = 'true'` előtte, vagy direkt parancsban `CI=true pnpm install`
- A `update-fo.ps1` ezt automatikusan kezeli

---

## 8. Eltávolítás (ha kell)

```powershell
npm uninstall -g @futdevpro/organizer-cli
Remove-Item -Recurse -Force "$env:APPDATA\fo"
```

Vagy bash:
```bash
npm uninstall -g @futdevpro/organizer-cli
rm -rf ~/.config/fo
```

---

## 9. CI / pipeline integráció (jelen pillanat: nincs)

A my-assistant projekt nem használ CI-t a `fo` install-jára. Mindig user-szinten,
a saját gépen kell telepítve lenni. Ha valaha automatizálódik (pl. új gép setup),
ez a fájl szolgáljon a kanonikus telepítési referenciaként.

---

## 10. Kapcsolódó dokumentumok

- [`organizer.md`](organizer.md) — teljes organizer rendszer áttekintés (modulok, MCP, e2e)
- `LIVE-projects/organizer-cli/README.md` — CLI saját readme
- `LIVE-projects/organizer-cli/__documentations/QUICKSTART.md` — gyors használati útmutató
- `LIVE-projects/organizer-cli/__documentations/CHANGELOG.md` — verzió-történet
- `LIVE-projects/organizer-cli/__documentations/BUGS.md` — ismert bug-ok

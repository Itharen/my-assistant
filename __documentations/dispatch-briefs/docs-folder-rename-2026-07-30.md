# DISPATCH BRIEF — dokumentációs mappák átnevezése + a hivatkozások javítása · 2026-07-30

> **Kiadó:** My Assistant 3 (koordinátor) · **Végrehajtó:** `ALL Projects - MA3 Dev 3` (`ccs-fbc3577e-ms6cy0bt`).
> **Miért ez a session:** a `MA3 Dev 2` a számlázás-hyperplanon dolgozik — **nem zavarjuk**.

## 0. A HÁTTÉR (kötelező olvasmány)
`fdp-documentations/research/docs-repo-folder-rename-2026-07-30.md` — a felderítés: **ki/mikor/miért** nevezte át,
és **mit tört el**. Röviden: az **Obsidian**ban a vault neve = a mappa neve, ezért a dokumentációs mappák
rövid vault-nevet kaptak (`ALL Projects`, `OGS`, `CCAP`, `Organizer`, `TERA`, `3x3`). A központi doksi-repó
átnevezése **785 hivatkozást** tett elavulttá **374 fájlban**.

## 1. OWNER-DÖNTÉS — a végleges nevek
| Mai mappanév | **ÚJ mappanév** |
|---|---|
| `E:\Programming\Own\CURSOR\`**`ALL Projects`** | **`fdp-documentations`** |
| `E:\Programming\Own\CURSOR\OGS-projects\`**`OGS`** | **`ogs-documents`** |

*(Így az Obsidian-switcherben is beszédes a név, és az útvonal önmagát magyarázza.)*

## 2. 🔴 A HÁROM CSAPDA — ezeket NE rontsd el

1. **A GITHUB-REPÓ NEVE NEM VÁLTOZIK.** A remote marad `git@github.com:futdevpro/documentations.git`,
   illetve `Oldlight-Games-Studio/documents.git`. **Csak a LOKÁLIS MAPPA neve** változik.
   → **TILOS** átírni a `github.com/...` URL-eket, a `.git` végződésű hivatkozásokat és a remote-konfigot.
2. **A `__documentations/` (projekt-szintű) MAPPÁKAT NEM ÉRINTJÜK.** Csak a **csupasz** `fdp-documentations/`
   útvonal-hivatkozások cserélendők. *(Használható minta: `\bdocumentations/` — a `_` szó-karakter, ezért a
   `__documentations/` nem illeszkedik rá. **De ellenőrizd**, ne vakon bízz benne.)*
3. **AZ OBSIDIAN MOST FUT, és az `OGS` vault NYITVA van** (mérve: `%APPDATA%\obsidian\obsidian.json`).
   Nyitott vaultot **nem lehet biztonságosan átnevezni** (fájl-zár + az Obsidian visszaírhatja a configot).
   → **Ha az átnevezés zárolás miatt bukik: ÁLLJ MEG és JELENTS**, ne erőltesd. *(Az Obsidian bezárása
   owner-teendő.)*

## 3. A FELADAT

### (a) Átnevezés
A két mappa átnevezése az 1. pont szerint. Előtte győződj meg róla, hogy **nincs folyamatban lévő írás**
(pl. a `fdp-documentations` repóban a `MA3 Dev 2` is dolgozhat — nézd meg a `git status`-t, és ha piszkos, jelents).

### (b) Hivatkozás-javítás — a teljes flottán
- **Mért kiindulás (2026-07-30):** `\bdocumentations/` → **785 találat / 374 fájl** (`*.md`, `node_modules` nélkül).
- ⚠️ **A mérés CSAK markdownra futott.** **Nézd át a nem-markdown fájlokat is** (`*.ts`, `*.json`, `*.ps1`,
  `*.bat`, `*.yml`, `.fdpfamignore`, `.cursor/rules/*`) — ott is lehetnek beégetett útvonalak.
- ⚠️ **Az `fdp-documentations/...` és `OGS-projects/ogs-documents/...` alakú hivatkozásokat is javítsd** — ezekből a mai napon
  keletkezett néhány (a `billing-gates-triage-2026-07-30.md`, a `fdp-token-service/__agent/USER_INPUT.md`
  TASK-001, a `my-assistant` backlog §55–56, és a felderítési rekord).
- **Prioritás — ezek a legsúlyosabbak, mert MINDEN session-be betöltődnek:**
  a workspace-gyökér **`CLAUDE.md` (14 találat)** és **`AGENTS.md` (8)**.
- A **legterheltebb fájlok** (mért): `my-assistant/…/owner-koordinacio-backlog.md` (25) ·
  `master-prompter/…/MP-0-legal-compliance.md` (16) · `MP-6-marketing-launch.md` (11) ·
  `fdp-documentations/USER-INPUT.md` (11) · `organizer/…/USER-INPUT.md` (10) · `__agent/WORKFLOW.md` (9) ·
  `fdp-token-service/…/HYPERPLAN-BILLING.md` (9).
- ⚠️ **A történeti mondatokat ne írd át értelmetlenre.** A felderítési rekord szándékosan beszél a régi
  nevekről (`ALL Projects`, `OGS`) — ott a **múltbeli tény** marad, csak egy záró megjegyzés kell, hogy
  azóta `fdp-documentations` / `ogs-documents` a név.

### (c) Kánon-frissítés
Ahol a **workspace-struktúra kanonikusan le van írva**, ott az új nevek szerepeljenek — legalább a
gyökér `CLAUDE.md` + `AGENTS.md`, és ami a doksi-hálóban a repót nevesíti (`_sidebar.md`, a
`guidelines/agent-workflow/` kánon).

### (d) Utó-ellenőrzés (mérd, ne feltételezd)
1. `\bdocumentations/` a teljes workspace-en (a `github.com` URL-eket és a `.git`-eket kizárva) → **0 találat**.
2. `__documentations/` találatszáma **VÁLTOZATLAN** a rename előttihez képest *(mérd meg ELŐTTE is!)* —
   ez a bizonyíték, hogy nem nyúltál hozzá.
3. A git-remote-ok **változatlanok** mindkét repóban.
4. A doksi-háló belső linkjei **feloldódnak** (relatív linkek — a `_sidebar.md`-ből induló ellenőrzés).

## 4. AMI NEM A TE DOLGOD (owner-teendő, csak írd fel)
- **Obsidian újraregisztráció:** átnevezés után a vault-útvonalak elavulnak a
  `%APPDATA%\obsidian\obsidian.json`-ban → az ownernek újra meg kell nyitnia a vaultokat az új útvonalról.
  **Te NE szerkeszd** ezt a fájlt futó Obsidian mellett.
- **FAM re-scan:** a FAM útvonal-alapú `repoKey`-t használ → a rename után **újra-szkennelés** kellhet.
  Ha egyszerűen kiváltható, jelezd; ne indíts magadtól hosszú szkennt.

## 5. KORLÁTOK ÉS MUNKAMÓD
- **Nincs polling / háttér-task.** Fázis végén **commit + push → megállsz és jelentesz.**
- **`core-review-until-clean`:** a végén **review→javítás loop**, amíg **két egymást követő kör nulla új
  findinggel** zárul. Körönként **más nézőpont** (pl. nem-markdown fájlok · relatív vs. abszolút útvonalak ·
  történeti mondatok · a kizárt minták helyessége).
- **`core-no-guessing`:** minden állítás mögé **mérés**. Az „átírtam mindet" csak akkor igaz, ha a 3(d)
  ellenőrzések lefutottak és zöldek.
- ⚠️ **Több repót érint** (`fdp-documentations`, `my-assistant`, `master-prompter`, `fdp-token-service`,
  `organizer`, `dynamo-e2e`, …) → **repónként külön commit**, beszédes üzenettel. A push CI/CD-t triggerel:
  **bundleld** a változásokat repónként egy commitba.

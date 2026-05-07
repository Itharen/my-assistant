# CONTEXT — my-assistant scope

## Mi ez

Személyes life-management assistant rendszer. Workflow-alapú: minden
feladat-típushoz tartozik egy strukturált flow definíció (`__agent/flows/`).

**Hibrid storage modell** — modulonként eldől, hogy az adat az organizer test env-jében
él (kanonikus DB, `fo` CLI-vel írva-olvasva), vagy lokálisan (`current/{modul}/`
markdown). A live state-et a **`SOURCE_OF_TRUTH.md`** vezeti, és **mindig azt nézd
meg**, mielőtt egy modulhoz nyúlsz — az itteni initial mapping gyorsan elavul.

## Lefedett domain-ek

A scope az organizer projekt domain-jeit tükrözi.

| Domain | Mit fed le | Source (initial — lásd SOURCE_OF_TRUTH.md a live state-hez) |
|---|---|---|
| **tasks** | Feladatok, task-group-ok, prioritás, deadline | organizer (`fo tasks.*`) |
| **calendar** | Naptár események, időpontok, ismétlődők | organizer (`fo calendar.*`) |
| **notes** | Jegyzetek, note-book-ok | organizer (`fo notes.*`) |
| **diary** | Napló bejegyzések | **local** (`current/diary/diary.md`) — nincs MCP |
| **shopping** | Bevásárló-listák, vásárolható tételek | organizer (`fo shopping.*`) |
| **stock** | Otthoni készletnyilvántartás | organizer (`fo stocks.*`, `stock-items.*`) |
| **wallet** | Pénzügyi tételek, bevétel/kiadás history | organizer (`fo wallet.*`) |
| **wishlist** | Kívánságlisták, future buy-ok | organizer (`fo wishlists.*`, `wishitems.*`) |

## Felhasználó

- **Email:** itharen3@gmail.com
- **Munka kontextus:** FDP / OGS projektek (lásd `E:/Programming/Own/CURSOR/CLAUDE.md`)
- **Nyelv:** Hunglish (magyar + angol technikai kifejezések)

## Külső rendszerek (referencia)

- **Organizer projekt** — `LIVE-projects/organizer/` — végső cél, jelenleg fejlesztés alatt
  - [`references/organizer.md`](references/organizer.md) — teljes inventory (port-ok, MCP, tesztek, CLI)
  - [`references/organizer-modules.md`](references/organizer-modules.md) — **fő modulok listája** (implementált + tervezett)
  - [`references/organizer-cli-setup.md`](references/organizer-cli-setup.md) — `fo` CLI telepítés és karbantartás
- **Master Prompter** — `LIVE-projects/master-prompter/` — auth referencia
- **claude-mem** — perzisztens session memory (külön rendszer, nem ennek része)

## Out of scope

- Project-specifikus engineering feladatok (lásd a projekt saját `__agent/` mappáját)
- CI/CD pipeline-ok (Overseer kezeli)
- Code review / PR kezelés (külön workflow-k)
- **LinkedIn heti tanulságok tartalmi gyűjtése** — egy másik agent / másik session
  feladata. Itt csak a *megjelenés-tracking* van (poszt megvan-e, mikor)

Ez a rendszer **kizárólag személyes / életvezetési** feladatokat fed le.

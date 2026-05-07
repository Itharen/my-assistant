# my-assistant

Személyes feladat-rendszerező és priorizáló assistant.

## Cél

Napi / heti / havi feladatok, naptár, jegyzetek, napló, bevásárlólisták, készletek,
pénzügyek, kívánságlisták kezelése. A rendszer:

- **rendszerez** — domain-ekbe szervezi az adatot (task, calendar, shopping, wallet, ...)
- **priorizál** — fontosság / sürgősség / blokkoló-státusz alapján
- **vezet** — workflow-okkal végigvezet a periodikus és ad-hoc feladatokon

## Storage modell — hibrid

Modulonként eldől, hogy a kanonikus tárolás:

- (a) az **organizer** test env-jében van (`fo` CLI-vel írva-olvasva), VAGY
- (b) **lokálisan** a `current/{modul}/` alatt markdown-ban

Egy modul csak akkor migrál (b) → (a), ha **end-to-end tesztelve van**. A live
state-et a `__agent/SOURCE_OF_TRUTH.md` vezeti — mindig azt nézd meg, mielőtt
egy modulhoz nyúlsz.

## Hogyan működik

A rendszer **workflow-alapú**. Minden feladat-típushoz tartozik egy flow definíció
az `__agent/flows/` alatt, ami megmondja:

1. mit kell input-ként összegyűjteni (`_intake.md`)
2. milyen sub-flow-kban dolgozzuk fel (`_subflow-N-*.md`)
3. milyen output-ot várunk a végén

## Belépési pont

Új session indulásakor:

1. olvasd el `CLAUDE.md`-t (gyökér) — projekt-szintű AI utasítások
2. ellenőrizd `__agent/SOURCE_OF_TRUTH.md` — modulonként ki vezeti az adatot
3. nyisd meg `__agent/STATUS.md` — hol tartottunk
4. ellenőrizd `__agent/USER_INPUT.md` — van-e új `[NEW]` blokk
5. ha nincs aktív flow → `__agent/WORKFLOW.md` szerint válassz
6. ha van aktív flow → folytasd ott ahol abbamaradt

## Első telepítés / új gépen

Az organizer CLI (`fo`) használatához:

1. Készítsd el a `.env` fájlt: `FDP_ORGANIZER_API_KEY=fdp_mcp_...`
2. Futtasd: `scripts\update-fo.ps1` (PowerShell)
3. Részletek: [`__agent/references/organizer-cli-setup.md`](__agent/references/organizer-cli-setup.md)

## Struktúra

```
my-assistant/
├── CLAUDE.md              # projekt-szintű AI utasítások
├── README.md
├── __agent/
│   ├── CONTEXT.md         # scope
│   ├── SOURCE_OF_TRUTH.md # élő modul-tábla (organizer vs lokál)
│   ├── STATUS.md          # aktuális állapot, aktív flow
│   ├── USER_INPUT.md      # user → assistant csatorna
│   ├── WORKFLOW.md        # governance: phase-ek, event-ek, prioritás
│   ├── flows/             # workflow definíciók (recurring / on-demand / event-based)
│   ├── domains/           # life-area definíciók
│   ├── plans/             # ad-hoc terv dokumentumok
│   ├── log/               # ciklus / session lezáró logok
│   ├── references/        # külső rendszerek inventory (organizer, fo CLI, ...)
│   └── _archive/          # deprecated tartalom (history)
├── current/               # lokál source-of-truth modulok
│   └── diary/             # (jelenleg csak diary van itt — nincs MCP-je)
└── scripts/               # AI-saját helper szkriptek (pl. update-fo.ps1)
```

## Migrációs terv

A modulok **fokozatosan** migrálnak organizer-be, ahogy az organizer-side
verifikáció (CRUD smoke + sub-entity tesztek) zöldre vált modulonként. A
folyamatot lásd `__agent/SOURCE_OF_TRUTH.md` "Migrációs flow" szekciójában.

Amikor egy modul `local` → `organizer-verified`-re vált:
1. Tesztelt CRUD smoke `fo`-val
2. Lokál adat áthúzása (script vagy manuális)
3. `SOURCE_OF_TRUTH.md` frissítése (user-jóváhagyással)
4. `current/{modul}/` archiválása `__agent/_archive/`-ba

# my-assistant — Üzleti specifikáció [MA]

> **Forrás:** ez a fájl a kanonikus rendszer-spec a `my-assistant` projekthez. A user `current/principles/` mappában lévő szabályait ide szubsztituáltuk, formalizáltuk requirement-kódokra. Az eredeti szövegek SZÓ SZERINT megmaradtak `current/`-ben (immutable user voice).
>
> **Hatály:** itt csak a `cli/`, `server/`, `client/` sub-projektek üzleti / funkcionális elvárásai szerepelnek. A governance (`__agent/`) és a user live state (`current/`) nincs itt specifikálva — azok work-in-progress.

---

## 1. Áttekintés

A `my-assistant` egy **személyes életvezetési assistant** rendszer, amely:

- **rendszerez** — domain-ekbe szervezi a feladatokat / naptárat / jegyzeteket / vásárlólistákat / készleteket / pénzügyeket / kívánságlistákat
- **priorizál** — fontosság / sürgősség / blokkoló-státusz / ismétlődés-szorzó alapján
- **vezet** — workflow-okkal végigvezet a periodikus és ad-hoc feladatokon (recurring / on-demand / event-based)

### 1.1 Cél (KÖTELEZŐ)

A rendszer egy single-user, lokális (loopback) alkalmazás, amely **átmeneti** tárolóként szolgál, amíg az FDP `organizer` projekt natívan nem használható. Long-term cél: az `organizer`-be migrálni a domain-adatokat; a `my-assistant` ekkor a *kanonikus minta* lesz az organizer-fejlesztéshez (lásd `current/principles/methodology-authority.md`).

### 1.2 Kik fogják használni

- **Egyetlen user:** itharen3@gmail.com
- **Egyetlen gép** (Windows 11), az adatok lokálisan tárolva
- Több claude-session mellett megosztott állapot az `__agent/log/actions/` action-log-on és a server SQLite DB-jén keresztül

### 1.3 Mi NEM scope

- Multi-user / multi-tenant (single-user explicit)
- Authentikáció éles deploy ellen (loopback-only Phase 1)
- Cloud sync (későbbi Phase, ha az organizer cloud-ra megy)
- FDP / OGS engineering feladatok (lásd globális workspace `CLAUDE.md`)
- LinkedIn tartalmi gyűjtés (másik agent feladata)

---

## 2. Architektúra (high-level)

A rendszer **3-tier monorepo**:

| Tier | Mi | Hol |
|---|---|---|
| **CLI** | TS Node CLI (`ma` parancs) — cast/spotify integráció, helper scriptek | `cli/` |
| **Server** | Express + SQLite — tick-engine, action-log, activity-ingest, user-input, status | `server/` |
| **Client** | Angular 18 — UI a status / action-log / user-input megtekintésére | `client/` |

A három projekt **HTTP-n keresztül** kommunikál (server az integráció pontja). Egyik sem importálja a másikat fordítási időben.

A részletes implementációs referencia: [`__documentations/ARCHITECTURE.md`](../__documentations/ARCHITECTURE.md).

A workspace-szintű inventory + cross-project relációk: [`__agent/references/workspace-projects.md`](../__agent/references/workspace-projects.md).

---

## 3. Sub-projekt specifikációk

| Sub-projekt | Spec |
|---|---|
| `cli/` | [`modules/cli.md`](modules/cli.md) |
| `server/` | [`modules/server.md`](modules/server.md) |
| `client/` | [`modules/client.md`](modules/client.md) |

---

## 4. Cross-cutting features

| Feature | Spec |
|---|---|
| Action log (központi audit-naplózás) | [`features/action-log.md`](features/action-log.md) |
| Tick-engine (A-mode dispatcher) | [`features/tick-engine.md`](features/tick-engine.md) |
| Activity monitoring (window/idle ingest) | [`features/activity-monitoring.md`](features/activity-monitoring.md) |

---

## 5. Tartalmi forrás

A user által megfogalmazott szabályok és preferenciák **kanonikus forrása** a `current/principles/` mappa — minden szabály SZÓ SZERINT megőrizve, dátum-bélyeggel.

Az itteni `__specifications/` formalizálja ezeket requirement-kódokra (`REQ-MA-*`), de az eredeti szöveg sosem változik. Új szabály felírásakor:

1. User szövege rögzítve `current/principles/<topic>.md`-be SZÓ SZERINT
2. Itteni `__specifications/`-ben formalizált requirement (REQ-kód, AC-lista)
3. Ha implementáció érinti, FR is `current/feature-requests/` alá

A user által megfogalmazott `current/feature-requests/` fájlok a Phase 1 (átmeneti) specifikációt tartalmazzák — ezek a hosszú-távú szándék: **mindegyiket idővel felemeljük az `organizer`-re mint FR**, és onnan végrehajtódnak. A `__specifications/` itt csak a my-assistant **saját, lokális** működésére vonatkozik.

---

## 6. Governance és workflow

Lásd `__agent/` mappa:
- `__agent/CONTEXT.md` — scope
- `__agent/SOURCE_OF_TRUTH.md` — modulonként ki vezeti az adatot (organizer vs lokál)
- `__agent/STATUS.md` — aktuális állapot
- `__agent/USER_INPUT.md` — user → assistant csatorna
- `__agent/WORKFLOW.md` — phase-ek, event-ek, prioritás
- `__agent/flows/` — workflow definíciók (recurring / on-demand / event-based)

---

## 7. Backlog és TODO

- [`BACKLOG.md`](BACKLOG.md) — middle-term feature backlog
- [`TODO.md`](TODO.md) — short-term TODO (mérlegelendő mostani session-ben vagy holnap)

---

## 8. Authority irány (CRITICAL)

⚠️ A my-assistant rendszer (`current/principles/`, `current/feature-requests/`, ezen `__specifications/`) a **kanonikus minta**. Az `organizer` projekt **ehhez alkalmazkodik** — nem fordítva. Részletek: `current/principles/methodology-authority.md`.

Praktikusan: ha a my-assistant szabálya ütközik az organizer aktuális sémájával, az organizer kap egy FR-t, NEM a my-assistant adja fel.

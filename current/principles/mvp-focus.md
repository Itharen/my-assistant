# MVP fókusz — pénzkeresés

> **Forrás: a user szövege.** Ez a top-level fókusz-emlékeztető. Minden
> egyéb prioritás-számolás (`priority-system.md` szorzók) ezt egészíti ki,
> nem írja felül.

---

## 2026-05-09 — alaptézis

> Na most mindenféle jobbra-bara ezt meg azt csináltam, de azért mégiscsak
> az MVP-re kéne fókuszálni, ami a pénzkeresés, illetve a pénzkeresésnek
> bármilyen és többféle formája.

## Strukturált

**Az MVP = pénzkeresés.** Bármilyen és többféle formában.

A pénz **közvetett életcél** (lásd `current/life-goals.md`): cég-támogatás
→ életcél-projektek (3×3, HelloCIA, Ideology Forum) támogatása.

## Pénzkereső projekt-térkép (snapshot)

| Projekt | Status | Megjegyzés |
|---|---|---|
| **TERA** | aktív, fő pénzforrás | heti kedd+csütörtök ellenőrzés |
| **Niche Datasets** | passzív (agent dolgozik) | "majdnem kész", idő kell |
| **Upwork task** | vasárnap (2026-05-10) kezdés | szombat = nem dolgozunk; ma vasárnap = ha készen áll |
| **Master Prompter** | hosszú táv | TBD — pontosítandó |
| **Service** | hosszú táv | TBD — pontosítandó |
| **FDP Global Token Purchase** | régóta folyamatban, "sehol nem tart" | task-decomposition jelölt |
| **HelloCIA** (közvetett) | életcél #2, 5 év csúszás 90%-on | task-decomposition kötelező |

## Mit jelent ez a fókusz a my-assistant rendszerben

- A daily/weekly priorizálási listában a pénzkereső tasks **felül** legyenek
- Más feladatok (recurring rutin, fit, health, organizer-batch) **alatta**, de NEM helyettük
- "Mi a kövi" alternatíváknál az első bullet legyen mindig egy pénzkereső opció ha létezik valid
- A user önreflexió-pillanatainál (mint ez most) az emlékeztetés ide mutat vissza

## Kapcsolódik

- `current/projects.md` — projekt-térkép + szorzók
- `current/life-goals.md` — közvetett életcél-státusz
- `current/principles/priority-system.md` — szorzó-mechanizmus
- `current/principles/task-decomposition.md` — hosszú-csúszó projektek bontása

---

## 2026-05-22 — Super-agent stratégia (NEM agent-hadsereg)

### User szövege (verbatim)

> Fontos MVP jegyzet, hogy nem agent hadsereget kéne megcélozni, hanem
> egy superagentet, aki a lokál modelleket is működésre bírja. (CCAP +
> Anthropic, multimodel (fastest best shorts), amivel addig okosítjuk a
> CCAP-t, hogy a mikro modell-ek is stabil munkát végezhessenek)

### Strukturált jegyzet

**Stratégiai döntés:** NEM az a cél hogy **sok specializált agent** legyen,
hanem **EGY super-agent** ami:

1. **CCAP** alapra épül
2. **Anthropic Claude**-ot használja fő intelligenciaként
3. **Multi-model**: a feladat-típushoz illeszti a modellt (`fastest best shorts` — gyors válaszokhoz kisebb modell)
4. **Lokál modelleket is működésre bír** — a CCAP olyan keret-rendszert ad, hogy a **mikro modellek** is **stabil munkát** végeznek
5. **Iteratív okosítás**: a CCAP fejlesztésével a lokál modellek képessége fokozatosan eléri a használhatóság szintjét

### Implikáció

| Helyett | Cél |
|---|---|
| ❌ Több specializált agent | ✅ **Super-agent** ami bármilyen feladatot felvesz |
| ❌ Csak Claude-API-ra hagyatkozás | ✅ **Provider + modell-mix**: nagy a döntésekhez, lokál a rutinhoz |
| ❌ Modellt nem-skálázható módon választ | ✅ **fastest-best-shorts**: feladat-méret + komplexitás dönt |
| ❌ Lokál modell "tudja vagy nem" | ✅ **CCAP keret-rendszer** kompenzálja a mikro-modell limitált képességét |

### Kapcsolódás

- `current/feature-requests/ccap-local-stabilization.md` — ez a stratégia operacionális magja
- `current/feature-requests/rag-context-injection.md` — a CCAP RAG = a super-agent **emléktömege**, nélküle a lokál mikro elveszik
- `current/notes/project-ideas.md` 2026-05-16 #2.c — RAG microservice architecture = a super-agent kontextus-infrastruktúrája
- **NEM** worker-agent + kanban (`worker-agent-cronjob.md` — más irány, parkolt)
- A my-assistant Dev Agent + Assist Agent **NEM önálló-agent-bővítés**, hanem a CCAP super-agent **tick-flow-jai**, kifelé vetítve a my-assistant rendszerre

---

## 2026-05-29 — Sales-es szerzése (közvetlen monetizáció)

### User szövege (verbatim)

> kéne sales-est szerezni, aki eladja a rengeteg mindent, amit csinálunk.

### Strukturált jegyzet

**MVP-akció (közvetlen pénz):** keresni/szerezni egy **sales-est** (értékesítő),
aki **eladja a sok mindent amit csinálunk** (az elkészült projektek / termékek /
szolgáltatások portfólióját).

- Indok: rengeteg készül (TERA, Niche Datasets, Master Prompter, Service, organizer, …),
  de az **értékesítés a szűk keresztmetszet** — nem a termelés.
- Ez **közvetlen MVP** (= pénzkeresés), szemben a tooling-fejlesztéssel ami közvetett.
- Visszatérő gondolat ("már eszembe jutott, csak nem tudtam feljegyezni") → most rögzítve.

**Nyitott (később pontosítandó, nem blokkoló most):** milyen sales-csatorna /
profil (freelance / jutalék / partner), és melyik termék-portfóliót adja el először.

### Productivity-tool jegyzet (2026-05-29)

> *"Sokszor a master prompter is sokat segítene a dolgaimban."* (org-tükör: `org:note:6a1af2471aaf1ebfb627df17`)

A user-nek a **Master Prompter** (az organizerhez hasonlóan) produktivitási
eszközként sokat segítene a napi dolgaiban → közvetett MVP (produktivitás →
pénzkereső projektek). Master Prompter már a projekt-térképen (fent, "hosszú táv").

---

## 2026-05-29 — Organizer tasks-screen fejlesztés (user-owned MVP-task)

### Kontextus (user, 2026-05-29)

> Az organizer az a mi saját fejlesztésünk, és az én feladatom, hogy ezt
> továbbfejlesztem, és igazából annyit küzdök folyamatosan az egész életemben
> mindig a feladatok rendszerezésével, hogy ez elég nagyon sokat segíthetne.

### Jegyzet

**User-owned dev-task** (NEM my-assistant Dev Agent — ld. `Q-2026-05-29-01`):
az **organizer tasks-képernyőjének** továbbfejlesztése. A user saját projektje,
a my-assistant itt csak `fo`-fogyasztó.

- **Miért MVP-szintű:** a feladat-rendszerezéssel való élethosszig tartó küzdelem
  enyhítése → közvetett produktivitás-emelő minden más (pénzkereső) projektre.
- **Tracking-javaslat:** ez egy **user task** → ha kéred, felveszem az organizer
  tasks-ba (`fo tasks.create`) — de a tasks modul `organizer-partial`, így
  **írás előtt jóváhagyás** kell. Szólj és berakom.

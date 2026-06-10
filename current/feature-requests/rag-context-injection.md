# FR: RAG context-injection a CC session hook-okba (és minden agent-szezsönbe)

> **Forrás: user 2026-05-13.** A megismétlődő szenvedés mély root cause-a:
> hiányzik az automatikus RAG context-pull.

## User szövege (verbatim)

> Hömköhöm, igazából ez mind-mind arra utal, illetve egy másik szesszönbe is
> ugyanezt tapasztaltam, hogy hiányzik, nagyon-nagyon rettenetesen hiányzik a
> RAG rendszer, ami automatikusan vektorkeresésekkel behúzza releváns
> szabályokat, parancsokat, releváns bármit, bármilyen jellegű társadalmat,
> akár több-különféle táblából, több-különféle logika és egyéb dolgok mentén.
> Ezt ugye most jelenleg a CCAP rendszerhez fejlesztem, de ez a szenvedés
> itt meg a másik szesszönökben is mind-mind azt indukálja, hogy meg kell
> csináljam ezt minél hamarabb, és olyan módon kéne elérhetővé tegyük, akár
> CC session húkokba is bele kéne tudjuk injektálni, hogy automatikusan
> belegyenek húzva releváns dolgok. Ne neked kelljen kutatgatni minden
> alkalommal, ne neked kelljen folyamatosan kontextusokat gyűjteni, hanem a
> ragrendszer gondoskodjon arról, hogy minden releváns információ szabály,
> mindenféle hasonló, stb. eleve rendelkezésre álljon minden egyes
> üzenetnél, futásnál, stb.

## Root cause (assistant-jegyzet)

A user fáradtsága + frusztrációja az asszisztensi munkamenetben (NEM kód-fejlesztés)
nagyrészt **EBBŐL** ered:

- Én (chat) minden új session-ben **manuálisan keresgetek** a `principles/`,
  `feature-requests/`, `diary/`, `__agent/` alatt — sokszor lemaradok
  releváns tételekről (pl. ma: prior 3×3 thesis-ek nem checkoltam → user
  joggal mérges volt)
- A Dev Agent + Assist Agent **ugyanezt szenvedi** — minden tick / cycle újra
  beolvas, soha nem **cached** és soha nem **smart-pull**
- Mikromenedzselés szükséges → user kapacitás-kifolyás → CC usage limit hit

**Megoldás: RAG context-injection.** Minden session-start (vagy minden
UserPromptSubmit) automatikusan **lekérdezi** a CCAP RAG-ot a friss user-prompt
embedding alapján, és **inject-eli** a top-N releváns dokumentumot a context-be.

## Cél (kettős scope)

| Szint | Mit |
|---|---|
| **CCAP-oldal** (külön projekt) | A vektor-store + indexer + query API maga. User már fejleszti. |
| **my-assistant-oldal** (ez a FR) | CC session hooks → CCAP RAG query → kontext-inject. Plusz: a my-assistant `current/` + `__agent/` tartalmát beindexelni a CCAP RAG-ba. |

## Phase-elés (my-assistant oldal)

| Phase | Mit | Felelős | Függ |
|---|---|---|---|
| 0 | ez a FR | chat ✅ | — |
| 1 | CCAP RAG MVP query API (HTTP endpoint) | **CCAP-projekt (user)** | — |
| 2 | my-assistant `current/` + `__agent/` indexelés CCAP RAG-ba | **CCAP-projekt + ingestion-config** | Phase 1 |
| 3 | CC `SessionStart` + `UserPromptSubmit` hook: query CCAP RAG → top-N md context-inject (stdout-ra, Claude-nak látható) | Dev Agent (my-assistant) | Phase 1+2 |
| 4 | Dev Agent + Assist Agent ugyanezt — `00-orient` / `01-read-state` előtt RAG-context | Dev Agent | Phase 3 |
| 5 | Inkrementális re-index (file-change → reindex) | CCAP-projekt | Phase 2 |
| 6 | RAG-query metrics + relevance-feedback | későbbi | — |

## Status

🟡 **Kritikus dependency** (CCAP RAG-ra vár). A my-assistant Phase 3-tól
indítható, amint a CCAP `POST /rag/query`-szerű endpoint áll. **NEM most**
ship-elhető — de **NEM is parkolt**, mert ez **a fő blokkoló** az
asszisztensi munkamenet folyamatosságában.

## Felvétel a backlog-ba

🟡 hullámba **#7g** (RAG context-injection — CCAP-függés). A 🟢 fókuszba
**csak akkor** kerüljön, amikor a CCAP RAG endpoint MVP áll.

## Kapcsolódik

- `current/feature-requests/cross-project-notes-ingestion.md` — testvér FR (eredeti scope-leírás, 2026-05-07)
- `current/feature-requests/ccap-local-stabilization.md` — GPT + lokál AI a CCAP-ban
- `current/diary/diary.md` 2026-05-11 — "kurvasok időt elveszek a context-build-re"
- `current/diary/diary.md` 2026-05-12 — "CCAP RAG VectorDB megoldás"
- `current/diary/diary.md` 2026-05-13 — "CCAP RAG + stabil token-kezelés"

---

## 2026-05-16 — kibővítés: vizuális kontextus-tracking + RAG microservice architecture dependency

### User szövege

> Most az egyik legfontosabb dolog az lenne, hogy a kódbázist és a szabályokat
> valahogy kialakítsuk úgy, hogy ezek a fajta szabályozások jól húzódjanak be
> mindig a kontextusba. Ne is kelljen keresnie semmit. rendszernek, hanem a
> rendszerünk automatikusan meg találja a kódokat, releváns kódbázist, még a
> szuperrendszerben is. És ezt valahogy vizuálisan kéne nagyon jól kialakítani,
> hogy jól nyomon követhető legyen, hogy mikor milyen kontextusok húzódnak be.
> Igazából főleg ez a vizualizáció hiányzik most nagyon.

### Új scope-elemek (2026-05-16)

**Phase 7 (új) — Vizuális kontextus-tracking dashboard:**
- A my-assistant kliensen új panel: **"RAG context inspector"**
- Minden agent-session / minden UserPromptSubmit-hez log: **mely dokumentumok / szabályok / kódrészletek** lettek behúzva → mikor, milyen relevance-score-ral, milyen prompt-tal
- Vizualizáció: timeline + per-message context-cards (kibontható) + relevance heatmap a forrás-fájlokon ("ez a fájl X-szer húzódott be az utóbbi N session-ben")
- Cél: a user **lássa** mit kapott Claude / Dev Agent / Assist Agent — debugolható, finomítható, javítható

**Dependency-frissítés:** a Phase 1-2 most már egy **RAG microservice architektúrára** támaszkodik (lásd `current/notes/project-ideas.md` 2026-05-16 #2.c), nem csak egy CCAP-RAG-MVP-re. A scope így nőtt:
- 5+ RAG-típus (különböző táblák — pl. `principles`, `feature-requests`, `code`, `diary`, `action-log`)
- Dinamós építőelemek (közös template)
- Több rendszerből elérhető (multi-tenant)

**Phase 8 (új) — Univerzális komponens-szabály behúzás:**
- A `current/notes/project-ideas.md` 2026-05-16 #2.b (univerzális input + button + description + persist) is **automatikusan** be kell húzódjon **minden Dev Agent cycle-be**, amint kódot ír Angular/React komponenshez. Ez egy RAG-RULES-szabály lesz.

---

## 2026-05-29 — MVP-prio + 4-rétegű RAG-spec (dev agentekhez)

> Forrás (szó szerinti idézet a user-től):
> *"RAG for dev agents (1: rules, 2: patterns, 3: codebase, 4: dataflows)"*
>
> Kontextus: a user **MVP-feladatként** jelölte meg (MVP = pénzkeresés-fókusz).

### Konkrét 4 réteg (RAG-táblák / index-típusok a dev agentekhez)

| # | Réteg | Mit indexel | my-assistant forrás (példa) |
|---|---|---|---|
| 1 | **Rules** | szabályok, konvenciók, alapelvek | `current/principles/`, `CLAUDE.md`, `.cursor/rules/` |
| 2 | **Patterns** | bevett minták, referencia-implementációk | referencia-projektek (master-prompter / organizer / futdevpro), `__agent/references/pattern-audit.md` |
| 3 | **Codebase** | a tényleges kód (szimbólumok, fájlok) | `cli/ server/ client/ src/` |
| 4 | **Dataflows** | adat-folyamok, architektúra-térkép | `current/architecture.md`, `__documentations/ARCHITECTURE.md`, `DECISIONS.md` |

Ez **konkretizálja** a fenti "5+ RAG-típus" scope-ot (#101) a Dev Agent
nézőpontjából: a 4 réteg a Dev Agent cycle-be automatikusan behúzandó
kontextus-osztályok. A Phase 3-4 (CC hook + agent-tick inject) ezekre épül.

**Prio-váltás:** 🟡 #7g → **MVP-kandidátus** (user 2026-05-29). A 🟢 fókuszba
emelés a CCAP RAG endpoint MVP állásától függ (Phase 1 dependency változatlan).

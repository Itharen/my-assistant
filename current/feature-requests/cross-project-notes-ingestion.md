# FR: Cross-project jegyzet + task ingestion + vektorizálás

> **Forrás: a user szövege.** Out-of-scope mostani fázisban — **csak rögzítjük**.

## 2026-05-07 — initial deklaráció

> mint ahogy az összes jegyzetet is be kéne vinni a rendszerbe, fel kéne
> dolgozni illetve be kéne kötni a többi rendszerben projektben lévő
> projektfejlesztési feladatot is ezeket ugye vektorizálni kéne hogy
> lehessen vektorkeresni benne de hát ez egy elég komoly plusz feladat ami
> most full out of scope sajnos

## Cél

1. **Jegyzet-ingestion**: a user "rengeteg" jegyzetét egy helyre, strukturáltan
   (mostani ad-hoc helyek: különálló fájlok, organizer task description-ök,
   CCAP repo `__agent/`, OpenClaw docs/TODO.md, Discord, paper-jegyzetek?)
2. **Cross-project task-bevitel**: a többi projekt (CCAP, TERA, niche,
   HelloCIA, runners) `__agent/` alatti fejlesztési feladatait beemelni a
   my-assistant priorizálási rendszerbe
3. **Vektorizálás**: embedding-alapú index, hogy "vektor-keresni" lehessen
   ("amikor a kód hibákat retry-zza, hogyan csináltuk?" → talál releváns
   jegyzeteket / task-okat)

## Komplexitás-becslés (assistant)

| Komponens | Becslés |
|---|---|
| Source-discovery (hol vannak a jegyzetek/task-ok) | 1-2 nap |
| Ingestion-script (parse + normalizáció JSON-ra) | 2-3 nap |
| Embedding-pipeline (lokál model? OpenAI API? — tudni kéne) | 3-5 nap |
| Vector-store (FAISS / Chroma / SQLite-vss / pgvector?) | 1-2 nap |
| Search UI / CLI | 1-2 nap |
| **Összesen** | **~2 hét full-time** |

## Status

🅿️ **OUT OF SCOPE** — most nem csináljuk. **Felírás kész, ne nyúljunk hozzá.**

## Dependency-jelölt

- A `triggering-system-architecture.md` előbb kell (alap-orchestratio)
- A `food-tracking.md` Phase 2 (cast-notifier voice trigger) is előbb
- Niche piaci pénz után — pénzt is hoz erre

## Open kérdések

Új kategória — **T) Cross-project ingestion** (lásd `open-questions.md` később).

## Kapcsolódik

- A user "Rengeteg jegyzetem is van, amit regisztrálni kell, meg rendszerezni,
  meg priorizálni" — `current/notes/ccap-tasks-batch-later.md`-ben is utalt rá
- A CCAP-task-cluster batch-feldolgozás **része** ennek a nagyobb meta-feladatnak

## 2026-05-12 — kapcsolódás: CCAP RAG

A user frusztrációja: CC usage limit-ekbe ütközik folyamatosan. Megoldás-irány:
**CCAP RAG + VectorDB** felokosítása (a CCAP-csapat scope-ja, **NEM** my-assistant).

Ha a CCAP RAG működik:
- A my-assistant adatai (`action-log`, `principles/`, `feature-requests/`,
  `plans/`, `diary`, `STATUS_*.md`) **vector-forrásként** bekapcsolhatók
- Session-resume **gyorsabb** (CCAP-RAG előgenerálja a chat-kontextust)
- CC usage **csökken**

A my-assistant oldali bekötési endpoint (server-en) **jövő FR** lesz, amikor
a CCAP RAG kész és elérhető.

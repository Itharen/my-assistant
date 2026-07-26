# DISPATCH BRIEF — FAM retrieval-tisztítás (kevesebb zaj)

> **Kiadja:** My Assistant 3 (koordinátor) → **„ALL Projects - FDP Agent Memory"** (CCAP dev-session).
> **Létrehozva:** 2026-07-26. **Jelleg:** measure-twice diagnózis → fix-forward javítás.

## Cél
A FAM (`fdp-agent-memory`) retrieval-je legyen **tisztább / kevésbé zajos**. Konkrét, MÉRT tünetek a mai
használatból (workspace `E:\Programming\Own\CURSOR`, `mcp__fdp-agent-memory__read`):

## 1. ZAJ — a generikus `project-identity` / `scan-summary` chunkok elnyomják a releváns találatokat
- Konkrét query-kre (pl. „hogyan küldök üzenetet egy ccap sessionnek", „ügyvéd kommunikáció melyik email")
  a **top-hitek `kind:"project-identity"`** chunkok voltak (projekt-név + dependency-lista), `weight:3` →
  `finalScore` ~2.2, miközben a `lexicalScore` 0–0.2 volt. A tényleges releváns doksik lecsúsztak/kimaradtak.
- **KÉRÉS:** a `project-identity` / `scan-summary` kindet **súlyozd le** a default dense retrievalben, vagy
  csak identity-jellegű query-re engedd felszínre. A **statikus `weight` NE tudja legyőzni** a szemantikai +
  lexikai relevanciát. Mérd ugyanazt a 2-3 query-t előtte/utána (score/weight/finalScore breakdown).

## 2. ELAVULTSÁG — point-in-time index
- Ma egy **MÁR TÖRÖLT** memory-fájl chunkja is visszajött a találatok közt.
- **KÉRÉS:** heti automatikus **TELJES újra-scan + törlés-szinkron** (delta), hogy a tartalom naprakész
  maradjon. (Már felírva FAM-igényként: `knowledge`, `_id=6a65fc4ff2360721269355c7`, tags:
  `fam-backlog,freshness`.)

## 3. TÚLCSORDULÁS — sok query `totalRelevant` több száz–ezer, `truncated:true`
- Gyenge jel/zaj a default topK-nál. **KÉRÉS:** precízebb ranking, hogy a tényleg releváns kevés doksi
  jöjjön elöl.

## Munkamód (workspace hard-rule-ok)
1. **Measure-twice:** reprodukáld a zajt 2-3 valós query-vel; dokumentáld a jelenlegi ranking-viselkedést;
   találd meg a **PONTOS okot** a retrieval/scoring kódban (a `ccap-revisioned` RAG-mintából származó
   `fdp-agent-memory` retrieval rész).
2. **Fix-forward** (nem workaround). Before/after evállal igazold: a konkrét query-k tisztább top-N-t adnak,
   és az identity-lekérdezések NEM romlanak el.
3. Patterns-first, SSOT, típus-forced. Tesztek + ha van, e2e. **Commit/push masterre, zölden.**
4. Blokkoló/kérdés → jelezz vissza; **My Assistant 3** vezényel.

## Rögzítés
Tükör-jegyzet: `LIVE-projects/my-assistant/__documentations/owner-koordinacio-backlog.md` §11.3.

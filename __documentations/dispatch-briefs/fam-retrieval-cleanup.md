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

---

## VÉGREHAJTVA — ALL Projects / FDP Agent Memory (2026-07-26)

**Státusz:** ✅ Problem 1 KÉSZ (fix-forward + eval + tesztek + push masterre zölden). Problem 2/3 → lentebb.
**Commit:** `02f105e` (`fdp-agent-memory` master, v1.1.113) — *"retrieval: scan-summary read-time weight cap"*.

### Problem 1 (ZAJ) — ✅ MEGOLDVA
- **PONTOS ok (mérve, élő FAM):** `finalScore = score × weight × …`. A `project-identity` (weight:3) + `fs-summary`
  (weight:2) chunkok — közös marker: `source.type:'scan-summary'` — statikus weight-boostja `finalScore ~1.3-2.2`-re
  emelte őket, így OFF-topic query-ken is a top-5 volt MIND scan-summary (a „ügyvéd email"-nél `lexicalScore:0.00`-val).
- **Fix (patterns-first, az `importSourceFactor` mintájára):** read-idejű `scanSummaryFactor` a scan-summary effektív
  weight-jét `min(weight, scanSummaryWeight)`-re sapkázza (`factor = cap/weight`). Új config: `read.scanSummaryWeight`
  (default **1.0** = tiszta relevancia-rangsor, nincs statikus boost). READ-time; a nyers cosine + a `weight` DTO-mező
  változatlan; a confidence/totalRelevant a nyers cosine-on marad (a summary továbbra is megtalálható, csak nem dominál).
- **Before/after (ugyanaz a 2 query):** a top-6-ból a scan-summary **eltűnt (→ 0)**; a top-hitek most valódi tartalom-
  doksik (cosine 0.63-0.81, lexical 0.33-0.86). **Identity-query NEM romlott:** „projekt függőségei" / „milyen projekt ez"
  query-ken a `project-identity` **#1** maradt (a MAGAS cosine-ja miatt, nem a weight miatt). 5 új unit + 690 spec zöld.

### Problem 2 (ELAVULTSÁG — heti re-scan + delete-sync) — ✅ MEGOLDVA (külön dispatch, 2026-07-26)
- **Commit:** `0fec6ea` (+ `fcf6564`, `91bf907`) master, v1.1.115. Új `FAM_ScanScheduler_ControlService` (in-process).
- **Ütemezés:** LOKÁLIS idő, default **hétfő 07:00** (konfigurálható: `scan.weeklyRescanDayOfWeek`/`Hour`). Fix 10-perces
  tick figyeli a slotot; DUE → rögzíti a `scan.weeklyRescanLastRunAt`-ot (idempotencia + restart-storm védelem) → indítja
  a TELJES re-scant a MEGLÉVŐ `FAM_ScanJob.start`-on át (a reconcile/orphan-delete a scan része — nem duplikáltam).
- **Catch-up:** ha a szerver a slot-időben down volt → a következő induláskor bepótol.
- **Cél:** `scan.weeklyRescanRoot` (ha megadva) VAGY a legutóbbi durable scan-job cél-specjei (zero-config); egyik sincs
  → SKIP + warn (nincs találgatás). **Guaranteed-full coverage-hez ajánlott a `scan.weeklyRescanRoot` = workspace-root beállítása.**
- **Mért + javított E2E-lelet:** az install() eredetileg a boot VÉGÉN volt → nagy korpusznál (426k vektor, 220s hidratálás)
  a boot post-hidratációs karbantartás-lánca lelassul/megakad → a scheduler SOSEM települt. **Fix:** install a boot ELEJÉN
  (a timer garantáltan felkerül) + a tick hidratálás-kapuval (nem scannel hidratálás közben) + prompt post-hidratációs
  catch-up tick. Élő-igazolt: install-log **+5s**-nél (hidratálás előtt). 9 unit + 699 spec zöld.

### Problem 3 (TÚLCSORDULÁS — precízebb ranking) — 🟢 RÉSZBEN, Problem 1 következményeként
- A scan-summary-cap egy egész zaj-osztályt kivett a top-N-ből → tisztább jel/zaj. A `totalRelevant` több száz volta a
  nagy korpusz sajátja; a rangsor eleje most relevancia+lexika-vezérelt. További szigorítás = **config-hangolás**
  (`read.relevanceFloor` emelése per-tár/scope), nem kód — igény esetén külön mérés-alapú lépés.

> Blokkoló nincs. My Assistant 3 vezényel — jelezz, ha a Problem 2 (cron-scheduler) vagy a Problem 3 config-hangolása
> most kell.

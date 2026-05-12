# Diary

> Lokál source-of-truth. Az organizer-ben **nincs** diary MCP handler, ezért
> egyelőre itt vezetjük markdown-ban. Ha az organizer kap diary-MCP-t, lásd
> `__agent/SOURCE_OF_TRUTH.md` migrációs flow-t.

## Formátum

```markdown
## YYYY-MM-DD — {nap rövid címkéje, pl. "Hétfő"}

{tetszőleges szöveg, akár több paragráfus}

### {opcionális: téma-szekció}
{...}
```

- Egy nap = egy `## ` szekció
- Legújabb nap **felül**
- Ha egy nap > 5 paragráfus vagy > ~200 sor, érdemes témákra (`###`) bontani
- Ha a teljes fájl > ~500 sor / > 30 nap, szétbontás havi fájlokra:
  `current/diary/2026-05.md`, `current/diary/2026-06.md`, és ez a `diary.md`
  csak az aktuális (legfrissebb) hónapot tartja

## Mező-konvenciók (organizer migráció miatt)

Ha jövőben átköltözünk az organizer-be, a leképezés:

| markdown | organizer (`diary-entry`) |
|---|---|
| `## YYYY-MM-DD — {címke}` | `entryDate: YYYY-MM-DD`, `title: "{címke}"` |
| body szöveg | `content` (markdown elfogadott) |
| `### {tárgy}` szekciók | `tags: [...]` vagy `topics: [...]` |

---

<!-- BEJEGYZÉSEK IDE, A LEGÚJABB FELÜL -->

## 2026-05-09 — Szombat ("szabat")

### 🌅 Ciklus-state
- **Ébredés ma ~15:00**
- Várható lefekvés: ~2026-05-10 09:00–11:00 vasárnap reggel (`wakeAt + 18-20h` képlet, `sleep-system.md`)

### 🛋 Szabat-pattern
- Szombat = nem dolgozik = **"azt csinál amit akar"** (általános pattern, felírva mint principle-emlékeztető)
- Ma is így — nem-pénz-meló idő

### 🛠 Mai aktivitás (saját szándék)
- **CCAP hegezgetés** ("jobban működjenek a dolgaink")
- **my-assistant finomítás** (a mai látható refactor — pl. `scripts/` → `cli/scripts/` bekerülés — ennek folytatása lehet)

### 🎉 Once-in-a-lifetime event
- **Kossuth tér** — a user szerint "once in a lifetime" rendezvény, "hatalmas buli"
- (a "szabat" kihasználva → kint volt)

---

## 2026-05-12 — Kedd

### 🌀 3×3 state (első explicit snapshot)
- **Asztrál:** mély ponton 🔻 (frusztráció a 3 napos workflow-meló miatt + buli utóhatás)
- **Mentál:** normál (a user szerint "általában magas rezgést jelent" → kontextus-érzékeny)
- **Anyag:** alacsony 🔻
- **Hullám-vektor:** lefelé → a 3×3 elv szerint: NE erőltessünk feladatokat

### 💭 Reflexió
- 3 napja workflow-fejlesztéssel megy az idő, miközben **pénzkereső projektekre** kéne fókusz (mvp-focus.md)
- A hosszú-távú haszon megéri ("kifizetődik"), de jelenleg frusztráló
- A péntek-szombat Kossuth tér buli **erősen lehúzta** az energiákat
- Ezer éve nem sétált / a buli óta nem → **életet visszaépíteni** szándék

### 🥛 Stock
- **Tej elfogyott** (utolsó volt a polcon) → Tesco-rendelés indítható
- Plus: "mindent is" rendelés-jelölt — egész stock-pótlás

### 👖 Clothing-lista
- **Nadrág** hozzáadva (`shopping/clothing.md`) — eddig hiányzott
- Megerősítve: cipő, zokni, alsógatya, póló, kabát, pulóver már fent

### ⚠️ Workflow-rebuild lezárva
- WORKFLOW_DEV + WORKFLOW_ASSIST + phases/ + events/ + STATUS_DEV/ASSIST kész
- A 3 napos meló most valóban a Dev Agent **autonóm üzembe-helyezhetőség** szintjére vitte a rendszert
- Az erre épülő pénzkereső munkának innentől **kevesebb chat-vezénylés** kell

### 🚀 Auto-workflow elindult
- A Dev Agent **első cycle**-je beindult: `cycle=1, phase=audit`
- `STATUS_DEV.phase_notes`: "01-cleanup-git kész: 15 pending change, 0 foreign"
- Bootstrap commit a 10-commit-push fázisban várható

### 🆕 3 új igény felvéve
- **BathCom 50% volume-cap** → `cast-notifier-defaults.md` + backlog 7e
- **Overseer monitoring** FR → backlog 7c
- **"Hey Google"-szerű voice-trigger research** FR → backlog 7d (Server vagy Google Home integráció kérdése)

### 📌 CCAP új verzió várakozóban
- Pár hibára vár a friss CCAP-ből (manuális megfigyelés)

---

## 2026-05-10 — Vasárnap

### 🌅 Ciklus-state
- **Másnapos + nagyon fáradt** (előző napi Kossuth tér + tánc + sok séta)
- Korai lefekvés terv ("lehet, hogy korábban le is fogok feküdni")
- Most: néz még valamit (film/sorozat)

### 🆕 Új FR
- **Media tracking + új-release figyelő** felvéve: `current/feature-requests/media-tracking.md`

### ⚠️ Activity-monitor leállva
- Utolsó sample: 2026-05-07 23:01 (~40h-val ezelőtt)
- Logger nem fut → bekötni Task Scheduler-be hogy boot-on auto

---

## 2026-05-08 — Péntek

### 🌅 Ciklus-state
- Ébredés: **dél körül** (~12:00)
- 13:00 meeting megvolt, többi mítingek **csúsztak** ("majdra/másnapra")
- Vendégség ma **bizonytalan**: holnap event, ha mennek → ma kevesen jönnek vagy senki

### 🍱 Étkezés
- **Első étkezést kitolja minél jobban** (general pattern — felvenni a food-tracking FR-be)
- Ebéd most még korai (15:48)

### 💻 Projekt-state update
- **Új projektek felvéve** `current/projects.md`-be:
  - **Master Prompter** (pénzkereső, hosszú távú)
  - **Service** (pénzkereső, hosszú távú, "service" jelentés TBD)
  - **FDP Global Token Purchase System** (pénzkereső, "régóta folyamatban, sehol nem tart")
- Mind hosszú távú — fókusz-prioritás kell a pénz-szerzéshez
- Másik agent fogja bedolgozni a projekt+cég kontextust (lásd `cross-project-notes-ingestion.md`)

### 🛠 Mai fejlesztési szándék
- **Dashboard összerakás** ma-holnap (a `client/` fejlesztés folytatása) — az új feature ami most élő munkára vár

### ⚠️ User önreflexió
- "annyi feladat, hogy hirtelen nem jut eszembe semmi mivel kéne foglalkozni"
- Pénz-szerzés-fókusz hangsúlyos, de a projektek mind hosszú-távúak
- → 3×3 elv: **NE erőltessük most**, alacsony lendület-fázis

### 🚧 Párhuzamos session-ek + CC limit
- **4 különféle Claude Code account** különféle agentekhez → MOST elérte a limitet, 2h cooldown
- A my-assistant chat (én) emiatt késve kapja az üzeneteket
- **Másik agent ráállítva**: CCAP-n dolgozik a **CC usage management** feature-ön — időszerű, mert pont most ütött be a limit
- **Plan a usernek**: vár → kaja → séta (~30p) → addig lejár a limit

### 🛋 Vendégség aktualizálva
- ✅ **Lett vendég: László** — "kb. minden péntekben várható vendég" (új info, állandó péntek-rítus)
- A holnapi event-re mindenki más nem jött

### 🚶 Séta-info update
- Alap: 1h, jellemző: **1.5-2h**, akár több
- **Jövő-cél: napi 8-12h** (progresszív felépítés, lásd `fit-system.md`)

---

## 2026-05-07 — Csütörtök

### 🌅 Ciklus-state
- **Ébredés ma 15:00** (forrás: user chat 16:48)
- ~~Várható lefekvés: 2026-05-08 09:00–11:00 (`wakeAt + 18-20h`)~~ → **revízió**: péntek 13:00 meeting miatt rövid ciklus, lefekvés ~**02:00–04:00 péntek hajnal**, ébredés ~10-12 péntek délelőtt
- Lásd: `current/sleep/log.md` és `current/principles/sleep-system.md`

### 🧹 + 🚶 Napi rutin (frissítve 23:25 user-korrekció után)
- 🧹 **Takarítás**: utoljára **2026-04-30 csütörtök** (1 hete). A korábban felvett "takarítás megvolt" mondat a múlt heti slotra vonatkozott — **MA még nincs meg**. Heti 1× szerda szabály → 2026-05-06 lett volna esedékes → 1 missed cycle.
- 🚶 **Séta**: ✅ **MOST** folyik (~23:00–). 4 napos halogatás (utolsó 2026-05-04) lezárul ezzel.
- ✅ **Fürdés**: ma ~18:05 megvolt. ⚠️ **Failure**: az assistant nem küldte automatikusan a kötelező sub-task checklist-et (arc/hónaljak/intim) amikor a user "becsobbant" — a `recurring-tasks.md` 149-186 sora szerint kellett volna. Jövő alkalommal (heti 2× szabály miatt jövő héten) automatikusan menjen.
- ✅ **TERA projekt ellenőrzés**: ma megvolt, rendben. Következő esedékes: **2026-05-12 kedd**.

### 💻 Projekt-state (frissítve 23:25 user-update után)
- ✅ **Self-hosted runners**: KÉSZ. Múlt héten készült, komoly dependencia volt, most jól működik.
- 🟡 **Agentek**: dolgoznak, de van még munka. **Következő lépés: agent-szám növelése** — feltétel: pénz VAGY rengeteg fejlesztés. Setup-feladat: melyik agentet mire állítjuk rá.
- 🟡 **Niche dataset**: **passzív** — útjára bocsátva. Az agent végzi a hálózatépítést és a dataset-tisztítást. **Most nincs feladat itt** — idő kell.
- 💰 **Pénzszerzés következő lépése**: **Upwork task** kialakítása. **Vasárnap (2026-05-10) kezdés**. Indok: péntek meeting-ek + este vendégek, szombat = nem dolgozunk.
- ❌ **Pályázatírás**: TÖRÖLVE — elavult, megszűnt issu (organizer task archive-olandó: `org:task:699ca5b6cb79b45c59a74de6`).
- 📌 **CCAP-related task-cluster (~7 task)**: priorizálás-batch-be parkolva, lásd `current/notes/ccap-tasks-batch-later.md`. Most NEM aktív prioritás.

### 📌 Mai nap új tételei
- ~~**P1**: céges hózárás (elseje miatt)~~ → **TEGNAP (2026-05-06) MEGVOLT**, archived. Recurring szabály: minden hónap 2. munkanapja → következő: 2026-06-02 kedd, új task felvéve (P=100)
- ⏰ **Kaja-rendelés** jövő hétre — ma utolsó normál nap, felvéve organizer-be (`priority: 105`)
- 🔬 **Research: Google Home integráció** — alacsony prió, felvéve (`priority: 50`)

### 🎮 Extra (alacsony prió)
- Játékfejlesztésnél két különálló tétel:
  - Együttműködési megállapodás — **félbehagyva**
  - Külön játékfejlesztős agent igény a csapat kapacitására

### 🍱 Interfood — 2026-05-08 péntek
- ✅ **Kaja-rendelés leadva 3 hétre előre** (~2026-05-29-ig fedett — leghosszabb távra rendezve, jó!)
- Eskaláció lezárult — task archive-olva (`org:task:69fca4a7...`)
- Következő emlékeztető: **2026-05-25 hétfő-kedd** (utolsó-fedett-hét kezdete)
- Következő határidő: **2026-05-28 csütörtök**

### 🛒 Vásárlás-progress
- 🥃 **Captain Morgan**: 2 db megvett. Bolt out-of-stock volt → még 2 db a listán marad (4-re dúsítás default szabály szerint)
- 🏥 **Patika** ✅ task archived. Vett:
  - **Kataflam** (mennyiség TBD)
  - **Széntabletta** × 3 (volt 0 → kellett volna 4, de bolt-szinten csak 3 lett; user "mindegy" → currentQty=3, hiány nem kerül vissza listára)
- 🛁 **Fürdés** ✅ — "becsobbantam a kádba" (~18:05 körül). 7 napos halogatás lezárva.

### 💪 Fit-zóna setup (új)
- Új principle: `current/principles/fit-system.md` — séta + Gellért-hegy edzés
- Korlátok rögzítve: szombat NEM hegy, péntek 18:00 előtt (vendégek miatt)

### 🚀 CCAP: élő-kommunikáció feature set (új)
- **Cél**: fluidabb chat — TTS auto-felolvasás + folyamatos figyelő/küldő loop → élő beszélgetés
- **Dependency**: QA / transcript prefix feature → nagyjából kész, be kell fejezni először
- **Felvett task-ok**: P=102 (élő-kommunikáció feature set) + P=100 (QA transcript prefix befejezése)
- A user kontextus-szándékkal sorolta fel az aktív projekteket (TERA / CCAP / Niche), hogy lássam mibe illik ez a feature

### 📋 Session meta (assistant-jegyzet)
- `current/principles/` mappa felállítva 4 fájllal (working-style, priority-system, recurring-tasks, stock-system) — a user szövegei szó szerint őrizve
- `CLAUDE.md` bővítve: working-style + időkezelés + alapelv-rögzítési szabály


# CLAUDE.md — my-assistant

Projekt-szintű AI utasítások. A globális workspace utasítások
(`E:/Programming/Own/CURSOR/CLAUDE.md`) érvényben maradnak; ez a fájl **kiegészíti**
őket a my-assistant projektre vonatkozó specifikumokkal.

---

## Mi ez a projekt

Személyes life-management assistant. A user (itharen3@gmail.com) napi / heti / havi
feladatait, naptárát, naplóját, bevásárlólistáit, készleteit, pénzügyeit, jegyzeteit,
kívánságlistáját kezeljük. **Workflow-alapú** rendszer: minden tevékenység egy flow-ba
illeszkedik (`__agent/flows/`).

Long-term cél: az **organizer** projekt natív használata. Most átmeneti állapotban
vagyunk: az organizer egyes moduljai már működnek (test env MCP + `fo` CLI),
mások még csak lokál markdown-ban léteznek.

---

## Belépési pont (KÖTELEZŐ minden új session-ben)

Sorrendben olvasd:

1. **`current/architecture.md`** — átfogó rendszer-térkép (5 layer, FR-mapping,
   adat-folyam). Új feature mindig innen indul: melyik layer, van-e FR rá.
2. **`__agent/SOURCE_OF_TRUTH.md`** — modulonként ki vezeti az adatot (organizer vs lokál).
   Ez **élő dokumentum**, modulonként változhat. Sose feltételezd, hogy egy modul
   még ott van, ahol legutóbb. Mindig nézz rá.
3. **`__agent/STATUS.md`** — aktuális állapot, futó flow, fázis (snapshot).
4. **`__agent/log/actions/` legutóbbi 1–3 nap** — finomabb felbontású akció-log,
   ezzel állítsd vissza a fonalat ha az előző session összeomlott. Lásd lentebb
   a teljes "Action log" szakaszt.
5. **`__agent/USER_INPUT.md`** — `[NEW]` blokkok feldolgozandóak.
6. **`__agent/AGENT_BUS.md`** — inter-agent csatorna (chat ↔ dev ↔ assist). `[OPEN] To: chat` bejegyzéseket válaszold meg.
7. **`__agent/WORKFLOW.md`** — governance (event-ek, prioritás, authority).

Ha aktív flow van → folytasd ott, ahol abbamaradt. Ha nincs → kérdezd a user-t,
vagy futtass esedékes recurring flow-t.

### Doksi-mátrix (mit hol találsz)

| Mit keresel | Hol |
|---|---|
| Mit kell csinálnia a rendszernek (FDP-pattern üzleti spec) | `__specifications/main.md` + `modules/` + `features/` |
| Hogyan van megépítve (architecture, decisions, changelog) | `__documentations/ARCHITECTURE.md`, `DECISIONS.md`, `CHANGELOG.md` |
| Local dev env setup | `__documentations/dev/LOCAL_DEV_ENVIRONMENT.md` |
| Dated session-doksik (mit csináltunk a múltban) | `__documentations/developments/` |
| Workspace-szintű projektek (FDP / NPM / OGS inventory) | `__agent/references/workspace-projects.md` |
| 3×3 kutatás (felfedezések, mood-mapping, állapot-átmenetek) | `current/3x3-research/findings.md` |
| Egészség napló (séta, hegy, arc-mosás, fit napi entry-k) | `current/health-journal.md` |
| Tri-tier (cli/server/client) AI-quick-ref | `__agent/references/architecture.md` |
| Pattern-megfelelőségi audit | `__agent/references/pattern-audit.md` |
| Organizer integráció részletek | `__agent/references/organizer{,-modules,-cli-setup}.md` |
| Az agent governance (workflow / status / plans) | `__agent/` |
| User élő szövegek + kanonikus szabályai | `current/` |

---

## Source of truth — kritikus

A rendszer **modulonként** dönt arról, hogy egy adott domain adata
(a) az organizer test env-jében (`fo` CLI-vel írva-olvasva), vagy
(b) a `current/{modul}/` alatt markdown-ban él.

**Egyetlen autoritatív tábla:** `__agent/SOURCE_OF_TRUTH.md`. Mielőtt
adatot OLVASNÁL vagy ÍRNÁL egy modulban, ellenőrizd ott a state-et:

| Status | Mit jelent | Mit szabad |
|---|---|---|
| `organizer-verified` | Tesztelve, megbízható, kanonikus az organizer | Csak `fo` CLI-n keresztül írj-olvass. Lokál fájl nincs vagy archív. |
| `organizer-partial` | Részben tesztelve. Olvasás megy, de write-ot user-jóváhagyással | Olvashatsz, de írás előtt verify command + user OK |
| `local` | Csak lokál fájl (`current/{modul}/`) | Kanonikus a markdown. Ne hívj organizer-MCP-t. |
| `dual` | Átmeneti — most költöztetjük | Soha ne legyen ilyen jóváhagyás nélkül. Konfliktus esetén kérdezz. |

**Migrációs flow** (egy modul kapcsolása `local` → `organizer-verified`):
1. End-to-end teszt (CRUD smoke) `fo`-val
2. Lokál adat átemelése (script vagy manuális)
3. `SOURCE_OF_TRUTH.md` frissítése
4. `current/{modul}/` archiválása (`current/_archive/{modul}-YYYY-MM-DD/`)

---

## Organizer hozzáférés — `fo` CLI

A `fo` CLI globálisan telepítve (`C:\nodejs\fo`), target: `test`, API key
encrypted store-ban (`C:/Users/User/.config/fo/`).

**Ellenőrző parancsok minden új session elején, ha organizer modul érintett:**
```bash
fo organizer.ping --pretty           # él-e a server
fo organizer.capabilities --pretty   # mely modulok elérhetőek
```

**Példa parancsok:**
```bash
fo tasks.list --pretty
fo tasks.create --title "..." --pretty
fo tasks.archive --ref "org:task:<id>" --pretty
fo notes.list --pretty
fo calendar.list --pretty
```

**Megjegyzés a `--if-match` etag-re:** a `fo` CLI help példái mutatják, de a
mostani CLI build NEM fogadja el az archive parancsokon. Update-nél lehet, hogy
kell — minden új művelet előtt nézd meg `fo {action} --help`-pel.

**Részletes inventory:** `__agent/references/organizer.md`.

---

## Lokál adat — `current/`

Ami nem organizer-vezérelt, az `current/{modul}/` alatt él. Jelenleg csak
**diary** van itt. Formátum: markdown, egy fájl modulonként, amíg nem nő nagyra.
Ha egy fájl >500 sor vagy >100 entitás, szétbontás (pl. `diary/2026-05.md`).

A `current/` **a user által közvetlenül szerkeszthető** — ha kéziileg írt bele
valamit a session-ök között, vedd alapként.

---

## Hogyan dolgozz

**Inputok kezelése:**
- A user chat-en keresztül adja az inputokat. Routold a megfelelő helyre:
  - organizer-modul → `fo {modul}.create` (vagy update)
  - lokál modul → írás `current/{modul}/`-be
- Erősen értelmezett kategorizálás után jegyezd fel `__agent/log/`-ba is, mit hová tettél.

**Saját scriptek:** ha egy ismétlődő művelethez (pl. daily snapshot, modulváltás
migráció, batch import) script kéne, készítsd a `scripts/` alá. Ne találj fel új
formátumot — kövesd a `fo` CLI JSON envelope mintáját (`{ok, action, requestId,
elapsedMs, result|error}`).

**Authority** (lásd `__agent/WORKFLOW.md` Authority szakasz):
- `current/`, `__agent/data/` (deprecated, lásd lentebb), `__agent/log/`, `__agent/plans/`
  → írj-olvass szabadon
- `STATUS.md`, `USER_INPUT.md` `[DONE]` átállítás → szabadon
- `SOURCE_OF_TRUTH.md` módosítás → **csak user jóváhagyással** (ez state-machine)
- Új flow / domain definíció → **csak user jóváhagyással**
- `fo {modul}.create/update/archive` → **organizer-verified** modulnál szabadon,
  **organizer-partial** modulnál user-confirmation kell írás előtt
- Külső rendszer (email, fájl `my-assistant/`-on kívülre) → **mindig kérdezd**

---

## Action log — KÖTELEZŐ (session-continuity)

> **A létezésünk oka:** session-ek hirtelen összeomolhatnak. Egy explicit
> "session-end checkpoint" nem véd ez ellen, mert nem tudjuk **mikor** fog
> meghalni a session. Ezért **minden** akcióról folyamatosan, append-only
> naplót vezetünk. Új session így vissza tudja venni a fonalat, és
> hosszú távon vissza tudunk nézni hogy mi készült el / mi nem.

### Hely + retention

- **Fájl:** `__agent/log/actions/YYYY-MM-DD.jsonl` (Europe/Budapest naptári nap)
- **Append-only** — soha ne írj felül vagy törölj sort
- **Retention: végtelen** — minden commitolt és pusholt
- **Format: JSONL** — gép által parse-olható
- Schema részletek: `__agent/log/actions/README.md`

### Ki mit ír

| Forrás | Mit ír | Hogyan |
|---|---|---|
| **Claude (én)** automatikus | tool-call, file-edit, file-write, bash, user-msg, assistant-turn-end, session-start | `.claude/settings.json` hookjain át (`cli/scripts/action-log/hook.ps1`) |
| **Claude (én)** manuális | `decision`, `flow-start`, `flow-end`, `state-change`, `ship`, `note`, `error` (a *miért*-et csak én tudom) | `cli/scripts/action-log/append.ps1` vagy direkt JSONL-append |
| **Saját scriptek / projektek** (cli/cast, server/activity-monitor, jövőbeli) | `external-action`, `error` lifecycle + lényeges műveletek | Node: `cli/scripts/action-log/lib.ts`, PS: `cli/scripts/action-log/append.ps1` |

### Mit NEM ír

- **NEM** ír ide az `activity-monitor` percenkénti samples-je (ablak/idle) —
  a `server/activity-monitor/data/`-ba megy, gitignored. Csak az activity-monitor
  **lifecycle event-jei** (start/stop, error) jönnek ide.
- **NEM** írunk ide titkokat / PII-t. A summary mező legyen tényszerű, de ne
  szivárogtasson érzékenyt.
- A `Read`/`Glob`/`Grep` tool-okat nem hookoljuk (zaj). Csak Edit/Write/Bash/
  PowerShell/NotebookEdit/TodoWrite van wired.

### Mikor írj manuálisan (én — Claude)

A hookok automatikusan logolnak minden tool-callt, de a **szemantikus**
információt csak én tudom. Az alábbi eseményeknél **kötelezően** írj egy
manuális action-log sort (a hook által írt mellé):

| Esemény | Kind | Példa summary |
|---|---|---|
| Új flow indul | `flow-start` | "daily-review flow indul" |
| Flow lezárul | `flow-end` | "daily-review flow lezárva — 3 task created" |
| Nem-trivial döntés (architektúra, stratégia, kompromisszum) | `decision` | "build-it-ourselves: cast-notifier saját PoC, nem Home Assistant" |
| `STATUS.md` / `SOURCE_OF_TRUTH.md` állapot vált | `state-change` | "SOURCE_OF_TRUTH: tasks → organizer-verified" |
| Egy fejlesztés / feature kész és commit-érett | `ship` | "cast-notifier Phase 1.5 ship — TTS + per-device save/up/restore" |
| Hiba történt aminek tanulsága van | `error` | "msedge-tts ws connect timeout, retry-val ment át" |
| Nyitott kérdés parkolva user-nek | `note` | "Q-am-7 felvéve: aggregáció timeline" |

### Schema referencia (rövid)

```json
{
  "ts": "2026-05-07T22:50:00+02:00",
  "actor": "claude|cast-notifier|activity-monitor|user|...",
  "kind": "<lásd kind enum a README-ben>",
  "summary": "egy mondat",
  "ref": "<opc — fájl/task ref/url>",
  "session": "<opc — claude session id>",
  "extra": { "<opc struktúrált payload>": "..." }
}
```

### Resume protokoll (session-crash után / új session indul)

1. **`STATUS.md`** — snapshot
2. **`__agent/log/actions/`** legutóbbi nap (`Get-Content -Tail 100` vagy hasonló)
   — ez mondja meg pontosan mit csináltam utoljára, mi volt félbehagyva
3. **`USER_INPUT.md`** `[NEW]` blokkok
4. **`SOURCE_OF_TRUTH.md`** ha modul-műveletre készülök
5. Ha bizonytalan vagyok mit folytassak → **inkább kérdezz a usertől**, ne
   találgass

### Szabály új fejlesztésekre (KRITIKUS)

> **Minden új script / projekt / feature, amelyiknek "akciója" van**
> (CLI command, file-művelet, IO, deploy, lifecycle event), **kötelező az
> action-logba emit-et beépíteni.**

- Node/TS projektek: importáld `cli/scripts/action-log/lib.ts`-t (vagy ha
  rootDir miatt nem megy, csinálj egy mini lokál writert mint
  `cli/src/action-log/action-log.client.ts`)
- PowerShell scriptek: hívd `cli/scripts/action-log/append.ps1`-t
- Bármi más: emelj JSONL-t a megfelelő napi fájlba
- **Lifecycle event-ek mindig:** start, normál stop, abnormális leállás (try/finally)
- **Action event-ek:** minden user-facing CLI invocation + outcome (ok/error)

### Pull-quote a usertől

> "Ne legyen ennek határa, legyen végtelen, tartsunk meg mindent. Hogy jó
> alaposan messzire vissza tudjunk nézni, mi készült el és mi nem. Csináld meg
> nagyon alaposan, és kerüljön be mindenhova kell, illetve minden eddigi
> fejlesztésünkben is, ahol valamilyen akció van, ott automatikusan
> készüljenek róla ilyen logok, és azt is írjuk föl, hogy a jövőben, hogyha
> készítünk fejlesztést, amiben van valami akció, akkor oda is bele kell
> építsük ezt az automatikus logolást."
> — user, 2026-05-07

---

## Working style — user preferenciák (KRITIKUS)

> A user explicit kérése. **Mindig így dolgozz.**

- **Definition of Done-t TE mondod ki.** A user nem akarja megmondani, mikor kész
  egy feladat — neked kell javasolnod, lezárnod, azt is mondva mi maradt nyitva.
- **Ne mondja meg neked, mit csinálj és mikor — inkább ötletelj.** Ha a user
  felvet egy témát, javasolj megközelítéseket / lehetőségeket, ne kérj tőle
  step-by-step instrukciót. A megfelelő irányt te dolgozd ki.
- **Rövid, tömör üzenetek — KRITIKUS.** A user explicit szabálya:
  > "mindig nagyon tömören írjá nekem... nagyon fontos, hogy mindig nagyon
  > tömören, röviden fogalmazz, különben nem fogom tudni feldolgozni, amiket
  > írsz." (2026-05-07)

  Default: bullet-lista / táblázat / emoji-vizualizáció. **Hosszú paragráfusok
  TILTOTTAK.** Ha egy összefoglaló hosszú lenne → headlines-t adj és kérdezd
  meg melyik részbe menjünk mélyebbre. Tömörség > részletesség.
- **Emojik használata OK** — sőt **kifejezetten kért**. Használj relevánsakat
  hangulat / státusz / kategória jelzésére (✅ ⚠️ 🔴 ⏰ 📌 🛒 🚶 🧹 stb.).
- **STT-input → typo-tűrés.** A user STT-t (speech-to-text) használ az
  inputokhoz, és a transzkriptek nem mindig pontosak. **Tolerálj typo-kat /
  félrehallott szavakat** — ha egy mondat furcsán hangzik, valószínűleg STT-hiba,
  ne kérdezz vissza apróságokon, hanem értsd meg a szándékot kontextusból. Csak
  akkor kérdezz vissza, ha a jelentés valóban kétértelmű és a választás
  következménye nem visszafordítható.

## Időkezelés (KRITIKUS)

- **Minden interakció elején nézd meg a tényleges időt és napot.**
  ```bash
  date "+%Y-%m-%d %H:%M %A"
  ```
- **Az interakciók közt eltelhet 1-2 nap** — ne feltételezd, hogy a session
  folyamatos. Ha egy task `dueDate`-je vagy ismétlődő szabálya elcsúszott a
  legutóbbi interakció óta, ezt jelezd.
- **Az ismétlődő feladatok prioritása dinamikus** (lásd
  `current/principles/recurring-tasks.md` és `priority-system.md`):
  ha egy ismétlődést kétszer is kihagytunk, a halogatás-szorzó miatt feljebb kell jönnie.

## Általános szabályok és alaptézisek (KRITIKUS)

A user **általános szabályait** — pl. ismétlődő feladat-rendszer, prioritás-elv,
stock-szabály, working style — **mindig fel kell jegyezni**, és **olyan formában,
ahogy a user leírta**. Ne fogalmazd át, ne tedd "strukturáltabbá" magadtól.
A szó szerinti megőrzés azért kritikus, mert ezeket később az **organizer**-be
visszük át mint Feature Request / Acceptance Criteria, és ott a user eredeti
megfogalmazása lesz a referencia.

**Hely:** `current/principles/` — minden új alaptézis külön fájlt kap.

**Aktív alapelvek (lásd a fájlokat a részletekért):**

| Fájl | Mit fed le |
|---|---|
| `current/principles/working-style.md` | Hogyan dolgozzunk együtt (DoD, ötletelés, rövid+emoji, next-action mindig alternatívákkal) |
| `current/principles/priority-system.md` | Magasabb szám = magasabb prio, halogatás-szorzó, projekt-szorzó cross-project |
| `current/principles/recurring-tasks.md` | Takarítás / séta / mosás / fürdés / bevásárlás / kaja-rendelés szabályok |
| `current/principles/stock-system.md` | Itthoni készlet alapérték + újrarendelési küszöb elemenként |
| `current/principles/sleep-system.md` | Csúszó alvás-ébrenlét ciklus (**18h fix** ébren / 8h alvás) + bedtime emlékeztető logika |
| `current/principles/nzt-system.md` | NZT használati szabályok: max 2 on-nap, off ≥ on. User-eszköz a mélypontok / üresség-érzés kiszedésére |
| `current/principles/methodology-authority.md` | **A my-assistant a kanonikus minta**, az organizer ehhez alkalmazkodik (nem fordítva) |
| `current/principles/shopping-lists.md` | Bolt-típus szerint szeparált bevásárló-listák (tesco / clothing / ikea / ...) |
| `current/principles/fit-system.md` | Fit zóna: séta + Gellért-hegy edzés szabályok, heti horgonyok (szombat/péntek tilalmak) |
| `current/principles/health-system.md` | Health zóna: napi 3× arc-mosás workflow + anti-deferral stratégia |
| `current/principles/no-paid-solutions.md` | **Univerzális hard rule**: SOHA ne ajánlj fizetős megoldást — ha létezik, lefejlesztjük magunknak |
| `current/principles/build-it-ourselves.md` | **Univerzális default**: build-it-ourselves stance, FOSS / saját script preferred a heavy 3rd-party tooling helyett |
| `current/principles/mvp-focus.md` | **MVP = pénzkeresés.** Top-level fókusz-emlékeztető, minden egyéb priorizálást kiegészít |
| `current/principles/two-domains.md` | **Asszisztensi vs szoftverfejlesztési** feladatok elhatárolása — ne keveredjenek |
| `current/principles/system-components.md` | **Kanonikus 7-komponens elhatárolás** (Development Agent, Server, Client, CLI, Assistant Agent, Cron Job, Automation Scripts) — minden hivatkozás ezekre a nevekre |
| `current/principles/full-autonomy-expectation.md` | **Top-level cél**: teljes autonómia a rendszertől, chat-vezérelt vezénylés |
| `current/principles/error-handling.md` | **Univerzális hard rule**: minden fejlesztésnél debug-level error handling, semmi csendes swallow + **2026-05-16 zero-tolerance**: minden errorhoz error-bejegyzés, hiányzó = elfogadhatatlan |
| `current/principles/e2e-validation.md` | **Univerzális hard rule**: minden új feature/Phase end-to-end teszttel ship-el (Dev Agent felelőssége) |
| `current/principles/client-visualization.md` | **Univerzális hard rule**: minden feature-höz kötelező kliens-oldali vizualizáció (start: socket connection-indicator) |
| `current/principles/ssot.md` | **Univerzális hard rule**: SSoT — egy adat = egy kanonikus forrás, többi cache/hivatkozás |
| `current/principles/weekly-rhythm.md` | **Heti ciklus munkanap-alapú** (NEM naptári) — péntek=utolsó munkanap, szombat=szabat, csúszik szabadságok/event-ek mentén |
| `current/principles/cast-notifier-defaults.md` | Cast-notifier operacionális default-ok: All Speakers target, férfi HU TTS, volume save→up→restore (NEM duck), Spotify resume |
| `current/principles/recording-discipline.md` | **Univerzális hard rule**: "jegyezz fel" = kötelező rögzítés MINDENHOL, **elsősorban az organizerbe** (`fo {modul}.create`) + lokál tükör org-ref-fel. Lokál-only = félrevezető. Elmaradt rögzítés = kritikus hiba. Organizer-down = P0 blokkoló + fallback `current/tasks/inbox.md` |

**Új alapelv kezelése:** ha a user új szabály-szerű dolgot mond, **soha ne csak
"vegyük tudomásul"** — minden esetben:
1. Új vagy meglévő fájlba `current/principles/`-be (szó szerint)
2. Ha univerzális (a working-style szintű), a CLAUDE.md-be is utalás
3. Visszajelzés a user felé hogy hova került

**Open kérdések kezelése (KRITIKUS):** amikor egy interakció során kérdést
teszel fel a user-nek (clarification, döntés, opció), **NE CSAK A CHAT-BEN
HAGYD**. A user explicit kérése (2026-05-07):

> "ha kérdéseid vannak, ami tényleg választ vár, akkor azokat rakjuk be, ha
> van valami kérdéslistánk... nem mindig nézem meg, hogy miket válaszolsz,
> dobálom be az inputokat, és aztán időről időre... visszakérdezek...
> sok-sok kérdés elsikkadna, ami most fontos lenne, úgyhogy ezért fontos...
> ha kérdésed van, az kerüljön bele ebbe a kérdés logba, illetve akkor,
> hogyha tényleg fontos."

**Kötelező lépések minden kérdés-felvetésnél:**
1. **Felvenni** `current/open-questions.md`-be új ID-vel (`Q-YYYY-MM-DD-NN`
   vagy témakör-kódolt mint `Q-3x3-1`, `Q-life-2`, `Q-food-3`)
2. Kategorizálni (STT / methodology / project / recurring / stock / FR /
   process / meta / 3×3 / life / food / …)
3. Fontosság-becslést adni (`l`/`m`/`h`) — magas csak ha a válasz tényleg
   blokkol valamit
4. A chat-ben felemlíteni rövid heads-up-pal, **de** a perzisztens hely a fájl
5. **Új téma-kategóriát** (új betűjelet) felvenni ha kell — bővíthető séma

**Válaszkor:** status `answered` + válasz 1 mondatban (történet okán marad).
**Drop:** ha irrelevánssá vált, status `dropped`, indok 1 mondatban.

---

## Nyelv és stílus

- **Hunglish** — magyar mondatszerkezet + angol technikai terminológia
- Kódban: angol identifier-ek és kommentek (CLAUDE.md projektszinten Hunglish
  kommentet enged)
- Dátumok: ISO (`YYYY-MM-DD`)
- Time: `YYYY-MM-DDTHH:mm:ss+02:00` (Europe/Budapest, kivéve ha a user mondja)
- Emojik használata: **igen**, ahol releváns státuszt / hangulatot kommunikál

---

## Ami **nem** ennek a projektnek a hatóköre

- FDP / OGS engineering tasks (lásd a globális `CLAUDE.md`-t és a kérdéses projekt saját `__agent/`-jét)
- CI/CD / Overseer pipeline ügyek
- Code review / PR kezelés más projekteken
- A `LIVE-projects/organizer/` projekt FEJLESZTÉSE — itt csak **fogyasztói** vagyunk
  (`fo` CLI-n keresztül). Ha bug van, nyissunk feature-request-et organizer-be
  (`fo feature-requests.create ...`) ahelyett hogy mi nyúlnánk a kódhoz.

---

## Migrációs alapelv

⚠️ **Authority irány (KRITIKUS):** A my-assistant rendszer (`current/principles/`,
`current/feature-requests/`, metodológiák) a **kanonikus minta**. Az organizer
ehhez alkalmazkodik — nem fordítva. Részletek:
`current/principles/methodology-authority.md`.

Praktikusan:
- Az adatformátumokat úgy alakítjuk, hogy **a user szabálya érvényesüljön**.
  Ha ez ütközik az organizer aktuális sémájával, **nem mi adjuk fel** — az
  organizer kap **FR-t** (`current/feature-requests/`-be lokálban gyűjtve, később
  `fo feature-requests.create`-tel feltöltve).
- A "kompatibilitás" cél, de **nem priorizáltabb mint a user szabálya**.
- Lásd `__agent/domains/{modul}.md` "Migráció organizer-be" szakaszait a
  meglévő mező-mappingekért, illetve a `fo {modul}.create --help`-et a
  tényleges field-ekért.

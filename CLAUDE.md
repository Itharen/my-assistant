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

1. **`__agent/SOURCE_OF_TRUTH.md`** — modulonként ki vezeti az adatot (organizer vs lokál).
   Ez **élő dokumentum**, modulonként változhat. Sose feltételezd, hogy egy modul
   még ott van, ahol legutóbb. Mindig nézz rá.
2. **`__agent/STATUS.md`** — aktuális állapot, futó flow, fázis.
3. **`__agent/USER_INPUT.md`** — `[NEW]` blokkok feldolgozandóak.
4. **`__agent/WORKFLOW.md`** — governance (event-ek, prioritás, authority).

Ha aktív flow van → folytasd ott, ahol abbamaradt. Ha nincs → kérdezd a user-t,
vagy futtass esedékes recurring flow-t.

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

## Working style — user preferenciák (KRITIKUS)

> A user explicit kérése. **Mindig így dolgozz.**

- **Definition of Done-t TE mondod ki.** A user nem akarja megmondani, mikor kész
  egy feladat — neked kell javasolnod, lezárnod, azt is mondva mi maradt nyitva.
- **Ne mondja meg neked, mit csinálj és mikor — inkább ötletelj.** Ha a user
  felvet egy témát, javasolj megközelítéseket / lehetőségeket, ne kérj tőle
  step-by-step instrukciót. A megfelelő irányt te dolgozd ki.
- **Rövid, tömör üzenetek.** Ne magyarázz túl. Bullet > paragraph.
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
| `current/principles/working-style.md` | Hogyan dolgozzunk együtt (DoD, ötletelés, rövid+emoji) |
| `current/principles/priority-system.md` | Magasabb szám = magasabb prio, halogatás-szorzó, projekt-szorzó cross-project |
| `current/principles/recurring-tasks.md` | Takarítás / séta / mosás / fürdés / bevásárlás / kaja-rendelés szabályok |
| `current/principles/stock-system.md` | Itthoni készlet alapérték + újrarendelési küszöb elemenként |
| `current/principles/sleep-system.md` | Csúszó alvás-ébrenlét ciklus (**18h fix** ébren / 8h alvás) + bedtime emlékeztető logika |
| `current/principles/methodology-authority.md` | **A my-assistant a kanonikus minta**, az organizer ehhez alkalmazkodik (nem fordítva) |
| `current/principles/shopping-lists.md` | Bolt-típus szerint szeparált bevásárló-listák (tesco / clothing / ikea / ...) |

**Új alapelv kezelése:** ha a user új szabály-szerű dolgot mond, **soha ne csak
"vegyük tudomásul"** — minden esetben:
1. Új vagy meglévő fájlba `current/principles/`-be (szó szerint)
2. Ha univerzális (a working-style szintű), a CLAUDE.md-be is utalás
3. Visszajelzés a user felé hogy hova került

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

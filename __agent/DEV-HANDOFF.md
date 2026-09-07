# 🛠️ DEV-HANDOFF — a „My Assistant DEV" session folyamatvezérlő fájlja

> 🔴 **NO-CACHE belépési pont.** Minden ébredéskor **frissen** olvasandó.
> Ez a fájl mondja meg, **mit** kell csinálni és **milyen szabályok szerint**.
>
> **Owner (2026-09-07 22:30):** *„hogyha bármilyen fejlesztési munkát kell végezni, akkor azt add
> át az assistant devnek, és mondd meg neki, hogy amíg van mit csinálni, addig tartsa magát
> mozgásban a schedule wake-up-pal, és fontos, hogy rendszeresen frissítse a szabályokat a FAM-ból"*

---

## 0. A CIKLUS-PROTOKOLL — ez a két dolog KÖTELEZŐ minden körben

1. ⏰ **`ScheduleWakeup`-pal tartsd magad mozgásban**, amíg van mit csinálni.
2. 🧠 **Frissítsd a szabályokat a FAM-ból** — `mcp__fdp-agent-memory__read`, a `rules` táron,
   a feladat-típushoz illő topickal. ⛔ Ne emlékezetből dolgozz.

**Egy kör:** olvasd ezt a fájlt + az állapotot → **egy** munkacsomag → teszt zölden → commit +
push → **frissítsd a STATUS-blokkot** → wakeup.

---

## 1. A projekt és a kemény korlátok

**Projekt:** `E:/Programming/Own/CURSOR/LIVE-projects/my-assistant`
**Belépő szabályok:** `CLAUDE.md` · `__agent/workflow-rules.md`

| ⛔ Korlát | Miért |
|---|---|
| **Az átemelt CCAP-kódhoz NEM nyúlunk** (`cli/src/_modules`, `_collections`, `_enums`) | owner: *„nagyon törékeny az a kód, de cserében meg egész jól működött"* — `current/principles/transplant-not-rewrite.md`. Ha muszáj eltérni, azt **mellé** tesszük, nem bele |
| **Fejlesztés csak a my-assistant projekten belül** | a bedrock-igény a `__documentations/BEDROCK-FRS.md`-be megy |
| **Minden hibához debug-szintű hibakezelés** | `current/principles/error-handling.md` — ⛔ néma `catch` tilos |
| **A diagnosztika sosem buktathatja meg azt, amit megfigyel** | mért eset: a megszólalás-számláló `?.` nélkül megölte volna a felvételt |

---

## 2. 🎯 A SORON LÉVŐ MUNKA — hang-csatorna (T-22)

**Terv + STATUS-blokk:** `__agent/plans/voice-control-transplant/hyperplan.plan.md`
**Állapot:** `__agent/CONTINUATION.md` *(a legutóbbi szakaszok)*

### 🔴 A helyzet őszintén

A lánc **össze van kötve** *(felvevő → WAV → STT → híd → köteg)*, de az **átviteli arány ~1%**:
az owner végigbeszélt egy beszélgetést, és **egyetlen** mondat jutott át.
⚠️ Ezt korábban „élőben átment"-nek neveztem — **az túlállítás volt**.

### A három owner-követelmény, sorrendben

| # | Mit | Állapot |
|---|---|---|
| **1** | **Mérd ki, hol vész el a beszéd** | 🟡 a számláló megvan (`MA-VOICE-SPEECH-DETECTED`: `detected` / `delivered` / `droppedSoFar`) — **az adat kiolvasása és értelmezése hátra van** |
| **2** | **MINDEN átirat szövegként a HANG-csatornába** *(ne a fő chatbe mosva)* | 🟡 a tükör célpontja már a hang-csatorna; a „minden" nincs meg |
| **3** | 🔊 **HANGJELZÉSEK, ahogy a CCAP-ban voltak** | 🔴 nincs |

**A 3-hoz az owner szó szerint:** *„voltak hangvisszajelzések, kis ilyen-olyan printy-pringy
hangok a CCAP-ban, amik azt jelezték, hogy elkezdted a feldolgozást, eldobtad azt az üzenetet,
folyik az üzenet, megjött az üzenet… folyamatos visszajelzést adtak arról, hogy hallottad, hogy
mit mondtam, érted, hogy mit mondtam, beszédnek lett azonosítva."*

⭐ **A `voice-output` modul MÁR át van emelve** (`cli/src/_modules/voice-output/`) — a hangok
alapja megvan, csak be kell kötni. ⛔ **Ne írd újra.**

### ⚠️ A sorrend NEM felcserélhető

Az **1.** előbb van, mint a szűrő bármilyen állítgatása: most a kidobott mondat **némán** tűnik
el, és küszöböt állítani mérés nélkül **találgatás** (`core-no-guessing`).

---

## 3. Build és teszt

```bash
cd cli && npx tsc -p tsconfig.json --pretty        # fő build (strict)
cd cli && npx tsc -p tsconfig.transplanted.json    # az ÁTEMELT fa (laza) — emittál is
cd cli && npx tsx scripts/transplanted-build-fix.ts # a két környezet-különbség a KIMENETEN
cd cli && npx jasmine --config=spec/support/jasmine.json
```

⚠️ **Mért buktatók:**
- A **transplanted build kimarad**, ha csak a fő `tsc`-t futtatod ⇒ a `_modules` **futásidőben
  nem létezik**. *(2026-09-07: `noEmit: true` miatt 70 fájlból soha nem készült JS.)*
- A hang-lánc **hidegindítása 19,5 s** ⇒ **lustán** töltjük, nem az indulási útvonalon.
- Mérés **build közben félrevezet** — a gép telítve van. *(Egy `timeout 22`-es bisect hamis
  „beragad" következtetést adott; nyugodt gépen minden betöltődött.)*

---

## 4. Amit a kör végén KÖTELEZŐ frissíteni

1. `__agent/plans/voice-control-transplant/hyperplan.plan.md` — ⭐ a **STATUS-blokk**
2. `__agent/CONTINUATION.md` — tételes állapot + következő lépés
3. `__agent/TASKS.md` — T-22 sora
4. az érintett dokumentáció

⚠️ **Fél-frissítés = hiba.** Mért hibaminta: a `CONTINUATION` frissül, a hyperplan STATUS-blokkja
nem — és a következő kör **újra elvégzi a kész munkát**.

---

## 5. ⛔ Amit NE csinálj

- ⛔ Ne nyúlj az **átemelt** kódhoz. Ha a viselkedése nem jó, **mellé** tegyél megfigyelőt/adaptert.
- ⛔ Ne jelentsd késznek az **első sikeres példány** alapján. *(Ez az én hibám volt: 1 mondat
  ≠ működik.)* A hang-lánchoz **átviteli arány** kell, nem egyetlen zöld eset.
- ⛔ Ne küldj üzenetet az ownernek — **az az én csatornám**. Neked a repóba kell írnod.
- ⛔ Ne indíts más CC sessiont.

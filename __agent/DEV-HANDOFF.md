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

## 🔴 2026-09-08 01:31 — ÉLŐ TESZT: KÉT HIBA (owner mérése)

⭐ **A hangjelzések MENNEK** — az owner hallja őket. Ez a te munkád eredménye.

> **Owner szó szerint:** *„most már elkezdtem hangokat hallani, de a typing hangot hallom ami a
> feldolgozást jelzi, illetve kéne jelezze. **De akkor hallom, amikor elkezdek beszélni, nem pedig
> amikor abbahagyom.**"*

| # | Hiba | Mi a helyes |
|---|---|---|
| **1** | 🔴 A **typing/feldolgozás** hang a beszéd **KEZDETÉN** szól | A feldolgozás akkor indul, amikor a megszólalás **VÉGET ÉR** ⇒ a jelzésnek is ott a helye. A kezdetnél legfeljebb egy **más** jelzés indokolt *(„hallak")* — de az nem ugyanaz a hang |
| **2** | 🔴 **Nincs konzol-kimenet** | *„Még mindig nem látom a konzolban azt, amit a CCAP-ban anno, miközben beszéltem."* A folyamatos szöveges visszajelzés **hiányzik** — az action-log nem látszik neki |

⚠️ **A kettő ugyanarra a hiányra mutat:** nem tudja **követni**, mi történik a hangjával.
A hang jelzi, hogy *valami* történik; a konzol mondaná meg, hogy *mi*.

📌 **Ez NEM prompton át érkezett** — a sorod nem volt üres, ezért ide írom. A handoff-fájlt
úgyis frissen olvasod minden ébredéskor; ez a **prompt-mentes csatorna** közöttünk.


---

## ⭐ 2026-09-08 01:41 — MEGVAN A KONZOL-KIMENET PONTOS SPECIFIKÁCIÓJA

Az owner leírta, mit akar látni — **ez a hiányzó 2. pont konkrét alakja**:

> *„Itt a hangfelismerős sztoriknál még mindig a régi CCAP megoldást próbáljuk reprodukálni… Az
> volt az egyik legnagyobb eredményem, amit még kézzel raktam össze, amikor ilyen jeleket mutat:
> **`|` színesen, egy sorban**, miközben hallja a hangomat, és azok **pirosak és zöldek**, és
> amikor **elég sok zöld van egymás mellett**, akkor **minősítjük azt egy hangszövegű üzenetnek**."*

**Amit ez jelent:**

| Elem | Mit |
|---|---|
| forma | **egyetlen sorban** futó `\|` jelek, **színesen** |
| 🟢 zöld | az adott hangkeret **beszédnek** minősül |
| 🔴 piros | nem beszéd *(zaj / csend)* |
| a szabály | **elég sok EGYMÁS MELLETTI zöld** ⇒ ez egy megszólalás |
| időzítés | **élőben, beszéd közben** — nem utólag |

⭐ **Ez ugyanaz az adat, amit az átemelt `setupSpeechDetection` már kiszámol** *(hangerő + ZCR
keretenként)* — csak **nem jeleníti meg**. ⇒ Nem új mérés kell, hanem **kivezetés**.

📌 **És ez oldja meg a másik panaszt is:** a *„nem látom, mi történik"* és a *„miért dobtad el"*
ugyanaz a kérdés. Ha a piros/zöld sáv látszik, **maga a szűrő működése válik láthatóvá** — és
akkor a küszöb hangolása sem találgatás lesz.

⚠️ **Hol jelenjen meg:** az LDP-konzolon *(ott nézi)*. ⛔ Ne a Discordra — az elárasztaná.

---

## 🔴 2026-09-08 01:58 — AZ LDP-ÚJRAINDÍTÁS: az owner MÁR TÖBBSZÖR kérte

> *„A My Assistant szerver az LDP-ben **még mindig leáll**, és utána lefut az egész LDP, és csak
> utána indul újra. Pedig **ezt kértem már többször**, hogy úgy kéne működnie, hogy miután lefutott
> az egész, **csak akkor** állítja le és indítja újra."*

**Mérve 2026-09-08 02:05:** **38 szerver-újraindítás**, ebből **20 a 22:00 óta eltelt 3,2 órában**;
átlagos ciklus-köz **10,1 perc** — miközben egy teljes pipeline **~15+ perc**.
⇒ A szerver **gyakrabban indul újra, mint amennyi idő egy körhöz kell**, és a Discord-csatorna az
idő nagy részében **halott**. *(Ma éjjel két owner-üzenet emiatt nem ért el időben — az audit
találta meg őket.)*

⚠️ **Ez a `dc ldp`-ben van, ami a `cli-dynamo` repóban él — a my-assistanton KÍVÜL.**
Felvéve: `__documentations/BEDROCK-FRS.md` → **BFR-MYASSISTANT-001**, prioritás **critical**-re emelve.

🙋 **Ha az owner azt mondja, hogy nyúlhatunk a `dc`-hez, ez a TE feladatod lesz** — addig a BFR a
csatorna. ⛔ Magadtól ne kezdj bele idegen repóba.


---

## 🟡 2026-09-08 04:02 — TÉVES RIASZTÁS a `comm doctor`-ban: a NYUGALOM gyanúsnak látszik

**Mérve:** a `doctor` ezt írta — *„A folyamat él, de az állapot-fájl 43 perce nem frissült —
elképzelhető, hogy beragadt."*

**A valóság:** `phase: server-runtime`, `pipelineComplete: true`. A pipeline **03:19-kor
befejeződött**, azóta a szerver fut. ⇒ **Nincs mit frissíteni a `status.json`-ön.**

🔴 **A HIBA LÉNYEGE:** az ellenőrzés a *„régen frissült"*-et **beragadásnak** olvassa — de a
`server-runtime` fázisban a **frissítés hiánya a NORMÁLIS állapot**. ⇒ Épp a **kívánt** helyzetet
*(nincs újraépítés, stabil szerver)* jelenti gyanúsnak.

⭐ **És épp most a legfélrevezetőbb:** amióta nincs új commit, a csatorna **végre stabilan él** —
és pont ezt jelzi problémának.

**Javaslat:** a „beragadt?" gyanú **csak akkor**, ha a fázis **NEM** `server-runtime`
*(vagy `pipelineComplete: false`)*. `server-runtime` + `complete` esetén a friss **életjel**
a bizonyíték, nem a fájl kora.

📌 Ugyanaz a hibaosztály, ami ma már négyszer előjött: **egy mező kora/neve nem a jelentése.**


---

## ⚠️ 2026-09-08 06:10 — T-52: JÓ MUNKA, DE NEM AZ, AMIT AZ OWNER KÉRT

**Amit építettél** *(és ami önmagában értékes)*: szám-összegzés a meglévő pulzus-sorban —
`🔊 hang 9 → 3 feldolgozva · ⚠️ 2 elveszett (4.1 mp)`, **60 másodpercenként**.
⭐ Helyes döntés volt a **meglévő** csatornára ülni, és a korlátot is kimondtad.

🔴 **DE az owner kérése MÁS VOLT — szó szerint:**

> *„`|` **színesen, egy sorban**, **miközben hallja a hangomat**, és azok **pirosak és zöldek**, és
> amikor **elég sok zöld van egymás mellett**, akkor minősítjük azt egy hangszövegű üzenetnek"*

| Tulajdonság | Az ő kérése | Ami elkészült |
|---|---|---|
| időzítés | **élő, beszéd közben** | 60 mp-enkénti összegzés |
| felbontás | **keretenként** egy jel | megszólalásonkénti darabszám |
| forma | **színes `\|` sáv** | szöveges szám-sor |
| mit mutat | **a döntés folyamata** *(épp beszédnek minősül-e)* | a döntés **eredménye** |

📌 **A KÜLÖNBSÉG NEM KOZMETIKAI.** Az ő sávja azt mutatja, hogy **most, ebben a pillanatban**
beszédnek minősül-e, amit mond — ez **közben** ad visszajelzést, és **ettől tudja beállítani
magát** *(hangosabban, közelebb, csendesebb környezet)*. Egy utólagos szám ezt nem adja meg.

⚠️ **Ezért a T-52 NEM zárható le** — a mostani rész maradjon *(hasznos)*, de a **színes,
keretenkénti, élő sáv** hátravan.

⭐ **Az adat ehhez MÁR MEGVAN:** a `setupSpeechDetection` keretenként számol hangerőt és ZCR-t.
Nem új mérés kell, hanem **kivezetés + színezés**.

📌 **Ez az én coordinátor-hibám is lett volna, ha nem nézem meg:** a „✅ MEGÉPÍTVE" a te
megfogalmazásod szerint igaz — de az owner szavai szerint nem. **A kész definíciója az ő kérése,
nem a mi implementációnk.**


---

## 🔴 2026-09-08 08:57 — ÉLŐ BIZONYÍTÉK: a build ELVITT egy beszélgetést

**Az owner beszélt a hang-csatornában, és kiestem alóla.** Mérve:

```
08:52:29  MA-VOICE-JOINED          — bent vagyok
08:53:58  MA-VOICE-RECORDING-STARTED
08:56:58  ÚJ LDP-PIPELINE INDULT   → szerver leáll → kiestem
```

⚠️ **Ez nem elméleti kellemetlenség többé:** elvitt egy **élő** beszélgetést, pont amikor a
rendszer épp azt csinálta volna, amiért készült.

📌 **És valószínűleg a TE commited indította.** ⇒ A gyors, sűrű commit *(ami helyes, az owner
kérte)* és az owner **élő használata** most **egymást üti**. A megoldás nem a commit visszafogása,
hanem a **make-before-break** újraindítás.

🙋 **Owner-kérdés kiment:** hozzányúlhatunk-e a `dc ldp`-hez *(`cli-dynamo`, my-assistanton kívül)*.
⛔ **Amíg nincs válasz: NE nyúlj hozzá.** Ha igent mond, ez a te feladatod, és a
`BFR-MYASSISTANT-001` tartalmazza a mérést és a javasolt API-t.

---

## ⏰ 2026-09-08 08:55 — HIBA: a státusz-kivonat UTC-ben írja az időt

> **Owner:** *„minden futásnál a státuszban benne kéne legyen, hogy pontosan mennyi most az idő"*

**Mérve:** a `ma status digest` fejléce `2026-09-08T01:02:38.765Z` volt, amikor **03:02** volt
helyi idő szerint. ⇒ Az owner **két órával korábbi** időt lát, és ebből téves következtetést von le.

🩹 **Kell:** **helyi idő** (Europe/Budapest), ember-olvasható alakban, **minden** parancs
kimenetén, ami állapotot jelent. ⚠️ Nem elég a `digest` — a `doctor` és a `voice-funnel` is
állapotot mutat.

📌 A projekt szabálya amúgy is ez: `current/principles/time-must-be-measured.md` — *„minden
időpont-állítás ELŐTT `date`"*. Az UTC-s kiírás ennek a gépi párja: **a kiírt idő is legyen az,
amit ő lát az óráján.**

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

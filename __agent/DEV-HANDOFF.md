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

## 🔴 2026-09-08 10:05 — A SZERVER 21 PERCET VÁR, ÉS 82%-A NEM RÁ TARTOZIK

**Mérve egy valódi cikluson** *(`status.json`, lépés-időkkel)*:

| Lépés | Idő | Állapot |
|---|---|---|
| `lint-client` | **600,0 s** | 🔴 **FAILED — pontosan a 10 perces `stepTimeoutMs`** ⇒ **TIMEOUTOL** |
| `dc-review-cli` | 199,1 s | failed *(találatok — nem fatális)* |
| `client-test` | 119,5 s | ok |
| `tsc-transplanted` | 48,7 s | failed *(várt)* |
| `dc-review-client` | 38,9 s | failed |
| `client-build` | 37,7 s | ok |
| **ÖSSZESEN** | **1274 s = 21,2 perc** | |
| ⭐ **ebből kliens + review** | **1043 s = 17,4 perc** | **82%** |

### 🔴 A LEGNAGYOBB EGYETLEN TÉTEL: a `lint-client` TIMEOUTOL

**600,0 s pontosan** = a `stepTimeoutMs` (600000). ⇒ Nem lassú, hanem **elakad**, és **minden
körben 10 percet éget úgy, hogy közben el is bukik.**

🎯 **Ez az első dolog, amit meg kell nézni:** miért fut 10+ percig az ESLint a kliensen.
*(Tipp, nem állítás: kimért `node_modules` / `dist` / `.angular` bejárás, vagy egy szabály, ami a
generált fájlokra is ráfut. ⚠️ Ezt MÉRD, ne tippeld.)*

### 📌 És a szerkezeti felismerés

**A szerver olyasmire vár, amitől nem függ.** A Discord-figyelő, a jelenlét-figyelő és a
hang-csatorna a **szerverben** él; a kliens-build/teszt/lint ezekre **semmilyen hatással nincs**.

⇒ Nem a „make-before-break" a fő gond — az **csak a maradék 18%-ot** javítaná.
🙋 **Owner-döntés kiment:** kiszedjük-e a kliens- és/vagy a review-lépéseket az LDP-ből.
⛔ **Amíg nem válaszol: ne módosítsd a `pipeline.config.json`-t.** De a `lint-client` timeout
okát **már most mérheted**.


---

## 🔴🔴 2026-09-08 11:10 — AZ LDP: A HELYES MŰKÖDÉS, AZ OWNER SZÓ SZERINTI LEÍRÁSÁVAL

> *„ennek az egész LDP-nek úgy kell működnie, hogy szépen lefut az összes build, az összes teszt,
> majd a **végén elindítja a szervert**, majd új triggerek érkeznek, és **nem állítja le a
> szervert**, csak újrafuttatja a buildeket, újrafuttatja a teszteket, és amikor **mindegyiknek a
> végére ért**, akkor állítja le a szervert, és akkor indítja újra. Tehát tulajdonképpen **nulla
> kiesés**."*

```
build + teszt (szerver FUT végig)  →  minden kész  →  [leáll] → [újraindul]
                                                       ↑ CSAK ITT, és azonnal egymás után
```

### ⛔⛔ AMIT SOHA NEM SZABAD — ez a legfontosabb sor ebben a fájlban

> *„**Semmit nem vehetsz ki**, hát pont az a lényege az LDP-nek, hogy lefuttatja az **összes**
> ellenőrzést, **MIELŐTT** újraindítaná a szervert."*
> *„**Semmilyen tesztet, semmilyen ellenőrzést, semmilyen reviewt ne kapcsolj ki. NEEE!**"*

🔴 **TILOS** lépést kivenni, kikapcsolni, kihagyni vagy feltételessé tenni a gyorsítás kedvéért.
⛔ A `client-build`, `client-test`, `lint-client`, `dc-review-*` **mind marad**.

📌 **AZ ÉN HIBÁM, amit ez javított:** megmértem, hogy a 21 percből 17,4 a kliens+review, és
**azt javasoltam, vegyük ki őket**. ⚠️ **Rossz kérdésre válaszoltam:** a baj **nem a 21 perc**,
hanem hogy a szerver **az elején áll le**. A hossz **nem hiba** — a **kiesés** az.

### 🎯 A tényleges feladat

A szervert **a ciklus VÉGÉN** kell leállítani-újraindítani, nem az elején.
⚠️ A `serverRestart` csak `enabled` + `postPipelineCommand` — **sorrend-opció nincs** ⇒ ez
`dc`/Dynamo-oldali viselkedés. ⛔ **Ahhoz nincs engedélyünk.**
⇒ **Amit itt vizsgálhatsz:** hol áll le valójában a szerver, és van-e a projekt oldaláról bármi,
ami előrehozza. ⚠️ **Mérd meg, ne tippeld** — a legutóbbi ok-állításom megalapozatlan volt.

🔴 **A `lint-client` 600,0 s-os TIMEOUTJA viszont attól még HIBA** — nem kivenni kell, hanem
**megjavítani**, hogy ne 10 percig fusson és bukjon el.

---

## 🔊 2026-09-08 11:02 — ÚJ KÖVETELMÉNY: felolvasás a hang-csatornában

> *„amikor itt vagyok a Discordon, be vagyok lépve melléd a Voice Channel-re, akkor jó lenne, ha az
> **üzeneteid majd felolvasásra kerülnének**. És ezt vehetjük egy kicsit **közvetlenebbre** — tehát
> ilyenkor nagyobb az esélye annak, hogy átjönnek az infók… ez a **legmegbízhatóbb** módja annak,
> hogy kommunikáljunk."*

**Amikor az owner BENT VAN a hang-csatornában:** a válaszaim **hangosan is** menjenek ki, és a
hangnem lehet **közvetlenebb**, mint az írott.
⭐ A `voice-output` modul **már át van emelve** — az alap megvan.
⚠️ Feltétel: **csak amikor tényleg bent van** *(a jelenlét a csatornában mérhető)*.

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

---

## 2026-09-08 12:15 — 3 tétel: 1 piros lépés + a hang-felolvasás + BFR-pointer

### 1. 🔴 `tsc-transplanted` PIROS — típus-regresszió, NEM viselkedés-hiba

**Mérve 2026-09-08 11:56** (`logs/live-dev-pipeline/status.json`):

```
src/_modules/voice/_services/cv-audio-classification.api-service.ts(224,9): error TS2769
  Type 'Buffer<ArrayBufferLike>' is not assignable to type 'BodyInit'.
```

⭐ **A kimenet ATTÓL MÉG ELKÉSZÜL** — ellenőriztem: `dist/cli/src/_modules/` **létezik**, a
`main.js` friss (11:56). A `noEmitOnError` szándékosan ki van kapcsolva, tehát **futásidőben
semmi nem hiányzik**. ⇒ ⛔ **Nem tűzoltás**, de a lépés pirosan hagyása **zajt csinál**, és
elrejtheti a következő, valódi hibát.

**Ami tudható az okról:** a `cli/tsconfig.transplanted.json` fejlécében dokumentáltan ezt a
pontos hibát oldotta meg a `"lib": ["es6","es2022","dom"]` — és a `lib` **most is ott van**.
⇒ A hiba **visszajött**, tehát a környezet változott alatta. A leggyanúsabb a
**TypeScript 5.7+ / `@types/node`** változás, ahol a `Buffer<ArrayBufferLike>` már nem
illeszkedik az `ArrayBufferView<ArrayBuffer>`-re. ⚠️ **Ez hipotézis — mérd meg**, ne hidd el.

🔴 **KÖTELEZŐ KORLÁTOK:**
- ⛔ **A lépést kikapcsolni TILOS.** Owner 2026-09-08 08:24: *„Semmilyen tesztet, semmilyen
  ellenőrzést, semmilyen reviewt ne kapcsolj ki. NEEE!"*
- ⛔ **Az átemelt kódhoz ne nyúlj**, ha elkerülhető (`transplant-not-rewrite`). A fájl saját
  fejléce mondja ki az irányt: *„A különbséget ott oldjuk fel, ahol nem árt: a konfigurációban."*
- ✅ Ha a konfiguráció tényleg nem elég, a **legkisebb, viselkedés-azonos** call-site változtatás
  jöhet — de akkor **írd le a `hyperplan`-ben, miért nem ment configból**.

### 2. 🔊 T-59 — felolvasás, amikor bent ül a hang-csatornában

> **Owner, 2026-09-08 08:02:** *„amikor itt vagyok a Discordon, be vagyok lépve melléd a Voice
> Channel-re, akkor jó lenne, ha az üzeneteid majd **felolvasásra kerülnének**. És ezt vehetjük
> egy kicsit **közvetlenebbre**… ez a **legmegbízhatóbb módja** annak, hogy kommunikáljunk"*

**Három al-igény, mind az övé, szó szerint:**

1. **Felolvasás**, ha bent ül *(és csak akkor)*.
2. **TTS-szöveggé alakítás:** *„van egy csomó minta és szövegpattern, amit át kéne majd
   konvertáljunk… mert át kell alakítani az egyszerűbb kódjeleket, mint például a **nyíl**, vagy
   az **egyenlőség jel**, stb. Ezeket majd ki kell írni a szöveggeneráláshoz, hogy szépen fel
   legyenek olvasva."* ⚠️ Nálam **emoji- és nyíl-sűrű** a szöveg — ez nem apró tétel.
3. **Válasz-korreláció:** *„simán előfordulhat, hogy mondasz valamit… és én arra reagálok neked,
   de közben te már rég messze jársz… Ezért majd fontos lesz, hogy ezeket vissza tud azonosítani,
   **anélkül, hogy túl sok infót raknánk ezekbe az átkötésekbe**."*

⏳ **Előfeltétel nála:** ElevenLabs kulcs + hang — 07:56-kor jelezte, hogy beállítja.

### 3. 📄 BFR leadva — az LDP-t NE próbáld helyben megkerülni

`__documentations/BEDROCK-FRS.md` → **`BFR-MYASSISTANT-001`** (`@futdevpro/cli-dynamo`,
**critical**): make-before-break újraindítás. Az owner **kifejezetten ezt kérte** (10:48).
⛔ Ne építs helyi kerülőutat, és ⛔ **egyetlen LDP-lépést se vegyél ki** — a hossz nem a hiba.

---

## 2026-09-08 13:12 — T-66: a `comm doctor` HAMIS állítást tesz a hang-csatornáról

**Mérve (13:02 és 13:04, két külön futás):**

| Tény | Forrás |
|---|---|
| `MA_DISCORD_GUILD_ID` + `MA_DISCORD_VOICE_CHANNEL_ID` **be van állítva** | `.env:39-40` |
| A bot **belépett**: *„🔊 BENT VAGYOK a hang-csatornában — honnie-place"* | action-log, **13:02:03** |
| Az életjelben **13:03:58-tól** ott a `voice.joined: true` | `listener-heartbeat.json` |
| A doktor mégis: **„A hang-csatorna nincs beállítva"** | `comm doctor`, 13:02 **és** 13:04 |

🔴 **A hiba:** `decideVoicePresenceCheck` a `!voice` ágon **`missing` + „nincs beállítva"**-t ad.
Ez **tényállítás a konfigurációról**, amit a függvény **nem tud ellenőrizni** — csak azt látja,
hogy az *életjelben* nincs `voice` blokk. A két dolog **nem ugyanaz**.

⭐ **A helyes ág `unknown`** — pontosan úgy, ahogy a szomszédos `joined === undefined` ág már
helyesen csinálja: *„a bent-ülés nem állapítható meg"*.

⚠️ **Miért nem kozmetika:** a hiba **mindkét irányban** téveszt. Most „nincs beállítva"-t mondott
egy **működő** csatornára; ugyanez a kód egy **valódi kimaradást** is „nincs beállítva"-ként
mutatna — vagyis pont azt az esetet fedné el, amiért a check készült
*(a fájl saját kommentje: „a legfontosabb ág: `configured && !joined` ⇒ broken")*.

📌 **A megkülönböztetéshez a konfiguráció tényleges olvasása kell** *(`readVoicePresenceConfig`)*,
nem az életjel hiánya. Három állapot: **nincs konfigurálva** · **konfigurálva, még nem jelentett**
(`unknown`) · **konfigurálva, nincs bent** (`broken`).

⛔ Ez **saját szabály-sértés is**: *„Egy állapot-mező NEVE nem a jelentése"*
(`post-development-verification.md`) — a `voice` mező **hiánya** nem jelenti a konfiguráció hiányát.

---

## 2026-09-08 18:08 — 🎙️ T-68 a következő: hangüzenet ↔ transzkript nyilvántartás

🔴 **ÉLŐ FÁJDALOM, nem elméleti feladat.** MOST, ebben a percben van egy **feloldatlan
hangüzenete** a sorban: **3/5 próba**, minden kör *„A felismerés 5 perc után sem fejeződött be"*.
Az owner **nem tudja**, mit mondott benne — és **én sem**.

> **Owner (2026-09-08 15:31, szó szerint):** *„a rendszernek rögzítenie kéne, hogy melyik
> üzenetekhez melyik transzkript tartozik, illetve melyik üzeneteknek nem sikerült a transzkript,
> és ilyenkor ezeket majd **visszamenőlegesen is fel kell tudjad oldani**."*

> **Owner (2026-09-08 14:49):** *„kelleni fog **reply reference** és **on demand read** és
> **voice process**"*

> **Owner (2026-09-08 13:48) — a KIVÁLTÓ panasz:** *„Adtál egy ilyet de nem tudom mire vonatkozik,
> **ilyenkor kellene a reply**: 🔴 Egy hangüzenetedet VÉGLEG nem sikerült felismernem."*

### A három rész — ebben a sorrendben

| # | Mit | Miért ELŐBB, mint a többi |
|---|---|---|
| **1** | **Nyilvántartás:** `messageId → transcript \| failed(ok, próbák)` — tartósan | ⛔ **Enélkül a 3. lehetetlen.** ⚠️ Mérve: a `SttRetryQueue` a **feladás után TÖRLI** a bejegyzést ⇒ ma **nincs miből** visszamenőleg feloldani. Ez a **valódi blokkoló** |
| **2** | **On-demand read:** reply-referenciával megjelölt üzenet újraolvasása | az owner ezt **explicit** kérte, és a `7e10dc1` már bekötötte, hogy a bukás-üzenet **válaszként** megy — a reply-lánc tehát **létezik**, csak visszafelé nincs használva |
| **3** | **Visszamenőleges feloldás:** a feladott hangok újrapróbálása kérésre | ez a **cél**, de az 1. nélkül nincs mit újrapróbálni |

⛔ **Ne kezdd a 3-mal.** A csábítás az lesz, hogy „a retry-sort úgyis bővíteni kell" — de a
törlés miatt a történet **már elveszett**. Előbb **megőrizni**, aztán visszanyúlni.

### ⚠️ Amit MÉRJ MEG, mielőtt a szűrőkhöz vagy a timeouthoz nyúlnál

🔴 **A gyökérok NEM a mi kódunkban lehet:** az STT **5 percenként** túllép, miközben a gép
**11 napja** megy és a RAM **93,9 %**. ⛔ **Az FDP AI-hoz (38321) NEM NYÚLUNK** — se újraindítás,
se modell-unload (`fdp-ai-never-restart.md`).

⭐ **A feladat ettől független és attól még értékes:** ha a felismerés bukik, a hangot **akkor is
meg kell őrizni**, hogy később — jobb körülmények között — feloldható legyen. Sőt: **pont akkor
ér a legtöbbet.**

### 🚫 Amihez ne nyúlj

- ⛔ **Egyetlen LDP-lépést sem** kapcsolsz ki (owner, 08:24: *„Semmilyen tesztet, semmilyen
  ellenőrzést, semmilyen reviewt ne kapcsolj ki. NEEE!"*).
- ⛔ Az STT **küszöbeihez** nem nyúlsz: mérve **nem ott** van a hiba.
- ⛔ Ne írj az ownernek. **Minden owner-kommunikáció az asszisztensé** — a DEV-be érkező
  owner-üzenet maga is **kritikus hiba** (`message-routing-must-be-pinned.md`).

### Kész-definíció

`__agent/TASKS.md` **T-68** ✅-re vált, ha: **(a)** egy bukott felismerés után a hang és a
próbálkozás-történet **megmarad**, **(b)** reply-referenciával **újra kérhető** az olvasás/átirat,
**(c)** mindre **teszt** van, és a CLI-suite **zöld**. ⭐ És a mai, most is feloldatlan
hangüzenetén **igazolva** — nem csak fixture-ön.

---

## 2026-09-09 00:05 — 🔴 5 review-lépés PIROS: valódi találatok, nem eszközhiba

**Mérve** (`logs/live-dev-pipeline/status.json`, ciklus 22:40, `pipelineComplete: true`):

| Lépés | Bukó szabály(ok) |
|---|---|
| `dc-review-server` | `controller-handler-error-wrapping` · `unique-error-codes` |
| `dc-review-client` | `no-native-browser-dialogs` |
| `dc-review-relay` | `controller-handler-error-wrapping` |
| `dc-review-browser-extension` | `no-silent-catch` |
| `dc-review-cli` | *(a naplóban csonkolt — fusd le, és nézd meg)* |

**Két konkrét, már látható találat:**
- `client/src/app/_modules/dashboard/_components/d-waves/d-waves.component.ts:366` —
  natív böngésző-dialógus (`window.confirm` / `alert`).
- `client/src/app/_modules/reports/_components/r-dev-io/r-dev-io.component.ts:83` —
  `.subscribe()` **`DyNX_SubscriptionControl` nélkül** *(kell: `extends DyNX_SubscriptionControl`
  + `addSubscription()`)*.
- Több **duplikált blokk** is van *(cli `linkedin.config.ts:82`, server `google.data-service.ts:195`,
  client `r-dev-io` .ts/.scss)*.

### ⚠️ A LÉNYEG, amit ne érts félre

⛔ **Az eszköz NEM romlott el.** A „failed" itt azt jelenti: **talált valamit**. Ez a review
**dolgozik**. ⇒ A megoldás **a találatok javítása**, ⛔ **nem** a lépés kikapcsolása vagy
`fatal: false`-ra állítása.

> **Owner, 2026-09-08 08:24:** *„Semmilyen tesztet, semmilyen ellenőrzést, semmilyen reviewt
> ne kapcsolj ki. NEEE!"*

🔴 **Miért sürgetőbb, mint amilyennek látszik:** amíg **állandóan piros**, a review **nem tud
jelezni**. Egy új, valódi hiba beleolvad a meglévő pirosba, és **senkinek nem tűnik fel** —
pontosan az a hibaosztály, ami ma már kétszer megvágott minket
*(a némán elavult `dist`, és a hamis „nincs beállítva")*.

**A `no-silent-catch` külön súlyos:** a projekt hard rule-ja a **zero-tolerance** a néma
`catch`-re (`current/principles/error-handling.md`).

### Sorrend és kész-definíció

1. **Fusd le a reviewt** csomagonként, és írd ki a **teljes** találati listát *(a `status.json`
   csonkol — ne abból dolgozz)*.
2. Javítsd a találatokat. ⚠️ A duplikációnál a **kivonás** a cél, nem a másolat átnevezése.
3. ✅ **Kész, ha mind az 5 review-lépés ZÖLD**, és a CLI/server/client teszt-suite is zöld.
4. ⛔ Ha egy találatot **nem lehet** javítani, azt **ne némítsd el**: írd le ide, **miért**, és
   hagyd az ownernek eldönteni.

📌 Emlékeztető: a `tsc-transplanted` **változatlanul piros** (`Buffer` → `BodyInit`) — a
2026-09-08 12:15-ös szakasz szól róla. Az is ide tartozik.

---

## 2026-09-10 18:35 — 🔊 HÁROM OWNER-KÉRÉS a hang-csatornáról (mind fejlesztés)

> 🔴 **Owner, 18:27:** *„Fontos, hogy ezeket a fejlesztési feladatokat **ne te csináld**, te
> asszisztensi munkákra koncentrálj csak. És **minden fejlesztési munkát adj a devnek**."*

⚠️ **Ez rám szólt** — ma este magam javítottam a hang-jelzéseket, a szűrőt és a küldőt.
⇒ Ezt a hármat **NEM kezdem el**; a tiéd.

### 1️⃣ Hangerő-beállítás — három helyről

- **Nekem** *(agentként)* állíthatónak kell lennie.
- **Default: a CCAP-ban beégetett érték.** ⭐ Kimérve a forrásból:
  `settings.const.ts:298` → **`defaultVolume: 1.0`** · `greetingsVolume: 0.5` *(a `volume: 0.5`
  sor **ki van kommentezve**, tehát nem az volt élesben)*. A lejátszó
  `resource.volume.setVolume(...)`-t hív *(`cvo-audio-playback.control-service:151,215`)*,
  a `cvo-main:475` pedig **`settings.ccap.volume * 0.5`**-öt — ⚠️ ezt a szorzót nézd meg, mert
  a tényleges hangerő ettől függ.
- **A My Assistant felületén is** állítható legyen *(owner: „a My Assistant felületén is
  szeretném tudni állítani")*.

### 2️⃣ 🔴 MINDEN üzenet menjen AUTOMATIKUSAN mindkét helyre

> **Owner:** *„Minden üzeneted amiket küldesz az **automatikusan** kell jöjjön a **Voice
> csatornára és a privát DM** csatornára, anélkül, hogy azt külön állítgatnád… **Semmiképpen ne
> kelljen neked kétszer küldeni**, hanem **by default**… És a voice-ra, hogyha ott vagyok,
> akkor **fel is olvasod**."*

⚠️ **Ez visszavonja a mai `--voice` kapcsolómat** *(`0b44740`)*: nem opció, hanem
**alapértelmezés**. ⇒ `sendDiscordMessage` egyszeri hívása menjen **DM + hang-csatorna** felé,
és ha az owner **bent van** a hang-csatornában, **olvassa is fel** *(T-59, az ElevenLabs kulcs
**már be van állítva és MŰKÖDIK** — `pro`, 600 159 karakter)*.

📌 ⛔ **Vigyázz a mennyiségre:** a duplázás **nem** jelenthet két külön üzenet-eseményt a
naplóban/mérésben — egy üzenet, két cél.

### 3️⃣ 🔴 A szerver leállásakor/újraindulásakor LÉPJ KI a hang-csatornából

> **Owner, 18:28:** *„amikor leáll a szerver, illetve újraindul, olyankor **ki kéne lépjél a
> csatornáról**, hogy **ne higgyem azt, hogy itt vagy**, miközben éppen újraindul a szerver és
> nem vagy itt."*

⭐ **Ez ma élesben megtörtént:** a kézzel indított figyelőm bent ült a csatornában, miközben a
szerver nem futott — az owner **fals jelenlétet** látott. Az ő szavaival: *„azt hiszem, hogy itt
vagy, és figyelsz, miközben nem is."*

⇒ A bent-ülés **a szolgáltatás állapotát** jelezze, ne a figyelő-folyamatét: leálláskor/újraindításkor
**tiszta kilépés** *(és belépés csak akkor, ha a lánc tényleg kiszolgál)*.

### ⛔ Közös korlátok

- Egyetlen LDP-lépést/tesztet/reviewt **sem** kapcsolsz ki.
- ⛔ **Ne írj az ownernek** — minden owner-kommunikáció az asszisztensé.
- A kész-definíció: teszt + zöld suite, és a **3️⃣-nál élő igazolás** *(a szerver leállítása
  után a bot tényleg nincs bent)*.

---

## 2026-09-10 18:56 — 🔑 A FELOLVASÁSHOZ MINDEN ADOTT: kulcs + hang megvan

> **Owner, 18:54:** *„Állítottam be az ENV-be egy **Voice ID**-t is, majd azt szeretném, hogy
> **azt használd**. (`MA_ELEVENLABS_VOICE_ID`)"*

**Ellenőrizve élőben (18:56) — mindkettő működik:**

| Env-változó | Állapot |
|---|---|
| `FDP_ELEVENLABS_API_KEY` | ✅ **érvényes** — `pro` csomag, 600 159 karakter keret, 0 elhasználva |
| `MA_ELEVENLABS_VOICE_ID` | ✅ **létező hang** — név: **`Honnie`**, `category: generated`, `labels.language=hu` |

⭐ Az owner **magyar nyelvre generált, „Honnie" nevű hangot** adott — ⛔ **ne írd felül** semmilyen
alapértelmezéssel, és ⛔ ne égess be másik `voiceId`-t. Ha az env hiányzik, **ne találgass**:
naplózz és hagyd ki a felolvasást *(a néma kihagyás jobb, mint idegen hangon megszólalni)*.

📌 **Mindkettő a `.env`-ben van** *(gitignore-olt)*, a `.env.example`-ben csak helykitöltő.
⛔ **Soha ne írd a kulcsot vagy az azonosítót naplóba, commit-üzenetbe vagy hibaszövegbe.**

⚠️ Az átemelt `el-text-to-speech.control-service` a `voiceId`-t **kérés-paraméterként** várja
*(`el-text-to-speech-request.interface.ts:18`)* — tehát a hívónak kell átadnia; nincs benne
env-olvasás. ⇒ A bekötés a **hívó** oldalán van.

**Ez a 2. pont (automatikus küldés) záró darabja:** *„a voice-ra, hogyha ott vagyok, akkor
**fel is olvasod**"*.

---

## 2026-09-10 19:18 — 🔔 A SZOLGÁLTATÁS-FIGYELŐ ÉSZLEL, DE NEM ÉRTESÍT

> **Owner, 19:13:** *„hogyha nem elérhetőek a szerverek bármelyik, akkor azt **mindenképpen
> jelezd nekem, ez nagyon fontos**. Elméletileg már van implementációnk… de nem biztos, hogy ez
> aktív."*

**Mérve (`GET /api/healthz` → `services`, 19:16):**

| | |
|---|---|
| A figyelő **aktív**, be van kötve | `app.server.ts:246` (root-service) ✅ |
| **Észlelte** a kiesést | mind a **7 cél** `unreachable`, **28 egymást követő bukás** |
| Mióta | `lastHealthyAt: 01:33` ⇒ **~15,7 óra** |
| 🔴 **Értesített bárkit?** | **NEM** — sem az asszisztenst, sem az ownert |

### A feladat: a hiányzó láncszem az ÉRTESÍTÉS

Az adat egy végponton ül, amit **valakinek le kell kérdeznie**. ⇒ 15,7 órán át senki nem tudta,
hogy állnak a szerverek. **A megfigyelés önmagában nem riasztás.**

**Amit kérünk:** ha egy cél `unreachable`-be **vált** *(vagy N bukás után)*, az **magától**
jusson el az ownerhez a szokásos csatornán. ⛔ Ne az legyen, hogy „ott van a `healthz`-ben".

📌 **Állapot-váltásra** szóljon, ne minden körben — különben **15,7 órán át percenként** üzenne.
⚠️ **A mennyiség itt kockázat:** az owner fő panasza a sok üzenet *(`discord-message-style.md`)*.
⇒ **Váltáskor egyszer**, és **helyreálláskor egyszer**.

### ⚠️ Két mért csapda, amit a megoldásnak kezelnie kell

1. **30 perces mintavétel** (`intervalMs: 1800000`) ⇒ az állapot **fél óráig téves** lehet
   **mindkét irányban**. Élő példa ugyanabból a percből: a figyelő szerint az **Organizer
   `unreachable`**, miközben **sikeresen létrehoztam benne egy feladatot** *(19:14)*.
   ⇒ Riasztás előtt **érdemes egy friss próbát** tenni, hogy ne küldjünk hamis riasztást.
2. A `lastHealthyAt` **hiányozhat** *(Production Webhook, Gateway: `-`)* ⇒ a „mióta" nem mindig
   számolható. ⛔ Ne dobjon `NaN`-t vagy „ismeretlen óta"-t a felhasználó felé.

### ⛔ Korlátok

⛔ Egyetlen ellenőrzést sem kapcsolsz ki · ⛔ ne írj az ownernek *(a csatorna az asszisztensé — a
riasztás is az ő nevében megy)* · ✅ teszt + zöld suite.

---

## 2026-09-10 19:52 — 🔊 A FELOLVASÁS BLOKKOLÓJA: „Service not initialized" — és NEM az env-sorrend

**Az owner kérdése (19:46):** *„Mikor lesz már hangod? már szeretnék szóban is beszélgetni…"*
⇒ Ez most **az ő legfontosabb nyitott kérése** a hang-vonalon.

**Mérve — két élő próba, két külön figyelő-példánnyal:**

| Idő | Figyelő indult | Eredmény |
|---|---|---|
| 19:47:27 | régi *(a `de6e00c` fix ELŐTT)* | `MA-VOICE-READ-ALOUD: A beszéd-szintézis nem sikerült: **Service not initialized**` |
| 19:50:04 | **19:49:33** *(a fix UTÁN, dist 19:46)* | **UGYANAZ** |

### 🔴 AMIT KIZÁRTAM — ⛔ ne itt keresd

**Az env-sorrend NEM a hiba.** Közvetlenül a **buildből** mérve:

```
import('./dist/cli/src/bootstrap-env.js')            → process.env kulcs: JELEN (51 kar.)
import('./dist/.../env-keys.const.js') → envKeys.elevenLabs.apiKey: JELEN (51 kar.)
```

⇒ A `bootstrap-env` **helyesen** megtalálja a gyökér `.env`-et *(a `__agent`+`package.json`
páros alapján)*, és az `envKeys` **fel van töltve**. A te `de6e00c` javításod **jó** — csak
nem ez volt az egyetlen ok.

### ⇒ Ahol viszont ÉRDEMES nézni

`el-text-to-speech.control-service.ts` `initializeService()` a **konstruktorban** fut, és
`isInitialized`-et állít. A `convertTextToSpeech` ezt a **befagyott** állapotot nézi.

**Hipotézisek — ⚠️ EGYIKET SEM MÉRTEM, ne hidd el egyiket sem:**
1. A szolgáltatás **singletonként** korábban jött létre, mint ahogy a `.env` betöltődött abban a
   **konkrét folyamatban** *(a saját mérésem külön processzben futott — az nem bizonyítja a
   figyelő processzét)*.
2. A figyelőt a szerver **`SupervisedChild`-ként** indítja — lehet, hogy nem a `main.ts`
   belépési ponton át, tehát a `bootstrap-env` **nem fut le** ott.
3. Az `elevenlabs_AS.configure()` **dob** *(a `catch` ág fut)* — a hibaüzenet az `error`-ágon is
   ugyanez lenne. ⭐ A `DyFM_Log.error('❌ …not initialized', apiKey)` sor **kiírná** — érdemes
   megnézni a figyelő **saját** kimenetét, nem csak az action-logot.

⭐ **A leggyorsabb mérés:** a figyelő processzében naplózz **egyetlen sort** indulásnál —
*„elevenlabs apiKey jelen: igen/nem"* ⛔ (az értéket **soha** ne). Ez egy körben eldönti az 1–2. pontot.

### Kész-definíció

Az owner **hallja** a hangot a `honnie-place` csatornában — ⛔ nem az, hogy „a teszt zöld".
📌 A hang: `MA_ELEVENLABS_VOICE_ID` → **„Honnie"** (hu). A kulcs `pro`, 600 159 karakter, 0 fogyott.

---

## 2026-09-11 00:20 — 🔊 MEGVAN A GYÖKÉR: elavult kulcs-formátum-ellenőrzés ⇒ V3-ra kell váltani

> ⚠️ **Ez a szakasz pótolja azt, amit rosszul kézbesítettem.** A mérést 2026-09-10 21:40-kor
> elvégeztem, de az **`AGENT_BUS.md`-be** írtam *(AGB-2026-09-10-03)* — az viszont a **DEV → asszisztens**
> irány. A te feladat-forrásod **ez a fájl**, tehát a munka **sosem ért el hozzád**. Az én hibám.

**Az owner nyomása (2026-09-10 23:53):** *„Most már jó lenne, ha meg tudnál szólalni lassan."*
⇒ Ez a **legfontosabb nyitott fejlesztés**.

### 🔴 A gyökér — MÉRVE, nem hipotézis (ez zárja le a 19:52-es szakasz 3. hipotézisét)

`cli/src/_modules/elevenlabs/_services/el.api-service.ts:91-94`:

```ts
if (!trimmedKey.startsWith('xi-api-')) {
  DyFM_Log.error(`❌ API key does not start with "xi-api-" …`);
  throw new Error('Invalid ElevenLabs API key format - must start with "xi-api-"');
}
```

Az owner kulcsa **`sk_`**-val kezdődik *(ez az ElevenLabs jelenlegi formátuma; az `xi-api-` a régi)*.
⇒ a `configure()` **dob** ⇒ a `catch` ág fut ⇒ `isInitialized = false` ⇒
`convertTextToSpeechSimple` mindig `{ success:false, error:'Service not initialized' }` ⇒ **néma marad**.
A `speakInVoiceChannel` helyesen nem dob, csak `detail`-t ad — ezért nem látszott kívülről.

⭐ **Ez a 19:52-es szakasz 3. hipotézise, immár igazolva.** Az 1. és 2. hipotézis (env-sorrend,
`SupervisedChild` belépési pont) **kizárva** — az `envKeys` fel van töltve.

### ⛔ NE a prefixet told ki — OWNER-KORREKCIÓ (2026-09-10 21:46)

> *„nem a V3 Eleven Labs lett leimplementálva, hanem a régi Fors, ami sosem működött jól.
> A régi fosnál volt ez a XI, a Pi, mit tudom én micsoda, amit hogyha kell, akkor neked kell
> hozzáfűzni majd."*

⇒ A `sk_`-ra lazított ellenőrzés a **régi integrációt tartaná életben**. **A V3-as ElevenLabs
implementációra kell váltani**, és a kulcsot úgy átadni, ahogy a V3 várja.

### A három elvárás

| # | Mit | Miért |
|---|---|---|
| **a** | **V3-as ElevenLabs implementáció** *(nem prefix-lazítás)* | owner-korrekció, l. fent |
| **b** | 🔒 **A kulcs ÉRTÉKE SOHA nem mehet naplóba** | `el-text-to-speech.control-service.ts:46` **most kiírja**: `DyFM_Log.error('❌ … not initialized', envKeys.elevenLabs.apiKey)`. Mérve: benne van a `logs/live-dev-pipeline/server.log`-ban. ✅ **Nincs git-expozíció** *(a `logs/` gitignore-olt, a fájl nem trackelt, a history tiszta)*. ⛔ A **rotáció owner-döntés** (`core-secret-rotation-owner-only`) — hozzá ne nyúlj. Max. hossz/prefix naplózható |
| **c** | **Végponttól végpontig igazolás** | ⚠️ a „lefut a kód" **nem** bizonyíték — az owner **hallja** a hangot a csatornában. Ezt a lépést **ő** tudja csak lezárni, ezért a te dolgod: állítsd készre, és **jelentsd az AGENT_BUS-ban**, hogy próbára kész |

⚠️ **`transplant-not-rewrite`:** a V3-váltás a **kliens-réteget** érinti — az átemelt fát
egyébként hagyd békén. Ami eltér, az **mellé** kerül, nem bele.

---

## 📮 HOGYAN ÉR EL HOZZÁD A MUNKA — a két csatorna (2026-09-11, szabály-javítás)

> **Owner, 2026-09-11 00:08:** *„te kezeled a devet, te delegálsz neki mindent. Csak folyton
> figyelned kell, hogy mozgásban van-e, vagy sem. Hogy direkt session üzenetként kell elküldje
> neki valamit, vagy csak valamilyen file-on keresztül."*

| Irány | Csatorna | Mikor |
|---|---|---|
| **asszisztens → DEV** | **`__agent/DEV-HANDOFF.md`** *(ez a fájl)* | **MINDIG** — ez a feladat-forrásod, akkor is, ha épp nem futsz |
| **asszisztens → DEV, ha FUTSZ** | `SendMessage` a session-nevedre | ha **most azonnal** kell tudnod róla; ⚠️ ez **kiegészítés**, nem helyettesíti a fájlt |
| **DEV → asszisztens** | **`__agent/AGENT_BUS.md`** | jelentés, kérdés, blokkoló |

⛔ **Feladat SOHA nem megy csak az `AGENT_BUS`-ba** — az a **visszirány**. Mérve: pontosan ezért
állt a hang-hiba 4 órán át úgy, hogy „át volt adva".


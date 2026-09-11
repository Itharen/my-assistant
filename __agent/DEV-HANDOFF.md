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

---

## 2026-09-11 01:10 — 🎙️ A HALLGATÁS NEM MŰKÖDIK + kérés: a hang-csatorna TÜKRÖZÉSE a DM-be

**Owner, 01:04-01:05:** *„Mirrorozhatnád az üzeneteket a voice channelről ide a privát messagebe
is."* · *„furcsa, mert most online is vagy, sőt az előbb beszéltél is, de mégis minthogyha nem
hallgatnál."*

⇒ **Két külön tétel, egy körben ne vidd mindkettőt** *(`one-function-is-enough`)*: **először az
(A)**, mert az a hiba; a (B) fejlesztés.

### (A) 🔴 A HIBA — MÉRVE, nem panasz

```
ma comm voice-funnel --day 2026-09-11
  🎙️  megszólalás érzékelve ......... 2
  📼  felvétel a feldolgozásig ...... 0
  ✅  kötegbe került ................ 0
  🎚️  a felvevő eldobta ............. 0
  ❌  felismerés után elveszett ..... 0
```

⭐ **Ez a lényeg:** a **detektálás megtörtént** *(2 megszólalás)*, de **egyetlen felvétel sem**
jutott el a feldolgozásig — és **nem is dobta el** semmi. Vagyis a lánc **a detektálás és a
felvétel-indítás között** szakad meg, ⛔ nem a felismerésnél és nem a kötegelésnél.

⚠️ A riport figyelmeztetése *(„a megszólalás beleolvadhatott egy már futó felvételbe")* itt
**nem mentség**: futó felvétel sem volt, a `📼` is **0**.

**A szerver-logból, ugyanebből az ablakból:**

```
[voice] 01:04:19 MA-VOICE-JOINED 🔊 BENT VAGYOK a hang-csatornában — „honnie-place"
[voice.service-watch.probe] MA-CLI-SWALLOWED-FAILURE: TypeError: fetch failed
```

⇒ A csatlakozás **megvan**, tehát a jelenlét nem a baj. Az elnyelt `fetch failed` a
`service-watch` **próbájában** keletkezett — ⚠️ **nem állítom, hogy ez az ok**, de ez az egyetlen
hiba az ablakban, érdemes innen indulni.

📌 **Kezdd a `voice-channel-recorder.ts`-nél:** mi történik a detektálás után, és miért nem
indul (vagy miért nem zárul le) a felvétel. A `voice-missed-speech.ts` és a `voice-funnel-report.ts`
már megvan — a mérőeszköz kész, csak a hibát kell megtalálni vele.

### (B) A KÉRÉS — a hang-csatorna tükrözése a privát üzenetbe

Amit a hang-csatornán mondok neki, az **jelenjen meg a Discord DM-ben is**. Indok *(kimondatlan,
de a mérésből látszik)*: a hang **elszáll**, a DM **megmarad** — ugyanaz a logika, mint a
`message-delivery-reliability.md`-ben.

⚠️ A tükrözés **ne duplikálja** azt, amit amúgy is DM-be küldök *(`ma comm say`)* — csak a
**hang-csatornán elhangzottat** vigye át, jelöléssel, hogy az hangból jött.

### 🔒 BIZTONSÁG — a kulcs ÚJRA naplóba került (01:04)

A `server.log`-ban **friss** bejegyzés:
`❌ ElevenLabs text-to-speech service not initialized <A KULCS TELJES ÉRTÉKE>`

⇒ A 2026-09-11 00:20-as szakasz **(b)** pontja **még nincs kész**, és **minden indulásnál újra
kiírja**. ⛔ A kulcs értéke **soha** nem mehet naplóba — max. hossz/prefix.
⛔ **A rotáció owner-döntés** *(`core-secret-rotation-owner-only`)*, jelezve neki — te ne nyúlj hozzá.

⚠️ Ugyanez a log mutatja, hogy az **`xi-api-` prefix-ellenőrzés még él** — a 00:20-as szakasz
**(a)** pontja *(V3-ra váltás)* tehát változatlanul a soron lévő munka.

---

## 2026-09-11 01:20 — 🔇 NE BESZÉLJÜNK EGYSZERRE: a felolvasás álljon meg, amíg ő beszél

> **Owner, 2026-09-11 01:15:** *„amikor elkezdek beszélni, és amíg beszélek, meg utána még talán
> plusz pár másodpercig szüneteltetni kéne a felolvasást. Aztán újra folytatni. (Hogy ne
> beszéljünk egyszerre.)"*

⚠️ **Ez a HALLGATÁS-hiba UTÁN jön** *(01:10-es szakasz)* — amíg a felvétel el sem indul, addig
nincs mihez igazítani a szüneteltetést. ⛔ Ne kezdd ezzel.

### Az elvárt viselkedés

```
ő beszélni kezd        → a felolvasás AZONNAL szünetel
amíg beszél            → szünetel
elhallgat              → +néhány másodperc türelmi idő
a türelmi idő letelt   → a felolvasás ONNAN folytatódik, ahol abbamaradt
```

### Amit érdemes végiggondolni

| Kérdés | Miért számít |
|---|---|
| **szünet vagy megszakítás?** | Az owner **„aztán újra folytatni"**-t mondott ⇒ **folytatás**, nem újrakezdés és nem eldobás. A mondat közepén elvágott hang és a teljes újramondás **egyaránt rossz** |
| **mi a jelforrás?** | A megszólalás-detektálás **már megvan** *(a tölcsér-riport `🎙️ megszólalás érzékelve` sora számol)* — ⛔ ne építs másikat, ezt kösd rá |
| **mennyi a türelmi idő?** | *„talán plusz pár másodperc"* ⇒ **paraméter**, ne beégetett szám. Alapérték 2-3 s, és állítható ugyanott, ahol a hangerő |
| **saját magamra ne süljön el** | ⚠️ A saját felolvasásom is hang a csatornában. Ha a detektor **engem** hall meg, végtelen szünetbe kerülünk — ezt **méréssel** zárd ki, ne feltételezéssel |

📌 **Kapcsolódó, már meglévő darabok:** `voice-read-aloud.ts`, `voice-read-aloud-watcher.ts`,
`voice-channel-recorder.ts`, `voice-volume.ts` *(a hangerő már paraméteres és három helyről
állítható — a türelmi idő ugyanezt a mintát követheti)*.

⛔ **`one-function-is-enough`:** ez **EGY** funkció. Ne told mellé a tükrözést *(01:10-es szakasz
(B) pont)* ugyanabban a körben.

---

## 2026-09-11 01:24 — ✅ A HALLGATÁS MEGVAN — és egy MÉRT átirat-hiba mellé

⭐ **A 01:10-es szakasz (A) pontja MEGOLDÓDOTT:** két hangüzenet **átért hozzám** a DM-be,
tehát a felvétel elindul, a felismerés lefut, és a **tükrözés is működik** *(a (B) pont is)*.
⛔ Ezt a két tételt **ne** vidd tovább.

### 🔴 AMI VISZONT ROSSZ: a nyelv-felismerés

A két átirat közül az **első** ez lett:

```
"Jag måste bara vara en falla om en gång."
```

⇒ **Svéd.** Az owner **magyarul** beszélt. A második átirat ugyanabban a percben **helyes magyar**
lett, tehát a lánc alapvetően jó — a nyelv-felismerés viszont **üzenetenként dönt**, és el tud
tévedni.

**A kérés:** a felismerés **nyelve legyen rögzítve magyarra**, ne találgasson. ⚠️ Ha az API
támogat explicit `language` paramétert, azt kell átadni; ha nem, akkor a válasz nyelvét
**ellenőrizni** kell, és eltérésnél újra kérni.

📌 **Miért nem kozmetika:** a félrehallott átirat **nem hibaként** jelenik meg — teljes értékű
üzenetként ér hozzám, és **rossz munkát indíthatok el belőle**. Ez ugyanaz a hibaosztály, mint a
néma render-bukás: a lépés „lefutott", csak nem azt csinálta, amit kellett.

---

## 2026-09-11 01:30 — ✂️ A FELOLVASÁS LEVÁGJA A VÉGÉT — ne csonkoljunk, DARABOLJUNK

> **Owner, 2026-09-11 01:28 (hang):** *„az üzeneteidnél most így levágja a végét, és azt mondja,
> hogy a folytatás írásban… túl hosszú az üzenet, akkor szét kéne bontani. Itt majd akkor alapos
> kezelés kell, illetve, hogy lehetőleg ne [vágjunk] le semmit."*

### A MÉRT viselkedés

`cli/src/voice/voice-speech-text.ts`:

```ts
export const SPEECH_MAX_CHARS: number = 700;
...
return lastStop > SPEECH_MAX_CHARS / 2
  ? `${head.slice(0, lastStop + 1)} A többi írásban.`
  : `${head.trimEnd()}… A többi írásban.`;
```

⇒ **700 karakter fölött a maradék ELVÉSZ a hang-csatornán.** Nem hiba, nem figyelmeztetés:
a függvény **csonkolt szöveget ad vissza**, és a hívó nem tudja, hogy volt még.

**Mérve a mai üzeneteimen:** 328 · 611 · 632 · 694 · 1006 · **1441** karakter.
⇒ Kettő közülük **ténylegesen csonkult**, és a leghosszabbnak **több mint a fele** veszett el.

### Amit kérek

**Csonkolás helyett DARABOLÁS:** a szöveg **mondathatáron** bomoljon ≤700 karakteres részekre, és
a felolvasó **mindet** mondja ki, sorrendben.

| Szempont | Elvárás |
|---|---|
| **veszteség** | ⛔ **nulla** — ez a kérés lényege |
| **határ** | mondathatár, ahogy most is; ha nincs, akkor szóhatár, ⛔ soha szó közepén |
| **jelzés** | ha több rész lesz, a **darabszám** hangozzon el egyszer az elején *(„négy részben mondom")*, ⛔ ne minden rész végén |
| **megszakíthatóság** | ⚠️ a 01:20-as szakasz *(szüneteltetés, amíg ő beszél)* **erre is** vonatkozik: ha a 2. rész közben megszólal, a 3. **ne** induljon el |
| **`SPEECH_MAX_CHARS`** | maradjon a **darab** mérete, ne a teljes szövegé |

⚠️ **A tesztek:** a `voice-speech-text.spec.ts`-ben van már fedezet a csonkolásra — azt **át kell
írni** a darabolásra, ⛔ nem törölni.

📌 **A másik fele nem a tiéd:** hogy az üzeneteim **ilyen hosszúak**, az **az én hibám**, és a
`current/principles/discord-message-style.md`-ben javítom. A darabolás a **hálóz**, nem a megoldás.

---

## 2026-09-11 01:30 — ℹ️ Az idegen nyelvű átirat: owner-visszajelzés

> *„amikor ilyen más nyelvet érzékel, az előfordulhat, az transzkript-hiba."*

⇒ Az owner **ismeri és elfogadja** a jelenséget. ⚠️ Ettől a 01:24-es szakasz kérése **él**: ha az
API fogad explicit nyelv-paramétert, adjuk át — a **javítható** hibát nem hagyjuk bent azért, mert
ismerjük. ⛔ De **ne** építs köré nagy detektálás-logikát: egy paraméter, és kész.

---

## 2026-09-11 01:33 — 🔢 A FELOLVASÁSNAK NINCS SORA + a bizonytalanság INDOKA hiányzik

> **Owner, 2026-09-11 01:30 (hang):** *„mintha két üzenetet küldtél, és csak az első került
> felolvasásra… majd itt bonyolultabb queuing rendszert is kell kialakítsunk"*
> **01:29:** *„Ha hallottam, de nem értettem biztosan résznél, ott jó lenne, ha kiírnánk azt is,
> hogy mit hallottál, vagy miért nem lett biztos."*

### (A) 🔴 NINCS SOR — és ezt MÉRTEM, nem feltételezem

```
grep -n "queue|Queue|inFlight|isSpeaking|busy"  voice-read-aloud.ts  voice-read-aloud-watcher.ts
  -> 0 talalat
```

⇒ **Semmi nem sorosítja a lejátszást.** Az owner megfigyelése *(„a másodikat is legeneráltuk,
csak aztán valahogy nem volt jó a kezelés")* pontosan ezt írja le: a második hang **elkészül**,
de nincs, ami megvárja az elsőt.

**Amit kérek — FIFO sor a felolvasásra:**

| Szempont | Elvárás |
|---|---|
| **sorrend** | érkezési, ⛔ soha nem előz |
| **veszteség** | ⛔ nulla — ha épp szól egy, a következő **vár**, nem esik ki |
| **kapcsolódás** | ⚠️ a 01:30-as **darabolás** ugyanennek a sornak a tételei; egy üzenet N darabja **egyben** marad, közéjük más üzenet ⛔ nem ékelődhet |
| **szüneteltetés** | a 01:20-as *(amíg ő beszél)* a **sorra** hat: a soron lévő megáll, a sor **nem ürül ki** |
| **láthatóság** | ha a sor **nem ürül** *(pl. 5 tétel fölött)*, az **jelzés** &mdash; a csendes torlódás ugyanaz a hibaosztály, mint a néma csonkolás |

### (B) A bizonytalan átiratnál mondjuk meg, MIT hallottunk és MIÉRT bizonytalan

Ma bizonytalanságnál a `transcribeVoiceMessage` **`null`-t** ad *(helyesen: „inkább ne értsük,
mint félreértsük")*, és megy a tükör-üzenet. ⚠️ **Ami hiányzik belőle:** maga a **felismert
szöveg** és a bizonytalanság **oka**.

**Kérés:** a tükör-üzenet tartalmazza mindkettőt, ebben a formában:

```
🎙️ Hallottalak, de nem vagyok biztos benne.
   Amit értettem: „<a nyers átirat>"
   Miért bizonytalan: <ok>            pl. gyanús tagolás · rövid felvétel ·
                                          nyelv-eltérés · alacsony pontszám
```

⭐ **Miért ér ez sokat:** így **ő** dönti el, hogy jól hallottam-e — ⛔ nem nekem kell eltalálnom.
A mai *„nem cselekszem rá"* igaz, de **használhatatlan**: nem tudja, mit ismételjen meg és
hogyan mondja másképp.

⛔ **Ami NEM változik:** bizonytalan átiratra **továbbra sem cselekszünk**, és a kötegbe
**továbbra sem** kerül be. Ez a szabály marad — csak a **visszajelzés** lesz használható.

---

## 2026-09-11 01:40 — 🔗 A KÖVETKEZŐ MUNKA: LinkedIn PROFIL + POSZTOK olvasása

> **Owner, 2026-09-11 01:38:** *„most pont jön a trükkös rész, hogy fejlesztési munkák fognak
> kelleni, hogy tudjad olvasni a LinkedIn profilomat és posztjaimat."*

⭐ **JÓ HÍR — a nehezén túl vagyunk.** Ez **nem** új integráció: a hitelesítés, a lapozás, a
gyorsítótár és a hibakezelés **már megvan** az inbox-vonalon. Amit hozzá kell tenni, az **egy
paraméter és két olvasó parancs**.

### A MÉRT állapot

| Ami megvan | Hol |
|---|---|
| Member Snapshot API-kliens, lapozással és `NOT_READY`-kezeléssel | `cli/src/linkedin/linkedin.api-client.ts` |
| OAuth, `r_dma_portability_self_serve` scope, a token a gyökér `.env`-ben | `__documentations/dev/LINKEDIN_INBOX_CLI.md` |
| gyorsítótár, `doctor`, `configure`, olvasó parancsok | `ma linkedin …` |

### 🔴 A SZŰK KERESZTMETSZET — egyetlen sor

`linkedin.api-client.ts:226`:

```ts
if (envelope.snapshotDomain !== 'INBOX') {
  … 'memberSnapshotData returned an unexpected snapshot domain.'
}
```

⇒ A kliens **bedrótozva** csak az `INBOX` domaint fogadja el. A LinkedIn viszont **több
snapshot-domaint** ad ugyanezen a végponton *(profil, megosztások és társaik — a domain-lista a
`snapshot-domain` doksiban, amire a LINKEDIN_INBOX_CLI.md hivatkozik)*.

### A munkacsomag — EGY funkció

```
1. a snapshotDomain legyen PARAMÉTER (a mai INBOX az alapérték, ⛔ regresszió nélkül)
2. domainenkénti gyorsítótár, ugyanabban a mintában, mint az inboxé
3. két olvasó parancs:  ma linkedin profile show   ·   ma linkedin posts list
```

| Kikötés | Miért |
|---|---|
| ⛔ **read-only marad** | az integráció szándékosan nem küld; ez **nem** változik |
| ⚠️ **`NOT_READY` a NORMÁLIS első válasz** | a doksi szerint egyes domainek **akár 48 óra** alatt állnak elő. ⛔ Ez **nem hiba** — mondja meg, hogy várni kell, és ⛔ ne ürítse a meglévő gyorsítótárat |
| **a domain-lista MÉRVE legyen** | ⛔ ne találgassuk a domain-neveket: a `doctor` írja ki, mit ad vissza a fiók |
| ⛔ **ne told mellé a poszt-KÜLDÉST** | az **külön** probléma *(nincs hozzá scope)*, és `one-function-is-enough` |

📌 **A cél, amiért kell:** az owner LinkedIn-jelenlétét onnan tudjuk gondozni, hogy **látjuk, mit
írt eddig** — a profil-frissítés és a posztolás ezen az olvasáson áll.

---

## 2026-09-11 01:45 — ✅ MEGMÉRTEM ÉLESBEN: MINDKÉT DOMAIN AZONNAL AD ADATOT

⭐ **A 01:40-es szakasz feltevése MEGDŐLT — jó irányba.** Az owner kérésére elindítottam a
lekérést, és **nem kell 48 órát várni**: mindkét domain **azonnal, HTTP 200-zal** válaszolt.

```
GET /rest/memberSnapshotData?q=criteria&domain=PROFILE            -> 200
GET /rest/memberSnapshotData?q=criteria&domain=MEMBER_SHARE_INFO  -> 200
```

| Domain | Amit visszaad |
|---|---|
| **`PROFILE`** | 1 rekord, **13 mező**: `Headline`, `Summary`, `Industry`, `Geo Location`, `Websites`, `Address`, `Zip Code`, `First Name`, `Last Name`, `Maiden Name`, `Birth Date`, `Twitter Handles`, `Instant Messengers` |
| **`MEMBER_SHARE_INFO`** | **48 poszt**, mezők: `ShareCommentary`, `Date`, `Visibility`, `ShareLink`, `SharedUrl`, `MediaUrl`. Időtartomány: **2026-03-26 … 2026-08-25** |

⇒ **A domain-nevek ezzel MÉRVE vannak**, ⛔ nem kell találgatni. A `NOT_READY`-ág maradjon bent
*(más domaineknél előfordulhat)*, de a **profil és a posztok ma is élnek**.

### Ami ebből következik a munkacsomagra

- A `snapshotDomain`-paraméterezés **ugyanaz** marad, csak most már **tudjuk**, mi jön vissza —
  a gyorsítótár-sémát a fenti **valódi mezőnevekre** lehet szabni.
- ⚠️ **`ShareCommentary` = maga a poszt szövege.** Ez a legértékesebb mező: erre épül a
  poszt-történet olvasása és a hivatkozás.
- 🔒 A `PROFILE` **személyes adatot** is visz *(cím, irányítószám, születési dátum)*. ⛔ A
  gyorsítótár ugyanoda menjen, ahova az inboxé *(`~/.config/my-assistant/linkedin/`, gitignore-olt)*,
  és ⛔ **ezek a mezők soha ne kerüljenek naplóba vagy Discord-üzenetbe**.

### 📌 AZ OWNER TERVE — a posztok útja (2026-09-11 01:42)

> *„ugyanúgy, mint ahogy a beszélgetésekhez előkészíted nekem a posztokat"* ·
> *„Például az UBH-nak hívják"*

| Lépés | Hogyan |
|---|---|
| **olvasás** | ✅ hivatalos API, `MEMBER_SHARE_INFO` — **ma is működik** |
| **poszt-piszkozat** | ugyanaz a minta, mint a `reply draft`: lokálisan készül, ⛔ nem megy ki magától |
| **kiküldés** | ⛔ az API-n **nincs rá scope** ⇒ **UBH** *(`unblockable-browser-handler-tool`)* vagy kézzel |

⛔ **Ez a három külön lépés — `one-function-is-enough`.** Most **csak az olvasás** a feladat.

---

## 2026-09-11 01:55 — 🔀 PRIORITÁS-VÁLTÁS: a PROFIL-FRISSÍTÉS az első

> **Owner, 2026-09-11 01:52:** *„most az első majd az kell legyen, hogy a **profilt kéne
> frissítsük**. Amúgy lehet, hogy ahhoz is adhatnál majd egy felületet, meg valami **easy to use,
> copy-paste-es megoldást**, ugye azt sem tudjuk automatizálni teljesen."*

⭐ **Az olvasás ELKÉSZÜLT — kézzel.** Nem kell megvárni a CLI-t:

```
python scripts/linkedin-archive.py
  ✅ 48 poszt   -> current/linkedin/posts/          (egy fájl = egy poszt)
  ✅ profil     -> current/linkedin/profile-current.json  (7 pozicionálási mező)
```

⇒ A **01:40-es** munkacsomag *(`snapshotDomain`-paraméterezés + `profile show` / `posts list`)*
ettől **nem esik el** — de már **nem blokkol semmit**, tehát ⛔ **nem sürgős**.

### 🥇 AMI MOST AZ ELSŐ: a profil-frissítés felülete

**A korlát, amit tudni kell:** a hivatalos API **read-only** ⇒ a profilt **nem tudjuk átírni**.
Az owner is így mondta: *„azt sem tudjuk automatizálni teljesen."*

⇒ **A cél nem az automatizálás, hanem a SÚRLÓDÁS-MENTES ÁTVITEL.**

| Amit a felület adjon | Miért |
|---|---|
| **mezőnként** a mostani és a javasolt szöveg, egymás mellett | a LinkedIn-en is mezőnként kell beilleszteni |
| **egy gomb = egy mező vágólapra** | ⭐ ez a lényeg: *„easy to use, copy-paste-es"*. ⛔ Ne egy nagy blobot adjon |
| **karakterszám + a LinkedIn limitje** mezőnként | a headline 220, a summary/about 2600 karakter — ha túllóg, ott derüljön ki, ne a beillesztésnél |
| **„beillesztettem" pipa** mezőnként | különben nem tudja, hol tartott, ha félbeszakad |

📌 **Az adat készen áll:** `current/linkedin/profile-current.json` a **mostani** állapot; a
**javasolt** szöveget én írom meg *(asszisztensi munka, a 2026-09-es CV-ből)*. A felületnek csak
a kettőt kell egymás mellé tennie.

⛔ **Ne told mellé** a poszt-felületet *(T-73)* — az ugyanez a minta lesz, de **külön** kör.

---

## 2026-09-11 02:00 — 🔴 62,5% ÁTVITEL: a hangot MEG KELL ŐRIZNI, nem eldobni

> **Owner, 2026-09-11 01:57:** *„megint ment át egy nagy adag beszédem, és ezt amúgy alaposan
> kezelni kéne… biztosítani kéne azt, hogy **elmenthessem a hangüzeneteimet**… minél többet
> beszélek, annál fontosabb, hogy ez **el legyen mentve, és ne kelljen újra elmondanom, mert nem
> mindig tudom ugyanúgy**."*

### 📊 A MÉRÉS — ez nem panasz, ez adat

```
ma comm voice-funnel --day 2026-09-11
  🟡 ÁTVITELI ARÁNY: 62,5%   (24 megszólalásból)
  🎚️  a felvevő eldobta ............. 3
  ❌  felismerés után elveszett ..... 6
  🔊 ELVESZETT HANG: 1,1 másodperc
```

### ⭐ A PONTOS OLVASAT — ⛔ ne javítsd rossz helyen

A `droppedAfterTranscribe` *(a „❌ felismerés után elveszett" 6 darab)* a kódban azt jelenti:
**„eljutott a felismerésig, de nem lett belőle használható szöveg"**. ⚠️ Ebbe **beletartozik a
SZÁNDÉKOS eldobás is** — a bizonytalan átiratnál helyesen adunk `null`-t
*(„inkább ne értsük, mint félreértsük")*.

🔴 **De az ownernek ez ugyanaz az élmény:** beszélt, és nem ért el hozzám.

⇒ **A hiba nem az, hogy nem cselekszünk a bizonytalanra. A hiba, hogy ELDOBJUK.**

### A KÉRÉS: MEGŐRZÉS, több rétegben

> *„ezt többféleképpen biztosítani kéne"*

| Réteg | Mit |
|---|---|
| **1. a nyers HANG** | a felvétel **maradjon meg** *(dátumozva, a `~/.config/my-assistant/` alatt)*, **mielőtt** bármi downstream történne. ⛔ Ha később bármi elhasal, a forrás **újrafeldolgozható** |
| **2. a nyers ÁTIRAT** | akkor is mentsük, ha **bizonytalan** vagy ha nem megy a kötegbe. ⭐ Ez ugyanaz a tétel, mint a **01:33-as (B)** pont: ott a **megmutatásáról** volt szó, itt a **megőrzéséről** — egy megoldás fedi le a kettőt |
| **3. a VESZTESÉG legyen LÁTHATÓ** | ha egy megszólalás nem ért célba, az ne csak egy számláló legyen a riportban: **szóljon** *(ugyanaz az elv, mint a néma csonkolásnál és a néma render-bukásnál)* |

⚠️ **A megőrzés ELSŐBBSÉGET élvez a tisztaság előtt.** Jobb egy zajos, bizonytalan felvétel a
lemezen, mint egy tiszta rendszer, amiben elveszett, amit mondott. ⛔ Ez **nem** azt jelenti,
hogy bizonytalan átiratra cselekszünk — az a szabály **változatlan**.

🔒 A hangfelvételek **személyes adatok** ⇒ a gitignore-olt lokál tár, ⛔ nem a repó.

📌 **Miért ez a legfontosabb most:** az owner **ezen a csatornán dolgozik** velem. Egy elveszett
mondat nála **nem újramondható** ugyanúgy — a saját szavaival: *„nem mindig tudom ugyanúgy"*.

---

## 2026-09-11 02:07 — 🔇 ÜRESJÁRATI HALLUCINÁCIÓ: a „Bye." nem beszéd

> **Owner, 2026-09-11 02:05:** *„Az a bye, az egy tipikus félrehallás, olyan, mint a thank you,
> meg you."*

**A mért eset (02:01):** az owner egy bekezdésnyi munkát mondott el; az átirat **`"Bye."`** lett.
Én erre **elköszöntem tőle**. ⇒ A veszteség nem a felismerésnél keletkezett kárként látszott —
**teljes értékű üzenetnek** nézett ki.

### A kérés

A felismerő után egy **gyanú-szűrő**: ha az átirat **kizárólag** egy rövid angol töltelék
*(`Bye.` · `Thank you.` · `You.` · `Thanks for watching.` és társaik)*, **miközben a beszélgetés
magyarul folyik**, akkor az **nem sikeres felismerés**.

| Elvárás | |
|---|---|
| **besorolás** | ugyanaz, mint a bizonytalan átiraté: ⛔ nem megy a kötegbe, **nem cselekszünk rá** |
| **visszajelzés** | ⭐ a tükör-üzenet mondja meg, hogy **ez** jött vissza, és hogy valószínűleg üresjárat — így az owner **egyből újramondja** |
| **megőrzés** | a felvétel **maradjon meg** *(02:00-ás szakasz)* — üresjárati gyanúnál **különösen**, mert pont ilyenkor vész el valódi tartalom |
| **lista** | a minták legyenek **adatban**, ne beégetve — bővülni fog |

⚠️ **Ne legyen túl mohó a szűrő:** ha az owner tényleg csak annyit mond, hogy „bye", attól még
nem baj, ha visszakérdezünk. ⛔ Fordítva viszont az: egy elveszett bekezdés **nem pótolható** —
az owner szavaival: *„nem mindig tudom ugyanúgy."*

---

## 2026-09-11 02:10 — 🔁 A TÜKÖR MÁSIK IRÁNYA: a DM-be írt üzenetem menjen a hang-csatorna szövegébe is

> **Owner, 2026-09-11 02:09:** *„amit most a DM-be írsz, a privát beszélgetésünkbe, hogy
> elküldtél két üzenetet, azt is kéne küldjed a **Voice Channel textjébe is**."*

⚠️ **Ez a 01:10-es (B) pont PÁRJA, nem ugyanaz:**

| Irány | Állapot |
|---|---|
| a hang-csatornán elhangzott → **DM** | ✅ **megvan** |
| amit a **DM-be írok** → a hang-csatorna szöveges része | ⏳ **EZ a kérés** |

**Miért kéri:** amikor a hang-csatornában ül, **ott** van a szeme. Ha a válaszom csak a DM-ben
jelenik meg, neki **csatornát kell váltania**, hogy elolvassa — pont akkor, amikor beszélgetünk.

| Kikötés | Miért |
|---|---|
| ⛔ **ne duplikálja** azt, ami a hang-csatornából jött | különben a saját tükrözésünk visszhangzik |
| a **felolvasással** együtt menjen | ami elhangzik, annak a szövege is ott legyen — így akkor is követhető, ha nem hallja jól |
| a **darabolás** *(01:30)* a hangra vonatkozik, a szövegre ⛔ **nem** | a szöveget egyben kell látni |

📌 Ezzel a hang-csatorna lesz a **teljes** felület: ott beszél, ott hallja a választ, és **ott
olvassa** is.

---

## 2026-09-11 02:30 — ⏳ A KÖTEG VÁRJA MEG A FOLYAMATBAN LÉVŐ MEGSZÓLALÁST + újraindítás-jelzés

> **Owner, 2026-09-11 02:28**, két tétel.

### (A) ⏳ A kötegelés kapui közül HIÁNYZIK a „most épp beszél" kapu

> *„várjon legalább egy másfél-két beszélgetés időnyit… És az üzenetcsomagot csak akkor szabad
> elküldeni, ha **nem kezdtünk el következő üzenetet se**. Tehát ha most közben elkezdtünk egy
> **voice detection**-t, akkor **meg kell várni, hogy abból mi lesz**, mielőtt elküldenénk a
> következő csomagot. **( HACSAK! nem vár nagyon sok üzenet a sorban…)**"*

**A MÉRT jelenlegi állapot** — `discord.bridge.ts` `decideFlush()` kapui:

| Kapu | Van? |
|---|---|
| üres köteg | ✅ |
| `isBusyProcessing` *(a session dolgozik)* | ✅ |
| `queuedItemCount` *(áll már tétel a CCAP sorában)* | ✅ |
| `isQueueLocked` | ✅ |
| **elcsendesedési ablak** — `collectWindowMs: 20 000` a LEGÚJABB üzenet óta | ✅ |
| biztonsági szelep — `maxHoldMs: 15 perc` a legrégebbi tételre | ✅ |
| 🔴 **FUT-E ÉPP FELVÉTEL / megszólalás-detektálás** | ⛔ **NINCS** |

⇒ **Pontosan ez a rés.** A 20 másodperces csend-ablak akkor is letelhet, ha az owner **épp
beszél** — a felvétel még tart, a szöveg még nincs kész, és a köteg **nélküle megy ki**.

**A kérés:** új kapu — *„folyamatban van egy megszólalás/felvétel"* → ⛔ **nem küldünk**, amíg az
le nem zárult *(sikerrel vagy bukással — mindkettő lezárás)*.

⚠️ **Az owner kivétele SZÓ SZERINT érvényes:** *„HACSAK nem vár nagyon sok üzenet a sorban"* ⇒ a
`maxHoldMs`-szelep **fölülírja** ezt a kaput is, különben egy hosszú monológ alatt korlátlanul
állnának az üzenetek. A szelep **marad**.

📌 A *„másfél-két beszélgetésnyi"* ⇒ a `collectWindowMs` **20 s** valószínűleg kevés. ⛔ Ne tippelj:
a `voice-funnel` adataiból **mérd meg**, mennyi a tipikus szünet két megszólalása között, és abból
számolj.

### (B) 🔊 ÚJRAINDÍTÁSKOR JELEZZ — hangban is, szövegben is

> *„Amikor újraindul a szerver, akkor **még mindig előbb egyszer csak nem hallgatsz**, és aztán
> utána lépsz csak ki, sőt, előbb lépsz vissza, és csak később kezdesz el hallgatni. Legalább
> jelzés, hangjelzéseket kell ezekre adjunk, meg igazából **egy üzenet sem ártana**."*

**A valódi panasz nem a sorrend, hanem a LÁTHATATLANSÁG:** van egy ablak, amikor **bent vagyok, de
nem hallok** — és ő ezt **nem tudja**, tehát beszél a semmibe.

```
    ⛔ NE ÍGY:   [hallgatás vége] … [kilépés] … [belépés] … (csend) … [hallgatás kezdete]
    ✅ HANEM:    minden átmenet JELZETT, és az owner tudja, mikor hallom
```

| Elvárás | |
|---|---|
| **hangjelzés** a hallgatás **kezdetén és végén** | ő a csatornában ül, ott van a füle |
| **szöveges üzenet** is | ⭐ a hang elszáll; a szöveg megmarad, és a hang-csatorna szövegében is ott legyen *(02:10-es szakasz)* |
| ⚠️ **a rés maga is jelzés** | ha bent vagyok, de még nem hallok, azt **ki kell mondani** — ⛔ nem elég a csend |

📌 Ideális esetben a sorrend is javul *(előbb hallgatás, aztán kilépés; belépés után azonnal
hallgatás)* — de a **jelzés** akkor is kell, ha a rés technikailag nem tüntethető el.

---

## 2026-09-11 02:40 — 🏷️ LinkedIn-üzenetek: LÁTHATÓ rangsor és címkék

> **Owner, 2026-09-11 02:38:** *„a LinkedIn üzeneteknél kellene valami olyasmi, ami **rangsorolás**,
> meg **tegek**, …hogy be tudjál állítani jól, ami **vizuális nekem**, hogy **melyik a prió**."*

⭐ **Az adat NAGY RÉSZE MÁR MEGVAN** — ⛔ ne építsd újra:

| Ami van | Hol |
|---|---|
| `semanticCategory` **8 értékkel**, köztük `priority-direct-project` | `linkedin.models.ts` |
| `semanticConfidence` *(high/medium/low)*, `semanticReason` *(egy mondat, MIÉRT)* | ugyanott |
| `reviewState` *(fresh/stale/unreviewed)*, `needsReply`, `unread` | ugyanott |
| a workspace **már mutatja** a `semantic*`, `needsReply`, `reviewState`, `unread` mezőket | `l-workspace.component.html` |

### 🔴 AMI HIÁNYZIK — pontosan három dolog

| # | Hiány | Miért számít |
|---|---|---|
| **1** | **RANGSOR — egyetlen sorrend.** Ma 8 kategória van, de nincs, ami megmondja, **melyik az ELSŐ** | ő nem kategóriát akar olvasni, hanem **sorrendet**: mit nyisson meg most |
| **2** | **CÍMKÉK, amiket ÉN állítok.** A `semanticCategory` a gépi besorolás; kell **szabad címke** is *(pl. „árazás nyitva", „ügyfél visszajelzésére vár")* | a besorolás **általános**, a címke **konkrét** — és az ő szótárával |
| **3** | **VIZUÁLIS jelölés.** Szín/jelvény, ⛔ nem mezőnév | *„ami vizuális nekem"* — egy `semanticCategory: actionable` szöveg **nem** vizuális |

### Amit javaslok a rangsorra — ⛔ de MÉRD, ne tippelj

A rendezés **három meglévő** mezőből számolható, új adat nélkül:

```
1. semanticCategory      (priority-direct-project > clarification-needed > actionable > a többi)
2. needsReply            (igen elöl)
3. a szál KORA           ⭐ mérve: a mai öt szál 17–79 napos — az öregedés VALÓDI jel
```

⚠️ **A kor a leggyakrabban kifelejtett tényező**, pedig a mai mérés szerint a legjobb lehetőség
**62 napja** állt. ⇒ Aminek **lejár az ideje**, az menjen előre.

⛔ **`one-function-is-enough`:** ez a **6. tétel után** jön, és **EGY** funkció — a rangsor. A
szabad címkék külön kör.

---

## 2026-09-11 02:42 — 🎚️ A SZÜNETELTETÉS HISZTERÉZISE — gyorsan állj meg, LASSAN indulj

> **Owner, 2026-09-11 02:39 (élő megfigyelés):** *„olyan volt, mintha tényleg abbahagynád,
> miközben beszélek, de csak ilyen **ezredmásodpercekre**, ezért aztán **nagyon fura lett tőle a
> hangod**. Ilyenkor nem csak abban a mikroszekundumban kell elhallgass, hanem **utána még várnod
> kell egy-két másodpercet**, mielőtt folytatnád, mert lehet, hogy **én még beszélek**."*

### ⚠️ ELŐSZÖR: MI EZ VALÓJÁBAN? — két olvasat, ⛔ ne tippelj

**Mérve 2026-09-11 02:42:** a `cli/src/voice/*.ts`-ben **nincs** `pause` / `barge` / `duck`
találat, és a 01:20-as tétel a terv-fájlban **`⬜ hátra`**. ⇒ A szüneteltetés **még nincs
megírva**.

| Olvasat | Következmény |
|---|---|
| **A** — mégis van valamilyen megszakítás *(pl. a lejátszó akad, ha jön a bejövő hang)* | akkor ez **véletlen** viselkedés, és a hiszterézis **rá is vonatkozik** |
| **B** — a hang **magától darabos** *(hálózat, puffer, `SupervisedChild`)* | ⭐ akkor ez **MÁS hiba**, és a szüneteltetés **nem javítja** |

### ✅ MEGVÁLASZOLVA — 2026-09-11 02:43, owner

> *„**nem volt darabos a hangod**, csak egy pillanatra, és azt hittem, hogy azért, mert… **Ja nem,
> hülye vagyok, pont azt mondtad, hogy még az hátra van.**"*

⇒ **A „B" olvasat KIZÁRVA.** ⛔ Nincs külön lejátszási/hálózati hiba, **ne nyomozz utána** — ez a
vizsgálat **lekerült** a listáról.

⇒ Marad a **hiszterézis-követelmény** *(lent)*, de már **nem hibajavításként**, hanem a 01:20-as
tétel **tervezési részleteként**, amikor sorra kerül.

⭐ **És megvan a HUMÁN indok is, egy mondatban** — az owner ugyanabban az üzenetben:
> *„ugye **éppen beszéltem és ezért nem nagyon tudtam figyelni**."*

📌 **Ezért nem kényelmi funkció a szüneteltetés:** amíg ő beszél, **nem hallja**, amit mondok.
Ha közben beszélek, az a mondat **elveszett** — ugyanaz a veszteség, mint a csonkolásnál, csak a
másik irányban.

### A KÖVETELMÉNY — ez a 01:20-as tétel PONTOSÍTÁSA

```
megszólal        → ⚡ AZONNAL szünet          (gyors reakció, ez jó így)
elhallgat        → ⏳ VÁRJ 1-2 másodpercet    ⭐ EZ HIÁNYZOTT
még mindig csend → ▶️ folytatás ONNAN, ahol abbamaradt
```

⭐ **A neve: hiszterézis** — a be- és kikapcsolási küszöb **nem ugyanaz**. ⛔ Szimmetrikus
küszöbbel a rendszer **csattog**: minden apró zajra megáll és azonnal újraindul, és pont ezt
hallotta az owner *(„nagyon fura lett tőle a hangod")*.

| Paraméter | Érték |
|---|---|
| szünet-küszöb | azonnal *(változatlan)* |
| **folytatás-késleltetés** | **1-2 s**, ⭐ **paraméter**, ⛔ nem beégetett szám |
| ⚠️ minimális szünet-hossz | ha a szünet <100 ms lenne, **ne is szüneteltessünk** — a mikro-megszakítás rosszabb, mint a semmi |

📌 Az owner indoka szó szerint: *„mert lehet, hogy én még beszélek."* ⇒ A késleltetés **nem
kényelem, hanem az ő beszédének a védelme**.

---

## 2026-09-11 02:45 — 📅 A MUNKANAPTÁR BEKÖTÉSE

> **Owner, 2026-09-11 02:42:** *„majd a **munkanaptáramat** összeköthetnénk veled, mert most is
> például **holnap reggel 11-kor lesz egy mítingem**. És ezek **kb. csak a munkanaptárból
> derülnek ki**."*

⭐ **Ez az én első számú területemet érinti** *(időbeosztás, `schedule-guardian`)* — és pont ott
vagyok **vak**: ha egy esemény csak a munkanaptárban van, én **nem tudok róla**, tehát nem tudok
készülődést, odajutást és ébredést sem tervezni.

**A mai eset a bizonyíték:** a 11:00-s mítingről **02:42-kor**, szóban értesültem — nyolc órával
előtte, véletlenül. ⇒ Kézzel felvettem *(`org:task:6aa34e92766c802935c3c6b7`)*, de a **részleteket
nem tudom**: hol, kivel, miről.

| Kikötés | Miért |
|---|---|
| **READ-ONLY** az első körben | ⛔ a naptárába **nem írunk**; előbb lássuk, aztán beszéljünk az írásról |
| **a Google-vonal már él** | `ma google auth/status/query` — ⛔ ne építs új integrációt, ha ez a naptár is Google-ös. **Mérd meg**, melyik szolgáltató |
| a **részletek** kellenek, nem csak az időpont | hol · kivel · online vagy helyszín — ezekből lesz a **készülődés** és az **odajutás** |
| ütközés-jelzés | ha egy esemény ütközik azzal, amit én írtam fel az organizerbe, az **jelzés** |

🔒 A munkanaptár **ügyfél-adatokat** tartalmazhat *(nevek, cégek, meeting-linkek)* ⇒ gitignore-olt
lokál tár, ⛔ a repóba **semmi**.

📌 **Sorrend:** ez a lista **végére** megy — a hang-vonal *(1-5)* és a profil-felület *(6)* előbbre
való. ⛔ De ne vesszen el: amíg nincs bekötve, **minden munkahelyi esemény vakfolt**.


---

## 7️⃣ 2026-09-11 03:20 — ⛔ A DISCORD-VÁLASZKÉNYSZER FELTÉTEL NÉLKÜLI, ÉS EZ ÜTKÖZIK A FÓKUSZ-SZABÁLLYAL

> **Owner, 2026-09-11 03:22:** *„amikor bejön egy üzenet a Discordról, akkor ott **javítani kell**,
> hogy **csak a fókusz dolgokat** a Discordon."*

### A MÉRT OK — egy hard-code-olt lábléc

`cli/src/discord/discord.batch-composer.ts:38-42` **minden** bejövő kötegre ráteszi:

```
🔴 Válasz-kötelezettség: erre NEM elég a sessionben válaszolni — Discordon IS
válaszolnod kell, rövid és tömör formában (owner-szabály, 2026-09-06).
```

⚠️ **Ez feltétel nélküli.** Akkor is odakerül, ha a köteg tartalma **fejlesztési téma**, amiről az
owner **ötször** mondta, hogy ⛔ **nem akarja Discordon** *(„A fejlesztési kéréseknél még mindig nem
kéne discordon válaszolj, ha nem az a fókusz.")*. ⇒ **A rendszer kényszeríti ki azt a viselkedést,
amit az owner tilt.** Ez nem az asszisztens fegyelmezetlensége, hanem **hiba a komponálóban**.

### A FELADAT

**Tedd FELTÉTELESSÉ a láblécet** — a szöveg mondja ki a kivételt is, ne csak a kötelezettséget:

```
🔴 Válaszolj Discordon IS, HA a téma a FÓKUSZ része (az owner teendője/döntése).
⛔ HA a köteg fejlesztési/belső üzemeltetési téma, arról NE írj Discordra —
   az a repóba megy. A hallgatás ilyenkor a HELYES válasz.
```

⭐ **Miért a szöveg, és ⛔ miért NEM automatikus osztályozás:** a „fókusz-e" eldöntése
**szemantikai** kérdés, amit az asszisztens tud, a komponáló nem. Egy kulcsszó-alapú szűrő
**némán elnyomna** valódi kérést — az sokkal rosszabb, mint a mostani túl-beszélés
*(`one-function-is-enough`: ⛔ ne építs osztályozót)*.

### KÉSZ, HA

- [ ] a lábléc szövege feltételes, és **kimondja, hogy a hallgatás is helyes válasz lehet**
- [ ] `discord.batch-composer.spec.ts` **frissítve** *(a jelenlegi teszt a régi szöveget rögzíti —
      ⛔ nem törölni, hanem az új szövegre igazítani)*
- [ ] `dc rev` **0 új találat** a nyúlt fájlokon
- [ ] ⛔ **Semmilyen tesztet nem kapcsolsz ki**

📌 **Prioritás:** a hang-megbízhatósági sor **2-5. tétele ELŐBBRE való** — ez utána jön, mert
kicsi és nem blokkol semmit. Vedd fel a `PROCESS-CONTROL.md`-be **7. tételként**.

---

## 8️⃣ 2026-09-11 03:30 — 🔴 A 02:30-AS KÖTEG-KAPU NINCS A STÁTUSZ-TÁBLÁDBAN — ELŐRE KERÜL

> **Owner, 2026-09-11 03:27 (élesben, közben):** *„Na, baszd meg, **még én beszélek**, a
> csomó[g] nem megy át."*

### A MÉRT HIBA — nem a kódban, hanem a KÖVETÉSBEN

A **2026-09-11 02:30**-as szakasz *(köteg-kapu + újraindítás-jelzés)* ott van ebben a fájlban —
de a `PROCESS-CONTROL.md` **tételes státusz-táblájában NINCS**. ⇒ A hatos listád *(1 megőrzés ·
2 FIFO · 3 darabolás · 4 szüneteltetés · 5 nyelv · 6 LinkedIn)* **nem fedi le**, tehát
**némán kimaradt volna**.

🔴 **Ez a veszélyesebb hibafajta:** nem elromlott, hanem **nem is volt nyilvántartva**. A handoff
**nem** státusz-nyilvántartás — amit nem veszel fel a saját tábládba, az **nem létezik**.

### A FELADAT

1. **Vedd fel 7. tételként** a `PROCESS-CONTROL.md` státusz-táblájába a 02:30-as köteg-kaput.
   *(A 03:20-as Discord-lábléc a 8. — az tényleg ráér.)*
2. ⭐ **ELŐRE KERÜL: a 3. és 4. tétel ELÉ.** Indok: **élesben, kétszer** ártott
   *(02:30-kor jelezte, 03:27-kor újra)* — az owner mondat közben kap választ, és ettől
   **elveszti a fonalat**. A darabolás/szüneteltetés ehhez képest kényelmi.
3. ⛔ **Ne írd át a 2. tételt** *(FIFO, kész)* — a köteg-kapu a **bemeneti** oldal, a FIFO a
   **kimeneti**. Két különböző hely, nem ugyanaz.

### KÉSZ, HA

- [ ] a 7. tétel **szerepel** a státusz-tábládban, dátummal
- [ ] a köteg **nem megy ki**, amíg új megszólalás van folyamatban *(a 02:30-as szakasz feltételei)*
- [ ] automata teszt fedi a „közben új megszólalás érkezik" esetet
- [ ] `dc rev` **0 új találat** · ⛔ semmilyen tesztet nem kapcsolsz ki

### ⭐ ÁLTALÁNOS SZABÁLY, AMI EBBŐL LETT

**Minden handoff-szakaszt fel kell venni a `PROCESS-CONTROL.md` tételes táblájába** — akkor is, ha
kicsi, akkor is, ha „majd jön". Ha egy szakasznak **nincs tétel-sora**, az **hiba**, nem stílus.

---

## ✅ 2026-09-11 03:40 — A 8. TÉTELT (Discord-lábléc) **ÉN CSINÁLTAM MEG** — ⛔ NE kezdj bele

> **Owner, 2026-09-11 03:35:** *„Nagyon prióba előre kell venni azt, hogy ne legyen benne a
> hangüzenet[-prompt] utasításba, hogy válaszolnod kell. **Ez most már nagyon-nagyon rossz.**"* ·
> *„Annyira rossz, hogy… **ha nem dolgozik rajta éppen a dev, akkor csináld meg te gyorsan.**"*

⭐ **Explicit owner-felhatalmazás alapján**, és mert a CCAP `inspect` szerint a hang-vonalon
dolgoztál *(nem ezen)*, **én vittem be**. ⛔ **A 8. tétel LEZÁRVA — ne dolgozz rajta.**

| | |
|---|---|
| fájl | `cli/src/discord/discord.batch-composer.ts` — a lábléc **feltételes** |
| teszt | `cli/src/discord/discord.bridge.spec.ts` — a régi „always restates" **átírva**, ⛔ nem törölve; **+1 új** teszt az alvás-ágra |
| eredmény | `npm test` → **957 spec, 0 failure** |
| ⚠️ hatályba lépés | a **futó** listener a `dist`-ből dolgozik ⇒ a **következő újraindításkor** él. ⛔ Éjszaka **nem indítottam újra** *(`ldp-make-before-break`)* |

**Az új lábléc mondanivalója:** Discordra **csak a FÓKUSZ** kerül *(owner teendője/döntése)*;
fejlesztési témáról ⛔ nem írunk, ott **a hallgatás a helyes válasz**; és ha az owner **alszik
vagy lefekvéshez készül**, ⛔ **semmit** nem küldünk, csak valódi vészhelyzetben.

---

## 9️⃣ 2026-09-11 04:11 — 🔒 A BESZÉD-ÉSZLELÉST **KÖRBE KELL ÍRNI ÉS TESZTTEL LESZÖGEZNI**

> **Owner, 2026-09-11 04:11 (szó szerint):** *„a voice inputunknál, amit **importáltunk a
> CCAP-ból**, hogy **mikor beszélek, mikor nem**, az **kurva jól működik** — azt amúgy **nagyon
> alaposan rögzítenünk is kéne, körbeírni, nagyon alaposan tesztekkel fixálni a funkcionalitást**."*

### 🔴 A MÉRT ÁLLAPOT — ezért sürgős

| Mérés *(2026-09-11 04:13)* | Érték |
|---|---|
| `cli/src/_modules/voice/` — fájlok | **37 db, 6 681 sor** |
| ebből `cv-recording.control-service.ts` | **1 322 sor** — ez végzi a szegmentálást + a hangerő/ZCR beszéd-észlelést |
| 🔴 **spec-fájlok ebben a fában** | **0** ← *nulla* |

⇒ **A rendszer legjobban működő darabja a legvédtelenebb.** Bármely jövőbeli mozdulat **némán**
elronthatja, és **semmi nem szólna**.

### ⛔ A HATÁR — amit ⛔ NEM szabad

🔴 **Ez ÁTEMELT, törékeny, MŰKÖDŐ kód** *(`transplant-not-rewrite`)*. A feladat **leszögezés**,
⛔ **nem** takarítás:

- ⛔ **Ne refaktorálj**, ne nevezz át, ne „tisztítsd meg közben" — a `cv-*` fájlok **változatlanok** maradnak.
- ⛔ **Ne hangold a küszöböket.** A `settings.voice.thresholds.*` értékek **most jók** — a teszt
  azt rögzíti, ami **VAN**, nem amit szebbnek gondolsz.
- ✅ A teszt **kívülről** fogja meg: bemenő audio-keret-sorozat → várt `isSpeech` / szegmens-határ.

### A FELADAT — két rész, ebben a sorrendben

**1️⃣ KÖRBEÍRÁS** *(`__documentations/dev/`-be, saját fájl)*: **hogyan dönti el, hogy beszélek-e** —
a hangerő-küszöb, a **ZCR** (zero-crossing rate) szűrés és validáció, a `zcrValidationThreshold`
szerepe, az `AfterSilence` **1000 ms**-os szegmens-zárás *(`cv-recording…ts:113`)*, a buffer-logika,
és a duplikáció-védelem. ⭐ **A jelenlegi értékeket MÉRD KI és írd le** — ⛔ ne a kódból parafrazeálj.

**2️⃣ TESZTEK** — a viselkedést szögezik le:
- csend → ⛔ nincs szegmens
- folyamatos beszéd → **egy** szegmens
- beszéd → 1 s csend → beszéd → **két** szegmens *(a határ a küszöbön)*
- zaj/ZCR-en elbukó keretek → **kiszűrve**
- rövid „hm" → a mérhető jelenlegi viselkedés *(amit találsz, azt rögzítsd)*
- ⭐ **Regressziós horgony:** egy **valódi, rövid WAV** fixtúra, aminek a szegmentálása le van írva

### KÉSZ, HA

- [ ] a doksi megvan, és **mért értékeket** tartalmaz, nem becslést
- [ ] a `cli/src/_modules/voice/` spec-száma **> 0**, és a beszéd-észlelés fő ágai fedettek
- [ ] `npm test` zöld · `dc rev` **0 új találat** · ⛔ semmilyen teszt nincs kikapcsolva
- [ ] ⛔ **`git diff` a `cv-*.ts` fájlokon: ÜRES** *(a leszögezés nem változtat a leszögezetten)*

📌 Vedd fel a `PROCESS-CONTROL.md` tábládba **9. tételként**. Prioritás: a hang-vonal **5-6.
tétele után**, de a **LinkedIn-felület előtt** — mert minden további hang-munka **ezen áll**.

---

## ✅ 2026-09-11 06:05 — VÁLASZ A ZÁRÓ JELENTÉSEDRE (AGB-2026-09-11, 04:19)

### 1️⃣ A `43bcff3` NEM elveszett kód — MÉRVE

⭐ **Jó szemed volt, de nyugodj meg: nincs veszteség.** A `43bcff3` **az én commitom**, és
**szándékosan** csak doksi + verzió-emelés: az a **KÉRÉS** szövege volt, nem a megvalósítás.
A commit-üzenet `feat(voice)` előtagja félrevezető — **az én hibám**, javítottam a szokásomon.

**Az igazolás** *(2026-09-11 06:04)*: `decideFlush()` a `discord.bridge.ts`-ben ma **hat** kaput
ismer — üres köteg · `isBusyProcessing` · `queuedItemCount` · `isQueueLocked` · elcsendesedési
ablak · `maxHoldMs` szelep. ⛔ **„Folyamatban lévő megszólalás" kapu NINCS** — se most, se
korábban. ⇒ **A 7. tétel megíratlan, nem elveszett.**

### 2️⃣ AZ ÜTKÖZÉS AZ ÉN HIBÁM VOLT — és megvan a valódi ok

🔴 **Igazad van, és pontosabban is tudom már, miért történt.** ⛔ **Nem** `-A`-val stage-eltem:
**explicit fájllistát** adtam. A baj a **commit** oldalán volt:

```bash
git add <az-én-fájlom>     # ← ez tényleg csak az enyém
git commit -m "..."        # 🔴 DE EZ MINDENT COMMITOL, ami az INDEXBEN van — a TIÉD IS
```

⇒ A `git add` szűk, a `git commit` **nem**. Ha a te fájljaid staged-ek voltak, **velem jöttek**.

✅ **Amit ezután csinálok:** `git commit -- <pontos útvonalak>` *(pathspec-korlátos commit)*, ami
**csak a felsorolt útvonalakat** rögzíti, függetlenül attól, mi van még az indexben.
Kanonikus: `current/principles/shared-file-collision.md`.

### 3️⃣ A LinkedIn-javaslat szövege: ✅ **ELKÉSZÜLT** — `current/linkedin/profile-proposed.json`

A panel már nem üres. *(Részletek a fájlban; a forrás a 2026-09-es CV.)*

---

## 🔨 A KÖVETKEZŐ MUNKA — a 7. és a 9. tétel

A hatos listád **kész** ✅ — de a táblád **nem tartalmazza** a 7-8-9. tételt, amit közben
felvettem. **A 8. LEZÁRVA** *(én csináltam meg, owner-felhatalmazással)*. Marad:

| # | Tétel | Hol a leírás |
|---|---|---|
| **7** | ⏳ **KÖTEG-KAPU** — ne menjen ki a csomag, amíg megszólalás/felvétel **folyamatban** van | a `2026-09-11 02:30`-as és a `8️⃣`-as szakasz |
| **9** | 🔒 **A beszéd-észlelés körbeírása + tesztekkel leszögezése** *(0 spec / 6 681 sor)* | a `9️⃣`-es szakasz |

⭐ **A 7. ELŐBB** — élesben **kétszer** ártott *(02:30, majd 03:27: „még én beszélek")*.

⚠️ **A 9-nél a határ kemény:** `transplant-not-rewrite` — a `cv-*.ts` fájlokon a **`git diff`
maradjon ÜRES**. A teszt azt rögzíti, ami **VAN**.

---

## 🔟 2026-09-11 11:00 — A FELÜLET: az owner NEM TALÁLJA a LinkedIn-panelokat + hibákat lát

> **Owner, 2026-09-11 10:55:** *„Mindenféle **hibákat** látok megjelenni a My Assistant
> felületén, és **nem látom a LinkedIn posztokhoz, meg a LinkedIn profilhoz a felületeket**,
> amik elméletileg tervben voltak."*

### 🔬 AMIT MÁR MEGMÉRTEM — ⛔ ne mérd újra

| Kérdés | Mért válasz *(2026-09-11 10:58)* |
|---|---|
| a kiszolgált bundle **friss**-e? | ✅ **IGEN** — `client/dist/client/browser`, build **07:19**, és **tartalmazza** a `profile-update`-et *(`chunk-CDRMJUFV.js`, `main-Y5CT2VE7.js`)* |
| léteznek-e a route-ok? | ✅ `/linkedin` → `L_Workspace_Component` · `/linkedin/profile` → `L_ProfileUpdate_Component` *(`linkedin.module.ts:10,12`)* |
| van-e **navigációs link**? | 🔴 **CSAK `/linkedin`-re** *(`app.component.html:10`)* — a **profil-panelra NINCS** |
| mit mutat a `/linkedin`? | az **üzenet**-munkamód *(Beszélgetések · Válasz-draft)* — ⛔ **nem** posztokat |
| van-e **poszt-felület**? | 🔴 **NINCS** — soha nem épült meg |

### ⇒ A BEJELENTÉS HÁROM KÜLÖN DOLOG

**(A) ✅ BIZTOS — a profil-panel LÉTEZIK, de nincs rá ÚT.** Az owner nem tud eljutni a
`/linkedin/profile`-ra, mert a menüben nincs link. ⇒ **Tedd be a navigációba.**
⚠️ A `/linkedin` nem „LinkedIn" általában, hanem az **üzenetek** — a menü **hazudik** egy kicsit.
Javasolt: a LinkedIn alá **két** belépő *(Üzenetek · Profil)*, vagy a workspace tetején egy
látható link a profil-panelra. ⭐ **EGY funkció** — ⛔ ne építs menü-rendszert.

**(B) ✅ BIZTOS — poszt-felület NINCS.** Ez **nem hiba, hanem hiány**: az owner kérte
*(„kelleni fog majd egy felület is, amivel posztolok")*, de nem épült meg. ⛔ **Most NE kezdd el** —
előbb a profil-vonal zárul le *(owner sorrendje: **profil → posztok → üzenetek**)*.
📌 Csak **vedd fel a terv-fájlodba** hátralévő tételként.

**(C) 🔍 FELTÁRANDÓ — a „mindenféle hiba".** ⛔ **Nem tudom, mit lát**, és ⛔ nem találgatok
*(`uncertain-requests`)*. A **böngészőjében** jelennek meg; a szerver-log, amit elértem
*(`logs/server.err.log`)*, **szeptember 6-i**, tehát nem ez a futás.
⇒ **Megkértem az ownert a konkrét hibaszövegre.** Amíg nincs meg:
- ✅ amit **addig is** tehetsz: nézd meg, hogy a `/linkedin` és a `/linkedin/profile` **hibamentesen
  betölt-e** üres/hiányzó adattal is *(pl. nincs `profile-proposed.json`, üres thread-lista)* —
  a **naiv-felhasználós UX-QA** kötelező *(`core-ux-qa-naive-user`)*;
- ⛔ **ne javíts olyat, amit nem reprodukáltál.**

### KÉSZ, HA

- [ ] a profil-panel **elérhető a felületről** *(kattintással, ⛔ nem URL-begépeléssel)*
- [ ] a poszt-felület **tételként** szerepel a `PROCESS-CONTROL.md`-ben — ⛔ nincs megépítve
- [ ] `/linkedin` és `/linkedin/profile` **üres adattal is** hibamentes
- [ ] `npm test` zöld · `dc rev` **0 új találat** · ⛔ semmilyen teszt nincs kikapcsolva

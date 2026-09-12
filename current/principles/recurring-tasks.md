# Recurring tasks

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag — itt szövegesen
> gyűjtjük, később az organizer-be visszük át mint recurring task / template.

---

## 2026-05-07 — fürdés időablak-megszorítás

> Ja, és plusz egy infó, hogy éjfél és reggel hét között nem fürödhetek, ami
> egy kicsit megbonyolítja itt nekünk a dolgokat.

**Következmény:** a fürdés ablak **00:00 – 07:00 között TILTOTT**. Csak
07:00–23:59 közötti idő-slot használható.

## 2026-05-07 — séta preferált időablak

> Még egy plusz info, hogy jobban szeretek este sétálni, amikor már satét
> van odakint. Ugye ehhez azt is figyelembe kell venni, hogy mikor sötétedik.

> [Frissítés ugyanazon a napon, 23:35]: hajnali 02:00–04:00 az **abszolút
> top preferált** — ekkor üresek az utcák, lehet közben táncolni is
> (szégyellősség miatt csak ember-mentes utcán). Lásd
> `current/principles/fit-system.md` "Tánc + hajnali sétálási preferencia".

**Következmény (assistant-jegyzet):**
- A napi séta **TOP preferált slot-ja**: **02:00–04:00 hajnal** (üres utcák,
  tánc-kombi)
- Másodlagos: **napnyugta után** (sötétedéskor)
- A naplemente időpontja **szezonálisan változik** — emlékeztető-tervezésnél
  Budapest koordinátákra kell számolni (vagy egy egyszerű havi átlag-tábla)
- Indikatív naplemente Budapesten:
  | Hónap | Napnyugta (kb.) | "Sötét van" (~napnyugta + 30p) |
  |---|---|---|
  | január | 16:30 | 17:00 |
  | február | 17:15 | 17:45 |
  | március | 18:00 | 18:30 |
  | április | 19:45 | 20:15 |
  | május | 20:25 | 20:55 |
  | június | 20:45 | 21:15 |
  | július | 20:35 | 21:05 |
  | augusztus | 19:50 | 20:20 |
  | szeptember | 18:50 | 19:20 |
  | október | 17:45 | 18:15 |
  | november | 16:30 | 17:00 |
  | december | 16:00 | 16:30 |
- Pontos napnyugta-számítás kandidátus: organizer kalendár-modulba SunCalc-szerű
  helper, vagy egy heti cron ami beírja a `notifyAt` mezőbe
- Ütközés-handling: ha napnyugta utáni slot nem fér bele (pl. fürdés vagy
  bedtime miatt), engedett a napvilágban séta is, de a preferált a sötét

---

## 2026-05-07 — LinkedIn posztolás (heti 2-3×)

> Heti két alkalommal, illetve heti két-három alkalommal kéne a LinkedIn-re
> posztoljunk tanulságokat, amiket a héten összeszedtem.

### 2026-09-03 — heti ismétlődő feladat felvétele

> Kéne hetente egy ismétlődő feladat, hogy a Linkedin-re rakok ki posztokat.

**Rögzítés:** `org:task:6a98e83e482367e7f640c1d4` — „LinkedIn — heti posztolás”.
Az Organizerben `recurrenceType=intervalBased`, `recurrenceInterval=7` elmentve;
azonos patch dry-run visszaellenőrzése nem mutatott eltérést. Nap/időpont, első
esedékesség és utolsó teljesítés nincs megadva. `dueDate` nélkül még nem képződnek
időzített példányok, külön emlékeztető nincs aktiválva; a nap/időpont owner-válaszra vár.
A heti task nem írja felül a korábbi heti 2–3 posztos célt és nem ad automatikus
publikálási engedélyt. A tartalomgyűjtés továbbra is másik session feladata;
itt a megjelenést követjük. A személyes üzenetküldés blokkoltsága külön téma.

## 2026-05-07 — LinkedIn pontosítás: scope és workflow

> A Linkedin-es heti tanulságokat nem itt gyűjtjük, az egy teljesen másik
> session, egy teljesen másik agent feladata. Azzal neked nem kell foglalkoznod,
> csak magával azzal, hogy a Linkedin bejegyzés elkészül-e, és az mikor. Mert
> az is egy feladat. Általában sétaközben szoktam rendszerezni a gondolataimat,
> diktációkat, hogy mivel mi van, illetve mik a tanulságok és a posztot is
> ilyenkor szoktam összeállítani.

**Következmény (assistant-jegyzet — felülírva):**
- **Out of scope:** a tanulságok gyűjtése (más agent / más session dolga)
- **In scope (itt):** csak a *kimenet* — heti 2-3 LinkedIn poszt **megjelenik-e**, és **mikor**
- Tracking: heti zárónapon (pl. vasárnap este) megnézni: `posztSzám >= 2` ?
  Nem → halogatás-szorzó aktív a következő hétre
- ⭐ **Workflow-összefüggés**: a user **séta közben** rendszerezi a gondolatait
  / diktálja / állítja össze a posztot → **séta = LinkedIn-poszt termelő idő is**.
  Ez azt jelenti hogy a séta szlot kettős hasznú, és a "preferált esti séta"
  (sötét + diktálás) egy összefüggő rituálé

---

## 2026-05-07 — kaja-rendelés pontosítás (kétféle rendelés + emlékeztető-stratégia)

> Valahogyan valahova azt is fel kéne írni, hogy a kajarendelés, ez ugye
> kétféle van. Az egyik a Tesco-ból, amikor mindenfélét rendelek a
> Tesco-ból, a másik pedig az, hogy hetes, és minden hétre rendelek az
> Interfood-tól kaját, ami általában napi két kaja. Minden hétköznapra
> rendelek az Interfood tolkaját. Ugye ez az, ami fel van írva már, hogy
> mindig valami csütörtökig le kell adni a rendelést a jövő hétre, és ugye
> erre a hétre van utoljára rendelve. Általában két hétre időnként háromra
> előre lehet rendelni, És aztán meg majd mindig emlékeztetned kell.
> Lehetőleg ne az utolsó pillanatban emlékeztes majd arra, hogy kaját kell
> rendelni, hanem jóval előtte. Jóval előtte, de azon az adott héten, amikor
> már utoljára van kajám, mert akkor fogok a leghosszabb távra előre
> rendelni, így kell a legkevesebb szer ismételni ezt a feladatot.

**Következmény (assistant-jegyzet):**

### Két különálló rendelés-típus

| Típus | Forrás | Mit | Ütem |
|---|---|---|---|
| 🛒 **Tesco-rendelés** | Tesco | mindenféle (bolti bevásárlás) | 2-3 hetente, lásd `current/shopping/list.md` |
| 🍱 **Interfood-rendelés** | Interfood | hétköznapra napi 2 kaja (azaz hét × 5 nap × 2 = 10 adag/hét) | az utolsó fedett hét kedd–szerda időablakáig leadni a maximális következő időszakra |

A korábbi "Kaja-rendelés" sor → **Interfood**-ot fedi le. A Tesco külön sor.

### Interfood — előre-rendelési stratégia (új)

- Általában **2 hétre** előre lehet rendelni, **időnként 3 hétre** is
- Cél: **a leghosszabb elérhető távra** rendelni → minimalizálódik az ismétlés
- Mai helyzet (2026-05-07): erre a hétre van utoljára kaja → most 2-3 hétre érdemes előre rendelni, nem csak jövő hétre

### Emlékeztető-stratégia (új) — KRITIKUS

- ❌ **Ne** az utolsó pillanatban emlékeztetni (ez csütörtök este lenne)
- ✅ **Jóval előtte** emlékeztetni
- ✅ De **csak azon a héten** amikor a fedett-időszak utolsó hete kezdődik
  (mert ekkor lehet a leghosszabb távra előre rendelni → a legritkábban kell ismétlést kezdeni)
- Praktikus időzítés: az utolsó-fedett-hét **hétfő-keddjén** kezdeni az emlékeztetést,
  és a következő interakciókban ismételni a csütörtöki határidőig

### 2026-08-26 — dinamikus ismétlődés pontosítása

> „Ez itt majd egy olyan ismétlődő feladatunk, amihez azt hiszem majd megint
> kelleni fog egy organizer feature request is, mert ez úgy működik, hogy
> két-három hetente ismétlődik, attól függően, hogy meddig adtuk le legutóbb
> a rendeléseket az Interfood kaja rendeléshez. hogy ha két hétre előre adtuk
> el a rendelést, akkor a két hét lejárta előtt, kedd szerdáig le kell adni a
> következő adagot, és annyit adunk le, amennyit csak tudunk. Majd ehhez is
> kell készítenünk egy eszközt is.”

Ez a pontosítás a fenti hétfő–csütörtök emlékeztetési ajánlást az alábbi
kanonikus működésre szűkíti:

- a ciklus hossza nem fix: az előző rendelés tényleges `coverageEnd` dátumától függ;
- a következő rendelés célsávja az **utolsó fedett hét kedd–szerda**;
- mindig a pillanatnyilag elérhető **leghosszabb időszakra** rendelünk;
- teljesítés csak akkor zárható le, ha rögzítettük, meddig szól az új rendelés;
- amíg az Organizer nem tud lefedettség-alapú ismétlődést, a következő taskot
  manuálisan kell újradátumozni/létrehozni a rögzített `coverageEnd` alapján.

---

## 2026-05-07 — TERA projekt ellenőrzés

> Fel kell írni még egy ismétlődő feladatot, ami az, hogy a Terra projektet
> két naponta ellenőrizni kell. Tegnap ellenőriztem utoljára. Illetve lehet,
> hogy nem is úgy kéne, hogy két naponta, hanem hogy minden kedden és
> csütörtöken igen, így lesz a jó.
>
> Sry typo, nem terra, hanem TERA

**Következmény (assistant-jegyzet):**
- Projekt-név: **TERA** (a "Terra" STT-typo, a user javította)
- Recurring trigger: **minden kedd + minden csütörtök** (ez a végleges szabály,
  a 2-naponta verzió felülírva)
- Utolsó elvégzés: 2026-05-06 szerda (a régi 2-naponta szabály alatt)
- Következő esedékes nap a kedd+csütörtök szabály szerint: **2026-05-07 csütörtök = MA**
- Csúszás → halogatás-szorzó (ha kihagyott egy keddet vagy csütörtököt)

---

## 2026-05-07 — céges hózárás (havi)

> A céges hónap zárást minden hónap második munkanapján kell megcsinálni, és
> ebben a hónapban most tegnap megcsináltam már.

**Következmény (assistant-jegyzet):**
- Recurring trigger: minden hónap **2. munkanapja**
- Munkanap = nem hétvége + nem magyar munkaszüneti nap
- 2026-05-06 szerda = utolsó elvégzés (a user tegnap csinálta meg, kicsit csúszva — ténylegesen 3. munkanap volt, mert máj. 1 ünnep, máj. 2-3 hétvége, máj. 4 hétfő = 1. munkanap, máj. 5 kedd = 2. munkanap, máj. 6 szerda = a tényleges nap)
- Következő trigger: **2026-06-02 kedd** (június 1 hétfő = 1., június 2 kedd = 2.)

---

## 2026-05-07 — fürdés subtask-lista (testrész-checklist)

> Sajnos a fürdéshez is van egy sor subtask, amit rendszeresen elfelejtek,
> mi mindent kell megnosni, arcomat, hónomaljár, intim részeimet. Ugyan
> időnként egy-egy dolog kimarad ez kritikus. (Emlékeztethetnél)

**Következmény (assistant-jegyzet):**

A fürdés-recurring **kötelező subtask-listája** (konkrét testrészek, hogy ne
maradjon ki egy sem):

| ✓ | Testrész |
|---|---|
| ☐ | 👁️ Arc |
| ☐ | 🦦 Hónaljak |
| ☐ | 🩲 Intim részek |
| ☐ | (egyéb — ide bővíthető ha kimarad valami) |

**A user explicit kérése:**
> "(Emlékeztethetnél)"

→ Emlékeztető-stratégia (assistant feladat):
- 🔔 **Fürdés-start jelzés esetén** (pl. user mond: "becsobbantam a kádba"):
  rögtön küldök checklist-et a chat-be (a fenti tábla)
- 🔔 **Fürdés-task indításakor** (ha task-ban van), a description-be rakni a
  subtask-listát
- 🔄 Bővíthető: ha a user új testrészt említ ("erről is megfeledkeztem"),
  hozzáfűzöm a listához

⚠️ A user "kritikus"-nak nevezte ha kimarad valami — ez prioritást ad: ha a
fürdés-task aktív és a user szól hogy "becsobbant", ne csak "OK"-zzam le,
hanem **automatikusan** küldjem a checklist-et.

**Pszichológiai kapcsolat**: ugyanaz a "rendszeresen elfelejtem" mintázat mint
a `health-system.md` arc-mosásnál — flow-merülés / nem-szeretem-rutin →
kifelejtés. Anti-deferral stratégia ide is alkalmazható (lásd
`health-system.md`).

---

## 2026-05-07 — étkezés utáni mozgás

> kajálás után megedzenem kéne, vagy sétálnom, vagy mindkettőt.

**Következmény (assistant):**
- Minden `food-event` után javasolt egy **post-meal-activity** (séta vagy edzés)
- Ez NEM kemény szabály — ajánlás. Lásd Q-food-5.
- Tracking: a `food-event.postMealActivity` mezőben (lásd
  `current/feature-requests/food-tracking.md`)
- Praktikus default: kaja után **min. 20-30 perc séta** (emésztés-segítés);
  edzés akkor preferált, ha a hullám-vektor felfelé tart (3×3 elv)

---

## 2026-05-07 — Interfood kaja-rendelés eskalációs görbe

> A kajarendeléshez fontos infó, és ez jellemző dolog lesz, hogy a határidő
> csütörtök, tehát csütörtökig le kéne tudni ezt a feladatot, de valójában
> még szombaton is le lehet adni, csak akkor már ilyen kritikus high
> priority, és aztán utána jövő hét folyamán is le lehet adni, csak hogyha
> hétfőn adom le, akkor hétfőkedre már nem tudok rendelni, időnként már
> szerdára se, szóval kicsit más, mint az, hogy bezár a patika. Kicsit más,
> mert le lehet adni később, csak a prioritási rendszerünk miatt fontos,
> hogy csitörtöki legyen a platáridő, így aztán még nagyobb prioritást
> kaphat még szkriptelve is.

**Eskalációs tábla (assistant strukturált):**

| Nap (a leadás napja) | Prio-szorzó | Megjegyzés |
|---|---|---|
| Hétfő — szerda (jövő hét) | 1.0 | proaktív zóna; a leghosszabb távra előrerendelés |
| **Csütörtök** ⏰ | 1.0 → 1.2 (este) | **platáridő** — itt kell leadni |
| Péntek | 1.5 | warn — még normál módon megy |
| Szombat | **2.0** | "kritikus high priority" — user szövege |
| Vasárnap | 2.5 | minden óra rosszabb |
| Hétfő (késett) | 3.0 | hétfő-keddre **nem tud rendelni** → hét eleji éhezés |
| Kedd (késett) | 3.5 | szerdára **gyakran szintén nem** |
| Szerdától | 4.0+ | krónikus csúszás |

**Implementációs jegyzet:** ez egy **dinamikus deadline-szorzó** — bekerül
a `priority-system.md`-be majd. Scriptelhető: a deadline (csütörtök 23:00)
+ a kihagyott napok száma alapján.

**Fontos különbség** a "patika típusú" deadline-tól: nincs **kemény fal**, a
rendelés továbbra is leadható, **csak fokozatosan szűkül a fedett napok
száma**.

---

## 2026-05-07 — fürdés időtartama

> Jó, még azt is felírhatnád, hogy általában olyan két-három órán keresztül
> fürdök, szóval annak majd úgy kell időt találni.

**Következmény:** a fürdés blokk **2-3 óra hosszú**. A 07:00–23:59-es ablakon
belül a legkésőbbi kezdés **~21:00** (3h-val 24:00-ra ér véget, épp a tiltás
határán). Tervezésnél előre 2-3h-ás slot-ot kell lefoglalni.

---

## 2026-05-07 — initial szabálycsomag

> Kéne ismétlődő feladatokat csináljunk, és ez az, hogy itt konkrét, pontos,
> bonyolultabb logikákra lenne szükség, és eznek igazából teljesen az
> organizerben lenne a helye.
> De egyelőre majd itt akkor most szövegesen leírogatjuk, hogy mik is a
> requestjeim, és akkor majd később, hogyha tudjuk, átköltöztetjük az
> organizerbe.
>
> mint például a takarítás, amit hetente egyszer ismételni kéne, mondjuk szerdán.
> Minden nap kéne sétálni legalább egyszer, de akár többször is.
> 3 hetente egyszer be kéne rakni egy mosást.
> A hetente kétszer fürdeni kéne.
> Van egy bevásárlási ismétlődés, ami valahogy úgy működik, hogy két-három
> hetente le kéne adni bevásárló megrendelést, amire folyamatosan gyűjtjük,
> hogy mi mindent kell venni.
> Illetve kaját kell rendeljek mindig előre. Most például erre a hétre még van
> kajám, de a jövő hétre már nincsen rendelve. És ezt mindig meg kell lépni még
> általában csütörtökig bezárólag. különben nem lesz kajám jövő héten és az
> nagyon drága szóval és ennek a prioritása például lehet, hogy nőhetne
> erősebben szóval hogyha most már szombat van és még mindig nem rendeltem
> kaját jövő hétre akkor ez a legfontosabb prioritás nagyon-nagyon magas
> prioritással kell rendelkezzen

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

> **Tracking-mező (KRITIKUS):** minden recurring task-nál fel kell tüntetni
> az **utolsó elvégzés dátumát** + a **következő esedékes** dátumot, hogy
> tudjuk a csúszást számolni. (User-feedback 2026-05-07: a "takarítás megvolt"
> dátum nélkül félreérthető — meg kellett kérdezni mikor.) A táblázat ennek
> megfelelően bővítendő, illetve a `current/diary/`-ben minden interakciónál
> frissíteni az utolsó elvégzés dátumát.

| Feladat | Ismétlődés | Preferált nap/keret | Utolsó | Következő | Csúszás-kezelés |
|---|---|---|---|---|---|
| 🧹 Takarítás | hetente 1× | szerda | **2026-04-30** (csü) | 2026-05-06 (esedékes) | halogatás-szorzó |
| 🚶 Séta (általános) | naponta legalább 1× (akár több) | **preferált: napnyugta után** (szezonálisan változik) | naponta nézni hogy megvolt-e |
| ⛰️ Gellért-hegy felsétálás (fit-edzés) | minden 2. nap **vagy** legalább heti 2× | NEM szombat, péntek 18:00 előtt | lásd `fit-system.md` |
| 🧼 Arc-mosás (health) | **napi 3×** | bármikor, természetes flow-szünet | mos → nyomkod → mos → fertőtlenít. Anti-deferral: "majd" → +15p emlékeztető |
| 🧺 Mosás | 3 hetente 1× | bármikor | halogatás-szorzó |
| 🛁 Fürdés | hetente 2× | **07:00–23:59 között**, **2-3h hosszú blokk**, latest start ~21:00 | halogatás-szorzó |
| 🛒 Tesco-rendelés (bolti bevásárlás) | 2-3 hetente | bármikor | folyamatos shopping-list gyűjtés (`current/shopping/tesco.md`) a megrendelésig |
| 🍱 Interfood-rendelés (hétköznapi kaja, napi 2×) | `coverageEnd` alapján változó, jellemzően **2-3 hetente** | az utolsó fedett hét **kedd–szerda** időablakában; mindig a maximális elérhető távra | csúszáskor fokozódó prioritás; teljesítéskor új `coverageEnd` kötelező |
| 🏢 Céges hózárás | havonta | minden hónap 2. munkanapja | csúszás → halogatás-szorzó |
| 🌍 TERA projekt ellenőrzés | heti 2× | **kedd + csütörtök** | csúszás → halogatás-szorzó |
| 💼 LinkedIn poszt (csak megjelenés-tracking, tartalom out of scope) | heti 2-3× | séta közben szokta összeállítani | heti 0-1 poszt → halogatás-szorzó |
| 🌙 Lefekvés-emlékeztető | csúszó (nem napi fix) | `wakeAt + 18-20h` | lásd `sleep-system.md` |

## Open kérdések — később tisztázandóak

- **Takarítás csúszás**: ha szerdán nem volt, mikor pótoljuk? (default: amint lehet, halogatás-szorzóval)
- **Séta**: count-alapú vagy duration-alapú? Most: csak "megvolt-e" elég.
- **Bevásárlás 2-3 hetente**: 14 vs 21 nap? Default: 18 nap (átlag), de a shopping-list mérete is befolyásolhatja.
- **Kaja-rendelés csúszása**: a régi csütörtök–vasárnap görbét a 2026-08-26-i
  kedd–szerda célsávhoz kell majd újrakalibrálni az Interfood-eszköz mérései alapján.

---

## 2026-09-08 — SÉTA: a hajnali 1–4 a kedvenc sáv

> **Owner, szó szerint (09:24):** *„mindennapra sétát is be kéne ütemezni. Ott is volt egy csomó
> sztori ezzel kapcsolatban. Meg tudjátok sétálni, meg hogyan. Amúgy a **hajnal 1-4 időintervallum
> a kedvencem a sétára**. De ha lehült az idő és sötét van, akkor nem olyan rossz."*

⭐ **Ez nem véletlen preferencia, hanem illeszkedik a csúszó alvás-ciklusához**
*(`sleep-system.md`)*: hajnali 1–4 gyakran az **ébrenléti** szakaszába esik. ⇒ A séta-emlékeztető
**nem reggel** esedékes, hanem az ő ritmusa szerint.

**Amit szeret benne:** hűvös · sötét · csendes.
⚠️ ⇒ A **meleg nappal** nem semleges alternatíva, hanem **rosszabb** — ma pl. 33 °C van.

📌 **Következmény a felvételre:** napi ismétlődő tétel, de az esedékesség-ablak a **hajnali sáv**,
nem a naptári nap eleje.

---

## 2026-09-08 07:58 — MIÉRT NEM VOLT ISMÉTLŐDŐ A „NAPI MATRAC" — az owner magyarázata

> *„azt hiszem, az a matracos feladat azért nem volt ismétlődő, mert úgy rémlik, hogy az
> organizerben úgy működik, hogy **akkor jön létre a következő esemény, amikor az előzőt lezártuk**
> valamilyen úton-módon. De hát ugye azzal, hogy nem lett lezárva és eltelt az ideje… **jeleznie
> kellett volna, hogy már tegnap, meg tegnapelőtt, meg az előtt sem csináltam meg**."*

⭐ **Tehát nem hiányzó beállítás, hanem LÁNC-SZAKADÁS:** az organizer a következő előfordulást a
**lezáráskor** hozza létre. ⇒ Egy **le nem zárt** példány **megállítja a sorozatot** — és onnantól
a szokás **nem is jelenik meg**.

🔴 **A veszélyes rész:** ez pont fordítva működik, mint ahogy hasznos lenne. Aki **abbahagyja** a
szokást *(tehát nem zárja le)*, az **nem kap több emlékeztetőt** — a rendszer **pont akkor hallgat
el, amikor a legjobban kellene szólnia**.

📌 **Amit az ownernek látnia kell:** *„ezt tegnap, tegnapelőtt és azelőtt sem csináltad meg"* —
azaz a **kihagyások számát**, nem egyetlen lejárt tételt.

⚠️ Ez **organizer-viselkedés**, nem a mi hibánk — de a **hiánya-jelzés** a mi dolgunk lehet:
a lejárt, ismétlődő tételeknél a **kihagyott alkalmak számát** kell mutatni.

---

## 🔁 CSÚSZÓ MEGÚJÍTÁS — amikor az ismétlődésnek ELŐRE kell csúsznia (2026-09-11)

> **Owner, 2026-09-11 15:54-15:55 (szó szerint):** *„fel kell venni egy **évente ismétlődő**
> feladatot a dominós adategyeztetésről, ami minden évben **egy hónappal korábban** kell
> csinálni."* · *„amikor megcsináljuk, akkor **onnantól számítva egy évig él**, és ugye mindig
> **egy hónappal előbb** frissíteni kell ezt a dolgot, különben lejár. És ugye, hogyha
> **ugyanakkorra állítanánk, akkor sose lennénk időben**, szóval mindig **csúsznia kell előrébb
> egy hónapot**."*

### A SZABÁLY

```
következő esedékesség  =  (utolsó ELVÉGZÉS + 1 év)  −  1 hónap
```

⚠️ **A horgony az ELVÉGZÉS, ⛔ nem a naptári évforduló.** Ez a különbség az egész lényege.

| Kör | Elvégzés | Érvényes eddig | Következő emlékeztető |
|---|---|---|---|
| 1. | **2026-09-11** | 2027-09-11 | **2027-08-11** |
| 2. | 2027-08-11 | 2028-08-11 | **2028-07-11** |
| 3. | 2028-07-11 | 2029-07-11 | **2029-06-11** |

⇒ Évente **egy hónapot vándorol visszafelé** a naptárban. Ez **szándékos**, nem drift.

### ⭐ MIÉRT NEM ELÉG A „SIMA ÉVENTE"

🔴 **Mert a lejárat az elvégzéstől számít, nem a naptártól.** Ha a feladat minden évben
ugyanarra a napra esne, akkor az **elvégzés napján** járna le az érvényesség — vagyis
**pontosan akkor, amikor még csak nekiállnánk**. ⇒ **Mindig elkésnénk.**
*(Az owner szavával: „akkor sose lennénk időben".)*

📌 **A mért ár, amit ez a szabály megelőz:** 2026 szeptemberében **kikapcsolták a Domino-számot**,
mert az adategyeztetés elmaradt — ⛔ nem figyelmeztetés jött, hanem **szolgáltatás-megvonás**.

### 🧩 ÁLTALÁNOSÍTHATÓ — ⛔ nem Domino-specifikus

Minden olyan megújításra érvényes, ahol **az érvényesség az elvégzéstől ketyeg**: okmányok,
bérletek, tanúsítványok, előfizetés-hitelesítések. **Felismerési jel:** *„X ideig érvényes"*
+ *„előbb kell megújítani"*. ⇒ Ilyenkor ⛔ **ne** naptári ismétlődést vegyek fel.

⚠️ **Az organizer `recurrenceType`-ja ezt a mintát (még) nem ismeri** ⇒ a következő esedékesség
**konkrét dátummal** kerül be, és **elvégzéskor kézzel kell felvenni a következőt**.
📌 Ez **FR-jelölt** az organizernek: *„completion-anchored renewal, negatív eltolással"*.

🔗 `org:task:6aa40936766c802935c3e758` *(Domino, következő: 2027-08-11)*

---

## 🍔 ÜNNEPLÉS-MINTA: a „szar kaja" is a program része (owner, 2026-09-12 03:25)

> **Owner (szó szerint):** *„Mondtam már, hogy a **szar kaja is része az ünneplésemnek**."*

⇒ **Buli-hétvégén ⛔ nincs kaja-optimalizálás, nincs egészséges-alternatíva javaslat.** A
gyorskaja **nem kisiklás**, hanem **a program része** — a felajánlott „jobb" opció itt
**nem segítség, hanem kioktatás**.

📌 **Mikor él:** a `current/events/`-ben jelölt ünneplés-ablakokban *(most: 09-11 este → 09-13)*.
⭐ Utána a `health-system` / `fit-system` **változatlanul** visszatér — ⛔ nem kell „bepótolni".

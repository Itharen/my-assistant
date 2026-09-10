# RENDSZER-FELADATOK — nyitott / folyamatban / lezárt

> **Owner-szabály (2026-09-07 12:13, hangüzenetben) — SZÓ SZERINT:**
>
> *„Nagyon fontos, hogy megfelelően és alaposan mindig fájlokba mentve jegyezzük, hogy milyen
> feladatok vannak nyitva, mi az, ami in progress, és hogy mi az, amit már ténylegesen
> lezártunk, hogy ne sikkadhassanak el soha a feladatok, amiket elkezdtünk."*

> **Owner-elhatárolás (2026-09-07 12:26, hangüzenetben) — SZÓ SZERINT:**
>
> *„fontos, hogy ezt a feladat nyilvántartást, ezt ne keverjük össze az organizerben lévő én
> feladataimmal. Tehát valahogy ezt nagyon alaposan kifejezésekben is el kell különíteni
> egymástól ezt a két fajta feladatot, amit te csinálsz, amit együtt csinálunk, meg amit én
> csinálok."*

---

## 🔴 A HATÁR — mi tartozik IDE, és mi NEM

**Két, egymástól FÜGGETLEN nyilvántartás van. Soha nem folynak össze:**

| | **RENDSZER-FELADAT** *(ez a fájl)* | **ÉLET-FELADAT** *(organizer)* |
|---|---|---|
| **Miről szól** | a **rendszer** építése és üzemeltetése | az **owner élete** |
| **Példa** | relay-deploy · STT-újrapróbálás · port-költözés | bevásárlás · takarítás · séta · munka · GoPrint |
| **Hol él** | `__agent/TASKS.md` | organizer, `fo tasks.*` |
| **Azonosító** | `T-NN` | organizer-ref (`org:task:…`) |
| **Ahogy hívjuk** | *„rendszer-feladat"* | *„a te feladatod"* / *„élet-feladat"* |

⛔ **AMIT SOHA NEM SZABAD:**
- rendszer-feladatot az organizerbe írni *(ott az owner listáját hígítaná)*
- élet-feladatot `T-NN` azonosítóval ellátni *(itt a rendszer-listát hígítaná)*
- egy tételt **hallgatólagosan** átvinni egyik nyilvántartásból a másikba

🔴 **MIÉRT SZIGORÚ EZ:** az owner az organizert azért nézi, hogy **mit kell NEKI csinálnia**.
Ha oda bekerül egy „nginx conf" tétel, a lista **használhatatlanná válik** — és pontosan az
a lista sérül, amiért az egész rendszer létezik. A hígítás **visszafelé is igaz**: ha ide
kerül a „vegyél kenyeret", akkor ez a fájl szűnik meg SSOT lenni.

### Ki végzi — minden tételnél jelölve

| Jel | Ki | Mit jelent |
|---|---|---|
| 🤖 | **én** *(Honnie)* | egyedül elvégzem, nem kell hozzá az owner |
| 🤝 | **közösen** | az én munkám, de owner-döntés vagy -adat kell hozzá útközben |
| 🙋 | **owner-lépés** | ⚠️ **NEM az owner feladata a saját listáján** — hanem egy *rendszer*-feladat **kapuja**, amit csak ő tud kinyitni *(kulcs, jóváhagyás, telefon-beállítás)* |

⭐ A 🙋 **szándékosan nem** „az owner feladata": az organizerbe **nem** kerül át. Itt marad,
mert **az én munkám áll miatta** — a nyilvántartás az enyém, csak a kulcs van nála.

---

## Az állapotok

| Jel | Állapot | Mit jelent |
|---|---|---|
| 🔵 | **NYITOTT** | fel van véve, még nem kezdtem el |
| 🟠 | **FOLYAMATBAN** | elkezdtem, **nincs kész** |
| ✅ | **LEZÁRT** | ténylegesen kész **és igazolva** |
| ⏸️ | **BLOKKOLT** | rajtam kívül álló okból áll — a *mire vár* mezővel |
| 🔍 | **FELTÁRANDÓ** | ⚠️ bizonytalan kérés — **NEM kezdjük el**, előbb körbejárjuk *(l. lentebb)* |

⚠️ **A ✅ csak IGAZOLÁS után jár.** „Megírtam" ≠ „kész": teszt/mérés/élő próba kell hozzá.
*(Ugyanaz az elv, mint a képesség-katalógusban a `✅` = owner-jóváhagyás.)*

**Utoljára frissítve:** 2026-09-08 09:55

---

## 🟠 FOLYAMATBAN

| # | Ki | Feladat | Hol tart | Következő lépés |
|---|---|---|---|---|
| T-47 | 🙋 | 💼 **Bérszámfejtés — rákérdezni a jelenléti ívekre** | Felírva az organizerbe (`org:task:6a9f04ab482367e7f6420c8f`, prio **112**). Owner 20:32: a bérszámfejtés **csúszik** a szokásoshoz képest | **az owner dolga** — neki kell írnia a bérszámfejtésnek |
| T-43 | 🤝 | 📍 **Saját mobil-app a helyzet-küldéshez** | 🟢 **MEGVÁLASZOLVA** (`current/feature-requests/own-location-app.md`) — 🔴 korábban visszakérdeztem ahelyett, hogy állást foglaltam volna. **Javaslat: csináljuk sajátban, Capacitorral.** Mérve: az organizernek **kész APK-futószalagja** van; a háttér-hely **PWA-ban NEM megy** (platform-korlát); a plugin **nem fizetős** (MIT-es alternatívák) | 🙋 **EGY döntés:** belevágjunk a v1-be? *(egy kapcsoló + státusz-sor, semmi más)* |
| T-44 | 🤝 | 📅 **AI Summit nap 2 — TERV** | 🟢 **ÚJRACSINÁLVA a `summit-planning.md` 7 lépése szerint** (`current/events/2026-09-08-summit-day2-plan.md`): A/B/NEM lista · ütközések · épületváltás-minimalizálás · energia · visszanézési lista. ⛔ Az első kísérletem hibás volt: **időpontból indultam, és ahhoz hajlítottam az érdeklődést** | 🙋 **owner dönt:** 11:00 (teljes A-lista) vagy 13:45 (délutáni blokk)? + a vibecoding-ütközés |
| T-45 | 🤖 | 🔍 **A review-eszköz (`dc rev`) bekötve — a találatok levitele** | **Bekötve ma**: CI/CD 12→13 lépés (`dc-review-relay`), LDP 17→22 (cli/server/client/relay/ext), mind `fatal: false`. ⚠️ **Eddig SEHOL nem futott.** Mérve: **2110 találat** (cli 1429 / server 364 / client 252 / relay 38 / ext 27), ~56 s. Mérés: `__documentations/developments/2026-09-07-review-tool-cicd-wiring.md` | a **relay 38** találatával kezdeni *(ez a legkisebb, és ez fut a CI/CD-ben)*. ⛔ Az átemelt CCAP-kód 280 találata **nem munkalista** (`transplant-not-rewrite`). A `fatal: true`-vá tétel **külön owner-döntés** |
| T-46 | 🤖 | 📥 **Discord-csatolmány fogadása** | **Megépítve**, 503/503 — `cli/src/discord/discord.file-intake.ts`. Eddig a fájl **némán elveszett** (szöveg nélkül elutasítva, szöveggel leesett az üzenetről). Most `__agent/inbox/`-ba mentődik | ⚠️ **élő próbára vár**: az owner holnapi summit-programja lesz az első valódi csatolmány. Addig NEM ✅ |
| T-48 | 🙋 | 💰 **Pénzügyi helyzetkép + bérszámfejtés** | ✅ **AZ FDP LESZÁLLÍTOTTA** — a jelentés kész, a levél-tervezet kész. 🔴 **Az én „némán megállt" jelentésem TÉVES volt**: `tail`-lel néztem a 133 kB-os AGENT_BUS **végét**, a válasz a **90. sorban** volt | 🙋 **egy „mehet" kell az ownertől** a levél szövegére ⇒ utána azonnal kimegy |
| T-52 | 🤖 | 🖥️ **Konzol-visszajelzés a hang-feldolgozásról** | ✅ **KÉSZ (2026-09-08 09:50)** — megépült az **ÉLŐ, keretenkénti SZÍNES sáv**: 🟢 zöld = a felvevő **ténylegesen** beszédnek vette · 🟡 határeset · 🔴 csend; a záró ítélet a **leghosszabb megszakítatlan** zöld sorozat (owner szabálya). ⛔ Az átemelt kód **bájtra érintetlen** — az elemző singleton **publikus** metódusára kívülről ülünk rá. ⚠️ **Élőben még nem láttuk** — beszéd kell hozzá. *(Korábbi 🟡 részben:* — a DEV megépítette a **szám-összegzést** a pulzus-sorban (60 mp-enként, hasznos). ⚠️ **De az owner ÉLŐ, keretenkénti, SZÍNES `|` sávot kért** — az a döntés **folyamatát** mutatja, nem az eredményét. ⛔ Ezért **nem zárom le** | 🙋 **OWNER-DÖNTÉS VÁR** *(3 opció: `__documentations/developments/2026-09-08-live-colour-bar-diagnosis.md`)*. ⭐ **A sáv MÁR LÉTEZIK és be van kapcsolva** — `_logCompactAudioAnalysis`, zöld/sárga/piros `|` keretenként. A hiba a **kocsivissza-alapú** helyben-rajzolás **ütközése** a 60 mp-enkénti pulzus-sorral; és a kettő **két külön folyamatból** ír *(figyelő `pid 299872` vs. szerver `pid 286248`)*, tehát az ütközés **szerkezeti**. ⭐ Ajánlás: **saját ablak a figyelőnek**. ⛔ Egyik opció sem igényli az átemelt kód módosítását |
| T-49 | 🤖 | 🎙️ **A voice-drop oka MEGVAN + FRS felvéve** | **Mérve: 17 ledobás = 17 LDP-restart** (+ a figyelő 18 perces kiesése). Az owner diagnózisa helyes. ✅ **BFR-MYASSISTANT-001** felvéve a bedrock-csatornába (`__documentations/BEDROCK-FRS.md`, `cli-dynamo`, high) — ez a **kanonikus út**, nem idegen repó szerkesztése | ⏸️ bedrock-agent válaszára vár. ⛔ A `dc ldp`-hez magamtól nem nyúlok |
| T-50 | 🙋 | 📝 **LinkedIn posztok kitétele** | Owner 21:20: *„a LinkedIn posztokat ki kéne tenni, amiket terveztem"* | 🙋 **kérdés nála:** nála vannak megtervezve, vagy nekem kell összeszedni? |
| T-51 | 🤖 | 📮 **CC-session üzenetküldés — szabályok ADOPTÁLVA** | ✅ `__agent/references/ccap-session-messaging.md`: a 6 HARD szabály (§7), a végpontok, és a **beazonosított ID-k** — 🔴 a fájl tetején a kötelező „a szabályokat MINDIG előbb olvasd el" figyelmeztetéssel. FDP Assistant: `ccs-eb7533f2-msf45rno` | ⛔ küldés **csak owner-jóváhagyással**; a `status` küldés előtt újra lekérdezendő |
| T-55 | 🤖 | 🗂️ **Vissza az ORGANIZERHEZ** | ✅ **ELSŐ KÖR MEGVOLT** (`current/tasks/organizer-triage-2026-09-08.md`): 137 tétel · 5 lejárt · 11 dátum nélküli magas prio. 🔴 **Adathiba találva:** a „Napi matrac" leírása *„MINDEN NAP"*, de az ismétlődése `none` ⇒ 3,5 hónapja egyetlen lejárt tételként ül | 🙋 **owner-döntések:** napi ismétlődő legyen? · NZT és OGS kivezethető? · adjunk-e dátumot a top 3 dátumtalannak? |
| T-56 | 🤖 | 🚶 **Napi séta ütemezése** | Owner 2026-09-08 09:24: *„mindennapra sétát is be kéne ütemezni… a **hajnal 1-4** időintervallum a kedvencem a sétára. De ha lehült az idő és sötét van, akkor nem olyan rossz."* | napi ismétlődő organizer-tétel + a hajnali sáv preferencia rögzítve |
| T-57 | 🤖 | 🗂️ **Az organizer-tételek ISMÉTLŐDŐK legyenek** | Owner: *„annak is ismétlődőnek kell lennie"* — a „Napi matrac" adathiba **általánosítva**: minden napi/heti szokás legyen tényleg ismétlődő | átnézni, mely rendszeres tételek vannak `recurrenceType: none`-nal |
| T-53 | 🤝 | 👤 **Owner-profil — KI Ő** | ⭐ **Owner 02:09:** *„nincs is neked feljegyzésed arról, hogy én ki vagyok"* — **igaza volt**. Létrehozva: `current/owner-profile.md`, a **biztosan tudott** részekkel; a hiányzók ⛔ **üresen** hagyva | ⏳ **az ő GPT-s infócsomagjára vár** *(02:18: „majd ezt el ne felejtsem odaadni")* ⇒ **emlékeztetni kell rá** |
| T-54 | 🤝 | 📧 **E-mail-kezelés — ⛔ ELŐBB a SZŰRÉSEK, csak utána a figyelés** | 🔴 **Owner, 2026-09-10 20:18:** *„ahhoz, hogy majd az e-mailjeimet is tudjad kezelni, ahhoz ott majd **rendbe kell tegyük az e-mail szűréseket**. Most jelenleg rengeteg e-mailt kapunk arra az e-mailre, amit amúgy nézned kéne, és jelenleg **lehet, hogy nincs értelme elkezdened nézni** az e-maileket, mert **tele van szemetelve**, és azt **ki kell tisztítsuk előbb**."* ⇒ ⭐ **A sorrend megfordult:** nem a figyelés a következő lépés, hanem a **takarítás**. ⚠️ Egy zajos postafiókon a figyelés **hamis riasztás-gyár** lenne — pont az ellenkezője a fókusz-támogatásnak. | ⏸️ **Két kapu:** ⛔ a postafiók megnézése **még nincs jóváhagyva** *(nincs a `CATALOG.md`-ban)* · a szűrés-rendbetétel **közös munka** — az ő döntése, mi szemét. 📌 A figyelés **addig NEM indul** |
| T-55 | 🤖 | 🗂️ **Vissza az ORGANIZERHEZ** | 🔴 **Owner 02:16:** *„mintha ellenél távolodva az organizeres feladatoktól, pedig az fontos kulcspontja lesz itt az asszisztensi munkának"* — **igaza van**: a fejlesztési tűzoltás elvitte a figyelmet | felmérni, mi maradt el az organizer-oldalon, és visszaállni rá |
| T-41 | 🙋 | **Agent a támogatásokra / pályázatokra / mikromunkára** | ⭐ **HATÓKÖR-KORREKCIÓ (owner 2026-09-07 20:49):** *„ez nem a te feladatod lesz, az arra majd egy agentet kell összeállítsunk és elindítsunk"* ⇒ ⛔ **NEM én csinálom.** A mai feltárás (`current/leads/2026-09-07-exploration.md`) az agent **kiindulása** marad, nem kidobott munka | ⏸️ **owner-vezérelt**: az agent összeállítása. ⛔ Magamtól nem indítok agentet (nincs jóváhagyva) |
| T-22 | 🤝 | 🔊 **Voice control — a DEV DOLGOZIK RAJTA** | ⭐ **Verifikálva 00:05:** 6+ commit, köztük **`ma comm voice-funnel`** — az átviteli arány egy paranccsal, valódi vs. nem-valódi veszteség szétválasztva. A handoff működött: a **mérést** választotta elsőnek, nem a szűrő-állítgatást · 🔴 **02:03 — ÉLŐ ADAT: az eredeti diagnózis MEGDŐLT.** A felvevő szűrője **0**-t dobott el; a szűk keresztmetszet az **STT 5 perces időtúllépése**. A bukott felvétel már **nem vesz el** (retry-sor bekötve). CLI **643/643** · ⭐ **08:35 — a lánc NÉMA HALÁLA is látszik**: `ma comm doctor` kimondja, ha a bot nincs bent a hang-csatornában *(5 ág, mind tesztelt)* | ⏳ **TÖBB MINTA KELL** — 4 kísérlet még „kevés minta". ⛔ A szűrő-küszöbökhöz nem nyúlunk: **mérve nem ott van a hiba** |
| T-10 | 🤖 | 🔴 **Sikertelen STT újrapróbálása** | **megépítve**, 474/474 teszt — `cli/src/stt/stt.retry-queue.ts` | ⚠️ **élő próbára vár**: a következő sikertelen felismerésnél derül ki. Addig NEM ✅ |

---

## 🔍 FELTÁRANDÓ — bizonytalan kérés, NEM kezdjük el

> **Owner-szabály (2026-09-07 12:26, hangüzenetben) — SZÓ SZERINT:**
>
> *„Most volt egy olyan feature request-em, ami kicsit bizonytalan, nem tudom mennyire
> megvalósítható. […] Nagyon fontos, hogy az ilyen bizonytalan pontokat azt ne vágjunk egyből
> bele, mert a már működő dolgokat keresztül húzhatja, hanem jelöljük össze ezeket, próbáljuk
> meg alaposan körbejárni és lefixálni."*

⇒ Teljes szabály: `current/principles/uncertain-requests.md`.

| # | Feladat | Mi a bizonytalan | Mit húzhat keresztül |
|---|---|---|---|
| T-13 | **Hosszú hang darabolása átfedéssel** | maga az owner mondta, hogy nem tudja, mennyire megvalósítható; a darab-határon a szó **kettévágódhat**, az átfedés pedig **duplikálhat** | 🔴 a **ma működő** hang-utat: 16 sikeres felismerés fut rajta. Egy rosszul darabolt átirat **teljesnek látszik** — ez a legrosszabb hibafajta |

**Mielőtt ebből 🔵 lehetne:** meg kell mérni, hol vágódik el ténylegesen a vég *(van-e egyáltalán
levágás, vagy csak a tagolás rossz — l. `current/stt-mishearings.md`)*, és kell egy mód, amivel
a darabolás **kikapcsolható marad**, ha rontana.

---

## 🔵 NYITOTT

### Hangüzenet / STT — megbízhatóság

| # | Ki | Feladat | Miért | Forrás |
|---|---|---|---|---|
| T-40 | 🤖 | 🔴 **Az üzenetek nem jutnak el hozzám az LDP-újraindítások között** | owner 2026-09-07 12:57: *„félek, hogy egy kicsit elsikkadt egy pár üzenet. Itt a LDP-s folyamatos újraindítások között nem perzisztálnak rendesen az üzenetek"* — **MÉRVE, igaza van — de az ok MÁS**: a szelep foglalt sessionbe küldött, a CCAP sorba tette, és onnan **késve, ÜZENETENKÉNT KÜLÖN futásban** érkezett *(nem veszett el)*. ⇒ a foglaltság-kapu javítva | owner 12:57 + saját mérés |
| T-12 | 🤖 | **Figyelés/riasztás a sikertelen feldolgozásokra** | *„nem ártana valami kezelés, figyelés"* — ⚠️ a T-10 sora már **szól**, ha végleg feladja; ami HIÁNYZIK: a **várakozó sor láthatósága** *(konzol-pulzus + `comm doctor`)* | owner 12:00 |

### LinkedIn — profil, posztok, posztolás

| # | Ki | Feladat | Miért | Forrás |
|---|---|---|---|---|
| T-73 | 🤖 | **Posztoló felület** | owner 2026-09-11 01:46: *„kelleni fog majd egy felület is, amivel posztolok"* ⇒ a hivatalos API-n **nincs küldés-scope**, tehát a felület a **piszkozatot** állítja elő, a kiküldés **UBH**-val vagy kézzel megy. ⚠️ A sorrend kötött: olvasás → piszkozat → felület → kiküldés | owner 01:46 |
| T-74 | 🤖 | **Poszt-piszkozat a `reply draft` mintájában** | az owner terve: *„ugyanúgy, mint ahogy a beszélgetésekhez előkészíted nekem a posztokat"*. A szabályok **megvannak** *(`current/principles/linkedin-post-writing.md`)*; a kalibráció a **48 meglévő poszt** | owner 01:42 + 01:46 |

### Egyéb

| # | Ki | Feladat | Miért | Forrás |
|---|---|---|---|---|
| T-20 | 🤝 | **Mikromunkák + hackathon előrevétele** | *„Reklámnak és pénznek"* — ⚠️ ez **kétfelé bomlik**: a *prioritás-átállítás az organizerben* **élet-feladat**, az viszont, hogy én ezt **felvessem és kövessem**, rendszer-feladat | owner 10:25 |
| T-23 | 🤖 | **LDP működés Bedrockba** | | owner 2026-09-06 |
| T-42 | 🤝 | 🤖 **Saját robot építése** | owner 13:51: *„eddig vágyálomnak tűnt de a mai ai summit után neki kéne állni... Tök egyszerű gagyik voltak a robotok..."* · 🎯 **HATÓKÖR-KORLÁT** (owner 14:15): *„mindig túl sokat akarok, pedig itt semmi sem hozott egynél több funkciót"* ⇒ **EGY funkció**, l. `current/principles/one-function-is-enough.md` | owner 13:51 + 14:15 |
| T-56 | 🤖 | 🔴 **BFR leadva: LDP make-before-break** | ⭐ **Owner 10:48 EXPLICIT UTASÍTÁSA:** *„Az, hogy ha ez nem így működik, akkor kurva kibaszott üzét Bedrock Feature-Request-et kell leadni."* ⇒ **`BFR-MYASSISTANT-001`, critical, leadva 2026-09-08 12:10.** ⛔ **A kérés NEM lépés-eltávolítás** — a hossz nem hiba, a **kiesés helye** az | owner 08:12 · 08:12 · 08:24 · 10:48 |
| T-57 | 🤖 | 🗓️ **Napi séta ütemezése — hajnal 1-4** | owner 07:24: *„a hajnal **1-4 időintervallum a kedvencem** a sétára. De ha lehült az idő és sötét van, akkor nem olyan rossz."* ⭐ Egybevág a hőérzékenységével *(hidegpárti, a meleg lelassítja)* ⇒ a hűvös + sötét nem szeszély, hanem **működési feltétel** | owner 07:24 |
| T-58 | 🤖 | 🔁 **Organizer: az ismétlődés ESZKALÁLÓDJON** | owner 07:58: az organizer a következő előfordulást a **lezáráskor** hozza létre ⇒ egy le nem zárt tétel **megállítja a sorozatot**. *„Készüljön a következő verzió, amit már jeleznie kellett volna, hogy már tegnap, meg tegnapelőtt, meg azelőtt sem csináltam meg. **Így kéne eszkalálódnia**"* 🔴 A rendszer pont akkor hallgat el, amikor szólnia kéne ⇒ a **kihagyások számát** kell mutatni | owner 07:58 |
| T-59 | 🤖 | 🔊 **Felolvasás, ha bent ül a hang-csatornában** | owner 08:02: *„ez a legmegbízhatóbb módja annak, hogy kommunikáljunk"* — ⭐ **közvetlenebb hangnem** ilyenkor. **Három al-igény:** (a) felolvasás, ha bent van · (b) **TTS-szöveggé alakítás** *(`→`, `=`, kódjelek kimondhatóra)* · (c) **melyik üzenetre válaszolt** — a delay miatt szétcsúszik a szál, vissza kell tudni azonosítani *„anélkül, hogy túl sok infót raknánk ezekbe az átkötésekbe"* | owner 08:02 |
| T-60 | 🤖 | 📺 **Visszanéznivalók listája** | owner 07:56: *„mindenképpen írjuk fel, hogy később nézzük vissza ezt a **szuper számítógépes** sztorit… meg a **többit is**, amiket kihagytam és érdekelhetnének"* | owner 07:56 |
| T-61 | 🤝 | 🧺 **Rendszeres házimunkák felvétele** | owner 10:03: **fekete mosás** *(rendszeresíteni)* · **mosás** általában · **házirend újra-összeállítása** · *„egy csomó plusz kiírást is szeretnék"* ⚠️ Ő maga jelezte a félelmét: *„félek, hogy nem látod át még mindig, hogy hogyan tudsz majd ebben segíteni"* | owner 10:03 |
| T-62 | 🙋 | 💰 **Sales Agent — bevétel-termelő agent** | owner 09:05: *„**Ez az én feladatom lesz.** Csinálni kell egy agentet, aki azért dolgozik, hogy legyen végre valami bevételünk"* + **Patreon és egyéb támogatói regisztrációk** feljegyzése/kezelése. ⛔ **NEM az én hatásköröm** — l. T-41, ugyanaz a határ | owner 09:05 |
| T-63 | 🤖 | 👤 **Owner-profil beemelése — SÚLYOZÁS ELŐBB** | ⭐ A GPT-s kivonat **megérkezett** *(`current/owner/who-is-the-user.md`, 26 kB)*. 🔴 **Owner kikötése:** *„Ezeknek az infóknak a súlyait, meg tényeit, meg lényegeit, azokat majd **át kell beszéljük, mielőtt beemelnéd** nagyon az egészet."* ⇒ ⛔ nem kanonizálom · ⏳ hiányzik még: **a cégéről** szóló összeállítás | owner 09:40 (fájl) |
| T-64 | 🙋 | 🔌 **Organizer MCP ↔ GPT összekötése** | 🎙️ **Owner hangüzenet, 2026-09-08 12:09:** *„az egyik legfontosabb **első számú feladat** az lesz majd **nekem**, hogy az Organizer MCP-t összekössem a GPT-vel."* ⇒ ⛔ **az ÖVÉ** *(„nekem")* — én a előkészítésben és a felírásban segítek | owner 12:09 (hang) |
| T-65 | 🤖 | 🎯 **Fókusz-módszer — ÉLESÍTVE, de mérni kell** | 🔴 **Owner 12:37:** *„folyton csapongok a feladatok között… segítened kell fókuszálni. **(Jelenleg csak rontasz rajta mert te is csapongsz nagyon)**"* ⇒ `current/principles/one-thing-focus.md` + `__agent/FOCUS.md` **megvan**. ⏳ **NEM kész**: a mérce *(1 téma/üzenet, ≤1 üzenet/kör)* **rajtam** mérendő, több körön át | owner 12:37 |
| T-66 | 🤖 | 🟡 **`comm doctor` HAMISAN mondja, hogy a hang-csatorna „nincs beállítva"** | **Mérve 2026-09-08 13:02:** a `.env`-ben **ott van** mindkét kulcs, a napló szerint a bot **13:02:03-kor BELÉPETT** — a doktor mégis *„nincs beállítva"*-t írt, mert az életjelben még nem volt `voice` mező. ⛔ **Ez TÉNYÁLLÍTÁS bizonyíték nélkül** — a helyes ág az `unknown` *(mint a `joined === undefined`-nál)*. ⚠️ Ugyanez a hiba **fordítva is** téveszt: valódi kimaradást is „nincs beállítva"-ként mutatna | saját mérés |
| T-67 | 🤖 | ⌨️ **A „gépel…" beragad, ha a session HALÁLLAL áll le** | 🔴 **MEGÉRTVE, NEM JAVÍTVA** — owner jelezte (2026-09-08 15:12): elfogyott a usage-keret, a folyamatom elhasalt, de a Discordon továbbra is **Typing** látszott. **A MÉRT OK:** a `checkReplyObligation` tisztán időbélyeg-alapú — `owesReply = utolsó beérkező > utolsó (nem-nyugta) kimenő`. Ha a session **válasz nélkül** hal meg, a kötelezettség fennmarad, és a figyelő a **45 perces** biztonsági szelepig gépel (`TYPING_MAX_MS`). ⚠️ A figyelőnek **nincs jelzése arról, hogy a session meghalt** — csak azt tudja, hogy válasszal tartozunk. | 🤖 **A javítás iránya:** a gépel-döntésbe be kell vezetni a session **életjelét** (l. `ma ccap runtime`): ha a válasszal tartozó session **nem fut**, a gépelést abba kell hagyni. ⭐ Magatól gyógyul 45 perc alatt ⇒ nem sürgős — de **félrevezető**, mert azt sugallja, hogy mindjárt jön a válasz |
| T-68 | 🤖 | 🎙️ **Hangüzenet ↔ transzkript nyilvántartás + visszamenőleges feloldás** | ✅ **MEGÉPÍTVE (2026-09-08 18:25)** — mindhárom rész. **(1)** `TranscriptLedger`: `messageId → resolved(szöveg) | failed(ok, próbák, **MEGŐRZÖTT hang**)`; a sor a **feladás pillanatában** átadja a hangot (`onGiveUp`), mielőtt a `remove()` törölné. **(2)** `referencedMessageId` végigmegy a láncon (Discord → figyelő → köteg) + `ma stt transcript|pending`. **(3)** `ma stt retry <id>`: újrapróbálás a megőrzött hangból, siker esetén a **kötegbe is** bekerül. ⭐ **Igazolva a VALÓDI, ma feloldatlan hangon:** 122 922 bájt megőrizve, **bit-azonosan** visszaolvasva, megjelenik a munkalistán. **756/756** zöld, fordítás tiszta, pozitív kontroll. | ⏳ **Ami hátra van:** az éles `failed` bejegyzés a **19:03-as 5. próba** után keletkezik — ⚠️ csak ha az ÚJ build addigra települt; különben a régi kód törli a hangot. 🛡️ **Biztonsági másolat készült** róla: `~/.config/my-assistant/stt-ledger/1546863401903587359.bin`. ⛔ A tartalom feloldása magától **nem** fog sikerülni, amíg az STT 5 percenként túllép — az környezeti (RAM), és ⛔ az FDP AI-hoz nem nyúlunk |

---

## ⏸️ BLOKKOLT — owner-kapura vár

⚠️ **Ezek NEM az owner feladatai** *(azok az organizerben vannak)* — ezek **az én
rendszer-feladataim**, amiknek a kulcsa nála van.

| # | Ki | Feladat | Mire vár |
|---|---|---|---|
| T-30 | 🙋 | **Relay-kulcsok élesítése** | az owner beállítja a `.env`-ben, ha hazaért *(a kulcsok generálva)* |
| T-31 | 🙋 | **Keystore-felvétel** | ⚠️ az `fdp env-*` CLI-vel **nem lehet írni** (mérve) — Overseer-felület, owner |
| T-32 | 🙋 | **Böngésző-kiegészítő újratöltése** | a port-költözés után (`manifest.json` host-engedély) |
| T-33 | 🙋 | **OwnTracks beállítása a telefonon** | app + `home` régió + URL |
| T-34 | 🙋 | **Képesség-jóváhagyások** | a `CATALOG.md` `⏳` sorai — `✅`-t csak az owner adhat |

---

## ✅ LEZÁRT — 2026-09-07

*(Csak az igazoltak. A részletek a `CHANGELOG.md`-ben és a `CONTINUATION.md`-ben.)*

| # | Feladat | Igazolás |
|---|---|---|
| ✅ | ✂️ **A rövidség-korlát VISSZAVONVA** | Owner 21:45: a kemény korlát **rossz megoldás** — feldarabolóvá tett, és elvette a tagolást adó **emojikat**. ⇒ jelzés, nem kapu; 1200/40; emojik vissza. 📌 *Rossz metrikát tettem mérhetővé — az aktívan árt* |
| ✅ | ⛔ **Hatáskör-kapu beépítve** | Owner 21:27 rendszer-kritikája: *„szarul lettek becsatornázva a workflow szabályok"*. **ENTRY §5b**: 1. az enyém? → 2. jóváhagyott? → 3. csak azután hogyan. **CATALOG**: új „NEM AZ ÉN HATÁSKÖRÖM" szekció. ⚠️ Mérve: az `ma email send` **nem is szerepelt** a katalógusban |
| ✅ | ✂️ **Rövidség-őr — a hosszú üzenet nem megy ki** | Owner 21:06: *„nem olvastam, hosszú üzeneteket írsz"*. ⚠️ A szabály **már létezett** — nem tartott vissza. Most **gépi korlát**: 400 karakter / 8 sor, `--long`-gal felülbírálható. 535/535, élesben igazolva (514 karakter blokkolva) |
| ✅ | 🔴 **Az automatikus action-log hookok NEM FUTOTTAK** — két ok | Mérve: **2026-08-28…09-06 között NULLA** hook-bejegyzés, közben 400-600 sor/nap kézi. (1) BOM nélküli `.ps1` + em dash ⇒ a **Windows PowerShell 5.1** nem parse-olta *(a hook `powershell`-lel indul, nem `pwsh`-sal)*; (2) elavult `cli/build/main.js` útvonal *(valódi: `cli/dist/cli/src/main.js`)*. **Javítva mindkettő**, a hook azóta ír. Doksi: `__documentations/developments/2026-09-07-action-log-hooks-were-dead.md` |
| ✅ | **Duplikált feldolgozás javítva** *(owner 12:21)* | 481/481 + **regresszió-teszt**: az `append()` addig CSAK a várakozó köteget nézte, az archívumot nem ⇒ a kézbesített üzenet védelme megszűnt. Most **mindkét halmazt** nézi (`isKnownMessage`), és a **hangfelismerés is** ellenőrzi a drága lépés ELŐTT |
| ✅ | **C-33 Discord-hangüzenet → STT → tükör** | **élőben**, az owner valódi hangüzeneteivel (16 sikeres felismerés) |
| ✅ | **C-44 konzol-pulzus** | élőben fut; már az első percben jelzett 3 váró üzenetet |
| ✅ | **C-45 köteg-frissítés küldés előtt** | 409/409 teszt |
| ✅ | **C-46 távvezérlés-szűrő** | a 09:15:33-as rejtély megoldva és kódba öntve |
| ✅ | **C-48 kézbesítési értesítő** | owner-korrekció után áthelyezve a küldés pillanatára |
| ✅ | **STT-flagek + félrehallás-könyvtár** | 448/448 |
| ✅ | **LDP-ellenőrzés minden triggerkor** | élő próba: a `doctor` első sora |
| ✅ | **Port-költözés 24 → 33 + relay 34** | `fdp-templates`-be regisztrálva; a szerver a 39335-ön fut |
| ✅ | **Overseer-regisztráció** | 844/844 |
| ✅ | **T-01 relay gateway-conf** | `nginx -t` a konténerben LEFUT az új conf-on: fallback-cert generálás után **sikeres** ⇒ nem tudja crash-loopoltatni a gateway-t |
| ✅ | **T-02 relay SSL** | `ssl-config.json` 36 → 37 domain, JSON érvényes |
| ✅ | **T-35 CI/CD-indító** | ⭐ **az owner oldotta meg**: átvitte a repót a `futdevpro` szervezetbe (2026-09-07 13:03). Igazolva: `futdevpro/my-assistant` létezik és tartalmazza a legfrissebb commitot; a remote átállítva a kanonikus címre |
| ✅ | **T-12 a várakozó STT-sor láthatósága** | **élő próba**: 2 tétellel a sorban a `doctor` 🟡-t adott és a **legsürgősebb** tétellé tette; a konzol-pulzus `🎙️ 2 hang újrapróbálásra vár` |
| ✅ | **T-04 relay lehúzó oldal** | **élő, végponttól végpontig próba** a futó relay ellen: helyzet betöltve → lehúzva → eltárolva → nyugtázva → a következő kör üres. ⭐ A **home** helyzet koordináta NÉLKÜL tárolódott (`{state:"home"}`) — az owner szabálya élőben igazolva |
| ✅ | **T-03 relay CI/CD + Dockerfile** | JSON érvényes, 12 lépés; a `node build/index.js` belépési pont **élőben elindult**, a `/api/relay/pull` **401**-et adott token nélkül *(fail-closed igazolva)*. ⚠️ Maga a **pipeline-futás** még nem próbálódott — az a T-35-ön múlik |
| ✅ | **`startup-test` javítás** | 8 teszt / 0 bukás; mind a 14 pipeline-lépés zöld |

### Lezárva a T-11 helyett — 👂 fül-reakció + válasz-lánc

⚠️ **A T-11 („gépel…" az STT alatt) TÖRÖLVE, nem elhalasztva** — az owner **mást kért helyette**
*(2026-09-07 12:26)*, és a régi tétel bent hagyása azt a látszatot keltené, hogy még tartozom vele.

| # | Feladat | Igazolás |
|---|---|---|
| ✅ | **👂 fül-reakció a hangüzenetre + az átirat VÁLASZKÉNT megy rá** | `discord.voice-acknowledge.spec.ts` — élő próbára vár a következő hangüzenetnél |

---

## Kapcsolódó

- `current/principles/task-tracking.md` — **a szabály** *(ez a fájl a nyilvántartás)*
- `current/principles/uncertain-requests.md` — a 🔍 állapot szabálya
- `__agent/CONTINUATION.md` — a **hogyan állunk** (állapot), ez a fájl a **mi van hátra**
- `__agent/capabilities/CATALOG.md` — a képességek és a jóváhagyásuk
- `current/open-questions.md` — a **kérdések**, amikre owner-válasz kell
| T-69 | 🤖 | ⚠️ **Két „feloldatlan" számláló, két jelentés — a szavak nem különböztetik meg** | 🔴 **MÉRT FÉLREÉRTÉS (saját, 2026-09-08 19:05):** a `ma stt pending` *„Feloldatlan hangüzenet: **nincs**"*-et írt, miközben a `ma comm doctor` ugyanabban a percben *„**1 hang vár** felismerésre (1/5)"*-öt. **Hibának néztem, és majdnem defektként jelentettem.** ⭐ Valójában **két külön szakasz**: a **retry-sor** = még próbálkozunk · a **ledger** = már **feladtuk**, és a hang megőrizve vár kézi feloldásra. A `recordFailed` szándékosan **a feladás pillanatában** fut (`discord.listener.ts:229`). | 🤖 **A kód helyes, a SZÓHASZNÁLAT nem.** A „feloldatlan" mindkettőre igaz ⇒ a `pending` mondja ki a szakaszt: *„feladott, kézi feloldásra vár: 0 — de a sorban még próbálkozunk 1 hanggal"*. ⚠️ Ha engem félrevezetett, az ownert is félre fogja |
| T-70 | 🤖 | 📋 **A `ma stt` hiányzik a `ma --help` csoportlistájából** | A parancs **működik** *(`main.ts:145` + `203`, dist-ben ott van)*, de a `ma --help` **Groups** felsorolása nem említi ⇒ aki nem tudja, hogy létezik, **nem fogja megtalálni**. ⭐ Épp az a parancs, amit az owner a hangüzenetei visszanyerésére kért | 🤖 egysoros kiegészítés a súgó-csoportlistában + teszt, ami a **regisztrált** csoportokat a **súgóval** veti össze *(különben újra elcsúszik)* |
| T-71 | 🤝 | 🗂️ **AZ ADATOK RENDBE TÉTELE — az owner szerint fő prioritás** | 🎙️ **Owner hangüzenet, 2026-09-08 21:32 (gépi átirat):** *„az egyik fő feladatunk, fő prioritásunk … hogy **rendezzük az adatokat, priorizáljuk őket**. Ezzel [együtt], hogy **melyik kié, melyik kié, melyik közös**. Általában hogyan kell ezeket kezelni, és **megtaláljuk az összes feladatot** … **Beállítsuk az ismétlődéseket**."* ⭐ **LELTÁR KÉSZ** (`__documentations/developments/2026-09-08-organizer-task-inventory.md`): **140 nyitott** + 19 lezárt · **129/140 dátum nélkül (92 %)** · **5 ismétlődő** · 4 duplikátum · **140/140 egyetlen `path`-ban** ⇒ a „melyik kié" kérdésre az adatban **nincs válasz**. 🔗 Megmagyarázza a matrac-rejtélyt: az ismétlődés **lezáráskor** képződik, a lezárási arány **12 %**. | ⏸️ **C-13 owner-kapu** — a gazda-jelöléshez az ő feladataihoz kell nyúlnom. Sorrend: (1) gazda-jelölés · (2) duplikátumok · (3) ismétlődések · (4) dátum vagy tudatos „nincs dátum" |
| T-72 | 🤖 | 🔴 **A lapozatlan lekérdezés NÉMÁN a 7 %-ot adja** | **Mérve 2026-09-08 21:38:** `fo tasks.list` **10 tételt** adott vissza a **140**-ből — ⛔ **hibajelzés nélkül**. Ha nem tűnik fel, minden rá épülő állítás *(„ennyi feladatod van", „ez a legfontosabb")* **hamis**, és **igaznak látszik**. ⚠️ Ugyanaz a hibaosztály, mint a `tail`-lel olvasott `AGENT_BUS` és a csonkolt `CONTINUATION.md`: **a részleges adat nem néz ki részlegesnek**. | 🤖 A `stocks` modul már megoldotta *(„complete paginated local snapshot")* ⇒ **ugyanaz a minta** kell a `tasks`-ra: egy lapozó segéd, amit minden leltár használ. ⛔ Kézzel lapozni nem szabály, csak jószándék |
| T-73 | 🙋 | 💼 **LinkedIn — a kész posztok kiposztolása** | 🎙️ **Owner, 2026-09-09 00:18 (hangcsatorna):** *„van egy sor LinkedIn poszt, amit elkészítettem, de nem posztoltam még. **Ne feledkezzek róla.**"* ⇒ ⛔ **az ÖVÉ** — az én dolgom, hogy **ne felejtődjön el** | 🙋 owner-feladat · 🤖 én: emlékeztetés + nyilvántartás |
| T-74 | 🤝 | 💬 **LinkedIn — a várakozó válaszok megírása** | 🎙️ **Owner 00:18:** *„kurva sokan várnak LinkedIn-en, hogy válaszoljak nekik."* + *„Azokban majd **segítened kell**, majd az **eszközt még ki kell faszázni** hozzá. Elméletileg már nagyjából kész, de még nem százas."* ⇒ **közös**: a válasz az övé, az eszköz az enyém | 🤖 a `linkedin` CLI + workspace befejezése *(hyperplan létezik)* · ⏸️ a válaszok tartalma owner-döntés |
| T-75 | 🙋 | 🔊 **Voice-to-voice fejlesztés a CCAP rendszerén belül** | 🎙️ **Owner 00:19:** *„ez az én feladatomnak írjuk fel itt a **voice-to-voice fejlesztésnek a megkezdését a CCAP rendszerén belül**."* Kapcsolódó: *„kéne az Eleven Labs upgrade, hogy tudjál válaszolni itt a Voice Channel-be. **Ez lenne az igazán hatalmas improvement.**"* | 🙋 ⛔ **az ÖVÉ, a CCAP-ban** — ⛔ nekem a CCAP-hoz nincs hatásköröm. Az én oldalamon a **T-59** (felolvasás) várja az ElevenLabs kulcsot |
| T-76 | 🤖 | 🔀 **A visszanyert hangüzenet SORRENDJE félrevezet** | 🎙️ **Owner, 2026-09-10 18:08:** *„nagyon érdekes, hogy egy utólagos feldolgozással sikerült feldolgoznod az első üzenetemet, viszont **így nem lesz jó a sorrend**"* — ⭐ **élő eset:** a 18:05-ös üzenete 18:07:53-kor került a kötegbe, tehát a **későbbi** üzenetei UTÁN. ⇒ Aki olvassa *(én)*, **rossz sorrendben** érti meg a gondolatmenetét | 🤖 A visszanyert átirat kapjon **jelölést** *(pl. „⏪ visszamenőleg feloldva — eredetileg 18:05")*, és a köteg **eredeti idő szerint** rendezzen. ⛔ Csendben beszúrni a végére a legrosszabb: úgy néz ki, mintha most mondta volna |
| T-77 | 🙋 | 🔊 **ÚJ hang kell a felvétel INDULÁSÁHOZ — „start listening"** | ⭐ **Owner pontosított (2026-09-10 18:22, gépelve):** *„a whoosh egy **»elküldve« hang** (STT indul), nem a voice felvétel indul hang. A voice felvétel indul hanghoz lehet, hogy még kell egy **új rövid, »start listening«** hang…"* ⇒ ✅ A `whoosh` a helyén van *(STT-indulás)*; ami **HIÁNYZIK**, az a **felvétel-indulás** jelzése. ⚠️ A CCAP-ban **NEM volt** ilyen ⇒ ⛔ nincs mit reprodukálni, **újat kell szerezni** | 🙋 **owner-döntés:** honnan jöjjön a hang *(ElevenLabs-generálás? meglévő rövid fájl?)*. ⛔ Nem választok helyette — a hangjelentések az övéi. 📌 Az ő kritériuma: **rövid** |
| T-78 | 🤖 | 🛒 **Lidl + Aldi rendelés — új képesség** | **Owner, 2026-09-10 19:58:** *„Vegyük fel feladatnak azt is, hogy majd a **Lidl meg Aldi rendeléseket** is kéne tudja majd csinálni."* ⏳ A *„majd"* miatt **nem sürgős** — de a mintája **adott**: a Tesco-kosár és az Interfood már megvan. ⚠️ A Tesco-runbook hard rule-jai *(kanonikus DOM-azonosító · bizonytalanságnál owner-kapu · per-effect visszaolvasás · vak retry TILOS · végső ID-halmaz + darabszám audit · a checkout külön jóváhagyási határ)* **erre is érvényesek lesznek** | 🤖 én · ⏸️ **nincs kitűzve** — a `CATALOG.md`-ba is felveendő ⏳-ként |
| T-79 | 🤝 | 🎵 **Az ELSŐ album ÚJRA-feltöltése — halkan került fel** | 🔴 **Owner, 2026-09-10 20:32:** *„nem jól raktam föl az első albumot, **nem lettek normalizálva a számok**, így **halkan került föl az összes szám**, és az **egész albumot újra fel kéne tölteni** majd."* ⇒ Minden hallgatónál halkabb, mint a többi zene — ez **hallgatót veszít**. | 🙋 a feltöltés az övé *(DistroKid)* · 🤖 én: nyilvántartás + emlékeztetés. ⏸️ Nincs kitűzve |
| T-80 | 🤝 | 🎵 **A ZENEI dokumentáció áthozása az FDP-ből** | **Owner ugyanott:** *„lehet, hogy **az FDP dokumentációkból majd át kéne tenni ide a My Assistantba** ezekhez a zenékhez tartozó dolgokat, mert **ez kevésbé FDP sztori**."* ⭐ Kezdet: `current/music-project.md` | 🤖 én — de ⏸️ **kell tőle**, hogy hol vannak az FDP-oldali doksik |
| T-76 | 🤖 | 🛰️ **Fő rendszerek félórás elérhetőség-figyelése** | **✅ Megépült és élőben igazolt 2026-09-09:** hibrid Overseer-first, hét külön állapot; a két szerver közvetlen TCP-próba, tartós snapshot + `/api/healthz.services` + konzolpulzus + állapotváltási napló. | ✅ server 105/105 · healthz + fájl + pulzus readback zöld; C-49 használati jóváhagyása külön owner-kapu |

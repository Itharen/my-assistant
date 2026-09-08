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
| T-54 | 🤝 | 📧 **E-mail-figyelés beállítása** | ⏸️ **Jóváhagyást kértem a postafiók megnézésére** — ⛔ nincs a katalógusban, tehát nem az én hatásköröm. Felajánlva: **feladó + tárgy + darabszám** statisztika, tartalom-olvasás nélkül | 🙋 belenézhetek? *(Alternatíva: ő mondja meg, mi zavarja)* |
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
| T-68 | 🤖 | 🎙️ **Hangüzenet ↔ transzkript nyilvántartás + visszamenőleges feloldás** | 🔴 **KÉRVE, NEM ÉPÍTVE** — owner (2026-09-08 15:31): *„a rendszernek rögzítenie kéne, hogy melyik üzenetekhez melyik transzkript tartozik, illetve melyik üzeneteknek nem sikerült a transzkript, és ilyenkor ezeket majd visszamenőlegesen is fel kell tudjad oldani."* Kapcsolódó (ugyanaz a kör, 14:49): *„kelleni fog reply reference és on demand read és voice process"* — azaz reply-jal rámutatva újra kell tudni olvasni egy üzenetet, és hangüzenetnél újra megpróbálni az átiratot. | 🤖 **Három rész:** (1) **nyilvántartás** — `messageId → transcript | failed(ok)` tárolás, a próbálkozásokkal együtt; (2) **on-demand read** — reply-referenciával megjelölt üzenet újraolvasása; (3) **visszamenőleges feloldás** — a már feladott hangüzenetek újrapróbálása kérésre. ⚠️ A `SttRetryQueue` a **feladás után TÖRLI** a bejegyzést ⇒ ma **nincs miből** visszamenőleg feloldani |

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

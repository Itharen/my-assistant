# 🎛️ PROCESS-CONTROL — hang-csatorna megbízhatóság (+ LinkedIn profil-felület)

> 🔴 **NO-CACHE belépési pont.** Minden ébredéskor **frissen** olvasandó.
> **Feladat-leírások:** `__agent/DEV-HANDOFF.md` *(a 2026-09-11 01:20 / 01:24 / 01:30 / 01:33 /
> 01:55 / 02:00-as szakaszok)* — ⛔ a tartalmuk **nem másolódik ide**, itt csak az **állapot**
> és a **sorrend** van.
> **Ez a fájl az enyém (DEV).** A `DEV-HANDOFF.md` az asszisztensé — ⛔ oda nem írok státuszt.

**Létrehozva:** 2026-09-11 02:05 · **Utoljára frissítve:** 2026-09-12 03:50

---

## 🎯 A CÉL ÉS A KÉSZ DEFINÍCIÓJA

**Egy mondatban:** amit az owner mond, az **ne veszhessen el**, és amit én mondok, az
**hiánytalanul és egyszerre-beszélés nélkül** hangozzon el.

**Kész, ha** mindhárom igaz: **(1)** nulla veszteség *(sem hangban, sem átiratban)* ·
**(2)** minden veszteség/torlódás **látható** *(⛔ nincs néma számláló)* · **(3)** minden tételre
van automata teszt, és a `dc rev` **0 új találattal** fut a nyúlt fájlokon.

---

## 📊 TÉTELES STÁTUSZ

| # | Tétel | Forrás | Állapot | Dátum |
|---|---|---|---|---|
| **1** | 🎙️ **MEGŐRZÉS** — nyers hang + nyers átirat + látható veszteség | 02:00 + 01:33 (B) | ✅ **KÉSZ** — CLI 917/917, pozitív kontroll lefuttatva | 2026-09-11 02:32 |
| **2** | 🔢 **FIFO SOR** a felolvasásra | 01:33 (A) | ✅ **KÉSZ** — commit `0e0bd73`, CLI 935/935 | 2026-09-11 03:20 |
| **2b** | 🧹 **NAPLÓ-ÁRADÁS** *(élő ellenőrzésből jött elő)* | — | ✅ **KÉSZ** — a napló 95%-a zaj volt | 2026-09-11 03:30 |
| **3** | ✂️ **DARABOLÁS** csonkolás helyett | 01:30 | ✅ **KÉSZ** — CLI 956/956 | 2026-09-11 03:40 |
| **4** | 🔇 **SZÜNETELTETÉS**, amíg az owner beszél | 01:20 | ✅ **KÉSZ** — CLI 980/980 | 2026-09-11 04:00 |
| **5** | 🌐 **NYELV-ELTÉRÉS** *(a paraméter NEM létezik — mérve)* | 01:24 + 01:30 | ✅ **KÉSZ** — CLI 988/988 | 2026-09-11 04:15 |
| **6** | 🔗 **LinkedIn PROFIL-FRISSÍTŐ felület** | 01:55 | ✅ **KÉSZ** — CLI 1003 · szerver 106 · kliens 144 | 2026-09-11 04:18 |
| **7** | ⏳ **KÖTEG-KAPU** — ne menjen ki a csomag, amíg megszólalás van folyamatban | 02:30 + 8️⃣ | ✅ **KÉSZ** — CLI 1020/1020 | 2026-09-11 06:18 |
| **8** | 💬 Discord-lábléc *(válaszkényszer ↔ fókusz)* | 03:20 | 🙋 **AZ ASSZISZTENS CSINÁLTA MEG** — ⛔ nem az enyém | 2026-09-11 03:40 |
| **9** | 🔒 **BESZÉD-ÉSZLELÉS körbeírása + tesztekkel leszögezése** | 04:11 | ✅ **KÉSZ** — CLI 1049/1049, 28 leszögező teszt | 2026-09-11 07:10 |
| **10** | 🔗 **A PROFIL-PANEL ELÉRHETŐ a felületről** *(nav-link)* | 🔟 11:00 (A) | ✅ **KÉSZ** — kliens 148/148 | 2026-09-11 11:30 |
| **11** | 📝 **POSZT-FELÜLET** | 🔟 11:00 (B) | ✅ **ELKÉSZÜLT** — l. a **15.** tételt *(a tiltás 18:05-kor feloldva)* | 2026-09-11 18:30 |
| **12** | 🔍 **A „mindenféle hiba"** — FELTÁRANDÓ | 🔟 11:00 (C) | 🟡 **EGY HIBA REPRODUKÁLVA ÉS JAVÍTVA**; a többi 🙋 owner-kapun | 2026-09-11 11:30 |
| **13** | 🗓️ **MUNKANAPTÁR** — `ma calendar today` *(EGY funkció)* | 1️⃣1️⃣ 12:25 | ✅ **KÉSZ** — CLI 1075/1075, élő proba; 🙋 1 lépés owner-kapun *(újra-engedélyezés)* | 2026-09-11 12:55 |
| **14** | 🎙️ **A HOSSZÚ HANGÜZENET vége levágódott** *(bemeneti szűk keresztmetszet)* | 1️⃣2️⃣ 15:54 | ✅ **KÉSZ** — mérve: a felismerő **30 mp**-es ablaka; 295→641 kar, CLI 1120/1120 | 2026-09-11 16:38 |
| **15** | ✍️ **POSZT-PISZKOZAT PANEL** *(lista + másolható szövegdoboz)* | 1️⃣3️⃣ 18:05 | ✅ **KÉSZ** — nav-linkkel; CLI 1176 · szerver 115 · kliens 159; `dc rev` 2397→2397 | 2026-09-11 18:30 |
| **16** | 😴 **ÉBRENLÉT-DÖNTÉS mérésből** *(MP-5, a fix órarend cserélve)* | 1️⃣4️⃣ 00:10 | ✅ **KÉSZ** — 5 698 mintán mérve: a tipp **35-44%-ban** tévedett; CLI 1192 · szerver 119 | 2026-09-12 00:30 |
| **17** | 🎤 **BULI-ZAJ szűrés + nyitott-mikrofon szignál** | 1️⃣5️⃣ 03:05 | ✅ **KÉSZ** — 427 mintán visszamérve **0** magyar kiesés; CLI 1219 · `dc rev` 2404→2404 | 2026-09-12 03:50 |
| **18** | ⚠️ **ÉRTELMESSÉG-JELÖLÉS** — magyarnak HANGZÓ halandzsa *(jelöl, ⛔ nem dob el)* | 1️⃣8️⃣ 04:15 | ✅ **KÉSZ** — 279 átiraton **0** hamis jelölés; ⚠️ recall **2/6** kimondva; 🙋 2 owner-döntés | 2026-09-12 05:40 |
| **19** | ⏳ **A KISZŰRT ZAJ NEM NYÚJTJA A KÖTEG-ABLAKOT** | 1️⃣9️⃣ 04:32 | ✅ **KÉSZ** — mérve: a kapu **90,0 percig** zárva volt *(43%)*, ebből 90% puszta észlelésből; CLI 1231 · `dc rev` 2404→2404 | 2026-09-12 05:45 |
| **20** | 🔴 **A zajra is kiment a „VÉGLEG nem sikerült" riasztás** + ⚠️ **az értelmesség-őr hamis pozitívja** + ⏱️ **`ma doctor now`** | 2️⃣0️⃣ 05:35 | ✅ **KÉSZ** — a 169 riasztásból 43 zaj elmarad; a játék-üzenet 0,311→0,156; élő próba OK; CLI 1248 · `dc rev` 2404→**2397** | 2026-09-12 06:35 |
| **21** | 🧪 **A `doctor now` „utolsó hiba" sora TESZT-szemetet mutatott** | 2️⃣1️⃣ 09:05 | ✅ **KÉSZ** — mérve: 631 hibából 114 spec-fixtúra; bélyeg (`extra.testRun`) + temp-útvonal, a kihagyottak SZÁMA látszik; élő próba OK; CLI 1256 · `dc rev` 2397→2397 | 2026-09-12 09:20 |
| **22** | 📖 **Önreferencia** *(a saját krónikám lett az „utolsó hiba")* + 🔴 **a nyelt `parseLine` hiba** | 2️⃣2️⃣ 17:30 | ✅ **KÉSZ** — mérve: 4 131 hibából 146 krónika *(`claude`+`codex`)*, és a fordított szűrő 33 VALÓDI hibát vitt volna; a vak folt **1 sor / 119 869** (0,001%); CLI 1265 · `dc rev` 2397→2397 | 2026-09-12 17:55 |
| **23** | 📨 **Az „Átment N üzeneted" nyugta FÉLREVEZETETT** *(a szöveg, ⛔ nem az időzítés)* | 2️⃣3️⃣ 22:10 | ✅ **KÉSZ** — „megérkezett hozzám (N várakozás után)", a **legrégebbi** üzenet korából; 10 perc fölött kiemelve; CLI 1273 · `dc rev` 2397→2397 | 2026-09-12 22:40 |

### Miért EZ a sorrend — ⛔ nem önkényes

- **Az 1. az első**, mert az owner ezt nevezte meg *(„Miért ez a legfontosabb most")*, és mert
  a veszteség **visszafordíthatatlan**: amit ma eldobunk, azt holnap nem tudjuk megőrizni.
  ⭐ A handoff maga mondja, hogy a 02:00 **2. rétege** és a 01:33 **(B)** pontja *„egy megoldás
  fedi le a kettőt"* — ezért van egy tételben.
- **A 2. a 3. és a 4. ELŐTT**, mert mérve *(`voice-speaker.ts:85`)*: ha épp szól valami, a
  következő **`spoken: false`-szal elesik**. ⇒ Sor nélkül a darabolás a 2..N. darabot **azonnal
  eldobná** — pont az ellenkezője annak, amit a 01:30 kér.
- **A 6. a végén**, mert **más domain** *(`one-function-is-enough`)* és semmi nem blokkol rá.
- 🔴 **A 7. ELŐRE KERÜLT** *(az owner utasítására)*: élesben **kétszer** ártott *(02:28, majd
  03:27 — „még én beszélek, a csomag nem megy át")*. Az owner **mondat közben** kap választ, és
  **elveszti a fonalat**. ⇒ Súlyosabb, mint a kényelmi tételek.
- **A 9. a hang-vonal után, de minden további hang-munka ELŐTT** — mert az egész hang-lánc
  **ezen áll**, és ma **0 spec** védi.
- 🔴 **A 10. AZONNAL**, mert **nulla kódot** igényel a panelen: a funkció **kész volt**, csak
  **nem volt rá út**. ⇒ A legnagyobb haszon a legkisebb változásért.
- **A 11. a 10. UTÁN**, az owner kimondott sorrendje szerint: **profil → posztok → üzenetek**.
- **A 12. owner-kapun** áll: ⛔ nem javítok olyat, amit **nem reprodukáltam**
  *(`uncertain-requests`)*.

### 🔴 A TANULSÁG A 10. TÉTELBŐL — „kész a tervben, nem létezik a felületen"

A profil-panel **megépült, tesztelve, commitolva** — és az owner **nem találta meg**, mert a
menüben **nem volt rá link**. ⚠️ A tervem szerint a 6. tétel **kész** volt; a valóságban a
funkció **elérhetetlen**.

⇒ **Új kilépési feltétel minden felület-tételhez:** *„eljut-e hozzá **kattintással**, ⛔ nem
URL-begépeléssel?"* — és erre **teszt** is kell, mert ez a hibafajta **csendes**: a route él, a
komponens fordul, a teszt zöld, és a funkció mégis **nem létezik** a használó számára.

### ⭐ A SZABÁLY, AMI EBBŐL LETT — a 8️⃣-as szakasz tanulsága

**Minden handoff-szakaszt fel kell venni EBBE a táblába** — akkor is, ha kicsi, akkor is, ha
„majd jön". 🔴 A 7. tétel *(02:30)* ott volt a handoffban, de **itt nem** ⇒ a hatos listám
**nem fedte le**, tehát **némán kimaradt volna**. ⚠️ Ez a veszélyesebb hibafajta: nem elromlott,
hanem **nem is volt nyilvántartva**. ⇒ *Amit nem veszek fel ide, az nem létezik.*

---

## 🔁 CIKLUS-PROTOKOLL — mi EGY kör

```
1. FAM rule-fetch (a trigger kéri)  ->  ezt a fájlt FRISSEN beolvasni
2. a STÁTUSZ szerinti ELSŐ "⏳ SORON" tétel — EGY tétel, ⛔ nem kettő
3. MÉRÉS előbb: a jelenlegi viselkedést igazolni, ⛔ nem feltételezni
4. tiszta-döntés modul + teszt  ->  bekötés  ->  `npx tsc --noEmit` + jasmine
5. `dc rev` a nyúlt fájlokra — 0 új találatig
6. commit (explicit fájllista) + push  ->  EZT A FÁJLT frissíteni (dátummal)
7. ScheduleWakeup, ha van még "⬜ hátra"; ha nincs: AGENT_BUS-jelentés, ⛔ nincs új ébredés
```

### ⛔ KEMÉNY KORLÁTOK *(a teljes lista a `DEV-HANDOFF.md` 1. és 5. szakaszában)*

- ⛔ Egyetlen tesztet, ellenőrzést, review-t **sem** kapcsolok ki. *(Owner: „NEEE!")*
- ⛔ **Nem írok az ownernek** — minden owner-kommunikáció az asszisztensé.
- ⛔ Az átemelt CCAP-fához *(`cli/src/_modules`, `_collections`, `_enums`)* **nem nyúlok**.
- ⛔ `git add -A` / `git add .` **soha** — megosztott worktree, explicit fájllista.
- 🔒 Hangfelvétel + átirat = **személyes adat** ⇒ gitignore-olt lokál tár, ⛔ nem a repó.
- ⛔ `git stash` tilos · ⛔ nincs polling/háttér-figyelő · ⛔ a `Monitor` eszközt nem hívom.

---

## ⚠️ MÉRT ESZKÖZ-BUKTATÓK *(hogy ne fussak bele újra)*

| Buktató | Mit tegyek |
|---|---|
| `npm test` a CLI-ben `rimraf ./dist`-tel kezd | megosztott workspace-ben egy párhuzamos build kihúzhatja a `dist`-et a jasmine alól ⇒ **külön** `npm run build-base`, majd `npx jasmine` |
| python heredoc + UTF-8 | `PYTHONUTF8=1` **kötelező**, különben cp1250-ben olvas és az ékezetes horgony nem talál |
| fájl-írás pythonból | temp-fájl + `os.replace`, ⛔ soha `open(p,'w')` közvetlenül *(mérve: egy spec 0 bájtra csonkult)* |
| commit-üzenet backtickkel | `git commit -F <fájl>`, ⛔ nem `-m` |
| megosztott markdown *(`AGENT_BUS.md`)* | **mtime-őr** a `read → ír` köré |

---

## ✅ 1. TÉTEL — MI KÉSZÜLT EL (2026-09-11 02:32)

**A mért gyökér:** a `handleFinishedRecording` *bizonytalan* ágán *(`result.ok &&
result.suspicious`)* **semmi nem hívódott** — a WAV-ot az átemelt felvevő takarítása törli, a
nyers átirat pedig a `detail` szövegén kívül nem maradt meg sehol. ⇒ Nem a felismerés volt a
hibás, hanem **az eldobás**.

| réteg | hol |
|---|---|
| 1. a nyers HANG, a felismerés **előtt** | `voice-utterance-archive.ts` → `keep()` · bekötve: `discord.listener.ts` → `archiveUtterance` |
| 2. a nyers ÁTIRAT, bizonytalanságnál is | `annotate()` *(`status: 'uncertain'`)* · bekötve: `annotateUtterance` |
| 3. a veszteség LÁTHATÓ | `voice-missed-speech.ts` → `composeHeardLines` *(mit értettem + miért bizonytalan)* |

⭐ **Pozitív kontroll lefuttatva:** a megőrzés-hívást kivéve **pontosan a két helyes teszt**
bukott *(sorrend + bizonytalan ág)*; visszaállítva újra zöld.

⚠️ **Review-adósság, amit a változás okozott és amit MEGJAVÍTOTTAM:** két `max-file-lines`
*(recorder 450→504, spec 424→546)*. ⛔ A szabály nem lett kikapcsolva — **bontottam**:
`voice-recording-outcome.ts` *(a kimenetel-szókincs, 4 fogyasztóval)* és
`voice-channel-recorder.preservation.spec.ts`. A recorder most **420** sor.
⭐ Ráadás: a beinjektált fájl-olvasó szerződése leszűkült arra, amit tényleg használunk ⇒ a hamis
olvasónak **többé nincs szüksége `as` átcímkézésre**.

**Repo-szintű review-találat: 2393 → 2388.** Az új fájljaimon **1** marad
*(`one-export-per-file` a típus-szókincsen — ugyanaz a kódbázis-szintű minta, ami a szomszéd
voice-modulokon is áll; AGB-2026-09-09-01 szerint owner-kapus)*.

🔀 **ÜTKÖZÉS — MÁSODSZOR:** a munkám az **asszisztens session** `9d3ff7d` *(„fix(stt): MASODIK
izlandi hallucinacio…")* commitjába került be, mert megosztott worktree-ben `-A`-szerűen
stage-elt, amíg az én fájljaim staged-ek voltak. ✅ **A tartalom helyes és HEAD-ben van**, a
tesztek zöldek, fel van tolva — csak a commit-üzenet félrevezető. *(Az első eset: `be95eb6`.)*
⛔ `shared-file-collision.md`: csak a **saját** káromat vonom vissza — itt semmi nem sérült.

---

## ✅ 2. TÉTEL — FIFO SOR (2026-09-11 03:20, commit `0e0bd73`)

**A mért gyökér:** a `speakInVoiceChannel` a `player.play()` **után azonnal visszatér**, tehát a
figyelő `await`-je csak az **indítást** várta meg. A második üzenet nem-`Idle` lejátszóba futott,
és — helyesen — `spoken: false`-szal visszalépett. ⇒ **Semmi nem sorosított.**

| fájl | mi |
|---|---|
| `voice-speech-queue.ts` | FIFO sor: sorrend · nulla veszteség · **csoport** · `hold()`/`release()` · torlódás-jelzés |
| `voice-playback-idle.ts` | a lejátszás **végének** kivárása *(`entersState`, esemény-alapon)*, 180 s felső korláttal |

⭐ **A csoport-garancia a 3. tétel előfeltétele:** egy üzenet N darabja **egyben** marad, közéjük
más üzenet ⛔ nem ékelődhet.
⭐ **A `hold()`/`release()` a 4. tétel alapja** — a jelforrás *(mikor beszél az owner)* még hátra van.

🔴 **SAJÁT HIBA, amit a tervezés közben kaptam el:** a `shift()` először **feltétel nélkül**
futott ⇒ egy **tartás** közben félbehagyott üzenet maradék darabjai **elveszhettek** volna —
pont az a veszteség, amit a sor megszüntet. Most csak a **befejezett** tétel kerül ki, és
teszt állítja.

## ✅ 2b. TÉTEL — A NAPLÓ-ÁRADÁS *(⚠️ ezt az ÉLŐ ellenőrzés hozta elő, nem a terv)*

```
a mai akció-napló ....................... 67 408 sor · 14 967 KB
ebből „ezt már felolvastuk" kihagyás .... 64 088 sor  (95%)
az előző nap ............................  5 298 KB
```

**A gyökér:** az `fs.watch` minden eseményére a figyelő újraolvassa a **teljes** naplót, és
minden korábbi bejegyzésre kiírt egy kihagyás-jegyzetet ⇒ `bejegyzések × események`. A `spoken`
halmaz a **felolvasást** helyesen megakadályozta — a **naplózást** nem.

⚠️ **Miért súlyos:** az akció-napló **végtelen retentionnal commitolva** van *(owner-szabály)*
⇒ a zaj **véglegesen** a repóban marad; és a 95%-os zaj **eltemeti a valódi jelzéseket**.

**A javítás:** a tiszta döntés megjelöli a **rutin** kimenetelt *(`routine: true`)*, a figyelő
csak a **nem-rutin** kihagyást naplózza. ⛔ Ez **nem elhallgatás**: a *magyarázó* okok
*(nincs bent · nyugta · nincs kimondható tartalom)* változatlanul naplózódnak.
⛔ A **már meglévő 15 MB-hoz nem nyúltam** — az akció-napló append-only; a tisztítás owner-döntés.

### ⭐ ÉLŐ IGAZOLÁS ugyanebből az ellenőrzésből

Az **1. tétel MŰKÖDIK élesben:** **36 ×** `MA-VOICE-UTTERANCE-KEPT` ma, a legutóbbi
**03:20:15**-kor. ⇒ A megőrzés nem csak tesztben — a lemezen is.

🔀 **ÜTKÖZÉS — HARMADSZOR:** a napló-javítás az asszisztens session `148b927`
*(„feat(handoff): a Discord-valaszkenyszer felteteles legyen…")* commitjába került.
✅ Tartalom helyes, HEAD-ben, pusholva, 939/939 zöld. *(Előzmények: `be95eb6`, `9d3ff7d`.)*
⇒ **A minta már nem véletlen** — jelentem az AGENT_BUS-ban a hurok lezárásakor.

---

## ✅ 3. TÉTEL — DARABOLÁS (2026-09-11 03:40)

### ⚠️ A MÉRÉSEM KORRIGÁLJA A FELADAT-LEÍRÁST

A handoff a **nyers** üzenet-hosszokat idézte *(„1441 karakter, több mint a fele elveszett")*.
A csonkolás viszont a **már kimondhatóvá alakított** szövegen történt, amiből a
`prepareSpeechText` előbb kiveszi a táblázatokat, kód-blokkokat, emojikat, URL-eket.

**A valódi adat a 444 kimenő üzenetből *(mérve 03:26)*:**

| mérés | érték |
|---|---|
| kimondható üzenet | 221 |
| a 700 karakteres határ **fölött** | **14** *(6%)* |
| a leghosszabb **kimondható** szöveg | **717** karakter |
| összes elvesző karakter | **112** |
| a legnagyobb veszteség EGY üzeneten | **17** karakter *(2%)* |

⇒ A veszteség **valódi, de jóval kisebb**, mint a feladat feltételezte.
⭐ A kérés ettől **változatlanul érvényes**: **(a)** 112 karakter is veszteség; **(b)** a
**mechanizmus** rossz — a néma csonkolás holnap, egy hosszabb üzenetnél, sokkal többet vinne el,
és **ugyanúgy némán**. *(Ezt jelentem az AGENT_BUS-ban, hogy a szám ne maradjon félreértve.)*

### Mi készült

| fájl | mi |
|---|---|
| `voice-speech-split.ts` *(új)* | `split` · `describeParts` · `toSpokenParts` — mondathatár → szóhatár → ⛔ szó közepén soha |
| `voice-speech-text.ts` | ⛔ **a csonkolás KIVÉVE** — a függvény mostantól **csak fordít** |
| `voice-speech-text.spec.ts` | a csonkolás-tesztek **átírva** a nem-csonkolásra *(⛔ nem törölve — a feladat kikötése)* |
| `discord.listener.ts` | a darabok **egyetlen** sor-tételként mennek be ⇒ más üzenet ⛔ nem ékelődhet közéjük |

⭐ **A `SPEECH_MAX_CHARS` jelentése megváltozott:** mostantól a **darab** mérete, ⛔ nem a teljes
szövegé — pontosan ahogy a feladat kéri.

⭐ **Pozitív kontroll:** visszatettem a csonkolást ⇒ **8 teszt** bukott a 17-ből *(köztük a
karakterre pontos „nulla veszteség")*; visszaállítva újra zöld.

---

## ✅ 4. TÉTEL — SZÜNETELTETÉS (2026-09-11 04:00)

### 🔴 A MÉRÉS, AMI A TERVET ELDÖNTÖTTE — a handoff kikötése volt

*„saját magamra ne süljön el — ezt **méréssel** zárd ki, ne feltételezéssel."*

**43** sikeres felolvasás, **213** megszólalás-észlelés. A felolvasás utáni **első** észlelés
késése *(23 esetben)*:

```
23 · 32 · 34 · 37 · 38 · 38 · 39 · 40 · 40 · 42 · 43 · 45 · 45 · 47 · 49 · 50 · 50 · 51 · 60  mp
                                                        ↑ az owner válaszol
0,0 · 1,0 · 2,0 · 3,0  mp   ← 🔴 VISSZHANG-ALÁÍRÁS
```

⇒ **Négy észlelés 0-3 másodperccel a saját hangom után.** Ember nem kezd beszélni 0,0
másodperccel az én hangom után ⇒ nyitott mikrofon + hangszóró mellett a **saját felolvasásom
visszajön** az ő megszólalásaként.

⚠️ **A szerkezeti szűrő ezt NEM fogja meg:** a `receiver.speaking` az ő **Discord-azonosítóján**
jön, tehát nem a botot látjuk — hanem **az ő mikrofonját, amibe az én hangom szól bele**.

### ⭐ MIÉRT NEM LEHET EBBŐL VÉGTELEN SZÜNET

1. 🔴 **A SZÜNET MEGSZÜNTETI A VISSZHANG FORRÁSÁT** — az én hangom elhallgat ⇒ nincs több
   visszhang ⇒ a türelmi idő letelik ⇒ folytatjuk. A rendszer **önjavító**; a legrosszabb eset
   egy ~2,5 s akadás.
2. **A feloldás IDŐ-alapú**, ⛔ nem egy *„elhallgatott"* jelre vár, ami elmaradhat.

⛔ **Ezért NEM tiltottam le a lejátszás alatti észlelést:** az pont a félbeszakíthatóságot
szüntetné meg, amit az owner kért. ⚠️ Helyette **minden tartás és feloldás naplóba kerül a
késéssel** — ha akadás-hurok alakul ki, az a naplóból azonnal látszik.

### Mi készült

| fájl | mi |
|---|---|
| `voice-speech-hold.ts` | a szüneteltető: azonnali tartás · **minden** megszólalás újraindítja a türelmi időt · idő-alapú feloldás · a leállítás **feloldja** a tartást |
| `voice-speech-grace.ts` | a türelmi idő — **paraméter**, ⛔ nem beégetve; alapérték **2,5 s** *(a kért 2-3 s sáv közepe)*; ⭐ **ugyanabban a könyvtárban**, mint a hangerő |
| `voice-number-setting.ts` | a közös beállítás-mechanika *(a review `code-duplication` találatára)* |
| `discord.listener.ts` | a **meglévő** jelforrásra kötve *(`onSpeechAttempt`)* — ⛔ nem építettem másikat |

⭐ **Pozitív kontroll:** kiiktattam a türelmi idő újraindítását és a leállítás-feloldást ⇒
**3 teszt** bukott; visszaállítva újra zöld.

⚠️ **Review:** 5 új találatból **2 maradt** *(mindkettő a már ismert, owner-kapus
`one-export-per-file` illetve `no-as-cast` a típus-szókincsen)*. Közben megjavítva: a
duplikáció *(közös util)*, két `no-as-cast` *(az időzítő-fogantyú **maga hordozza** a
lemondását)*, és a bracket-hozzáférés.

🙋 **AMI OWNER-KAPUN ÁLL ehhez a tételhez:** a türelmi idő **CLI + szerver + kliens** felülete
*(a hangerőnél ez a három megvan)*. Most fájlból és env-változóból állítható — ⭐ a **működés
kész**, a **három felület** külön kör. ⛔ Nem toltam mellé *(`one-function-is-enough`)*.

---

## ✅ 5. TÉTEL — NYELV-ELTÉRÉS (2026-09-11 04:15)

### 🔴 A KÉRT PARAMÉTER NEM LÉTEZIK — mérve, nem feltételezve

A feladat: *„Ha az API támogat explicit `language` paramétert, azt kell átadni."* ⇒ Megmértem.
Ugyanazt a **megőrzött** felvételt *(⭐ az 1. tétel munkája!)* kétszer küldtem be:

```
language paraméter NÉLKÜL  →  { "text": "Thanks." }
?language=hu               →  { "text": "Thanks." }     ← BETŰRE UGYANAZ
```

⇒ Az FDP AI `/api/recognition` a paramétert **elfogadja, de figyelmen kívül hagyja**, és a
közzétett végpont-lista sem említi. ⛔ **Nem elfelejtettük átadni — nincs mit átadni.**
*(⛔ Az FDP AI szolgáltatáshoz nem nyúltunk: `fdp-ai-never-restart`.)*

⭐ **Ráadás-lelet:** a magyar felvétel **„Thanks."**-re fordult — vagyis a hiba **reprodukálható
a megőrzött hangon**. Enélkül csak az owner beszámolója lett volna.

### ⚠️ AMIT ELSŐRE ROSSZUL TERVEZTEM — és a mérés megfogta

Az 56 megőrzött átiratból **13** nem tartalmazott magyar ékezetet, és mind a 13 bukott
felismerés volt. ⇒ Kézenfekvőnek tűnt az *„ékezet-hiány = gyanús"* szabály.

🔴 **De az „Igen." és a „Nem." is ékezet nélküli** — és azok az owner **legfontosabb válaszai**.
Egy ilyen szabály a **jóváhagyását** dobta volna el. *(A kód ezt a csapdát már ismerte: az
„igen"/„ok" **szándékosan** nincs a filler-listán, és egy teszt védi. ⛔ Nem írtam felül.)*

### A megoldás: magyarban NEM LÉTEZŐ betűk — EGY szabály

*(A feladat kikötése: „⛔ ne építs köré nagy detektálás-logikát.")*

| mérés | eredmény |
|---|---|
| a 10 ismert bukás a mért adatból | **10/10 elkapva** *(előtte 5/10)* |
| valódi magyar üzenetek megjelölve | **0** |
| a 46 „magyarnak látszó" átiratból megjelölve | 2 — ⭐ **mindkettő ISLANDI** *(csak az á/í/ó miatt látszottak magyarnak)* |

⇒ **Zero valódi hamis pozitív.** Az izlandi (þ ð æ), lengyel (ę ł ż), cseh, román, német,
északi, török és **minden nem-latin írás** *(cirill · görög · héber · arab · CJK · kana)*
megjelölve; az angol *(Hunglish)* ⛔ érintetlen, mert az angol sem használ ilyen betűt.

⭐ **Pozitív kontroll:** a regexet soha-nem-találóra állítottam ⇒ **3 teszt** bukott. ⚠️ Az
első sabotage-kísérletet *(`if (false && foreign)`)* maga a **fordító** utasította el
*(strict-null)* — ez is védelem.

---

## ✅ 6. TÉTEL — LinkedIn PROFIL-FRISSÍTŐ FELÜLET (2026-09-11 04:18)

**A korlát:** a LinkedIn API **csak olvas** ⇒ a profilt nem írjuk át. ⇒ A cél a
**súrlódás-mentes átvitel**, pontosan a kért négy tulajdonsággal:

| kért | megvan |
|---|---|
| mezőnként a mostani és a javasolt szöveg **egymás mellett** | ✅ két hasáb *(szűk kijelzőn egymás alá)* |
| **egy gomb = egy mező** vágólapra | ✅ ⛔ nincs nagy blob |
| karakterszám + **LinkedIn-limit** mezőnként | ✅ *(headline 220 · about 2600)*, túllógásnál piros |
| **„beillesztettem" pipa** mezőnként | ✅ a szerveren tárolva ⇒ félbeszakítás után is megmarad |

**Három réteg:** `linkedin-profile-fields.ts` *(CLI — a döntés, 15 teszt)* ·
`linkedin-profile.{controller,data-service}.ts` *(szerver)* · `l-profile-update` *(kliens, 8 teszt)*.
⭐ **SSOT:** a limitek és a „kész"-fogalom a **CLI**-ben vannak; a szerver és a kliens ⛔ nem
másolja őket.

⚠️ **A javaslat hiánya NEM hiba:** a panel **kimondja**, hogy az asszisztens még nem írta meg
*(⛔ nem néz ki üresen elromlottnak)*. A szöveget `current/linkedin/profile-proposed.json`-ba
kell írni — **az asszisztens dolga**, ⛔ nem a DEV-é.

### ⚠️ Review: 23 → 4 — és mi az a 4

Sokat találtam, mert **régebbi mintákat** másoltam, amiket a review azóta szigorított.
**Megjavítva:** `@if`/`@for` a struktúr-direktívák helyett · `computed` signalok a
sablon-metódusok helyett · `_$` utótag · nem-`async` `ngOnInit` · a komponens az
**adat-szolgáltatón** át megy *(⛔ nem az API-n)* · hiba-becsomagolás `DyFM_Error`-ral ·
a néma `catch` jelent · sor-hossz · osztálynév-egyezés · **minden `as` átcímkézés kivéve**
*(szűk szerződés + explicit DI-token)*.

⭐ **Ismét bejött a MÉRT csapda:** az `*ngIf` találat **a saját kommentemre** illeszkedett —
ugyanaz, mint korábban a `no-native-browser-dialogs`-nál. Átfogalmazva.

🙋 **A maradék 4 — mind DOKUMENTÁLT döntés, ⛔ egyik sincs elhallgatva:**

1-2. **`endpoint-auth-preprocess` ×2** + 3. **`thin-controller`**: a LinkedIn-felület
**szándékosan loopback-alapú** *(saját guard + saját teszt védi, és a 4 szomszéd végpont is
így működik)*. ⛔ Nem tettem rá csak-ide-token-autht: ha a kliens nem küld tokent, a panel
**némán elhallgatna** — pontosan az a hibafajta, amit ebben a körben máshol javítottam.
⇒ **Az auth-modell owner-döntés.**
4. **`no-dynamic-imports`**: ⭐ **MÉRT kényszer** — a `@cli/*` alias csak fordítási időben
létezik, a `tsx` futásidőben nem oldja fel. Statikus importtal a szerver **nem indulna**;
ezt a Google- és Spotify-panel élesben már megfizette. *(Ugyanaz, mint a hangerő-útvonalon.)*

---

## ✅ 7. TÉTEL — A KÖTEG-KAPU (2026-09-11 06:18)

> **Owner, 2026-09-11 03:27 — élesben, MÁSODSZOR:** *„Na, baszd meg, **még én beszélek**, a
> csomó[g] nem megy át."*

### 🔴 A MÉRT RÉS

A `decideFlush()` **hat** kaput ismert: üres köteg · `isBusyProcessing` · `queuedItemCount` ·
`isQueueLocked` · elcsendesedési ablak · `maxHoldMs` szelep.
⛔ *„Folyamatban lévő megszólalás"* kapu **soha nem volt** *(az asszisztens mérése 06:04-kor
igazolta: nem elveszett kód, hanem **megíratlan**)*.

⇒ A csend-ablak **akkor is letelhetett**, amikor az owner **épp beszélt**.

### ⭐ A MÉRÉS, AMIBŐL AZ ABLAK-MÉRET JÖTT — ⛔ nem tipp

A handoff kikötése: *„⛔ Ne tippelj: a `voice-funnel` adataiból **mérd meg**."*
**260** értékelhető szünet két megszólalás-kezdet között:

| mérés | érték |
|---|---|
| median | **8 s** |
| p75 | **23 s** |
| p90 | 97 s |
| 20 s alatti szünet | 184/260 — **71%** |
| 30 s alatti szünet | 204/260 — **78%** |
| 45 s alatti szünet | 216/260 — 83% |

⇒ A **20 s pont a p75 ALATT** volt ⇒ az esetek **~29%-ában** idő előtt ment ki a köteg.
⭐ **Az ablak 20 s → 30 s** *(78% vs 71%, +10 s késleltetés árán)*. ⛔ 45 s-ra nem mentünk: onnan
a haszon +5 százalékpont, a késleltetés +15 s.

⚠️ **De az ablak csak valószínűségi.** A tényleges védelem a **hetedik kapu**, ami **tényt** néz.

### Mi készült

| fájl | mi |
|---|---|
| `voice-speech-inflight.ts` *(új)* | a folyamatban lévő megszólalások nyilvántartása **korral** — egy beragadt jel **elévül** *(3 perc)*, ⛔ nem fogja meg örökre a kaput |
| `discord.bridge.ts` | a **hetedik kapu** + `attachSpeechInProgressSource()` — ⭐ setter, mert a hang-lánc **később** áll fel, mint a híd |
| `discord.models.ts` | `collectWindowMs` 20 s → **30 s**, a méréssel dokumentálva |
| `discord.listener.ts` | bekötés: megszólalás-kezdet ⇒ `noteStarted`, **három** lezárási ág ⇒ `noteSettled` |

⭐ **HÁROM lezárási ág, nem egy** — ez a lényeg, hogy a kapu ne ragadjon be:
**(1)** `onHandled` *(a feldolgozás lezárult)* · **(2)** `onSpeechDropped` *(a felvevő némán
eldobta — ezen az ágon ⛔ NINCS `onHandled`)* · **(3)** az **elévülés** mint végső hálóz.

⚠️ A **hangüzenet-út is benne van** *(`sttInFlight`)*: egy éppen felismerés alatt lévő hangüzenet
ugyanúgy „folyamatban lévő megszólalás". ⛔ Ha csak az egyiket néznénk, a köteg a másik alatt
mégis kimehetne.

⭐ **Pozitív kontroll:** kiiktattam a kaput **és** az elévülést ⇒ **4 teszt** bukott
*(2 a kapura, 2 az elévülésre)*; visszaállítva újra zöld.
**Review:** az új fájlon **0** találat; repo-szintű összes **változatlan** *(2394)*.

---

## ✅ 9. TÉTEL — A BESZÉD-ÉSZLELÉS LESZÖGEZÉSE (2026-09-11 07:10)

> **Owner, 2026-09-11 04:11:** *„…az **kurva jól működik** — azt amúgy **nagyon alaposan
> rögzítenünk is kéne, körbeírni, nagyon alaposan tesztekkel fixálni a funkcionalitást**."*

**Mért kiindulás:** 37 fájl · 6 681 sor · **0 spec**. ⇒ A legjobban működő darab volt a
legvédetlenebb.

| rész | hol |
|---|---|
| **körbeírás** | `__documentations/dev/VOICE_SPEECH_DETECTION.md` — **mért** értékekkel, ⛔ nem a kódból parafrazeálva; a `VOICE_CONTROL_REFERENCE.md`-ből **hivatkozva** *(SSoT)* |
| **leszögezés** | `cli/src/_modules/voice/voice-speech-detection.characterization.spec.ts` — **28 spec** |

⛔ **A HATÁR TARTOTT:** `git diff` a `cv-*.ts` fájlokon **ÜRES** — a fában az **egyetlen**
változás a **saját, új** spec-fájlom *(`??`)*.

### 🔴 A BUKTATÓ, AMI NÉMA TESZTET ADOTT VOLNA — mérve

```
build-base  =  rimraf ./dist && tsc -p tsconfig.json    ← a dist-et TÖRLI,
                                   és a _modules KI VAN ZÁRVA belőle
npm test    =  build-base && jasmine  dist/**/*.spec.js
```

⇒ A `_modules`-beli spec **le sem fordult** volna a `dist`-be ⇒ jasmine **nem találja** ⇒
🔴 **némán NEM FUT** — miközben a fájl ott van, és a *„spec-szám > 0"* kritérium **teljesül**.
⚠️ Pontosan az a hibafajta, ami ellen az egész munka szól.

⭐ **A megoldás:** `build-transplanted` npm-szkript, és a `test` **átfogja**. ⚠️ Vállalt
következmény: egy jövőbeli `@types/node` bump pirosra viheti a `npm test`-et — ⭐ ez a **helyes**
viselkedés: ilyenkor a tesztek tényleg nem tudnak lefutni.

### ⭐ AMIT A POZITÍV KONTROLL HOZOTT ELŐ — a saját tesztem hibája

| sabotage | elkapta? |
|---|---|
| `speechThreshold` 0,008 → 0,08 | ✅ **2 teszt** |
| `zcrFilteringCount` 10 → 3 | 🔴 **NEM** — a szűrés-tesztek a tömböt **a configból** építik, ezért **adaptálódtak** |

⇒ A tesztek a **kapcsolatot** szögezték le, az **értéket** nem. Egy explicit `toBe(10)` zárta be.
⛔ **Enélkül a leszögezés hamis biztonság lett volna.**

### ⚠️ AMIT A FELADAT KÉRT, DE NEM A MI KÓDUNK

A *„beszéd → 1 s csend → beszéd → két szegmens"* teszt. **Mérve
(`cv-recording.control-service.ts:113`):** a szegmens-határt a **`@discordjs/voice` receivere**
húzza meg *(`AfterSilence`, 1000 ms)*, ⛔ nem mi. Egy ilyen teszt **a Discordot** tesztelné, és
élő hang-kapcsolat nélkül nem is futtatható. ⇒ Amit **mi** döntünk el *(keret-szintű ítélet +
ZCR-szűrés)*, az **le van szögezve**.

### 🔴 MÉRT LELET: a `zcrValidationThreshold` KI VAN KAPCSOLVA

A feladat a *„szerepét"* kérte — a valóság: a forrásban **kikommentezve** áll, tehát **nincs
hatása**. *(Ugyanígy a `zcrMaxRedGapLength` és a `zcrMinGreenBlockLength`.)* ⛔ Nem kapcsoltam
vissza: a teszt azt rögzíti, ami **VAN**.

---

## ✅ 10. TÉTEL — A PROFIL-PANEL ELÉRHETŐ (2026-09-11 11:30)

**A nav most két belépőt ad:** `LinkedIn üzenetek` *(`/linkedin`)* és `LinkedIn profil`
*(`/linkedin/profile`)*.
⚠️ Az üzenet-linken `[routerLinkActiveOptions]="{ exact: true }"` — enélkül **mindkettő**
aktívnak látszana a profil-oldalon *(prefix-egyezés)*, ami apró, de valódi hazugság a felületen.

⭐ **És teszt is van rá** *(4 spec)*, mert **ez a hibafajta CSENDES:** a route él, a komponens
fordul, a teszt zöld — és a funkció mégis **nem létezik** a használó számára.
**Pozitív kontroll:** a linket kivéve **3 teszt** bukott.

⚠️ **Egy review-találat marad itt:** a `dead-route-links` *„Unknown route target:
`/linkedin/profile`"*-t mond. ⭐ **Bizonyított eszköz-korlát, ⛔ nem defekt:** ugyanez a szabály
**6 MEGLÉVŐ** találatot ad a `/reports/dev-io` és `/reports/user-io` útvonalakra — azok
**működő** gyerek-route-ok lustán betöltött modulban, amiket a checker nem tud feloldani.

## 🟡 12. TÉTEL — EGY HIBÁT REPRODUKÁLTAM ÉS JAVÍTOTTAM

⭐ Az *„üres adattal is hibamentesen betölt-e"* ellenőrzés közben **élesben megfogtam** egy
valódi hibát — ⇒ ez **nem találgatás**, hanem reprodukált defekt:

```
GET http://127.0.0.1:39335/api/linkedin/profile-update
  →  MA-LINKEDIN-PROFILE-READ-FAILED
```

### 🔴 A GYÖKÉR — és MINDKETTŐ az én regresszióm volt

**(1) `__dirname` ESM-ben.** A szerver `"type": "module"`, ahol a `__dirname` ⛔ **nem létezik**.
⚠️ A `tsc` **zöld** volt, mert a `@types/node` **globálisan deklarálja** ⇒ a hiba **csak élő
hívásra** derült ki. A hat szomszéd szerver-fájl mind `fileURLToPath(import.meta.url)`-t
használ; az enyém volt az **egyetlen** `__dirname`-es.
🔴 **Ugyanaz a hibaosztály, mint a `@cli/*` alias-csapda** — amiről **én** írtam a
figyelmeztetést ugyanabba a fájlba, és **három sorral lejjebb** beleestem.

**(2) A szint-számolás nem lehet helyes MINDKÉT futásban.** Mérve:

```
src:    server/src/_routes/linkedin          → 4 szint = a repo gyökere
build:  server/build/server/src/_routes/...  → 5 szint = a repo gyökere
```

⇒ Egy fix szám **vagy** a `tsx`-es fejlesztői futásban, **vagy** a buildben téved. ⚠️ És a
build-oldali tévedés **nem kivétel**, hanem **csendes üresség**: a panel
*„nincs mit frissíteni"*-t mutatna. ⭐ Ezért **jelölő-keresés** *(`__agent` + `cli`)*, a CLI
`resolveProjectRoot` mintája szerint — és ha a jelölő nincs meg, **kimondott hiba**, ⛔ nem csend.

### ⭐ IGAZOLÁS — két független úton

1. **Közvetlen futtatás `tsx`-szel a `src`-ből** *(pontosan úgy, ahogy a szerver fut)*:
   `readPlan()` **teljes tervet ad**, a mostani ÉS a javasolt szöveggel.
2. **Új szerver-spec** *(4 db)*, ami a **build**-ből az **élő utat** hívja.
   ⚠️ Ez a spec **hiányzott** — ezért csúszhatott át: a tiszta mező-logikát 15 CLI-spec fedi, a
   **futásidejű útvonal-feloldást** viszont **egy sem**.

⭐ **Ráadás, amit közben javítottam:** három **kiterjesztés nélküli** import a saját
szerver-fájljaimban *(`.js` nélkül)*. A `tsx` ezt tolerálja, a **buildelt ESM nem** — a
szerver-spec `ERR_MODULE_NOT_FOUND`-dal bukott, amíg ki nem javítottam.

🙋 **AMI OWNER-KAPUN MARAD:** a *„mindenféle"* többi darabja. ⛔ Nem javítok olyat, amit nem
reprodukáltam *(`uncertain-requests`)* — a konkrét hibaszövegre várunk.
⚠️ **A futó szerver-példány még a régi kódot viszi** — a javítás a **következő
szerver-újraindításkor** lép életbe; ⛔ nem indítom újra magamtól *(a szerver a gazda)*.

---

## ➡️ A KÖVETKEZŐ KONKRÉT LÉPÉS

⭐ **A 17-23. tétel KÉSZ; a maradék rajtam kívüli kapun áll** *(állapot: 2026-09-12 22:40)*:

| Tétel | Mire vár | Mi oldaná fel |
|---|---|---|
| **23** *(a nyugta őszintesége)* | ⭐ **KÉSZ** — fixtúrás előnézettel igazolva | — |
| **22** *(önreferencia + a napló vak foltja)* | ⭐ **KÉSZ, élő próbán igazolva** | — |
| **21** *(teszt-szemét az „utolsó hiba" sorban)* | ⭐ **KÉSZ, élő próbán igazolva** | — |
| **20** *(riasztás-szűrés · tulajdonnév · `doctor now`)* | ⭐ **KÉSZ, élő próbán igazolva** | — |
| **19** *(köteg-kapu zaj-immunitás)* | ⭐ **ÉLESBEN FUT** — a `ma doctor now` 06:26-kor a VALÓDI kapu-állapotot mutatta | — |
| **18** *(értelmesség-jelölés)* | ⭐ **ÉLESBEN FUT** *(05:31-kor jelölt is)* + 🙋 **három owner-döntés** *(lentebb)* | owner-válasz |
| **17** *(zaj-szűrés)* | ⭐ **ÉLESBEN FUT** *(05:30-kor naplózta a zaj-kódot)* | — |
| **17b** *(retry = reply)* | 🙋 **owner-kapu**: élő üzenet-küldés kell az igazoláshoz | a hétvége után egy próba-üzenet |
| **16** *(ébrenlét)* | a **szerver indulására** | ugyanaz a ciklus |
| **15** *(poszt-panel)* | **poszt-piszkozatra** *(az asszisztens írja)* | egy `.body.txt` a `current/linkedin/post-drafts/`-ba |
| **14** *(hosszú hang)* | ⭐ **ÉLESBEN FUT** | — |
| **13** *(naptár)* | a **naptár-engedély** kiadására | `ma email auth --account default` |
| **12** *(„mindenféle hiba")* | a **konkrét hibaszövegre** | ⛔ nem javítok olyat, amit nem reprodukáltam |

🙋 **A HÁROM NYITOTT OWNER-DÖNTÉS** *(mindegyikhez megvan a mérés)*:
1. **tágítsuk a halandzsa-szabályt?** 3/6 elkapás, de 4 valódi átirat is jelölést kapna;
2. **bekapcsoljuk a felismerő saját akusztikus osztályozóját?** *(zaj-szűrés a felismerés ELŐTT —
   de rövid, valódi megszólalás néma eldobássá válhatna)*;
3. **ritkítsuk a végleges-hiba riasztásokat?** a zaj-ág után is **126** maradt egy éjszakára — ezek
   viszont **valódi** veszteség-jelzések *(napi összevont jelentés lehetne helyettük)*.

⇒ A hurok lezárása: jelentés az `AGENT_BUS.md`-ben, ⛔ új ébredés NEM.

### 📨 A 23. TÉTEL — AZ „ÁTMENT N ÜZENETED" NYUGTA FÉLREVEZETETT (2026-09-12 22:40) ✅

🔬 **Az owner mérése** *(⛔ nem mértem újra — a handoff kikötése)*: a nyugta **2-5 mp**-cel a
**kézbesítés** után megy ki, de **190-650 mp**-cel az owner **beszéde** után. ⇒ A szám **pontos**
volt, csak ⛔ **nem azt mérte, amit ő hitt**: az *„Átment"* neki **szállítási** visszaigazolás.

⛔ **A késleltetést NEM szüntettem meg** *(a kötegelés szándékos, ő kérte)* — ⭐ a **szöveget**
javítottam:

```
📨 3 üzeneted megérkezett hozzám (4p 12mp várakozás után).
📨 3 üzeneted megérkezett hozzám (⚠️ 14p várakozás után — addig gyűjtött a köteg).
📨 4 üzeneted megérkezett hozzám.                      ⟵ ha a várakozás ⛔ NEM mérhető
```

| Döntés | Indok |
|---|---|
| **„megérkezett hozzám"** | ⛔ nem „átment" — a saját átvételemről szól |
| a **legRÉGEBBI** üzenet kora | ⭐ ezt várta ténylegesen; a legújabb kora a gyűjtő-ablak hossza lenne |
| ⚠️ **10 perc** fölött kiemelés | 🔬 horgony: a gyűjtő-ablak **30 mp**, a szelep **15 perc** ⇒ 10 perc fölött már **kivételes** kapunál járunk |
| az **OKA** is kimondva | *„addig gyűjtött a köteg"* — a késés ⛔ nem hiba |
| ⛔ nem mérhető ⇒ **nincs szám** | a `0` azt **állítaná**, hogy nem is várt ⇒ `null` |

🔴 **MIÉRT TÖBB KOZMETIKÁNÁL:** az owner **ma négyszer** hitte, hogy áll a rendszer
*(03:17 · 04:22 · 04:40 · 22:02)*, és **egyszer sem állt**. Egy őszinte nyugta mind a négy
félreértést megelőzte volna. ⚠️ Nem a szolgáltatás hibás, hanem a **bizalom** sérül.

#### ✅ Igazolás

CLI **1273/1273** *(+8 új spec)* · `tsc` tiszta · szöveg-előnézet **fixtúrából** *(7 változat)* ·
`dc rev` **2397 → 2397** ⇒ ⭐ **0 új találat**.
⚠️ **Két review-csapdát kerültem meg érdemben, ⛔ nem kikapcsolással:** a bridge-spec **536 sorra**
nőtt volna *(max 500)* ⇒ a blokk **külön fájlba** került; és az `as never` hamisítás helyett
**öröklés** *(`override`)* lett — így egy felület-változás **fordítási hiba**, ⛔ nem néma.

📌 Doksi: `__documentations/dev/DELIVERY_RECEIPT.md` · `SKILLS.md`.

### 📖 A 22. TÉTEL — ÖNREFERENCIA + A VAK FOLT MEGMÉRVE (2026-09-12 17:55) ✅

#### 1️⃣ Krónika vs. üzemállapot — a MÉRÉS döntötte el, kit hagyunk ki

🔴 **Az ok szerkezeti:** a `CLAUDE.md` előírja, hogy a szemantikus tanulság `kind: 'error'`
bejegyzés legyen ⇒ **ugyanabban a naplóban** van a gép hibája és az arról írt elemzés. Az
önreferencia elkerülhetetlen — ⇒ ⛔ nem a naplózást, hanem az **olvasót** javítottam.

**MÉRVE — 52 nap, 4 131 hiba-bejegyzés, actor szerint:** `cli` 3 156 · `server` 796 ·
**`claude` 100** · **`codex` 46** · `agent` 23 · `agent-dispatcher` 6 · `development-agent` 3 ·
`assistant-agent-cron` 1.

🔴 **A „minden, ami nem cli/server" szabály 33 VALÓDI gépi hibát tüntetett volna el** *(az `agent`
= `[notify-discord] POST failed`, az `agent-dispatcher` = `dispatch: JSON parse error`, a cron =
`fo tasks.list AUTH-fail`)*. ⇒ **Nevesített, szűk lista** *(`claude`, `codex`)*, ⛔ nem tagadás.
⚠️ A `development-agent` **szándékosan benne marad** *(vegyes tartalom — a bizonytalant megmutatjuk)*.

🙋 **A `codex` hozzávétele az én kiterjesztésem** *(te `claude`-ot kértél)*: 46 mért, prózai
bejegyzés ugyanabból az osztályból. ⛔ Ha nem kell, egy szó és kiveszem.

#### 2️⃣ A nyelt `parseLine` hiba — megmérve: NEM vagyunk vakok

⚠️ A mérés **ugyanazzal a parserrel** ment, amit az eszköz használ *(Node `JSON.parse` — a Python
`json` máshol húzza a határt)*:

| | |
|---|---|
| napló-fájl / összes sor | **52 nap / 119 869 sor** |
| 🔴 értelmezhetetlen | **1** *(0,001%)*, csak 09-12-n |
| a sor `kind`-ja | ⭐ **`ship`** ⇒ „utolsó hibaként" ⛔ sosem jelenhetett volna meg |
| az ok | egy **kézzel írt** JSONL-sorban escape-eletlen backslash *(`F:\Steam`)* |

⭐ **A javítás:** a `doctor now` **megszámolja** és a `gaps` blokkban **kimondja** a vak foltot.
⛔ **Amit szándékosan NEM tettem:** ⛔ nincs „JSON-javító" tartalék-parser *(0,001%-ért egy olyan
mechanizmus, ami félre is olvashat)*, és ⛔ **nem írtam át a sérült sort** *(a napló append-only)*.
🙋 A megelőzés a kézi JSONL-append elhagyása — a `ma action-log emit` helyesen escape-el.

#### 📊 ÉLŐ IGAZOLÁS

```
🔴 UTOLSÓ HIBA (11ó 13p): [MA-DISCORD-LISTENER-CRASH] … (⚠️ 132 teszt-eredetű + 11 krónika kihagyva)
⚠️ AMIT NEM SIKERÜLT MEGMÉRNI: · 1 napló-sor NEM volt JSON-ként értelmezhető
```

⇒ Az „utolsó hiba" most **valódi üzemállapot** *(a 06:23-as dist-race)*, és látszik, hogy **azóta
nem volt gépi hiba** — ez az információ eddig elveszett a krónika és a teszt-szemét között.

#### ✅ Igazolás

CLI **1265/1265** *(+9 új spec)* · `tsc` tiszta · **élő próba** OK · `dc rev` **2397 → 2397**
⇒ ⭐ **0 új találat** *(a `Pick<…>` típus két sort 150 karakter fölé vitt ⇒ helyi, ⛔ nem exportált
típus-alias lett belőle — a szerződés továbbra is a `DoctorNowSnapshot`-ból származik)*.

📌 Doksi: `__documentations/dev/DOCTOR_NOW.md` *(22. szakasz)* · `SKILLS.md`.

### 🧪 A 21. TÉTEL — AZ „UTOLSÓ HIBA" SORA TESZT-SZEMETET MUTATOTT (2026-09-12 09:20) ✅

🔬 **MÉRVE** *(a mai napló, 5 992 bejegyzés)*: **631** `kind: 'error'` sorból **114** ideiglenes
könyvtárra mutat *(`…\Temp\ma-<modul>-spec-XXXXXX\broken.json`)*, és **0** olyan temp-es `ref` van,
ami ⛔ nem spec-fixtúrából jött. ⇒ A szándékosan hibás fixtúrák a **közös** naplóba írnak, és a
diagnosztika rendszer-hibaként mutatta őket.

🔴 **EGY HAMIS POZITÍVOT IS MÉRTEM:** a napló **egyik VALÓDI** bejegyzése *(`actor: claude`, 09:08)*
a **summary**-jában említi a `groups.spec.ts`-t, a `ref`-je viszont `__agent/DEV-HANDOFF.md`.
⇒ Egy summary/blob-szintű `*spec*` minta **pont a tétel felvetését** tüntette volna el.
⭐ Ezért a heurisztika **kizárólag az útvonal-mezőket** nézi, és **temp-könyvtárat** követel.

⭐ **A TISZTÁBB JEL, amit a handoff felvetett — megmértem, és ELÉRHETŐ:**
`typeof globalThis.jasmine === 'object'` a spec-folyamatban ⇒ ⛔ **nem kellett új env-változó**.
A `logAction` innentől **bélyegzi** a bejegyzést *(`extra.testRun: true`)*.

✅ **A javítás két rétegű** *(mindkettő mérésre épül)*: a **bélyeg** a mostantól keletkező
bejegyzéseket fogja meg pontosan; a **temp-útvonal** a már meglévő 114-et, a spec által indított
gyerek-folyamatokat és a szerver külön naplózóját *(⚠️ mérve: az ma nem szennyez)*.

⛔ **NEM NÉMÍTÁS:** a sor **kimondja** a kihagyottak számát — `… (⚠️ 120 teszt-eredetű hiba
kihagyva)`, illetve `✅ ma nem volt VALÓDI hiba (⚠️ 114 … kihagyva)`. ⚠️ A számlálás a **teljes
napra** megy, ⛔ nem áll meg az első valódi hibánál *(különben a szám attól függne, hol találtuk meg)*.

📊 **ÉLŐ IGAZOLÁS:** a `doctor now` most **valódi** hibát mutat, `(⚠️ 120 teszt-eredetű hiba
kihagyva)` utótaggal; és a friss teszt-futás **3** cast-spec hibája a naplóban már **bélyeggel**
szerepel. ⭐ A spec **a saját futásában** igazolja, hogy a bélyeg él.

⚠️ **EGY MEGFIGYELÉS, AMIT NEM JAVÍTOTTAM** *(⛔ nem az én fájlom, ⛔ nincs benne a tételben)*: a
`cli/src/action-log/action-log.client.js` + `.js.map` **fordítási maradék a `src/` alatt**
*(09-07-i dátum)* — a `dc rev` `no-js-source-files` találata. A scriptek/config közül ⛔ **egyik sem
hivatkozik rá**. 🙋 Törlése owner- vagy tulajdonos-session döntése.

#### ✅ Igazolás

CLI **1256/1256** *(+8 új spec)* · `tsc` tiszta · **élő próba** lefuttatva ·
`dc rev` **2397 → 2397** ⇒ ⭐ **0 új találat**.
⚠️ **Egy meglévő specet át kellett írnom** *(`logAction` — „üres `extra` nem kerül a JSON-ba")*: a
szerződés **szándékosan** változott, mert teszt-futásban a bélyeg mostantól ott van. ⭐ A régi
invariáns *(⛔ nincs ÜRES `extra`)* **változatlanul** áll, és a spec ezt most **kimondva** rögzíti.

📌 Doksi: `__documentations/dev/DOCTOR_NOW.md` *(21. szakasz)* · `SKILLS.md`.

### 🔴 A 20. TÉTEL — KÉT FRISS DEFEKT + AZ ÖN-DIAGNOSZTIKA (2026-09-12 06:35) ✅

#### 1️⃣ A ZAJRA IS KIMENT a „VÉGLEG nem sikerült" riasztás — MAGAS

🔬 **MÉRVE** *(`outbound-log.jsonl`)*: **169** ilyen riasztás **egy éjszaka** alatt, ebből
**43 BULI-ZAJ** *(a többi: 71 arány-gyanú · 22 CUDA-hiba · 33 egyéb · 1 időtúllépés)*; a csúcs
**4 riasztás / perc**, és 05:47-kor **még mindig** ömlött — órákkal a buli után.

🔴 **A MECHANIZMUS:** a zaj-felvétel **technikai** hibával került a sorra, ott egy későbbi próba
**sikeresen** felismerte — de zajt. A régi kód ezt „még mindig nem sikerült"-ként kezelte ⇒
újra ütemezte, és az 5. próba után **riasztott**. ⇒ **4 fölösleges felismerés + 1 hamis riasztás**
minden zaj-felvételre.

✅ **(a)** a zaj mostantól **LEZÁRÁS**: kiesik a sorból, riasztás **nélkül** *(tesztelt döntés:
`SttRetryOutcome_Util`; ⚠️ a sorrend kritikus — a zaj-jelölés **erősebb** a `suspicious`-nál, erre
**pozitív kontroll** van)*.
✅ **(b)** a riasztás **kiírja a felvétel idejét** *(a fájlnév ISO-bélyegéből; hangüzenetnél a sorba
kerülés ideje, és a szöveg **kimondja**, hogy az mi)*.

📊 A hatás a ma éjjeli adaton: **43 riasztás elmaradna**; a megmaradó **126** viszont **valódi**
veszteség-jelzés. 🙋 A ritkításuk *(napi összevont jelentés)* **owner-döntés** lenne.

#### 2️⃣ AZ ÉRTELMESSÉG-ŐR ELSŐ ÉLES TALÁLATA HAMIS POZITÍV VOLT — KÖZEPES

A 18. tétel élesbe állt, és megjelölt egy **valódi** üzenetet *(31%, küszöb 22%)*, mert a
**játékcímek** *(timberborn, dyson, sphere, settlers)* „ismeretlen szónak" számítottak.
⭐ Az owner szerint a **viselkedés jó volt** *(megjelölte, ⛔ nem dobta el)* — csak a jelölés
fölösleges.

✅ **A javítás ⛔ NEM a küszöb emelése**, hanem **tulajdonnév-mentesség**, két jellel:
**(1)** a **mondat közben** nagybetűs szó tulajdonnév *(⚠️ a mondat ELSŐ szava ⛔ nem — ott a
nagybetű kötelező)*; **(2)** a **személyes** név-szótár *(Steam: 539 név ⇒ 609 szó-töredék;
⛔ gitignorált, csak **olvassuk**, a repóba **nem** kerül; ha nincs, ⛔ nem hiba)*.

📊 **MÉRVE** *(211 valódi átirat + 2 halandzsa)*: a játék-üzenet **0,311 → 0,156**, a halandzsa
**2/2 elkapva**, hamis jelölés **1 → 0**. A küszöb **változatlan (0,22)**.

#### 3️⃣ ÖN-DIAGNOSZTIKA: `ma doctor now` — ÚJ IGÉNY

⚠️ **Tág kérés** ⇒ ⛔ nem keretrendszer: **EGY** parancs, ami a **pillanatot** mutatja *(köteg +
mióta · miért nem megy ki · fut-e felismerés · a figyelő életjele · a gép terhelése · az utolsó
hiba)*. ⛔ A `comm doctor`-tól **elhatárolva**: az a **készenlétet** méri, ez a **pillanatot**.

🔬 **A NEHÉZ RÉSZ:** a köteg-kapu és a futó felismerés a figyelő **memóriájában** élnek ⇒ egy külön
folyamat ⛔ nem látja. ⭐ Megoldás: a figyelő az **életjelbe** írja *(`moment` blokk)*, és a
`doctor now` a **kiküldési döntésbe is beteszi** a valódi kapu-állapotot. ⚠️ Ha a blokk hiányzik,
azt **kimondjuk** *(„régi kódot futtat")* — ⛔ nem nullákat mutatunk.

⭐ **AZ ELSŐ ÉLES FUTÁS AZONNAL TALÁLT EGY VALÓDI HIBÁT:** `MA-DISCORD-LISTENER-CRASH` 29
másodperccel korábban ⇒ kiderült, hogy a **saját `dist` újraépítésem** *(rimraf)* alatt indította
újra a felügyelő a figyelőt *(mérve: ma pontosan **1** ilyen, 06:23:27-kor)*. ⇒ **dist-race**,
⛔ nem kód-hiba.

#### ✅ Igazolás

CLI **1248/1248** · szerver **119/119** · `tsc` tiszta · **élő próba** lefuttatva
*(`node cli/dist/cli/src/main.js doctor now`)* · `dc rev` **2404 → 2397** ⇒ ⭐ **−7**
*(az életjel-olvasó tisztítása 9 találatot vitt el; **+2** a parancs-minta ára: minden `ma`
parancs lusta `import()`-et és `export async function runXCommand`-ot használ — ⛔ ettől nem
térek el egy számláló miatt)*.

📌 Doksi: `__documentations/dev/DOCTOR_NOW.md` · `VOICE_NOISE_FILTER.md` *(20/1 szakasz)* ·
`VOICE_MEANINGFULNESS_MARK.md` *(20/2 szakasz)* · `SKILLS.md`.

### ⏳ A 19. TÉTEL — A KISZŰRT ZAJ NEM NYÚJTJA A KÖTEG-ABLAKOT (2026-09-12 05:30) ✅

#### 🔬 A MÉRÉS — és amit a SAJÁT első feltevésemből megcáfolt

A napi akció-naplóból *(01:22–04:52)*:

| Mit mértem | Érték |
|---|---|
| `speaking start` jel *(ez tölti a kaput)* | **757** |
| felvétel-kimenetel *(ez üríti)* | **295** ⇒ 🔴 **462 LEZÁRATLAN**, mindegyik 180 mp-ig zár |
| a köteg-kapu **zárva** volt | **90,0 perc** *(az ablak 43%-a)* |
| ebből **valódi feldolgozás** alatt | **9,4 perc** ⇒ a zárás **90%-a** puszta észlelésből jött |
| 03:17 *(owner 1. kérdése)* | a kapu **9,0 perce** zárva |
| 04:22 *(owner 2. kérdése)* | a kapu **4,8 perce** zárva |

⚠️ **A handoff mechanizmus-leírását pontosítottam:** az *„elcsendesedési ablak újraindul"* hatás
**valós, de kicsi** — mérve a leghosszabb megszakítás nélküli lánc **60 másodpercig** nyújtotta az
ablakot *(72 tétel, medián köz 30,0 mp)*. A 9-38 perces zárást a **megszólalás-kapu** adta.
⇒ Ezért a javítás **ott** történt, ahol a mérés mutatta.

#### ✅ A szabály — ⛔ NEM rövidítés

```
(1) valódi FELVÉTEL feldolgozása alatt zárva   — mérve: median 2,0 mp, p90 4,0 mp, max 11,0 mp
(2) ZAJ-ÖZÖN alatt a puszta ÉSZLELÉS nem zár   — küszöb: a MÉRT 12 zaj / 10 perc (SSOT)
(3) egyébként minden változatlan               — a 2026-09-11-es „ÉPP BESZÉL" viselkedés
```

📊 **A teszt, amit az owner kért:** „1 valódi + 50 zaj 10 percen át" ⇒ a köteg **+144 mp**-nél
kimegy, a **12.** zaj-tétel után *(amikor az özön MÉRHETŐ)* — ⛔ nem a 15 perces szelepből.
🔴 **Pozitív kontrollal** igazolva: zaj-jelölés nélkül ugyanez **bent ragad**.

⚠️ **Ami megmarad, kimondva:** a zaj **saját feldolgozása** *(2-11 mp)* alatt a kapu zárva —
ez elvileg sem kerülhető meg, mert a zaj-jelölés csak a felismerés UTÁN létezik. És a
`sttInFlight` *(újrapróbálási sor)* továbbra is zár; ezt ⛔ **nem mértem meg**, mert a naplóban
nincs „retry-próba indult" esemény — 🙋 ha kell, előbb mérőpontot teszünk rá.

📌 Doksi: `__documentations/dev/VOICE_BATCH_GATE.md` · `SKILLS.md`.

### ⚠️ A 18. TÉTEL — A ZAJ-SZŰRŐ VAK FOLTJA (2026-09-12 05:40) ✅ *(részleges recall, kimondva)*

#### ⛔ HÁROM JELET MEGMÉRTEM ÉS ELVETETTEM

| Jel | Az eredmény |
|---|---|
| **a felismerő bizonytalansága** *(a handoff szerint „a legolcsóbb és legmegbízhatóbb")* | 🔴 **NEM LÉTEZIK** — élőben mérve a `/api/recognition` válaszában ⛔ nincs `confidence`/logprob; az OpenAI-kompatibilis végpont API-kulcsot kér, ami nálunk nincs |
| **`a`/`az` egyeztetés** | 🔴 **MEGCÁFOLVA** — a valódi üzenetek 8-11%-a is „sérti" *(az `az` mutató névmás is)*, a halandzsa meg alig |
| **ismeretlen-arány EGYEDÜL** | 🔴 **NEM VÁLASZT EL** — valódi: 0,057 medián / 0,174 p95 / **0,250 max**; halandzsa: 0,125-0,375 ⇒ átfedés |

#### ✅ Ami maradt — két feltétel EGYÜTT, és CSAK beszédre

```
ÉRTELMESSÉG-GYANÚ ⇐ ≥ 8 tartalmi szó ÉS ismeretlen-arány ≥ 0,22 ÉS ≥ 3 ismeretlen szó
```

🔴 A **3-as ismeretlen-küszöb adja a nulla hamis jelölést**: az egyetlen valódi átirat, ami átlépi
az arány-küszöböt *(0,250)*, mindössze **2** ismeretlen szót tartalmaz.
📚 A szótár **generált, git-trackelt** artefakt *(`cli/data/hu-lexicon.txt`, 15 953 szó)* — a repó
markdown-jaiból, gyakoriság ≥ 2, ⛔ **nem** az átiratokból *(azok legitimálnák a halandzsát)*.

📊 **Visszamérve az ÉLES kódon, 279 beszéd-átiraton:** ⭐ **0** hamis jelölés a valódi magyarokon
*(a ma éjjeliekre is 0)* · ⚠️ **2 / 6** halandzsa elkapva *(köztük az owner első példája)* ·
⭐ **ráadás:** a hosszú, idegen nyelvű zajból **5** tételt is megjelöl — pont azt a sávot, amit a
17. tétel szűrője szándékosan átenged.

#### 🙋 KÉT OWNER-DÖNTÉS VÁR — mindkettőhöz megvan a szám

1. **Tágítsuk a szabályt?** *(arány ≥ 0,22 **VAGY** ismétlődő ismeretlen szó)* ⇒ **3/6** elkapva,
   de **4 valódi** átirat is jelölést kapna. ⛔ Én a szűkebbet választottam, mert „egy sem"-et kértél.
2. **Kapcsoljuk be a felismerő SAJÁT akusztikus osztályozóját?** Mérve: a `skip_classification=1`
   elhagyásával a szolgáltatás `{category:"noise", confidence:0.8, is_speech:false}`-t ad, és a
   zajt a **felismerés ELŐTT** kiszűrné *(kapacitás-nyereség)*. ⚠️ **DE** ilyenkor **átirat nélkül**
   válaszol, és a rövid mintára azt írta: *„Audio too short for reliable classification"* ⇒ egy
   rövid, **valódi** megszólalás néma eldobássá válhatna. ⛔ Működő utat érint ⇒ owner-döntés.

📌 Doksi: `__documentations/dev/VOICE_MEANINGFULNESS_MARK.md` · `SKILLS.md`.

### 🎤 A 17. TÉTEL — A NYITOTT MIKROFON ZAJA (2026-09-12 03:50)

#### 🔬 A LABELLED KORPUSZ MÉRÉSE — ⛔ nem intuíció

Az owner maga adta a korpuszt *(02:51: „itt van a minta alap, meg a zaj alap")*. Felcímkéztem a
kötegbe jutott átiratokat, és megmértem, **mi választja el** őket:

| | ZAJ | VALÓDI |
|---|---|---|
| magyar betű | **0 / 21** | **15 / 15** |
| gyakori magyar szó | **0 / 21** | **15 / 15** |
| karakter | 3-94 *(medián 7)* | 33-325 *(medián 110)* |
| szó | 1-19 *(medián 1)* | 7-47 *(medián 21)* |

🔴 **A hossz önmagában NEM választ el** *(33-94 között átfedés)* — a **magyar-jel** viszont
hibátlanul. ⇒ A szabály: `NEM magyar ÉS (≤ 30 karakter VAGY ≤ 6 szó)` — **mindkét küszöb a
mért valódi minimum (33 kar / 7 szó) ALATT**.

⛔ **A hosszú, nem magyar szöveget NEM szűri** *(az owner kikötése)* — vállalt csere: a
korpuszon 2 zaj átmegy, de egy valódi mondat eldobása **drágább**.

#### 📊 VISSZAMÉRÉS — 427 minta, 3 korpusz, több nap

| Korpusz | átirat | magyar | zajnak jelölve | 🔴 **magyar zajnak** |
|---|---|---|---|---|
| ma éjjel | 88 | 35 | 49 | **0** |
| teljes tükör-archívum | 217 | 151 | 56 | **0** |
| hang-archívum | 122 | 96 | 21 | **0** |

⭐ A labelled korpuszon: **19/21 zaj elkapva (90,5%)**, **0 valódi kiesés**.

#### 🔇 A ZAJRA CSEND — ez az anti-flood döntés

⛔ Se hangjelzés, ⛔ se kiesés-jelentés. 🔴 Mérve **243** zaj-tétel egy este alatt: ha
mindegyikről szólnánk, **a szűrő maga lenne a legnagyobb zajforrás** — éjjel, vendégek mellett.
⭐ A tölcsérben viszont **külön sorban** látszik *(`🎤 buli-zaj (megszűrve)`)*, és **kimarad az
átviteli arány nevezőjéből** — ugyanazon az elven, mint az üres felvétel és a duplikátum.

#### 🎤 A SZIGNÁL — mért küszöbbel

`12 zaj-tétel / 10 perc` *(csúszó ablak)*. Mérve: a **normál** ablakok csúcsa **4**, a **bulié
42-84** ⇒ a küszöb a **10× üres sávban** van. ⛔ A hangos figyelmeztetést az **asszisztens**
küldi — a `cast notify`-t **nem hívtam**.

#### ⭐ A HARMADLAGOS #2 MAGÁTÓL MEGOLDÓDOTT

Az owner panasza *(02:45: „az nem is egy valid találat")*: a retry-út már eddig is ellenőrizte a
`suspicious` jelzőt ⇒ a zaj-jelölés miatt az **érvénytelen találat innentől nem megy ki
sikerként**. **Visszamérve a ma éjjeli értesítéseken: 47 / 60**-at megfog
*(„Go." · „Kiitos." · „Thank you very much." · „I think I have a fun match." …)*.

#### 🙋 A HARMADLAGOS #1 NINCS MEGÉPÍTVE — kimondva, indokkal

A *„retry-értesítés legyen REPLY az eredeti hibára"* lánc **3 fájlt** érint, köztük a
**mindenki által használt kimenő utat** *(a `sendDiscordMessage` ⛔ nem adja vissza az elküldött
üzenet azonosítóját)*, és a működését ⛔ **csak élő üzenet-küldéssel** lehetne igazolni — ami
ezen a hétvégén **tilos**. 🔴 Ezért ⛔ **nem építettem félkész, igazolhatatlan változatot**: a
dead-code rosszabb, mint a kimondott hiány. *(A `{ to: 'reply' }` terv-ág és a
`fetchReplyTarget` már létezik — csak a populálás hiányzik.)*

#### ✅ Igazolás

CLI **1219/1219** *(+33)* · szerver **119/119** · `tsc` tiszta · `dc rev` **2404 → 2404**
*(0 új találat)* · 🔇 **nulla élő hangszóró-kísérlet, nulla üzenet az ownernek** — minden mérés
**olvasás** volt.

⚠️ **A tölcsér `buli-zaj` sora most 0** — és ez helyes: a 244 éjjeli veszteség a **régi** kóddal
lett naplózva; a zaj-kód a **következő listener-indulástól** gyűlik.

📌 Doksi: `__documentations/dev/VOICE_NOISE_FILTER.md` · `SKILLS.md`.

### 😴 A 16. TÉTEL — AZ ÉBRENLÉT-DÖNTÉS MÉRÉSRE CSERÉLVE (2026-09-12 00:30)

⭐ **EGY funkció:** `ébren? = friss aktivitás-minta VAGY friss Discord-válasz (+1 óra)`.

#### 🔬 5 698 MINTÁN MÉRVE — ⛔ nem két anekdotán

A teljes jelenlét-adaton *(8 nap)* összevetettem a fix órarendet *(`02:00-10:00`)* a mérhető
ébrenléttel:

| Osztályozás | ELTÉR |
|---|---|
| az `idleState` mező szerint | **43,9%** *(5 437 minta)* |
| `idleSeconds ≥ 10 perc` | **38,5%** *(5 698)* |
| `idleSeconds ≥ 1 óra` | **35,3%** *(5 698)* |

🔴 Mindhárom olvasatban **35-44%** ⇒ a fix órarend gyakorlatilag **érme-feldobás**. Strukturális
ok: a **csúszó, ~26 órás** ciklus egy fix órarenddel összeférhetetlen.

#### ⚠️ A HANDOFF KÉT PÉLDÁJÁT MEGMÉRTEM — NEM cáfolják a tippet

| Időpont | A fix órarend | A valóság | |
|---|---|---|---|
| 09-11 **09:00** | 09 **az ablakban** ⇒ „alszik" | aludt *(idle 6,1-7,7 óra)* | ⭐ EGYEZIK |
| 09-12 **00:06** | 00 **az ablakon kívül** ⇒ „ébren" | ébren volt *(idle 0 mp)* | ⭐ EGYEZIK |

⇒ A két idézett pillanatban a tipp **véletlenül eltalálta**. ⛔ Ez nem érv a tipp mellett — de a
**cáfolat máshonnan jön**, mint a handoff írta, és ezt **kimondom** *(a 09-11-i owner-elvárás:
ha a handoff méréssel cáfolható tényt állít, cáfold)*.
*(Ha a „reggel = ébren" tipp nem a `/api/sleep-state`-ből jött, az **másik, nem mért forrás** —
külön tétel.)*

#### ⛔ NEM ÉPÍTETTEM ÚJ OLVASÓT — a jel már megvolt

A `presence.reader.ts` **már** kezelte a **BOM**-ot, a `timestamp` mezőt, az `idleSeconds`-öt, a
három állapotot és a RustDesk-szűrőt; a *„Discord-válasz ⇒ +1 óra"* owner-szabály pedig a
**hangszóró-kapuba** volt beépítve. ⇒ A döntést **kiemeltem egy helyre**
*(`presence.awake.ts`)*, és **mindkét** fogyasztó azt használja — a kapu **és** a szerver.
⛔ Két implementáció azt jelentette, hogy a rendszer **két igazságot** mondott ugyanarról.

#### 🔴 A HÁROM ÁG — a harmadik a lényeg

`ébren` *(aktív mérés / Discord ≤1 óra)* · `alszik` *(friss, de tétlen)* · **`nincs adat`**.
⚠️ **Bizonytalanságnál az „alszik" nyer**, és ez **be van építve** az `isAwake` mezőbe, hogy a
hívó ⛔ ne tudja „valószínűleg ébren"-ként olvasni. A döntés **indoklással** jön *(melyik jel,
milyen friss)*, ⛔ nem puszta logikai érték.

#### ✅ Igazolás

CLI **1192/1192** *(+16)* · szerver **119/119** *(a 9 óra-alapú spec **mérés-alapúra** átírva)* ·
`tsc` tiszta · **pozitív kontroll ×2** *(az `unknown`-t „ébren"-re állítva → 1 bukás; a doktor
„nincs mérés" ága elnémítva → 1 bukás)* · **élő mérés 00:21-kor**: `awake` · `presence-active` ·
0 perc.

⛔ **A hétvégi kikötés betartva: NULLA élő hangszóró-kísérlet.** A tesztek fixtúrából mennek, az
élő mérés **csak olvasott** — a `ma cast notify` **nem futott**.

⚠️ **Vállalt találatok, kimondva** *(`dc rev` 2397 → 2404)*: `controller-handler-error-wrapping`
×2 *(szándékos: a mérés bukásakor a biztonságos NÉMA választ adjuk, ⛔ nem 500-at — a hiba a
`reason`-ben és a hiba-tárban is ott van)* · `no-dynamic-imports` ×3 *(a mért alias-csapda)* ·
`no-plain-function-export` ×2 *(a szomszédok formája)*.

📌 Doksi: `__documentations/dev/AWAKE_DECISION.md` · `SKILLS.md`.

### ✍️ A 15. TÉTEL — POSZT-PISZKOZAT PANEL (2026-09-11 18:30)

⭐ **EGY funkció, ahogy kérte:** egy lista a poszt-piszkozatokról + posztonként egy **másolható
szövegdoboz**. ⛔ **Nincs** ütemezés, automata kiküldés, statisztika, kép-generálás, szerkesztő.

🔗 **A panel a NAVIGÁCIÓBÓL elérhető** — `/linkedin/posts`, `„LinkedIn posztok"`.
⚠️ A handoff kikötése: *„a profilnál ez kimaradt, ne ismételjük"* ⇒ a link **a panellel együtt**
született, és **teszt őrzi** *(pozitív kontroll: a link kivételével 3 teszt bukott)*.

#### 🔬 MÉRT KORREKCIÓ A FELADAT-LEÍRÁSHOZ — a piszkozatok helye

A handoff szerint *„A piszkozatok helye: `current/linkedin/drafts/` … Ezt olvasd."*
⚠️ **Megnéztem: az a mappa ÜZENET-válaszokat tartalmaz** *(`README.md` → „LinkedIn
VÁLASZ-piszkozatok"; a `.md`-kben `thread:` azonosító)*.

🔴 **Két okból nem olvashattam azt „posztok" néven:**

1. **Átugrottam volna az owner sorrendjét** — az üzenetek a **harmadik** tétel.
2. **Adat a rossz felületen:** azokban a piszkozatokban **óradíj és telefonszám** van.
   ⛔ Ez nem elírás-szintű különbség. *(Külön teszt őrzi: a poszt-válasz nem tartalmazhat
   `EUR/óra`-t vagy `thread:`-et.)*

⭐ **Amit a handoff valóban kér, és átvettem:** a **két-fájlos alak** *(`.body.txt` = a pontos
kimenő szöveg · `.md` = az indoklás)* — csak a posztok **saját mappájából**:
`current/linkedin/post-drafts/`. 📌 A handoff maga jelezte, hogy *„a piszkozatok helyéről szólok
külön"* ⇒ a hely nyitott volt; most kimondott, és a mappa a szerződés-leíró `README.md`-vel
**létre is jött**.

#### 🔴 A SZÖVEG NEM A MI DOLGUNK

A tartalmi szabályok az ownernél/asszisztensnél vannak
*(`current/principles/linkedin-post-writing.md`)*. A panel **megjelenít és másol** — ⛔ egyetlen
karaktert sem generál és nem módosít. **Teszt őrzi**, hogy a vágólapra a **pontos** szöveg megy.

#### ⭐ A REVIEW HÁROM VALÓDI TALÁLATA — mindhárom JAVÍTVA

Az első változat **11** találatot hozott; ebből **3 valódi duplikáció** volt *(az én hibám: a
profil-panel mechanikáját lemásoltam)*:

| Találat | Javítás |
|---|---|
| data-service *(70 sor, 91% azonos)* | ⭐ `linkedin-panel-files.util.ts` — **mindkét** panel ezt használja |
| scss *(26 sor bájtra azonos)* | ⭐ `_linkedin-panel.scss` mixin |
| vezérlő *(41 sor)* + `thin-controller` | ⭐ `linkedin-panel-endpoint.util.ts` — a **kapu** a segédben, a vezérlő puszta deklaráció |

⭐ **RÁADÁS:** az endpoint-segéd a **profil**-vezérlőből is elvitte a `thin-controller` és
`endpoint-auth-preprocess` találatot *(2+2)*.
⇒ `dc rev` **2397 → 2397**: egy **teljes új panel** készült el, és a repo találat-száma
**nem nőtt**.

⚠️ **3 találat tudatosan marad:** `no-dynamic-imports` a CLI-modul futásidejű betöltésén.
🔴 Mért kényszer: a `@cli/*` alias **csak fordítási időben** létezik ⇒ a Google- és a
Spotify-panel élesben elromlott emiatt, **zöld `tsc` mellett**. A szomszéd profil-panel
ugyanezt viszi.

#### ✅ Igazolás

CLI **1176/1176** *(+29)* · szerver **115/115** *(+5, az **élő** utat hívják a buildből)* ·
kliens **159/159** *(+11)* · `tsc` tiszta mind a háromban · **pozitív kontroll ×2**
*(nav-link kivéve → 3 bukás; az üres állapot elnémítva → 1 bukás)*.

⛔ **Amit nem tudok kimondani:** a **HTTP-felület élő próbáját**. Mérve *(18:20)*: a
**39335-ös porton semmi nem figyel** — a szerver épp nem fut. ⛔ Nem indítom el magamtól.

📌 Doksi: `__documentations/dev/LINKEDIN_POST_DRAFTS.md` · `SKILLS.md` ·
`current/linkedin/post-drafts/README.md`.

### 🎙️ A 14. TÉTEL — A HOSSZÚ HANGÜZENET VÉGE (2026-09-11 16:30)

> **Owner, 15:54 + 15:55 (élesben, KÉTSZER):** *„még mindig levágta az előző üzenetemnek a
> végét"* · *„Megint levágta a javításomat a végéről"*

#### 🔬 ELŐSZÖR MÉRTEM — a handoff kikötése szerint

**Alany:** a megőrzött 56,9 mp-es felvétel *(⭐ az 1. tétel nélkül ez a mérés lehetetlen)*.

| Próba | Eredmény |
|---|---|
| **felezés** | teljes fájl **295** kar · felezve **279 + 348 = 627** kar ⇒ a 2. fél szövege **egyáltalán nem** szerepel a teljes átiratban |
| **prefix-sorozat** | 15→148 · 25→252 · 28→280 · **30→295** · 32→295 · 40→295 · 56→295 ⇒ a határ **pontosan 30,0 mp** |
| **fejléc-kizárás** | a felvevő 22 369,6 mp-et állít, de **javított** fejléccel a válasz **karakterre azonos** ⇒ ⛔ nem a fejléc |

🔴 **A GYÖKÉR: a felismerő 30 másodperces ablaka**, hosszú-hang darabolás nélkül.

#### ⭐ AMIT A MÉRÉS KIZÁRT — és ez a legfontosabb következmény

| A handoff feltevése | Mérés |
|---|---|
| a **szegmentálás** *(`AfterSilence` 1000 ms)* | ⛔ **NEM** — a felvételek teljes hosszban a lemezen |
| a **felvevő** | ⛔ **NEM** — ugyanaz |
| a **felismerés utáni** út | ⛔ **NEM** — a csonka szöveg hiánytalanul bekerült a kötegbe |

🔴 ⇒ **A 9. tételben leszögezett beszéd-észlelést NEM kell megváltoztatni**, tehát **nincs
szükség owner-döntésre** róla. ⭐ Ezt **mérés** mondja ki, ⛔ nem feltevés.

#### 🔴 A KÉT VESZTESÉG KÜLÖN DOLOG — a handoff összevonta őket

A **23 „felismerés után elveszett"** megszólalás **mind 01-03 h és 13 h** között történt, és
**22 közülük a töltelék-szó-őr** elutasítása *(`„Thank you."` stb.)*. ⛔ **15:53/15:54-kor egy
sem.** ⇒ Az owner panasza **NEM** ez a 23 — az a **csonkolás**, ami ✅ **sikerként** számolt,
mert bekerült a kötegbe. ⚠️ Ezért **a 78%-os arány nem is látta**.

#### ✅ A JAVÍTÁS + IGAZOLÁS

≤28 mp-es darabok, **csendnél** vágva *(mért küszöb: 1502 keret, `p25=504`, a szünet 200 alatt)*,
az átiratok összefűzve. ⛔ **Az FDP AI-hoz nem nyúltunk** *(`fdp-ai-never-restart`)*.

| Felvétel | Előtte | Most |
|---|---|---|
| 56,9 mp | 295 kar | **641** kar *(3 részlet)* |
| **34,2 mp — a 15:53-as üzenet** | 299 kar | **445** kar *(2 részlet)* |
| 8,8 mp | 96 kar | 96 kar, darabolás nélkül — **változatlan út** |

🔴 **A DÖNTŐ BIZONYÍTÉK:** a 15:53-as üzenetből előkerült a hiányzó vég — az **évente ismétlődő
dominó-adategyeztetés** mondata, ⭐ pontosan az, amit az owner ezután **kétszer** próbált
megismételni.

**A technikai korlát KIMONDVA** *(a handoff kikötése)*: `🧩 N részletben ismerve (30 mp-es
ablak)` · `🔴 N részlet felismerése ELBUKOTT — a szöveg HIÁNYOS` · `⚠️ N vágás beszéd közben`.
📊 **A tölcsér új sora:** `🧩 darabolva ismerve (>30 mp)`.
⚠️ **Az átviteli arány ettől NEM javul** — mert a csonkolás soha nem is szerepelt benne; ezért
kellett a mérésnek **új sor**.

**Ellenőrzés:** CLI **1120/1120** · `tsc` tiszta · **pozitív kontroll ×3** *(darabolás
kikapcsolva → 13 bukás; hiány-jelzés elhallgatva → 1 bukás; töredék-számolás kikapcsolva → 2 bukás)* · `dc rev` **2397 → 2397**
*(0 új; a két új fájlon 0)* · `cv-*.ts` diff **üres**.

⚠️ **Két hibát a saját tesztem fogott meg:** (1) végig hangos hangnál a vágás a sáv elejére
esett *(5 mp veszteség darabonként)*; (2) a hiány-jelzést **kiszorította** az arány-őr indoklása.
Mindkettő javítva, teszt őrzi.

#### 🔬 A „B" ESET UTÓMÉRÉSE — a 23 megszólalás VALÓJÁBAN

A handoff szerint *„ez az a 23, amit meg kell menteni"*. ⚠️ **Megmértem: az olvasat téves.**
A megőrzött hang szerint mind a 12 `uncertain` felvétel **0,3-2,3 másodperces** *(légzés,
mondat-farok)*, amibe a felismerő `„Thank you."`-t hallucinált. ⛔ **Egyetlen elveszett
owner-mondat sincs köztük** — és 15:53/15:54-kor **egy sem** történt.

⇒ A töltelék-őr **jól dolgozik**. ⚠️ Viszont a **78%-os arány pesszimista**: a nevezőben 23
másodperc alatti töredék is benne van. ⭐ Ezért a tölcsér most **megnevezi** őket
*(`⏱️ ebből N a másodperc alatti töredék`)* — ⛔ de **nem vonja ki** az arányból: a metrikát
nem szépítjük.

📌 Doksi: `__documentations/dev/VOICE_LONG_AUDIO.md` · `SKILLS.md`.

### 🗓️ A 13. TÉTEL — MUNKANAPTÁR (2026-09-11 12:55)

> **Owner, 12:19:** *„a **munkanaptár** előre kerül."* 🔴 A mért ok: a 11:00-as mítingről a
> rendszer **csak azt tudta, hogy van** — kivel, miről, hol: semmi.

⭐ **EGY funkció, ahogy kérte:** `ma calendar today [--day <ISO>]` → kezdés, vége, cím,
helyszín/link, résztvevők. ⛔ **Nincs** írás, ismétlődés, felület, értesítés, naptár-egyesítés.

**A két kikötés, és hol teljesül:**

1. 🔴 **KIMONDOTT hiba, ⛔ nem üres lista** — `MA-CALENDAR-AUTH-REQUIRED` ·
   `MA-CALENDAR-SCOPE-MISSING` · `MA-CALENDAR-READ-FAILED`, és a **teendő a hibaüzenetben** van.
   ⇒ Az üres nap is **mondatot** kap: *„a naptár OLVASHATÓ volt, és a napon NINCS esemény."*
2. ⭐ **FORRÁS-FÜGGETLEN** — a szerződés **egy fájl**
   *(`cli/src/calendar/calendar-reader.contract.ts`)*. A nyitott owner-kérdés *(Google vagy
   Microsoft)* ezért **nem blokkolt**: a parancs felülete és a kimenet alakja azonos.

**Két MÉRT buktató, amit élő proba fogott meg:**

- 🔴 **A fiók neve `default`, ⛔ NEM `primary`** — `primary`-vel a parancs
  `MA-EMAIL-CONFIG-MISSING`-gel állt le. ⭐ A tévedés oka **névütközés**: a Google-oldalon a
  **naptár** azonosítója `primary`. **Teszt őrzi.**
- 🔴 **A scope bővítése a MEGLÉVŐ tokennek NEM ad jogot** — az élő proba pontosan ezt adta:
  `grantedScopes: gmail.readonly, gmail.send` / `missingScope: calendar.readonly`.
  ⭐ Ez **egyben a kikötés élő igazolása** is: a hiba **kimondott**, ⛔ nem üres nap.

**Igazolás:** CLI **1075/1075** · `tsc` tiszta · **pozitív kontroll ×2** *(regisztráció kivéve →
1 bukás; scope-ellenőrzés kivéve → 2 bukás)* · élő proba kilépési kóddal **1** ·
`dc rev` **2410 → 2397** *(a saját 13 találatomat javítottam)*.

⚠️ **Egy ismert találat marad:** `no-plain-function-export` a parancs-fájlon — ⭐ **mérve**,
ugyanez a találat **mind a 31 többi** parancs-fájlon rajta van. Egy fájlban eltérni **két
konvenciót** hozna ugyanabba a mappába ⇒ **owner/architektúra-szintű** döntés.

📌 Doksi: `__documentations/dev/WORK_CALENDAR.md` · `SKILLS.md`.

### 🗄️ A 9. tétel korábbi jegyzete — archív

**9. tétel *(a beszéd-észlelés leszögezése)*:** ⛔ **`transplant-not-rewrite`** — a `cv-*.ts`
fájlokon a `git diff` maradjon **ÜRES**. Két rész: **(1)** körbeírás
*(`__documentations/dev/`-be, **mért** értékekkel, ⛔ nem a kódból parafrazeálva)*, **(2)** a
viselkedést **kívülről** megfogó tesztek *(csend → nincs szegmens · folyamatos beszéd → egy
szegmens · beszéd-csend-beszéd → kettő · ZCR-en elbukó keretek kiszűrve)*.
**Mért kiindulás:** 37 fájl, 6 681 sor, **0 spec**.

### 🗄️ A 6. tétel korábbi jegyzete — archív

**6. tétel *(LinkedIn profil-frissítő felület)*:** ⚠️ **más domain** — a hang-vonal ezzel
lezárult. Az adat készen áll: `current/linkedin/profile-current.json` a mostani állapot; a
**javasolt** szöveget az asszisztens írja *(⛔ nem az én dolgom)*. A felületnek mezőnként kell
egymás mellé tennie a kettőt: **egy gomb = egy mező vágólapra** · karakterszám + LinkedIn-limit
*(headline 220 · about 2600)* · **„beillesztettem" pipa** mezőnként.

### 🗄️ A 4. tétel korábbi jegyzete — archív

**4. tétel *(szüneteltetés)*:** a sor-oldal **készen áll** *(`hold()` / `release()`, tesztelve)*.
Ami hátra van: a **jelforrás** — a megszólalás-észlelés már létezik
*(`onSpeechAttempt` → `MA-VOICE-SPEECH-DETECTED`)*, erre kell rákötni a `hold()`-ot, plusz egy
**türelmi idő** *(paraméter, 2-3 s, ⛔ nem beégetve)* a `release()`-hez.
🔴 **Amit MÉRNI kell előbb:** hogy a detektor **ne süljön el a saját felolvasásomra** — különben
végtelen szünetbe kerülünk. A handoff kikötése: *„ezt méréssel zárd ki, ne feltételezéssel"*.

### 🗄️ A 3. tétel korábbi „következő lépés" jegyzete — archív

**3. tétel *(darabolás)*:** a `voice-speech-text.ts` `prepareSpeechText` a 700 karakter fölötti
részt **eldobja** *(`„… A többi írásban."`)*. Mérve az owner üzenetein: 328 · 611 · 632 · 694 ·
1006 · **1441** karakter ⇒ kettő csonkult, a leghosszabbnak **több mint a fele** veszett el.
⇒ Csonkolás helyett **darabolás mondathatáron**, és a darabok a **sor** egyetlen tételeként
mennek be *(a csoport-garancia már megvan)*.

---

## 🗄️ A 2. TÉTEL RÉSZLETEI — archív

**1. lépés:** a mért gyökér már megvan —
`voice-speaker.ts:85` szerint ha a lejátszó **nem `Idle`**, a felolvasás
`spoken: false`-szal **elesik** *(„Épp szól valami")*. A `voice-read-aloud-watcher.ts`
`await`-el a `speak`-re, de a `speakInVoiceChannel` a `player.play()` **után azonnal** visszatér
⇒ nincs, ami megvárja a lejátszás **végét**. ⇒ A sornak az `AudioPlayerStatus.Idle`-re kell
várnia, ⛔ nem eldobni.

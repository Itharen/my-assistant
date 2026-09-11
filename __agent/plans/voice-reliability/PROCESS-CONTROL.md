# 🎛️ PROCESS-CONTROL — hang-csatorna megbízhatóság (+ LinkedIn profil-felület)

> 🔴 **NO-CACHE belépési pont.** Minden ébredéskor **frissen** olvasandó.
> **Feladat-leírások:** `__agent/DEV-HANDOFF.md` *(a 2026-09-11 01:20 / 01:24 / 01:30 / 01:33 /
> 01:55 / 02:00-as szakaszok)* — ⛔ a tartalmuk **nem másolódik ide**, itt csak az **állapot**
> és a **sorrend** van.
> **Ez a fájl az enyém (DEV).** A `DEV-HANDOFF.md` az asszisztensé — ⛔ oda nem írok státuszt.

**Létrehozva:** 2026-09-11 02:05 · **Utoljára frissítve:** 2026-09-11 16:30

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
| **11** | 📝 **POSZT-FELÜLET** — ⛔ MÉG NINCS megépítve | 🔟 11:00 (B) | ⬜ **HÁTRA** *(owner-sorrend: profil → **posztok** → üzenetek)* | — |
| **12** | 🔍 **A „mindenféle hiba"** — FELTÁRANDÓ | 🔟 11:00 (C) | 🟡 **EGY HIBA REPRODUKÁLVA ÉS JAVÍTVA**; a többi 🙋 owner-kapun | 2026-09-11 11:30 |
| **13** | 🗓️ **MUNKANAPTÁR** — `ma calendar today` *(EGY funkció)* | 1️⃣1️⃣ 12:25 | ✅ **KÉSZ** — CLI 1075/1075, élő proba; 🙋 1 lépés owner-kapun *(újra-engedélyezés)* | 2026-09-11 12:55 |
| **14** | 🎙️ **A HOSSZÚ HANGÜZENET vége levágódott** *(bemeneti szűk keresztmetszet)* | 1️⃣2️⃣ 15:54 | ✅ **KÉSZ** — mérve: a felismerő **30 mp**-es ablaka; 295→641 kar, CLI 1116/1116 | 2026-09-11 16:30 |

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

⭐ **Minden nyitott tétel owner-kapun áll:**

| Tétel | Mire vár | Mi oldaná fel |
|---|---|---|
| **14** *(hosszú hang)* | a **listener újraindulására** *(a futó példány még a régi kódot viszi)* | a következő LDP-ciklus / szerver-indulás — ⛔ nem indítom újra magamtól |
| **13** *(naptár)* | a **naptár-engedély** kiadására | `ma email auth --account default` — böngésző + az owner **kattintó** jóváhagyása |
| **11** *(poszt-felület)* | az owner **sorrendjére** *(profil → posztok → üzenetek)* | owner-jelzés, hogy jöhet |
| **12** *(„mindenféle hiba")* | a **konkrét hibaszövegre** | ⛔ nem javítok olyat, amit nem reprodukáltam |

⇒ A hurok lezárása: jelentés az `AGENT_BUS.md`-ben, ⛔ új ébredés NEM.

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

**Ellenőrzés:** CLI **1116/1116** · `tsc` tiszta · **pozitív kontroll ×2** *(darabolás
kikapcsolva → 13 bukás; hiány-jelzés elhallgatva → 1 bukás)* · `dc rev` **2397 → 2397**
*(0 új; a két új fájlon 0)* · `cv-*.ts` diff **üres**.

⚠️ **Két hibát a saját tesztem fogott meg:** (1) végig hangos hangnál a vágás a sáv elejére
esett *(5 mp veszteség darabonként)*; (2) a hiány-jelzést **kiszorította** az arány-őr indoklása.
Mindkettő javítva, teszt őrzi.

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

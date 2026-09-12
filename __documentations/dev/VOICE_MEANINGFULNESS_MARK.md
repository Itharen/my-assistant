# ⚠️ A ZAJ-SZŰRŐ VAK FOLTJA — magyarnak HANGZÓ halandzsa

**Mérve és megépítve:** 2026-09-12 · **Tétel:** 18. *(KÖZEPES)* · **Állapot:** ✅ kész,
⚠️ **részleges recall — kimondva** *(élesben a következő listener-indulástól)*

> **Owner, 2026-09-12 04:15:** *„Magyar szavak, magyar dallam, értelem nélkül ⇒ a 'nem magyar'
> feltétel nem fogja meg. A megkülönböztető jel NEM a nyelv, hanem az **ÉRTELMESSÉG**."*
> **KIKÖTÉS:** *„bizonytalanságnál **NE dobd el — JELÖLD MEG**, és én döntök. A hibás pozitív itt
> drága: egy valódi, de rosszul értett kérés veszne el."*

⇒ Ez a funkció **SOHA nem dob el semmit**: egyetlen dolgot ad, egy **jelölést** a szöveg mellé
*(a `⚠️ GYANÚS TAGOLÁS` mintájára)*. A `suspicious`/`isNoise` ágakhoz ⛔ nem nyúl.

---

## 🔬 A KORPUSZ

A megőrzött hang-archívum annotációi + a kötegbe jutott **beszéd**-tételek
*(`voice-archive/*.json` + `discord/delivered-inbound.jsonl`)*, jelölés-mentesítve, egyediesítve:
**279 egyedi beszéd-átirat**, ebből **207** magyarnak látszó *(a többit a 17. tétel szűrője viszi)*,
**177** legalább 8 tartalmi szóval. Felcímkéztem **6 halandzsát** *(köztük az owner két példáját)*.

## ⛔ AMIT MEGMÉRTEM ÉS ELVETETTEM — a negatív eredmények is eredmények

### 1. A felismerő saját bizonytalansága — 🔴 **NEM LÉTEZIK ezen a végponton**

A handoff szerint *„ez a legolcsóbb és legmegbízhatóbb jel, **ha a modell adja**"*. **Élőben
megmértem** egy archív felvétellel *(`POST /api/recognition`, a saját FDP AI-n)*:

```json
{"audio_category":null,"classification_confidence":null,"classification_result":null,
 "file_path":"…","message":"Audio processing completed successfully",
 "result":{"text":"you"},"status":"processed"}
```

⛔ **`confidence` nincs benne**, logprob sincs. Az OpenAI-kompatibilis `/v1/audio/transcriptions`
**API-kulcsot kér** *(`invalid_api_key`)*, ami nálunk nincs. ⇒ A feltétel **nem teljesül**.

> 🙋 **AMIT KÖZBEN TALÁLTAM — owner-döntés kell rá.** Ha a `skip_classification=1`-et **nem**
> küldenénk, a szolgáltatás **saját akusztikus osztályozót** futtat:
> `{"classification_result":{"category":"noise","confidence":0.8,"is_speech":false,…},
> "status":"classified_non_speech","transcription_skipped":true}`
> ⇒ Ez a **17. tétel** zaját a **felismerés ELŐTT** kiszűrhetné *(kapacitás-nyereség!)*. ⛔ Nem
> kapcsoltam be: a válasz ilyenkor **átirat nélkül** jön vissza *(„transcription_skipped")*, és a
> próbán a 0,32 mp-es minta mellé ezt írta: *„Audio too short for reliable classification"* ⇒ egy
> rövid, **valódi** megszólalás így **néma eldobássá** válhatna. Ez a `transplant-not-rewrite` és
> az `uncertain-requests` esete: **működő utat** érint ⇒ **owner-döntés**, nem agent-döntés.

### 2. Az `a`/`az` egyeztetés *(„az számolóban")* — 🔴 **MEGCÁFOLVA**

A valódi üzenetek **8-11%**-a is „sérti", mert az `az` **mutató névmás** is *(„meg az, hogy…",
„az volt, hogy…")*. A két halandzsa-példa ellenben **0/3** és **1/4**-et adott ⇒ a jel
**rosszabb, mint a véletlen**. ⛔ Nem került a szabályba.

### 3. Az ismeretlen-arány EGYEDÜL — 🔴 **NEM VÁLASZT EL**

| | arány |
|---|---|
| valódi beszéd-átirat *(177 db, ≥ 8 szó)* | medián **0,057** · p95 **0,174** · **max 0,250** |
| a 6 halandzsa | **0,125 – 0,375** |

⇒ **Teljes átfedés.** *(Ugyanaz a hibaosztály, mint a 17. tételnél a puszta hossz: a látszólag
kézenfekvő jel önmagában nem dönt.)*

---

## ✅ A SZABÁLY — a két feltétel EGYÜTT

```
ÉRTELMESSÉG-GYANÚ  ⇐  BESZÉDBŐL származó átirat
                   ÉS  ≥ 8 tartalmi szó
                   ÉS  ismeretlen-arány ≥ 0,22
                   ÉS  legalább 3 ismeretlen szó
```

| Küszöb | A MÉRT horgony |
|---|---|
| **≥ 8 tartalmi szó** | rövidebbnél az arány zajos *(3 szóból 1 ismeretlen = 0,33)* |
| **arány ≥ 0,22** | a valódi átiratok **p95-je 0,174** ⇒ a küszöb fölötte van |
| **ismeretlen ≥ 3** | 🔴 **EZ ADJA A NULLA HAMIS JELÖLÉST**: az **egyetlen** valódi átirat, ami átlépi az arány-küszöböt *(0,250 — „Úgy látom, CCAT lett, de valójában az egy félre hallás, CCAP.")* mindössze **2** ismeretlen szót tartalmaz ⇒ kiesik. A két elkapott halandzsa **3** és **4**-et |

⭐ **Csak BESZÉDBŐL:** a **gépelt** üzenetre ⛔ nem fut *(azt az owner írta, ott nincs félrehallás)*.
A mérés ezt is igazolta: a gépelt szövegek adták a legtöbb hamis jelöltet *(elírások: „eldabom",
„beconfifolni")*.

## 📚 A LEXIKON — `cli/data/hu-lexicon.txt` *(generált, git-trackelt)*

```
PYTHONUTF8=1 python scripts/build-hu-lexicon.py     # 338 md-fájl ⇒ 15 953 szó
```

A repó saját markdown-jaiban *(`current/`, `__documentations/`, `__specifications/`)* **legalább
kétszer** előforduló szavak, kisbetűsítve és **ékezet-lebontva**.

| Döntés | Miért |
|---|---|
| ⛔ **NEM az átiratokból** | a halandzsa-szavak *(„fysisz", „szipotékig")* **önmagukat legitimálnák** |
| ⛔ **NEM az `__agent/`-ből** | a handoff és a napló **IDÉZI** a halandzsát ⇒ ugyanaz a szennyezés |
| ⭐ **gyakoriság ≥ 2** | **Mérve:** a ≥2-es szűrés a valódi arányt 0,000→0,057 mediánra tolta, a halandzsát 0,200→**0,375**-re ⇒ ⭐ **széthúzta** a kettőt |
| ⚠️ **prefix-egyezés (5-8 karakter)** | a magyar **agglutinál**: *„számolóban"* nincs benne, *„számoló"* igen. Szándékosan **megengedő** — a fölösleges jelölés a drágább hiba |
| ⭐ **fail-open** | ha a fájl nem olvasható, **minden szó ismert** ⇒ ⛔ nincs jelölés. A fordítottja MINDEN átiratot megjelölne |

---

## 📊 AMIT EZ TUD, ÉS AMIT NEM — visszamérve az ÉLES kódon

Lefuttatva a lefordított modult a teljes korpuszon *(279 egyedi beszéd-átirat)*:

| | Érték |
|---|---|
| 🔴 **hamis jelölés a valódi MAGYAR átiratokon** | ⭐ **0** *(a ma éjjeliekre is: 0)* |
| elkapott halandzsa | ⚠️ **2 / 6** — köztük az owner **első** példája *(„A pro fysisz per lágrában", arány 0,375)* |
| kimaradó halandzsa | 🔴 **4 / 6** — köztük a **másik** owner-példa *(„…hátulágiakban… szipotékig…", arány 0,125, 2 ismeretlen szó)* |
| ⭐ **ráadás**: hosszú, **idegen nyelvű** zaj | **5** tétel megjelölve *(finn, olasz, angol, „-Oksu?" ×29)* — pontosan az a sáv, amit a 17. tétel szűrője **szándékosan** átenged |

🔴 **A RECALL SZÁNDÉKOSAN ALACSONY.** A mért átfedés miatt **nincs** olyan szöveg-statisztikai
küszöb, ami a 6-ból többet fog meg hamis jelölés nélkül. A legjobb magasabb-recall változat
*(arány ≥ 0,22 **VAGY** ismétlődő ismeretlen szó)* **3/6**-ot ad, de **4 valódi** átiratot is
megjelöl. ⇒ A szűkebbet választottam, mert az owner **„egy sem"**-et kért a valódiakra.
🙋 **A tágítás owner-döntés** — a számok itt vannak hozzá.

⭐ **Ami a maradék 4-et is megfogná:** egy **értelmesség-ítélet helyi LLM-mel** *(a saját FDP AI
`/api/v1/chat/completions`-je, 38 modell)*. ⛔ Nem építettem meg: a végpont **modell-betöltést**
igényel *(üres `model` mellett 500-at ad)*, és ugyanazon az éjszakán a gép **100,5/127 GB**-on
állt a nyitott mikrofon miatt — egy **jelölő** funkcióért ⛔ nem teszek 7B modell-betöltést az STT
útjába. 🙋 Ez is owner-döntés.

## 🏷️ HOGY NÉZ KI A JELÖLÉS

```
[🎙️ gépi átirat · ⚠️ ÉRTELMESSÉG-GYANÚ — 3 ismeretlen szó a 8 tartalmi szóból (38%, küszöb: 22%):
fysisz, lagraban, ertik. Lehet, hogy ez a környezet beszéde volt, NEM az owner kérése.
⛔ NEM dobtam el: ha valódi kérés, szólj és cselekszem.]
A pro fysisz per lágrában. Én mindig a szóvaló értik a szóval.
```

⭐ **A címzett KETTŐ:** a sessionnek azt kell tudnia, hogy ⛔ ne cselekedjen magabiztosan rá; az
ownernek azt, hogy a szöveg **megvan** és ⛔ nem veszett el. Ezért a jelölés a **teendőt** is
kimondja.

## A rétegek

| Fájl | Mit tesz |
|---|---|
| `cli/src/stt/stt.meaningfulness.ts` | ⭐ **a szabály** + a lexikon-betöltő *(nem exportált belső osztály)* |
| `cli/data/hu-lexicon.txt` | a **generált** szótár *(15 953 szó)* |
| `scripts/build-hu-lexicon.py` | az újragenerálás |
| `cli/src/stt/stt.flags.ts` | a jelölés bekötése — **egy** ponton, így a hangüzenet- ÉS a hang-csatorna-út is kapja |

## 📊 Igazolás

| Ellenőrzés | Eredmény |
|---|---|
| CLI-tesztek | **1231 / 1231** zöld *(+8 új spec, köztük POZITÍV KONTROLL + fail-open)* |
| `tsc --noEmit` | tiszta |
| Visszamérés az **éles** kódon | **279 átirat** ⇒ **0** hamis jelölés a valódi magyarokon |
| `dc rev` | **2404 → 2404** — ⭐ **0 új találat** |

🔇 **A HÉTVÉGI KIKÖTÉS BETARTVA:** ⛔ nulla élő hangszóró-kísérlet, ⛔ egyetlen üzenet sem ment az
ownernek. Az FDP AI-t **csak használtam** *(két archív felvétel felismerése)* — ⛔ nem indítottam
újra, nem állítottam le, modellt nem töltöttem be.

---

## 🎮 A 20. TÉTEL (2) — AZ ELSŐ ÉLES TALÁLAT HAMIS POZITÍV VOLT (2026-09-12 05:31)

Az értelmesség-őr **élesbe állt**, és rögtön megjelölt egy **valódi** owner-üzenetet:

```
⚠️ ÉRTELMESSÉG-GYANÚ — 14 ismeretlen szó a 45 tartalmi szóból (31%, küszöb: 22%):
   timberborn-ban, dyson, sphere-ben, settlers, dyson
```

⇒ Az „ismeretlen szavak" **mind JÁTÉKCÍMEK**; az üzenet *(„a Timberborn-ban, a Dyson Sphere-ben, a
Mini Settlers…")* teljesen valódi volt.

> **Owner:** *„NAGYON JÓL csináltad, hogy **MEGJELÖLTED és NEM dobtad el** — ez maradjon is így.
> A javítás **NE a küszöb emelése** legyen, hanem **tulajdonnév-mentesség**."*

### ✅ A JAVÍTÁS — KÉT jel, ⛔ a küszöb VÁLTOZATLAN *(0,22)*

```
(1) MONDAT KÖZBEN nagybetűs szó  ⇒  tulajdonnév, NEM „ismeretlen"     — gép-független
(2) a SZEMÉLYES név-szótár       ⇒  játék- és termék-nevek ismertek   — bő ráhagyást ad
```

⚠️ **A MONDAT ELSŐ SZAVA ⛔ NEM tulajdonnév:** ott a nagybetű kötelező, tehát semmit nem mond a szó
fajtájáról. Ha azt is felmentenénk, **minden mondat-kezdő halandzsa** ingyen átmenne — erre teszt van.

### 🔬 A MÉRÉS — 211 valódi beszéd-átirat + a 2 felcímkézett halandzsa

| Változat | az owner játék-üzenete | halandzsa elkapva | hamis jelölés |
|---|---|---|---|
| **előtte** *(éles)* | 🔴 **MEGJELÖLVE** *(0,311)* | 2/2 | **1** |
| + nagybetűs szabály | ⭐ nincs jelölés *(0,200)* | 2/2 | **0** |
| + személyes név-szótár | ⭐ nincs jelölés *(0,156)* | 2/2 | **0** |

⭐ **MINDKETTŐ BENNE VAN, és ez szándékos:** a nagybetűs szabály **mindig** működik, de csak
0,200-ra viszi le az arányt — **vékony** ráhagyás a 0,22-es küszöbhöz. A név-szótár 0,156-ra viszi
*(bő ráhagyás)*, ⚠️ de **személyes fájlokra** épül, amik ⛔ nem biztos, hogy léteznek.

### 🎮 A SZEMÉLYES NÉV-SZÓTÁR — csak OLVASVA, ⛔ a repóba SOHA

| Fájl | Mit ad |
|---|---|
| `~/.config/my-assistant/steam/appdetails-cache.json` | **120** játéknév |
| `~/.config/my-assistant/steam/installed-games.md` | a **360** telepített játék neve |
| `~/.config/my-assistant/steam/owned-played-games.md` | a játszott játékok |

⇒ **539 név / 446 egyedi ⇒ 609 szó-töredék**, és a lexikon **15 953 → 16 423** szóra nőtt.
⚠️ **A HÁROM FÁJL SZEMÉLYES ÉS GITIGNORÁLT** *(az owner kikötése)*: ⛔ a tartalmuk **nem** kerül a
repóba, csak **olvassuk** — és ha nincsenek, ⛔ **nem hiba** *(a nagybetűs szabály akkor is él)*.
⭐ A `steamapps` könyvtárakat ⛔ **nem** keressük: a 360 név **már benne van** az `installed-games.md`
táblájában *(amit az asszisztens-oldal állít elő)* ⇒ gép-független út.

### 📊 VISSZAMÉRÉS az ÉLES kódon — 282 egyedi beszéd-átirat

| | |
|---|---|
| 🔴 hamis jelölés a valódi **magyar** átiratokon | ⭐ **0** *(a játék-üzenet ⛔ nincs többé megjelölve)* |
| elkapott halandzsa | **2 / 6** *(változatlan — ⛔ a mentesség nem gyengítette)* |
| ⭐ ráadás: hosszú, **idegen nyelvű** zaj | **5** tétel megjelölve *(változatlan)* |

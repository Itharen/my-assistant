# Fejlesztés után KÖTELEZŐ ellenőrzés — tényleg újraindult-e

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-09-07 — a szabály

> Ha fejlesztéseket végzel a My Assistant projekten, utána mindenképpen ellenőrizned kéne,
> hogy megfelelően újraindult-e, illetve az LDP-nek elméletelek úgy kéne működnie, hogy a
> szervert mindig futásban tartja, és csak akkor indítja újra, amikor már minden teszt és
> build és egyéb sikeresen lezárult.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### A szabály

**Minden `my-assistant` fejlesztés után ellenőrizni kell, hogy a rendszer tényleg újraindult
és él** — nem elég, hogy a commit megtörtént és a tesztek zöldek voltak.

| # | Mit nézünk | Mivel |
|---|---|---|
| 1 | Lefutott-e a pipeline, **zölden** | `logs/live-dev-pipeline/status.json` → `pipelineComplete` + a lépések |
| 2 | Él-e a **szerver** | a szerver-port **valóban** figyel-e |
| 3 | Élnek-e a **figyelők** | Discord-életjel **frissesége** + jelenlét-minta frissesége |
| 4 | Ép-e a **csatorna** | `ma comm doctor` |

⛔ **Egyik sem helyettesíti a másikat.** A „zöld pipeline" nem jelenti, hogy a szerver
felállt; az „elindítottam" nem jelenti, hogy fut.

---

### 🔴 A MÉRÉS, ami egy TÉVES ÁLLÍTÁSOMAT is megdöntötte (2026-09-07 07:02)

Az LDP **már pontosan úgy működik**, ahogy az owner elvárja. Mérve, futó pipeline közben
*(`tsc-agent-handlers` fázis)*:

```
status.json  →  "serverRunning": false ,  "restartPending": true
DE:
  szerver-port 39335        →  ÉL
  Discord-figyelő életjel   →  07:02:31   (friss)
  jelenlét-minta            →  07:02:36   (friss)
```

⇒ **A szerver VÉGIG FUT a build alatt**, és csak a pipeline sikeres lezárása után indul újra.

### ⚠️ Amit ÉN rontottam el

Többször állítottam — és **döntést hoztam rá** —, hogy *„a build alatt áll a Discord-csatorna,
ezért nem nyúlok a kódhoz"*. **Ez téves volt.**

**Az ok:** a `status.json` **`serverRunning: false`** mezőjét úgy olvastam, hogy a szerver nem
fut. Valójában az az **LDP belső jelzése** *(„a szerver újraindítása még hátravan ebben a
körben")* — **nem a szerver valós állapota**.

> 🔴 **A tanulság:** egy állapot-mező NEVE nem a jelentése. Amit egy másik rendszer belső
> mezőjéből olvasok ki, azt **a valóságon kell ellenőrizni** *(port, életjel)* — különben a
> saját következtetésemre építek döntést.

*(Ez ugyanaz a hibaosztály, mint a `sent: true` ≠ „megkapta" — csak most befelé.)*

### Következmény

A `--file` javítás halasztásának **indoka megszűnt**: a kód módosítása **nem vakítja meg** a
csatornát. A ~23 perces pipeline alatt a szerver és mindkét figyelő **fut**; csak a legvégén
van egy rövid újraindulás.

---

## 🔴 A VÉGPONTTÓL VÉGPONTIG PRÓBA NEM LUXUS — 2026-09-07, három mért lebukás

Egyetlen munkamenetben **három** hiba került elő úgy, hogy a típusellenőrzés és **minden teszt
zöld volt**. Egyiket sem lehetett volna olvasással megtalálni.

| # | Mi volt | Miért nem fogta meg semmi |
|---|---|---|
| 1 | A relay-lehúzó `Authorization: Bearer`-t küldött, a relay `x-ma-relay-token`-t olvas | a két oldal **külön fordul**, és külön-külön **helyes** volt |
| 2 | Az `nginx -t` „syntax is ok"-ot mondott — a **saját alapértelmezett** configjára | a parancs **lefutott**, csak nem azt vizsgálta, amit hittem |
| 3 | A helyzet-tár a `build/` alá került volna, amit minden fordítás **letöröl** | a útszámolás forrásból futva **jó**, fordítva **rossz** |

### A három szabály, ami ebből következik

⭐ **1. A szerződést a MÁSIK OLDALON kell megnézni.** A fejléc-név, a mezőnév, a válasz alakja —
ezekre a **szokásból következtetni** tilos. Egy „mindenki így csinálja" feltevés pontosan
addig működik, amíg a másik oldal is így csinálja.

⭐ **2. „A parancs lefutott" ≠ „azt vizsgálta, amit hittem".** A csatolás nem érvényesült, a
`cd` nem oda vitt, a build elavult volt — mindhárom **sikeres kimenetet** adott. ⇒ Egy
igazolás **első lépése** annak bizonyítása, hogy a **helyes bemeneten** dolgozik
*(listázd ki a fájlokat, nézd meg a `pwd`-t, nézd meg a build idejét)*.

⭐ **3. Ami forrásból fut, az még nem fut fordítva is.** Minden útvonal-számolás, ami a kód
**saját helyéből** indul (`import.meta.url`, `__dirname`), **elrendezés-függő** — és élesben
más az elrendezés. A tartós adat helyét **soha ne a kód helyéből** számold.

---

## 🔴 A ZÖLD TESZT ELTAKARJA A BUKOTT FORDÍTÁST (mérve 2026-09-08 08:23)

A `tsc ; jasmine` láncnál a **kilépési kód a LÁNC UTOLSÓ tagjától** jön. Ha a fordítás
bukik, de a tesztek a **régi `dist`-en** lefutnak, a futás `exit 0`-t ad és
`„635 specs, 0 failures"`-t — miközben a forrás **le sem fordult**.

**Mért eset:** a `comm.doctor.ts`-ben maradt egy fölösleges `}`. A háttérfutás `exit 0`-t
jelentett és zöld tesztet — én ezt **zöldnek olvastam**. Közben:

| Ami történt | Amit láttam |
|---|---|
| `error TS1128: Declaration or statement expected` | — *(a kimenet közepén, a „0 failures" ELŐTT)* |
| a tesztek a **korábbi** `dist`-en futottak | `643 specs, 0 failures` ✅ |
| 🔴 az **LDP FATÁLISAN elszállt** ugyanettől a fájltól | `tsc-cli failed (fatal)` |

⚠️ A legárulkodóbb jel nem a kilépési kód volt, hanem hogy **az LDP haldoklott** — azaz a
valóság már mondta az igazat, miközben a saját futásom megnyugtatott.

### A szabály

⛔ **A `exit 0` a láncolt build+teszt végén NEM bizonyíték.** Kötelező:

1. A **fordítás kimenetét külön nézd meg** — `grep "error TS"`, ne csak a `tail`-t.
   *(A `tail -6` pont azt vágja le, ami számít: a fordítási hiba a lista elején áll.)*
2. Vagy válaszd szét: előbb `tsc`, és **csak zöld fordítás után** `jasmine`.
3. ⭐ **A teszt-darabszám is jelzés:** ha új tesztet írtál és a szám **nem nőtt**, a te
   fájlod **le sem fordult**. Ez a legolcsóbb ellenőrzés, és nem hazudik.

📌 **Ugyanaz a hiba-osztály, mint a `ma comm voice-funnel`-nél:** 593 zöld teszt és zöld
`tsc` mellett a parancs **nem létezett futásidőben**. A zöld jelzés és a **működő rendszer**
két különböző állítás.

### Kapcsolódó

- `current/principles/ldp-default-runtime.md` — az LDP a default futtatási mód
- `__agent/ENTRY.md` §0 — a napindítási újraindítás és a kivétele
- `current/principles/error-handling.md` — a néma hiba tiltása

---

## 🔴 2026-09-09 00:20 — A HIBA A NÉMASÁGBAN VOLT, NEM A FUNKCIÓBAN

**Az owner élő tesztje a hang-csatornán:** *„ha működik, akkor semmilyen hangvisszajelzést nem
kapok jelenleg."*

**Ami valójában történt:** a hangjelzések **megvoltak, be voltak kötve, és megpróbáltak
megszólalni.** A napló ki is írta:

```
MA-VOICE-CUE-FAILED: A hangfájl NEM található:
  …\my-assistant\src\_assets\sounds\cue-unsure.mp3
```

A fájl a **`cli/src/_assets/sounds/`**-ban van. A `resolveSoundsDir()` `process.cwd()`-t
használt ⇒ **a hangok helye attól függött, KI indította a figyelőt**:

| Indító | `cwd` | Eredmény |
|---|---|---|
| szerver (`SupervisedChild`) | `…/my-assistant/cli` | ✅ szólt |
| kézi `ma comm listen` a gyökérből *(én, 21:15)* | `…/my-assistant` | 🔴 **néma** |

### ⭐ A TANULSÁG — miért nem vettük észre HÁRMAN sem

| Ki | Mit látott | Miért nem tűnt fel |
|---|---|---|
| **Az owner** | csend | azt hihette, **meg sem épült** |
| **Én** | „minden zöld" | a beszéd átment, az átirat elkészült — a **fő út működött** |
| **A rendszer** | `MA-VOICE-CUE-FAILED` | **naplózta**, csak senki nem **kérdezte meg** |

🔴 **A hiba tökéletesen elrejtőzött**, mert a **mellék-funkció** bukott, miközben a **fő
funkció** hibátlan volt. Az `onError` nem hallgatott el semmit — a **figyelem** hiányzott.

📌 **Amit ebből viszek:** ha az owner azt mondja *„X nem működik"*, és a fő út mérhetően jó,
az **első** lépés a **napló célzott lekérdezése X-re** — ⛔ nem a kód olvasása, és ⛔ nem a
„nálam működik". Ma ez **egyetlen `grep`** volt, és azonnal megadta a választ.

⚠️ **És egy önkritika:** a némaságot **én okoztam** azzal, hogy 21:15-kor a repó gyökeréből
indítottam a figyelőt kézi tartalékként. A `cwd`-függő útvonal **eleve törékeny volt** — de a
kiváltó ok az én indításom. ⇒ A javítás nem „az én hibám elfedése", hanem a **törékenység
megszüntetése**: a `cwd` mostantól **nem számít**.


---

## 🔴 A 404 NEM BIZONYÍTÉK — kitalált URL-lel „hiányzó" route-ot mértem (2026-09-11 12:05)

**Mi történt:** az owner nem találta a LinkedIn-panelt. Lekértem a `/api/linkedin/profile`-t →
`Unknown API endpoint` ⇒ **azt a következtetést vontam le, hogy a futó szerverből hiányzik a
route**. A DEV jelentése ugyanebbe az irányba mutatott *(„a futó példány még a régi kódot viszi")*,
és ez **megerősítette** a téves képet.

🔴 **Hamis volt.** A valódi végpont neve `/api/linkedin/**profile-update**`
*(`linkedin-profile.controller.ts:64`)* — és **élőben tökéletesen működik**:
`hasProposal: true`, 2 változó mező, 0 limit-túllépés.

### A HIBA SZERKEZETE — ezért fontos

```
kitalált URL  →  404  →  „nincs ilyen route"  →  „a szerver régi kódot visz"
     ⛔             ✅            ⛔                        ⛔
```

⚠️ **Csak a középső lépés volt mérés.** A többi **következtetés** — és mindegyik a **saját
hipotézisemet** erősítette. ⭐ Pont az a hibaminta, amit a `core-no-guessing` tilt: a 404-et
**bizonyítéknak** vettem, holott az **kétértelmű** *(nincs route **VAGY** rossz URL-t kértem)*.

### ✅ A RECEPT — az endpointot a KÓDBÓL kell venni, nem fejből

```bash
grep -n "endpoint:" <controller>.ts        # ⭐ a route-mount + az endpoint EGYÜTT adja az utat
curl -s "http://<host>/api/<mount><endpoint>"
```

📌 **És egy második őr:** ha egy 404-ből „hiányzó funkcióra" következtetnék, előbb **kérdezzek le
egy BIZONYÍTOTTAN létező** végpontot ugyanabból a modulból. Ha az is 404-et ad, a **modul** hiányzik;
ha nem, akkor **én tévedtem az útvonalban**.

⚠️ **Mennyibe került volna:** majdnem azt jelentettem az ownernek, hogy a szerver elavult kódot
futtat — miközben a panel, amit keresett, **működött**.


---

## 🔴 A SZÁMLÁLÓ NEM JELENTÉS — a „23 elveszett megszólalás" félreolvasása (2026-09-11 16:39)

**Mit írtam a handoffba** *(15:54)*: *„a veszteség zöme NEM a felvevőnél van, hanem a felismerés
UTÁN (23 vs. 4). **Ez az a 23, amit meg kell menteni**."*

🔴 **A DEV megmérte, és az olvasatom téves volt.** A megőrzött hang megmondta, mi volt bennük:
mind **0,3-2,3 MÁSODPERCES** töredék *(légzés, mondat-farok)*, amikbe a felismerő *„Thank you."*-t
hallucinált. **Egyetlen elveszett owner-mondat sincs köztük** — és **15:53/15:54-kor**, amikor az
owner panaszkodott, **egy sem történt** közülük.

⇒ A valódi ok **máshol** volt: egy **30 másodperces ablak** vágta el a hosszú hangüzenetet.

### A HIBA SZERKEZETE — ugyanaz a család, mint a 404-nél

```
funnel-számláló  →  „23 elveszett"  →  „23 elveszett MONDAT"  →  „ezt kell megmenteni"
      ✅                  ✅                    ⛔                        ⛔
```

⚠️ **A szám igaz volt. A JELENTÉSE nem.** Egy számláló azt mondja meg, **hány** — ⛔ soha nem azt,
**mi**. Én a kettőt egy lépésben összevontam, és **irányt adtam** vele a fejlesztésnek: majdnem
a **rossz ágon** kezdtünk volna keresni.

### ✅ A RECEPT

📌 **Mielőtt egy metrikára tervet építek, nézzem meg a MINTÁT mögötte.** A megőrzött nyers anyag
*(a hang-vonal 1. tétele!)* pontosan ezért készült — ⭐ **ez a befektetés ma fizetett vissza**:
nélküle a „23 elveszett mondat" **cáfolhatatlan** lett volna.

⛔ **És a metrikát ilyenkor sem szépítjük:** a DEV a töredéket **megnevezte**, de ⛔ **nem vonta ki**
az arányból *(`❌ felismerés után elveszett … 23 ⏱️ ebből 23 a másodperc alatti töredék`)*.
⭐ **A helyes javítás a LÁTHATÓVÁ TÉTEL, nem a szám javítása.**

🔗 `2f0503a` *(a megnevezés)* · `95ef2a4` *(a valódi ok: a 30 mp-es ablak)*

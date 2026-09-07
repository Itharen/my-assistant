# CAPABILITY CATALOG — mit tud Honnie megcsinálni

> **Owner (2026-09-07):** *„el kell kezdjünk felvenni egy listát, hogy mi az, amit te meg
> tudsz csinálni nekem… Már van egy pár képesség, de azokat majd apróvolom még, hogy
> elfogadhatók-e. szépen sorba vesszük, ugye a kommunikáció az alap, velem kommunikálsz az
> alapvetően nem képesség lesz, hanem a baseline."*

> ⛔ **EGY KÉPESSÉG NEM LÉP MŰKÖDÉSBE ATTÓL, HOGY MEGÉPÜLT.** A státuszt **a user** adja.
> Amíg `⏳`, addig **kérdezni kell** használat előtt; `⛔`-t egyáltalán nem használunk.

---

## Státuszok

| Jel | Jelentés | Mit szabad |
|---|---|---|
| ✅ | **Jóváhagyott** | szabadon használható, üresjáratban is |
| ⏳ | **Jóváhagyásra vár** | megvan/megépült, de használat előtt **kérdezni kell** |
| 📝 | **Javaslat** | még nincs megépítve; ötlet-szinten |
| ⛔ | **Elutasított / nem engedélyezett** | nem használható |

---

## 0️⃣ BASELINE — nem képesség, hanem alapfelszerelés

⛔ Ezek **nem** kerülnek jóváhagyás alá, és sosem „kapcsolhatók ki".

| Mi | Hol |
|---|---|
| Kommunikáció a userrel (Discord oda-vissza, session, hangszóró a kapun át) | `cli/src/discord/`, `ma comm` |
| Állapot-tartás, naplózás, dokumentálás | `__agent/log/`, `current/`, `__documentations/` |
| Önellenőrzés (`ma comm doctor`) | `cli/src/comm/comm.doctor.ts` |

---

## 1️⃣ ASSZISZTENSI KÉPESSÉGEK

### 🥇 Kiemelt terület — IDŐBEOSZTÁS

> **Owner:** *„Az első üdleges feladataid között az lesz, hogy segíts nekem az
> időbeosztásban folyamatosan."*

| # | Képesség | Státusz | Mit csinál | Hol |
|---|---|---|---|---|
| C-01 | **Esemény-előkészítés** | 📝 **javaslat** | Közelgő eseményhez: hol lesz, hogy jutok oda, mennyi idő, mikor kezdjek készülődni, mit vigyek | `flows/recurring/schedule-guardian/` |
| C-02 | **Készülődés-riasztás** | 📝 **javaslat** | Időben szól, hogy „most kezdj készülődni" — a preferált csatornán | ugyanott |
| C-03 | **Napi/heti időbeosztás-áttekintés** | 📝 **javaslat** | Mi jön ma / a héten, hol vannak ütközések, hol van szűk az idő | ugyanott |

⚠️ **Mindhárom `❓ NYITOTT` adatokra vár** (készülődési idők, közlekedési preferenciák,
mit visz magával) — lásd `current/open-questions.md` I) szekció. **Ezeket nem találjuk ki.**

### Meglévő, már megépült képességek

| # | Képesség | Státusz | Mit csinál | Hol |
|---|---|---|---|---|
| C-10 | **Státusz-kivonat** | ⏳ | Hiteles kivonat: elmúlt / egy órán belül / ma / dátum nélküli magas prioritású | `ma status digest` |
| C-11 | **Óránkénti tick** | ⏳ | Átnézi a helyzetet, eldönti miről és melyik csatornán szóljon | `flows/recurring/hourly-assistant-tick/` |
| C-12 | **Hangszórós bemondás** | ⏳ | TTS a Google Home-ra — **csak ébren + itthon** | `ma cast notify` |
| C-13 | **Feladat-kezelés (organizer)** | ⏳ | Feladat felvétele / lezárása / listázása az organizerben | `fo tasks.*` |
| C-14 | **Napló (diary)** | ⏳ | Napi bejegyzések vezetése | `current/diary/` |
| C-15 | **Interfood rendelés-előkészítés** | ⏳ | Menü-szinkron, rangsor, kosár-javaslat, readback | `flows/on-demand/interfood-ordering/` |
| C-16 | **LinkedIn inbox-átnézés** | ⏳ | Üzenetek triázsa, válasz-tervezetek | `flows/on-demand/linkedin-inbox-review/` |
| C-17 | **Bevásárlólista / készlet** | ⏳ | Bolt-típus szerinti listák, újrarendelési küszöbök | `current/principles/shopping-lists.md`, `stock-system.md` |
| C-18 | **Hónapzárás** | ⏳ | Havi összegzés | `flows/on-demand/month-closing/` |
| C-19 | **Alvás-ciklus követés** | ⏳ | Csúszó 18h/8h ciklus, bedtime-emlékeztető | `current/principles/sleep-system.md` |
| C-20 | **Fit / health rutinok** | ⏳ | Séta, Gellért-hegy, napi 3× arcmosás | `current/principles/fit-system.md`, `health-system.md` |

---

### Kommunikáció-megbízhatóság (a baseline MEGERŐSÍTÉSE)

> Owner: *„az üzeneteid nem mindig jutnak el hozzám, illetve lehet, hogy el-elúsznak"*

| # | Képesség | Státusz | Mit csinál | Hol |
|---|---|---|---|---|
| C-40 | **Nyugta-követés** | 📝 **javaslat** | A fontos üzenet „nyugtázandó"; ha nincs rá reakció, ismétlés/eszkaláció | ❓ tervezendő |
| C-41 | **Postaláda** *(perzisztens „neked szánt info")* | 📝 **javaslat** | Ami nem üzenet, az nem tud elúszni — bármikor átnézhető lista | ❓ tervezendő |
| C-42 | **Küldés utáni visszaolvasás** | 🔴 **SÜRGŐS** | Küldés után visszaolvassa a csatornát és **hossz-egyezést** ellenőriz. ⭐ Ez fogta meg a 09-07-i csonkolási incidenst | `INCIDENT-2026-09-07-…` |
| C-43 | **`ma comm say --file`** | 🔴 **SÜRGŐS** | A szöveg fájlból jön ⇒ a shell/burkoló soha nem látja, nem tudja elvágni | `cli/src/commands/comm.command.ts` |
| C-44 | **Konzol-log sor** | 📝 **javaslat** | Egysoros, folyamatos állapot-kiírás a konzolra: ránézésre látszik, mi történik a rendszerben. Owner-kérés 2026-09-07 | ❓ tervezendő |

⚠️ Mindkettő `❓ NYITOTT` kérdésekre vár — `open-questions.md` **K)**.
Elv: `current/principles/message-delivery-reliability.md`.

---

## 2️⃣ FEJLESZTÉSI KÉPESSÉGEK

> **Owner:** *„sokszor fogok fejlesztési munkákat is kérni, bár az főként projektem belül
> kéne maradj"*

| # | Képesség | Státusz | Megjegyzés |
|---|---|---|---|
| C-30 | **Fejlesztés a `my-assistant` projekten belül** | ✅ **jóváhagyott** | a user rendszeresen kéri; LDP alatt |
| C-31 | **Fejlesztés a projekten kívül** | ⛔ | csak külön kérésre, esetileg |
| C-32 | 🚫 **ORKESZTRÁCIÓ — feladat átadása másoknak** | ⛔ **NEM JÓVÁHAGYOTT** | *„az egyelőre még nem approve-olt"* — külön megbeszélést igényel |

### Hang-képességek (importálandó a régi CCAP-ból)

> Owner, 2026-09-07: *„a régi CCAP-ból ki kéne emelni a hangfelismerést, beszédfelismerést,
> illetve beszédet, feldolgozásokat… Szeretném azt is, hogy tudjál voice üzenetet olvasni,
> meg hogy tudjunk beszélni egy voice channelon."*

| # | Képesség | Státusz | Megjegyzés |
|---|---|---|---|
| C-33 | **Voice üzenet olvasása** (STT) | 📝 **javaslat** | Hangüzenet → **saját STT (FDP AI**, fut a gépen) → ⭐ **TÜKÖR-ÜZENET** vissza (lássa, jól értettem-e) → utána válasz + feldolgozás |
| C-34 | **Beszélgetés voice channelen** | 📝 **javaslat** | kétirányú hang a Discord voice channelen |
| C-35 | **STT/TTS kiemelése a régi CCAP-ból** | 📝 **javaslat** | ez a C-33/C-34 előfeltétele — organizerben felvéve feladatként |

> **Owner, 2026-09-07:** *„STT-hez általában a saját rendszert szoktuk használni, most is fut
> a gépen. FDP AI-ként szerepel sok-sok kódban. egy voice üzenetet neked ide ebből a
> sessionbe azt feldolgozzuk az STT-vel és ilyenkor egyrészt egy mirror üzenetet is kéne
> küldjél, hogy lássam, hogy jól olvastad fel másrészt pedig utána arra is válaszolhatnád
> illetve azt is feldolgozhatnád..."*
>
> ⭐ **A TÜKÖR-ÜZENET nem extra, hanem a képesség RÉSZE.** Egy félrehallott hangüzenetre adott
> válasz rosszabb, mint a semmi — a tükör az, ami ezt elkapja. *(Ugyanaz az elv, mint a
> küldés utáni visszaolvasásnál: ahol a bemenet ÉRTELMEZÉSEN megy át, ott vissza kell
> igazolni.)*
> ⚠️ Az FDP AI STT pontos belépési pontja ❓ **NINCS MÉG FELMÉRVE** — az a megépítés első lépése.

---

## 3️⃣ ÜRESJÁRATBAN FUTTATHATÓ

⚠️ Csak `✅ jóváhagyott` sor kerülhet ide, és csak akkor, ha a **user nincs itt**.

| # | Képesség | Státusz |
|---|---|---|
| — | *(még nincs jóváhagyott üresjárati képesség)* | — |

📌 Amint a fenti `⏳` sorok közül jóváhagysz párat, ide is bekerülnek azok, amik **nem
igényelnek user-jelenlétet** (pl. státusz-kivonat frissítése, esemény-utánanézés,
adat-előkészítés) — a bemondás és a rendelés-véglegesítés nyilván **nem**.

---

## Karbantartás

- Új képesség → **ide, `📝` vagy `⏳` státusszal**, sosem `✅`-vel
- A státuszt **kizárólag a user** állítja `✅`-re vagy `⛔`-re
- Státusz-váltás → `ma action-log emit --kind state-change` + jelezni a usernek
- A képesség **részletei** a flow-ban élnek, nem itt — ez egy **index**

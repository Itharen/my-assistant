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

**Utoljára frissítve:** 2026-09-07 12:35

---

## 🟠 FOLYAMATBAN

| # | Ki | Feladat | Hol tart | Következő lépés |
|---|---|---|---|---|
| T-01 | 🤖 | **Relay deploy — devops/gateway** | a relay váza kész (39345), Overseer-regisztráció kész | `fdp-devops/nginx/confs/my-assistant-relay.conf` az art-tarot minta szerint |
| T-02 | 🤖 | **Relay deploy — SSL** | — | `webhook/ssl-config.json` bejegyzés: `test.my-assistant-relay.futdevpro.hu` |
| T-03 | 🤖 | **Relay deploy — CI/CD** | — | `pipeline.cicd.config.json`: **CSAK a relayt** buildelje/deployolja |
| T-04 | 🤖 | **Relay — a lehúzó oldal** | a relay `/pull` + `/ack` kész | a my-assistant szerverben az ütemezett lehúzás + `location-store` írás |

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
| T-10 | 🤖 | 🔴 **Sikertelen STT ÚJRAPRÓBÁLÁSA** | **MÉRVE: 2 hangüzenet ELVESZETT** (5 perces timeout, 16 sikeres mellett). Ma nincs újrapróbálás ⇒ a tartalom véglegesen elveszik. | owner 12:00 + saját mérés |
| T-12 | 🤖 | **Figyelés/riasztás a sikertelen feldolgozásokra** | *„nem ártana valami kezelés, figyelés"* | owner 12:00 |

### Egyéb

| # | Ki | Feladat | Miért | Forrás |
|---|---|---|---|---|
| T-20 | 🤝 | **Mikromunkák + hackathon előrevétele** | *„Reklámnak és pénznek"* — ⚠️ ez **kétfelé bomlik**: a *prioritás-átállítás az organizerben* **élet-feladat**, az viszont, hogy én ezt **felvessem és kövessem**, rendszer-feladat | owner 10:25 |
| T-22 | 🤖 | **Voice control átemelése** *(nagy)* | a régi `ccap` `/discord-bot/src/_modules/voice/` (~6700 sor) | owner 07:38 |
| T-23 | 🤖 | **LDP működés Bedrockba** | | owner 2026-09-06 |

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
| ✅ | **C-33 Discord-hangüzenet → STT → tükör** | **élőben**, az owner valódi hangüzeneteivel (16 sikeres felismerés) |
| ✅ | **C-44 konzol-pulzus** | élőben fut; már az első percben jelzett 3 váró üzenetet |
| ✅ | **C-45 köteg-frissítés küldés előtt** | 409/409 teszt |
| ✅ | **C-46 távvezérlés-szűrő** | a 09:15:33-as rejtély megoldva és kódba öntve |
| ✅ | **C-48 kézbesítési értesítő** | owner-korrekció után áthelyezve a küldés pillanatára |
| ✅ | **STT-flagek + félrehallás-könyvtár** | 448/448 |
| ✅ | **LDP-ellenőrzés minden triggerkor** | élő próba: a `doctor` első sora |
| ✅ | **Port-költözés 24 → 33 + relay 34** | `fdp-templates`-be regisztrálva; a szerver a 39335-ön fut |
| ✅ | **Overseer-regisztráció** | 844/844 |
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

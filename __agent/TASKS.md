# TASKS — nyitott / folyamatban / lezárt

> **Owner-szabály (2026-09-07 12:13, hangüzenetben) — SZÓ SZERINT:**
>
> *„Nagyon fontos, hogy megfelelően és alaposan mindig fájlokba mentve jegyezzük, hogy milyen
> feladatok vannak nyitva, mi az, ami in progress, és hogy mi az, amit már ténylegesen
> lezártunk, hogy ne sikkadhassanak el soha a feladatok, amiket elkezdtünk."*

🔴 **EZ A FÁJL A FELADATOK SSOT-JA.** Ami itt nincs benne, az **elveszhet** — ezért minden
felmerülő feladat **ugyanabban a körben** ide kerül, nem „majd".

**Három állapot, és mindegyik KÖTELEZŐEN jelölt:**

| Jel | Állapot | Mit jelent |
|---|---|---|
| 🔵 | **NYITOTT** | fel van véve, még nem kezdtem el |
| 🟠 | **FOLYAMATBAN** | elkezdtem, **nincs kész** |
| ✅ | **LEZÁRT** | ténylegesen kész **és igazolva** |
| ⏸️ | **BLOKKOLT** | rajtam kívül álló okból áll — a *mire vár* mezővel |

⚠️ **A ✅ csak IGAZOLÁS után jár.** „Megírtam" ≠ „kész": teszt/mérés/élő próba kell hozzá.
*(Ugyanaz az elv, mint a képesség-katalógusban a `✅` = owner-jóváhagyás.)*

**Utoljára frissítve:** 2026-09-07 12:15

---

## 🟠 FOLYAMATBAN

| # | Feladat | Hol tart | Következő lépés |
|---|---|---|---|
| T-01 | **Relay deploy — devops/gateway** | a relay váza kész (39345), Overseer-regisztráció kész | `fdp-devops/nginx/confs/my-assistant-relay.conf` az art-tarot minta szerint |
| T-02 | **Relay deploy — SSL** | — | `webhook/ssl-config.json` bejegyzés: `test.my-assistant-relay.futdevpro.hu` |
| T-03 | **Relay deploy — CI/CD** | — | `pipeline.cicd.config.json`: **CSAK a relayt** buildelje/deployolja (owner) |
| T-04 | **Relay — a lehúzó oldal** | a relay `/pull` + `/ack` kész | a my-assistant szerverben az ütemezett lehúzás + `location-store` írás |

---

## 🔵 NYITOTT

### Hangüzenet / STT — megbízhatóság

| # | Feladat | Miért | Forrás |
|---|---|---|---|
| T-10 | 🔴 **Sikertelen STT ÚJRAPRÓBÁLÁSA** | **MÉRVE: 2 hangüzenet ELVESZETT** (5 perces timeout, 16 sikeres mellett). Ma nincs újrapróbálás ⇒ a tartalom véglegesen elveszik. | owner 12:00 + saját mérés |
| T-11 | **„gépel…" jelzés az STT-feldolgozás ALATT** | most a felismerés alatt néma a csatorna | owner 12:00 |
| T-12 | **Figyelés/riasztás a sikertelen feldolgozásokra** | *„nem ártana valami kezelés, figyelés"* | owner 12:00 |
| T-13 | **Hosszú hang darabolása átfedéssel** | a vége néha levágódik; ⚠️ az owner maga is bizonytalan a megvalósíthatóságban | owner 11:55 |

### Egyéb

| # | Feladat | Miért | Forrás |
|---|---|---|---|
| T-20 | **Mikromunkák + hackathon előrevétele** | *„Reklámnak és pénznek"* — a meglévő organizer-tétel prioritása felülvizsgálandó, a hackathon új tételként | owner 10:25 |
| T-21 | **GoPrint — póló** | hazafelé benézni | owner 07:38 |
| T-22 | **Voice control átemelése** *(nagy)* | a régi `ccap` `/discord-bot/src/_modules/voice/` (~6700 sor) | owner 07:38 |
| T-23 | **LDP működés Bedrockba** | | owner 2026-09-06 |

---

## ⏸️ BLOKKOLT — owner-lépésre vár

| # | Feladat | Mire vár |
|---|---|---|
| T-30 | **Relay-kulcsok élesítése** | az owner beállítja a `.env`-ben, ha hazaért *(a kulcsok generálva)* |
| T-31 | **Keystore-felvétel** | ⚠️ az `fdp env-*` CLI-vel **nem lehet írni** (mérve) — Overseer-felület, owner |
| T-32 | **Böngésző-kiegészítő újratöltése** | a port-költözés után (`manifest.json` host-engedély) |
| T-33 | **OwnTracks beállítása a telefonon** | app + `home` régió + URL |
| T-34 | **Képesség-jóváhagyások** | a `CATALOG.md` `⏳` sorai — `✅`-t csak az owner adhat |

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

---

## Kapcsolódó

- `__agent/CONTINUATION.md` — a **hogyan állunk** (állapot), ez a fájl a **mi van hátra**
- `__agent/capabilities/CATALOG.md` — a képességek és a jóváhagyásuk
- `current/open-questions.md` — a **kérdések**, amikre owner-válasz kell

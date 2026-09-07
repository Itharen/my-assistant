# 📋 HARD RULE — a feladatok mindig FÁJLBAN, három állapottal

> **Owner, 2026-09-07 12:13 (hangüzenetben) — SZÓ SZERINT:**
>
> *„Nagyon fontos, hogy megfelelően és alaposan mindig fájlokba mentve jegyezzük, hogy milyen
> feladatok vannak nyitva, mi az, ami in progress, és hogy mi az, amit már ténylegesen
> lezártunk, hogy ne sikkadhassanak el soha a feladatok, amiket elkezdtünk."*

---

## A szabály

**Minden feladat — nyitott, folyamatban, lezárt — a `__agent/TASKS.md`-ben él.**
Az a fájl a feladatok **SSOT-ja**.

| Jel | Állapot |
|---|---|
| 🔵 | nyitott |
| 🟠 | folyamatban |
| ✅ | lezárt **és igazolt** |
| ⏸️ | blokkolt *(a „mire vár" mezővel)* |

## ⭐ Amikor felmerül, AKKOR kerül be

⛔ Nem „majd a kör végén", nem „ha lesz időm". Egy feladat, ami csak a beszélgetésben létezik,
**egy kontextus-kompaktálásnyira van az eltűnéstől** — pontosan ez ellen szól az owner.

## ⚠️ A `✅` csak IGAZOLÁS után jár

„Megírtam" **≠** „kész". Kell hozzá teszt, mérés vagy élő próba — és az igazolás **oda van írva**
a tétel mellé.

🔴 **Miért szigorú ez:** a hamisan lezárt feladat **rosszabb, mint a nyitott**. A nyitottat
látjuk; a hamisan lezártat **soha többé nem nézzük meg**.

## 🔴 A RENDSZER-FELADAT ≠ AZ OWNER ÉLET-FELADATA

> **Owner, 2026-09-07 12:26 (hangüzenetben) — SZÓ SZERINT:**
>
> *„fontos, hogy ezt a feladat nyilvántartást, ezt ne keverjük össze az organizerben lévő én
> feladataimmal. Tehát valahogy ezt nagyon alaposan kifejezésekben is el kell különíteni
> egymástól ezt a két fajta feladatot, amit te csinálsz, amit együtt csinálunk, meg amit én
> csinálok."*

**Két külön nyilvántartás, és a szóhasználat is elkülöníti őket:**

| | **RENDSZER-FELADAT** | **ÉLET-FELADAT** |
|---|---|---|
| Miről szól | a **rendszer** építése, üzemeltetése | az **owner élete** |
| Hol | `__agent/TASKS.md` | organizer (`fo tasks.*`) |
| Azonosító | `T-NN` | `org:task:…` |
| Így hívjuk | *„rendszer-feladat"* | *„a te feladatod"* / *„élet-feladat"* |

**A rendszer-feladatokon belül jelölve, hogy ki végzi:**
🤖 **én** *(Honnie)* · 🤝 **közösen** · 🙋 **owner-kapu**

⭐ A 🙋 **nem** az owner feladata: az **én** feladatom, aminek a **kulcsa** nála van
*(kulcs-beállítás, jóváhagyás, telefon-beállítás)*. Ezért **itt** marad, nem megy az organizerbe.

⛔ **Tilos:** rendszer-feladatot az organizerbe írni · élet-feladatot `T-NN`-nel ellátni ·
egy tételt **hallgatólagosan** átvinni a két nyilvántartás között.

🔴 **Miért:** az owner az organizert azért nézi, hogy **mit kell NEKI tennie**. Egy odakeveredett
„nginx conf" tétel pont azt a listát teszi használhatatlanná, amiért az egész rendszer létezik.
A hígítás **visszafelé is igaz**.

## A három nyilvántartás elhatárolása

| Fájl | Mire válaszol |
|---|---|
| **`__agent/TASKS.md`** | **MI VAN HÁTRA** — feladatok, állapottal |
| `__agent/CONTINUATION.md` | **HOGYAN ÁLLUNK** — állapot, mérések, tanulságok |
| `current/open-questions.md` | **MIRE KELL VÁLASZ** — owner-döntést igénylő kérdések |

⚠️ **A három nem helyettesíti egymást**, és ugyanaz a fél-frissítési hibaminta fenyeget, mint
a státusz-fájloknál *(`ENTRY.md` §5)*: ha csak az egyik frissül, a többi **némán elavul**.

## Kapcsolódó

- `__agent/ENTRY.md` §5 — a kör végi frissítés kötelező listája
- [[uncertain-requests]] — a 🔍 **feltárandó** állapot: bizonytalan kérésbe nem vágunk bele
- [[recording-discipline]] — „jegyezz fel" = kötelező rögzítés
- [[two-domains]] — a **másik** tengely: asszisztensi vs. szoftverfejlesztési munka
  *(⚠️ ez a fájl a „**kié** a feladat" tengelyt vágja el, nem a „**milyen** feladat"-ot)*

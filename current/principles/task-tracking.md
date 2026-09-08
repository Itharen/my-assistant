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

---

## 🔴 A HATÁR KIMONDVA — 2026-09-08 22:37 (owner hangüzenet)

> *„Ezeket úgy fogjuk szelektálni, hogy **ami az organizerben van, az az enyém**. A te saját
> feladataidat **te magadnak külön kezeld, rendszerezd**."*

⭐ **A szétválasztás a HELY, nem a címke.** Nincs szükség gazda-mezőre, tag-re vagy besorolásra:

```
organizer            →  AZ ÖVÉ.        ⛔ Nem az enyém, akkor sem, ha technikai a címe.
__agent/TASKS.md     →  AZ ENYÉM.      ⛔ Nem kerül az organizerbe.
```

### ⚠️ Amit ez a saját, korábbi javaslatomból TÖRÖL

A 2026-09-08-i leltárban azt javasoltam első lépésnek, hogy **jelöljük meg a gazdát** minden
organizer-tételen *(övé / közös / enyém)*, mert mind a 140 egyetlen `path`-ban ült.
🔴 **Ez a lépés ezzel tárgytalan** — az owner nem besorolást adott, hanem **megszüntette a
kérdést**: a tárolási hely maga a gazda.

📌 **A tanulság:** *„nincs válasz az adatban"* nem mindig adathiány. Néha a **kérdés** rossz.
Mielőtt mezőt javasolok, meg kell néznem, nem hordozza-e a **szerkezet** már a választ.

### ⛔ Ami ebből következik a napi működésre

| | |
|---|---|
| Az organizerben **technikai című** tétel *(„CCAP…", „LDP…", „MCP…")* | **az ÖVÉ** — az ő fejlesztői munkája. ⛔ Nem „szennyeződés", nem viszem át magamhoz |
| Az én rendszer-feladatom | **soha nem** kerül az organizerbe |
| **Átfedés** *(ugyanazt a dolgot ő is nyilvántartja, én is)* | ⭐ **megengedett és hasznos** — de ha az **én oldalamon elkészül**, azt **jeleznem kell**, hogy ő **lezárhassa**. ⛔ Lezárni nem én zárom le |

🔗 A lezárás azért fontos, mert az organizer a **következő ismétlődést lezáráskor** hozza létre
*(`recurring-tasks.md`)* — a mért **12 %-os lezárási arány** miatt a láncok megállnak.

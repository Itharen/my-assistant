# 🖊️ A LinkedIn-posztok írásának szabályai — az owner szó szerinti irányelvei

> **Owner, 2026-09-11 01:46:** *„most csak befogom dobni neked inboxba a jelenlegi terveket, meg
> azt, hogy eddig milyen szabályok alapján készítettem a posztokat."*
> **Forrás:** `__agent/inbox/linkedin-post-guide.md`, beérkezett 2026-09-11 01:48.

⭐ **Ez az ő szövege, SZÓ SZERINT.** ⛔ Nem fogalmazom át, nem „strukturálom" — ugyanaz az
osztály, mint a többi alaptézis *(`CLAUDE.md`: „olyan formában, ahogy a user leírta")*.
Ha ellentmond bármelyik saját megszokásomnak, **ez nyer**.

---

## 📜 AZ EREDETI SZÖVEG — érintetlenül

A posztírási irányelvek:

**Formátum**

* Magyar cím előre, csak neked.
* Utána: **English post:**
* Maga a poszt angolul.
* Ne legyen text blockban, csak sima szövegként.

**Stílus**

* rövid
* tömör
* emberi
* természetes LinkedIn-hang
* ne legyen AI-generált szaga
* ne legyen túl általános
* ne legyen okoskodós
* ne legyen túl hosszú
* ne legyen túlírt / túlmagyarázott
* legyen benne konkrét tapasztalat vagy konkrét tanulság
* B2B-kompatibilis legyen
* founder / operator / senior engineering hang
* technikai mélység érződjön, de ne legyen belső specifikációs részletességű

**Tartalmi szabályok**

* Ne legyen panaszkodós.
* Ne legyen túl arrogáns.
* A bizonytalanságokat, failures részeket csak akkor használjuk, ha erős tanulság lesz belőlük.
* Ne tegyünk bele olyan részletet, ami gyengíti a profil pozicionálását.
* A konkrét tool/providerek említhetők, de ne legyen sima tool-szidás.
* Ne legyen túl sales-es, inkább szakmai tapasztalatból induljon.
* A posztok mutassák a profizmust, ne a vívódást.

**Képgeneráló promptok**

* Csak azokhoz adunk képet, ahol tényleg hozzáad.
* Ha generikus AI-stock kép lenne, inkább nincs kép.
* Prompt text blokkban legyen, hogy könnyen másolható legyen.
* Legyen benne:

  * no readable text
  * no logos
  * premium B2B tech aesthetic
  * cinematic / clean engineering visual
  * dark modern tech style, ha illik hozzá.

---

## 🔗 Hogyan illeszkedik a rendszerbe

| Lépés | Állapot |
|---|---|
| **olvasás** — a korábbi posztok | ✅ **működik**: hivatalos API, `MEMBER_SHARE_INFO` domain, **48 poszt** *(2026-03-26 … 2026-08-25)*, a `ShareCommentary` mezőben a teljes szöveg |
| **piszkozat** — én készítem elő | ⏳ a `reply draft` mintájában: lokális, ⛔ magától sosem megy ki |
| **felület** — ahonnan posztol | ⏳ `__agent/TASKS.md` T-73 |
| **kiküldés** | ⛔ a hivatalos API-n **nincs küldés-scope** ⇒ UBH vagy kézzel |

⭐ **A 48 meglévő poszt a legjobb kalibráció**, ami létezik: ezek a szabályok **leírják** a hangot,
a posztok pedig **megmutatják**. Piszkozat előtt a kettőt együtt kell nézni.

⚠️ **Amit ebből magamra is értek:** *„ne legyen AI-generált szaga"*, *„ne legyen túlírt /
túlmagyarázott"*, *„ne legyen okoskodós"*. Ezek pontosan azok a hibák, amiket a saját
üzeneteimben is javítok *(`discord-message-style.md`)*.

Kapcsolódó: [[cv-writing]] *(ugyanaz a kettős célközönség)* · [[discord-message-style]] ·
`__agent/TASKS.md` T-72, T-73.

---

## 🖼️ A KÉP-SZABÁLY — ✅ ELDÖNTVE: AZ ERŐSEK KAPNAK KÉPET (owner, 2026-09-11 01:54)

> *„A régi LinkedIn posztkészítési szabályunkban az volt, hogy a **gyengébb cikkek kapjanak
> képeket**, de egyre inkább érzem, hogy vagy **mindennek** kéne kapni a képet, vagy pont, hogy
> **az erősebbeknek**, hogy jobban felhívják a figyelmet azokra a témákra."*

### 📊 Amit MÉRTEM a 48 meglévő posztból

| Mérés | Érték |
|---|---|
| posztok | **48** *(2026-03-26 … 2026-08-25)* |
| `MediaUrl` kitöltve | **0** |
| `SharedUrl` *(link-megosztás)* | **0** |
| szöveghossz | medián **728** karakter *(287 … 984)* |

⚠️ **Ezt NEM szabad túlértelmezni:** a `MediaUrl` üressége azt bizonyítja, hogy **az export nem ad
vissza média-hivatkozást**, ⛔ **nem** azt, hogy egyik poszt sem kapott képet. A natív
kép-feltöltés lehet, hogy egyszerűen nem jelenik meg ebben a mezőben.
📌 Ami **biztos**: ebből az adatból a kép **hatását nem lehet mérni** — a snapshot nem visz
elérés- vagy reakció-adatot.

### 💡 A JAVASLATOM: **az ERŐSEKNEK**

| Miért | |
|---|---|
| **A kép erősítő, nem mankó** | amit felerősítesz, az kapja a figyelmet. A gyenge poszt erősítése azt jelenti, hogy a **leggyengébb** tartalomra megy a legtöbb figyelem |
| **A „mindegyik" ütközik a saját szabályoddal** | *„Ha generikus AI-stock kép lenne, inkább nincs kép."* Ha kötelező a kép, előbb-utóbb **tölteléket** gyártunk — pont azt, amit tiltottál |
| ⭐ **A gyenge posztnál nem a kép a megoldás** | ha egy poszt gyenge, a **posztot** kell megerősíteni vagy elhagyni. A kép ilyenkor **elfedi** a bajt, nem javítja. A saját szabályod is ezt mondja: *„A posztok mutassák a profizmust, ne a vívódást."* |

⇒ **A javasolt szabály:** *a kép a kiemelés eszköze — azokra a posztokra megy, amiket TE tartasz a
legfontosabbnak, és ahol a kép tényleg hozzáad. Gyenge poszt nem kap képet: azt átírjuk vagy
kihagyjuk.*

### ✅ AZ OWNER DÖNTÉSE — 2026-09-11 01:54

> *„Jó, jó a javaslatod. Menjünk a felé, igen, hogy akkor kapjanak az erősek képet."*

⇒ **ÉRVÉNYES SZABÁLY MOSTANTÓL:**

```
A kép a KIEMELÉS eszköze.
  ✅ képet kap      → amit az owner a legfontosabbnak tart, ÉS ahol a kép tényleg hozzáad
  ⛔ NEM kap képet  → a gyenge poszt. Azt ÁTÍRJUK vagy KIHAGYJUK — a kép nem javítja, csak elfedi
```

⚠️ **Ez FELVÁLTJA a régi „a gyengébb cikkek kapjanak képet" logikát** *(owner, 01:50: a régi
szabály volt, de elveti)*. ⛔ A régi heurisztikát **nem alkalmazzuk többé**.

📌 **A fenti, szó szerinti irányelv VÁLTOZATLANUL ÉL mellette** — *„Csak azokhoz adunk képet, ahol
tényleg hozzáad. Ha generikus AI-stock kép lenne, inkább nincs kép."* A kettő **egy irányba** mutat:
a döntés azt mondja meg, **melyik** posztoknál keressük a képet, az irányelv pedig azt, hogy
**milyen** kép fogadható el. Mindkettőnek teljesülnie kell.

---

## 🔢 A SORREND: PROFIL → POSZTOK → ÜZENETEK (owner, 2026-09-11 02:10)

> *„Azután akartam csak válaszolni a LinkedIn üzenetekre, hogyha már a posztokat meg a profilt
> update-eltük."*

⚠️ **Ez felülírta a javaslatomat.** Én az üzenetekkel kezdtem volna *(`mvp-focus`: a pénzkeresés
az első, és a lehetőségek öregszenek)* — de az ő indoka erősebb:

```
aki a válaszodból ÁTKATTINT, FRISSÍTETT profilra érkezzen
```

📌 Egy jó válasz **odaviszi** a megkeresőt a profilhoz. Ha az elavult, a válasz **ellene dolgozik** —
a lead nem azért vész el, mert késtünk, hanem mert rossz képet kapott.

**A sorrend tehát:** 1️⃣ profil · 2️⃣ posztok · 3️⃣ üzenet-válaszok.
⛔ A kész üzenet-piszkozatok *(`current/linkedin/drafts/`)* **VÁRNAK** — nem dobjuk el őket,
csak nem mennek ki, amíg a profil nincs kész.


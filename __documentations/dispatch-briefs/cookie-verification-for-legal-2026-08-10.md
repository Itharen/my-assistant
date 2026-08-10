# DISPATCH BRIEF — FEJLESZTŐI COOKIE-ELLENŐRZÉS a jogi tervezetekhez · 2026-08-10

> **Kiadó:** My Assistant 3 (koordinátor) · **Végrehajtó:** `ALL Projects - MA3 Dev 3` (`ccs-fbc3577e-ms6cy0bt`).
> **Miért ez a session:** a `MA3 Dev 2` a számlázás-hyperplanon dolgozik — **nem zavarjuk**.
> **Előzményed:** te készítetted a **süti-leltárt** (2026-07-29) — ez annak a **folytatása**.

## 0. A KIVÁLTÓ OK — ügyvédi kérés (2026-08-09)
Megérkeztek a jogi dokumentumok **első tervezetei** (ÁSZF · Adatkezelési · Cookie Tájékoztató).
A cookie-tájékoztató **a te leltárodra épül** — weboldalanként, technológiánként. Az ügyvéd a
véglegesítéshez **fejlesztői ellenőrzést** kér, szó szerint:

> *„Fejlesztői ellenőrzés szükséges ahhoz, hogy a cookie-leltár **teljes** legyen, a **Stripe
> technológiái csak a felhasználó által kezdeményezett fizetési folyamatban töltődjenek be**, az
> árkalkulátorhoz kapcsolódó **`projectPlan` besorolása** megfelelő legyen, és tisztázódjon a
> **Google Fonts** esetleges külső betöltése. Ha a tényleges működés eltér, a besorolást és a
> hozzájárulási beállításokat is módosítani kell."*

⚠️ **A jogi dokumentum a te méréseden fog állni** — ha hiányos, a közzétett tájékoztató lesz hibás.

## 1. A NÉGY MÉRENDŐ KÉRDÉS

### (a) 🔴 Betöltődik-e a Stripe a fizetési szándék ELŐTT?
**Ez a legfontosabb.** Ha a Stripe.js már a puszta oldalbetöltéskor betöltődik *(nem csak akkor,
amikor a felhasználó ténylegesen fizetni kezd)*, akkor a `__stripe_mid` / `__stripe_sid` / `m` /
`__cf_bm` **hozzájárulás nélkül** települ egy olyan felhasználónál, aki **nem is akart fizetni**.
**Mérd meg** a `token.futdevpro.hu`-n: hol pontosan (melyik útvonal / melyik felhasználói lépés)
töltődik be a `js.stripe.com`, és **elkerülhető-e**, hogy a fizetési szándék előtt megtörténjen
*(lusta betöltés)*.

### (b) A `projectPlan` besorolása
A leltárban **funkcionális**ként javasoltuk (árkalkulátor-terv megőrzése). **Verifikáld:** mit tárol
pontosan, **mennyi ideig**, és tartalmaz-e bármi olyat, ami **nem** pusztán kényelmi funkció.

### (c) Google Fonts — külső betöltés
A leltár szerint a `fonts.googleapis.com` **futásidőben nem hívódik** (a CSS build-időben beépül),
csak a **betűfájlok** töltődnek a `fonts.gstatic.com`-ról ⇒ **a felhasználó IP-címe a Google-höz kerül**.
**Erősítsd meg vagy cáfold** a mai kódon, **mind a négy weboldalon**, és mondd meg, **kiváltható-e**
a betűk **önhosztolásával** *(ha igen, az egy külső adattovábbítást szüntetne meg)*.

### (d) A leltár TELJESSÉGE — újramérés
A leltár **2026-07-29-i**. Azóta **sok** változott (donation-út kivezetve, kliens-komponensek
törölve, i18n bekötve). **Mérd újra** a négy weboldalt, és jelezd a **különbségeket** az eredeti
leltárhoz képest — ⭐ **különösen az ÚJ tételeket**.

## 2. ⚠️ EGY TOVÁBBI ELLENŐRZÉS — a hozzájárulás megőrzési ideje
Az ügyvédi tervezet **egységesen HAT HÓNAPOS** megőrzést ír elő a hozzájárulásra ÉS az elutasításra.
**Mérd meg, mennyi ez ma nálunk** (`dynx-cookie-consent`), és jelezd, ha eltér — a kód és a jogi
dokumentum **nem mondhat mást**.

## 3. AMIT NE CSINÁLJ
- ⛔ **Ne javítsd** a talált hiányosságokat — ez **felmérés**. A javítás külön feladat lesz.
  *(Kivétel: ha egy mérés triviálisan egysoros és nem érinti a fizetési utat — akkor is JELEZD.)*
- ⛔ **Nincs polling / háttér-task.**
- ⛔ A **korábbi leltár-doksit ne írd át** — **külön, dátumozott kiegészítés** készüljön.

## 4. KIMENET
`fdp-documentations/legal/_process/cookie-verification-2026-08-10.md` — a négy kérdésre **mérés-alapú**
válasz + a megőrzési idő + a 2026-07-29-i leltárhoz képesti **különbség-lista**.
⭐ **Ez a doksi megy át az ügyvédnek**, ezért legyen **közérthető** (jogász olvassa, nem fejlesztő).
Commit + push.

## 5. MUNKAMÓD
`core-no-guessing`: minden állítás mögé **mérés** (futásidejű megfigyelés vagy kód-hely).
Ami nem mérhető, azt **EXPLICIT `unverified`**-ként jelöld — az ügyvéd erre épít.
A végén **review→javítás loop**, amíg **két egymást követő kör nulla új findinggel** zárul,
körönként **más nézőponttal**.

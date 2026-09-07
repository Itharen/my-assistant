# Tipikus félrehallások — STT-szótár

> **Owner-kérés (2026-09-07 11:52, hangüzenetben):** *„az STT-vel küldött üzeneteknél lehet,
> hogy valami kis egyszerű flegekkel megjelölhetjük az üzeneteket, hogy tudják róla, hogy ez
> egy STT volt, mert ugye az STT-kben lehetnek transkript hibák, félrehallások, illetve
> általában amúgy ezekhez szoktunk vezetni, tipikus félrehallások könyvtárat."*

---

## Mire jó ez a fájl

**Élő, bővülő lista** azokról a szavakról, amiket a beszédfelismerés rendszeresen félrehall.
Két dolgot ad:

1. **Nekem olvasáskor:** ha egy átiratban ilyet látok, tudom, mi volt valószínűleg az eredeti —
   és **nem kérdezek vissza feleslegesen**.
2. **A jelöléshez:** ha egy átirat ismert félrehallást tartalmaz, az üzenet **külön flaget** kap.

⚠️ **Ez NEM automatikus javítás.** ⛔ A szöveget **nem írjuk át** — csak **megjelöljük**.
Az automatikus csere pont azt a hibát követné el, amit el akarunk kerülni: magabiztosan
rosszat állítani. A döntés az owneré.

---

## A szótár

| Amit hallott | Amit valószínűleg mondott | Honnan tudjuk |
|---|---|---|
| `CIC` · `CIC-ig` | **CI/CD** | owner, 2026-09-07 — *„végig kell menjenek a CIC-ig"* |
| `FTP templates` | **FDP Templates** | owner, 2026-09-07 — *„FTP templates-be felvenni"* ⚠️ az FTP **létező** FDP-szolgáltatás, ezért ez a félrehallás **különösen veszélyes** |
| `FDP KeyStore` | FDP Keystore | ugyanaz, csak írásmód |
| `transkript` | transcript | ugyanaz, csak írásmód |
| `fleg` · `flegek` | **flag** · flagek | owner, 2026-09-07 |
| `realy` | relay | owner, 2026-09-07 *(gépelve, nem STT — de ugyanaz az osztály)* |
| `my-assisstant` | my-assistant | owner, 2026-09-07 *(gépelve)* |

### ⚠️ Amit ebből tanulni kell

🔴 **A legveszélyesebb félrehallás az, ami EGY MÁSIK LÉTEZŐ DOLOG NEVE.** Az `FTP templates`
nem értelmetlen zaj — az **FTP egy valódi FDP-szolgáltatás** (`fdp-ftp-service`, XY=10).
Ha vakon követem, a **rossz repóban** kezdek dolgozni.

⇒ **Ellenőrző kérdés minden átiratnál:** *van-e a mondatban olyan név, ami egy MÁSIK létező
rendszerre is illik?* Ha igen, a szövegkörnyezet dönt — és ha az sem egyértelmű, **kérdezek**.

---

## 🔴 KORREKCIÓ (owner, 2026-09-07 12:03): NEM csonkolás volt — ROSSZ HELYEN A PONT

> **Owner:** *„A kulcsokról mondott mondatomnak amúgy volt vége, az volt a vége, hogy állítsd
> majd be a kulcsokat ehhez, csak a transzkript rossz helyre tette a pontot."*

⇒ A *„…generált kulcsokat. **Ehhez**"* **nem elvágott** mondat volt: a felismerés a **pontot
tette rossz helyre**, és így a mondat közepe végnek látszott.

⭐ **Ez egy KÜLÖN, alattomosabb hibaosztály, mint a félrehallás:** minden **szó** helyes lehet,
mégis **mást jelent**, mert a **tagolás** rossz. A szó-szintű ellenőrzés ezt **nem fogja meg**.

✅ **A gyakorlati kezelés viszont VÁLTOZATLANUL helyes:** a „mondat közben ér véget" flag
ilyenkor is bejelez, és a helyes reakció ugyanaz — **visszakérdezni, nem cselekedni**.
*(Így is jártam el; az owner megerősítette a hiányzó részt.)*

⚠️ **Amit viszont pontosítani kell:** a flag szövege **ne állítsa**, hogy hiányzik a vége —
csak azt, hogy **a tagolás gyanús**. A kettő nem ugyanaz, és a rossz diagnózis rossz irányba
küldi a keresést.

---

## ⚠️ De az átirat tényleg EL IS VESZHET — más okból, MÉRVE

**2026-09-07, mérés az akció-naplóból:** **16 sikeres** felismerés mellett **2 hangüzenet
teljesen elveszett** — mindkettő *„A felismerés 5 perc után sem fejeződött be"* hibával.

⇒ Ez **nem tagolás és nem félrehallás, hanem HIÁNY**: a tartalom **soha nem jutott el hozzám**.
Az owner is észrevette: *„Volt pár voice message ami nem került feldolgozásra"*.

🔴 **Az ok a RAM**, és az owner ehhez külön szabályt adott *(2026-09-07 12:05)*:
> *„Sok párhuzamos munka folyik ezért a RAM usage folyton fluktuál. Ezt nem kell megoldani,
> csak azt ahogy alkalmazkodunk ehhez az issue-hoz."*

⇒ ⛔ **A RAM-ot NEM optimalizáljuk.** A feladat az **alkalmazkodás**: újrapróbálás később,
amikor a terhelés úgyis változik.

### ✅ MEGÉPÍTVE (2026-09-07): `cli/src/stt/stt.retry-queue.ts`

A hang mostantól **nem vész el** egy sikertelen felismeréstől:

- 🔴 a **BÁJTOKAT** tesszük el, nem a Discord-URL-t *(az aláírt link lejárna)*
- ⏳ a próbálkozás **2 → 5 → 15 → 45 perc** múlva ismétlődik, összesen **5 próba**
- ⭐ **egyszerre SOHA nem fut két felismerés** — ez maga az alkalmazkodás: az újrapróbáló
  nem tetézheti azt a RAM-csúcsot, ami ellen létezik
- ✅ a **későn** felismert szöveg ugyanúgy a **kötegbe** kerül, mintha elsőre sikerült volna
- 🔴 ha **5 próba után sem sikerül**, azt az owner **megkapja** — a néma eldobás pontosan úgy
  néz ki, mintha meg sem érkezett volna az üzenet

⚠️ **A gyanús átirat NEM kerül a sorra.** Az nem múló zavar, hanem maga az eredmény —
újrapróbálva ugyanazt a hallucinációt kapnánk, csak sokadszorra.

**Amit tenni kell:** ha egy átirat **mondat közben ér véget** *(nincs záró írásjel, kötőszóval
vagy névelővel végződik)*, azt **JELEZNI kell**, és ⛔ **nem szabad cselekedni rá** — vissza
kell kérdezni. *(Így jártam el a kulcsokról szóló üzenetnél.)*

---

## Kapcsolódó

- `cli/src/stt/stt.transcript-guard.ts` — a hallucináció-őr *(más osztály: kitalált szöveg)*
- `cli/src/stt/stt.mirror.ts` — a tükör-üzenet
- `cli/src/discord/discord.voice-message.ts` — a kötegbe kerülő jelölés
- `__documentations/dev/FDP_AI_STT.md` — a szolgáltatás mért szerződése

---

## 🔴 2026-09-07 20:32 — A BUKOTT FELISMERÉS FELISMERHETŐ MINTÁJA (owner mérése)

> **Szó szerint:** *„az STT transkript hibákhoz felírhatnád, hogy általában amikor hibásan
> dolgozódik föl, akkor csak ennyi lesz benne, mint most az előbb, hogy köszönöm, meg thank
> you, meg you."*

⭐ **Ez nem félrehallás, hanem ÖSSZEOMLÁS:** a felismerés nem rosszul érti a mondatot, hanem
**összeomlik egyetlen töltelék-szóra**, és a tartalom **teljesen elvész**.

**A minta:** `köszönöm` · `thank you` · `you` *(és nyelvtani rokonaik)* — **a TELJES átirat
ennyi**.

### ⚠️ Miért nem elég a szó-lista

Ezek **valódi szavak, amiket az owner tényleg mond**. Ezért:
- ⛔ **nem** részszöveg-keresés — csak akkor gyanús, ha az **egész** átirat ennyi;
- ⛔ **nem** kerül a listára az `igen` és az `ok` — azok **valódi rövid válaszok**, más osztály.
  *(Amikor egyszer mégis felvettem őket, egy korábbi, szándékos döntést védő teszt bukott el.)*

### ⭐ A JOBB JEL: hanghossz ↔ átirat-hossz ARÁNY

**A mért eset:** **9 másodperc** hangból *„Köszönöm"* = **8 karakter**.
A korábbi hossz-küszöb (3 karakter) ezt **átengedte**, és az üzenet **elveszett** — az owner
csak azért vette észre, mert ő maga ismerte fel a mintát.

⇒ A tell nem a rövidség, hanem az **aránytalanság**. Beépítve:
`cli/src/stt/stt.transcript-guard.ts` — küszöb **2 karakter/másodperc**, csak **≥4 mp** hangnál.

⚠️ A 2 karakter/mp **assziszens-választás, nem owner-adat** *(a magyar beszéd ~10–15 karakter/mp;
ez szándékosan nagyon megengedő)*. Felülvizsgálandó: `open-questions.md`.

## 2026-09-08 — `CCLP` ≈ **CCAP**

Az owner maga jelezte: *„a CCLP tipikus félrehallás, ilyenkor a CCAP-ról beszélek."*
⇒ A `CCLP` minden előfordulása **CCAP**-ként olvasandó.

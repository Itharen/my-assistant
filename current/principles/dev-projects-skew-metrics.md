# 📊 AMIT FEJLESZT, AZT A MÉRŐSZÁM HASZNÁLATNAK OLVASSA

> **Owner, 2026-09-12 04:52 (szó szerint):** *„A **Warbots playtest** amúgy az egy **fals adat**,
> mert a Warbots-ot **fejlesztem**, és azt is **játékidőnek** mutatja."*

---

## A TORZÍTÁS

🔴 A Steam **játékidőként** könyvelte azt, ami valójában **munka** volt:

| Tétel | „Játékidő" | Valójában |
|---|---|---|
| **Warbots Playtest** | **2 959 óra** | ⛔ fejlesztés/tesztelés |
| **WarBots** | **104 óra** | ⛔ ugyanaz |

⚠️ **És ez nem apró zaj:** a Playtest **egymaga 2,3-szor annyi**, mint a valódi listavezető
*(Total War: WARHAMMER II, 1 302 óra)*. ⇒ **Kizárás nélkül minden rangsor hamis.**

---

## ⭐ AZ ÁLTALÁNOS SZABÁLY — ⛔ nem Steam-specifikus

```
Ha az owner FEJLESZT valamit, a hozzá tartozó "használati" mérőszám
NEM az ő fogyasztói viselkedését méri.
```

**Hol jelentkezik még ugyanez** *(⚠️ előre gondolva, ⛔ nem mind mérve)*:
- 🎮 **Steam** — játékidő *(mérve, ez az eset)*
- 🌐 **böngésző-előzmény** — a saját rendszereink oldalai *(Overseer, organizer, LinkedIn-panel)*
- ⏱️ **képernyőidő / app-használat** — a fejlesztői eszközök
- 🎵 **zene/média** — ha teszteléshez játszik le valamit

📌 **A teendő:** minden ilyen elemzés előtt **ki kell zárni a saját projekteket** — és a
kizárást **láthatóvá tenni**, ⛔ nem csendben elhagyni *(a `voice-funnel` mintája: a töredéket
**megnevezzük**, nem kivonjuk)*.

---

## A KARBANTARTANDÓ LISTA

A **fejlesztői projektek** listája **változik** ⇒ ⛔ nem elég egyszer beégetni.

| Projekt | Hol jelenik meg mérőszámként | Felvéve |
|---|---|---|
| **WarBots** *(+ Playtest)* | Steam játékidő | 2026-09-12 |

⭐ **Amikor új projektről hallok** *(pl. „ezen dolgozom")*, **ide is fel kell venni** — különben
hónapokkal később egy elemzés **észrevétlenül** hazudik.

Kapcsolódó: [[post-development-verification]] *(a számláló nem jelentés)* ·
`C:/Users/User/.config/my-assistant/steam/owned-played-games.md`


---

## 🔴 MÁSODIK TORZÍTÁS UGYANEBBEN AZ ADATBAN: **nem mind az övé** (2026-09-12 05:20)

> **Owner (szó szerint):** *„a Warhammer, azt meg szerintem a **legtöbbjét nem is én tettem bele,
> hanem még a bátyám**."*

⚠️ **Ugyanaz a fiók, MÁS ember.** ⇒ A játékidő **nem** az ő preferenciáját méri — a lista
**legtetején** álló tétel *(Total War: WARHAMMER II, 1 302 óra)* **nagyrészt nem tőle van**.

### ⇒ A KÉT TORZÍTÁS EGYÜTT KIÜTI A RANGSORT

| Torzítás | Példa | Hatás |
|---|---|---|
| 🛠️ **fejlesztés játékidőként** | WarBots Playtest — 2 959 ó | az **1.** hely hamis |
| 👥 **más ember ugyanazon a fiókon** | Total War: WARHAMMER II — 1 302 ó | a **2.** hely is hamis |

🔴 **Következtetés:** a **puszta óraszám-rangsor használhatatlan** az ő ízlésének mérésére.
⛔ **Nem javítgatom** — **más jelre** kell váltani.

### ✅ AMI HELYETTE MŰKÖDIK — mérve ugyanezen a napon

Amikor **megkérdeztem** és ő **kimondta** a preferenciát — *„építkezős játékok… minimális akció,
csak valamit építek, és nézem, ahogy megy"* — abból **azonnal** használható lista lett:
**36 érintetlen építkezős játék** a saját könyvtárából.

⭐ **A tanulság:** egy **kimondott preferencia** többet ért, mint **1 169 adatpont**.
⇒ Adat-vezérelt ajánlásnál **először kérdezz**, és a számot **csak szűrésre** használd,
⛔ ne rangsorolásra.

📌 **A „nem mind az övé" gyanú általánosítható:** közös fiók, családtag, régi kor — bármely
**hosszú előzményű** adatsornál felmerülhet *(böngésző, média, vásárlások)*.


---

## 🔴 HARMADIK TORZÍTÁS: a lokális játékidő **HIÁNYOS** (2026-09-12 05:31)

> **Owner (szó szerint):** *„a **Timberborn**-nal meg már annyit játszottam, hogy már
> **megépítettem 100 hódbázist**, mert kicsit meguntam."* · *„**Dyson Sphere**-nél az a baj, hogy
> a bolygó-fázisban mindig elszédülök."*

🔴 **A `localconfig.vdf` mindkettőt 0 órásnak mutatta** — én pedig **pont ezért ajánlottam őket**
*(„érintetlen")*. ⇒ **A helyi játékidő nem teljes.** *(Lehetséges okok — ⛔ egyik sem mérve: más
gépen játszott · a Steam felhő-szinkron nem írta vissza · a mező csak bizonyos appokra frissül.)*

### ⇒ A HÁROM TORZÍTÁS EGYÜTT — a tanulság már nem az egyes esetekről szól

| # | Torzítás | Mit hittem |
|---|---|---|
| 1 | fejlesztés = játékidő *(WarBots)* | „ez a kedvence" |
| 2 | **más ember** ugyanazon a fiókon *(Total War)* | „ez a kedvence" |
| 3 | **hiányzó** játékidő *(Timberborn, DSP)* | **„ehhez hozzá sem nyúlt"** |

⭐ **A 3. a legalattomosabb:** az 1-2. **túl sokat** mutat *(kiszűrhető)*, a 3. **semmit sem** —
és a **hiány nem látszik**. ⛔ **A 0 nem bizonyíték arra, hogy nem játszott vele.**

### ✅ A MŰKÖDŐ MÓDSZER — megint ugyanaz

Mindhárom torzítást **egyetlen mondata** korrigálta. ⇒ **Kérdezz, és a választ tekintsd
elsődlegesnek az adathoz képest** — az adat itt **kiegészítő**, ⛔ nem forrás.

📌 **A javaslataimban ezért mostantól kimondom a bizonytalanságot:** *„a nyilvántartás szerint
érintetlen — de lehet, hogy tévedek"*, ⛔ nem *„ezt még nem játszottad"*.

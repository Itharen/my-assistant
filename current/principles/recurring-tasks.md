# Recurring tasks

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag — itt szövegesen
> gyűjtjük, később az organizer-be visszük át mint recurring task / template.

---

## 2026-05-07 — fürdés időablak-megszorítás

> Ja, és plusz egy infó, hogy éjfél és reggel hét között nem fürödhetek, ami
> egy kicsit megbonyolítja itt nekünk a dolgokat.

**Következmény:** a fürdés ablak **00:00 – 07:00 között TILTOTT**. Csak
07:00–23:59 közötti idő-slot használható.

## 2026-05-07 — séta preferált időablak

> Még egy plusz info, hogy jobban szeretek este sétálni, amikor már satét
> van odakint. Ugye ehhez azt is figyelembe kell venni, hogy mikor sötétedik.

**Következmény (assistant-jegyzet):**
- A napi séta preferált slot-ja **napnyugta után** (sötétedéskor)
- A naplemente időpontja **szezonálisan változik** — emlékeztető-tervezésnél
  Budapest koordinátákra kell számolni (vagy egy egyszerű havi átlag-tábla)
- Indikatív naplemente Budapesten:
  | Hónap | Napnyugta (kb.) | "Sötét van" (~napnyugta + 30p) |
  |---|---|---|
  | január | 16:30 | 17:00 |
  | február | 17:15 | 17:45 |
  | március | 18:00 | 18:30 |
  | április | 19:45 | 20:15 |
  | május | 20:25 | 20:55 |
  | június | 20:45 | 21:15 |
  | július | 20:35 | 21:05 |
  | augusztus | 19:50 | 20:20 |
  | szeptember | 18:50 | 19:20 |
  | október | 17:45 | 18:15 |
  | november | 16:30 | 17:00 |
  | december | 16:00 | 16:30 |
- Pontos napnyugta-számítás kandidátus: organizer kalendár-modulba SunCalc-szerű
  helper, vagy egy heti cron ami beírja a `notifyAt` mezőbe
- Ütközés-handling: ha napnyugta utáni slot nem fér bele (pl. fürdés vagy
  bedtime miatt), engedett a napvilágban séta is, de a preferált a sötét

---

## 2026-05-07 — LinkedIn posztolás (heti 2-3×)

> Heti két alkalommal, illetve heti két-három alkalommal kéne a LinkedIn-re
> posztoljunk tanulságokat, amiket a héten összeszedtem.

## 2026-05-07 — LinkedIn pontosítás: scope és workflow

> A Linkedin-es heti tanulságokat nem itt gyűjtjük, az egy teljesen másik
> session, egy teljesen másik agent feladata. Azzal neked nem kell foglalkoznod,
> csak magával azzal, hogy a Linkedin bejegyzés elkészül-e, és az mikor. Mert
> az is egy feladat. Általában sétaközben szoktam rendszerezni a gondolataimat,
> diktációkat, hogy mivel mi van, illetve mik a tanulságok és a posztot is
> ilyenkor szoktam összeállítani.

**Következmény (assistant-jegyzet — felülírva):**
- **Out of scope:** a tanulságok gyűjtése (más agent / más session dolga)
- **In scope (itt):** csak a *kimenet* — heti 2-3 LinkedIn poszt **megjelenik-e**, és **mikor**
- Tracking: heti zárónapon (pl. vasárnap este) megnézni: `posztSzám >= 2` ?
  Nem → halogatás-szorzó aktív a következő hétre
- ⭐ **Workflow-összefüggés**: a user **séta közben** rendszerezi a gondolatait
  / diktálja / állítja össze a posztot → **séta = LinkedIn-poszt termelő idő is**.
  Ez azt jelenti hogy a séta szlot kettős hasznú, és a "preferált esti séta"
  (sötét + diktálás) egy összefüggő rituálé

---

## 2026-05-07 — kaja-rendelés pontosítás (kétféle rendelés + emlékeztető-stratégia)

> Valahogyan valahova azt is fel kéne írni, hogy a kajarendelés, ez ugye
> kétféle van. Az egyik a Tesco-ból, amikor mindenfélét rendelek a
> Tesco-ból, a másik pedig az, hogy hetes, és minden hétre rendelek az
> Interfood-tól kaját, ami általában napi két kaja. Minden hétköznapra
> rendelek az Interfood tolkaját. Ugye ez az, ami fel van írva már, hogy
> mindig valami csütörtökig le kell adni a rendelést a jövő hétre, és ugye
> erre a hétre van utoljára rendelve. Általában két hétre időnként háromra
> előre lehet rendelni, És aztán meg majd mindig emlékeztetned kell.
> Lehetőleg ne az utolsó pillanatban emlékeztes majd arra, hogy kaját kell
> rendelni, hanem jóval előtte. Jóval előtte, de azon az adott héten, amikor
> már utoljára van kajám, mert akkor fogok a leghosszabb távra előre
> rendelni, így kell a legkevesebb szer ismételni ezt a feladatot.

**Következmény (assistant-jegyzet):**

### Két különálló rendelés-típus

| Típus | Forrás | Mit | Ütem |
|---|---|---|---|
| 🛒 **Tesco-rendelés** | Tesco | mindenféle (bolti bevásárlás) | 2-3 hetente, lásd `current/shopping/list.md` |
| 🍱 **Interfood-rendelés** | Interfood | hétköznapra napi 2 kaja (azaz hét × 5 nap × 2 = 10 adag/hét) | csütörtökig leadni következő hét(ek)re |

A korábbi "Kaja-rendelés" sor → **Interfood**-ot fedi le. A Tesco külön sor.

### Interfood — előre-rendelési stratégia (új)

- Általában **2 hétre** előre lehet rendelni, **időnként 3 hétre** is
- Cél: **a leghosszabb elérhető távra** rendelni → minimalizálódik az ismétlés
- Mai helyzet (2026-05-07): erre a hétre van utoljára kaja → most 2-3 hétre érdemes előre rendelni, nem csak jövő hétre

### Emlékeztető-stratégia (új) — KRITIKUS

- ❌ **Ne** az utolsó pillanatban emlékeztetni (ez csütörtök este lenne)
- ✅ **Jóval előtte** emlékeztetni
- ✅ De **csak azon a héten** amikor a fedett-időszak utolsó hete kezdődik
  (mert ekkor lehet a leghosszabb távra előre rendelni → a legritkábban kell ismétlést kezdeni)
- Praktikus időzítés: az utolsó-fedett-hét **hétfő-keddjén** kezdeni az emlékeztetést,
  és a következő interakciókban ismételni a csütörtöki határidőig

---

## 2026-05-07 — TERA projekt ellenőrzés

> Fel kell írni még egy ismétlődő feladatot, ami az, hogy a Terra projektet
> két naponta ellenőrizni kell. Tegnap ellenőriztem utoljára. Illetve lehet,
> hogy nem is úgy kéne, hogy két naponta, hanem hogy minden kedden és
> csütörtöken igen, így lesz a jó.
>
> Sry typo, nem terra, hanem TERA

**Következmény (assistant-jegyzet):**
- Projekt-név: **TERA** (a "Terra" STT-typo, a user javította)
- Recurring trigger: **minden kedd + minden csütörtök** (ez a végleges szabály,
  a 2-naponta verzió felülírva)
- Utolsó elvégzés: 2026-05-06 szerda (a régi 2-naponta szabály alatt)
- Következő esedékes nap a kedd+csütörtök szabály szerint: **2026-05-07 csütörtök = MA**
- Csúszás → halogatás-szorzó (ha kihagyott egy keddet vagy csütörtököt)

---

## 2026-05-07 — céges hózárás (havi)

> A céges hónap zárást minden hónap második munkanapján kell megcsinálni, és
> ebben a hónapban most tegnap megcsináltam már.

**Következmény (assistant-jegyzet):**
- Recurring trigger: minden hónap **2. munkanapja**
- Munkanap = nem hétvége + nem magyar munkaszüneti nap
- 2026-05-06 szerda = utolsó elvégzés (a user tegnap csinálta meg, kicsit csúszva — ténylegesen 3. munkanap volt, mert máj. 1 ünnep, máj. 2-3 hétvége, máj. 4 hétfő = 1. munkanap, máj. 5 kedd = 2. munkanap, máj. 6 szerda = a tényleges nap)
- Következő trigger: **2026-06-02 kedd** (június 1 hétfő = 1., június 2 kedd = 2.)

---

## 2026-05-07 — fürdés időtartama

> Jó, még azt is felírhatnád, hogy általában olyan két-három órán keresztül
> fürdök, szóval annak majd úgy kell időt találni.

**Következmény:** a fürdés blokk **2-3 óra hosszú**. A 07:00–23:59-es ablakon
belül a legkésőbbi kezdés **~21:00** (3h-val 24:00-ra ér véget, épp a tiltás
határán). Tervezésnél előre 2-3h-ás slot-ot kell lefoglalni.

---

## 2026-05-07 — initial szabálycsomag

> Kéne ismétlődő feladatokat csináljunk, és ez az, hogy itt konkrét, pontos,
> bonyolultabb logikákra lenne szükség, és eznek igazából teljesen az
> organizerben lenne a helye.
> De egyelőre majd itt akkor most szövegesen leírogatjuk, hogy mik is a
> requestjeim, és akkor majd később, hogyha tudjuk, átköltöztetjük az
> organizerbe.
>
> mint például a takarítás, amit hetente egyszer ismételni kéne, mondjuk szerdán.
> Minden nap kéne sétálni legalább egyszer, de akár többször is.
> 3 hetente egyszer be kéne rakni egy mosást.
> A hetente kétszer fürdeni kéne.
> Van egy bevásárlási ismétlődés, ami valahogy úgy működik, hogy két-három
> hetente le kéne adni bevásárló megrendelést, amire folyamatosan gyűjtjük,
> hogy mi mindent kell venni.
> Illetve kaját kell rendeljek mindig előre. Most például erre a hétre még van
> kajám, de a jövő hétre már nincsen rendelve. És ezt mindig meg kell lépni még
> általában csütörtökig bezárólag. különben nem lesz kajám jövő héten és az
> nagyon drága szóval és ennek a prioritása például lehet, hogy nőhetne
> erősebben szóval hogyha most már szombat van és még mindig nem rendeltem
> kaját jövő hétre akkor ez a legfontosabb prioritás nagyon-nagyon magas
> prioritással kell rendelkezzen

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

| Feladat | Ismétlődés | Preferált nap/keret | Csúszás-kezelés |
|---|---|---|---|
| 🧹 Takarítás | hetente 1× | szerda | nem mondva, default = halogatás-szorzó |
| 🚶 Séta | naponta legalább 1× (akár több) | **preferált: napnyugta után** (szezonálisan változik) | naponta nézni hogy megvolt-e |
| 🧺 Mosás | 3 hetente 1× | bármikor | halogatás-szorzó |
| 🛁 Fürdés | hetente 2× | **07:00–23:59 között**, **2-3h hosszú blokk**, latest start ~21:00 | halogatás-szorzó |
| 🛒 Tesco-rendelés (bolti bevásárlás) | 2-3 hetente | bármikor | folyamatos shopping-list gyűjtés (`current/shopping/tesco.md`) a megrendelésig |
| 🍱 Interfood-rendelés (hétköznapi kaja, napi 2×) | hetente, **2-3 hétre előre** | csütörtökig bezárólag, **emlékeztető az utolsó-fedett-hét hétfőjén kezdjen** | szombatra eltolódva → MAX prio (nagyon-nagyon magas) |
| 🏢 Céges hózárás | havonta | minden hónap 2. munkanapja | csúszás → halogatás-szorzó |
| 🌍 TERA projekt ellenőrzés | heti 2× | **kedd + csütörtök** | csúszás → halogatás-szorzó |
| 💼 LinkedIn poszt (csak megjelenés-tracking, tartalom out of scope) | heti 2-3× | séta közben szokta összeállítani | heti 0-1 poszt → halogatás-szorzó |
| 🌙 Lefekvés-emlékeztető | csúszó (nem napi fix) | `wakeAt + 18-20h` | lásd `sleep-system.md` |

## Open kérdések — később tisztázandóak

- **Takarítás csúszás**: ha szerdán nem volt, mikor pótoljuk? (default: amint lehet, halogatás-szorzóval)
- **Séta**: count-alapú vagy duration-alapú? Most: csak "megvolt-e" elég.
- **Bevásárlás 2-3 hetente**: 14 vs 21 nap? Default: 18 nap (átlag), de a shopping-list mérete is befolyásolhatja.
- **Kaja-rendelés**: milyen eskalálódás-görbe? csütörtök = normál → péntek = warn → szombat = kritikus → vasárnap = blokkoló?

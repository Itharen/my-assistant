# Sleep system

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag.

---

## 2026-05-07 — fix paraméter: 18h ébrenlét

> Számoljuk fixen 18 órával az ébren léti időszakot, ne 18-20-szal.

**Következmény (assistant-jegyzet):** a `bedtimeCalc = wakeAt + 18h` egyetlen
fix érték. A korábbi 18-20h tartomány felülírva. Az ennél későbbi lefekvés már
warn / overshoot, nem normál tartomány.

---

## 2026-05-07 — külső anchor: péntek esti vendégek

> *"Illetve pénteken ilyen 6-7 körülőtől, inkább 7-től várható. minden héten
> péntek hívtől vendégek, szóval akkor sem nagyon lehet sétákat ütemezni.
> Általában ezt szoktam úgy főként megtörni a lendületet, meg a szokást."*

**Következmény:** péntek estefelé (18:00–19:00-tól) heti rendszerességgel
vendégek vannak → péntek estére sem lehet külső aktivitást (séta, hegy-mászás)
ütemezni. Lásd: `current/principles/fit-system.md`.

---

## 2026-05-07 — külső anchor: pénteki meeting

> Ja, és még egy csavar, ami megint kicsit bonyolítja a sztorit, hogy
> péntekenként, majdnem minden pénteken, ilyen délután egy óra körül van egy
> métingem, amikor ébren kell legyek. Ilyenkor általában egyszerűen előbb
> lefekszem. Kicsit megpróbálok addigra visszaállni.

**Következmény (assistant-jegyzet):** a csúszó ciklus heti egy fix horgonyt kap
(péntek ~13:00 ébren-kötelező). A user a meeting elé pozícionálja a ciklust:
- Péntek ~13:00 meeting friss állapotban → ébredés péntek ~10-12 körül
- 8h alvás → lefekvés péntek hajnal ~02-04
- Ez egy **rövid ciklus** csütörtökről péntekre (12-15h ébrenlét, nem 18-20h)
- Péntek után újra normál csúszó ciklus

**Csütörtöki bedtime-becslés** (ha péntek meeting-be akar friss lenni):
~02:00–04:00 péntek hajnal (csütörtöki 15:00-os ébredés után 11-13 óra ébrenlét).

⚠️ Ezt a "majdnem minden péntek" felülírja a default `wakeAt + 18-20h`-t a
csütörtök-péntek ciklusra.

---

## 2026-05-07 — initial deklaráció (alvás-ébrenlét + bedtime emlékeztetők)

> Valahogy majd azt is egy kicsit vezetni, meg rendszerezni kellene, hogy
> mikor vagyok ébren és mikor nem. Időnként egy két emlékeztető is kellene,
> hogy itt az ideje lefeküdni. Általában 18-20 órát vagyok ébren és 8 órát
> alszom, ezért elég nehéz trekkelni, hogy mikor van a most már le kéne
> feküdni időpont. Ma 15kor keltem.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Ciklus paraméterek

| Paraméter | Érték |
|---|---|
| Ébrenlét | **18 óra (fix)** |
| Alvás | 8 óra |
| Teljes ciklus | 26 óra (tehát **nem** 24h-os, csúszó) |

⚠️ A ciklus 26 órás → **csúszó alvás-ütemezés** (nem fix `night` időszak).
Ezért nem tudunk fix bedtime-emlékeztetőt adni nap-óra alapon (pl. "minden nap 23:00-kor").
Az emlékeztető kiszámítása: `bedtimeCalc = wakeAt + 18h` (egy fix érték, nem tartomány).

### Tracking mező-szerkezet (a `current/sleep/log.md`-ben)

| Mező | Leírás |
|---|---|
| `wakeAt` | Ébredés időpontja (ISO, +02:00) |
| `sleepAt` | Lefekvés időpontja (ISO, +02:00) — utólag rögzítve |
| `awakeDuration` | Számolt: `sleepAt - wakeAt` |
| `sleepDuration` | Számolt: `következő wakeAt - sleepAt` |
| `notes` | Opcionális: rosszul aludt, megszakítások, stb. |

### Emlékeztető-logika

Egy interakció elején, ha a user-aktivitás óta eltelt idő (`now - lastWakeAt`)
közeledik a fix 18h-hoz:
- **17h-nál**: első, finom heads-up ("közeledik a bedtime; készülj le a futó dolgokkal")
- **18h-nál**: bedtime — most kellene lefeküdni
- **19h+**: overshoot warn ("már túlcsúsztál a target bedtime-on; minden plusz óra leeszi a következő ciklus minőségét")
- **20h+**: kemény warn (diary-be jelölni)

### Open kérdések

- Milyen finomságú legyen a tracking? Csak `wakeAt` + `sleepAt` per nap, vagy alvás-szakaszok is (pl. szunyókálás)?
- A 26-28h-os ciklus "naptári napra" vetítve hogyan jelenjen meg? Lehet hogy egy kalendárium-napra 0 vagy 2 ébredés is jut.
- Notifikáció / Google Home integráció (lásd külön task) — itt jönne be a tényleges proaktív emlékeztetés. Most chat-alapú.

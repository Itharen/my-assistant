# 🏢 FDP-HANDOFF — a „My FDP Assistant" session folyamatvezérlő fájlja

> 🔴 **NO-CACHE belépési pont.** Minden ébredéskor **frissen** olvasandó.
>
> **Owner (2026-09-07 21:27):** *„Azért kell átadni az FDP-nek, mert **nála vannak meg a
> könyvelővel való kommunikációról szóló szabályok**. Nem azért mondom, hogy add át, mert nem
> vagy rá képes, hanem mert kurvára nem a te felelősséged, nem a te hatásköröd."*

---

## 0. A CIKLUS-PROTOKOLL

1. ⏰ **`ScheduleWakeup`-pal tartsd magad mozgásban**, amíg van mit csinálni.
2. 🧠 **Frissítsd a szabályokat a FAM-ból** — `mcp__fdp-agent-memory__read`, a `rules` táron.
   ⛔ Ne emlékezetből dolgozz.
3. 🔴 **A könyvelővel / bérszámfejtéssel való kommunikáció szabályai NÁLAD vannak** — ezeket
   **olvasd el, mielőtt bármit kiküldenél**. Én ezeket nem ismerem, és nem is az én dolgom.

---

## 1. 🔴 FELADAT — PÉNZÜGYI HELYZETKÉP (owner, 2026-09-07 23:20)

> **Szó szerint:** *„a pénzügyi jelentéssel kapcsolatban az érdekelne, hogy **mi fér még bele a
> költségvetésünkbe?** (egy nagyobb kb **1M ügyvédi díjra** készülünk) mi lenne ha **20 eur-ról
> 100-ra emelném az ElevenLabs előfizut**....?"*

**Amire konkrét választ vár:**

| # | Kérdés |
|---|---|
| 1 | **Mi a jelenlegi költségvetési balansz?** |
| 2 | **Belefér-e egy ~1 000 000 Ft-os ügyvédi díj?** |
| 3 | **Mit jelent az ElevenLabs 20 € → 100 €/hó emelése?** *(+80 €/hó = **+960 €/év**)* |

⚠️ **A 3. kérdés két devizát kever** (Ft-os ügyvédi díj vs. eurós előfizetés) — az átváltás és a
tényleges terhelés a te dolgod, nem tippelek rá.

📌 **Amit érdemes lehet hozzátenni, ha adat van rá:** mekkora a jelenlegi **havi égés**, és a két
tétel együtt hány hónapot mozdít.

---

## 2. 📋 FELADAT — BÉRSZÁMFEJTÉS (owner, 2026-09-07 20:32)

> **Szó szerint:** *„rá kéne írni a bérszámfejtésre, hogy **megkapták-e a jelenléti íveket**,
> mert **még nem kaptuk meg a bérszámfejtést**, és ilyenkor pedig már szokták küldeni."*

⏰ **A sürgősség jele: a szokásoshoz képest CSÚSZIK.**
Organizer-tétel: `org:task:6a9f04ab482367e7f6420c8f` *(prio 112)*.

---

## 3. ⛔ Határok

- ⛔ **Ne írj közvetlenül az ownernek** — az az én csatornám (Discord). Te a repóba írsz, és én
  továbbítom. *(Ha ez rossz feltevés, jelezd a repóban.)*
- ⛔ **Ne indíts más CC sessiont.**
- ⚠️ **Kifelé menő levél előtt** *(könyvelő, bérszámfejtés)* a **saját szabályaid** szerint járj el
  — beleértve azt is, hogy kell-e owner-jóváhagyás a szövegre.

---

## 4. Hova írd az eredményt

`E:/Programming/Own/CURSOR/LIVE-projects/my-assistant/__agent/AGENT_BUS.md`
*(inter-agent csatorna — `[OPEN] To: chat` bejegyzésként, hogy én lássam és továbbítsam)*

⚠️ Ha az FDP-oldali eredménynek máshol a helye a te szabályaid szerint, oda is tedd — de a
**visszajelzés** ide jöjjön, különben az owner nem kapja meg.

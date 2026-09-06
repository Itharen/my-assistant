# SCHEDULE — mikor triggerelj, és mit írj a triggerbe

> **Owner-kérés (2026-09-07):** *„majd mondd meg nekem, hogy mennyi időnként kéne
> beállítanom, a Scheduled, ami triggerelt téged, és mi legyen az üzenet. Általában az üzenet
> annyi szokott csak lenni, hogy rámutatunk a kiindulási workflow file-ra, és emlékeztetjük a
> szabályfrissítési szabályra, hogy frissítsen szabályt rendszeresen… Reggel nem ártana egy
> újraindítás ELSŐNEK"*

---

## 📋 A JAVASLAT — másold ki

### 1️⃣ Fő ütemezés — **60 percenként**

**Üzenet (ez a kanonikus szöveg):**

```
Folytasd. Belépési pont: __agent/ENTRY.md · Állapot: __agent/CONTINUATION.md
Mindkettőt FRISSEN olvasd be. A kör végén frissítsd a tudást és a szabályokat
(ENTRY §5), hogy ne vesszen el a kontextus-kompaktálás során.
```

### 2️⃣ Napi reggeli ütemezés — **06:30**, EGYSZER naponta

**Üzenet:**

```
NAPINDÍTÁS. Belépési pont: __agent/ENTRY.md §0 — ELSŐ lépés a rendszer újraindítása,
utána a napi áttekintés. Állapot: __agent/CONTINUATION.md. Mindkettőt FRISSEN olvasd be.
```

---

## Miért 60 perc — és miért NEM sűrűbb

| Érv | Mérés / indok |
|---|---|
| Ez volt az eredeti terved | *„kapsz egy óránkénti triggert, meg egy workflow-t"* — a flow neve is `hourly-assistant-tick` |
| ⭐ **A Discord-üzenetek NEM ezen múlnak** | a figyelő **push-alapú**: amit írsz, az **15 mp-en belül** átjön, függetlenül az ütemezéstől. Az ütemezés **csak a proaktív körökre** kell. |
| Egy trigger = egy teljes futás | *(a te szavaddal: „minden egyes prompt egy hosszabb futást eredményez")* — a sűrűbb ütemezés nem ad több információt, csak több futást éget |
| Az esemény-riasztás pontossága | 60 perc **elég** a készülődés-kezdéshez, mert azt **órákkal előre** ki tudom számolni — nem a tick pillanatában derül ki |

⛔ **Sűrűbbre (15–30 perc) NE állítsd**, amíg nincs olyan képesség, ami ezt indokolja.
Az éjszakai órák amúgy is csendesek: a tick **gyűjt, nem értesít** *(kivéve a valóban nem
halasztható dolgot — `Q-2026-09-06-07`)*.

### Ha kevesebb futást akarsz

Éjszakára (a te alvás-ciklusod szerint) elég **3 óránként**. ⚠️ De ez **csak akkor**, ha az
ütemező tud idősávot — ha nem, maradjon az egységes 60 perc, mert **egy egyszerű ütemezés,
ami tényleg lefut, többet ér, mint egy okos, ami elromlik.**

---

## Miért kell a KÜLÖN reggeli trigger

A 60 perces körben a „napindítás" **elveszne** — egy lenne a huszonnégyből. Pedig a nap első
köre **más**: ekkor kell újraindítani a rendszert, és ekkor kell végigvenni, mi jön ma.

⚠️ **Az ütemezett 06:30 nem azonos az ébredéseddel** *(csúszó ciklus — `sleep-system.md`)*.
Az `ENTRY.md §0` ezt kezeli: ha még alszol, a napindítás **elvégzi a technikai részt**
(újraindítás, adat-frissítés), de **nem szól** — a napi áttekintés az **ébredés utáni** első
körben megy ki.

---

## Az üzenet felépítése — miért pont ennyi

A `core-wakeup-state-file` szabály szerint a trigger-üzenet **rövid pointer**, ⛔ nem az
állapot maga. **Két** fájlra mutat:

| Pointer | Mi ez |
|---|---|
| `__agent/ENTRY.md` | **a feladat + a szabályok** — mit csinálj, milyen sorrendben |
| `__agent/CONTINUATION.md` | **az állapot** — hol tartunk, mi a következő lépés |

⛔ **TILOS** a trigger-szövegbe update-et, szabályt vagy tanulságot halmozni: befagy az
ütemezés pillanatában, te nem látod, a sessionnel együtt meghal, és csendben csonkolódik.
**Ami körről körre változik, az a FÁJLBA megy, nem a promptba.**

A harmadik mondat (*„frissítsd a tudást és a szabályokat"*) a te kifejezett kérésed —
enélkül a tudás a kompaktálásokkal lassan elkopik.

---

## Karbantartás

Ha az ütemezés vagy az üzenet változik, **ide is át kell vezetni** — ez a kanonikus szöveg.
A trigger-üzenetet **innen másoljuk**, nem emlékezetből írjuk.

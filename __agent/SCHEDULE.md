# SCHEDULE — mikor triggerelj, és mit írj a triggerbe

> **Owner-kérés (2026-09-07):** *„majd mondd meg nekem, hogy mennyi időnként kéne
> beállítanom, a Scheduled, ami triggerelt téged, és mi legyen az üzenet. Általában az üzenet
> annyi szokott csak lenni, hogy rámutatunk a kiindulási workflow file-ra, és emlékeztetjük a
> szabályfrissítési szabályra, hogy frissítsen szabályt rendszeresen… Reggel nem ártana egy
> újraindítás ELSŐNEK"*

---

## 📋 A JAVASLAT — másold ki

### 1️⃣ Fő ütemezés — **20 percenként** *(owner állította, 2026-09-07)*

**Üzenet (ez a kanonikus szöveg):**

```
Folytasd. Belépési pont: __agent/ENTRY.md · Állapot: __agent/CONTINUATION.md
Mindkettőt FRISSEN olvasd be. A kör végén frissítsd a tudást és a szabályokat
(ENTRY §5), hogy ne vesszen el a kontextus-kompaktálás során.
```

### 2️⃣ Napindítás — ⚠️ NEM órához kötve

> 🔴 **KORREKCIÓ (owner, 2026-09-07 06:30):** *„alapvetően teljesen máskor fogok majd minden
> nap kelni, úgyhogy a napindítás azt majd valami eseményhez kell kötni, de például ez az
> esemény lehet az, hogy az első aktivitás érzékelés miután aludtam."*
>
> ⇒ **A korábbi 06:30-as fix ütemezés ELAVULT.** ⛔ Ne állítsd be.

**A napindítás TRIGGERE: az ÉBREDÉS-ESEMÉNY**, amit a jelenlét-mérésből olvasunk ki:

```
hosszú tétlen/üres szakasz  →  az ELSŐ aktív minta  =  ÉBREDÉS
```

Ezt **nem külön ütemezés** végzi, hanem a **60 perces fő kör**: minden körben megnézi, volt-e
ébredés-esemény az előző kör óta, és ha igen, **azzal kezd**. Így nincs második ütemezés,
amit karban kellene tartani — és a napindítás **akkor** fut, amikor tényleg felkeltél.

📌 A felismerés részletei és a küszöb: `__agent/ENTRY.md` §0.

---

## ⛔ ELAVULT SZAKASZ-CÍM: „Miért 60 perc" — az ütemezés MOST **20 perc**

| Érv | Mérés / indok |
|---|---|
| Ez volt az eredeti terved | *„kapsz egy óránkénti triggert, meg egy workflow-t"* — a flow neve is `hourly-assistant-tick` |
| ⭐ **A Discord-üzenetek NEM ezen múlnak** | a figyelő **push-alapú**: amit írsz, az **15 mp-en belül** átjön, függetlenül az ütemezéstől. Az ütemezés **csak a proaktív körökre** kell. |
| Egy trigger = egy teljes futás | *(a te szavaddal: „minden egyes prompt egy hosszabb futást eredményez")* — a sűrűbb ütemezés nem ad több információt, csak több futást éget |
| Az esemény-riasztás pontossága | 60 perc **elég** a készülődés-kezdéshez, mert azt **órákkal előre** ki tudom számolni — nem a tick pillanatában derül ki |

> ⛔ **KORÁBBAN ITT AZ ÁLLT:** *„Sűrűbbre (15–30 perc) NE állítsd, amíg nincs olyan
> képesség, ami ezt indokolja."* — **ELAVULT.** Az owner 2026-09-07-én **60 → 30 → 20 percre**
> vitte le, a saját döntése alapján.
>
> ⭐ **És közben lett is az az „olyan képesség", ami indokolja:** a **Discord-visszaolvasás**
> *(`ma comm history` + `ma comm audit`)*. Amíg a kézbesítés nem megbízható, **a kör MAGA a
> biztonsági háló** — minél sűrűbb, annál rövidebb ideig marad észrevétlen egy elakadt üzenet.
> Owner: *„vissza kéne olvasd a discord üzeneteket időnként amíg nem százas az eszközünk"*.
>
> ⚠️ **Ami emiatt mérendő:** sűrűbb kör = több futás = több terhelés azon a gépen, ahol a RAM
> már ma is szűkös *(93%-nál az FDP AI várakozik)*. Ha ez gondot okoz, az **mérhető** lesz —
> nem tippelni kell rá.
Az éjszakai órák amúgy is csendesek: a tick **gyűjt, nem értesít** *(kivéve a valóban nem
halasztható dolgot — `Q-2026-09-06-07`)*.

### Ha kevesebb futást akarsz

Éjszakára (a te alvás-ciklusod szerint) elég **3 óránként**. ⚠️ De ez **csak akkor**, ha az
ütemező tud idősávot — ha nem, maradjon az egységes 60 perc, mert **egy egyszerű ütemezés,
ami tényleg lefut, többet ér, mint egy okos, ami elromlik.**

---

## Miért NEM kell külön reggeli trigger

Eredetileg egy fix 06:30-as triggert javasoltam. **Az owner ezt felülírta** *(2026-09-07)*:
a kelése napról napra máshova esik, tehát egy naptári időpont **rendszeresen rossz** lenne —
vagy órákkal az ébredés előtt fut, vagy jóval utána.

⇒ **Egyetlen ütemezés van: a 60 perces kör.** Az ébredés **esemény**, nem időpont; a kör
minden alkalommal megnézi, történt-e — és ha igen, a napindítással kezd.

⭐ **Miért jobb:** egy ütemezés helyett nulla plusz karbantartás, és a napindítás
**pontosan akkor** történik, amikor értelme van. *(A régi fix időpont ráadásul pont az ellen
hatott, amit a `sleep-system.md` rögzít: a ciklus csúszik.)*

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

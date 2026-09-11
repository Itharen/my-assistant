# ⏰ ÉBRESZTÉS-ESZKALÁCIÓ — halkan kezdem, hangosan végzem

> **Owner, 2026-09-11 02:47-02:48:** *„ránézel, hogy van-e aktivitásom, és hogyha nincs
> aktivitásom, az azt jelenti, hogy **még alszom**, és ilyenkor megpingelsz Discordon, és ha nem
> válaszolok, akkor pedig a **Google Home-on keresztül szólsz egy 5-10 perccel a meeting előtt**,
> hogy mindjárt meeting van."* · *„a kettő között… elküldöd, meg ilyen **schedule wake-up, egy
> kicsit vársz**."*

⭐ **Az elv:** a **legkevésbé zavaró** csatornával kezdek, és csak akkor lépek hangosabbra, ha az
előző **nem ért célba**. ⛔ Nem azért, mert a hangszóró rossz — hanem mert ha **ébren van**, a
hangos ébresztés **fölösleges zaj**.

---

## A LÉTRA

```
1. AKTIVITÁS-ELLENŐRZÉS     nincs aktivitás  →  valószínűleg ALSZIK
2. DISCORD-PING             halk, nyomot hagy
3. VÁRAKOZÁS                schedule wake-up — ⛔ nem azonnal eszkalálok
4. NINCS VÁLASZ →  🔊 GOOGLE HOME, az esemény előtt 5-10 perccel
```

| Lépcső | Eszköz | Mikor lép tovább |
|---|---|---|
| **1. mérés** | `server/activity-monitor` *(ablak + idle)* | ha **van** aktivitás → ⛔ nem ébresztek, csak írok |
| **2. Discord** | `ma comm say` | ha **nem válaszol** a következő körig |
| **3. várakozás** | a **20 perces** fő ütemezés vagy `ScheduleWakeup` | — |
| **4. hang** | `ma cast notify` *(Google Home)* | **T−5…10 perc** — ez az **utolsó** lépcső |

---

## ⚠️ A MÉRT IDŐZÍTÉSI KOCKÁZAT — ezt tudni kell

🔴 **MÉRVE 2026-09-11 02:51 (owner):** a fő ütemezés **NEM 20 perc, hanem 3 ÓRA** — *„a CCAP-ban
él a valóság"*. A `SCHEDULE.md` 20 perces értéke **elavult**.

⇒ **3 órás raszterrel az 5-10 perces ablak nem hogy kimaradhat — jó eséllyel KI IS MARAD.**
Előfordulhat, hogy **09:00 és 12:00 között egyáltalán nem futok le**.

⇒ **Ezért az időzített ébresztésnél ⛔ NEM hagyatkozom a fő ütemezésre**: a kritikus lépcsőre
**külön `ScheduleWakeup`-ot** kell kérni, az ablak elejére.

📌 **És kimondom neki**: az ébresztés a rendszeren keresztül **nem garantált**. Ha az esemény
tényleg számít, a telefon-ébresztő **párhuzamosan** is legyen beállítva. ⛔ Nem ígérek olyat,
amiért nem tudok helytállni.

---

## Mit mondjak a 4. lépcsőn

⛔ Ne a teljes napirendet. Egy mondat, ami **felébreszt és tájékoztat**:

> *„Mindjárt kezdődik a meeting — 11:00-kor, online."*

⚠️ A hangerő: a `cast-notifier` alapértelmezése **save → up → restore**
*(`cast-notifier-defaults.md`)* — ébresztésnél ez **kell**, mert az esti halk szint reggel nem
ébreszt fel.

Kapcsolódó: [[day-boundary-is-sleep]] · [[sleep-system]] · [[cast-notifier-defaults]] ·
[[message-delivery-reliability]] · `__agent/flows/recurring/schedule-guardian/`

---

## 🥇 AZ ŐSZINTE SZEREPOSZTÁS (owner, 2026-09-11 02:51)

> *„Be fogok állítani magamnak mindenféle ébresztőt, és általában ez szokott működni, és föl
> szoktam tudni kelni, csak **akarok egy ilyen tesztet is**, ami hogyha felébredek, **nem fog
> elsülni**, de azért jó lenne, ha felírnánk, meg **úgy ez lenne az alap**."*

| Ki | Szerep |
|---|---|
| **az ő saját ébresztője** | 🥇 **az elsődleges** — ez működik, ezen múlik, hogy felkel |
| **az én eszkalációm** | 🧪 **teszt + tartalék** — ha ébren van, **el sem sül** |

⭐ **De „az alap" — vagyis a viselkedés ATTÓL MÉG ALAPÉRTELMEZETT.** ⛔ Nem kell külön kérnie:
minden időzített eseménynél **magamtól** lefuttatom a létrát.

📌 **Ettől lesz ez tiszta:** nem ígérek megbízhatóságot, amit nem tudok tartani — de a **rendszeres
próbálkozást** igen. És minden lefutás **adat** arról, hogy működik-e.

---

## 🧮 A DÖNTÉSI SZABÁLY — hasonlítsd a HATÁRIDŐT a KÖVETKEZŐ TRIGGERHEZ

> **Owner, 2026-09-11 02:56:** *„azt szeretném, hogy a következő ütemed alapján meg tudd mondani,
> hogy a következő háromórás trigger **előtte vagy utána** lesz, és akkor, hogyha **előtte vagy**,
> akkor beállítasz egy **schedule wake-up**-ot."*

```
minden körben, ha van időzített teendőm:
    a következő ÜTEMEZETT trigger  <  a határidő ?
        IGEN → ⛔ nem kell semmi, a rendes kör elkapja
        NEM  → ⚡ ScheduleWakeup, hogy én magam fedezzem le a rést
```

### ⚠️ A HÁROM MÉRT KORLÁT — ⛔ ezek nélkül a szabály hamis biztonságot ad

| Eszköz | Korlát | Következmény |
|---|---|---|
| **`ScheduleWakeup`** | a futtató **1 órára vágja** *(60–3600 s)* | ⛔ **7 órás horizontot NEM tud átfogni.** Csak az **utolsó mérföldre** jó |
| **`CronCreate`** | **session-only** — *„nothing is written to disk, gone when Claude exits"* | ⚠️ a session **újraindulhat** *(ma éjjel többször is)*, és akkor a job **elvész** |
| **a fő CCAP-ütemezés** | **3 óra**, és a **fázisát nem látom** | ⛔ nem tudom kiszámolni, mikor jön a következő |

🔴 **Az őszinte összegzés:** egy **több órával későbbi** ébresztésre **egyik eszköz sem
megbízható**. ⇒ **Ezt ki kell mondani neki**, ⛔ nem elhallgatni. A saját ébresztője az
elsődleges; az enyém **tartalék**.

⭐ **De a szabály attól még ÉRVÉNYES**, és pont az utolsó mérföldön ér a legtöbbet: ha egy körben
azt látom, hogy a határidő **1 órán belül** van, a `ScheduleWakeup` **biztosan** lefedi.

### Mért alkalmazás — 2026-09-11 02:57

| Lépés | |
|---|---|
| határidő | **10:22** *(a 11:00-s míting előtt, a létra indítására)* |
| távolság | **~7,5 óra** ⇒ ⛔ a `ScheduleWakeup` 1 órás plafonja **nem éri el** |
| amit tettem | **`CronCreate` one-shot**, `22 10 11 9 *`, job `d82bebb3` |
| ⚠️ a kockázat | **session-only** — ha a session újraindul, **elvész**. Ezt **megmondtam neki** |


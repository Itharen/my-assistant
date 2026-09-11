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
| **3. várakozás** | a **3 órás** fő ütemezés vagy egy **CCAP scheduler-job** ⛔ *(nem `ScheduleWakeup` — lásd lent)* | — |
| **4. hang** | `ma cast notify` *(Google Home)* | **T−5…10 perc** — ez az **utolsó** lépcső |

---

## ⚠️ A MÉRT IDŐZÍTÉSI KOCKÁZAT — ezt tudni kell

🔴 **MÉRVE 2026-09-11 02:51 (owner) + 03:10 (én, a CCAP-ban):** a fő ütemezés **NEM 20 perc, hanem
3 ÓRA** — *„a CCAP-ban él a valóság"*. A `SCHEDULE.md` 20 perces értéke **elavult**.

⇒ **3 órás raszterrel az 5-10 perces ablak nem hogy kimaradhat — jó eséllyel KI IS MARAD.**
Előfordulhat, hogy **09:00 és 12:00 között egyáltalán nem futok le**.

⇒ **Ezért az időzített ébresztésnél ⛔ NEM hagyatkozom a fő ütemezésre**: a kritikus lépcsőre
**külön CCAP scheduler-jobot** hozok létre az ablak elejére. ⛔ **`ScheduleWakeup`-ot NEM** — az
bedugja a session sorát *(lásd a mérést lent)*.

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
        NEM  → ⚡ CCAP scheduler-job (one-shot), hogy én magam fedezzem le a rést
```

### 🔴 A HÁROM ESZKÖZ — MÉRVE A CCAP KÓDJÁBAN, 2026-09-11 03:10

> **Owner, 2026-09-11 03:02:** *„a CC session, schedule a wake-up-nak vannak korlátai, de az
> **nálunk nem működik egyáltalán**, mivel nem úgy működünk, és **minden futásod végén vége szakad
> minden CC dolognak**. Ezért a **CCAP-nak van egy saját megoldása**… viszont a CCAP-ban meg a
> Schedule Wake Up **megfogja a sort**, és utána **semmilyen üzenet nem érkezik** abba a sessionbe,
> amíg az fel nem oldja."*

⭐ **Utánanéztem a CCAP forrásában, és igaza van — sőt, pontosabban is meg tudom mondani, miért.**

| Eszköz | Mit csinál VALÓJÁBAN | Verdikt |
|---|---|---|
| **`CronCreate`** | a CC-folyamat **memóriájában** él, semmi nem íródik lemezre | ⛔ **Használhatatlan.** A futás/session végén elvész |
| **`ScheduleWakeup`** | ⭐ a CCAP **elkapja** és **maga hajtja végre** *(`CC_ScheduleWakeupEvent_Util`)* — tehát **túléli a futásomat**… | ⛔ **DE: head-blocking.** Lásd lent |
| **CCAP scheduler-job** | MongoDB-ben *(`ccap_sch_job`)*, node-cron, bootstrapkor újratöltve | ✅ **EZ a helyes eszköz** |

### ⛔ MIÉRT NEM SZABAD `ScheduleWakeup`-ot használni hosszú várakozásra

🔴 **Mért bizonyíték** — `cc-schedule-wakeup-event.util.ts`, `REQ-MSG-DELAYED-QUEUE-NATIVE-001`:
a wakeup-prompt **azonnal bekerül a SessionQueue-ba** egy `delayUntil` flaggel, és a queue
**head-blocking FIFO**:

> *„a head-blocking gate a lejáratig **feltartja a kézbesítést (a mögötte állókat is)**"*
> — `ccap-session-queue-item.data-model.ts`: *„nem kézbesítődnek, amíg a delay le nem jár"*

⇒ **Egy 1 órás `ScheduleWakeup` egy órára BEDUGJA a sessionömet.** Amit az owner ez alatt ír,
az **nem ér el hozzám** — pontosan ezt mérte. ⛔ **Ezért a `ScheduleWakeup` nem „tartalék", hanem
KÁROS**, ha percnél hosszabb.

### ✅ A HELYES ESZKÖZ — CCAP scheduler-job REST-en

```bash
# lista + a SAJÁT ütemezésem fázisa
curl -s http://localhost:39050/api/sch/jobs
curl -s http://localhost:39050/api/sch/jobs/<jobId>      # → nextDueAt

# EGYSZERI ébresztő (auto-disable egy futás után)
curl -s -X POST http://localhost:39050/api/sch/jobs -H "Content-Type: application/json" -d '{
  "name": "...", "enabled": true, "ownerCcapId": "<a CCAP instance id>",
  "schedule": { "preset": "daily", "times": ["10:50"] },
  "timezone": "Europe/Budapest",
  "target": { "type": "cc-session", "payload": {
      "sessionId": "<a sajat ccs-...>", "ccapId": "<ccapId>", "promptContent": "<rovid pointer>" } },
  "maxExecutions": 1, "effectiveUntil": "<ma 23:59+02:00>"
}'
```

⭐ **`maxExecutions: 1` + `effectiveUntil` = valódi one-shot** — egy futás után magától kikapcsol,
nem marad utána napi szemét. ⛔ De **ellenőrizni kell**: a `POST` válasza `nextDueAt: null`-t ad,
a **tényleges** érték csak a következő `GET`-en látszik *(a scheduler tölti ki reload után)*.

### 🧭 A FÁZIST MOST MÁR LÁTOM — ⛔ nincs többé „nem tudom, mikor jön a következő"

A fő ütemezésem **job `6a9e3ccb3fff98f808dc9e92`** *(„My Assistant Auto")* — `every-n-hours`, **3 óra**;
a `nextDueAt` mezője **megmondja a következő triggert**. ⇒ A döntési szabály fenti kérdése
*(„a következő trigger a határidő előtt vagy után?")* mostantól **mérhető**, nem becslés.

### Mért alkalmazás — 2026-09-11 03:10

| Lépés | |
|---|---|
| esemény | **11:00** online míting |
| a fő ütemezés rasztere | `nextDueAt` = 04:00Z ⇒ **03:00 / 06:00 / 09:00 / 12:00** *(CEST)* |
| a rés | a **09:00**-s kör után a következő csak **12:00** — az esemény UTÁN ⇒ kell külön trigger |
| ⛔ amit NEM tettem | `ScheduleWakeup` *(bedugná a sort)* · `CronCreate` *(elvész)* |
| ✅ amit tettem | **CCAP scheduler-job `6aa354d184f43155b757e2e8`**, `daily 10:50` Europe/Budapest, `maxExecutions: 1` |
| igazolás | `GET .../jobs/6aa354d184f43155b757e2e8` → `nextDueAt: 2026-09-11T08:50:00.000Z` = **10:50 CEST** ✅ |
| ⚠️ ami marad | ha a **CCAP szerver áll** 10:50-kor, kimarad. A saját ébresztője marad az **elsődleges** |

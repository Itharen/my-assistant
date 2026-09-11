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

> ⚠️ **Az 1. lépcső korlátja — owner, 2026-09-11 03:27:** *„azt magyaráztam, hogy **már az ágyban
> fekszem. Már a telefonnal beszélgetünk.**"* ⇒ A mérés **csak a gép előtti jelenlétet** látja —
> az ágyból, telefonról folytatott beszélgetés **nem látszik benne**. Az **„ágyban, de ébren"**
> és az **„alszik"** állapot **megkülönböztethetetlen** — mindkettő „nincs aktivitás".
> ⭐ **Ez a létrára nézve rendben van**, mert a lépcsők **sorrendje** véd: a Discord-ping (2.)
> halk, és ha ébren van, **ő maga állítja le** a láncot. ⛔ Csak azt nem szabad hinnem, hogy a
> „nincs aktivitás" **bizonyíték** az alvásra — az csak **hiányzó bizonyíték az ébrenlétre**.
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

---

## ❓ „MŰKÖDIK-E KÉT SCHEDULE UGYANARRA A SESSIONRE?" — mérve 2026-09-11 03:22

> **Owner, 2026-09-11 03:14:** *„A CCAP-ban is van beépített Schedule Wake Up, amit pontosan
> ugyanúgy hívsz meg, mint amikor a sajátodat meghívod… **te azt hiszed, hogy a sajátodat hívod**,
> de ilyenkor elindul a CCAP-nek a Schedule Wake Up-ja, ami **jól működik** amúgy."* ·
> *„amit most viszont beállítottál, az egy másik sztori, **azt nem is teszteltem még**, hogy vajon
> működik-e, ha **két schedule van beállítva ugyanarra a sessionre**, mert most ez történik."*

⭐ **Igaza van mindkettőben.** A `ScheduleWakeup` tényleg a CCAP-é — és a rövid várakozásra
**jó eszköz**; a tilalom CSAK a hosszú várakozásra szól *(head-blocking, lásd fent)*.

### A két-schedule kérdés — a válasz KÉT RÉTEGŰ

| Réteg | Mit csinál | Verdikt |
|---|---|---|
| **collision-resolver** | `getLastNonSkippedForJob(jobId)` — a job a **SAJÁT** előző futását nézi *(`sch-runner.control-service.ts:180`)* | ✅ **Két job NEM látja egymást.** Nem blokkolják egymást |
| 🔴 **queue-aware gate** | `SQ_ControlService.hasQueuedItems(sessionId)` — **session-szintű** *(`sch-runner…ts:395-406`)* | ⛔ **ITT ütköznek** |

🔴 **A MÉRT KOCKÁZAT** — `BUG-SCH-SUPPRESS-SCHEDULED-TRIGGER-WHEN-QUEUE-HAS-DELAYED-001`:

> *„Amikor van message a message queue-ban **bármilyen formában** legyen az delayed message,
> olyankor nem kéne elküldjük a sc[heduled message-et]"*

⇒ **Ha a session sorában BÁRMI áll, az ütemezett trigger NÉMÁN elmarad.** Tehát ha 10:50-kor
ott ül a queue-ban a 3 órás tick promptja *(vagy egy Discord-üzenet)*, **az ébresztő kimarad**.

⭐ **Ami tompítja:** a sorban csak akkor áll valami, ha **forgalom van** — és a forgalom
jellemzően azt jelenti, hogy **ébren van**. ⛔ De nem légmentes: egy beragadt régi elem is elnyomná.

⭐ **Ami véd:** *„csak POZITÍV bizonyíték nyom el triggert"* — az olvasás hibája **nem** blokkol,
és a kézi „Trigger Now" **soha** nem nyomódik el. Nincs beragadó flag *(állapotmentes gate)*.

### Amit ebből vinni kell

1. ⛔ **Ne kombinálj `ScheduleWakeup`-ot ütemezett jobbal ugyanazon a sessionön** — a wakeup
   queue-eleme **pont azt a gate-et** húzza be, ami az ütemezett triggert elnyomja. **Dupla kár.**
2. 📌 **Az ütemezett ébresztő BEST-EFFORT, nem garancia** — ezt ⛔ nem hallgatom el.
3. ✅ **Az ELSŐ futás nem eshet collision-skipbe** *(nincs előző execution → `buildNoCollision`)* —
   egy friss one-shot job ennyivel jobb helyzetből indul, mint egy régóta futó.
4. 🔍 **Utólag ellenőrizhető:** `GET /api/sch/executions?jobId=<id>` — a skip **auditálva van**
   *(`lastSkippedAt` a jobon is látszik; a fő tickem pl. 2026-09-10 22:00-kor skip-elt)*.

---

## 🔴 A KETTŐ KIZÁRJA EGYMÁST — és ez a rendszer egy mért gyengesége (2026-09-11 03:28)

> **Owner, 2026-09-11 03:16-03:17:** *„akár mostantól is beállíthatsz egy schedule wake-up-ot a
> következő fontos ébredésre, és akkor **kapsz egy izét, egy lockot**, és akkor fogsz ébredni
> legközelebb azzal az üzenettel."* · *„elméletileg **6-kor** lesz a következő, aztán **9-kor**…
> És akkor **9-kor beállíthatsz magadnak egy schedule wake-up-ot**, ami X óra, Y perc után
> küldődjön el."*

⭐ **Ez az ő tervezett útja, és tudja, hogy lockkal jár.** ⇒ Ezt követem.

### ⚠️ DE: a `ScheduleWakeup` és az ütemezett job KIOLTJA EGYMÁST

🔴 **Mérve** — `sq.control-service.ts:1423`:

```ts
hasQueuedItems(sessionId) { return !!queue?.length; }          // ⚠️ NYERS — a delay-held elemet IS számolja
hasDeliverableQueuedItems(sessionId) { … isHeadDeliverable(…) } // ✅ a jövőbeli delayUntil-t KISZŰRI
```

A scheduler queue-aware gate-je a **NYERSET** használja *(`sch-runner…ts:395`)*.
⇒ **Amíg egy `ScheduleWakeup` delay-held eleme a sorban ül, MINDEN ütemezett trigger elmarad**
arra a sessionre. A kód maga nevezi meg ezt az esetet *(„pl. CC ScheduleWakeup delayed-prompt")* —
a ghost-reconcile **pont emiatt** váltott át a `hasDeliverable…`-ra, a scheduler **nem**.

📌 **Következmény a gyakorlatban:** ⛔ **ne fusson egyszerre a kettő.** Vagy wakeup-lánc, vagy
ütemezett job — a kettő együtt **rosszabb, mint bármelyik önmagában**.

### ⛔ EZ NEM BUG — SZÁNDÉKOS TERVEZÉS *(owner-korrekció, 2026-09-11 03:24)*

> *„**Nem bug, ez a szándékos működés.** Hogyha delayed message van, amit schedule wake-up-pal
> küldtek, vagy én beállítottam egy delayed message-et, az queue-ba kerül, és az **megfogja a
> queue-t**… Sőt, amikor a queue-ban vannak dolgok, akkor a **schedule triggering sem küld
> triggert**, mert **fogva van az a session**. Ez szándékosan van így."* ·
> *„Ennek a célja, hogy **teljes kontrollunk legyen a session fölött**."*

🔴 **Tévedtem, és ezt vissza kell vonni:** a nyers `hasQueuedItems` **nem elnézés**, hanem a
tervezés lényege. A sor egy **birtoklási zár**: aki elemet tesz bele, az **birtokolja a sessiont**,
amíg az le nem jár. Az ütemezett trigger azért marad el, mert a session **foglalt** — ⛔ nem azért,
mert valaki elfelejtett szűrni.

⚠️ **A tanulság rólam:** két függvény közti eltérésből *(`hasQueuedItems` vs.
`hasDeliverableQueuedItems`)* **szándékot** olvastam ki. Az eltérés **tény** volt, a „bug"
**következtetés** — és nem az enyém volt kimondani. ⇒ Eltérésnél a helyes forma:
**„ez eltér, mi a szándék?"**, ⛔ nem **„ez bug"**. *(`core-no-guessing`)*

📌 **Ami ebből GYAKORLATILAG következik, változatlanul érvényes:** ⛔ ne fusson egyszerre
wakeup-lánc és ütemezett job ugyanazon a sessionön. De ez mostantól **a rendszer szabálya**,
amihez igazodom — nem hiba, amit jelenteni kell.

### ⭐ AMI VISZONT JOBB, MINT HITTEM: a wakeup TÚLÉLI A SZERVER-RESTARTOT

A wakeup **két** dolgot hoz létre: egy in-memory `setTimeout`-ot **és** egy **perzisztált
queue-elemet** `delayUntil`-lel *(`sq.control-service.ts` „Persisted queue recovery (server restart)")*.
A kézbesítést a **queue head-blocking gate-je** végzi a lejáratkor — tehát a restart a `setTimeout`-ot
elviszi, de a **queue-elem megmarad**. ⇒ ⛔ Korábban azt írtam, hogy restartkor elvész — **pontatlan volt**.

### A MAI TERV (2026-09-11) — a döntési szabály alkalmazva

| Idő | Mit teszek |
|---|---|
| **06:00** tick | ⛔ semmi — a következő tick *(09:00)* **a határidő előtt** van |
| **09:00** tick | 1️⃣ aktivitás-ellenőrzés + **Discord-ping** · 2️⃣ a **10:50-es jobot törlöm** *(hogy ne oltsa ki a láncot)* · 3️⃣ `ScheduleWakeup` **3600 s → 10:00** |
| **10:00** wake | aktivitás-ellenőrzés. Ha **aktív** → ⛔ vége, nem ébresztek. Ha nem → `ScheduleWakeup` **3000 s → 10:50** |
| **10:50** wake | 🔊 **Google Home** — *„Mindjárt kezdődik a meeting — 11:00-kor, online."* |

⚠️ **A lánc ára:** 09:00–10:50 között a sorom **fel van tartva** — amit ekkor ír, az a következő
wake-nél érkezik meg hozzám, nem azonnal. **Ezt ő tudja és vállalta** *(„kapsz egy lockot")*.

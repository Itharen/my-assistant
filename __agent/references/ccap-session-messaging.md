# 📮 Üzenet másik CC session-nek — AZONOSÍTÓK ÉS SZABÁLYOK

> 🔴🔴 **MIELŐTT BÁRMIT KÜLDENÉL, OLVASD EL A SZABÁLYOKAT — MINDEN ALKALOMMAL.**
>
> **Kanonikus:** `fdp-documentations/guidelines/agent-workflow/dev-session-orchestration.md`
> **§6 (indítás egyetlen prompttal)** és **§7 (a prompt VISSZAVONHATATLAN)**.
>
> **Owner (2026-09-07 21:20):** *„ott, ahol elérhetővé teszed majd az ID-kat, amiket
> beazonosítasz, ott nagyon fontos, hogy felírd, hogy ezeket a szabályokat mindig előtte kell
> elolvasni."*
>
> ⭐ **2026-09-07 22:30 — VÁLTOZÁS:** az owner **két sessiont az én fennhatóságom alá adott**
> *(„ALL Projects - My Assistant DEV" + „My FDP Assistant")*. Ezekre az orkesztráció
> **JÓVÁHAGYOTT**. ⛔ **Minden más sessionre változatlanul TILOS** külön owner-kérés nélkül.

---

## 🔴 A LEGFONTOSABB RENDSZER-TÉNY

> **Owner-direktíva (2026-08-14):** *„a CCAP CC Session-ben futó agenteket **nem lehet
> megállítani**. Tehát **kétszer is ellenőrizned kell, milyen parancsot akarsz kiadni, mielőtt
> kiadnád**."*

A `POST /api/cc-session/<id>/prompt` **visszavonhatatlan**. A futó session **nem állítható
meg**, és egy utólag küldött prompt **nem törli** az előzőt — **sorba áll**, és a futás végén
**külön, teljes értékű (költséges) futásként** indul el.

## A hat HARD szabály (§7 — tömörítve, a teljes szöveg a kanonikus fájlban)

| # | Szabály |
|---|---|
| **7.1** | ⛔ A *„majd javítom egy második prompttal"* **NEM létező mentőöv**. A helyesbítés nem visszavonás, hanem **újabb költséges futás**. |
| **7.2** | 🔴 **Dedup-ellenőrzés KÖTELEZŐ** dispatch előtt: nincs-e már megválaszolva korábbi mérésben/riportban. A „bőven inkább több" **pazarlás**, nem óvatosság. |
| **7.3** | 🔴 Helyesbítő prompt **CSAK** ha a session igazoltan **még dolgozik** ÉS érdemi munkát takarít meg. ⚠️ A `status` a lekérdezés pillanatára vonatkozik — mire a válasz megjön, **elavulhat**. Rövid vagy végéhez közeli futásnál: **NE küldj semmit**. |
| **7.4** | ⚠️ A `queued: true` **FIGYELMEZTETÉS, nem nyugta**: az agent már **nem látja időben**, külön futás lesz belőle. |
| **7.5** | **Egy prompt = egy jól körülhatárolt munkacsomag.** A „biztos, ami biztos" tételek **közvetlen költséget** okoznak. |
| **7.6** | **Kiadás előtt olvasd el újra a saját promptodat** — konkrétan azt keresve: *van-e benne olyan, amire már tudjuk a választ?* |

📌 **A szabály forrása egy valós eset (2026-08-14):** 11 mérésből **5 már meg volt válaszolva**;
a helyesbítő prompt pedig **teljesen fölösleges, költséges futássá** vált, mert a session
addigra végzett. **Kétszeres hiba.**

⚠️ **A wakeup/trigger-üzenet MINIMÁLIS** (`core-wakeup-state-file`): ~1-2 mondat + **KÉT
pointer** (állapot-fájl + feladat-fájl). ⛔ Update, infó, szabály **nem** megy a promptba.

---

## A végpontok (a saját kliensem már tudja: `cli/src/ccap/ccap.api-client.ts`)

```
GET  /api/cc-session                 → sessions[]  (sessionId, label, status, …)
GET  /api/cc-session/:id/inspect     → runtime, queue, flags
POST /api/cc-session/:id/prompt      → { content }   ⚠️ VISSZAVONHATATLAN
```

## Beazonosított session-ök — mérve 2026-09-07 21:25

> ⚠️ **A `status` PILLANATFELVÉTEL.** Küldés előtt **újra le kell kérdezni** — a lenti érték
> percek alatt elavul. A lista sem teljes: **93 session** van, itt csak a relevánsak.

| Cél | `sessionId` | Címke | Státusz akkor |
|---|---|---|---|
| ⭐ **A FEJLESZTŐM** — ide megy MINDEN fejlesztési munka | **`ccs-d5027942-mtroz7ve`** | **My Assistant - DEV** *(az owner nevezte át 2026-09-11 00:51-kor; korábban „ALL Projects - My Assistant DEV")* | `running` |
| ⭐ **AZ FDP-ASSZISZTENSEM** — FDP-ügyek, könyvelő, bérszámfejtés | **`ccs-e4e4fadf-mtroyj33`** | My FDP Assistant | `running` |
| **FDP Assistant** *(az owner ezt nevezte meg)* | `ccs-eb7533f2-msf45rno` | ALL Projects - FDP Assistant NEW | `waiting-input` |
| **Én** *(ide jönnek a Discord-üzenetek)* | `ccs-6f25a888-mtp9a8cx` | My Assistant | `running` |
| FDP Fleet | `ccs-556c9670-mtnp9j8g` | FDP Fleet | `waiting-input` |
| FDP Agent Memory | `ccs-02def1d6-mqhxeisd` | ALL Projects - FDP Agent Memory | `waiting-input` |

⚠️ **Névütközés-csapda:** több „FDP Assistant" nevű session létezik, köztük **fork-ok**, amik
`completed` állapotban vannak *(`ccs-977ac417-…`, `ccs-60012cc2-…`)*. ⛔ A **címke nem
azonosító** — mindig a `sessionId` alapján küldj, és ellenőrizd a státuszt.

---

## 🔴 A KÜLDÉS FELTÉTELE: `waiting-input` **ÉS ÜRES SOR** — a kettő NEM ugyanaz

> **Owner (2026-09-07 23:39):** *„ne küldjél üzenetet, amikor folyamatban van a folyamat a
> rendszerben. Másik session orkesztrációs alaptétel, hogy meg kell nézni, hogy folyamatban
> van-e, mielőtt üzeneteket küldözgetsz rá. Mert ha folyamatban van, sorba kerül. Ha már van
> sorban is üzenet, akkor sokadikként kerül sorba, azok már nagyon szét fognak mászni."*

⭐ **A MÉRÉS, AMI ÉLESÍTETTE (2026-09-07 23:40):** a DEV session `status: waiting-input`,
`isBusyProcessing: false` — **mégis volt egy tétel a sorában** *(a saját ScheduleWakeup-ja)*.
⇒ Ha a régi módszeremmel *(csak `status` + `busy`)* küldtem volna, a promptom **a saját ébresztője
mögé** áll be, és a kettő **szétmászik**.

**A HELYES ELLENŐRZÉS — mindhárom kell:**

```
GET /api/cc-session/<id>/inspect
```

| Feltétel | Elvárt |
|---|---|
| `runtime.status` | `waiting-input` |
| `flags.isBusyProcessing` | `false` |
| ⭐ **`queue.items`** | **ÜRES** |

⛔ **Ha bármelyik nem teljesül: NE KÜLDJ.** Várd meg a következő kört.
📌 A sorbaállított prompt **nem gyorsítás, hanem halasztás + kockázat**: külön, teljes értékű
futásként indul, és a **sorrend csúszhat** ahhoz képest, amit szántál.

---

## 🔍 HOGYAN ELLENŐRIZD, HOGY DOLGOZIK-E *(owner 2026-09-07 22:42: „időnként ellenőrizned is kell őket")*

```
GET /api/cc-session/<id>/inspect
```

| Mező | Mit jelent |
|---|---|
| `flags.isBusyProcessing` | ⭐ **ez a valódi jelzés** — épp dolgozik-e |
| `runtime.isLive` | él-e a folyamat |
| `runtime.eventSequence` | mennyit termelt — **növekszik**, ha halad |
| `queue.stuck` | `None` = nincs beragadás |

🔴 **MÉRT CSAPDA (2026-09-07 23:02):** a **LISTA**-végpont `lastActivityAt` és `costUsdTotal`
mezője **29 percig változatlan** maradt — közben a session **1271 eseményt** termelt és aktívan
dolgozott. ⚠️ Majdnem „beragadt"-nak jelentettem.

📌 **Ezek a listás mezők NEM haladás-jelzők.** *(Ugyanaz a hibaosztály, mint a `status.json`
léte az LDP-nél, vagy a `serverRunning: false` értelmezése: **egy mező NEVE nem a jelentése**.)*

⇒ **Az `inspect` mellett mindig a KIMENETET is nézd:** `git log --since=…` · a hyperplan
**STATUS-blokkja** · az action-log. Egy session lehet `isBusyProcessing: true` úgy is, hogy
semmi hasznosat nem termel.

---

## Ellenőrző lista küldés ELŐTT

- [ ] Elolvastam a `dev-session-orchestration.md` §6-ot és §7-et **ebben a körben**?
- [ ] Van rá **owner-jóváhagyás** erre a konkrét feladatra?
- [ ] **Dedup:** nincs már megválaszolva? *(7.2)*
- [ ] **Egy** jól körülhatárolt munkacsomag? *(7.5)*
- [ ] **Újraolvastam** a saját promptomat? *(7.6)*
- [ ] Frissen lekérdezett `status` **ÉS `queue.items` ÜRES**? *(7.3 + owner 23:39)*
- [ ] A trigger-üzenet **minimális**, két pointerrel?

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
> ⛔ Az alábbi azonosítók **ismerete nem felhatalmazás**. A küldés owner-jóváhagyáshoz kötött
> (`IDENTITY.md`: az orkesztráció **nem jóváhagyott**), kivéve ha az owner az adott feladatra
> **kifejezetten** kéri.

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
| **FDP Assistant** *(az owner ezt nevezte meg)* | `ccs-eb7533f2-msf45rno` | ALL Projects - FDP Assistant NEW | `waiting-input` |
| **Én** *(ide jönnek a Discord-üzenetek)* | `ccs-6f25a888-mtp9a8cx` | My Assistant | `running` |
| FDP Fleet | `ccs-556c9670-mtnp9j8g` | FDP Fleet | `waiting-input` |
| FDP Agent Memory | `ccs-02def1d6-mqhxeisd` | ALL Projects - FDP Agent Memory | `waiting-input` |

⚠️ **Névütközés-csapda:** több „FDP Assistant" nevű session létezik, köztük **fork-ok**, amik
`completed` állapotban vannak *(`ccs-977ac417-…`, `ccs-60012cc2-…`)*. ⛔ A **címke nem
azonosító** — mindig a `sessionId` alapján küldj, és ellenőrizd a státuszt.

---

## Ellenőrző lista küldés ELŐTT

- [ ] Elolvastam a `dev-session-orchestration.md` §6-ot és §7-et **ebben a körben**?
- [ ] Van rá **owner-jóváhagyás** erre a konkrét feladatra?
- [ ] **Dedup:** nincs már megválaszolva? *(7.2)*
- [ ] **Egy** jól körülhatárolt munkacsomag? *(7.5)*
- [ ] **Újraolvastam** a saját promptomat? *(7.6)*
- [ ] Frissen lekérdezett `status`? *(7.3)*
- [ ] A trigger-üzenet **minimális**, két pointerrel?

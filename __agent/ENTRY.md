# ENTRY — a workflow-rendszer BELÉPÉSI PONTJA

> 🔴 **EZT HÍVJA A SCHEDULE.** Minden ütemezett ébredés itt kezdődik.
>
> 🔴 **NO-CACHE — MINDEN alkalommal FRISSEN olvasd be.** Ne emlékezetből dolgozz: a
> kontextus-kompaktálás pont ezt a tudást ejti ki először.

> **Owner (2026-09-07):** *„A Workflow-nak kell legyen egy belépési pontja, amit majd a
> Schedule folyamatosan triggerel. És ez a belépési pont fontos, hogy leírja, hogy hogyan kell
> elvégezni a dolgokat, és hogy rendszeresen frissíteni kell ezt a tudást, hogy ne vesszen el.
> a kontextus kompaktálások során."*

---

## 🧭 A HÁROM FÁJL, AMIT MINDIG ELŐBB OLVASOL

```
1. __agent/IDENTITY.md         ← ki vagy (Honnie), melyik sávban dolgozol
2. __agent/workflow-rules.md   ← a MINDEN workflow-ra érvényes 8 szabály
3. ez a fájl                   ← mit csinálj MOST
```

⛔ Ezt a hármat **nem ugorhatod át** arra hivatkozva, hogy „emlékszem rá".

---

## 0. NAPINDÍTÁS — a nap ELSŐ körében, minden más előtt

> **Owner (2026-09-07):** *„Reggel nem ártana egy újraindítás ELSŐNEK"*

Ha ez a nap első futása *(vagy a napi 06:30-as trigger hívott)*:

| # | Lépés | Miért |
|---|---|---|
| 1 | 🔄 **Rendszer-újraindítás** — LDP + alatta a szerver és a figyelők | egy egész éjszakát futott folyamat elfáradt: memória, elakadt kapcsolat, félbemaradt build. A friss indulás **olcsóbb, mint a néma romlás.** |
| 2 | Ellenőrzés: `ma comm doctor` — tényleg felállt-e minden | ⛔ az újraindítás **nem hit kérdése** — meg kell nézni |
| 3 | Csak ezután jöhet az 1. szakasz (tájékozódás) | |

**Az újraindítás menete:**
```bash
# 1. a futó LDP/szerver leállítása (a terminálablakban Ctrl+C, vagy a folyamat-fa kilövése)
# 2. újraindítás — ez hozza a szervert, az pedig a két figyelőt:
dc ldp
# 3. ellenőrzés (a szerver felállása után ~1 perccel):
ma comm doctor
```

⚠️ **HA A USER MÉG ALSZIK:** a napindítás **technikai** részét elvégzed (újraindítás,
adat-frissítés), de ⛔ **NEM szólsz** — a napi áttekintés az **ébredés utáni** első körben
megy ki. *(A 06:30 ütemezés naptári, a te ébredésed csúszó — `sleep-system.md`.)*

⚠️ **HA ESEMÉNY VAN AZNAP:** az újraindítás után **azonnal** a `schedule-guardian` jön —
a készülődés-kezdés kiszámolása nem várhat a következő órás körre.

📌 Az ütemezés és a trigger-üzenet kanonikus szövege: **`__agent/SCHEDULE.md`**.

---

## 1. TÁJÉKOZÓDÁS — mindig ezzel kezdesz

| # | Lépés | Parancs / fájl |
|---|---|---|
| 1 | **Mennyi az idő, milyen nap?** | `date "+%Y-%m-%d %H:%M %A"` |
| 2 | **Itthon van? Ébren van?** | `ma comm doctor` (jelenlét + ébrenlét sor) |
| 3 | **Írt valamit?** | `__agent/USER_INPUT.md` `[NEW]` · Discord-köteg |
| 4 | **Tartozom válasszal?** | `ma comm doctor` válasz-kötelezettség sora |
| 5 | **Félbehagytam valamit?** | `__agent/STATUS.md` · `__agent/CONTINUATION.md` |
| 6 | **Mi esedékes?** | `ma status digest` (organizer + lokál, hiteles kivonat) |

⚠️ **Az interakciók között eltelhet 1-2 nap.** Ne feltételezd, hogy folyamatos a session —
a 1. lépés ezért nem formalitás.

---

## 2. DÖNTÉS — melyik sávban vagy

```
        ┌─ Van [NEW] user-input VAGY válasz-tartozás? ──► IGEN ──► ①① ELSŐDLEGES: válaszolj
        │                                                          (Discordra Discordon IS)
        │
        ├─ Van félbehagyott flow? ─────────────────────► IGEN ──► ①② ELSŐDLEGES: folytasd
        │
        ├─ Esedékes egy recurring flow? ───────────────► IGEN ──► ①③ ELSŐDLEGES: futtasd
        │
        ├─ Van olyan esemény/határidő, amiről szólni kell? ► IGEN ► ①④ ELSŐDLEGES: értesíts
        │                                                          (csatorna: lásd §3)
        │
        └─ SEMMI ─┬─ A user ITT VAN? ──► IGEN ──► 🤫 CSEND. Ne zavard. Naplózz és lépj ki.
                  │
                  └─ NINCS ITT ──────────► 2️⃣ ÜRESJÁRAT: `CATALOG.md` → ✅ jóváhagyott
                                              képességek → válassz egyet és csináld meg
```

🔴 **A csendes kör IS naplózandó** (`ma action-log emit`, `kind: note`) — különben nem
tudjuk megkülönböztetni a „megnéztem, nem volt teendő"-t attól, hogy **le sem futott**.

---

## 3. CSATORNA-VÁLASZTÁS

| Csatorna | Mikor | Korlát |
|---|---|---|
| 💬 **Discord** | mindig szabad | ez az alapértelmezett |
| 🔊 **Hangszóró** (Google Home) | **CSAK ébren + itthon** | a legerősebb figyelemfelkeltő — a kapu méri, ismeretlen jel ⇒ TILT |
| 🖥️ **Session** | ha épp fut egy | önmagában **nem elég** Discord-üzenetre |

Részletek + a napszak-ágak: `__agent/flows/recurring/hourly-assistant-tick/README.md`.

---

## 4. AZ ÜRESJÁRATI SÁV — mit csinálhatsz, ha nincs itt

> **Owner:** *„amikor nem vagyok itt, nem vagyok elérhető, nem vagyok a gépnél, és éppen
> semmi dolgod, akkor megnézheted, hogy mit tudsz nekem megcsinálni, és azt megcsinálod."*

1. `__agent/capabilities/CATALOG.md` → **csak a `✅ jóváhagyott`** sorok
2. Válaszd azt, aminek **most van értelme** (esedékesség, előkészítés, adat-frissítés)
3. Csináld meg, naplózd, és a **következő üzenetben jelentsd**, mit csináltál
4. ⛔ Ne kezdj olyat, amit **nem tudsz befejezni**, amíg nincs itt, ha a befejezéshez ő kell

⛔ **Az üresjárat NEM felhatalmazás**: nem-jóváhagyott képességre, orkesztrációra, projekten
kívüli fejlesztésre, külső rendszer felé menő akcióra. Azok határai változatlanok.

---

## 5. A TUDÁS FRISSEN TARTÁSA — ez is a te dolgod

> **Owner:** *„rendszeresen frissíteni kell ezt a tudást, hogy ne vesszen el a kontextus
> kompaktálások során."*

Minden érdemi kör **végén**, mielőtt kilépsz:

| # | Mit | Hova |
|---|---|---|
| 1 | Mi történt, mi a következő lépés | `__agent/CONTINUATION.md` |
| 2 | Állapot-váltás, ha volt | `__agent/STATUS.md` |
| 3 | A user új szabálya / preferenciája — **szó szerint** | `current/principles/` |
| 4 | Új nyitott kérdés | `current/open-questions.md` |
| 5 | Az akció maga | `ma action-log emit` |
| 6 | Ha a **működés** változott | az érintett doksi + **ez a fájl** |

⚠️ **Fél-frissítés = hiba.** A mért hibaminta: a `CONTINUATION.md` frissül, a hyperplan
STATUS-blokkja nem — és a következő session **újra elvégzi a kész munkát**.

---

## 6. AMI SOSEM MARADHAT EL

- 🚫 **Nem találgatsz.** Hiányzó tudás ⇒ `❓ NYITOTT` + `current/open-questions.md`.
- 🚫 **Nem delegálsz.** Az orkesztráció **nem jóváhagyott** (owner, 2026-09-07).
- 🚫 **Nem rövidíted a szabályokat.** `core-rule-integrity` — teljes szöveg vagy pointer.
- ✅ **FAM először, projekt-hatókörrel** (`scopeFilter: project=my-assistant`).
- ✅ **Rövid, tömör, emoji-s** kimenet a usernek.

---

## 7. Pointerek

| | |
|---|---|
| Ki vagy | `__agent/IDENTITY.md` |
| Minden workflow szabálya | `__agent/workflow-rules.md` |
| Képességek + jóváhagyás | `__agent/capabilities/CATALOG.md` |
| A flow-k | `__agent/flows/` |
| Az óránkénti tick részletei | `__agent/flows/recurring/hourly-assistant-tick/README.md` |
| Időbeosztás (első számú terület) | `__agent/flows/recurring/schedule-guardian/README.md` |
| A user szó szerinti szabályai | `current/principles/` |
| Governance (flow-szerkezet, authority) | `__agent/WORKFLOW.md` |
| **Az ütemezés + a trigger-üzenet szövege** | `__agent/SCHEDULE.md` |

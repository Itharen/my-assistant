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

### Hogyan ismerd fel, hogy ÉBREDÉS történt

> **Owner (2026-09-07):** *„alapvetően teljesen máskor fogok majd minden nap kelni, úgyhogy a
> napindítás azt majd valami eseményhez kell kötni, de például ez az esemény lehet az, hogy az
> első aktivitás érzékelés miután aludtam."*

⛔ **A napindítás NEM naptári időponthoz kötött.** A trigger az **ébredés-esemény**:

```
server/activity-monitor/data/YYYY-MM-DD.jsonl
   … idleState: "idle" / nincs minta   ← alvás (hosszú szakasz)
   … idleState: "active"               ← ⭐ EZ AZ ELSŐ AKTÍV MINTA = ÉBREDÉS
```

**A felismerés menete minden körben:**

1. Olvasd a jelenlét-mintákat *(a nap-váltás miatt az előző napi fájlt is)*.
2. Keresd meg az **utolsó aktív** mintát és az azt megelőző **tétlen/üres szakasz** hosszát.
3. Ha az a szakasz **≥ 3 óra**, és az ébredés az **előző kör óta** történt → **NAPINDÍTÁS**.
4. Naplózd, melyik időbélyeget vetted ébredésnek — így utólag ellenőrizhető.

⚠️ **A 3 órás küszöb ASSZISZTENS-JAVASLAT, nem owner-adat** — egy 3 órás szünet már nem
kávészünet, de a pontos érték megerősítendő *(`open-questions.md` I-9)*. ⛔ Ne kezeld tényként.

⚠️ **A gép kikapcsolása is „üres szakasz"** — nincs minta. Ezt ugyanúgy alvásnak vesszük;
ha tévedünk, a napindítás fölöslegesen fut le egyszer, ami olcsó hiba. A fordítottja
*(sosem fut le)* a drága.

---

Ha ez a nap első futása *(vagy ébredés-eseményt észleltél)*:

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

### ⛔ MIKOR NE INDÍTS ÚJRA — a szabály kivétele (mérve 2026-09-07 06:26)

Az újraindítás **NEM öncél**: a frissesség a cél. Ha az újraindítás **többet ront, mint
javít**, kihagyod — és **naplózod, hogy miért**.

**Kihagyod, ha MINDHÁROM igaz:**

| # | Feltétel | Hogyan méred |
|---|---|---|
| 1 | **Minden zöld** | `ma comm doctor` — nincs hibás/hiányzó sor |
| 2 | A rendszer **nemrég** indult (< ~8 óra) | `logs/live-dev-pipeline/status.json` + az action-log indítás-bejegyzései |
| 3 | **Esemény van a következő ~3 órában**, VAGY a user épp aktív | `current/events/` · `ma status digest` · a jelenlét-minta |

🔴 **A MÉRT INDOK (ez váltotta ki a kivételt):** a teljes LDP-kör **~23 perc**
*(`client-build` 536 s + `client-test` 377 s)*, és alatta a szerver — tehát a **Discord-csatorna
is — ÁLL**. Egy esemény reggelén ez pontosan abban az ablakban vakítaná meg a csatornát,
amikor a legjobban kell. *(2026-09-07: a user 06:26-kor ébren, 07:45-kor indul; a szerver
01:30-kor indult, minden zöld ⇒ az újraindítás kimaradt, és ez volt a helyes.)*

⇒ Ilyenkor a napindítás **technikai része kimarad**, de a **tartalmi** (áttekintés,
`schedule-guardian`, értesítés) **NEM** — az mindig lefut.

---

⚠️ **HA A USER MÉG ALSZIK:** a napindítás **technikai** részét elvégzed (újraindítás,
adat-frissítés), de ⛔ **NEM szólsz** — a napi áttekintés az **ébredés utáni** első körben
megy ki. *(A 06:30 ütemezés naptári, a te ébredésed csúszó — `sleep-system.md`.)*

⚠️ **HA ESEMÉNY VAN AZNAP:** a `schedule-guardian` **azonnal** jön — a készülődés-kezdés
kiszámolása nem várhat a következő órás körre. ⭐ **A telefontöltés-emlékeztető a készülődés
KEZDETÉN megy ki**, nem induláskor (`current/inventory/personal-items.md`).

📌 Az ütemezés és a trigger-üzenet kanonikus szövege: **`__agent/SCHEDULE.md`**.

---

## 1. TÁJÉKOZÓDÁS — mindig ezzel kezdesz

| # | Lépés | Parancs / fájl |
|---|---|---|
| 1 | **Mennyi az idő, milyen nap?** ⏰ **ÉS MINDEN további időpont-állítás előtt ÚJRA** | `date "+%Y-%m-%d %H:%M %A"` — ⛔ tilos korábbi mérésből extrapolálni (`time-must-be-measured.md`) |
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

🔴 **HA FEJLESZTÉST VÉGEZTÉL, EZ IS KELL** *(owner, 2026-09-07)*:

| # | Ellenőrzés | Mivel |
|---|---|---|
| 1 | zölden lefutott-e a pipeline | `logs/live-dev-pipeline/status.json` |
| 2 | **él-e a szerver** | a port ténylegesen figyel-e |
| 3 | **élnek-e a figyelők** | Discord-életjel + jelenlét-minta **frissessége** |
| 4 | ép-e a csatorna | `ma comm doctor` |

⚠️ **Egy állapot-mező NEVE nem a jelentése.** A `status.json` `serverRunning: false` az LDP
belső „restart pending" jelzése — **nem** azt jelenti, hogy a szerver nem fut. Mérve
2026-09-07: futó pipeline közben a port ÉLT és mindkét figyelő friss volt.
*(`current/principles/post-development-verification.md`.)*

⚠️ **Fél-frissítés = hiba.** A mért hibaminta: a `CONTINUATION.md` frissül, a hyperplan
STATUS-blokkja nem — és a következő session **újra elvégzi a kész munkát**.

🔴 **EZ MÁR NÉGYSZER MEGTÖRTÉNT** *(hyperplan STATUS ×3, `STATUS.md` ×1 — legutóbb 2026-09-07,
amikor a blokk még `345/345 + 28/28`-at állított a valós `366/366 + 42/42` helyett)*.
Ezért a lista **itt** áll, a belépési pontban — nem egy mélyebb fájlban, amit a kompaktálás
kiejt. **Munkacsomag után MIND A NÉGY, kipipálva:**

| # | Fájl | Mit kell benne frissíteni |
|---|---|---|
| 1 | `__agent/CONTINUATION.md` | tételes státusz + a következő konkrét lépés |
| 2 | `__agent/plans/<terv>/hyperplan.plan.md` | ⭐ a **STATUS-blokk**: teszt-számok, dátum, review-kör |
| 3 | `__agent/STATUS.md` | a projekt-szintű pillanatkép |
| 4 | az érintett **dokumentáció** | ⚠️ a **CÍMEK és a hivatkozó helyek** is, nem csak a bekezdés |

⚠️ **Ami elavult, de nem törölhető, azt BANNEREZD** (`core-stale-doc-marking`) — a néma
elavulás rosszabb, mint a látható elavulás.

---

## 6. AMI SOSEM MARADHAT EL

- 🚫 **Nem találgatsz.** Hiányzó tudás ⇒ `❓ NYITOTT` + `current/open-questions.md`.
- 🚫 **Nem delegálsz.** Az orkesztráció **nem jóváhagyott** (owner, 2026-09-07).
- 🚫 **Nem rövidíted a szabályokat.** `core-rule-integrity` — teljes szöveg vagy pointer.
- ✅ **FAM először, projekt-hatókörrel** (`scopeFilter: project=my-assistant`).
- ✅ **Rövid, tömör, emoji-s** kimenet a usernek.
- ⭐ **DISCORD-FIRST:** ami érdemi, az **Discordra** megy, nem csak a sessionbe. Több üzenet
  egy körben szabad. Ellenőrző kérdés: *„ha most elindulna otthonról, elveszne bármi?”*

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

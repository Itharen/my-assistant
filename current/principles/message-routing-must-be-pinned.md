# 📬 A kézbesítési cél RÖGZÍTETT — nem a folyamat környezetéből jön

> **Owner, 2026-09-08 14:00 (szó szerint):**
> *„Mi a fasz? Most látom, hogy nem jó sessionbe mennek ráadásul most az üzeneteim. A devnek
> vannak elküldve az üzeneteim, nem pedig ide neked. TOTAL CHAOS!!"*

---

## 🔴 MI TÖRTÉNT — mérve, nem feltételezve

Az owner Discord-üzenetei **a DEV sessionbe** érkeztek. **A bizonyíték:** a **13:19**-es
üzenetére *(„Az ne zavarja össze a fókuszt…")* **a DEV válaszolt** — `ff9113a` commit,
`current/principles/focus-support.md`. Az asszisztens ezt a kérést **sosem kapta meg**.

### Az ok

```
discord.bridge.ts  →  resolveSelfIdentity()  →  process.env.CLAUDE_CODE_SESSION_ID
                                                        ↑
                    a Discord-FIGYELŐ az LDP ALATT fut ─┘
                    ⇒ annak a sessionnek a környezetét örökli,
                       amelyik az LDP-t ELINDÍTOTTA
```

Ha az LDP-t a **DEV** indította, az owner **minden** üzenete a DEV-hez ment.

⚠️ **A régi kód pont a szomszédos hibára védett:** a `ccap.identity.ts` fejléce az **elavult**
azonosító ellen érvel *(„az azonosító újraindításkor változhat")*. Az **öröklött, MÁSIK
session azonosítója** ellen viszont nem — és az „önazonosítás" **neve** azt sugallta, hogy meg
van oldva.

---

## ⭐ A SZABÁLY

**A kézbesítési cél KIFEJEZETT, verziókezelt rögzítés** —
`__agent/config/owner-message-target.json`. ⛔ **Soha nem** a futó folyamat környezete.

| Követelmény | Miért |
|---|---|
| **Kettős egyezés:** `sessionId` **és** `claudeSessionId` is stimmeljen | egy `ccs-…` azonosító újrafelhasználódhat; a Claude-oldali a sessioné |
| ⛔ **Csendes fallback NINCS** — érvénytelen rögzítésnél **hangos hiba** | a **rossz** sessionbe kézbesítés rosszabb, mint a nem-kézbesítés |
| A rögzítés **indoklást** hordoz (`reason`) | hogy egy későbbi olvasó ne „takarítsa el" értetlenül |

---

## 📌 A TANULSÁG — ez a hibaosztály lényege

🔴 **Egy folyamat, ami MÁS folyamat gyereke, annak a környezetét örökli — nem a sajátját.**
Minden háttér-figyelő, ami az LDP alatt fut, ilyen. ⇒ Ha egy figyelő „tudja, ki ő", **kérdezd
meg, HONNAN tudja**: ha környezeti változóból, akkor **azt tudja, ki indította az LDP-t** —
és az bárki lehet.

⚠️ **Ez a legcsendesebb hibafajta:** minden réteg „sikeres". A küldés sikeres, a nyugta
megjön, a napló zöld. Csak **nem oda ment**. ⇒ A `sent: true` **nem** bizonyítja a *címzettet*
— l. [[message-delivery-reliability]], ami eddig csak a **megérkezést** kérdőjelezte meg,
a **címzettet** nem.

⭐ **Járulékos kár, amit ez okozott:** ugyanarra a kérésre **két szabályfájl** született
*(`focus-support.md` + `one-thing-focus.md`)* — két agent dolgozott ugyanazon, egymásról nem
tudva. **A duplikált munka a rossz routing TÜNETE volt**, nem külön hiba.

**Kapcsolódó:** [[message-delivery-reliability]] · [[ldp-default-runtime]] · [[ssot]] ·
[[post-development-verification]]

---

## 🔴 OWNER-SZABÁLY, 2026-09-08 15:31 — a DEV-be érkező üzenet KRITIKUS HIBA

> *„Ugye a My Assistant sessionbe kell csattanjon minden és semmi sem a devben. A dev csak
> dolgozik és a My Assistant delegálja a devnek a feladatokat. **Ha a devnél landol egy Discord
> üzenet, az kritikus hiba.**"*

⭐ **Ez nem preferencia, hanem szerep-határ:** a DEV **végrehajtó**, a My Assistant a
**kapcsolattartó és delegáló**. Egy DEV-be érkező owner-üzenet nem „kényelmetlen" — a
**szerepek összecsúszását** okozza: a DEV elkezd asszisztensi döntéseket hozni, az asszisztens
pedig nem tud a saját megbízásáról. *(Mérve ugyanezen a napon: a DEV asszisztensi
alapelv-fájlokat írt, miközben én ugyanazt írtam meg külön — duplikált munka.)*

### Mit jelent ez a gyakorlatban

| | |
|---|---|
| ✅ **Owner → My Assistant** | minden Discord-üzenet, hang, fájl |
| ✅ **My Assistant → DEV** | delegált feladat, handoff-fájl |
| ⛔ **Owner → DEV** | **KRITIKUS HIBA** — jelenteni kell, nem elnyelni |

📌 **Ezért nincs csendes fallback a cél-feloldásban:** ha a rögzítés érvénytelen, a kézbesítés
**hangosan bukik**. A „valahova csak elment" itt **rosszabb**, mint a nem-kézbesítés.

## ⚠️ AMI EBBŐL MÉG NINCS IGAZOLVA (2026-09-08 16:05)

A javítás **kódban él** *(`dist` 15:50, figyelő újraindult 15:52 és 16:00)*, és a rögzítés
**feloldható** — ellenőrizve: `ccs-6f25a888-mtp9a8cx` („My Assistant").
🔴 **DE:** a legutóbbi két tényleges kézbesítés *(15:32, 15:36)* **még a DEV-hez ment**, mert
azok a régi figyelőből futottak. ⇒ **Élő owner-üzenettel még NINCS bizonyítva**, hogy a
javítás működik. ⛔ Amíg nincs, „megjavítva"-ként **nem jelentendő** — csak *„kódban él,
igazolásra vár"*.

---

## ✅ ÉLŐBEN IGAZOLVA — 2026-09-08 20:50:50

> **Owner:** *„szóval akkor most ez már a jó session-ben landol?"*

**Igen — és ez az első független bizonyíték.** A napló szerint a `20:50:50`-es köteg a
`3fbced7d-9876-4fd6-8d92-f5b993859748` Claude-sessionbe ment, ami
**az asszisztens** — nem a DEV (`5d347e4f-…`).

| Mérföldkő | Idő |
|---|---|
| A hiba felfedezve *(owner: „TOTAL CHAOS")* | 14:00 |
| Kódban javítva, cél rögzítve | 14:15 |
| A figyelő a javított kódból fut | 15:52 |
| 🔴 **Élő igazolás** — owner-üzenet az asszisztensnél | **20:50** |

⚠️ **6,5 óra telt el a javítás és az igazolás között** — mert **nem érkezett owner-üzenet**.
⭐ **És ezt végig KI IS MONDTAM:** minden köri jelentésben szerepelt, hogy *„kódban él,
élő üzenettel még nincs bizonyítva"*. ⛔ Nem jelentettem késznek, amíg nem volt bizonyíték.

📌 **A tanulság, ami átvihető:** egy javítás, aminek az igazolásához **külső esemény** kell
*(itt: az owner ír egyet)*, nem „majdnem kész" — **nyitott**, és annak is nevezendő. A
„működnie kell" és a „működik" között itt **6,5 óra** volt.

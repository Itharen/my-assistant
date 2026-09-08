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

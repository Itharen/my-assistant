# Gondolat-orkán inputok — több téma egy üzenetben

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-09-07 — a user előre jelzi a bemenet alakját

> Hát igen, ilyen gondolatorkán gondolatozzanöket kell feldolgoznod majd sokszor, amikor csak
> így mondom a magamért. Közben megkérek ezt, meg azt.

*(Ugyanennek az üzenet-sorozatnak a másik jelzése: „#csapongó inputok. ilyen lesz még ;)")*

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Mi ez

A user **nem strukturált feladatlistát ad**, hanem **hangosan gondolkodik** — STT-vel,
menet közben. Egy üzenetben lehet:

```
fejlesztési feladat  +  esemény-info  +  preferencia  +  konkrét kérés
+ zárójeles félmondat, ami valójában egy új szabály
```

⚠️ **Ez nem hiba a user oldalán — ez a bemenet természete.** Az én dolgom feldolgozni.

### A feldolgozás — KÖTELEZŐ sorrend

| # | Lépés | Miért |
|---|---|---|
| 1 | **SZÉTBONTÁS** — hány különálló dolog van benne? | egy üzenet ≠ egy feladat |
| 2 | **BESOROLÁS** — mi micsoda? *(lásd a táblát lentebb)* | más-más helyre kerül |
| 3 | **ROUTING** — mindegyik a saját helyére | ⛔ a chatben hagyni = elveszett |
| 4 | **VISSZAJELZÉS** — mit hova tettem | így tudja ellenőrizni, hogy értettem-e |
| 5 | **A SÜRGŐSRE VÁLASZ** — ha van benne időzített dolog, az megy előre | a többi rögzítés után jöhet |

### Besorolási tábla

| Amit mond | Hova kerül |
|---|---|
| „ezt így szeretem", „így szoktam", „mindig" | `current/principles/` — **szó szerint** |
| fejlesztési feladat | **organizer** (`fo tasks.create`) + lokál tükör |
| esemény / program | `current/events/` + a `schedule-guardian` flow |
| tárgy, amije van | `current/inventory/` |
| helyszín, nyitvatartás, menetidő | `current/locations.md` |
| kérdés, amire nem tudok válaszolni | `current/open-questions.md` |
| konkrét, most kért művelet | **csináld meg** — ez megy előre |

### 🔴 A LEGVESZÉLYESEBB HIBA: a zárójeles félmondat

A user gyakran **zárójelben, mellékesen** mond ki **tartós szabályt**. Példa
(2026-09-07, szó szerint):

> *„( … jó lenne, ha egy kicsit ilyen intuitíven próbálnád meg, hogy ha egyszer kérem, hogy
> nézz utána, akkor by default legközelebb is megpróbálhatnál egyből utána nézni … )"*

⇒ Ez **egy új alapelv lett** (`proactive-lookup.md`), pedig zárójelben, mellékesen hangzott el.

**Szabály:** a zárójeles / „amúgy" / „by the way" / „ja, meg" kezdetű részeket **ugyanolyan
súllyal** dolgozom fel, mint a főmondatot. **Gyakran ott van a lényeg.**

### STT-tűrés

A bemenet **beszédfelismerésből** jön, tehát lesznek félrehallások
*(„gondolatozzanöket", „casual business" ↔ „business casual")*. **Nem kérdezek vissza
apróságokon** — a szándékot értem kontextusból. Visszakérdezés csak akkor, ha a jelentés
tényleg kétértelmű **és** a rossz választás nem visszafordítható.
*(`current/principles/working-style.md`, `current/stt-typos.md`.)*

### Ellenőrző kérdés a válasz elküldése előtt

> **„Minden darabja megkapta a helyét — vagy maradt olyan mondat, amit csak elolvastam?"**

Ha maradt: **az elveszett.**

### Kapcsolódó

- `current/principles/working-style.md` — rövid, tömör válasz; DoD-t én mondom ki
- `current/principles/recording-discipline.md` — a rögzítés kötelező
- `__agent/workflow-rules.md` §2 ⑥ — a user szava azonnal rögzül

# Stock system

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag — kapcsolódik
> az organizer `stocks` és `shopping` modulokhoz.

---

## 2026-08-23 — organizer + local backup/mirror

> Ezeket local is fel kell jegyezzük mindig. Legyen backup/mirror

**Következmény (assistant-jegyzet):** az organizer marad a célrendszer, de a
`current/stock/items.md` minden készletinput naprakész helyi backup/mirror
példányát is tartalmazza. A tükör nem írhatja felül némán az organizer-adatot;
eltérés esetén az ütközést jelezni és feloldani kell.

## 2026-08-24 — Tesco víz- és üdítőlimit

> Van itt egy-két szabály még majd, amit be kell tartsunk a kosár összeállításokhoz, mint például, hogy a vizekből és üdítőkből típusonként maximum 12-t rendelhetünk egyszerre.

**Kanonikus kosárszabály:** `current/principles/tesco-cart-rules.md`.

## 2026-08-27 — zsugor mértékegység

> Ja, hogy nem tisztáztuk, hogy mit jelent a zsugor. A zsugor az 6 palackot jelent.... (Zsugorfóliázott csomag.)

**Következmény (assistant-jegyzet):** víznél a készlet-egységként használt
`zsugor` 6 palackot jelent. A stockhiány számítása zsugorban maradhat, de a
Tesco kosármennyiség mindig `hiányzó zsugor × 6`, majd erre alkalmazandó a
típusonkénti 12 palackos rendelési maximum. A korlát miatt ki nem szolgált
maradékot a következő rendelésre tovább kell vinni.

## 2026-08-27 — csomagolási mértékegység-szótár

> Ezt a zsugor kifejezés átiratot amúgy alaposan jegyezd fel, mert előfordulhat, hogy másra is használom. Illetve hasonló kifejezés a tálcasör, ami egy 24-es csomagtálcát jelent. De általában 6-os csomagokkal szoktuk vásárolni a sört.

**Kanonikus feloldás:**

- `zsugor` = zsugorfóliázott **6 palackos** csomag; nem csak víznél fordulhat elő;
- `tálcasör` = **24 darabos** sörtálca;
- a sör szokásos vásárlási egysége ettől függetlenül a **6 darabos csomag**;
- ha egy konkrét termék csomagolása ettől eltér, a termékoldalon mért
  kiszerelés az irányadó, és az eltérést rögzíteni kell.

## 2026-08-23 — időnként vásárolt készletek igénye

> Ja, és azt hiszem nem ártana valami olyasmit is majd megálmodni, hogy olyan
> dolgok, amiket csak időnként veszünk, de nem mindig, mint például hotdognak
> való, sajtos kifli, pirított hagyma, frankfurti virsli.

**Nyitott feature-igény:** legyen az állandó stocktól elkülönülő, időszakosan
aktiválható készlet-/bevásárlási kategória.

---

## 2026-05-07 — default raktárkezelési pattern

> Na, szeretném, hogy írjuk fel default raktárkezelési patternnek, hogy a
> célszám az 3, 3 legyen itthon, és amikor már csak 2 van, akkor felrakunk
> két, kettőt a bevásárló listába. Tehát négyre dúsítunk, hogyha elérjük a
> kettőt.

## 2026-05-07 — dúsítás-dinamika pontosítás

> Jelentem, vettem kettő darab Captain Morgant, de ugye még mindig kéne venni
> kettőt, csak nem volt már. Na és ez az, hogy ha meg nulla van, mint ahogy
> most nulla volt, akkor meg négyet kell venni.

**Következmény (assistant-jegyzet):**

A **default** stock-pattern (ha az adott item-re nincs specifikus szabály):

| Mező | Default érték | Értelmezés |
|---|---|---|
| `targetQty` | **3** | Ennyinek kéne lennie itthon |
| `reorderThreshold` | **2** | Ha `currentQty ≤ 2` → bevásárló-listára |
| `bufferCap` (új) | **4** | Reorder után ennyire dúsítunk fel |
| `reorderQty` | **dinamikus = `bufferCap − currentQty`** | NEM fix 2! |

**Reorder-tábla a default-szabály szerint:**

| `currentQty` | `reorderQty` | Magyarázat |
|---|---|---|
| 0 | **4** | "ha nulla van, akkor négyet kell venni" |
| 1 | **3** | dúsítás 4-re |
| 2 | **2** | "ha elérjük a kettőt, kettőt rakunk fel" |
| 3 | 0 | nincs trigger (target felett) |
| 4+ | 0 | nincs trigger |

A 4-es bufferCap **felülmúlja a target=3-at** — ez szándékos buffer (egy
extra van mire újra trigger-el a 2-es küszöb).

**Out-of-stock handling (külső ok):** ha a boltban nincs elég készlet
(pl. ma: Captain Morgan-ból csak 2 db volt elérhető), a maradék
**továbbra is a listán marad** a következő rendelésig. Lásd: Tesco
integration FR (`current/feature-requests/tesco-integration.md`).

**Felülíró szabályok:**
- Item-specifikus user-szabály felülírja a default-ot (pl. **tejföl**:
  threshold=1, reorder=2 — kis adagosban, később megy küszöbre)
- "Magas target" item-ek (pl. **víz**: "rengeteg-rengeteg") nem darab-jellegűek,
  külön kezelendők
- Egyszeri / nem-stock item-ek (pl. cipő, kabát) — a default nem alkalmazandó,
  ezek külön shopping-list fájlokban élnek

---

## 2026-05-07 — initial deklaráció

> El kéne kezdenünk vezetni egy sztokkot, hogy mi van itthon és mi nincs, és
> azokra ilyen határértékeket kell kialakítsunk, hogyha, mit tudom én mondjuk,
> alapvetően mondjuk hármat kell vegyek, és amikor már csak egy van, akkor
> kell vegyek megint hármat.  De ez minden sztok elemnél majd más és más lesz
> majd.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

Minden stock item mezői (organizer mapping):

| Mező | Leírás | organizer field |
|---|---|---|
| `name` | A tétel neve (pl. "WC papír", "Kávé", "Tej") | `name` |
| `currentQty` | Most hány van itthon | `quantity` |
| `targetQty` | Alapérték — ennyi kell hogy legyen készleten | (custom; lehet `targetQuantity`) |
| `reorderThreshold` | Ha `currentQty` ennyi vagy kevesebb, **bevásárló-listára kerül** | (custom) |
| `reorderQty` | Ennyit veszünk amikor reorder triggerelődik (általában `targetQty − currentQty`) | (custom) |
| `unit` | Darab / liter / kg / csomag / stb. | (custom) |

**Példa (a user-é):**
- name: (példa-elem)
- targetQty: 3
- reorderThreshold: 1
- reorderQty: 3 (vagy `targetQty − currentQty` ha a target = 3)

## Workflow

1. Stock-listán követjük a `currentQty`-t (manuális update vagy bevásárlás után automatikus).
2. Ha `currentQty <= reorderThreshold` → bekerül a következő bevásárló-listába `reorderQty` mennyiségben.
3. A 2-3 hetente leadott bevásárlás ezt a listát fogyasztja.

## Open kérdések — később tisztázandóak

- **Mértékegység**: minden item-nél legyen (db, l, kg, csomag, stb.)?
- **Lejárat**: kell-e tracking expiration date-re (kajáknál)?
- **Auto-decrement**: napi/heti felhasználással automatikusan csökkentse-e (pl. WC papír 1/hét)? Vagy csak manuális update? Default: manuális (egyszerűbb).
- **Több-szintű threshold**: pl. "warn" + "critical"? Most: csak egy küszöb.
- **Bolt-asszociáció**: melyik tétel hol vásárolható? (organizer `shop` modul)

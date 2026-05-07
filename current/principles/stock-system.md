# Stock system

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag — kapcsolódik
> az organizer `stocks` és `shopping` modulokhoz.

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

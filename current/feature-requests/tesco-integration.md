# FR: Tesco rendelés automatizáció

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag.

---

## 2026-05-07 — initial deklaráció

> És akkor feladatnak lehet azt is felírhatnánk, hogy Tesco rendelést is jó
> lenne valahogy automatizálni, mert az is egy folyamatosan ismétlődő dolog.
> És mert a Tesco kosarában jegyzem sokszor a bevásárló listát, és aztán
> amikor valamit nem hoznak, mert nincsen, akkor az simán elsikkad, és sosem
> jut eszembe sose többet, hogy azt is venni kellett volna.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Pain points (mostani állapot)

1. A Tesco kosár = tényleges bevásárló-lista helye (ad-hoc tárolás, nem
   integrált a my-assistant-tel)
2. Ha valamit nem hoznak (out-of-stock a Tesco-nál), az **elvész** —
   nincs visszacsatolás a következő rendelésbe
3. A 2-3 hetente esedékes rendelés (`recurring-tasks.md`) is manuális — minden
   alkalommal újra kell összeállítani

### Cél

A `current/shopping/list.md` ↔ Tesco-kosár közötti kétirányú szinkron, +
"nem-hozták-vissza-tedd-a-listára" logika.

### Scope kandidátusok

| Komponens | Mit ad |
|---|---|
| **Tesco Online API** | Hivatalos? Ha nincs, browser-automation (Playwright) szükséges |
| **Sync irány** | (a) shopping-list → Tesco kosár (push), (b) Tesco-számla → shopping-list (kihagyott tételek visszacsatolása) |
| **Trigger** | Manuális ("most rendelek") + recurring (2-3 hét) heads-up |
| **Out-of-stock detekció** | A Tesco-számla / e-mail visszaigazolás parsing — ami a kosárban volt, de nincs a számlán = nem hozták |
| **Visszacsatolás** | Az "elsikkadt" tételek vissza a `current/shopping/list.md`-be |

### Kapcsolódó

- `current/principles/recurring-tasks.md` — bevásárlás 2-3 hetente
- `current/principles/stock-system.md` — reorder-küszöbök → ezekből generálódik a lista
- `current/feature-requests/calendar-integration.md` — analóg: external integration
- `current/feature-requests/google-home-integration.md` (még nem létezik, de a Google Home task analóg téma)

### Open kérdések

- Van-e Tesco-nak hivatalos API kulcs / OAuth, vagy kizárólag scraping-via-browser?
- Mi legyen a "out-of-stock" tételek prio-ja a következő rendelésben? (Default:
  ugyanaz mint az eredeti, plus `attempt: N+1` mező)
- Lokál cron, organizer server, vagy headless böngésző valahol fut a sync?

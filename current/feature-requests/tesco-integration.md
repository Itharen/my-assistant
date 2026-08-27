# FR: Tesco rendelés automatizáció

> Kosár-összeállítási üzleti szabályok kanonikus forrása:
> `current/principles/tesco-cart-rules.md`.

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

---

## 2026-08-23 — használt Tesco-felület

> (FYI ezt használom, szóval neked is ezt kéne: [https://bevasarlas.tesco.hu/shop/hu-HU/search?query=alpro&inputType=free+text](https://bevasarlas.tesco.hu/shop/hu-HU/search?query=alpro&inputType=free+text))

### Verifikált felületi baseline (assistant-jegyzet, 2026-08-23 09:40 CEST)

- Target: `https://bevasarlas.tesco.hu/shop/hu-HU/` (`shop/hu-HU`, nem a régi `groceries/hu-HU`).
- Az `alpro` keresés 102 találatot jelzett; az első adag 48-as, majd `Mutass további 6 terméket` link jelent meg
  `page=2&count=48` paraméterekkel.
- A terméklinkek stabilnak tűnő numerikus product ID-t tartalmaznak (`/products/<id>`); ezt implementációkor
  újra kell verifikálni, nem szabad név-alapú azonosságként feltételezni.
- A kosár a felméréskor üres volt; nagy kosár pagination/virtualizáció ezért továbbra is `unverified`.

---

## 2026-08-23 — termékazonosítási bizonytalanság

> Dokumentációhoz és szabályokhoz felírhatnánk, hogy ha bármi nem tiszta vagy nem biztos, vagy mondjuk több különféle is található az adott termékből, akkor nagyon fontos, hogy egyeztessünk a uservel, hogy pontosan melyik termékeket is szeretné, és ezeket feljegyezzük.

### Acceptance criteria (assistant-jegyzet)

- Több érdemi termékjelölt vagy bizonytalan match esetén a Tesco-flow `ambiguous` / `unresolved` állapotban
  megáll; kosármódosítás nem történhet.
- Az agent a megkülönböztető adatokat tartalmazó jelöltlistával kér user-választást.
- A megerősített választás stabil Tesco product ID-val és emberileg olvasható attribútumokkal rögzül.
- A korábbi választás csak változatlan stabil ID + attribútum-egyezésnél használható automatikusan; eltérés,
  megszűnés vagy helyettesítés új egyeztetést kér.
- Kanonikus általános szabály: `current/principles/product-selection-ambiguity.md`.

---

## 2026-08-24 — részletes terméklenyomat + változásfigyelés

> Ezeket mindenképpen rögzítsed is, hogy legközelebb is meglegyen. ( Infókat, részleteket is rögzíthetnél, hogyha véletlenül eltűnik a kód, amit most a Tesco használ, akkor könnyen újra be tudjuk azonosítani az adatai alapján. ( Sőt lehet, hogy majd a későbbiekben akarunk olyat is, hogy figyelni, hogy egy bizonyos terméknek valamilyen adatai megváltoznak, akkor kapjak róla értesítést.))

### Acceptance criteria (assistant-jegyzet)

- A termékrekord a product ID mellett teljes nevet, márkát, változatot,
  kiszerelést és megkülönböztető attribútumokat is tárol.
- ID-változás vagy eltűnés esetén attribútumalapú újraazonosítás indul;
  bizonytalan egyezésnél kötelező user-egyeztetés.
- A későbbi monitor verziózott terméklenyomatokat hasonlít össze legalább az
  alábbi mezőkön: név, kiszerelés, összetevők, tápérték / fontos műszaki
  jellemzők, ár, akció, elérhetőség és product ID.
- Érdemi változásnál értesítés készül előtte/utána értékkel és közvetlen
  terméklinkkel; átmeneti elérhetetlenség nem írja felül a preferenciát.

---

## 2026-08-26 — rendelési segédlet elkészült, első támogatott rendelés leadva

> Jelentem, nagyon régóta húzódik, de megcsináltuk a Tesco rendelés segédletet
> és leadtam a rendelést. Emelhetőleg holnap fog megjönni, majd amikor megjött,
> akkor egy újabb képességet fogunk neked készíteni, amivel vissza tud
> ellenőrizni, hogy mennyi mindent vettünk, hogy azokat hozzáadhassd a
> raktárkészlethez

### Következő állapotátmenet — assistant-jegyzet

- A rendelés leadása ✅ kész 2026-08-26.
- Várható kézbesítés: 2026-08-27; a tényleges érkezés user-jelzéshez kötött.
- Következő workflow: rendelés/számla ↔ kézbesített termékek egyeztetése,
  mennyiségek visszaellenőrzése, majd stock-növelés.
- Hiányzó, helyettesített vagy mennyiségben eltérő tétel nem vehető készletre
  automatikusan ellenőrzés nélkül.
- Követő task: `org:task:6a8e9e88deaa21f637fc8c31`.

---

## 2026-08-27 — véglegesítő email automatikus feldolgozása

> Nem lenne rossz valamilyen automatizmus ezeknek a Tesco visszaigazolásoknak, rendeléseknek az automatikus feldolgozására. De az is lehet, hogy nincsen rá különösebben szükség, bár lehet, hogy valamilyen egyszerűsítő eszközt mégis csinálhatunk. Mit gondolsz erről?

### Javasolt legkisebb hasznos megoldás

A meglévő `ma email` kliensre és a browser-workflow Hyperplan SP-05.3
reconciliation modelljére épüljön egy agentfüggetlen TypeScript CLI-parancs;
ne legyen új háttérszolgáltatás és ne pollolja a postafiókot.

Tervezett belépési pont:

```text
ma tesco reconcile --latest-email --dry-run --pretty
```

Feladata:

1. a menedzselt mailbox legutóbbi, exact sender+subject alapján azonosított
   Tesco végleges összesítőjének egyszeri lekérése;
2. order ID, termékazonosító/név, rendelt és végleges mennyiség,
   helyettesítés, elérhetetlenség és végösszeg strukturált kinyerése;
3. a tervezett kosár és a végleges rendelés determinisztikus diffje;
4. `delivered`, `substituted`, `unavailable`, `quantity-changed` vagy
   `unresolved` outcome minden sorhoz;
5. alapértelmezetten csak JSON/pretty riport; stock- vagy Organizer-write csak
   külön jóváhagyási és readback gate után.

### Határok

- Nincs folyamatos mailbox-polling. Első körben user/agent indítja a parancsot
  a kézbesítés után; később csak valódi push-event indíthatja automatikusan.
- A parser nem tárolhat címet, telefonszámot vagy kártyametaadatot; csak a
  reconciliationhöz szükséges rendelési sorokat és redacted azonosítót.
- Feldolgozott message/order kulcs idempotensen rögzítendő, hogy ismételt futás
  ne duplázza a készletet.
- Ismeretlen email-template vagy nem egyértelmű terméksor fail-close
  `unresolved` állapotot ad, nem találgat.

# Tesco-kosár összeállítási szabályok

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Az új szabályokat
> dátumbélyeggel, változtatás nélkül kell aláfűzni. Ez a Tesco-lista és a
> kosárba helyezés kanonikus szabályfájlja minden agent számára.

## 2026-08-24 — víz és üdítő rendelési maximum

> Van itt egy-két szabály még majd, amit be kell tartsunk a kosár összeállításokhoz, mint például, hogy a vizekből és üdítőkből típusonként maximum 12-t rendelhetünk egyszerre.

**Operatív következmény:**

- Egy kiválasztott víz- vagy üdítőtípusból egy rendelés kosarába legfeljebb **12 db** kerülhet.
- Ha a készletfeltöltési igény 12-nél több, most 12 kerül a listára/kosárba, a fennmaradó igény pedig a következő rendelésre nyitva marad.
- Zsugorban vezetett készletet palackra csak rögzített zsugorméret alapján szabad átváltani; találgatni tilos.
- A limitet kosár-összeállításkor és a végső kosáregyeztetéskor is ellenőrizni kell.

## 2026-08-27 — a zsugor egysége

> Ja, hogy nem tisztáztuk, hogy mit jelent a zsugor. A zsugor az 6 palackot jelent.... (Zsugorfóliázott csomag.)

**Operatív következmény:**

- Tesco-víz esetén **1 zsugor = 6 palack**.
- A készlethiányt először palackra kell váltani, utána kell alkalmazni a
  típusonkénti **12 palack/rendelés** korlátot.
- A kosárba nem férő palackmennyiség nyitott készlethiányként továbbviendő.
- Nyitott mértékegység-konverzió mellett a kosár nem véglegesíthető: a
  bizonytalanságot még a kosárírás előtt, egy közös egyeztetési körben kell
  lezárni.

**2026-08-27-i visszaszámítás:** Primavera 2 zsugor = **12 palack**;
Szentkirályi extra dús 1 zsugor = **6 palack**; Mizse 5 zsugor = **30 palack**,
amelyből rendelésenként **12 palack** tehető kosárba, **18 palack / 3 zsugor**
pedig továbbviendő.

## 2026-08-27 — egyszerre legfeljebb két zsugor víz

> Arról se feledkezzünk meg, hogy egyszerre maximum két zsugor vizet lehet rendelni a Tesco-tól.

**Operatív következmény:** a korábbi típusonkénti 12 palackos limittel együtt
értelmezve egy adott víztípusból rendelésenként legfeljebb **2 zsugor = 12
palack** tehető kosárba. A teljes hiány fennmaradó része a következő rendelésre
nyitva marad.

## 2026-08-27 — az agent kosara szerkeszthető tervezet; a készletet a tényleges kézbesítés frissíti

> Fontos, hogy miután elkészítünk egy bevásárló kosarat, én azt szerint, hogy éppen mennyi pénzem van, és mennyi helyem, és mennyi éppen milyen kedvem van, attól függően mindig módosítom a bevásárló kosarat, mielőtt leadnám a rendelést. Tehát nem arról van szó, hogy a rendelés rosszul volt leadva, vagy nem megfelelően állítottuk össze a kosarat, Nagyon sok mindent, amik nem érkeztek meg ez alapján, és amik így nem kerültek feltöltésre a raktárban. De ezeket most újra hozzá kell majd adnod ilyenkor.

**Operatív következmény:**

- Az agent által összeállított Tesco-kosár **szerkeszthető tervezet**, nem a
  végleges rendelés és nem automatikus felhatalmazás a rendelés leadására.
- A user a kosarat pénz, tárolóhely és pillanatnyi igény alapján szabadon
  módosíthatja. A tervezett és a végleges kosár eltérése önmagában nem hiba.
- A készletet kizárólag a végleges rendelési/kézbesítési bizonyíték alapján
  növeljük; a korábban kosárba tett, de végül nem kézbesített tételt nem
  tekintjük megvásároltnak.
- A user által a rendelés előtt kivett, ezért nem kézbesített hiánytételek
  változatlanul nyitva maradnak, és a következő kosárba újra bekerülnek.
- A rendelési visszaigazolás és a kézbesítés eltérése esetén a tényleges
  kézbesítés az elsődleges készletbizonyíték; bizonytalanság esetén egy közös
  egyeztetési köteg készül.

## 2026-08-27 — a kért kosárösszeállítást végre kell hajtani; technikai hibát nem mutatunk a usernek

> Ha a user kéri a Tesco-kosár összeállítását, és a kosár üres vagy hiányos,
> akkor a biztos tételeket ténylegesen kosárba kell tenni. A dry run és az
> előteszt csak előellenőrzés, nem helyettesíti a kosárírást.

**Operatív következmény:**

- A biztos, azonosított tételek kosárba helyezése szerkeszthető és
  visszafordítható tervezet; önmagában nem rendelés, checkout vagy pénzköltés.
- Ugyanazt a végrehajtási kérést nem kérjük be másodszor. Csak a bizonytalan
  tételek kerülnek egyetlen közös user-döntési kötegbe.
- Böngészőindítás előtt kötelező a modern UBH session-kontraktus és a profil
  preflight sikerének bizonyítása. A legacy `waiting-extension` válasz hard
  stop: ilyen runtime-mal `open_login_session` nem hívható.
- Profil-lock, olvashatatlan preference vagy browser-start hiba kizárólag az
  agent strukturált CLI/MCP hibacsatornájára kerülhet. Chrome `Profile error`
  dialógust a usernek megjeleníteni tilos.
- Sikertelen preflight után nincs látható browser retry és nincs újabb ablak;
  előbb a runtime/adaptor hibát kell javítani vagy támogatott módon frissíteni.

## Kapcsolódó tartós szabályok

- Termékbizonytalanság, közvetlen link és italból Zero:
  `current/principles/product-selection-ambiguity.md`.
- Készletszámítás és el nem érhető mennyiség továbbvitele:
  `current/principles/stock-system.md`.

**Organizer-tükör:** `org:note:6a8c6477db26aca5a07acd68`.

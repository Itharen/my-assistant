# Product selection ambiguity — user-egyeztetés kötelező

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

## 2026-08-23 — termékbizonytalanság és több változat

> Dokumentációhoz és szabályokhoz felírhatnánk, hogy ha bármi nem tiszta vagy nem biztos, vagy mondjuk több különféle is található az adott termékből, akkor nagyon fontos, hogy egyeztessünk a uservel, hogy pontosan melyik termékeket is szeretné, és ezeket feljegyezzük.

## 2026-08-24 — közvetlen terméklink minden jelölthöz

> Mindenek előtt jó lenne amúgy, hogyha ilyenkor adnál nekem linkeket is, hogy meg tudjam nézni, hogy pontosan miről beszélsz.

## 2026-08-24 — italból mindig Zero

> Mindig a zero ( Csak akkor nem, ha külön kérem.)

## 2026-08-24 — a biztos tételekkel azonnal haladjunk

> Nem kéne ennyire óvatoskodjál a kosár összeállításával, már rég szeretném látni, hogy felveszed a dolgokat.
>
> A bizonytalan tételekről egyeztessünk.

---

## Operacionális értelmezés (assistant-jegyzet, NEM a user szavai)

### Kötelező megállási pont

- A megállási pont **csak a bizonytalan tételre** vonatkozik. A már
  egyértelműen beazonosított és ismert mennyiségű tételeket az agent azonnal
  továbbviszi a kosárba; nem várja meg a teljes lista minden döntését.
- Ha a termék nem azonosítható egyértelműen, vagy több érdemi változat található, az agent **nem találgat** és
  **nem módosítja a kosarat**.
- Az agent röviden bemutatja a releváns jelölteket: teljes név, kiszerelés, íz/típus, darabszám, ár és — ha van —
  stabil bolti termékazonosító.
- Minden bemutatott bolti jelölthöz közvetlen, kattintható terméklinket kell adni. A puszta terméknév vagy product ID
  nem elég a user általi vizuális ellenőrzéshez.
- A user választása előtt nincs automatikus „legvalószínűbb” helyettesítés.

### Italváltozat alapértelmezése

- Ha ugyanabból az italból van Zero és cukros változat, a **Zero** a tartós alapértelmezés.
- Cukros / nem-Zero változat csak akkor választható, ha a user azt külön kéri.

### A választás feljegyzése

- A megerősített választást a termék kanonikus rekordjához kell rögzíteni: bolt, stabil product ID, teljes név,
  megkülönböztető tulajdonságok és a megerősítés dátuma.
- A rendelési mennyiség nem válik automatikusan állandó preferenciává; azt külön kell rögzíteni, ha a user ezt kéri.
- Következő alkalommal csak a rögzített stabil ID és a megkülönböztető tulajdonságok egyezése esetén választható
  automatikusan ugyanaz a termék.
- Ha a rögzített termék eltűnt, megváltozott vagy helyettesítés szükséges, újra egyeztetni kell.

### Scope

Ez minden vásárlási csatornára és agentre érvényes, nem csak a Tesco-workflow-ra.

# Étkezési módok a bevásárlólista összeállításához

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

## 2026-08-24 — három, egymást kizáró választás

> A bevásárló listát összeállításakor általában a következő 3 opció közül egyet kell válasszunk. Vagy a szendvicsnek valót veszünk, vagy hodognak valót veszünk, vagy a wrapnak valót veszünk. Ezeket valahogy össze kéne gruppolni, és... és nem tudom, hogy hogyan fogunk tudni majd erre logikákat építeni, hiszen a raktárkészlet nem nagyon támogat ebbféle megoldást. ( Majd valamilyen feedback vagy backlog formájában fel kell írjuk az organizerhez, hogy ehhez ki kell találjunk egy támogatási megoldást.)
>
> Addig viszont felírhatjuk esetleg, ugye eddig a szendvicsnek valónak írtuk fel a dolgokat, az a felvágott kenyér vajkrém sajt. Hasonló módon felírhatjuk a sajtos stangli, frankfurti virsli, pirított hagyma, szósz és ugyanaz a szeletelt sajt.
>
> valamint a wraphoz, a fagyasztott, rántott csirkecsék, saláta, szeletelt sajt, ugyanaz a szeletelt sajt és valamilyen szósz.

## Átmeneti működési szabály (assistant-jegyzet)

- A bevásárlólista összeállításakor alapértelmezetten **pontosan egy** módot
  választunk: `szendvics` vagy `hotdog` vagy `wrap`.
- A mód aktiválja a hozzá tartozó összetevőket; ezek nem állandóan tartandó
  készletek.
- A közös összetevők — például a szeletelt sajt és a szósz — egyetlen kanonikus
  készlettételre hivatkoznak. Ugyanazt a készletet nem duplikáljuk módonként.
- Ha a kiválasztott mód egyik összetevője már elegendő mennyiségben van otthon,
  abból nem generálunk vásárlást.

| Mód | Aktivált összetevők |
|---|---|
| Szendvics | felvágott; kenyér; vajkrém; szeletelt sajt |
| Hotdog | sajtos stangli; frankfurti virsli; pirított hagyma; szósz; szeletelt sajt |
| Wrap | fagyasztott rántott csirkecsíkok/csirkedarabok; saláta; szeletelt sajt; szósz |

Az Organizer natív támogatási igénye:
`current/feature-requests/organizer-meal-shopping-choice-groups.md`.

## 2026-08-24 — aktuális választás: wrap

> Azt hiszem, hogy most nem szendvicscsomag, hanem wrapcsomag kéne.

**Aktív mód:** `wrap`. A konkrét csirke, tortilla, saláta és szósz
termékválasztása egyetlen közös user-egyeztetésben történik; csak a
megerősített változat kerülhet kosárba.

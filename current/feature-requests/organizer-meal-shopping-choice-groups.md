# FR: Választható étkezési csomagok stock- és bevásárlólista-támogatása

> **Forrás: a user szövege.** A szó szerinti deklaráció:
> `current/principles/meal-shopping-modes.md`.

## Probléma

A bevásárlólista összeállításakor általában három étkezési mód közül pontosan
egyet kell választani: szendvics, hotdog vagy wrap. A jelenlegi stock-modell
egyedi tételeket és mennyiségeket kezel, de nem tud:

- egymást kizáró csomagok közül választani;
- egy csomag aktiválásakor több összetevőt a listára generálni;
- közös összetevőket több csomagban ugyanarra a stock-itemre hivatkoztatni;
- az időszakos csomagot elkülöníteni az állandóan tartandó készletektől.

## Javasolt domain-modell

- `shoppingChoiceGroup`: például „Aktuális étkezési mód”.
- `selectionMode`: `exactly-one`.
- `shoppingBundle`: szendvics / hotdog / wrap.
- `bundleItem`: meglévő stock-itemre vagy buyable-itemre mutató hivatkozás,
  opcionális csomagspecifikus mennyiséggel.
- Egy stock-item több bundle-ben használható, de készlete csak egyszer létezik.
- A kiválasztott bundle a hiányzó összetevőkből generál shopping-itemeket.

## Acceptance criteria

- Egy választási csoportban beállítható, hogy pontosan egy bundle legyen aktív.
- A bundle több meglévő stock-/buyable-itemet hivatkozhat.
- A szeletelt sajt és a szósz közös hivatkozása nem hoz létre duplikált stockot.
- Aktiváláskor csak a készlethiányos összetevők kerülnek a bevásárlólistára.
- Az időszakos bundle-itemek nem triggerelnek önálló, állandó reorder-logikát.
- A választás és a generált shopping-itemek visszakövethetők és módosíthatók.
- MCP/CLI oldalon list/create/update műveletek és user-journey E2E készül.

## Átmeneti fallback

A három csomag és összetevői a `current/stock/items.md` fájlban élnek; a
bevásárlólista-generálás előtt manuálisan választunk egy módot.

## Organizer

- Type: `feature`
- Priority: `high`
- Ref: `org:featureRequest:6a8c4a64db26aca5a07ac8bf`

## Status

✅ Organizer-be beküldve 2026-08-24-én; státusz: `new`.

# FR: Egyparancsos Organizer stock-mirror

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

## 2026-08-23 — deklaráció

> Azt hiszem nem ártana egy eszköz nekünk, amivel egy darab parancsal le tudod mirror-olni az egész organizer raktárlista tartalmat, hogy könnyebben dolgozzál vele ilyenkor.

## Acceptance criteria (assistant-jegyzet)

- Egy parancs kiolvassa az összes Organizer stockot és minden stock-itemet, minden lapot követve.
- A gépi mirror megőrzi az Organizer által visszaadott teljes stock- és item-objektumokat.
- A snapshot atomikusan cserélődik, ezért hiba esetén a korábbi teljes mirror marad olvasható.
- A kézzel gondozott `current/stock/items.md` nem íródik felül; a generált snapshot külön fájl.
- Strukturált JSON envelope és action-log készül sikerről, dry-runról és hibáról.
- Hibás JSON, Organizer-hiba, hiányzó stock-ref vagy pagination-loop fail-closed.
- Kanonikus workspace-parancs: `pnpm stocks:mirror`; telepített/linkelt CLI esetén: `ma stocks mirror --pretty`.

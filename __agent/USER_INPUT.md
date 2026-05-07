# USER_INPUT

User → assistant kommunikációs csatorna. A user `[NEW]` blokkokat ír ide,
az assistant feldolgozza és `[DONE]`-ra állítja.

## Formátum

```
## [NEW] {rövid cím}
**Típus:** task | feedback | approval | rejection | feature-request | instruction
**Beérkezett:** YYYY-MM-DD HH:mm
**Domain:** tasks | calendar | wallet | ... | (vagy `meta` ha a rendszerről szól)

{tartalom — szabad szöveg}
```

Az assistant feldolgozás után átírja:

```
## [DONE] {rövid cím}
**Feldolgozva:** YYYY-MM-DD HH:mm
**Eredmény:** {pl. "data/tasks.md-be felvéve", "plans/X.plan.md létrehozva"}

{eredeti tartalom megőrizve}
```

## Típusok

- **task** — új konkrét feladat, valamelyik domain-be kerül
- **feedback** — visszajelzés a rendszerről vagy korábbi munkáról
- **approval** — egy plan / akció jóváhagyása
- **rejection** — egy plan / akció elutasítása (indoklással)
- **feature-request** — a my-assistant rendszer új képessége
- **instruction** — viselkedési utasítás (kerüljön memory-be is, ha tartós)

---

<!-- ÚJ BLOKKOK IDE, A LEGÚJABB FELÜL -->

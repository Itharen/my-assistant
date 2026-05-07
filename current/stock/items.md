# Stock items — itthoni készlet

Strukturált stock-tábla. Szabályok: `current/principles/stock-system.md`.

> **Mezők:** `targetQty` = ideálisan ennyi van itthon. `reorderThreshold` = ha
> ennyi vagy kevesebb, **bevásárló-listára kerül**. `reorderQty` = ekkor ennyit
> veszünk. `currentQty` = most hány van (TBD = még nem mértük fel).

---

## 2026-05-07 — initial input (user chat)

> Forrás (szó szerinti idézet a user-től):
> *"Kéne venni energiaitalt, meg vodkát, meg rumot, meg kapitányt. Kapitány
> alias Captain Morgan rum. Kapitány rum. Kéne valami kész kaja, meg serikók.
> meg gyömbér, meg rengeteg-rengeteg víz. Nem tudom, a kézkaját mondtam-e már.
> Sprite. A Sprite-ot mindig megisszák a srácok. Tejet is kell most már lassan
> venni. Valami rákcsát, meg nasit. meg kéne venni majd fokhagymát is, meg
> tökmagolajat, meg tejfölt. Ú, az lenne jó amúgy kis adagokban sok tejfölt
> venni. Na jó, nem sokat, de mondjuk hármat. Mondjuk kettőt rotálni, tehát
> amikor majd csak egy venni még egyet, vagy kettőt. Nem is tudom. Energiaitalt
> is kéne venni. Kenyeret kenyérhez ezt, meg azt. Mozzarella mindig jól jön."*

---

## Italok 🥤

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Energiaital | TBD | TBD | TBD | TBD | db | a user kétszer is említette → most kell |
| Vodka | TBD | TBD | TBD | TBD | üveg | |
| Rum (alap) | TBD | TBD | TBD | TBD | üveg | különálló a Kapitány-tól |
| Kapitány (Captain Morgan rum) | TBD | TBD | TBD | TBD | üveg | a user explicit kibontotta: "Kapitány alias Captain Morgan rum" |
| Víz | TBD | **magas** ("rengeteg-rengeteg") | TBD | TBD | l / 1.5l palack | folyamatos high stock |
| Sprite | TBD | TBD | TBD | TBD | db | "a srácok mindig megisszák" — társaságra kell |
| Tej | TBD | TBD | TBD | TBD | l | "most már lassan" → küszöb-közeli |

## Étel — kész 🍱

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Kész kaja | TBD | TBD | TBD | TBD | db | a user kétszer említette (kész kaja + kézkaja STT-variant) |

## Étel — alapanyag 🥕

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Gyömbér | TBD | TBD | TBD | TBD | db / g | |
| Fokhagyma | TBD | TBD | TBD | TBD | fej | |
| Tökmagolaj | TBD | TBD | TBD | TBD | üveg | |
| **Tejföl** | TBD | **3** | **1** | **2** | poharas (kicsi) | ⭐ rotálási szabály a user-től: kis adagokban, target=3, küszöb=1, ekkor venni 2-t. ("Na jó, nem sokat, de mondjuk hármat. Mondjuk kettőt rotálni, tehát amikor majd csak egy venni még egyet, vagy kettőt.") |
| Kenyér | TBD | TBD | TBD | TBD | db | "Kenyeret kenyérhez ezt, meg azt" — a kenyér biztos, a végét nem értettem (STT) |
| Mozzarella | TBD | TBD | TBD | TBD | db / csomag | "mindig jól jön" |

## Drogéria / higiénia 🧴

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Aftershave | TBD | TBD | TBD | TBD | flakon | hozzáadva 2026-05-07 — *"aftershave-et is venni kell"* |

## Ruházat 👕 (stock-jellegű alapdarabok)

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Zokni | TBD ("kevés") | TBD | TBD | TBD | pár | a user mondta: "szorosak is. kevés" → méret-probléma + alacsony készlet |
| Alsógatya | TBD ("lecsúsznak" → rossz méret) | TBD | TBD | TBD | db | méret-probléma |

> **Megjegyzés:** ezek stock-jellegű tételek (alapdarab, állandóan kéne legyen
> X db). A nem-stock ruházat (cipő, kabát, póló, pulóver) a
> `current/shopping/clothing.md`-ben van mint egyszeri vásárlás.

## Snack / nasi 🥨

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| ❓ Serikók | TBD | TBD | TBD | TBD | ? | **STT-bizonytalan**: nem tudom mire gondolt — felvéve, később pontosítani |
| ❓ Rákcsa | TBD | TBD | TBD | TBD | ? | **STT-bizonytalan**: valószínűleg "rágcsa" / rágcsálnivaló — kérdezzük |
| Nasi (általános) | TBD | TBD | TBD | TBD | ? | általános fogalom, alkategória-jelölt |

---

## Open kérdések (legközelebb tisztázni)

- **CurrentQty fölmérés**: ezek mind TBD — egy kör otthoni szemle kell
- **TargetQty defaultok**: egy átlag konzervatív érték minden tételhez (pl. cigaretta-szerű "3 db default", víznél kivétel)
- **STT-bizonytalan tételek**: serikók, rákcsa, "kenyeret kenyérhez ezt meg azt" második fele
- **Rum vs. Kapitány**: tényleg külön két tétel, vagy egy és csak hangsúlyozta? — felvettem külön, később összevonható

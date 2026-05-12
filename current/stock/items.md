# Stock items — itthoni készlet

Strukturált stock-tábla. Szabályok: `current/principles/stock-system.md`.

> **Mezők:** `targetQty` = ideálisan ennyi van itthon. `reorderThreshold` = ha
> ennyi vagy kevesebb, **bevásárló-listára kerül**. `reorderQty` = ekkor ennyit
> veszünk. `currentQty` = most hány van (TBD = még nem mértük fel).
>
> **Default pattern (2026-05-07):** target=3, threshold=2, reorder=2 ("4-re
> dúsítunk"). Lásd `current/principles/stock-system.md`. A táblákban "default"
> jelölés = ezekkel az értékekkel. A `currentQty` továbbra is TBD, mert nem
> mértük fel.

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
| Energiaital | **0** (2026-05-09 elfogyott) | 3 (default) | 2 (default) | 2 (default) | db | 2026-05-09: elfogyott → bevásárló-listára |
| Vodka | TBD | 3 (default) | 2 (default) | 2 (default) | üveg | |
| Rum (alap) | TBD | 3 (default) | 2 (default) | 2 (default) | üveg | különálló a Kapitány-tól |
| Kapitány (Captain Morgan rum) | **2** (vett ma 2-t; bolt out-of-stock 2-re) | 3 (default) | 2 (default) | dinamikus → most **2** kell még | üveg | 2026-05-07: vásárlás megvolt 2 db, de a 4-re dúsításhoz még 2 hiányzik (a bolt out-of-stock volt). Marad a listán. |
| Víz | TBD | **magas** ("rengeteg-rengeteg") | TBD | TBD | l / 1.5l palack | folyamatos high stock — default NEM alkalmazható |
| Sprite | TBD | 3 (default) | 2 (default) | 2 (default) | db | "a srácok mindig megisszák" — társaságra kell |
| Tej | TBD | 3 (default) | 2 (default) | 2 (default) | l | "most már lassan" → küszöb-közeli |

## Élvezeti / dohány 🚬

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Cigi | **0** (2026-05-09 elfogyott) | TBD | TBD | TBD | csomag/karton | 2026-05-09: elfogyott. **preferredStore: Dohánybolt** (2026-05-12 megerősítve — NEM Tesco). 2026-05-12: a minap volt a dohányban, de a **kedvenc el volt fagyva** → új attempt szükséges. |

## Étel — kész 🍱

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Kész kaja | TBD | 3 (default) | 2 (default) | 2 (default) | db | a user kétszer említette (kész kaja + kézkaja STT-variant) |

## Étel — alapanyag 🥕

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Gyömbér | TBD | 3 (default) | 2 (default) | 2 (default) | db / g | |
| Fokhagyma | TBD | 3 (default) | 2 (default) | 2 (default) | fej | |
| Tökmagolaj | TBD | 3 (default) | 2 (default) | 2 (default) | üveg | |
| **Tejföl** | TBD | **3** | **1** | **2** | poharas (kicsi) | ⭐ user-spec rotálási szabály (NEM default): target=3, küszöb=**1** (default 2 helyett), reorder=2. ("Na jó, nem sokat, de mondjuk hármat. Mondjuk kettőt rotálni, tehát amikor majd csak egy venni még egyet, vagy kettőt.") |
| Kenyér | TBD | 3 (default) | 2 (default) | 2 (default) | db | "Kenyeret kenyérhez ezt, meg azt" — a kenyér biztos, a végét nem értettem (STT) |
| Mozzarella | TBD | 3 (default) | 2 (default) | 2 (default) | db / csomag | "mindig jól jön" |

## Drogéria / higiénia 🧴

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Aftershave | TBD | 3 (default) | 2 (default) | 2 (default) | flakon | hozzáadva 2026-05-07 — *"aftershave-et is venni kell"* |

## Gyógyszer / patika 🏥

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Kataflam | **TBD** (vett ma) | 3 (default) | 2 (default) | dinamikus | doboz | 2026-05-07: vásárolva, mennyiség TBD |
| Széntabletta | **3** (vett ma 3-at, volt 0) | 3 (default) | 2 (default) | dinamikus | doboz | 2026-05-07: bolt-elérhetőség miatt csak 3 lett (default 4 helyett); user "mindegy"-jel lezárta — a hiány NEM kerül vissza listára (vs. Captain Morgan eset, ahol a user akart 4-et) |

## Ruházat 👕 (stock-jellegű alapdarabok)

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Zokni | TBD ("kevés") | TBD ⚠️ | TBD ⚠️ | TBD ⚠️ | pár | a user mondta: "szorosak is. kevés" → méret-probléma + alacsony készlet. Default 3/2/2 nem reális ruhán; valószínűbb 8-10 pár target. Tisztázandó. |
| Alsógatya | TBD ("lecsúsznak" → rossz méret) | TBD ⚠️ | TBD ⚠️ | TBD ⚠️ | db | méret-probléma. Hasonlóan: 7-10 db reálisabb mint 3. Tisztázandó. |

> **Megjegyzés:** ezek stock-jellegű tételek (alapdarab, állandóan kéne legyen
> X db). A nem-stock ruházat (cipő, kabát, póló, pulóver) a
> `current/shopping/clothing.md`-ben van mint egyszeri vásárlás.

## Snack / nasi 🥨

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| ❓ Serikók | TBD | 3 (default) | 2 (default) | 2 (default) | ? | **STT-bizonytalan**: nem tudom mire gondolt — felvéve, később pontosítani |
| **Rákcsa** | **0** (utolsó kinyitva 2026-05-09) | 3 (default) | 2 (default) | 2 (default) | ? | Péntekenként fogy (a srácoknak). Ma elfogyott → bevásárló-listára. **preferredStore: Kínai bolt.** Korábbi STT-bizonytalanság feloldva: ez a "rákcsa" — a user így használja. |
| Nasi (általános) | TBD | 3 (default) | 2 (default) | 2 (default) | ? | általános fogalom, alkategória-jelölt |

---

## Open kérdések (legközelebb tisztázni)

- **CurrentQty fölmérés**: ezek mind TBD — egy kör otthoni szemle kell
- **TargetQty defaultok**: egy átlag konzervatív érték minden tételhez (pl. cigaretta-szerű "3 db default", víznél kivétel)
- **STT-bizonytalan tételek**: serikók, rákcsa, "kenyeret kenyérhez ezt meg azt" második fele
- **Rum vs. Kapitány**: tényleg külön két tétel, vagy egy és csak hangsúlyozta? — felvettem külön, később összevonható

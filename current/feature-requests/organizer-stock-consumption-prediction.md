# FR: Organizer készletfogyási predikció és opcionális automatikus csökkentés

> Organizer feedback ref: `feature-request:6a8e9e77deaa21f637fc8c2b`
> — beküldve 2026-08-26, `medium` prioritással.

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

## 2026-08-26 — user input

> De majd fel kéne írni azt is, hogy nem ártana, majd valamilyen megoldást
> csináljunk. Főként egy feedback, feature requestet kéne majd készítsünk az
> organizerbe, aminek a segítségével be tudjuk állítani, hogy kb. mennyi idő
> alatt fogy el valami. De ez nem fix lesz, csak egy predikciós érték ( illetve
> később lehet, hogy lehetne kibekapcsolni, hogy automatikusan csökkentse a
> raktárkészlet a infókat, vagy csak ajánlja be.)

## Strukturált acceptance criteria — assistant-jegyzet

- Egy stock-itemhez beállítható legyen a várható fogyási idő / fogyási ráta.
- Az érték **becslés**, nem garantált vagy fix lejárati idő.
- A rendszer a vásárlások, készletkorrekciók és tényleges elfogyások alapján
  később pontosíthassa a predikciót.
- Tételenként választható működési mód:
  - `off`: nincs automatikus fogyásbecslés;
  - `suggest`: csak javasolt készletcsökkentést mutat, user-jóváhagyással;
  - `automatic`: automatikusan csökkenti a becsült készletet.
- A javaslatnak / automatikus módosításnak látható indoklást és visszavonható
  változásnaplót kell adnia.
- Bizonytalan predikció nem csökkentheti némán a kanonikus készletet.

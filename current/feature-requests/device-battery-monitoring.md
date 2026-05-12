# FR: Eszköz-töltöttségi monitoring

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

## 2026-05-07 — initial deklaráció

> Kéne csinálni a kis eszközeimhez is monitoring, tracking eszközöket.
> Például jó lenne, ha tudnánk trekkelni azt is, hogy melyik eszközömnek
> milyen a töltöttségi szintje, és amikor 40% alá esik, Akkor majd kérnék
> figyelmeztetést rá. Telefon, tablet okosóra.
> (Ezt első körben lehet, hogy elég lesz csak most felírni.)

## Cél

- Eszközök: **telefon, tablet, okosóra** (later: laptop/PC)
- Threshold: **40%** alatt → figyelmeztetés
- Kell: értesítés-csatorna (Google Home? chat? push?)

## Megoldás-jelöltek (rövid)

- Android: `adb shell dumpsys battery` távolról nehéz
- Tasker / MacroDroid (Android) → webhook a my-assistant felé
- Apple: kevésbé hozzáférhető (only ha Apple eszköz van)
- **Wear OS / okosóra**: API-függő (Q-wear-1 még nyitva)

## Status

🅿️ Parkolva — most csak felírás. Implementáció a `triggering-system-architecture.md`
és `wearable` után.

## Open kérdések

Lásd `current/open-questions.md` új kategória "P) Eszköz-monitoring".

# FR: Időzített hangerő-ellenőrzés okos eszközökre

> **Forrás: a user szövege.**

## 2026-05-07 — initial

> Szóval kéne egy valamilyen időhöz kötött hangerőszint ellenőrzés majd
> az okos eszközökre.

## Cél (értelmezés)

Időzített hangerő-szabályozás az okos eszközökön (Google Home / Cast cluster +
mobil eszközök). Pl.:

- 23:00 után automatikusan `volume <= 0.3`
- Hajnali 02-04 között muted ha senki nem aktív
- Reggel auto-emelés visszaállás-ra

## Kapcsolódik

- `cli/src/cast/volume.ts` — a per-device volume orchestration már megvan
- `sleep-system.md` — az alvási sávban semmiképp ne dübörögjön
- `sleep-aware-notifications.md` (új FR) — együtt kezelendő

## Status

🅿️ Parkolva — felírás. Implementáció a `ma cast` Phase 2+ után.

## Open kérdések

Lásd "P) Eszköz-monitoring" + "Q) Sleep-aware".

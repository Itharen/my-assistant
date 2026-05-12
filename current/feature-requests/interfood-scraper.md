# FR: Interfood Playwright / scraper integráció

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

## 2026-05-07 — initial

> Illetve jó lenne, ha tudnál majd valamilyen akár Playwright eszközzel,
> akár scraper eszközzel segíteni nekem a kajarendelésben, meg annak a
> nyilván tartásában, hogy mikorra van rendelve, mikorra nincs.
>
> Legrosszabb esetben lehet, hogy azt is megcsinálhatnánk, hogy a
> Playwright eszközzel szépen megnyitod az Interfood oldalát. Egyrészt ott
> be kell lépjek neked, és akkor miután egyszer be vagyok ott lépve, akkor
> ugye meg tudod nézni a rendeléseimet, illetve hogy konkrétan milyen
> kajákat rendeltem, amiket amúgy többnyire meg is eszek, szóval legalább
> az alapján lehet tudni, hogy kb. miket ettem a héten. hogy miket kéne
> egyek, meg hogyan smint.

## Cél

1. **Rendelés-tracking**: melyik napokra van fedett étkezés, melyikre nincs
2. **Mit-evett-eredő**: a ténylegesen megrendelt + általában elfogyasztott
   kaják listája → input a `food-tracking.md` FR-hez
3. **(Opcionális, későbbi)**: automatikus kaja-rendelés az Interfood UI-n át

## Megoldás-jelöltek

- **Playwright**: már elérhető MCP-toolként
- Logged-in session megőrzése (storageState save)
- Headless / headful first-time login a user által, utána automatizálható
- Periodikus check (cron / schedule) → JSON output a my-assistant rendszerbe

## Adat-séma (vázlat)

```
interfood-day {
  date: YYYY-MM-DD
  status: 'covered' | 'not-covered' | 'partial'
  meals: [{ slot: 'lunch'|'dinner', item: '...', amount: '...' }]
  fetchedAt: ISO
}
```

## Kapcsolódik

- `food-tracking.md` — input forrás (Phase 2-höz közeli)
- `recurring-tasks.md` — Interfood eskalációs görbe automatikusan friss adattal

## Status

🅿️ Parkolva. Implementációs sorrend: az aktuális Interfood-rendelés letudása
(manuális) ELŐTT van; az automatizáció utána.

## Open kérdések

Új kategória — lásd `open-questions.md` "R) Interfood".

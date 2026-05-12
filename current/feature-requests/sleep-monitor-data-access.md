# FR: Alvás-monitor adat-hozzáférés (research)

> **Forrás: a user szövege.**

## 2026-05-07 — initial

> Lehet amúgy a alvás monitor eszközről alvás-infókat lekérni?

## Cél

Megtudni: van-e a usernek alvás-monitor eszköze (Nest Hub "Sleep Sensing"?
Wear OS okosóra? Garmin? Withings? telefon-app?), és ha igen, **API-szerűen**
elérhető-e onnan az alvás-state.

## Releváns infók a meglévő rendszerben

- `cast-notifier` discovery 2026-05-07 inventory: **"Sleep Monitor"** Nest Hub
  van a 200.33.0.0/24 hálózaton (lásd `__agent/log/actions/2026-05-07.jsonl`
  19:15 entry)
- A Google "Sleep Sensing" (Nest Hub 2nd gen) a Google Fit-be ír
- Google Fit REST API → Sleep Segments olvasható (OAuth2)

## Megoldás-jelöltek (research-szint)

| # | Megoldás | Költség | Komplexitás |
|---|---|---|---|
| 1 | Google Fit REST API + Nest Hub Sleep Sensing | 0 Ft | OAuth2 setup |
| 2 | Google Health Connect (Android) | 0 Ft | Android-specifikus |
| 3 | Wear OS / okosóra-API ha van eszköz | 0 Ft | eszköz-függő |
| 4 | Sleep-as-Android export → webhook | 0 Ft | app + setup |

## Status

🔬 Research-stage. Felfeladata: **megtudni** mit használ a user, aztán API-vázlat.

## Open kérdések

Lásd "Q) Sleep-aware" + "J) Wearable" kategóriák.

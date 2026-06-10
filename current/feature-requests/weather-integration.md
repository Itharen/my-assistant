# FR: Időjárás portál integráció

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag — később
> `fo feature-requests.create`-tel feltölthető.

---

## 2026-05-12 (22:23) — initial deklaráció

> Jó lenne, ha majd valamilyen időjárás portált is integrálnánk, az időkép
> amúgy egy kedvelt dolog részemről, de lehet, hogy annál vannak jobban
> működő dolgok is, amik jobban integrálhatóak.

### Scope

- **Főként szerver-feature** (data ingest, normalizálás, cache, alerting)
- **Kliensen látszódjon** — dashboard widget, current + forecast + alerts
- Idokep.hu a user által kedvelt forrás → vagy scrape, vagy alternatív API ami
  hasonló minőségű adatot ad jobb integrálhatósággal

---

## Megoldás-jelöltek

| # | Forrás | Auth | Pro | Kontra |
|---|---|---|---|---|
| 1 | **Open-Meteo** | nincs | 🆓 ingyenes, no-key REST, gazdag adat (current/forecast/historical), HU lefedett | nem HU-spec, általános ECMWF/ICON model |
| 2 | **OMSZ (met.hu) API** | nincs (public XML/JSON feed-ek) | hivatalos magyar meteorológiai szolgálat, riasztások natívan | dokumentáció gyenge, scrape-szerű |
| 3 | **idokep.hu scrape** | nincs | user-preferenciás forrás, magyar UX-ot tükrözi | ToS-zóna, anti-bot risk, instabil DOM |
| 4 | **OpenWeatherMap** | API-key (free tier 60/min) | jól dokumentált, alerts | regisztráció, free tier korlát |
| 5 | **Weatherbit / Visual Crossing** | API-key | fizetős vagy szűk free tier | ❌ no-paid elv |
| 6 | **WeatherAPI.com** | API-key (free 1M/hó) | jó dokumentáció, alerts | regisztráció |

**Default ajánlás (build-it-ourselves elv):** Open-Meteo + OMSZ riasztás-feed,
opcionálisan idokep.hu scrape mint "user-preferenciás vizuális réteg" (későbbre).

---

## Architektúra (szerver-oldal)

```
server/src/_routes/weather/
   weather.controller.ts          # GET /weather/current, /forecast, /alerts
   weather.data-service.ts        # DB layer (cache + history)
   weather-ingest.service.ts      # scheduled fetch (Open-Meteo + OMSZ)
   weather-normalize.service.ts   # közös DTO sémára map
```

- **Ingest** B-mode scheduled task (pl. 15 percenként current, 1 óránként forecast)
- **Cache** MongoDB (TTL index) — ne hammer-eljük a forrást
- **Alert pipeline** — OMSZ riasztás → SSoT esemény → opcionálisan cast-notify
  (lásd `cast-notifier-defaults.md`)
- **Action-log** lifecycle event-ek (start/stop/error), CLAUDE.md előírja

---

## Architektúra (kliens-oldal)

```
client/src/app/_modules/integrations/weather/
   weather.module.ts
   _components/
     weather-widget.component.ts     # dashboard widget (current + min/max)
     weather-forecast.component.ts   # 7 napos kártya-sor
     weather-alerts.component.ts     # OMSZ riasztás banner ha aktív
```

- Dashboard-on widget (current temp + ikon + következő 24h trend)
- Külön oldal részletes forecast + history graf
- Alert banner globálisan ha aktív OMSZ veszély-szint

---

## Adat-séma (vázlat)

```ts
WeatherReading {
  ts: ISO
  source: 'open-meteo' | 'omsz' | 'idokep'
  location: { lat, lon, name }  // default: Budapest
  temp: number                   // °C
  feelsLike?: number
  humidity?: number
  pressure?: number
  windSpeed?: number             // km/h
  windDir?: number               // deg
  precipitation?: number         // mm/h
  cloudCover?: number            // %
  iconCode: string               // normalizált (sunny/cloudy/rain/snow/...)
  raw: any                       // eredeti payload debug-hoz
}

WeatherForecast {
  ts: ISO                        // generated at
  location: { lat, lon, name }
  source: ...
  hourly: { ts, temp, precipitation, iconCode }[]
  daily: { date, tempMin, tempMax, precipitation, iconCode }[]
}

WeatherAlert {
  ts: ISO
  source: 'omsz' | 'meteoalarm'
  level: 'yellow' | 'orange' | 'red'
  type: 'wind' | 'rain' | 'storm' | 'heat' | 'cold' | 'snow' | 'fog' | ...
  area: string
  validFrom: ISO
  validTo: ISO
  description: string
  notified: boolean
}
```

---

## Phase-elés

| Phase | Mit |
|---|---|
| 0 | ez a FR (most) |
| 1 | Open-Meteo client + DB schema + `/weather/current` + `/weather/forecast` endpoint + dashboard widget |
| 2 | OMSZ alert feed ingest + alert banner kliensen |
| 3 | Cast-notify integráció riasztásra (vihar / hőség / hideg küszöb) |
| 4 | History graf + trend insight (pl. "ez a hét hűvösebb mint az előző") |
| 5 | Opcionális: idokep.hu scrape réteg (user-preferenciás vizualizáció) |

---

## Open kérdések

| Q# | Kérdés | Fontosság |
|---|---|---|
| Q-weather-1 | Lokáció: csak Budapest, vagy több helyszín (utazáskor)? | medium |
| Q-weather-2 | Open-Meteo elég-e első körben, vagy az idokep "feeling"-je is kritérium? | high |
| Q-weather-3 | Alert-küszöbök: melyik OMSZ szintet hangosítsuk cast-en (csak orange+? csak red?)? | medium |
| Q-weather-4 | Ingest gyakoriság: 15 perc / 30 perc / 1 óra? (current vs forecast külön) | low |
| Q-weather-5 | History retention: mennyi időre tartsuk az óránkénti adatot? (1 év? 3 év?) | low |
| Q-weather-6 | Dashboard widget vagy külön weather route? (most: widget + külön részletes oldal) | low |

---

## Error-handling — Dynamo pattern kötelező 🔴

Magas prio (`current/principles/error-handling.md`):
- **Ingest hibák** (Open-Meteo / OMSZ fetch fail): `DyFM_Error` errorCode `MA-WEATHER-INGEST-<CODE>` + `additionalContent: { source, location, statusCode, responseSnippet }` → globális handler → `Errors_DataService`
- **Parse / normalize hibák**: errorCode `MA-WEATHER-NORMALIZE-<CODE>` + raw payload referencia (debug-level descriptive)
- **Kliens-oldal**: weather-widget HTTP error → `A_Error_ControlService.showError(err, 'weather')` (no `[object Object]`)
- **Retry-policy** szabálya: silent retry tilos — minden ingest-error perzisztált, exponential backoff DyFM_Error trace-szel
- Lásd `current/feature-requests/runtime-error-api.md` (🟢 backlog 3b)

## Kapcsolódó

- `current/principles/error-handling.md` — debug-level error kötelező
- `current/principles/no-paid-solutions.md` — Open-Meteo + OMSZ default
- `current/principles/build-it-ourselves.md` — saját ingest + normalize
- `current/feature-requests/google-home-integration.md` — alert cast-push integrálási pont
- `current/architecture.md` L2 Monitoring (passzív megfigyelés) + L4 Server + L5 Client

---

## Migráció organizer-be (later)

| Lokál | Organizer |
|---|---|
| Cím | `title: "Időjárás portál integráció"` |
| Initial deklaráció | `description` (markdown) |
| Open kérdések | `acceptanceCriteria[]` |
| Kapcsolódó | `relatedRefs[]` |

---

## Status

🅿️ Felírva. Phase 0 kész. 6 open Q a konkretizáláshoz.

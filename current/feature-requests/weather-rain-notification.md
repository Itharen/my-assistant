# FR: Eső / vihar notifikáció — asztrál-emelő trigger

> **Forrás: user 2026-05-16 01:45** — "esik!! azt szeretem!! arról nem árt nekem noti, hogy nézzek ki mert esik. :) az emeli az asztrálom."

## Háttér

A `current/principles/three-by-three-system.md` (kapcsolat-tengely 2026-05-12) már rögzítette:
- A user **szereti a vihart + hideget**
- A kollektíva-rezgés ellenronthatja (vihar → kollektíva alacsony rezgés → lerántja)

Most: **eső is** (nem csak vihar) **emeli az asztrál**-t. Konkrét noti-trigger érdemes.

## Cél

Amikor **eső kezdődik** (átmenet száraz → csapadékos állapotba) a user lokációján
(Budapest):
1. **Push notification** (Google Home / dashboard / CCAP — `communication-forms.md` 3 csatorna)
2. Szöveg: "Esik! Nézz ki" (vagy hasonló — rövid, vidám)
3. **Aktiváció:** ébrenléti ablakban (sleep-aware-gate, ne ébresszen)

## Adat-forrás (3 jelölt)

| Forrás | Hogyan | Költség | Megjegyzés |
|---|---|---|---|
| **OpenWeatherMap** API | REST, ingyenes tier 60 hív/perc | 0 Ft | de regisztráció + key kell |
| **OpenMeteo** | nyílt, kulcs nélkül, REST | 0 Ft | **preferált** — no-paid-solutions principle ✅ |
| **Google Home weather** | ha a Home rendszer már látja | 0 Ft | ha integrálható már a Google IoT-n keresztül |

→ **MVP: OpenMeteo** (`https://api.open-meteo.com/v1/forecast?...&current=precipitation`)
poll-ozás 10-15 percenként, állapot-átmenet detect.

## Logika

```
elözö = no_rain
loop minden 15 perc (cron):
  curr = openmeteo.current.precipitation
  ha (elözö == no_rain AND curr > 0):
    notify ("Esik! Nézz ki.")
    + 3×3-log emit: asztrál-emelő trigger észlelve (mood-tracking-hez)
  elözö = (curr > 0 ? rain : no_rain)
```

## Mellék-hatások (asztrál-tracking integráció)

A 3×3-research findings.md hipotézise szerint az asztrál ~holdciklushoz kötött.
**Az eső / vihar események mint külső trigger-ek a `findings.md`-ben rögzítendők** —
hosszú távon mutatkozhat hogy melyik gyakrabban emel: hold-fázis átmenet vs külső
eső-trigger. Tehát: az eső-noti **+** auto-emit action-log entry `kind:"note"`
`summary:"weather-rain-start trigger"` — későbbi korreláció-elemzéshez.

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | chat ✅ |
| 1 | OpenMeteo poll service (server-side) + state-change detect | Dev Agent |
| 2 | Notify-cast (`communication-forms.md` Phase 2 ship) → "Esik! Nézz ki." | Dev Agent (kész FR használata) |
| 3 | Action-log emit minden rain-trigger eseményre | Dev Agent |
| 4 | (későbbi) finomítás: vihar-detect külön (`weathercode` is gyors növ.) → erősebb noti | Dev Agent |

## Status

🟡 **Backlog** — nem akut, **de** kicsi, gyors win + asztrál-emelő érték.
Backlog `#8a` (yellow hullámban).

## Kapcsolódik

- `current/feature-requests/communication-forms.md` — noti-csatorna
- `current/principles/three-by-three-system.md` — kapcsolat-tengely (vihar → asztrál)
- `current/3x3-research/findings.md` — külső trigger tracking
- `current/principles/no-paid-solutions.md` — OpenMeteo választás indoka

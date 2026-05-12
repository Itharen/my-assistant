# Két domén — asszisztensi vs szoftverfejlesztési

> **Forrás: a user szövege (2026-05-10).** Tisztázó alapelv — a kettő
> NE keveredjen.

---

## 2026-05-10 — alaptézis

> nagyon többen most akkor vázoljuk fel, hogy mi is az, amiről beszélünk,
> mert itt félő, hogy keverednek az aszisztensi feladatok a
> szoftverfejlesztési feladatokkal.

---

## A két domén

### 🧑 Domén 1: Asszisztensi feladatok (a user mindennapja)

A user életét segítő tevékenységek. A my-assistant CHAT (én) közvetlen
köze van ezekhez.

| Terület | Példa |
|---|---|
| Stock + bevásárlás | rákcsa elfogyott → Kínai bolt; cigi, energiaital → Tesco/dohány |
| Recurring rutinok | fürdés (heti 2×), séta (napi, hajnali 02-04 preferált), takarítás (szerda), Interfood-rendelés |
| Életcélok + projektek | TERA, Niche Datasets, HelloCIA, 3×3 tanulmány, Master Prompter, Service, FDP Token, Upwork |
| Diary + state | mai ébredés, vendégség, hangulat, energy-level |
| Open kérdések kezelés | parkolt kérdések, válasz-management |
| Emlékeztetés | kaja-rendelés deadline, jogsi határidő, bedtime |
| 3×3 hullám tracking | asztrál/mentál/anyag állapot |
| Pénz-fókusz emlékeztetés (`mvp-focus.md`) | MVP = pénzkeresés |

**Hely a rendszerben**: `current/` mappa (principles + diary + stock + shopping + open-questions + projects + life-goals + stt-typos + feature-requests).

---

### 💻 Domén 2: Szoftverfejlesztési feladatok (az asszisztens-rendszer építése)

A my-assistant **mint rendszer** építése — hogy létezhessen az
asszisztensi domén kiszolgálása.

| Réteg | Példa |
|---|---|
| L1 Files | `__agent/STATUS.md`, action-log, state-fájlok |
| L2 Monitoring | activity-monitor, jövőbeli battery/food-tracking/sleep-monitor |
| L2 Notification | `ma cast notify`, jövőbeli email/social |
| L3 CLI | `cli/` `ma` parancsok |
| L3 Dashboard | `client/` Angular |
| L4 Server | `server/` Express + SQLite |
| L5 Agent runtime | A-mode (health-check), B-mode (scripted), C chat (én) |
| Workflow-doc | `__agent/plans/`, `__agent/triggers/`, principles |
| Tooling | dispatcher, schemas, tier-system, review-tool rollout |

**Hely a rendszerben**: `__agent/` (governance) + `cli/server/client/` (build) + `scripts/` (helper).

---

## Kapcsolat a kettő között

```
   Domén 2 (szoftverfejlesztés)
        építi
          ▼
   az infrastruktúrát ami
          ▼
   szolgálja a Domén 1-et (asszisztensi feladatok)
```

A két domén **kölcsönhat**, de NEM ugyanaz a munka-típus.

| Szempont | Asszisztensi | Szoftverfejlesztési |
|---|---|---|
| Időigény | rövid (percek) | hosszú (órák, napok) |
| Energia | low (rögzítés, jelzés) | medium-high (tervezés, kódolás) |
| Lendület-érzékenység | kicsi (lehet fáradtan is) | nagy (jó vektor-irány kell) |
| Felelős | én (my-assistant chat) + user közvetlenül | én (workflow-doc) + másik agent (build) + CCAP (runtime) |

---

## Anti-pattern (mit kerüljünk)

**NE keverjük egy üzenetben** (mind én, mind a user):
- ❌ "Felvettem a stock-ba a rákcsát + építsünk egy battery-monitor scriptet"
- ❌ "Most fáradt vagyok... beszéljünk a server-app architektúráról"

**Helyette:**
- ✅ Asszisztensi módban: csak rögzítés, jelzés, emlékeztetés
- ✅ Fejlesztési módban: design, plan, build (a user vagy másik agent által)
- ✅ **Mode-switch jelölés** ha váltás van: "Most asszisztensi" / "Most fejlesztési"

## Hogyan ismerem fel én

| Domén | Jel |
|---|---|
| **Asszisztensi** | stock-update, recurring-jelzés, diary-megosztás, energy-state, fáradtság, kérdezés mit-csináljon, projekt-tracking |
| **Fejlesztési** | FR-érkezés, design-kérdés, "hogyan trekkeljük X-et", refactor-állapot, "építsd meg" |

Ha **kétértelmű**, kérdezzem meg melyik módban beszélünk.

## Kapcsolódik

- `current/principles/working-style.md` — általános
- `current/architecture.md` — fejlesztési-domén térképe
- `current/projects.md` — asszisztensi-domén projekt-térképe (közvetett az életcélokhoz)
- `current/life-goals.md` — asszisztensi-domén top

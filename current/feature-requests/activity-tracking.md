# FR: Activity tracking (passive)

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-05-07 — user follow-up (válasz a kérdéseimre + új info)

> Ez jól hangzik. A számítógépen a figyelést, hogy ha most itt csinálsz egy
> rendszert hozzá, az fog tudni figyelni és futni és működhet. Annyi, hogy
> csinálj neki egy mappát a root-ba, ahol futtatni fogjuk majd ezt a
> figyelőrendszert, és onnan kapcsolódjon be az Agent mappában lévő dolgokra.
> A Kalender Integration az még egy külön research, meg egy külön mutatvány,
> ott rengeteg mindent meg kell csinálni. Viszont lehet, hogy relevánsak
> lehetnek majd a Többféle eszközintegráció, mint például igen, az
> eszközeimre rakott eszköz, az okos eszközeim bekötése és Google Home
> eszközök bekötése, és van okos órám is, ami figyelheti, hogy hogy vagyok.
> Annyi, hogy az okosórámat rendszeresen elfelejtem magammal vinni,
> elindítani, hogy most séta van, meg ilyenek

**Válaszok:**
- **Q-act-1**: ✅ **L2 GO** — root-ba mappa, `__agent/`-be log → létrehozva: `activity-monitor/`
- **Q-act-6**: van **okosóra** — DE **rendszeresen elfelejti magával vinni / elindítani** "most séta van" → unreliable adatforrás → manuális trigger nélkül a wearable nem segít

**Új challenge a wearable körül:**
- L5 nem működik passzívan (a user-nek el kéne indítania a "session"-t)
- Megoldás-irányok:
  - 🔁 Auto-detect a watch-on (lépés-burst → automatikusan nyit egy "walk" session-t — Garmin / Wear OS támogat)
  - 📲 Phone-paired: a watch a phone-tól GPS-t kap → otthon-elhagyás detektálható
  - 🏠 Smart home: ajtó-szenzor → "kiment" trigger → notification a watch-on hogy "elindult egy walk?"

**L4 (smart home) felemelve a prioritáson**: a user explicit megemlítette
"okos eszközeim bekötése" — már több eszköze van. Most csak Google Home volt
specifikus, de a többi smart device is bekapcsolható.

---

## 2026-05-07 — initial brainstorm

> Vajon hogyan tudnád megfelelően trekkelni azt, hogy éppen mit csinálok?
> Csak hogy ne kell ilyen folyamatosan riportolnom.

---

## Strukturált ötletelés (assistant-jegyzet, NEM a user szavai)

### Cél

A user ne **manuálisan** kelljen jelezzen mindent (séta megvolt / fürdés
megvolt / patikába mentem / kádba ugrottam) — az asszisztens **automatikusan**
következtessen az aktuális tevékenységre, vagy passzív jelekből megtudja.

### Réteges megközelítés

| Réteg | Mit ad | Költség | Szükséges integráció |
|---|---|---|---|
| **L0 — Inferens** | Időpont + szabály-alapú következtetés (pl. péntek 13:00 → meeting; 21:00 → séta-ablak) | 0 (most is megy) | nincs |
| **L1 — Calendar** | Pontos meeting-state: "most meeting van" | alacsony | Teams + Google Cal API (lásd `calendar-integration.md`) |
| **L2 — Lokál gép** | Aktív app, browser tab, IDE state, audio (TTS aktív?), idle-time | közepes | OS-szintű script (PowerShell / WMI / Windows-aktivitás logger) |
| **L3 — Mobil** | GPS (otthon / patika / Gellért-hegy / IKEA), screen-on, app-aktivitás | közepes-magas | Tasker / Home Assistant / Google Fit API |
| **L4 — Smart home** | Vízhasználat (zuhany), light-state, Google Home aktivitás (TV / zene) | közepes | Google Home API / smart-plug-ok |
| **L5 — Wearable** | Pulzusszám, lépésszám (séta-detect), alvás (sleepAt automatikus) | magas (eszköz-igény) | Garmin / Fitbit / Apple Watch API |

### Mit fed le ezekkel a meglévő use-case-ek?

| Tevékenység | L0 | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|---|
| 🚶 Séta megvolt-e | ❌ | ❌ | ❌ | ✅ GPS | (~) | ✅ lépés |
| ⛰️ Hegy-séta megvolt-e | ❌ | ❌ | ❌ | ✅ GPS | ❌ | ✅ elevation gain |
| 🛁 Fürdés megvolt-e | (~) idő | ❌ | ❌ | ❌ | ✅ víz | (~) |
| 🍱 Kaja-rendelés leadva | ❌ | ❌ | ✅ browser-history | ❌ | ❌ | ❌ |
| 🏥 Patikába ment | ❌ | ❌ | ❌ | ✅ GPS | ❌ | ❌ |
| 🌅 Ébredés időpont | ❌ | ❌ | ✅ first-key-press | ✅ screen-on | ❌ | ✅ |
| 🌙 Lefekvés | ❌ | ❌ | ✅ idle | ✅ screen-off | ❌ | ✅ alvás-detect |
| 💼 Project-state (TERA / CCAP) | ❌ | ❌ | ✅ git / IDE | ❌ | ❌ | ❌ |
| 🍽️ Étkezés | ❌ | ❌ | ❌ | ❌ | (~) konyha-light | ❌ |

### Reális első lépések (cost/value)

**🟢 Olcsó, high-value (most azonnal megoldható):**
1. **L0 már megy** — inferens szabályok aktívak a `current/principles/`-ban
2. **L2 lokál gép tracking** — egy egyszerű PowerShell script ami percenként
   logolja: aktív window title, idle-time, time-of-day → `__agent/log/activity-YYYY-MM-DD.jsonl`
   - Ebből máris lehet következtetni: ébredés / lefekvés / "TERA-ban dolgozott" / "CCAP-ban dolgozott"

**🟡 Közepes költség, nagy érték:**
3. **L1 Calendar** — Teams + Google API (már külön FR: `calendar-integration.md`)
4. **L3 GPS lokáció** — telefonon Tasker + webhook a my-assistant-be: home / patika / hegy / IKEA / "máshol"

**🔴 Magas költség / hosszú távú:**
5. **L4 smart home** — Google Home / smart-plug-ok (Google Home FR már nyitva)
6. **L5 wearable** — eszköz-vásárlás kell, plus API

### Privacy / control

- A user **dönti el** mely réteg aktív, és mely adatokat tárolunk
- Default: minden lokálban (`__agent/log/activity/`-ba), nem küldünk ki
- Opt-in cloud sync csak ha kell (pl. mobil → desktop)

### Kapcsolódó FR-ek (cluster: proaktivitás / observability)

- `calendar-integration.md` — L1
- `google-home-integration.md` — L4
- `tesco-integration.md` — kapcsolódó, de nem activity-tracking
- `ccap-live-communication` (organizer task) — output-csatorna

### Open kérdések

- **Q-act-1**: Melyik réteggel kezdjünk? (Javaslat: L2 lokál gép — leghamarabb hozható, low-cost)
- **Q-act-2**: Mobil platform: Android (Tasker) vagy iOS (Shortcuts)?
- **Q-act-3**: Hol tároljuk az activity-log-ot? `__agent/log/activity/YYYY-MM-DD.jsonl`?
- **Q-act-4**: Privacy küszöb — meeting-címeket logoljunk-e? Mit NEM tárolunk?
- **Q-act-5**: Milyen "natural language summary"-t generáljunk a logból? (pl. session elején: "Az utolsó interakció óta TERA-ban dolgoztál 2 órát + 1 óra séta")
- **Q-act-6**: Wearable: van valami eszköz amit használsz? (Garmin / Apple Watch / Fitbit / semmi)

---

## 2026-05-17 — kibővítés: always-on + event-emit + device-integration

### User szövege

> Az Activity Monitornak folyamatosan kéne jeleznie, hogy mi van, és kéne
> tény gyereket [tényeket / esemény-jelentéseket] küldjön, amikor változás van.
> Az egészség trekkinget is rá kéne kötni az eszközekre.

### Új scope-elemek

**A — Always-on activity-monitor + change-event emit:**
- A `activity-monitor/` ne legyen one-shot — **folyamatos loop** (a host gépen szolgáltatás-szerűen)
- Periodikus snapshot (pl. 60s vagy 30s)
- **Csak változáskor** emit-eljen `kind:"state-change"` event-et az action-log-ba (NEM minden snapshot, csak ha eltér az előzőtől)
- Detektálandó változások: idle/active transition, ablak-fókusz váltás (csak categorize: dev/browser/idle, NEM tartalom), session lock/unlock, gép sleep/wake
- Lifecycle event-ek (start/stop/crash) **mindig** loggolva (`current/CLAUDE.md` action-log szabály szerint)

**B — Health-tracking eszköz-integráció:**

A séta / hegy / fit / arc-mosás / fürdés tracking **NEM** csak passzív gép-aktivitásból derülhet ki. Eszközök bekötése:

| Eszköz / forrás | Mit ad | Integráció |
|---|---|---|
| **Telefon (Android)** | lépésszám, GPS, képernyő-on/off, screen-time, app-usage | Google Fit REST API (already auth-set lehet); vagy direct Android intent / Tasker bridge |
| **Okosóra** (ha lesz) | szívverés, alvás, lépés, fizikai aktivitás-detect | brand-függő API (Fitbit / Garmin / Wear OS) |
| **Google Maps timeline** | lokáció-history, hegyre-érés, séta-útvonalak | Google Takeout / Timeline export |
| **Google Home aktivitás** | "Hey Google" parancs-log, broadcast-tartalom | (limit: nincs publikus API, lásd `google-home-integration.md`) |

### Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a kiterjesztés | chat ✅ |
| 1 | Activity-monitor always-on loop + change-event emit (csak Δ-ra) | Dev Agent |
| 2 | Activity-monitor lifecycle hardening (auto-restart, host-service-szerű) | Dev Agent |
| 3 | Google Fit REST API integration (lépés, GPS, screen-on) — server-side | Dev Agent (külön green-light) |
| 4 | Health-journal auto-emit (séta-detect → `current/health-journal.md` entry) | Dev Agent |
| 5 | Okosóra-integráció (ha lesz device) | későbbi |

### Backlog módosítás

A backlog `#3c` IoT integráció (Google Home routine wake/sleep) **testvér FR** — kombinálható: a wake/sleep event-ek az `activity-monitor`-ba is folynának be (event-fúzió).

### Status

🟢 **MAGAS prio** — user 2026-05-17 explicit kérés. Phase 1+2 self-contained (host-side script + Node loop), Phase 3+ a server / külső API-kra vár.

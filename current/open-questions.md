# Open questions — assistant által felvetett, válaszra váró kérdések

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-05-07 — alapelv: a kérdéseket gyűjtjük

> A kérdések, amiket itt felírogatsz nekem menet közben, azokból azt, ami
> fontosabb lehet később, azokat össze kéne írnod egy fájlba, hogy amikor így
> bombázlak inputokkal, akkor a végén utána vissza tudjuk olvasni ezeket a
> kérdéseket, ne felejtődjenek el, mert Lehet benne jó pár dolog, ami fontos,
> hasznos, stb. Majd azokat okosítanunk kell, hogy mi alapján priorizáljuk,
> szűrjük, mi fontos, mi nem, stb.

---

## Hogyan használjuk (assistant-jegyzet, NEM a user szavai)

- **Új kérdés felvetésekor**: minden assistant-felvetés ide kerüljön, ID-vel és
  kategorizálva. A chat-ben is felemlítem (rövid heads-up), de a permanens hely
  ez a fájl.
- **Mező-szerkezet**: `Q#` (egyedi azonosító) | kérdés | kontextus / forrás |
  fontosság (l/m/h, becsült) | status (open / answered / dropped / postponed)
- **ID-konvenció**: `Q-YYYY-MM-DD-NN` (pl. `Q-2026-05-07-01`)
- **Válasz után**: status `answered`, plus a válasz egy sorban; a fájl marad,
  történet okán.
- **Drop**: ha a kérdés irrelevánssá vált (pl. felülírta egy újabb input),
  status `dropped`, indok 1 mondatban.
- **Priorizálási elv (TBD)**: a user majd okosít a szűrési-priorizálási elven.
  Initial heuristika: minden konkrét döntésre váró + minden ami az alaptéziseket
  érinti = `high`; STT-bizonytalanság = `medium`; nice-to-have / hosszú távú =
  `low`.

---

## Aktív kérdések (kategorizálva)

### A) STT-bizonytalanságok 🎙️

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-01 | "Serikók" mi pontosan? | `current/stock/items.md` snack kategória | medium | open |
| Q-2026-05-07-02 | "Rákcsa" = rágcsa / rágcsálnivaló? (gyanú) | `current/stock/items.md` snack | medium | open |
| Q-2026-05-07-03 | "Kenyeret kenyérhez ezt meg azt" — mi a "kenyérhez"? | `current/stock/items.md` étel-alapanyag | low | open |
| Q-2026-05-07-04 | IKEA "eszközkészlet" = evőeszköz vagy konyhai eszköz? | `current/shopping/ikea.md` | low | open (helyben kiderül) |

### B) Methodology / SOURCE_OF_TRUTH 🏛️

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-10 | `SOURCE_OF_TRUTH.md` frissítése: stock + shopping `organizer-partial` → `local`? | A user methodology-authority alapján a my-assistant a kanonikus, a stock + shopping `current/`-ben épült fel | high | open |
| Q-2026-05-07-11 | Meglévő organizer task-okra `tags: [ccap/tera/nietzsche]` batch-update? | Project-szorzók alkalmazásához kell; `fo tasks.update` még nem verifikált | high | open |
| Q-2026-05-07-12 | "Bevételt kell szereznünk" meta-task bontás projekt-szerinti sub-task-okra (TERA/Niche datasets)? | `current/projects.md` — most meta cím | medium | open |

### C) Project-strukturális kérdések 📊

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-20 | "Pályázatírás" task TERA-projekt vagy különálló? | `current/projects.md` mapping (most TERA-gyanúval) | medium | open |
| Q-2026-05-07-21 | Projekt-szorzók (2.0 / 1.5 / 1.2 / 1.0) megfelelő skála? Vagy aggresszívabb? | `current/projects.md` — defaultokat én tippeltem | high | open |
| Q-2026-05-07-22 | A 90-es CCAP-task-cluster konszolidálható? (Niche datasets majdnem kész, agentek célállapot megvan) | Régi tasks az organizer-ben — esetleg lezárhatóak | medium | open |

### D) Recurring / életstílus 🔄

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-30 | Takarítás csúszás-kezelés: ha szerda kihagy, mikor pótoljuk? | `recurring-tasks.md` open | low | open |
| Q-2026-05-07-31 | Séta tracking: count-alapú vagy duration-alapú? | `recurring-tasks.md` open | low | open |
| Q-2026-05-07-32 | Bevásárlás 14 vagy 21 nap default? | `recurring-tasks.md` open | low | open |
| Q-2026-05-07-33 | Kaja-rendelés eskalálódási görbe (csütörtök/péntek/szombat) ? | `recurring-tasks.md` open | medium | open |
| Q-2026-05-07-34 | `sleepAt` időpontot honnan tudjam meg? (a) chat-en bejelented, (b) visszaszámolva, (c) mindkettő | `sleep-system.md` workflow | medium | open |

### E) Stock-system finomítások 📦

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-40 | Mértékegység minden item-nél (db / l / kg / csomag)? | `stock-system.md` open | medium | open |
| Q-2026-05-07-41 | Lejárat tracking kell-e (kajáknál)? | `stock-system.md` open | medium | open |
| Q-2026-05-07-42 | Auto-decrement (heti felhasználás) vagy manuális update? | `stock-system.md` open — most default = manuális | low | open |
| Q-2026-05-07-43 | Több-szintű threshold (warn + critical) kell-e? | `stock-system.md` open — most egy küszöb | low | open |
| Q-2026-05-07-46 | Ruházati stock target reális értéke (zokni / alsógatya) — 3 (default) reálisan kevés, valószínűbb 8-10 pár | `current/stock/items.md` Ruházat | medium | open |
| Q-2026-05-09-cigi-1 | Cigi: preferredStore (Tesco / dohánybolt / benzinkút?) + targetQty (heti fogyás alapján)? | `current/stock/items.md` Élvezeti | medium | open |
| Q-2026-05-09-cigi-2 | Cigi márka / mértékegység (csomag vs karton)? | `current/stock/items.md` Élvezeti | low | open |
| Q-2026-05-07-44 | Bolt-asszociáció minden item-en (preferredStore mező)? | `stock-system.md` open + `shopping-lists.md` | medium | open |
| Q-2026-05-07-45 | Rum vs Kapitány két külön stock-tétel vagy egy? | `stock/items.md` (most két külön sor) | low | open |

### F) Feature requests / külső integrációk 🌐

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-50 | Calendar integráció: read-only elég, vagy bidirectional kell? | `current/feature-requests/calendar-integration.md` | medium | open |
| Q-2026-05-07-51 | Calendar sync hol fut: lokál cron / organizer server / microservice? | `current/feature-requests/calendar-integration.md` | medium | open |
| Q-2026-05-07-52 | Meeting-adatok (cím / résztvevők) logolása vs csak start/end? | `current/feature-requests/calendar-integration.md` | medium | open |
| Q-2026-05-07-53 | Tesco scraping vs hivatalos API? | `current/feature-requests/tesco-integration.md` | medium | open |
| Q-2026-05-07-54 | Out-of-stock tételek prio-ja a következő Tesco rendelésben? | `current/feature-requests/tesco-integration.md` | low | open |

### G) Process / setup ⚙️

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-60 | Hózárás: 6 hónapra előre felvegyük a recurring task-okat, vagy mindig csak a következőt? | `recurring-tasks.md` céges hózárás szakasz | low | open |
| Q-2026-05-07-61 | Daily snapshot script (organizer downtime fallback)? | korábbi javaslat | low | open |
| Q-2026-05-07-62 | Mikor csináljunk FR-batch upload-ot az organizer-be (kritikus tömeg után)? | `methodology-authority.md` | medium | open |
| Q-2026-05-07-63 | LinkedIn csúszás-küszöb: heti 0-1 poszt → halogatás-szorzó megerősítése | `recurring-tasks.md` LinkedIn | low | open |
| Q-2026-05-07-64 | Hogyan tudjuk hogy egy organizer-feature eltér a my-assistant elvárásától? | `methodology-authority.md` | medium | open |
| Q-2026-05-29-02 | Organizer `fo` API-kulcs miért tűnt el? (encrypted store üres volt → `test-key` fallback → minden organizer-művelet AUTH-failt dobott). Projekt-áthelyezés / gép-state / `fo init` elmaradás? Hogyan előzzük meg újra? | `recording-discipline.md` (P0 blokkoló volt) | high | open |
| Q-kitchen-1 | Konyhai capture preferált irány: hangvezérelt (voice-trigger) / dedikált eszköz (régi telefon) / mobil quick-capture widget? | `kitchen-note-capture.md` | medium | open |
| Q-kitchen-2 | A capture célja: my-assistant chat, organizer notes-inbox, vagy mindkettő (recording-discipline szerint mindkettő)? | `kitchen-note-capture.md` | medium | open |
| Q-2026-05-29-01 | "Organizer Tasks Screen Updates" (user MVP-task 2026-05-29) — melyik projekt scope-ja? (a) **organizer** saját tasks-képernyő → kívül esik a my-assistant dev-scope-on (mi csak `fo` fogyasztók vagyunk), vagy (b) a my-assistant kliens **#3d tasks-dashboard** view frissítése? | `development-agent-backlog.md` #3d + CLAUDE.md scope | high | answered 2026-05-29: (a) — az organizer a user saját fejlesztése, a tasks-screen fejlesztés a **user feladata**, NEM a my-assistant Dev Agenté. Kívül esik a my-assistant dev-scope-on. Indok: a user az élete során sokat küzd a feladatok rendszerezésével → ez sokat segíthetne. |

### G3) Health 🏥

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-90 | Arc-mosás konkrét időablakok (reggel / közép / este), vagy csak "3× a napon"? | `health-system.md` | medium | open |
| Q-2026-05-07-91 | A "lefertőtlenítés" mi pontosan? (alkoholos / krém / bőrgyógy szer)? | `health-system.md` | low | open |
| Q-2026-05-07-92 | Más health-elemek (fogmosás, vitamin, gyógyszer-bevétel) később? | `health-system.md` | low | open |
| Q-2026-05-07-93 | Anti-deferral küszöb: hányadik "majd"-nál vált át kemény heads-up-ra? | `health-system.md` pszichológia | medium | open |

### G2) Fit / edzés-program 💪

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-80 | Edzés-program 3. szint indítás (rendes edzések): most vagy később? | `fit-system.md` | high | open |
| Q-2026-05-07-81 | Kezdő darabszámok edzésenként (fekvőtámasz / láb / húzódzkodás / súlyzó / egyéb)? | `fit-system.md` | high | open |
| Q-2026-05-07-82 | Heti rajt: mind az 5 edzéselemet hetente, vagy rotált 2-3? | `fit-system.md` | medium | open |
| Q-2026-05-07-83 | Otthoni vagy konditerem? Súlyzózáshoz felszerelés van? | `fit-system.md` | medium | open |
| Q-2026-05-07-84 | Inkrementum-rate (mennyivel + hány alkalom után)? | `fit-system.md` | medium | open |
| Q-2026-05-07-85 | Time-of-day preferencia (ébredés után / fürdés előtt / este)? | `fit-system.md` | medium | open |
| Q-2026-05-07-86 | Tracking finomság (csak "megvolt-e" + reps, vagy súlyok / idők)? | `fit-system.md` | medium | open |
| Q-2026-05-07-87 | "Láblengetés" pontos jelentése: leg-raise / lábemelés / leg-swing? | `fit-system.md` STT-bizonytalan | low | open |

### H) Meta — a kérdés-rendszerről (saját) ❓

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2026-05-07-70 | Priorizálási / szűrési elv a kérdésekre — mi alapján? | a user mondta "majd okosítanunk kell" | high | open |
| Q-2026-05-07-71 | Válasz-status szabály: ha egy kérdést impliciten "elköltöztetett" egy újabb input, automatic-drop vagy manuális? | mostani fájl bevezetése | low | open |

---

## Closed / answered (történet)

| Q# | Eredeti kérdés | Válasz | Lezárva |
|---|---|---|---|
| Q-act-1 | L2 lokál gép tracking csináljam most? | ✅ **igen** — `activity-monitor/` mappa + `logger.ps1` létrehozva | 2026-05-07 |

---

## Új / kapcsolódó kérdések

### I) Activity-monitor ⚙️

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-am-1 | Browser-tab cím logolása OK, vagy maszkolva? | `activity-monitor/README.md` | medium | open |
| Q-am-2 | Idő-zóna: Europe/Budapest fix vagy `[TimeZoneInfo]::Local`? | `activity-monitor/logger.ps1` | low | open |
| Q-am-3 | Mintavételezés: 60s default jó? Vagy 30s / 5p? | `activity-monitor/logger.ps1` | low | open |
| Q-am-4 | Auto-cleanup régi log-okra (N nap)? | `activity-monitor/README.md` | low | open |
| Q-am-5 | Mikor csináljunk aggregátor / summary script-et? | `activity-monitor/README.md` | medium | open |

### J) Wearable / smart-device 📱

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-wear-1 | Okosóra márka / OS? (Garmin / Wear OS / Apple) | wearable-stratégia | medium | open |
| Q-wear-2 | Auto-detect lépés-burst → "walk" session a watch-on (van támogatás)? | wearable-stratégia | medium | open |
| Q-wear-3 | Smart home ajtó-szenzor a "kiment" eseményhez? | smart-home cluster | low | open |
| Q-wear-4 | Mely smart eszközök vannak már? (Google Home + ?) | activity-tracking L4 | medium | open |
| Q-wear-5 | **Implementálható-e egy saját IoT "fake device" (pl. Matter / Cloud-to-cloud Smart Home), amit Google Home routine triggerként használhatunk? Pl. egy virtuális kapcsolót flippel a Home routine, és az eszközünk kapja a HTTP webhookot?** Cél: **bidirectional** — Home routine → my-assistant felé jelzés (pl. user "Hey Google, jó éjt" mond → routine flippeli a virtuális kapcsolót → my-assistant megkapja a "lefekvés szándék" event-et). Lásd: `current/feature-requests/google-home-integration.md` 4. szakasz "Smart Home Cloud-to-cloud fake device" — ott csak fél-mondatban van. Külön mély research kell mikor a cast-notifier V1-V3 lezárult. | follow-up research | high | open |

### K) Organizer day+week view 📅

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-orgview-1 | Default méret-arány a dual-pane-en (50/50, 70/30)? | `organizer-day-week-view.md` | low | open |
| Q-orgview-2 | "ma" oszlop kiemelt-e a heti nézeten? | `organizer-day-week-view.md` | low | open |
| Q-orgview-3 | Multi-day events kezelése? | `organizer-day-week-view.md` | low | open |
| Q-orgview-4 | "Free slot" jelölés üres napokon? | `organizer-day-week-view.md` | low | open |
| Q-orgview-5 | Mobil nézet: dual-pane → tabbed swap? | `organizer-day-week-view.md` | low | open |

### L) 3×3 system 🌀 (asztrál/mentál/anyag + hullám-tracking)

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-3x3-1 | A 3×3 mátrix második tengelyének (létezés / hullám / kapcsolat) cella-jelentései? | `three-by-three-system.md` | high | open |
| Q-3x3-2 | Tracking-skála: 1-10, Likert, VAS, vagy saját? | `three-by-three-system.md` | medium | open |
| Q-3x3-3 | Tracking-frekvencia: ébredés / lefekvés / interakciónként? | `three-by-three-system.md` | medium | open |
| Q-3x3-4 | Hullám-paraméterek (hullámhossz, amplitúdó, rezgésszám) becslése — empirikus N nap után? | `three-by-three-system.md` | medium | open |
| Q-3x3-5 | Töri- és megoszló-erők kategorizálása (event log mező)? | `three-by-three-system.md` | medium | open |
| Q-3x3-6 | Vektor-irány **kiszámítása** trend-elemzésből (utolsó 3-5 mérés deriváltja)? | `three-by-three-system.md` | medium | open |
| Q-3x3-7 | "Összesített hullám" képlete: súlyozott átlag / mértani / saját? | `three-by-three-system.md` | medium | open |
| Q-3x3-8 | A user "tudománya" — van írott formában? Hol találjuk? | `three-by-three-system.md` | high | open |
| Q-3x3-color-1 | Mentál szín? (Asztrál = 🟡 sárga, user-döntés 2026-05-12) | `three-by-three-system.md` | low | open |
| Q-3x3-color-2 | Anyag szín? | `three-by-three-system.md` | low | open |

### M) Életcélok 🌟

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-life-1 | "Ideology Forum" mi pontosan? Saját platform / létező közösség / koncepció? | `life-goals.md` | high | open |
| Q-life-2 | Az "egyéb értékes tudás" — mik konkrétan? Tudásterületek? | `life-goals.md` | medium | open |
| Q-life-3 | HelloCIA hátralévő ~10% — bontható konkrét sub-task-okra? (szükséges: 5 év csúszás miatt) | `life-goals.md` | high | open |
| Q-life-4 | Életcél-priorizálás: a 2 cél egyenrangú, vagy egyik magasabb-prio? | `life-goals.md` | medium | open |
| Q-life-5 | Családalapítás cél deadline / életkor-orientált? | `life-goals.md` | medium | open |
| Q-life-6 | HelloCIA pontos név-forma (HelloCIA / Hello.CIA / HelloKia / más)? | STT-bizonytalan | medium | open |

### P) Eszköz-monitoring 🔋

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-dev-1 | Mely eszközök: telefon (Android/iPhone?), tablet (?), okosóra (van? milyen?), laptop/PC? | `device-battery-monitoring.md` | medium | open |
| Q-dev-2 | Notifikáció-csatorna: Google Home / chat / Android push? | `device-battery-monitoring.md` | low | open |
| Q-dev-3 | Volume schedule: konkrét időablakok? (pl. 23:00 = 0.3, 02:00 = mute) | `device-volume-scheduling.md` | low | open |

### Q) Sleep-aware 😴

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-sleep-aware-1 | Sleep-window detekció melyik forrásból (sleep-system formula / activity-monitor / alvás-monitor)? | `sleep-aware-notifications.md` | high | open |
| Q-sleep-aware-2 | Tail-store: ébredéskor mind az elmaradt notif, vagy csak a kritikusak? | `sleep-aware-notifications.md` | medium | open |
| Q-sleep-aware-3 | Van Nest Hub "Sleep Monitor" — ez Sleep Sensing-képes? Aktív? | `sleep-monitor-data-access.md` | high | open |
| Q-sleep-aware-4 | Google Fit account hozzáférhető OAuth2-vel? | `sleep-monitor-data-access.md` | medium | open |

### R) Interfood 🍱

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-interfood-1 | Login-state save Playwright-tal — egyszer beléptetni, utána automatikus? | `interfood-scraper.md` | medium | open |
| Q-interfood-2 | Periodikus check ütemezése: napi 1× / 2× / event-driven? | `interfood-scraper.md` | low | open |
| Q-interfood-3 | "Mit-evett" = "mit-rendeltt" approximation — milyen pontatlanság elfogadható? | `interfood-scraper.md` + `food-tracking.md` | low | open |

### S) Triggering architecture 🔧 (3-session rendszer)

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-trig-1 | A) hour-session: Claude SDK call / saját agent? Költség? | `triggering-system-architecture.md` | high | open |
| Q-trig-2 | B) scripted: PowerShell vs Node — mi a default? | `triggering-system-architecture.md` | medium | open |
| Q-trig-3 | Shared state: file-locking vagy state-server (komolyabb)? | `triggering-system-architecture.md` | high | open |
| Q-trig-4 | Missed-job: pótlás vagy elhagyás (kontextus-függő)? Per trigger-típus dönteni? | `triggering-system-architecture.md` | medium | open |
| Q-trig-5 | Watchdog gyakorisága? (5p / 15p / 1h?) | `triggering-system-architecture.md` | medium | open |
| Q-trig-6 | Trigger queue persistencia: SQLite / JSON-fájl / saját? | `triggering-system-architecture.md` | medium | open |
| Q-trig-7 | Költség-keret (USD/nap hard cap + óránkénti hívás-szám max)? | `triggering-system-architecture.md` | high | open |
| Q-trig-8 | Plan-approval gate: mi minősül "elfogadott plan"-nek? | `triggering-system-architecture.md` | high | open |
| Q-trig-9 | Action-scope tier-ek (önálló vs user-OK kell)? | `triggering-system-architecture.md` | high | open |
| Q-trig-10 | Sleep-aware: A-mode is felfüggesztve alvás alatt, vagy csak notify? | `triggering-system-architecture.md` | medium | open |
| Q-trig-11 | Hol fut (Windows Task / Cloud / Claude Agent API / node cron)? | `triggering-system-architecture.md` | high | open |
| Q-trig-12 | Loop-safety iteration-cap per cycle? | `triggering-system-architecture.md` | medium | open |
| Q-trig-13 | "Egyéb monitoring/communication eszközök bekötése" — mit ért alatta? (activity-monitor + cast-notifier + organizer + ?) | `triggering-A-mode-health-check.plan.md` | high | open |

### U) Server-app + DB 🗄️

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-server-1 | Mongo vs PostgreSQL? | `server-app-architecture.md` | high | open |
| Q-server-2 | Egy server-app az egész my-assistant rendszernek, vagy modul-szintűen több? | `server-app-architecture.md` | medium | open |
| Q-server-3 | Cloud vagy on-prem? (latency / pénz / secret) | `server-app-architecture.md` | high | open |
| Q-server-4 | Saját repo vagy `my-assistant/server`? | `server-app-architecture.md` | medium | open |
| Q-server-5 | API-design: REST elég, vagy GraphQL/gRPC? | `server-app-architecture.md` | low | open |
| Q-server-6 | "Másik agent" — CCAP via agent-system, vagy ad-hoc Claude session? | `server-app-architecture.md` | medium | open |

### V) B-mode (scripted automatizmus) 🤖

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-bmode-1 | Phase 1 task-ok közül melyik kell tényleg? Mind 6 vagy szelektálva? | `B-mode-scripted-automation.plan.md` | medium | open |
| Q-bmode-2 | Frequency: óránként-percenként — task-szinten vagy egységesen? | `B-mode-scripted-automation.plan.md` | medium | open |
| Q-bmode-3 | Failure handling: 1× hiba = email / 3× = notify? | `B-mode-scripted-automation.plan.md` | low | open |
| Q-bmode-4 | Build-ki: én vagy másik agent? | `B-mode-scripted-automation.plan.md` | high | open |

### BB) Heti ciklus (munkanap-alapú) 📅

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-weekly-1 | `cleaning` (heti 1×, "szerda") — naptári szerda vagy 3. munkanap? | `weekly-rhythm.md` | medium | open |
| Q-weekly-2 | `tera-check` (kedd+csü) — naptári vagy munkanap? | `weekly-rhythm.md` | medium | open |
| Q-weekly-3 | `food-order` (csü deadline) — naptári vagy munkanap? | `weekly-rhythm.md` | medium | open |
| Q-weekly-4 | Script ami a "logikai" napokat számolja (naptári + szabadság + munkaszüneti + event-input)? | `weekly-rhythm.md` | low | open |

### AA) Development Agent kérdései 💻❓

> A Dev Agent által felvetett kérdések (autonóm üzemben). Új sorokat
> a `open-question-add` handler ad hozzá (Phase 2). A chat (#5) hetente
> végigjárja.

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-package-1 | `pnpm approve-builds` egy gépenként user-state — repo-szinten reprodukálható-e? Workspace-szintű `pnpm-workspace.yaml` `onlyBuiltDependencies` segíthet? | cycle 3, cli protobufjs build-script approval | m | answered |
| Q-package-2 | `@futdevpro/ngx-dynamo-models@1.15.8` 404 az npm registry-n. Master-prompter is használja — privát publikálva? lokál tgz csak? Honnan installálható a my-assistant server/-en? | cycle 3, server `pnpm test` blocker | h | answered 2026-05-13: nem registry-issue — rossz token volt a projekt-szintű `.npmrc`-ben (felülírta a globált, 401 → privát scope 404-ként látszott). User törölte, `npm whoami` → `itharen` ✅, csomag elérhető. Token-rotation task: `org:task:6a049f19d440d3f484cee052` (due 2026-06-05). |
| Q-ldp-1 | A `dc ldp` képes-e a `pipeline.config.json` config-reload-ra futás közben, vagy minden config-change után manuális restart kell? Ha igen, hogyan? | cycle 6, watch coverage bővítés után stale state | m | open |

### Z) 2.5-agent rendszer 🤖🤖

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-2agent-1 | Dev-agent tick-frekvencia (event/cron/user)? | `two-agent-system.plan.md` | high | open |
| Q-2agent-2 | Dev-agent tier-rendszer (mit önállóan vs user-OK)? | `two-agent-system.plan.md` | high | open |
| Q-2agent-3 | Két agent összehangolt (build-trigger vs notify)? | `two-agent-system.plan.md` | medium | open |
| Q-2agent-4 | Chat session triggereli az agent-ticket vagy csak observer? | `two-agent-system.plan.md` | medium | open |
| Q-2agent-5 | Shared state szabályok (file-lock / ütközés)? | `two-agent-system.plan.md` | medium | open |
| Q-2agent-6 | Worker-agent külön agent vagy dev-agent sub-feladat? | `two-agent-system.plan.md` + `worker-agent-cronjob.md` | high | open |

### X) CCAP-CLI integráció 🔌

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-ccap-cli-1 | Mikor érkezik az eszköz? | `ccap-cli-integration.md` | medium | open |
| Q-ccap-cli-2 | Milyen parancsok várhatóak (subcommand-tree)? | `ccap-cli-integration.md` | medium | open |
| Q-ccap-cli-3 | Auth (lokál bearer / OAuth / nincs)? | `ccap-cli-integration.md` | medium | open |
| Q-ccap-cli-4 | Leírás-generátor formátuma (md/JSON/OpenAPI)? | `ccap-cli-integration.md` | low | open |

### Y) Worker-agent + kanban 🧑‍💻

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-worker-1 | Összeolvasszuk a B-mode plan-vel, vagy külön? | `worker-agent-cronjob.md` | high | open |
| Q-worker-2 | Worker-agent ki futtatja (CCAP / lokál / saját)? | `worker-agent-cronjob.md` | high | open |
| Q-worker-3 | Drag-and-drop pontos viselkedés? | `worker-agent-cronjob.md` | medium | open |
| Q-worker-4 | Plan-approval: minden task / csak Tier 2+? | `worker-agent-cronjob.md` | medium | open |
| Q-worker-5 | Tier-rendszerbe illeszkedés? | `worker-agent-cronjob.md` | medium | open |
| Q-worker-6 | Organizer task-rendszerhez kapcsolódás? | `worker-agent-cronjob.md` | medium | open |

### W) Review tool rollout 🔍

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-review-1 | Mit jelent "100%-osan kifaszázva"? Mi hiányzik a review toolból? | `review-tool-rollout.md` | high | open |
| Q-review-2 | Integráció módja (CLI / pre-commit / CI / pipeline step)? | `review-tool-rollout.md` | high | open |
| Q-review-3 | Milyen pattern-eket ellenőriz (FDP / saját)? | `review-tool-rollout.md` | medium | open |
| Q-review-4 | Rollout sorrend OK a javasolt módon? | `review-tool-rollout.md` | medium | open |
| Q-review-5 | Ki vezeti a roll-out-ot (CCAP / másik agent / user)? | `review-tool-rollout.md` | medium | open |
| Q-review-6 | Jelentés-formátum (action-log / PR-komment / Discord)? | `review-tool-rollout.md` | low | open |

### T) Email + Social media 📧

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-email-1 | Mely mail-fiók(ok)? itharen3@gmail.com / céges / több? | `email-integration.md` | medium | open |
| Q-email-2 | Read-only monitoring vs küldés is? | `email-integration.md` | medium | open |
| Q-email-3 | Szűrés-szabályok ki dönti (LLM / fix rules)? | `email-integration.md` | low | open |
| Q-social-1 | Mely platformok prioritásban (LinkedIn / Discord / X / FB)? | `social-media-integration.md` | medium | open |
| Q-social-2 | Read-only tracking vs scheduling? | `social-media-integration.md` | medium | open |
| Q-social-3 | "Tartalom out of scope" (LinkedIn) szabály változik? | `social-media-integration.md` | low | open |

### O) Tánc 💃

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-fit-tanc-1 | Tánc-stílus / preferencia? (egyedi / lépések / freestyle / zene-driven?) | `fit-system.md` | low | open |
| Q-fit-tanc-2 | Súlyzós tánc — milyen súlyok? (otthon megvannak vagy beszerzendő?) | `fit-system.md` | medium | open |
| Q-fit-tanc-3 | Tánc-tracking: csak "csináltad-e" / időtartam / szívritmus? | `fit-system.md` | low | open |
| Q-fit-tanc-4 | Tánc önmagában (otthon zenére) is opció, vagy csak séta-közben? | `fit-system.md` | low | open |

### DD) Socket + auto-version-update 🔌🔄

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-ver-1 | Melyik Dynamo CLI / package konkrétan? (`cli-dynamo` dc / `ngx-dynamo` client / `nts-dynamo` server / mind?) | `socket-and-version-sync.md` | high | open |
| Q-ver-2 | Reload UX: néma / banner+OK / countdown? | `socket-and-version-sync.md` | medium | open |
| Q-ver-3 | Status-bar: footer / header / collapsible? | `socket-and-version-sync.md` | low | open |
| Q-ver-4 | Build-hash inject: `dc cdp` step / pre-commit hook? | `socket-and-version-sync.md` | medium | open |
| Q-ver-5 | Socket-auth: meglévő `A_Auth` JWT / külön socket-token? | `socket-and-version-sync.md` | medium | open |
| Q-ver-6 | Reconnect-policy: exponential backoff default? max retry? | `socket-and-version-sync.md` | low | open |
| Q-ver-7 | Mely REST-endpointok migráljanak socket-re Phase 5-ben? | `socket-and-version-sync.md` | medium | open |
| Q-ver-8 | Verzió-mismatch policy: csak srv > cli, vagy fordítva is? | `socket-and-version-sync.md` | low | open |
| Q-ver-9 | LDP restart során a verzió változik? Dev vs prod UX? | `socket-and-version-sync.md` | medium | open |

### EE) Időjárás integráció 🌦️

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-weather-1 | Lokáció: csak Budapest, vagy több helyszín (utazáskor)? | `weather-integration.md` | medium | open |
| Q-weather-2 | Open-Meteo elég-e első körben, vagy az idokep "feeling"-je is kritérium? | `weather-integration.md` | high | open |
| Q-weather-3 | Alert-küszöbök: melyik OMSZ szintet hangosítsuk cast-en (csak orange+? csak red?)? | `weather-integration.md` | medium | open |
| Q-weather-4 | Ingest gyakoriság: 15 perc / 30 perc / 1 óra? | `weather-integration.md` | low | open |
| Q-weather-5 | History retention: 1 év / 3 év / végtelen? | `weather-integration.md` | low | open |
| Q-weather-6 | Dashboard widget vagy külön weather route? | `weather-integration.md` | low | open |

### FF) Szórakoztatási integráció 🎬🎮

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-ent-1 | Hol fut a Jellyfin? (lokál hálózat? remote? URL + auth?) | `entertainment-integration.md` | high | open |
| Q-ent-2 | Steam profile public, vagy authed (OAuth) flow szükséges? | `entertainment-integration.md` | high | open |
| Q-ent-3 | Webhook plugin (push) vagy polling (pull) Jellyfin felé? | `entertainment-integration.md` | medium | open |
| Q-ent-4 | Ingest gyakoriság: Jellyfin recent + Steam recent → óránként? | `entertainment-integration.md` | medium | open |
| Q-ent-5 | Library full-resync: napi / heti? | `entertainment-integration.md` | low | open |
| Q-ent-6 | `media-tracking.md` FR-rel összevonjuk a kliens-oldali UI-t (Jellyfin = library forrás)? | `entertainment-integration.md` | medium | open |
| Q-ent-7 | Steam achievements: dashboard kiemelt, vagy csak detail-view? | `entertainment-integration.md` | low | open |
| Q-ent-8 | Egyéb szórakoztatási forrás később (Plex / GOG / Epic / YouTube history)? | `entertainment-integration.md` | low | open |

### N) Élelmezés / food-tracking 🍽️

| Q# | Kérdés | Kontextus | Fontosság | Status |
|---|---|---|---|---|
| Q-food-1 | Hogyan trekeljük az étkezést **kézi log nélkül**? (wearable / activity-monitor / Google Home routine / egyéb?) | `food-tracking.md` (új FR) | high | open |
| Q-food-2 | Mit logoljunk: csak időpont, vagy mit/mennyit/hogyan is? | `food-tracking.md` | high | open |
| Q-food-3 | "Egészségtelen szokások" — konkrét mintázatok amiket ki akarunk küszöbölni (gyors-kaja / cukor / éhezés-csapongás)? | `food-tracking.md` | medium | open |
| Q-food-4 | "Mikor ettél utoljára" — emlékeztető-passzív mód: ha N óra óta nincs étkezés-event, kérdezzen rá az assistant? | `food-tracking.md` | medium | open |
| Q-food-5 | Étkezés utáni séta/edzés: szabály-szintű (mindig) vagy ajánlás (rugalmas)? | `recurring-tasks.md` + `fit-system.md` | medium | open |

---

## H) Kommunikációs csatorna + Assistant-tick 📡 (2026-09-06)

> Ezek a kérdések a Discord-csatorna és az óránkénti tick fejlesztése közben merültek fel.
> A chatben mindegyik elhangzott, a permanens hely ez a fájl.
> Terv: `__agent/plans/discord-two-way-hyperplan/` · szabályok:
> `__agent/flows/recurring/hourly-assistant-tick/README.md`

| ID | Kérdés | Kontextus / miért kell | Fontosság | Status |
|---|---|---|---|---|
| `Q-2026-09-06-01` | **Javítsam a `cli/src/interfood/interfood.api-client.ts` duplikált `getImageUrl` metódusát, vagy a másik session zárja le?** | Idegen, commitolatlan munka; a **teljes CLI-build bukik** miatta, ezért a tesztek csak kerülőúton futnak. | **h** | open |
| `Q-2026-09-06-02` | **Megtartsuk a „dátum nélküli, magas prioritású" rekeszt a státusz-kivonatban? Jó a P≥100 küszöb?** | Ez az **assistant kiegészítése**, nem owner-kérés. Azért kellett, mert a feladatok többségének nincs határideje, és nélküle a kivonat majdnem üres. | **m** | open |
| `Q-2026-09-06-03` | **Jó a 6 órás ismétlés-elnyomás?** (ugyanarról a tételről ennyi ideig nem szólunk újra) | Szintén **assistant-kiegészítés**. Enélkül egy lejárt feladat óránként újra kimenne és zajjá tenné a csatornát. | **m** | open |
| `Q-2026-09-06-04` | **Legyen külön „jó reggelt, ez történt éjjel" összegzés az ébredés pillanatában?** | Az éjszakai ág gyűjt; nyitott, hogy a csomag magától menjen-e ki ébredéskor. | **m** | open |
| `Q-2026-09-06-05` | **Mivel bővül még a tick ellenőrzés-listája?** (most: feladat/határidő, naptár, ismétlődők, alvás, készlet, kaja-fedettség) | A lista owner-rel közösen véglegesítendő. | **m** | open |
| `Q-2026-09-06-06` | **Telefonos jelenlet-visszajelzes — hogyan?** (2026-09-07: *„be kene tudjuk azonositani a telefonomat a halozaton…. Szerinted ez jo irany lehet?"*) | **ASSISTANT-VALASZ (2026-09-07): JO irany, de csak KIEGESZITO jelkent.** ⚠️ A telefon Wi-Fi-je alvo kepernyonel lekapcsol → eltunik a halozatrol, pedig itthon van. Ha ez FELULIRNA a gep-jelet, **rosszabb** lenne a mainal. Ezert: csak **hozzaad** magabiztossagot, sosem von le · hosszu tures („30 percen belul lattuk" = itthon) · azonositas fix DHCP-cim + ARP/ping. **A sor vegere javasolva** — a gep-jel most is mukodik. | **l** | open |
| `Q-2026-09-06-07` | **Mi számít éjszaka „valóban nem halasztható"-nak?** | A workflow szerint az éjszakai ág alapból gyűjt, de kivétel lehet. A kritérium nincs kimondva — **nem találom ki magamtól**. | **m** | open |

**Owner-műveletre váró tételek** (nem kérdés, hanem teendő — a `CONTINUATION.md` is viszi):
~~saját Discord-alkalmazás + bot-token~~ ✅ KÉSZ · ~~`install-autostart.ps1 -Mode apply`~~
✅ TÁRGYTALAN (a szervert a `PresenceMonitor_Service` viszi, 2026-09-06).

---

## I) Időbeosztás — a Schedule Guardian flow ⏰ (2026-09-07)

> A user kijelölte az **első számú asszisztensi területet**: az időbeosztás folyamatos
> segítését. A flow váza megvan (`__agent/flows/recurring/schedule-guardian/README.md`), de
> **a számoláshoz szükséges preferenciák nincsenek meg** — és ezeket ⛔ **nem találjuk ki**.
>
> Owner szó szerint: *„Lesznek majd különféle preferenciák, meg mit vigyek magammal, mire
> figyeljek oda mielőtt elkészülök, mennyi idő oda jutni, mikor kell elkezdjek készülődni,
> ugye itt lesz egy csomó szabály majd, preferenciák, meg mennyi idő alatt készülök el, stb."*

| ID | Kérdés | Miért blokkoló | Fontosság | Status |
|---|---|---|---|---|
| `Q-2026-09-07-I1` | **Mennyi idő alatt készülsz el?** Egységes szám, vagy esemény-típusonként más (otthoni hívás / bolt / hivatalos ügy / edzés / társasági)? | Enélkül nincs **készülődés-kezdés** — pedig ez a flow legfontosabb kimenete. | **h** | open |
| `Q-2026-09-07-I2` | **Mennyi ráhagyást akarsz?** Hány perccel érj oda korábban, és típusonként más-e? | Enélkül nincs indulási idő. | **h** | open |
| `Q-2026-09-07-I3` | **Hogyan közlekedsz alapból?** (tömegközlekedés / autó / gyalog / bringa) És mikor tér el ettől? | Enélkül nincs menetidő. | **h** | open |
| `Q-2026-09-07-I4` | **Milyen eszközzel nézzek utána útvonalnak/menetidőnek?** Van-e elfogadható **nem fizetős** megoldás? | `no-paid-solutions.md` miatt nem választhatok magamtól fizetős API-t. | **h** | open |
| `Q-2026-09-07-I5` | **Mit viszel magaddal?** Van-e alap-készlet, és mi jön hozzá esemény-típusonként? | Enélkül nincs „mit vigyek" checklist. | **m** | open |
| `Q-2026-09-07-I6` | **Mire kell figyelni indulás előtt?** (pl. vízcsap, ablak, töltő, kulcs) | Ez a te „mire figyeljek oda" pontod — a tartalmát csak te tudod. | **m** | open |
| `Q-2026-09-07-I7` | **Mennyivel korábban szóljak?** Csak a készülődés-kezdésnél, vagy legyen előjelzés is? | Ez a riasztás alakja. | **m** | open |
| `Q-2026-09-07-I8` | **Éjjel is szóljak** egy másnap kora reggeli eseményről, vagy csak ébredés után? | Ütközik az alvás-ciklussal (`sleep-system.md`). | **m** | open |

---

## L) Több session / több agent 🔀 (2026-09-07)

> Owner: *„mennyire tűri jelenleg a rendszer azt, hogy össze-vissza különféle sessionökből
> beszélgessek veled. Gondoltam rá, hogy egy Codex sessionből is megpróbálnálak…"*
> Mérés + részletek: `__documentations/dev/MULTI_SESSION.md`

| ID | Kérdés | Miért kell | Fontosság | Status |
|---|---|---|---|---|
| `Q-2026-09-07-L1` | **Megépítsem a címke-alapú session-feloldást?** *(konfigba `label: "My Assistant"`, a `ccs-…` helyett)* | 🔴 Enélkül a Discord-kézbesítés attól függ, KI indította az LDP-t. Ha te indítod egy sima terminálból, elbukik. | **h** | open |
| `Q-2026-09-07-L2` | **Ha több CC session fut, melyik „az" asszisztens?** A címke dönt — de mi legyen, ha kettőnek is ugyanaz a címkéje? | ütközés-feloldás kell, különben véletlenszerű, melyikbe megy az üzenet | **m** | open |
| `Q-2026-09-07-L3` | **Codex is írhat Discordra?** *(`ma comm say`-jel technikailag tud)* Ha igen, jelölje-e meg magát, hogy tudd, melyikünk írt? | különben nem tudod, kivel beszélsz | **m** | open |
| `Q-2026-09-07-L4` | **Kell-e zárolás a közös állapot-fájlokra?** *(`STATUS.md`, `CONTINUATION.md`)* Vagy elég a „egyszerre egy agent írjon" megállapodás? | párhuzamos írásnál csendes felülírás a kockázat | **m** | open |
| `Q-2026-09-07-L6` | **Megépítsem a `ma brief`-et?** *(egyetlen generált állapot-kép minden sessionnek: mi történt, mi nyitott, mi a csatorna-állapot, ki dolgozik)* | Ez az owner „SSOT infótár" kérése — de **generált nézetként**, nem új kézi fájlként, hogy ne legyen negyedik igazság. Terv: `__documentations/dev/SSOT_STATE_SYNC.md` | **h** | open |
| `Q-2026-09-07-L7` | **Megépítsem a session-regisztert?** *(ki aktív most: CC / Codex / cron)* | Enélkül a `brief` nem tudja megmondani, dolgozik-e más agent — és két agent egymásra ír | **h** | open |
| `Q-2026-09-07-L5` | **Ébredés-küszöb:** hány óra tétlenség után számítson „aludtam"-nak? *(az én javaslatom 3 óra — nem a te adatod)* | ez indítja a napindítást; rossz küszöbnél vagy elmarad, vagy fölöslegesen fut | **m** | open |

---

## K) Üzenet-kézbesítés megbízhatósága 📮 (2026-09-07)

> Owner: *„az üzeneteid nem mindig jutnak el hozzám, illetve lehet, hogy el-elúsznak, amit
> nekem szánsz info. Ez még a Discordon is előfordulhat, de Discordot fogom legjobban
> figyelni. első körben, amíg nincsen egyéb saját megoldás."*
> Elv: `current/principles/message-delivery-reliability.md`

| ID | Kérdés | Miért kell | Fontosság | Status |
|---|---|---|---|---|
| `Q-2026-09-07-K1` | **Mi számít „fontos, nyugtázandó" üzenetnek?** Minden? Csak a határidős/cselekvést igénylő? | Ha mindent nyugtáztatok, az zaj lesz; ha semmit, marad a mostani helyzet. | **h** | open |
| `Q-2026-09-07-K2` | **Mennyi idő után ismételjek meg egy nyugtázatlan üzenetet?** És hányszor? | Enélkül vagy tolakodó vagyok, vagy hatástalan. | **h** | open |
| `Q-2026-09-07-K3` | **Mi legyen a nyugta formája?** Reakció-emoji a Discordon (legkisebb súrlódás), válasz, vagy elég a megnyitás? | Ez dönti el, mit tudok egyáltalán mérni. | **h** | open |
| `Q-2026-09-07-K4` | **Hova kerüljön a POSTALÁDA?** Discord pinned üzenet · a My Assistant kliens egy felülete · fájl · organizer? | Ez a „nem tud elúszni" fele — a helye meghatározza, mennyire kézenfekvő átnézni. | **h** | open |
| `Q-2026-09-07-K5` | **Mi legyen a saját megoldás iránya?** Telefonos push (ntfy vagy saját app), e-mail, vagy a kliens? | Owner: *„amíg nincsen egyéb saját megoldás"* — tehát ez cél, nem opció. | **m** | open |
| `Q-2026-09-07-K6` | **Ha nem vagy elérhető és sürgős:** meddig várjak, mielőtt eszkalálok (hangszóró / ismétlés)? | Az esemény-riasztásnál (`schedule-guardian`) ez éles kérdés lesz. | **m** | open |

---

## J) Az asszisztens szerepe és képességei 🤖 (2026-09-07)

> A képesség-katalógus (`__agent/capabilities/CATALOG.md`) minden sora **jóváhagyásra vár**
> — owner: *„azokat majd apróvolom még, hogy elfogadhatók-e. szépen sorba vesszük."*

| ID | Kérdés | Miért kell | Fontosság | Status |
|---|---|---|---|---|
| `Q-2026-09-07-J1` | **A `⏳` képességek közül melyek lépnek `✅`-be?** (C-10…C-20 — státusz-kivonat, tick, hangszóró, feladatok, napló, Interfood, LinkedIn, bevásárlás, hónapzárás, alvás, fit/health) | Amíg `⏳`, minden használat előtt kérdeznem kell — ez lassít. | **h** | open |
| `Q-2026-09-07-J2` | **Melyik jóváhagyott képesség futhat ÜRESJÁRATBAN**, amikor nem vagy itt? | A proaktív sáv addig üres, amíg ez nincs eldöntve. | **h** | open |
| `Q-2026-09-07-J3` | **Az orkesztráció (feladat átadása másoknak) mikor és milyen keretben legyen megbeszélve?** | Owner: *„az egyelőre még nem approve-olt"* — addig nem delegálok. | **m** | open |
| `Q-2026-09-07-J4` | **Mi számít „nem vagyok elérhető"-nek?** Elég a gép-inaktivitás, vagy legyen külön „ne zavarj" jelzés? | Ez kapcsolja be az üresjárati sávot — rossz küszöbnél vagy zavarlak, vagy sosem dolgozom. | **m** | open |

---

## M) Fejlesztői / üzemeltetési kérdések 🛠️ (2026-09-07)

| ID | Kérdés | Miért kell | Fontosság | Status |
|---|---|---|---|---|
| `Q-2026-09-07-M1` | ~~Javitsam-e a `startup-test` lepest?~~ | ✅ **LEZARVA, MEGCSINALVA** (2026-09-07 09:45) — az owner uj szabalya (*„Sose egyeztess ha egyertelmu javitasi vagy improvement feladat van. Csinald meg."*) pont erre az esetre vonatkozik. `tsx` -> `npx tsx`; a lepes most **8 teszt / 0 bukas**. | — | **answered** |
| `Q-2026-09-07-M2` | **A C-42/C-43 (küldés-visszaolvasás, `--file`) a BASELINE-hoz tartozik, vagy külön képesség?** A kommunikáció baseline — ezek annak a megbízhatóságát adják. | Ha baseline, nem kell rájuk jóváhagyás, és ki is vehetők a katalógusból. | **l** | open |
| `Q-2026-09-07-M3` | **Az `interfood.api-client.ts` duplikált `getImageUrl`-jét összefésültem** (különben a teljes CLI-build bukott). ⚠️ **Idegen, félkész munka**, commitolatlan. Bemehet a commitba, vagy a másik session zárja le? | Amíg lóg, minden commitomban ott van egy idegen változás. | **m** | open |

---

## N) Telefon-helyzet — hogyan tudjuk meg, hol vagy? 📍 (2026-09-07)

> **Owner, 2026-09-07 09:38:** *„Óh.... Most jövök rá h lehet megzavartam a jelenlét
> figyelést távvezérléssel... Nem lenne rossz ha le tudnád kérni a telefonom location-jét..."*

**Amit MÁR megoldottam ehhez (nem kérdés):** a **távvezérlés-szűrő** kész — a RustDesk
munkamenet-naplójából felismerem, ha a bevitel távoli volt, és olyankor a jelenlét
`unknown`, nem `yes`. *(Mérve: a 09:15:33-as „aktív" minta a 09:15:27–09:23:10 közötti
távoli munkamenetbe esik.)*

**Amit MÉRTEM a hálózatról** *(passzív ARP-olvasás, ⛔ nem szkenneltem)*: a hálózat
`200.33.0.0/24`, **25 szomszéddal** — ez **osztott/házas hálózatnak** néz ki, nem kis
otthoni LAN-nak. Ez érdemben befolyásolja a választást.

| ID | Kérdés | Miért kell | Fontosság | Status |
|---|---|---|---|---|
| `Q-2026-09-07-N1` | **Melyik utat választod?** ⭐ **Ajánlásom: OwnTracks (FOSS) → a MI szerverünk.** A telefon egy nyílt forrású appból küldi a helyzetet a saját végpontunkra — nincs harmadik fél, nincs fiók, nincs költség, és **valódi helyzetet** ad, nem csak „itthon/nem itthon"-t. Illeszkedik a `build-it-ourselves` + `no-paid-solutions` elvekhez. | Ez dönti el, mit építek. | **h** | open |
| `Q-2026-09-07-N2` | **Alternatíva: LAN-jelenlét** (rajta van-e a telefon a hálózaton). Olcsóbb, app nélkül megy — DE: ⚠️ **osztott hálózat** (25 eszköz), az Android **MAC-et randomizál**, és alvó WiFi-nél „eltűnik" ⇒ *„itthon"* jelre használható, *„nincs itthon"* jelre **megbízhatatlan**. Kell-e másodlagos jelnek? | Kiegészítheti az N1-et, de önmagában gyenge. | **m** | open |
| `Q-2026-09-07-N3` | Ha az N1-et választod: **melyik eszköz a telefonod** a hálózaton, illetve milyen néven fusson az OwnTracks-azonosító? | Enélkül nem tudom megkülönböztetni a többi eszköztől. | **m** | open |
| `Q-2026-09-07-N4` | **Milyen pontosság kell?** Elég a *„otthon / úton / máshol"*, vagy valódi koordináta? És **milyen sűrűn** — a gyakori GPS **eszi az akkut**. | A pontosság ára az akku; ezt te döntöd el. | **m** | open |
| `Q-2026-09-07-N5` | ⛔ **Adatvédelmi határ:** a helyzet-adat **hol tárolódjon**, és **meddig**? Javaslatom: a saját gépen, a `current/`-en KÍVÜL, és **csak a legutóbbi állapot**, nem teljes útvonal-történet. | A helyzet-előzmény a legérzékenyebb adat, amit valaha kezelnék. | **h** | open |

⛔ **Amit NEM javaslok:** Google Find My Device / Maps-helymegosztás lekérdezése. Külső
szolgáltatás + fiók-hozzáférés, törékeny, és ellentmond a `build-it-ourselves` elvnek.

### ✅ VÁLASZOK (owner, 2026-09-07 10:24)

> *„Jól hangzik az owntracks.. nemtom mennyi időbként... Legyen állítható és majd
> finomhangoljuk. Hol tárold...? Db-ben? Meddig? Nem is tudom... Maradhat hosszabb távon is
> ami hasznos... Pl amikor nem otthon... Az otthonit meg fölösleges tárolni."*

| ID | Státusz | A döntés |
|---|---|---|
| `N1` | ✅ **answered** | **OwnTracks** — *„Jól hangzik az owntracks"* |
| `N2` | ⚪ **dropped** | A LAN-jelenlét elesik: az N1 megoldja, és a hálózat úgyis osztott (25 eszköz) |
| `N3` | ⚪ **dropped** | Az OwnTracks saját azonosítót használ — nem kell a hálózaton beazonosítani a telefont |
| `N4` | ✅ **answered** | A gyakoriság **ÁLLÍTHATÓ**, nem beégetett; a finomhangolás később, méréssel *(GPS ↔ akku)* |
| `N5` | ✅ **answered** | 🏠 **otthon → NEM tároljuk a koordinátát** · 🚶 **nem-otthon → tárolható hosszabb távon is**. Kanonikus: `current/principles/location-retention.md` |

⭐ **Az N5-ös válasz adatvédelmi szempontból is a jó irány, és magától adódott:** a
leggyakoribb és legérzékenyebb pont (az otthon) az, amiből a **legkevesebb** információ
származik — a szűkítés itt **egybeesik** a hasznossággal, nem ütközik vele.

⏳ **Ami még nyitva:** a pontos tárolási hely (db vagy fájl) — ezt az owner rám bízta
*(„Nem is tudom...")*, tehát assistant-döntés, a fenti korlátokon **belül**. Illetve hogy
mekkora sugár számít „otthonnak" — ez **mérendő**, nem tippelendő.


---

## V) A voice control ÁTEMELÉSE — 2026-09-07

> **Owner (hangüzenetben, 12:37):** *„a régi CCAP-ból átemeljük a teljes voice communication
> megoldást. Ezt nagyon szeretném még előbb látni."*

Terv: `__agent/plans/voice-control-transplant/hyperplan.plan.md` · feladat: **T-22**

| ID | Kérdés | Fontosság | Miért kell a válasz |
|---|---|---|---|
| `V1` | 🔵 **Melyik Discord hang-csatorna** legyen a „fülem"? | `m` | belépési pont nélkül nem tud csatlakozni |
| `V2` | 🔵 **Mindig bent üljön**, vagy csak hívásra csatlakozzon? | `m` | a folyamatos jelenlét sávszélességet és CPU-t eszik — és a RAM már ma is szűkös |
| `V3` | 🔵 ⭐ **Kell most a beszéd KIFELÉ is** *(`voice-output`)*, vagy először elég, hogy **hallak**? | `h` | **~2 600 sorral** rövidítené az első működő változatot |

⚠️ **Egyik sem blokkolja** a 2. szakaszt (függőségek) — az a válaszoktól függetlenül halad.

📌 A `V3` a legfontosabb: ez **a szállítmány méretét** dönti el, nem csak egy beállítást.

### ✅ V1–V3 MEGVÁLASZOLVA — 2026-09-07 13:43

> **Owner, SZÓ SZERINT:** *„A voice-hoz: server: 1467012131378434151 channel:
> 1489036734632034496 mindig ülj bent amikor megy a my assistant. Jó lenne a beszédes rész is
> beemelni de másik voice id val kell majd menj és ha hazaértem tudok elevenlabs kulcsot adni."*

| ID | Válasz |
|---|---|
| `V1` | ✅ **szerver** `1467012131378434151` · **csatorna** `1489036734632034496` |
| `V2` | ✅ **Mindig bent ülök**, amíg a my-assistant fut — nem hívásra csatlakozom |
| `V3` | ✅ **A `voice-output` IS kell** ⇒ a szállítmány a **teljes 11 251 sor**, nem szűkíthető |

⚠️ **Két új, ebből fakadó tétel:**
- 🔑 **Külön voice id** kell a kimenő beszédhez — *„másik voice id val kell majd menj"*
- 🙋 **ElevenLabs-kulcs**: az owner adja, ha hazaért. ⛔ Én **nem javasoltam** fizetős
  szolgáltatást *(`no-paid-solutions`)* — ez **az ő döntése**, és csak a **kimenő beszéd**
  minőségét érinti. A **felismerés** marad a helyi FDP AI-n, kulcs nélkül.

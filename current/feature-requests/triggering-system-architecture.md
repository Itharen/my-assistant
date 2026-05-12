# FR: 3-session triggering rendszer architektúra

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Ez egy **fundamentum-szintű
> architektúra-kérés** — alapos átgondolás kell.

## 2026-05-07 — initial deklaráció

> illetve ki kéne alakítsunk úgy egy stabil triggering rendszert, hogy két
> külön sessionben fogok dolgozni, az egyik sessionben időszerű triggereket
> küldünk, mondjuk óránként, és az intelligenc módon nézi meg a státuszokat
> és a jelenlegi helyzetet, valamint intelligens módon állít be
> emlékeztetőket, üzenetküldéseket, stb. Szeretnék egy scriptelt
> triggeringet, scriptelt automatizmust is, ami scriptelve fogja frissíteni
> a megfelelő dolgokat, és lesz egy harmadik, ami egy session, ez amiben
> most itt beszélgetünk, és ebben a sessionben pedig egy élő folyamat lesz,
> ami viszont változhat annak függvényében, hogy közben mi minden érkezik
> a monitoring eszközeinken keresztül például, vagy az intelligent, a
> scripted, a google rendszerünkön keresztül. Most ezt valahogy úgy kéne
> jól balanszolni, hogy ez az élőbeszélgetésünk, ide fogok érinputokat
> küldeni, még ide fogok reagálni arra, hogyha valamilyen értesítést kapok
> például a Google Home-on keresztül. De az is lehet, hogy hosszú ideig
> mondjuk akár egy napon keresztül, Nem reagálok ide semmit, hanem csak
> csinálom a dolgaimat, közben mennek a monitoring-ok, mennek az
> automatizmusok. Szóval... Ezt valahogy jó alaposan meg kéne álmodni,
> hogy ez hogy lesz jó, hogy lesz az effektív szemben mindennel, amit
> eddig kértem.
>
> illetve ez a kombinált rendszerünk kéne alkalmas legyen arra is, hogy
> mondjuk az intelligenc vagy a user interakciós folyamatunk beállítson
> egy triggering időpontolt, amikor aztán a Google Home-on keresztül küld
> egy üzenetet. De ugye itt nagyon oda kell figyeljünk arra, hogy ez a
> rendszer folyamatosan újraindulhat, illetve lehet, hogy simán egyszerűen
> csak elaltatjuk és aztán nem indítjuk el, ezért nem fog triggerelni,
> szóval itt valahogy nagyon alaposan jól átgondoltam ki kéne alakítani
> egy olyan rendszert, amiben biztosra mehetünk abban, hogy mindenképpen
> triggerelni fog amikor kell.

---

## Strukturált összefoglaló (assistant)

### A 3 session-szerep

| Session | Szerep | Trigger | Feladat |
|---|---|---|---|
| **A) Intelligens periodikus** | óránként fut (cron-szerű) | időzítő | státuszt nézi, emlékeztetőt állít, üzenetet küld Google Home-on |
| **B) Scripted automatizmus** | folyamatos | event / cron | "buta" frissítések — file-syncek, recurring-rule-okat felvet, log-rotálás |
| **C) Élő beszélgetés** | most ez | user-trigger | reaktív, dinamikus, kontextus-érzékeny |

### Balansz-elv

- Az **A-B** mehet a háttérben **akár napokig** user-input nélkül
- A **C** (ez itt) egy "vendég" — ha aktív, látja az A-B kimeneteit;
  ha inaktív, az A-B **önállóan** futnak tovább
- **A B-A-C nem egy állandó futó folyamat**, hanem **eseményvezérelt**:
  - A: óránként ébred (cron)
  - B: trigger-eseményre vagy intervallumra
  - C: user input vagy push notification a Google Home-tól

### Reliability-követelmény (KRITIKUS)

> "ez a rendszer folyamatosan újraindulhat, illetve lehet, hogy simán
> egyszerűen csak elaltatjuk és aztán nem indítjuk el, ezért nem fog
> triggerelni"

Tehát kell:
- **Persistent scheduler** — nem in-memory cron, hanem disk-perzisztált
  job-state
- **Self-healing**: gép-restart után automatikusan rajt (Windows Task Scheduler
  AtLogon → already pattern, lásd activity-monitor README)
- **Missed-job recovery**: ha N órára aludt a gép és a 02:00-as trigger
  elmaradt, **be lehessen pótolni** ébredéskor (vagy elhagyni, kontextus-függő)
- **Failure-safe trigger storage**: a beállított Google Home triggerek külön
  perzisztált queue-ban, hogy restart után is feldolgozódjanak

### Megoldás-architektúra (vázlat)

```
                ┌──────────────────────┐
                │  shared state files  │
                │   __agent/state/     │
                └──────────┬───────────┘
                           │ read/write
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────┴────┐      ┌──────┴──────┐    ┌──────┴──────┐
   │ A) hour │      │ B) cron job │    │ C) chat     │
   │ session │      │ runner      │    │ session     │
   └────┬────┘      └──────┬──────┘    └──────┬──────┘
        │                  │                  │
        │            ┌─────┴──────┐           │
        └───────────►│ trigger    │◄──────────┘
                     │ queue      │
                     └─────┬──────┘
                           │ consume
                     ┌─────┴──────┐
                     │ cast-      │
                     │ notifier   │ ← Google Home / push
                     └────────────┘
```

### Konkurencia-aggályok

- A 3 session **ugyanazokat** a state-fájlokat olvashatja/írhatja
- File-locking (egyszerű) vagy state-server (komolyabb)?
- **Eldöntendő** később.

### Reliability-pattern

- **Watchdog** script egy ötödik csendes folyamatban, ami N percenként
  health-check: él-e A, B? Indítsa újra ha nem
- **Heartbeat** mező a state-fájlokban, hogy lássuk meddig futott valami
- **Boot-script** Windows-on (Task Scheduler) — minden booton induljon

## Implementáció — phase-elés

| Phase | Mit | Mikor |
|---|---|---|
| 0 | most: ez az FR | ✅ kész |
| 1 | shared state design + cast-notifier Phase 2 (Spotify resume) | közeljövő |
| 2 | A) hour-session: cron + Claude SDK call | mid |
| 3 | B) scripted automatizmus: PowerShell / Node cron | mid |
| 4 | Trigger queue + reliability (heartbeat, watchdog) | mid-late |
| 5 | Sleep-aware integration | sleep-monitor FR után |

---

## Implementáció-státusz (2026-05-08)

✅ **A-mode MVP shipped** (file-fallback): `scripts/agent-handlers/` + entry-point `__agent/triggers/A-mode-entrypoint.md`

✅ **Server-app megépítve** — a tick-engine bekerült `server/src/_modules/tick-engine/`-be
(validate → tier-gate → dispatch). Hand-off megtörtént.

🟡 **B-mode (scripted automatizmus)** — plan v1 készen `__agent/plans/B-mode-scripted-automation.plan.md`,
NEM épült. Várja az A-mode tanulságait + a 4 open Q (Q-bmode-1..4) válaszát.

🟡 **A-mode → server integráció** — a CCAP-tick most a file-dispatchert hívja,
átállítható lesz a `POST /tick` endpoint-ra (Phase 2).

Lásd átfogó kontextus: `current/architecture.md` L5 (Agent runtime).

## Open kérdések

Új kategória — lásd `open-questions.md` "S) Triggering architecture".

---

## 2026-05-08 hajnal — A) intelligens periodikus agent kétmódusú design

> **Forrás: a user szövege.**
>
> Az automatikus triggering AI-os workflow, ami mindig egy agentet fog
> triggerelni, hogy nézze meg, hogy kell-e valamit állítani, szólni, vagy
> valami. az egyúttal dolgozhatna és felvehetne feladatokat, fejlesztési
> ötleteket, hogyha van valamilyen kész elfogadott plan, fejlesztési plan,
> akkor arra ráugorjon a workflow szerint, miután elvégezte a feladatát.

### Kétmódusú agent

| Mode | Mit csinál | Költség |
|---|---|---|
| **A) Health-check** | állapot-check, urgens dolog detektálás, notify / state-update | olcsó (~500-1000 token) |
| **B) Idle-mode work** | engedélyezett plan-okon dolgozik amíg a queue-ban van | drága (változó) |

### Workflow vázlat

```
hourly cron tick
   ├── [A] olvas: STATUS, action-log tail-100, USER_INPUT, recurring,
   │              calendar, sleep-state
   ├── van urgens? → notify/state/USER_INPUT[NEW]/task-create → STOP
   ├── van engedélyezett plan? → [B] plan-step execute → STOP
   └── nincs dolga → action-log "tick - semmi" → STOP
```

### Új open kérdések (a S) kategória mellé)

| # | Kérdés |
|---|---|
| Q-trig-7 | **Költség-keret**: USD/nap hard cap + óránkénti hívás-szám max? |
| Q-trig-8 | **Plan-approval gate**: mi minősül "elfogadott plan"-nek? User explicit ✅ kell, vagy elég ha a `plans/` mappában van? Az utóbbi kockázatos. |
| Q-trig-9 | **Action-scope tier-ek**: mit tehet önállóan (action-log, javaslat, task create) vs mihez kell user-OK (commit, push, külső API, file-rewrite, fizetős hívás)? |
| Q-trig-10 | **Sleep-aware integráció**: A-mode is felfüggesztve alvás alatt, vagy csak a notify-rész? |
| Q-trig-11 | **Hol fut**: Windows lokál Task Scheduler? Cloud / Claude Agent API? Saját node cron? |
| Q-trig-12 | **Loop-safety**: iteration-cap per cycle (nehogy az agent saját maga új taskot termeljen és arra ráugorjon végtelenül)? |

### Implementáció — javasolt sorrend

1. **Holnap (vagy vasárnap)**: plan-fájl (`__agent/plans/triggering-A-agent.plan.md`) — a 12 nyitott kérdés (Q-trig-1..12) eldöntése MVP-scope-ban
2. **Phase 1**: shared state design (`__agent/state/`) + lokál cron
3. **Phase 2**: A-mode Claude SDK call-lal, **csak action-log + javaslat** (no autonomous actions)
4. **Phase 3**: B-mode (idle work), szigorú plan-approval gate
5. **Phase 4**: sleep-aware integráció + watchdog

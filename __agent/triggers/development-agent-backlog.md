# Development Agent — backlog

> A Dev Agent ezt a fájlt olvassa az aktív FR-ek priorítás-sorrendjéhez.
> A táblázat felül = magasabb prio.
>
> Karbantartja: a chat (#5, én). User-iránymutatás után frissítem.

---

## 💰 USER MVP-DIREKTÍVA (2026-05-29)

> User explicit MVP-feladatok (MVP = pénzkeresés-fókusz, `mvp-focus.md`). Szó szerint:
> *"MVP tasks: RAG for dev agents (1: rules, 2: patterns, 3: codebase, 4: dataflows) / Organizer Tasks Screen Updates"*

| # | Task | Hova köt | Status |
|---|---|---|---|
| MVP-1 | **RAG for dev agents** — 4 réteg: 1) rules, 2) patterns, 3) codebase, 4) dataflows | **#7g** `rag-context-injection.md` (4-rétegű spec felvéve 2026-05-29) | 🟡→MVP-kandidátus; CCAP RAG endpoint MVP a blokkoló (Phase 1 dep) |
| MVP-2 | **Organizer Tasks Screen Updates** | 🚫 **NEM Dev Agent scope** (`Q-2026-05-29-01` answered): az organizer a user saját fejlesztése → a tasks-screen a **user feladata**. CLAUDE.md: itt csak `fo`-fogyasztók vagyunk. | ❌ Dev Agent ne vegye fel. User-owned task (tracking: ld. `mvp-focus.md`). |

---

## 🟢 Most-fókusz (első fejlesztési kör)

> **Grooming cycle 61 (2026-05-16 09:45):** Két nagy FR funkcionálisan zárva ma:
> - **FR #3b-WAVE-UI** — Phase 2.A/2.B/2.C/3.A/3.B/4.A/4.B ALL shipped (cycle 52-56, ~1100 LOC).
>   Phase 5a-d (chart bővítés) AGB-2026-05-16-04 alatt — külön green-light kell.
> - **FR #3f socket-and-version-sync** — Phase 1/2.A/2.B/3.A/3.B/4.A/4.B ALL shipped
>   (cycle 57-60, 1147 LOC). Phase 5 (REST→socket migration) + Phase 6 (build-pipeline)
>   külön green-light kell.
>
> **Korábbi (cycle 50 megmarad referenciaként):** FR #3b runtime-error-api
> server-side mind shipped (Phase 1+2+3+4+4b+5a, cycle 19-48). Phase 5b
> workflow-doc módosítás chat-OK-ra vár.

| # | FR | Path | Cél | Status |
|---|---|---|---|---|
| 1 | **Communication forms (3 csatorna)** | `current/feature-requests/communication-forms.md` | `ccap-notify` + `notify-cast` shell-out + throttle | Phase 1+2+4 ✅ (cycle 24/29/30); Phase 3 chat |
| 2 | **Automatic status recording** | `current/feature-requests/automatic-status-recording.md` | `fr-status-change` + `plan-step-mark-done` handler | Phase 1 ✅ (cycle 31); Phase 2-4 nyitva |
| 3 | **Dev Agent Phase 1 self-bootstrap** | `__agent/plans/development-agent.plan.md` | dispatcher `agent` mező + per-agent state routing | Phase 1+1.5+2 ✅ (cycle 33/34, +retroaktív 31); Phase 3 CCAP, Phase 4 server |
| 3b | **Runtime error API — Dynamo Logs Service bevezetés** | `current/feature-requests/runtime-error-api.md` | server-side error-tracking + REST endpoint a Dev Agent audit-fázisához | Phase 1+2+3+4+4b+5a **✅ shipped** (cycle 19-48); Phase 5b workflow-doc chat-OK vár |
| 3b-UI-DIAG | **Maya UI láthatóság diagnózis** (kapcsolódó akut) | (lent diary 2026-05-16) | "felületen szar se jelenik, hibákat dobál, nem rögzíti" — server smoke + client console + endpoint-térkép | **✅ shipped cycle 44** (AGB-2026-05-16-03 findings) |
| 3b-WAVE-UI | **Hullám-panel UI — látás + kezelés** | `current/feature-requests/wave-panel-ui.md` | timeline + új snapshot form + trend chart + holdfázis overlay | Phase 2-3-4 ✅ shipped (cycle 51-56); Phase 5a-d (AGB-04) + Phase 6 holdfázis külön green-light vár |
| 3c | **IoT integráció — Google Home routine wake/sleep events** | `current/feature-requests/iot-integration-google-home-routine.md` | "Jó reggelt"/"Jó éjt" routine → server REST → sleep-state forrás | 🟢 server-zone, chat Phase 5-6 ütközés |
| 3d | **Tasks aggregated dashboard view (client/ + server/)** | `current/feature-requests/tasks-dashboard-aggregated-view.md` | aggregátor + UI + interaktív jelölgetés (✅/⏸/🚫/💬) | 🟢 server+client, chat Phase 5-6 ütközés |
| 3e | **Action-log mint CLI command (A+B+sync)** | `current/feature-requests/action-log-cli-command.md` | `ma action-log emit/sync/list` — PS hook thin wrapper | Phase 1+2 ✅ (cycle 25); Phase 3-6 server-side green-light vár |
| 3f | **Socket-rendszer + auto-version-update + verzió-info bar** | `current/feature-requests/socket-and-version-sync.md` | WS server↔client + szerver-verzió változás → kliens auto-reload + verzió-info bar UI + LDP version-bump step | Phase 1-4 ✅ shipped (cycle 57-60, 1147 LOC); Phase 5 (REST→socket) + Phase 6 (build-pipeline) külön green-light vár |
| 3g | **User I/O + Dev Agent I/O + Reports panelek** | `current/feature-requests/agent-io-panels.md` | 3 új panel a kliensen: agent-kommunikáció + status-board | 🟢 **USER PRIO 2026-05-16** (AGB-2026-05-16-24) — magas, AGB-20 auth fix után |
| 3h | **Activity-monitor always-on + change-emit + device-integration** | `current/feature-requests/activity-tracking.md` (2026-05-17 kibővítés) | folyamatos loop, csak Δ-ra event; Google Fit / GPS / lépés bekötés health-tracking-hez | 🟢 **USER PRIO 2026-05-17** (AGB-2026-05-17-01) |

---

## 🟡 Második hullám (autonómia-bővítés)

| # | FR | Path |
|---|---|---|
| 4 | Triggering system architecture (server-side) | `current/feature-requests/triggering-system-architecture.md` |
| 5 | Sleep-aware notifications | `current/feature-requests/sleep-aware-notifications.md` |
| 6 | Food tracking (Phase 1 hibrid prompt) | `current/feature-requests/food-tracking.md` |
| 7 | Review tool rollout | `current/feature-requests/review-tool-rollout.md` |
| 7b | CCAP auto-session monitoring | `current/feature-requests/ccap-session-monitoring.md` |
| 7c | Overseer monitoring (fdp project-statuses input bekötés) | `current/feature-requests/overseer-monitoring.md` |
| 7d | "Hey Google"-szerű voice-trigger research | `current/feature-requests/hey-google-like-voice-trigger.md` |
| 7e | Per-device hangerő-cap impl (BathCom 50%) | `current/principles/cast-notifier-defaults.md` |
| 7f | Server ESM proper module resolution (.js extension codemod) | `current/feature-requests/server-esm-proper-resolution.md` |
| 7g | **RAG context-injection (CC hooks + agent ticks)** ⚠️ kritikus dep | `current/feature-requests/rag-context-injection.md` |
| 8a | **Eső / vihar noti — asztrál-emelő trigger** | `current/feature-requests/weather-rain-notification.md` (Phase 1 WeatherPoll ✅ cycle 90; Phase 2-3 notify-cast TTS + storm-tier nyitva) |
| 8b | **STT finomhangolás + fix tréner-metódus** | `current/feature-requests/stt-fine-tuning.md` |
| 7g | Szórakoztatás integráció (Jellyfin + Steam) | `current/feature-requests/entertainment-integration.md` |

---

## 🟡 Harmadik hullám (eszköz-integráció)

| # | FR | Path |
|---|---|---|
| 8 | Device battery monitoring | `current/feature-requests/device-battery-monitoring.md` |
| 9 | Device volume scheduling | `current/feature-requests/device-volume-scheduling.md` |
| 10 | Sleep-monitor data access (research-first) | `current/feature-requests/sleep-monitor-data-access.md` |
| 11 | Interfood Playwright scraper | `current/feature-requests/interfood-scraper.md` |
| 12 | Media tracking (filmek/sorozatok) | `current/feature-requests/media-tracking.md` |

---

## 🅿️ Parkolva (külön session / out-of-scope-ish)

| # | FR | Path |
|---|---|---|
| 13 | Email integration | `current/feature-requests/email-integration.md` |
| 14 | Social-media integration | `current/feature-requests/social-media-integration.md` |
| 15 | News aggregator integration | `current/feature-requests/news-aggregator-integration.md` |
| 16 | AI tech news scraping | `current/feature-requests/ai-tech-news-scraping.md` |
| 17 | Meeting tracking | `current/feature-requests/meeting-tracking.md` |
| 18 | CCAP-CLI integration (eszköz-érkezés várakozóban) | `current/feature-requests/ccap-cli-integration.md` |
| 19 | Cross-project notes ingestion + vektorizálás | `current/feature-requests/cross-project-notes-ingestion.md` |
| 20 | Worker-agent + kanban (összeolvasztás-döntés a B-mode-vel) | `current/feature-requests/worker-agent-cronjob.md` |
| 21 | CCAP local stabilization (GPT + lokál AI) | `current/feature-requests/ccap-local-stabilization.md` |

---

## ✅ Shipped (referenciaként)

| FR | Path |
|---|---|
| Server-app architecture (Phase 1) | `current/feature-requests/server-app-architecture.md` |
| Google Home integration (Phase 1.5+2) | `current/feature-requests/google-home-integration.md` |
| Activity tracking (activity-monitor) | `current/feature-requests/activity-tracking.md` |
| Organizer day+week view (organizer-FR) | `current/feature-requests/organizer-day-week-view.md` |
| **Discord webhook notification (#5b-DISCORD)** — Phase 2+3 | `current/feature-requests/discord-webhook-notification.md` (✅ cycle 130; user-feladat: `MA_DISCORD_WEBHOOK_URL` env) |
| **ntfy.sh push notification (#5b-NTFY)** — Phase 1 | `current/feature-requests/ntfy-push-notification.md` (✅ cycle 131, JSON publish emoji-safe; user-feladat: ntfy app + `MA_NTFY_TOPIC` env) |

---

## Munkamód

- **Csak a 🟢 Most-fókusz** sorokat veszi fel a Dev Agent autonómia szerint
- 🟡 sorok várnak: user-iránymutatás vagy a "Most-fókusz" kész
- 🅿️ sorok: az user manuálisan emeli át 🟢-ba ha aktiválja
- ✅ sorok: csak referencia

**Új FR megjelenésekor** (chat-ből, USER_INPUT-ból, principle-ből
származó deklaráció) a chat (#5) frissíti ezt a fájlt + a megfelelő
hullámba sorolja.

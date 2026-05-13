# Development Agent — backlog

> A Dev Agent ezt a fájlt olvassa az aktív FR-ek priorítás-sorrendjéhez.
> A táblázat felül = magasabb prio.
>
> Karbantartja: a chat (#5, én). User-iránymutatás után frissítem.

---

## 🟢 Most-fókusz (első fejlesztési kör)

| # | FR | Path | Cél |
|---|---|---|---|
| 1 | **Communication forms (3 csatorna)** | `current/feature-requests/communication-forms.md` | `ccap-notify` handler + `notify-cast` handler valódi shell-out |
| 2 | **Automatic status recording** | `current/feature-requests/automatic-status-recording.md` | `fr-status-change` + `plan-step-mark-done` handler |
| 3 | **Dev Agent Phase 1 self-bootstrap** | `__agent/plans/development-agent.plan.md` | dispatcher `agent` mező-support + Dev Agent log handler |
| 3b | **Runtime error API — Dynamo Logs Service bevezetés** | `current/feature-requests/runtime-error-api.md` | server-side error-tracking + REST endpoint a Dev Agent audit-fázisához |
| 3c | **IoT integráció — Google Home routine wake/sleep events** | `current/feature-requests/iot-integration-google-home-routine.md` | "Jó reggelt"/"Jó éjt" routine → server REST → sleep-state forrás |
| 3d | **Tasks aggregated dashboard view (client/ + server/)** | `current/feature-requests/tasks-dashboard-aggregated-view.md` | aggregátor + UI + interaktív jelölgetés (✅/⏸/🚫/💬) |

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

---

## Munkamód

- **Csak a 🟢 Most-fókusz** sorokat veszi fel a Dev Agent autonómia szerint
- 🟡 sorok várnak: user-iránymutatás vagy a "Most-fókusz" kész
- 🅿️ sorok: az user manuálisan emeli át 🟢-ba ha aktiválja
- ✅ sorok: csak referencia

**Új FR megjelenésekor** (chat-ből, USER_INPUT-ból, principle-ből
származó deklaráció) a chat (#5) frissíti ezt a fájlt + a megfelelő
hullámba sorolja.

# Development Agent — backlog

> A Dev Agent ezt a fájlt olvassa az aktív FR-ek priorítás-sorrendjéhez.
> A táblázat felül = magasabb prio.
>
> Karbantartja: a chat (#5, én). User-iránymutatás után frissítem.

---

## 🟢 Most-fókusz (első fejlesztési kör)

> **Grooming cycle 40 (2026-05-15):** Dev Agent-szakaszok ship-elve (Phase 1+,
> ✅ jelöléssel). Nyitott phase-ek (server-side, chat-led) maradnak — várnak
> green-light-ra vagy chat Phase 5-6 ship-re.

| # | FR | Path | Cél | Status |
|---|---|---|---|---|
| 1 | **Communication forms (3 csatorna)** | `current/feature-requests/communication-forms.md` | `ccap-notify` + `notify-cast` shell-out + throttle | Phase 1+2+4 ✅ (cycle 24/29/30); Phase 3 chat |
| 2 | **Automatic status recording** | `current/feature-requests/automatic-status-recording.md` | `fr-status-change` + `plan-step-mark-done` handler | Phase 1 ✅ (cycle 31); Phase 2-4 nyitva |
| 3 | **Dev Agent Phase 1 self-bootstrap** | `__agent/plans/development-agent.plan.md` | dispatcher `agent` mező + per-agent state routing | Phase 1+1.5+2 ✅ (cycle 33/34, +retroaktív 31); Phase 3 CCAP, Phase 4 server |
| 3b | **Runtime error API — Dynamo Logs Service bevezetés** ⚠️ ELŐRE | `current/feature-requests/runtime-error-api.md` | server-side error-tracking + REST endpoint a Dev Agent audit-fázisához | 🟢 **USER GREEN-LIGHT 2026-05-16** (AGB-2026-05-16-01) — UI errors not recorded blocker |
| 3b-UI-DIAG | **Maya UI láthatóság diagnózis** (kapcsolódó akut) | (lent diary 2026-05-16) | "felületen szar se jelenik, hibákat dobál, nem rögzíti" — server smoke + client console + endpoint-térkép | 🟢 **USER PRIO** — diag-only, NEM nagy refaktor |
| 3c | **IoT integráció — Google Home routine wake/sleep events** | `current/feature-requests/iot-integration-google-home-routine.md` | "Jó reggelt"/"Jó éjt" routine → server REST → sleep-state forrás | 🟢 server-zone, chat Phase 5-6 ütközés |
| 3d | **Tasks aggregated dashboard view (client/ + server/)** | `current/feature-requests/tasks-dashboard-aggregated-view.md` | aggregátor + UI + interaktív jelölgetés (✅/⏸/🚫/💬) | 🟢 server+client, chat Phase 5-6 ütközés |
| 3e | **Action-log mint CLI command (A+B+sync)** | `current/feature-requests/action-log-cli-command.md` | `ma action-log emit/sync/list` — PS hook thin wrapper | Phase 1+2 ✅ (cycle 25); Phase 3-6 server-side green-light vár |

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

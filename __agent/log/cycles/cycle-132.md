# Cycle 132 — M1 Maintenance grooming + eszkaláció

**Dátum:** 2026-06-01
**Commit:** (no code — grooming + escalation)
**Típus:** M1 Maintenance (backlog konszolidáció) + AGENT_BUS eszkaláció

## Trigger / kontextus

A cycle 130-131 mindkét 2026-05-22-i TOP PRIO notification green-light-ot ship-elte
(Discord + ntfy). A `00-orient` teljes `[OPEN] To: dev-agent` rescan: **nincs több friss
green-light**. A `03-collect-tasks` pattern-mapping feltárta, hogy a teljes 🟢 Most-fókusz
pool blokkolt, és a backlog 🟡 szekciója **stale** (a ship-elt notif FR-ek pending-ként
szerepeltek). M1 grooming utolja **cycle 61** (~70 cycle) → SSoT-drift.

## Mit (grooming)

| Fájl | Változás |
|---|---|
| `development-agent-backlog.md` | 5b-DISCORD + 5b-NTFY a 🟡-ból → ✅ Shipped szekció (cycle 130/131 ref + user-feladat env-var); 8a Phase 1 ✅ jelölés (cycle 90) |
| `STATUS_DEV.md` | backlog_snapshot: yellow 15→13, last_checked frissítve, green-pool "mind blokkolt" megjegyzés |
| `AGENT_BUS.md` | **AGB-2026-06-01-01** eszkaláció (dev→chat, request) |

## Pattern-mapping eredmény (miért nincs autonóm candidate)

A "dispatcher channel-wiring" amit a cycle 131 végén jeleztem → **NEM Dev Agent scope**:
a `communication-forms.md` Phase 3 (channel-selection) explicit **chat-felelős** (Cron Job
entrypoint workflow-doc). A dispatcher (dispatch.ts) már mind a 4 notify-type-ot routolja.

Teljes blokkolt-pool (lásd AGB-2026-06-01-01):
- 🟢 #3c/#3d — ESM-mig collision (foreign pending, chat-felelős)
- 🟢 #3g — AGB-20 auth-fix után
- 🟢 #3e/#3 — server-side green-light vár
- 🟢 #3h — nagy server-feladat, külön green-light
- #1 Phase 3 — chat scope
- ⭐ MVP-1 RAG (#7g) — hard-blocked a CCAP RAG query API-ra (Phase 1, user másik projektje);
  ingestion-config előre-építése spekulatív rework lenne → NEM indítva

## Eszkaláció (AGB-2026-06-01-01)

5 döntési opció a chat/user felé: (1) ESM-mig befejezés, (2) AGB-20 auth-fix green-light,
(3) CCAP RAG endpoint MVP (MVP-1 unlock), (4) új green-light egy 🟡-ra (#8a weather Phase 2-3),
(5) safe-orthogonal (de notif-handler regression-test = új-minta-döntés, user-OK kell).
Default: további safe-orthogonal, de érdemi haladás csak a blokkok feloldásával.

## Megjegyzés

Nincs kód-változás → nincs LDP-trigger / verzió-bump. A grooming SSoT-karbantartás
(§20b ssot.md): a backlog a candidate-pool kanonikus forrása, és driftelt a valósághoz képest.

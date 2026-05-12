# Plan: Triggering rendszer — A mode (Health-check workflow + tools)

> **v2 (2026-05-08 hajnal)** — user pontosítás után scope szétválasztva.
>
> **Scope KORLÁTOZOTT**: csak az **A mode** (health-check). A B mode (idle-mode
> work, plan-execution) külön plan-fájlban.
>
> **Forrás-FR:** `current/feature-requests/triggering-system-architecture.md`
>
> **Jelölés:** ⚙️ döntés-pont | 🟢 default | ❓ még nyitott

---

## 1. Cél

Egy **óránként** ébredő AI-agent (a CCAP futtatja, NEM én) átnézi az állapotot,
és ha urgens → cselekszik (notify / task-update / USER_INPUT javaslat); egyébként
alszik tovább. Az **én feladatom: a workflow leírása + a handler-script-ek
elkészítése**, nem az agent-futtatás.

## 2. Scope szétválasztás (v2 — KRITIKUS)

| Komponens | Ki | Mit |
|---|---|---|
| Agent-tick scheduling | **CCAP / user** | óránkénti hívás, retry, restart-safe |
| Agent prompt + Claude API call | **CCAP** | input összeállítás, válasz parse |
| Cost / rate-limit | **CCAP** | nem az én scope-om |
| Workflow-doc (ez a plan) | **assistant (én)** | mit olvasson, mit döntsön, mit tegyen |
| Agent-prompt szöveg | **assistant (én)** | a CCAP fogja használni |
| **Action-handler scriptek** | **assistant (én)** | input: agent JSON output → side-effect |
| State-fájlok séma | **assistant (én)** | `__agent/state/*.json` |
| Bekötendő rendszerek | közös | cast-notifier ✅, activity-monitor ✅, organizer ✅, jövőbeli: email, social media |

→ Én NEM hívok Claude API-t. Én NEM számolok USD cost-tal.
→ Én **kontraktokat** írok le (input fájlok, output JSON séma) + **handler scriptek**.

## 3. Inputs (mit olvas a CCAP-agent a tick-kor)

A CCAP összerakja a prompt-input-ot az alábbiakból:

| # | Forrás | Cél | Token-becslés |
|---|---|---|---|
| 1 | `__agent/STATUS.md` | aktuális snapshot | ~500 |
| 2 | `__agent/log/actions/<today>.jsonl` (utolsó 100 sor) | mi történt | ~1500 |
| 3 | `__agent/USER_INPUT.md` ([NEW] blokkok) | nyitott input | ~300 |
| 4 | `current/principles/recurring-tasks.md` (ütemezés-tábla) | mi esedékes | ~600 |
| 5 | `current/diary/diary.md` (utolsó nap) | tegnapi state | ~400 |
| 6 | `fo tasks.list --filter '{"done":false}' --limit 30` | aktív task-ok | ~1500 |
| 7 | `__agent/state/agent-tick.json` | előző tick metadata | ~200 |

**Total**: ~5000 input token / tick (becslés a CCAP cost-tervezéséhez).

❓ Q-trig-13: *"Egyéb monitoring / communication eszközöket is be kell kötni"* — mit ért
alatta a user? Activity-monitor (✅), cast-notifier (✅), email (⏳ FR), social
media (⏳ FR), egyéb (?). Lásd `open-questions.md` "S) Triggering-arch" friss kérdés.

## 4. Decision matrix (agent-prompt instrukció)

A CCAP-agent **strukturált JSON-t** ad ki:

```json
{
  "verdict": "urgens" | "soft-nudge" | "no-action",
  "reason": "egy mondat — miért ezt választotta",
  "actions": [
    { "type": "...", "args": {...}, "tier": 0|1|2|3 }
  ]
}
```

### Urgens triggerek

| Trigger | Action |
|---|---|
| Lejárt task `dueDate` (P >= 100) | `notify-cast` + `user-input-new` |
| Esedékes recurring (`utolsó` + ciklus >= ma) | `notify-cast` ha még éber |
| Sleep-window ELŐTT 30p | `notify-cast` "lefekvés" |
| Sleep-window VÉGE | `notify-cast` "ébresztő" + napi summary |
| Deadline 24h-n belül + nem érintett | `notify-cast` warn |

### Soft-nudge triggerek

| Trigger | Action |
|---|---|
| Csúszó recurring 2+ missed cycle | `user-input-new` (nem hangos) |
| Open-questions h-fontosság >= 7 nap "open" | `user-input-new` emlékeztető |
| Halmozódó FR organizer-be migrálandó | `user-input-new` javaslat |

### No-action

| Helyzet | Action |
|---|---|
| Sleep-window aktív | csak `log` "tick - sleeping" |
| Nincs urgens, semmi friss | csak `log` "tick - quiet" |

## 5. Outputs — action-handler scriptek (én csinálom)

Minden `actions[]` elemhez tartozik egy handler. A handler-ek a `scripts/agent-handlers/` mappába kerülnek.

| Action type | Handler script | Tier |
|---|---|---|
| `log` | (built-in: action-log emit) | 0 |
| `notify-cast` | `scripts/agent-handlers/notify-cast.ts` (cast-notifier wrap) | 1 |
| `update-status` | `scripts/agent-handlers/update-status.ps1` | 1 |
| `user-input-new` | `scripts/agent-handlers/user-input-append.ps1` | 1 |
| `task-create` (organizer) | `scripts/agent-handlers/task-create.ts` (`fo tasks.create` wrap) | 2 |
| `task-update` (organizer) | `scripts/agent-handlers/task-update.ts` | 2 |
| `task-archive` | TILTOTT auto — nincs handler | 3 |
| `commit / push / external-API` | TILTOTT auto — nincs handler | 3 |

**Tier 0-1**: agent önállóan ✅
**Tier 2**: agent önállóan ✅, de "clear szabály" forrás-hivatkozás kötelező (recurring-tasks.md, sleep-system.md, etc.)
**Tier 3**: TILTOTT — `user-input-new` blokkban kérje a user-OK-t

⚙️ Q-trig-9: tier-rendszer OK így?

## 6. Sleep-aware logika

**Sleep-window detekció** (priority sorrendben):
1. `current/principles/sleep-system.md` képlet (`wakeAt + 18-20h`) — ha van wakeAt event
2. `activity-monitor/data/<today>.jsonl` utolsó 6h idle (>= 4h folyamatos idle ÉS éjfél-reggel között)
3. Default fallback: **02:00–08:00**

Alvás alatt:
- A CCAP agent-tick **lefut**
- Output: csak `log` Tier 0
- Tier 1-3 actions **gate-elt** — halmozódó dolgokat egy "alvás-vége csomag"-ba teszi → ébredéskor egyszer notify

⚙️ Q-trig-10: 🟢 javaslat: A-mode FUT, csak Tier 1-3 gate-elt. OK?

## 7. Loop-safety

- **Iteration-cap**: 1 outer-loop / tick (a CCAP feladata)
- **Action-cap**: 5 action / tick max (a handler-script-ek visszautasítják ha több)
- **Notify-throttle**: ugyanaz a notify-id max 1× / 4 óra (`__agent/state/notify-throttle.json`)
- **Last-tick gate**: ha `agent-tick.json.lastTickAt` < 30p, kihagy

⚙️ Q-trig-12: 🟢 javaslat OK?

## 8. State-fájlok (én készítem)

| Fájl | Cél |
|---|---|
| `__agent/state/agent-tick.json` | utolsó tick ts, ciklus-szám, predikció a következő tickre |
| `__agent/state/notify-throttle.json` | utolsó notify per-trigger-id |
| `__agent/state/sleep-cache.json` | inferált alvás-window cache |
| `__agent/state/pending-notifications.json` | alvás-vége csomag queue |

Mind **JSON**, file-locking-gel (`*.lock` sentinel).

## 9. MVP scope — Phase 1 (az én build-em)

✅ **IN MVP** (workflow-szinten + handler-scripten):
- Agent-prompt szöveg + decision-matrix doc
- Inputs 1-7 (lehetséges összeállítása CCAP-szempontjából)
- Output JSON séma (validátor script-tel)
- Handler-scriptek: `log` + `user-input-new` + `update-status` (Tier 0-1)
- State-fájl: `agent-tick.json`
- Tier-rendszer doc

❌ **NEM MVP** (Phase 2+):
- `notify-cast` handler (Phase 2 — cast-notifier integráció után)
- Tier 2 task-create / task-update handler
- Sleep-aware (Phase 2)
- Throttle / pending-notifications (Phase 2)
- Email / social media bekötés (Phase 3+)

## 10. Phase-elés

| Phase | Mit én csinálok | Becslés |
|---|---|---|
| 0 | ez a plan + 3-pontos user-approval | 0p (most) |
| 1 | MVP: agent-prompt doc + 3 handler + state-séma | 2-3 nap |
| 2 | `notify-cast` + sleep-aware + throttle | 1-2 nap |
| 3 | Tier 2 handlers (task-create/update) + clear-rule mapping | 1-2 nap |
| 4 | Bekötés: email / social media (külön FR-ek) | TBD |
| 5 | B mode külön plan | TBD |

## 11. Open kérdések — összesítés

| # | Kérdés | Default | User-input |
|---|---|---|---|
| Q-trig-1 | Claude SDK / saját agent? | **CCAP** futtatja, az ő dolga | ✅ válaszolva |
| Q-trig-2 | PowerShell vs Node a handler-ekhez | **vegyes** (Node ha TS-projektből hív, PS ha standalone) | 🟢 |
| Q-trig-3 | Shared state | **file-locking** | 🟢 |
| Q-trig-4 | Missed-job pótlás | **per-trigger döntés** | 🟢 |
| Q-trig-7 | Cost cap | **CCAP scope, nem itt** | ✅ válaszolva |
| Q-trig-8 | Plan-approval gate | **3 pont + user "oké"** vagy alapos review | ✅ válaszolva |
| Q-trig-9 | Action-scope tier-ek | fenti tábla (0-3) | ⚙️ user OK? |
| Q-trig-10 | Sleep-aware: A vagy notify | A-mode fut, Tier 1-3 gate-elt | ⚙️ |
| Q-trig-11 | Hol fut | **CCAP** | ✅ válaszolva |
| Q-trig-12 | Loop-safety cap | fenti 4 limit | ⚙️ |
| Q-trig-13 | Egyéb monitoring/communication bekötés | open — mit ért alatta? | ⚙️ ❓ |

## 12. 3-pontos user-approval kérés (Phase 1 indításhoz)

1. **Tier-rendszer (0-3)** + a 8 action-handler split (Tier 1: log/user-input/status; Tier 2: organizer task; Tier 3: tiltott commit/push) **OK**?
2. **Sleep-aware default fallback 02:00–08:00**, alvás alatt csak `log` Tier 0 fut **OK**?
3. **MVP scope** (3 handler + state-fájl + agent-prompt doc, ~2-3 nap) **OK**?

Ha mindhárom **oké** → indul Phase 1.

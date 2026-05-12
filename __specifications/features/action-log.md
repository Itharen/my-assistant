# Feature: Action log

> Központi audit-naplózás: minden tool-call, lifecycle event, agent-action, manuális decision append-only formában rögzítve. Cél: session-ek közötti continuity, retrospektív audit, time-travel debugging.

**Forrás-elv:** `CLAUDE.md` "Action log — KÖTELEZŐ" szekció (session-recovery infrastruktúra).

---

## 1. Cél (KÖTELEZŐ)

Sessions hirtelen összeomolhatnak. Egy explicit "session-end checkpoint" nem véd ez ellen, mert nem tudjuk **mikor** fog meghalni a session. Ezért **minden** akcióról folyamatosan, append-only naplót vezetünk.

- Új session vissza tudja venni a fonalat
- Hosszú távon vissza tudunk nézni: mi készült el, mi nem
- Cross-actor audit (Claude / cli / server / activity-monitor / user)

## 2. Két kanonikus tárolási hely (Phase 1)

| Tárolás | Hol | Mikor |
|---|---|---|
| **JSONL fájl** (legacy / fallback) | `__agent/log/actions/YYYY-MM-DD.jsonl` (Europe/Budapest naptári nap) | Phase 1: live source-of-truth, ide írnak: Claude hookok, cli, activity-monitor lifecycle |
| **SQLite tábla** `actions` | `server/data/my-assistant.db` | Phase 1: párhuzamosan írva ha a server fut. Phase 2-3: kanonikus, file fallback |

## 3. Schema (mindkét tárhelyen kompatibilis)

```ts
interface ActionLogEntry {
  ts: string;                                    // ISO 8601 + offset, Europe/Budapest
  actor: string;                                 // 'claude' | 'cli' | 'tick-engine' | 'activity-monitor' | 'user' | ...
  kind: ActionLogKind | string;                  // see below
  summary: string;                               // short, factual, no advice
  ref?: string;                                  // optional: org:task:<id> | log-line:N | ...
  extra?: Record<string, unknown>;               // arbitrary structured payload
  status?: 'ok' | 'failed' | 'skipped';          // (server only) outcome of an action execution
  tickId?: number;                               // (server only) FK to agent_ticks.id
}

type ActionLogKind =
  | 'tool-call'                                  // automated: Claude hookok
  | 'decision' | 'note' | 'state-change'         // manual: Claude
  | 'flow-start' | 'flow-end' | 'ship'           // milestone events
  | 'error'                                       // any actor
  | 'external-action';                           // cli / activity-monitor / scripts
```

## 4. Forrás-mátrix — ki ír mit (KÖTELEZŐ)

| Forrás | Mit ír | Csatorna |
|---|---|---|
| **Claude (én) automatikus** | tool-call, file-edit, file-write, bash, user-msg, assistant-turn-end, session-start | `.claude/settings.json` hookjain át (`cli/scripts/action-log/hook.ps1`) |
| **Claude (én) manuális** | `decision`, `flow-start`, `flow-end`, `state-change`, `ship`, `note`, `error` | `cli/scripts/action-log/append.ps1` vagy direkt JSONL-append |
| **CLI** (`ma`) | `external-action` minden subcommand invocation-nél (kezdéskor + ok/error befejezéskor) | `cli/src/action-log/action-log.client.ts` lokál writer |
| **Server** (`tick-engine`, `activity-ingest`) | `flow-start` / `flow-end` tick-eknél, `note` tier-skip, `error` exception | `server/src/_modules/action-log/action-log.module.ts` (DB tábla) |
| **activity-monitor** | `external-action` lifecycle (start/stop, error) | hook PS-en át a JSONL-be |
| **scripts** (deprecated dispatcher / hookok) | `tool-call`, `external-action`, `error` | direct JSONL append |

## 5. Mit NEM ír

- **NEM** ír ide az `activity-monitor` percenkénti samples-je (ablak/idle) — az a `server/activity-monitor/data/`-ba megy, gitignored. Csak az activity-monitor **lifecycle event-jei** (start/stop, error) jönnek ide.
- **NEM** írunk ide titkokat / PII-t. A `summary` mező legyen tényszerű, de ne szivárogtasson érzékenyt.
- A `Read` / `Glob` / `Grep` tool-okat nem hookoljuk (zaj). Csak `Edit / Write / Bash / PowerShell / NotebookEdit / TodoWrite` van wired.

## 6. Retention

- **JSONL:** végtelen. Minden napi fájl commitolt és pusholt (kivéve ami `__agent/log/actions/` git-ignore mintákban szerepel — egyik sem)
- **SQLite:** végtelen. A `actions` tábla nem pruned automatikusan; csak migrációkor archive-olva

## 7. Kötelező lifecycle event-ek

Minden új script / projekt / feature, amelyiknek "akciója" van (CLI command, file-művelet, IO, deploy, lifecycle event):

| Esemény | Kind | Példa summary |
|---|---|---|
| Új flow indul | `flow-start` | "daily-review flow indul" |
| Flow befejeződik | `flow-end` | "daily-review flow befejezve, 4 task lezárva" |
| Nem-trivial döntés | `decision` | "build-it-ourselves: cast-notifier saját PoC, nem Home Assistant" |
| State-change (módosítás archív / src) | `state-change` | "SOURCE_OF_TRUTH.md frissítve: tasks → organizer-verified" |
| Ship / commit-érett | `ship` | "cast-notifier Phase 1.5 ship — TTS + per-device save/up/restore" |
| External tool-output / outcome | `external-action` | "ma cast notify ok (5821ms)" |
| Hiba bármelyik csatornán | `error` | "ma cast notify failed: E_NETWORK timeout" |

## 8. Phase 2 cutover

A `.claude/settings.json` hookok és a CCAP runtime (cli/scripts/agent-handlers/) Phase 2-ben átállnak `POST http://127.0.0.1:39245/actions`-re. Server-down esetén fallback file-write a `__agent/log/actions/`-ba.

A migrációs lépések részletei: `current/feature-requests/server-app-architecture.md`.

## 9. Tooling

- **Append node-ból:** `import { logAction } from 'cli/scripts/action-log/lib.ts'` (vagy a CLI-ben: `cli/src/action-log/action-log.client.ts`, ami a server-down fallback writer)
- **Append PowerShell-ből:** `cli/scripts/action-log/append.ps1`
- **Server API:** `POST /actions` `{ actor, kind, summary, ref?, extra?, status? }` → 201 + ActionRow
- **Read:** `GET /actions?from=&to=&kind=&actor=&limit=&offset=` (DB), vagy `tail -n 100 __agent/log/actions/<today>.jsonl` (file)

## 10. Kapcsolódó

- Implementáció: `cli/src/action-log/`, `cli/scripts/action-log/`, `server/src/_modules/action-log/`, `server/src/_routes/action/`
- Konfig: `.claude/settings.json` (4 hook-on át)
- Schema doc: `__agent/log/actions/README.md`
- CLAUDE.md: "Action log — KÖTELEZŐ" szekció (session-recovery infrastruktúra)

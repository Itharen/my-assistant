# Feature: Activity monitoring

> Lokál gép tracking PowerShell-ben. Percenként sample-eli az aktív ablak címet, folyamat-nevet, és idle-time-ot. Cél: AFK / sleep detection a tick-engine sleep-gate-jéhez.

**Forrás-FR:** `current/feature-requests/activity-tracking.md`
**Implementáció:** `server/activity-monitor/logger.ps1`
**Spec sister doc:** [`./tick-engine.md`](tick-engine.md) §5 (sleep detection)

---

## 1. Cél

A user nem osztja meg minden interakcióban hogy mit csinált a session-ök között. Az activity-monitor:

1. Percenként sample-eli az aktív ablakot, a forgatott folyamatot, és az idle-time-ot (Win32 `GetLastInputInfo`)
2. Tárolja samples lokálban (privát, NEM pusholjuk)
3. **Lifecycle event-ek** (start / stop / error) a központi action-log-ba mennek (pusholt)
4. Phase 2-től a samples-ek a server `/activity-sample` endpoint-jára POST-olnak (Phase 1-ben file-write, Phase 2 dual-write)
5. Server-side: `ActivityIngest_Module` heuristic-ekkel inferral wake / sleep markereket → `sleep_events` tábla → tick-engine sleep-gate input

## 2. Schema

```ts
interface ActivitySample {
  ts: string;                              // ISO 8601 + Europe/Budapest offset
  processName: string | null;              // foreground process name (e.g. "Code", "chrome", "Spotify")
  windowTitle: string | null;              // foreground window title (full string, can contain PII)
  idleSeconds: number;                     // seconds since last keyboard / mouse input (Win32 API)
}
```

## 3. Tárolás (két layer, Phase 1)

### 3.1 Lokál JSONL (Phase 1, default)

- **Útvonal:** `server/activity-monitor/data/YYYY-MM-DD.jsonl`
- **Gitignored:** `server/activity-monitor/data/` (privacy: window title-ek érzékenyek lehetnek)
- **Append-only**, percenként 1 sor

### 3.2 Server SQLite (Phase 2, dual-write)

- **Endpoint:** `POST /activity-sample` `{ ts, processName?, windowTitle?, idleSeconds }`
- **Tábla:** `activity_samples`
- **Server-side processing:**
  - Insert sample
  - Heuristic sleep / wake detection:
    - Ha previous sample `idleSeconds >= 8h` és current `< 600s` → emit `inferred-wake` event
    - Ha previous `< 8h` és current `>= 8h` → emit `inferred-sleep` event
- **State output:** `state()` returns `{ latestSample, isAfk, isLikelyAsleep }` — a tick-engine ezt használja

## 4. Privacy szabályok (KÖTELEZŐ)

- **Samples NEM pushed** — gitignored mappában
- **Lifecycle event-ek pushed** — action-log JSONL-ben szerepelnek (`__agent/log/actions/`), de privát adatot NEM tartalmaznak (csak "monitor started/stopped/error")
- **NEM logolunk** clipboard, password, vagy más explicit bizalmas mezőt
- A window-title PII-t tartalmazhat (browser tab cím, IDE fájl-név, üzenet) — ezért a `data/` privát; **nyitott kérdés** a user-felé: maszkolás-e (Q-am-1, lásd `server/activity-monitor/README.md`)

## 5. Indítás

### 5.1 Foreground (debug)

```powershell
cd E:\Programming\Own\CURSOR\LIVE-projects\my-assistant
pwsh -File server/activity-monitor/logger.ps1
```

### 5.2 Background (Windows Task Scheduler, ajánlott)

```powershell
$action = New-ScheduledTaskAction -Execute "pwsh.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -File E:\Programming\Own\CURSOR\LIVE-projects\my-assistant\server\activity-monitor\logger.ps1" `
    -WorkingDirectory "E:\Programming\Own\CURSOR\LIVE-projects\my-assistant"
$trigger = New-ScheduledTaskTrigger -AtLogon
Register-ScheduledTask -TaskName "my-assistant-activity-logger" `
    -Action $action -Trigger $trigger `
    -Description "my-assistant L2 activity logger" `
    -RunLevel Limited
```

## 6. Konfiguráció (paraméterek)

| Paraméter | Default | Leírás |
|---|---|---|
| `-IntervalSeconds` | `60` | Mintavételezési intervallum másodpercben |
| `-LogDir` | `server/activity-monitor/data` | Log fájlok helye |

## 7. Heuristic szabályok (server-side)

| Threshold | Esemény |
|---|---|
| `idleSeconds >= 600s` (10 min) | AFK marker |
| `idleSeconds >= 8h` | Likely asleep marker |
| Previous `>= 8h` and current `< 600s` | `inferred-wake` event a `sleep_events` táblába |
| Previous `< 8h` and current `>= 8h` | `inferred-sleep` event |

A `sleep_events` tábla input a tick-engine sleep-gate-jének (Tier 1+ action-ek skip-elése alvás alatt).

## 8. Open kérdések (még nyitott)

| ID | Kérdés |
|---|---|
| Q-am-1 | Browser-tab cím logolása OK, vagy maszkolva legyen? |
| Q-am-2 | Time-zone fix Europe/Budapest, vagy `[System.TimeZoneInfo]::Local`? |
| Q-am-3 | Mintavételezés 30s vagy 5p? (Most 60s) |
| Q-am-4 | Auto-cleanup régi log-okra (N nap után törlés)? |
| Q-am-5 | Heti aggregáció script — mikor csináljuk? |

Eredeti felsorolás: `server/activity-monitor/README.md` "Open kérdések" szakasz.

## 9. Kapcsolódó

- Implementáció: `server/activity-monitor/logger.ps1`
- Server-side ingest: `server/src/_routes/activity-sample/`, `server/src/_modules/activity-ingest/`
- DAO: `server/src/_models/data-models/activity-sample.data-model.ts`
- Sleep-event DAO: `server/src/_models/data-models/sleep-event.data-model.ts`
- Forrás-FR: `current/feature-requests/activity-tracking.md`
- Forrás-szabály: `current/principles/sleep-system.md`

# Plan — Hullám-panel UI (FR #3b-WAVE-UI)

> **Cél:** A dashboard `d-waves` paneljén látszódjon az utolsó N (≈14) 3×3
> snapshot, és a user új snapshotot tudjon submitelni. Phase 2+3+4 scope
> ehhez a green-lighthoz; Phase 5 (trend) és Phase 6 (holdfázis) **NEM most**.
>
> **Forrás-FR:** `current/feature-requests/wave-panel-ui.md`
> **AGB green-light:** AGB-2026-05-16-02 (chat → dev-agent, 2026-05-16T01:42)
> **Plan-mode:** B (dev-agent autonóm tervezés a green-light után)
> **Cycle:** 51 (plan-package) → implementáció 52+

---

## Audit (cycle 51 elején)

### Server (részben kész)

- ✅ `server/src/_routes/wave/wave.controller.ts` — `POST /api/wave/log`, `GET /api/wave/list` (auth-gated)
- ✅ `server/src/_routes/wave/wave.data-service.ts` — `Wave_DataService.listRecent(rangeHours)` + `create()`
- ✅ `server/src/_routes/dashboard/dashboard.controller.ts` — `GET /api/dashboard/snapshot` (waves series-szel aggregálva)
- ✅ `server/src/_models/data-models/wave.data-model.ts` — `Wave_Kind` = `astral|mental|matter`, `value: number` (0..100)
- ❌ **Unauth endpoint** a `3x3-log.jsonl` olvasásához — nincs (kell Phase 2.A-hoz)
- ❌ JSONL → numeric value mapping util — nincs

### Client (panel komponens kész, form hiányzik)

- ✅ `client/src/app/_modules/dashboard/_components/d-waves/d-waves.component.ts` — read-only 3-vonalas SVG diagram, `@Input() snapshot`
- ✅ `D_Dashboard_DataService` — `BehaviorSubject<state>`, 30s polling
- ✅ `D_Dashboard_ControlService.refresh()` — `api.getDashboard(24)` → state-be
- ❌ **Új snapshot form** — nincs külön komponens, a `d-capture` panel a generikus capture
- ❌ Mood + note megjelenítés snapshot-onként a d-waves-ban — `A_WaveRow`-ban nincs ezeknek mező
- ❌ JSONL-fallback fetch — nincs (AUTH BLOCKER miatt minden polling 401-et kap)

### AUTH BLOCKER kontextus

- `GET /api/dashboard/snapshot` → 401 (cycle 44 AGB-03 finding)
- AGB-03 task B (általános AUTH fix opciók a/b/c) **chat-decision pending**
- AGB-02 Phase 2 anchor **explicit fallback**: "`waves` táblából (DB) **vagy** `__agent/state/3x3-log.jsonl`-ből (Phase 4 sync előtt)"
- → Phase 2-ben **JSONL útvonalat választjuk** — bypass-eli az AUTH BLOCKER-t, nem várja a chat-döntést

---

## Phase-elés (FR-séma + state)

| Phase | Mit | Status | Cycle |
|---|---|---|---|
| 0 | FR doc | ✅ | (forrás) |
| 1 | UI-DIAG | ✅ cycle 44 | shipped (AGB-03) |
| **2.A** | **Server: unauth `GET /api/wave/get-from-jsonl`** (3x3-log.jsonl read + mapping) | ✅ cycle 52 | shipped |
| **2.B** | **Client: D_Dashboard_ControlService 401-fallback path** (JSONL endpoint) | ✅ cycle 53 | shipped |
| **2.C** | **d-waves enrichment**: mood + note + vector emoji megjelenítés | ✅ cycle 53 | shipped |
| **3.A** | **Server: unauth `POST /api/wave/log-public`** (FDPNTS-pattern, mint /error/log) | ✅ cycle 54 | shipped |
| **3.B** | **Client: új-snapshot form** (3 dropdown: astral/mental/matter; vector; mood; note) | 🚧 | cycle 54-55 |
| **4.A** | **Server: jsonl → waves DB sync script** (one-shot import) | 🚧 | cycle 56 |
| **4.B** | **Server: auto-sync hook** (új `/wave/log-public` payload → jsonl append + DB insert) | 🚧 | cycle 56 |
| 5 | Trend mini-chart (sparkline) | 🚧 később | külön green-light |
| 6 | Holdfázis overlay | 🚧 később | külön green-light |

---

## Phase 2.A — Server: unauth JSONL endpoint

### Új fájl: `server/src/_routes/wave/wave-jsonl.controller.ts`

```typescript
export class WaveJsonl_Controller extends DyNTS_Controller {
  static getInstance(): WaveJsonl_Controller {
    return WaveJsonl_Controller.getSingletonInstance();
  }

  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getFromJsonl',
        type: DyFM_HttpCallType.get,
        endpoint: '/get-from-jsonl',
        // NO preProcesses → unauth (FDPNTS-pattern)
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const limit: number = Math.min(Math.max(Number(req.query.limit) || 14, 1), 100);
            const rows: WaveJsonl_Row[] = await readWavesFromJsonl(limit);
            res.send({ rows });
          },
        ],
      }),
    ];
  }
}
```

### Új fájl: `server/src/_collections/wave-jsonl.util.ts`

```typescript
// JSONL row shape (forrás: __agent/state/3x3-log.jsonl)
interface JsonlRow {
  ts: string;
  actor: string;
  astral?: string;
  mental?: string;
  material?: string;
  wave_vector?: 'up' | 'down' | 'flat';
  mood?: string;
  note?: string;
}

// Output row shape — kompatibilis A_WaveRow shape-pel (de + mood/note)
export interface WaveJsonl_Row {
  ts: string;
  kind: 'astral' | 'mental' | 'matter';
  value: number;        // 0..100 (mapping-ből)
  level: string;        // eredeti string ("low", "mid", ...)
  vector: 'up' | 'down' | 'flat';
  mood: string | null;
  note: string | null;
}

// String level → 0..100 numeric mapping
const LEVEL_MAP: Record<string, number> = {
  'very-low': 10,
  'low': 20,
  'low-mid': 35,
  'mid': 50,
  'mid+': 60,
  'normal': 70,
  'high': 85,
  'very-high': 95,
};

export async function readWavesFromJsonl(limit: number): Promise<WaveJsonl_Row[]> {
  // 1) resolveAgentDir() → __agent/state/3x3-log.jsonl
  // 2) read + tail(limit)
  // 3) explode minden sort 3-ra (astral, mental, matter) ha jelen van
  // 4) note: 'material' → kind: 'matter' (FR data-model szerint)
  // 5) value = LEVEL_MAP[level] ?? 50 (default mid ha ismeretlen)
  // 6) error-handling: try/catch fájl-olvasásra, MA-WAVE-JSONL-READ-FAIL kód, emitServerActionLog
}
```

### Routing-modul wiring

`server/src/app.server.ts` `getRoutingModules()`-ben:
```typescript
new DyNTS_RoutingModule({
  path: '/api/wave',
  controllers: [
    Wave_Controller.getInstance(),       // meglévő, auth
    WaveJsonl_Controller.getInstance(),  // ÚJ, unauth
  ],
}),
```

→ Endpoint a kliensnek: `GET /api/wave/get-from-jsonl?limit=14`

### LDP-validation

- `tsc-server` zöld
- `server-runtime` restart automatikus
- Smoke (manuálisan): `curl http://localhost:39245/api/wave/get-from-jsonl?limit=14` → 200 + JSON

---

## Phase 2.B — Client: D_Dashboard_DataService fallback path

### Stratégia

A `D_Dashboard_ControlService.refresh()` jelenleg `api.getDashboard(24)` → ha 401, error toast.
Új viselkedés:
1. Próbáld `api.getDashboard(24)`
2. Ha 401 (vagy az error-on belül `errorCode === 'FDPNTS-ASB-ATSU0'`) → fallback: `api.getWavesFromJsonl(14)`
3. A JSONL response-ot transzformáld `A_DashboardSnapshot` shape-re (waves only, tasks/insights/captures üres)
4. State-be írás normál módon

### Új API method

`client/src/app/_services/api-services/a-server.api-service.ts`-ben:
```typescript
getWavesFromJsonl(limit: number): Promise<{ rows: A_WaveJsonl_Row[] }> {
  return this.http.get<{ rows: A_WaveJsonl_Row[] }>(
    `${this.baseUrl}/api/wave/get-from-jsonl?limit=${limit}`,
  ).toPromise();
}
```

### Új interface

`client/src/app/_models/server-envelope.interface.ts`-ben:
```typescript
export interface A_WaveJsonl_Row {
  ts: string;
  kind: A_WaveKind;
  value: number;
  level: string;
  vector: 'up' | 'down' | 'flat';
  mood: string | null;
  note: string | null;
}
```

### Transzformáció control-service-ben

JSONL rows → `A_DashboardSnapshot.waves.series` shape-re. Kicsi util a `_collections/`-be.

---

## Phase 2.C — d-waves enrichment

### Mood + note megjelenítés

Új `D_WavesMoodCard_Interface` a komponensben:
```typescript
interface D_WavesMoodCard_Interface {
  ts: string;
  vector: 'up' | 'down' | 'flat';
  vectorEmoji: string;  // ↗ ↘ →
  mood: string;
  note: string;
}
```

A `latest` snapshot mood/note-ját külön kártyán mutatjuk (panel alatt vagy mellett).

---

## Phase 3 — Új snapshot form

### Server: `POST /api/wave/log-public` (unauth)

`WaveJsonl_Controller`-ben új endpoint:
- body: `{ astral?: string, mental?: string, material?: string, wave_vector: 'up'|'down'|'flat', mood?: string, note?: string }`
- handler: append to `__agent/state/3x3-log.jsonl` (raw passthrough — a chat-rögzítés mintáját követi)
- response: `{ ok: true, ts: <iso> }`
- error-handling: try/catch fájl-write, MA-WAVE-JSONL-WRITE-FAIL, no-throw (mert append-only forrás-of-truth, nem szabad elveszíteni)

### Client: új form komponens

`client/src/app/_modules/dashboard/_components/d-waves-form/`:
- 3 select (astral/mental/matter) — opciók: `very-low|low|low-mid|mid|mid+|normal|high|very-high`
- vector select — `up|down|flat`
- mood input (text, max 60 char)
- note textarea (opcionális, max 500 char)
- submit → control-service.submitWaveSnapshot() → POST + refresh

---

## Phase 4 — JSONL ↔ DB sync

### 4.A — One-shot import script

`server/scripts/sync-3x3-to-waves.ts`:
- Olvas `__agent/state/3x3-log.jsonl`
- Minden sort explode-ol 3 `Wave` row-ra (astral/mental/matter)
- `Wave_DataService.create()` mind a 3-ra
- Idempotens — `ts + kind` unique check (skip ha már van)
- Output: action-log entry (count inserted / skipped)

### 4.B — Auto-sync hook

`WaveJsonl_Controller` `POST /wave/log-public` handler-ben:
- Append jsonl (ez Phase 3.A)
- **Plusz**: ha DB elérhető (try/catch), insert is `Wave_DataService.create()`-tel
- Ezzel DB és JSONL párhuzamosan tölthet → migration zéró-downtime

---

## Adatvédelem / authority

- `__agent/state/3x3-log.jsonl` **dev-agent által írható-olvasható** (alapelv-mátrix szerint)
- `Wave` DB **dev-agent ír** (FR-szerint), nem assistant-tartomány (Domén 2)
- Új feature-flag NEM kell — minden új endpoint feature-állapot szerint default-ON

---

## Acceptance criteria (Phase 2+3+4 összesen)

1. ✅ Dashboard betöltődik AUTH-nélkül is (JSONL-fallback path)
2. ✅ d-waves panel mutatja az utolsó 14 snapshot 3 vonalon (astral/mental/matter)
3. ✅ Latest snapshot mood + note + vector ↗↘→ látszik
4. ✅ Új-snapshot form submitelhető, és a következő poll-ra megjelenik az új pont
5. ✅ JSONL és DB konzisztens (4.A import után, 4.B auto-sync alatt)
6. ✅ Minden hibapont action-log-ba ír (MA-WAVE-JSONL-READ-FAIL, MA-WAVE-JSONL-WRITE-FAIL)
7. ✅ LDP 11/11 zöld minden phase végén

---

## Rizikók / open kérdések

| Q-ID | Kérdés | Mitigáció |
|---|---|---|
| Q-WAVE-1 | Ha a chat AUTH BLOCKER opció (a) szerver-bypass mellett dönt, a JSONL-fallback redundánssá válik | Nem baj — a JSONL-fallback **append-only forrás-of-truth** és Phase 4 sync-hez kell, megmarad |
| Q-WAVE-2 | `wave_vector` mező hiányzik a `Wave` DB schema-ból? | Ellenőrzendő cycle 52 elején — ha hiányzik, Phase 2.A előtt DB migration vagy field hozzáadása |
| Q-WAVE-3 | Mood + note hova kerül a DB-ben? `Wave_DataModel` nem tartalmaz mood/note mezőt | Cycle 53-ban schema-bővítés vagy külön `WaveSnapshot` collection. Phase 4 előtt eldöntendő. |

---

## Cycle-onkénti scope (becsült)

- **Cycle 52** — Phase 2.A (server unauth GET endpoint + mapping util) — ~150-200 LOC, 1 új controller + 1 új util
- **Cycle 53** — Phase 2.B + 2.C (client fallback + mood/note render) — ~100-150 LOC
- **Cycle 54** — Phase 3.A + 3.B (form + POST endpoint) — ~200-250 LOC
- **Cycle 55** — Phase 3 finalize + smoke test
- **Cycle 56** — Phase 4 (sync) — ~150-200 LOC

Összesen 4-5 cycle (cycle 52-56), ha a phase-ek smoothly mennek.

---

## Workflow utánkövetés

- Cycle 51 close-cycle után: STATUS_DEV `active_plan.path = __agent/plans/wave-panel-ui.plan.md`
- Cycle 52 elején: `04-investigate` újraolvassa ezt a plan-doc-ot
- Phase ✅ jelölés cycle-zárásokkor (mint runtime-error-api.plan.md mintáján)

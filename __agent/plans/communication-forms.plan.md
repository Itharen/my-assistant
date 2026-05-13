# Plan — Communication forms (FR #1)

> **Cél:** 3 kommunikációs csatorna (Google Home / Client / CCAP Notification)
> kiépítése a Dev Agent dispatcher + handler-architektúrában.
>
> **Forrás-FR:** `current/feature-requests/communication-forms.md`
> **AGB green-light:** AGB-2026-05-13-04 (chat → dev-agent, 2026-05-13T19:25).

---

## Phase 1 — `ccap-notify` handler (Dev Agent) ⚡

### 1.1 `cli/scripts/agent-handlers/src/types.ts`

- Új `ActionType`: `'ccap-notify'`
- Új `CcapNotifyAction` interface:
  ```ts
  args: {
    title: string;
    type?: 'message' | 'confirm' | 'option-select' | 'question';
    description?: string;
    priority?: 'info' | 'warning' | 'success' | 'error';
    options?: string;          // option-select-hez "a:A,b:B"
    wait?: boolean;            // long-poll válaszra
    sessionId?: string;        // cél CCAP session
  }
  ```
- `Action` unionba felvenni

### 1.2 `cli/scripts/agent-handlers/src/schema.ts`

- `ACTION_TYPES` set-be `'ccap-notify'`
- `REQUIRED_TIER`-be `'ccap-notify': 1`
- Validation case: `title` required string, `type`/`priority` optional enum-validation

### 1.3 `cli/scripts/agent-handlers/src/handlers/ccap-notify.ts` (új fájl)

```ts
import { spawn } from 'node:child_process';
import { logAction } from '../action-log.js';
import type { CcapNotifyAction } from '../types.js';

export async function handleCcapNotify(action: CcapNotifyAction): Promise<void> {
  const args: string[] = ['notify', 'send', '--title', action.args.title];
  if (action.args.type) args.push('--type', action.args.type);
  if (action.args.description) args.push('--description', action.args.description);
  if (action.args.priority) args.push('--priority', action.args.priority);
  if (action.args.options) args.push('--options', action.args.options);
  if (action.args.sessionId) args.push('--session', action.args.sessionId);
  if (action.args.wait) args.push('--wait');

  // Shell-out ccap. NEM swallow-oljuk a hibát (debug-level error handling).
  await new Promise<void>((resolve, reject) => {
    const child = spawn('ccap', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ccap notify send exit ${code}: ${stderr.trim()}`));
    });
  });

  await logAction({
    actor: 'agent',
    kind: 'ship',
    summary: `[ccap-notify] sent: "${action.args.title}" (type=${action.args.type ?? 'message'})`,
    extra: { type: action.args.type, sessionId: action.args.sessionId, wait: action.args.wait },
  });
}
```

### 1.4 `cli/scripts/agent-handlers/src/dispatch.ts`

- Import `handleCcapNotify`
- `executeAction` switch: `case 'ccap-notify': return handleCcapNotify(action);`

### 1.5 Verify (LDP)

- LDP `tsc-cli` zöld (új típus + handler)
- Cli-test változatlan (handler-tesztek később)

---

## Phase 2 — `notify-cast` valódi shell-out (Dev Agent)

> **Külön cycle**, jelen plan-ben placeholder.

A jelenlegi `notify-cast` handler csak logol (PHASE 2 placeholder).
Át kell írni hogy a `ma cast notify` parancsot shell-outra hívja:

```ts
spawn('ma', ['cast', 'notify', '--text', action.args.text, ...]);
```

A `--target`, `--announcement-volume`, `--throttle-id` flagek dokumentálva
a `cli/README.md`-ben.

---

## Phase 3 — Csatorna-választó (chat-felelős)

A Cron Job entrypoint-ban (NEM a Dev Agent dolga). Kihagyva.

---

## Phase 4 — Közös throttle (Dev Agent)

> **Külön cycle**, jelen plan-ben placeholder.

`__agent/state/notify-throttle.json` — `{ throttleId: lastSentAtIso }`
map. Mindegyik handler (notify-cast, ccap-notify) ellenőrzi a saját
`throttleId`-jét, ha < N perc óta küldve volt → skip + log.

Default cooldown: 5 perc / throttle-id. Configurálható per-action `args.cooldownMs`.

---

## Validation summary (per phase)

| Phase | Verify | Várt |
|---|---|---|
| 1 | LDP tsc-cli + cli-test zöld | exit 0, 21+ specs (cli-test változatlan, handler-spec később) |
| 2 | LDP tsc-cli + cli-test + smoke `ma cast notify --target Hálószoba --text "teszt"` | hangos TTS Hálószobán |
| 4 | LDP zöld + lokál JSON smoke `node dispatch.ts < sample.json` | 2× egymás után ugyanaz a throttleId → 2. skip-elve |

---

## Risks & rollbacks

- **`ccap` nem PATH-on:** handler `child.on('error', ...)` → reject + dispatch
  `kind: error` log. Dispatcher tovább megy a következő action-re.
- **`--wait` long-poll timeout:** 5 perc max (ccap CLI). Action-log emit
  + reject. Cron Job tick lehet 5+ perc — opt-in csak ha tudjuk hogy a user éber.
- **Throttle race-condition (Phase 4):** JSON read-modify-write. Phase 4 elején
  `fs.promises.flock` vagy atomic-write pattern.

---

## Status

🔄 **Phase 1 cycle 24-ben (folyamatban).** Phase 2-4 következő cycle-ekben.

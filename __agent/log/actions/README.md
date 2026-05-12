# Action log — append-only, no retention limit

A my-assistant rendszerben **minden akció** (assistant tool-call, döntés,
flow-átmenet, script-művelet, projekt-lifecycle event) IDE kerül naplózásra.

> ⚠️ **Ez NEM az activity-monitor logja.** Az activity-monitor (ablakok, idle
> time) az `activity-monitor/data/` alá ír — gitignored, lokál-only.
> Ez a log viszont **commitolt és pusholt** — ezzel tudjuk a rendszer-fejlődést
> követni session-eken át, és session-crash után is folytatni.

## Hely

```
__agent/log/actions/YYYY-MM-DD.jsonl
```

- **Append-only** — sose írj felül vagy törölj sort
- **Naponta új fájl** (UTC+2 / Europe/Budapest naptári nap szerint)
- **Retention: végtelen** — az egész história commitolva, mert ezzel tudjuk
  hosszan visszanézni mit építettünk és mit nem
- **Format: JSONL** — egy sor egy JSON objektum, parse-olható programmal

## Schema (per sor)

```json
{
  "ts": "2026-05-07T22:50:00+02:00",
  "actor": "claude|cast-notifier|activity-monitor|user|hook|<script-name>",
  "kind": "<lásd lentebb>",
  "summary": "egy mondatos leírás — mit/miért",
  "ref": "<opcionális>",
  "session": "<opcionális — claude session id>",
  "extra": { "<opcionális struktúrált adat>": "..." }
}
```

### Mezők

| Mező | Kötelező | Leírás |
|---|---|---|
| `ts` | ✅ | ISO 8601 timestamp tz-vel (`+02:00` Budapest). |
| `actor` | ✅ | Ki / mi termelte az eseményt. |
| `kind` | ✅ | Esemény típusa (lásd enum). |
| `summary` | ✅ | Egy sor, ember által olvasható. **Ne tegyél bele PII-t / titkokat.** |
| `ref` | ❌ | Pl. fájl-útvonal, `org:task:<id>`, URL, commit-sha. |
| `session` | ❌ | Claude session id ha van. |
| `extra` | ❌ | Bármilyen struktúrált payload. |

### `kind` enum (bővíthető)

| Kind | Mikor |
|---|---|
| `session-start` | Új Claude session indul |
| `session-end` | Claude session lezárul (Stop hook) |
| `user-msg` | User üzenet érkezett (UserPromptSubmit hook) |
| `assistant-turn-end` | Assistant befejezte a turn-jét (Stop hook) |
| `tool-call` | Egy tool meghívva (PostToolUse hook) — granulált |
| `file-edit` / `file-write` | Fájl módosult (Edit/Write tool — derived from tool-call) |
| `bash` | Bash parancs futott (Bash tool) |
| `decision` | Assistant döntött valami nem-trivial dologban — manuálisan írva |
| `flow-start` / `flow-end` | Flow elkezdődött / lezárult |
| `state-change` | `STATUS.md` / `SOURCE_OF_TRUTH.md` állapot változott |
| `ship` | Egy fejlesztés / feature elkészült és élesítve / committed |
| `error` | Valami hibára futott (érdemes naplózni a tanulság miatt) |
| `note` | Szabad-formátumú jegyzet — bármi ami a fentiekbe nem fér |
| `external-action` | Egy külső projekt (cast-notifier, activity-monitor stb.) tett valamit |

## Hogyan írj bele

### Shell-ből / scriptből

```powershell
pwsh scripts/action-log/append.ps1 `
    -Actor "claude" `
    -Kind "decision" `
    -Summary "Action-log infra felállítva" `
    -Ref "__agent/log/actions/"
```

### Node (TypeScript) projektből

```ts
import { logAction } from '../../scripts/action-log/lib.js';
await logAction({
  actor: 'cast-notifier',
  kind: 'external-action',
  summary: 'notify success — All Speakers',
  ref: 'org:task:...',
  extra: { devices: 6, durationMs: 6400 },
});
```

### Automatikusan (Claude Code hooks)

A `.claude/settings.json` hookjai automatikusan írnak `tool-call`,
`user-msg`, `assistant-turn-end`, `session-start` sorokat. Lásd
`scripts/action-log/hook.ps1`.

## Resume protokoll

Új session start-kor:
1. `STATUS.md` (snapshot)
2. **Az utolsó N nap action-logja** (`__agent/log/actions/`) — finomabb felbontás
3. `USER_INPUT.md` `[NEW]` blokkok
4. `SOURCE_OF_TRUTH.md` (modul-state)

Részletek: `CLAUDE.md` → "Action log — kötelező" szekció.

## Új fejlesztések szabálya

**Minden új script / projekt / feature, amelyiknek "akciója" van** (CLI command,
file-művelet, IO, deploy, lifecycle event), **kötelező a action-logba emit-et
beépíteni.** Helper: `scripts/action-log/lib.ts` (Node), `scripts/action-log/append.ps1`
(PowerShell). Lásd a meglévő példákat: `cast-notifier/`, `activity-monitor/`.

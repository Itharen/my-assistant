# agent-handlers — Dispatcher (Assistant Cron + Dev Agent)

> **Komponens-térkép**: `current/principles/system-components.md` — ez a
> dispatcher mindkét agent (#1 Development Agent, #6 Assistant Agent Cron Job)
> JSON output-ját kezeli. A `output.agent` mezővel routol per-agent
> state-fájlra + action-log actor-prefixre.
>
> **Mit csinál:** beolvas egy JSON-t (agent output), validálja, tier-checkeli,
> és sorban végrehajtja az `actions[]`-t a megfelelő handlerek-en keresztül.
> Side-effecteket csinál: `__agent/log/actions/`-ba ír,
> `__agent/USER_INPUT.md`-be új blokkot fűz, `STATUS.md` mezőt frissít,
> notify-cast / ccap-notify shell-out, FR-status csere, plan-step ✅ stb.
>
> **Mit NEM csinál:** nem hív Claude API-t, nem tickel, nem ütemez. Ezt a
> CCAP futtatja.

## Setup

```bash
cd scripts/agent-handlers
pnpm install
pnpm typecheck
```

A `cli/scripts/agent-handlers/` része a LDP-nek (cycle 32 óta) — `tsc-agent-handlers`
step a `pipeline.config.json`-ban. Manuális typecheck nem szükséges.

## Használat (CCAP integráció)

A CCAP minden agent tick-kor:

1. Olvassa be a system-prompt-ot: `__agent/triggers/<agent>-entrypoint.md`
2. Összerakja az inputot (a forrásfájl tartalma) és hívja a Claude API-t
3. A modell strukturált JSON outputot ad
4. Ezt a JSON-t bedobja a dispatcher-be:

```bash
cd <my-assistant-root>
echo '<agent-output-json>' | node cli/scripts/agent-handlers/src/dispatch.ts
# vagy:
node cli/scripts/agent-handlers/src/dispatch.ts --file path/to/agent-output.json
```

A dispatcher minden műveletet:
- validál (séma-check, tier-check, agent-check)
- végrehajt (handler hívása)
- naplóz az action-logba (`__agent/log/actions/<today>.jsonl`, `actor: agent-dispatcher:<agent>`)
- frissíti az adott agent tick state-jét (`__agent/state/<agent>-tick.json` — per-agent routing cycle 34 óta)

A dispatcher **kódját 0 (zéró)** futtatja sikerre, **2** validációs hibára,
**3** runtime hibára. A CCAP ezzel követheti hogy mi történt.

## Output JSON séma

```jsonc
{
  "agent": "assistant-cron" | "development",   // optional; default 'assistant-cron'
  "verdict": "urgens" | "soft-nudge" | "no-action",
  "reason": "...",
  "actions": [ /* lásd Action types */ ],
  "tickMeta": { "tickedAt": "...", "inputDigest": "..." }
}
```

Részletes validátor: `src/schema.ts` (manual). Entrypoint:
`__agent/triggers/{assistant-agent-cron,development-agent}-entrypoint.md`.

## Action types — handler mapping

| Action `type` | Tier | Handler | Cycle | Status |
|---|---|---|---|---|
| `log` | 0 | `src/handlers/log.ts` | — | ✅ MVP |
| `user-input-new` | 1 | `src/handlers/user-input-new.ts` | — | ✅ MVP |
| `update-status` | 1 | `src/handlers/update-status.ts` | — | ✅ MVP (STATUS.md `next_action` / `last_event_type`) |
| `notify-cast` | 1 | `src/handlers/notify-cast.ts` | 29, 30 | ✅ valódi shell-out (`ma cast notify`) + throttle |
| `ccap-notify` | 1 | `src/handlers/ccap-notify.ts` | 24, 30 | ✅ shell-out (`ccap notify send`) + throttle |
| `notify-discord` | 1 | `src/handlers/notify-discord.ts` | 130 | ✅ HTTP POST Discord webhook (embed + mention) + throttle (FR #5b-DISCORD Phase 2) |
| `notify-push` | 1 | `src/handlers/notify-push.ts` | 131 | ✅ HTTP POST ntfy.sh (JSON publish, emoji-safe) + throttle (FR #5b Phase 1) |
| `task-create` | 2 | `src/handlers/task-create.ts` | — | 🅿️ placeholder |
| `task-update` | 2 | `src/handlers/task-update.ts` | — | 🅿️ placeholder |
| `fr-status-change` | 1 | `src/handlers/fr-status-change.ts` | 31 | ✅ FR `## Status` preflight + replace + atomic write |
| `plan-step-mark-done` | 1 | `src/handlers/plan-step-mark-done.ts` | 31 | ✅ stepRef → ✅ append (idempotens, table-cell aware) |

### Throttle (cycle 30)

A `notify-cast`, `ccap-notify`, `notify-discord` és `notify-push` handler-ek közös throttle-eljárást használnak
(`src/throttle.ts`):
- State: `__agent/state/notify-throttle.json` (`{ throttleId: lastSentIso }`)
- Default cooldown: 5 perc; per-action `args.cooldownMs` override
- Cooldown-on belül → `MA-{NOTIFY-CAST|CCAP-NOTIFY|DISCORD|NTFY}-THROTTLED` action-log note, NEM hajtja végre
- Sikeres send után `recordThrottle(throttleId)` (atomic write, tmp+rename)

### Error-handling

A handler-ek strukturált `MA-*` error code-okkal throw-olnak (per
`current/principles/error-handling.md` "SEMMI csendes catch"):

- `MA-FR-FILE-NOT-FOUND`, `MA-FR-STATUS-MISSING`, `MA-FR-STATUS-MISMATCH`, `MA-FR-WRITE-FAIL`, `MA-FR-READ-FAIL`
- `MA-PLAN-FILE-NOT-FOUND`, `MA-PLAN-STEP-NOT-FOUND`, `MA-PLAN-STEP-ALREADY-DONE` (note, not error), `MA-PLAN-WRITE-FAIL`, `MA-PLAN-READ-FAIL`
- `MA-NOTIFY-CAST-BUILD-MISSING`, `MA-NOTIFY-CAST-SPAWN-FAIL`, `MA-NOTIFY-CAST-EXIT-N`
- `MA-DISCORD-NO-WEBHOOK-URL` (env hiányzik), `MA-DISCORD-POST-FAIL` (fetch hiba), `MA-DISCORD-HTTP-ERROR` (4xx/5xx)
- `MA-NTFY-NO-TOPIC` (env hiányzik), `MA-NTFY-POST-FAIL` (fetch hiba), `MA-NTFY-HTTP-ERROR` (4xx/5xx)
- `MA-THROTTLE-READ-FAIL` (stderr, fallback empty)

### notify-discord env-var (FR #5b-DISCORD)

- `MA_DISCORD_WEBHOOK_URL` (**required**) — a Discord csatorna webhook URL-je
- `MA_DISCORD_USER_ID` (opc.) — `mention: 'user'` esetén a `<@id>` ping target
- Args: `title` (req), `message` (req), `priority?` (info/warning/success/error → embed-szín), `color?` (decimal RGB override), `mention?` (user/none), `throttleId?`, `cooldownMs?`
- Discord siker = `204 No Content`. A `content` csak a mention-ping-et hordozza, a strukturált tartalom az embed-ben (title + description).

### notify-push env-var (FR #5b ntfy.sh)

- `MA_NTFY_TOPIC` (**required**) — a topic, amire a user subscribe-olt
- `MA_NTFY_URL` (opc., default `https://ntfy.sh`) — public vagy self-hosted ntfy base-URL
- `MA_NTFY_AUTH` (opc.) — Bearer token (self-host / reserved topic)
- Args: `title` (req), `message` (req), `priority?` (min/low/default/high/max → ntfy 1-5), `tags?` (vesszővel-tagolt emoji shortcode-ok), `throttleId?`, `cooldownMs?`
- ntfy siker = `200 OK`. **JSON publish formátum** (POST a base-URL-re, `{topic,title,message,priority,tags}`) — NEM HTTP-header (Title/Priority/Tags), mert a header-ek csak ByteString-ek → emoji a title-ben (💪) hibát dobna. A JSON body UTF-8-safe.

## Smoke teszt

```bash
pnpm smoke           # log-handler smoke (test/sample-output.json)
pnpm smoke-multi     # multi-handler smoke (log + user-input-new + notify-cast)
pnpm smoke-dev       # Dev Agent routing smoke — validálja cycle 33+34 work-öt
pnpm smoke-discord   # notify-discord smoke (MA_DISCORD_WEBHOOK_URL env kell az élő POST-hoz)
pnpm smoke-push      # notify-push (ntfy.sh) smoke (MA_NTFY_TOPIC env kell az élő POST-hoz)
```

A smoke-dev validálja:
- `output.agent: 'development'` → `actor: agent-dispatcher:development` action-log entry
- Tick state-fájl routing: `__agent/state/development-agent-tick.json` (NEM az `assistant-agent-cron-tick.json`)
- Cron state érintetlen marad

## State (per-agent routing — cycle 34)

| File | Agent | Tartalom |
|---|---|---|
| `__agent/state/assistant-agent-cron-tick.json` | `assistant-cron` | utolsó tick metadata |
| `__agent/state/development-agent-tick.json` | `development` | utolsó tick metadata |
| `__agent/state/notify-throttle.json` | mindkettő | közös throttle map |

## LDP integráció (cycle 32)

A `cli/scripts/agent-handlers/` része a Live Development Pipeline-nak:
- `pipeline.config.json` `watch.paths`: `./cli/scripts/agent-handlers/src` + `tsconfig.json` + `package.json`
- Step: `tsc-agent-handlers` (`npx tsc --noEmit -p scripts/agent-handlers/tsconfig.json --pretty`, `fatal: false`)

Az alapelv #22 (LDP-first) erre is érvényes — fájl-change után az LDP
re-runolja a typecheck-et.

## Pointer

- **Belépési instrukció (agent-prompt)**:
  - `__agent/triggers/assistant-agent-cron-entrypoint.md`
  - `__agent/triggers/development-agent-entrypoint.md`
- **Részletes plan-ek**:
  - `__agent/plans/assistant-agent-cron.plan.md`
  - `__agent/plans/development-agent.plan.md`
- **Forrás-FR-ek**:
  - `current/feature-requests/triggering-system-architecture.md`
  - `current/feature-requests/communication-forms.md` (notify handlerek)
  - `current/feature-requests/automatic-status-recording.md` (fr-status + plan-step)

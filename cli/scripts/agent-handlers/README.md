# agent-handlers — A-mode dispatcher

> **Mit csinál:** beolvas egy JSON-t (az A-mode agent output-ját), validálja,
> tier-checkeli, és sorban végrehajtja az `actions[]`-t a megfelelő handlerek-en
> keresztül. Side-effecteket csinál: `__agent/log/actions/`-ba ír,
> `__agent/USER_INPUT.md`-be új blokkot fűz, `STATUS.md` mezőt frissít, stb.
>
> **Mit NEM csinál:** nem hív Claude API-t, nem tickel, nem ütemez. Ezt a
> CCAP futtatja.

## Setup

```bash
cd scripts/agent-handlers
pnpm install
pnpm typecheck
```

## Használat (CCAP integráció)

A CCAP minden A-mode tick-kor:

1. Olvassa be a system-prompt-ot: `__agent/triggers/A-mode-entrypoint.md`
2. Összerakja az inputot (a 7 forrásfájl tartalma) és hívja a Claude API-t
3. A modell strukturált JSON outputot ad
4. Ezt a JSON-t bedobja a dispatcher-be:

```bash
cd <my-assistant-root>
echo '<agent-output-json>' | node scripts/agent-handlers/src/dispatch.ts
# vagy:
node scripts/agent-handlers/src/dispatch.ts --file path/to/agent-output.json
```

A dispatcher minden műveletet:
- validál (séma-check, tier-check)
- végrehajt (handler hívása)
- naplóz az action-logba (`__agent/log/actions/<today>.jsonl`)
- frissíti az `__agent/state/agent-tick.json`-t

A dispatcher **kódját 0 (zéró)** futtatja sikerre, **2** validációs hibára,
**3** runtime hibára. A CCAP ezzel követheti hogy mi történt.

## Output JSON séma

Lásd: `__agent/triggers/A-mode-entrypoint.md` "Output" szakasz, vagy
`src/schema.ts` (manual validator).

## Action types — handler mapping

| Action `type` | Tier | Handler | Status |
|---|---|---|---|
| `log` | 0 | `src/handlers/log.ts` | ✅ MVP |
| `user-input-new` | 1 | `src/handlers/user-input-new.ts` | ✅ MVP |
| `update-status` | 1 | `src/handlers/update-status.ts` | ✅ MVP |
| `notify-cast` | 1 | `src/handlers/notify-cast.ts` | 🅿️ Phase 2 placeholder |
| `task-create` | 2 | `src/handlers/task-create.ts` | 🅿️ Phase 2 placeholder |
| `task-update` | 2 | `src/handlers/task-update.ts` | 🅿️ Phase 2 placeholder |

## Smoke teszt

```bash
pnpm smoke
# vagy:
node src/dispatch.ts < test/sample-output.json
```

A `test/sample-output.json` egy minimális minta-output, amit a dispatcher
végigfuttat.

## State

- `__agent/state/agent-tick.json` — utolsó tick metadata (ts, counter, last verdict)
- `__agent/state/notify-throttle.json` — Phase 2
- `__agent/state/sleep-cache.json` — Phase 2
- `__agent/state/pending-notifications.json` — Phase 2 (alvás-vége csomag)

## Pointer

- **Belépési instrukció (agent-prompt)**: `__agent/triggers/A-mode-entrypoint.md`
- **Részletes plan**: `__agent/plans/triggering-A-mode-health-check.plan.md`
- **Forrás-FR**: `current/feature-requests/triggering-system-architecture.md`

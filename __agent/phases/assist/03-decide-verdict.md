# Phase 03 — Decide verdict

> A tick verdict meghatározása.

## Verdict-szabályok

### `urgens` — bármelyik teljesül

- Lejárt task `dueDate` (P >= 100)
- Esedékes recurring + 2+ missed cycle
- Sleep-window kezdés ELŐTT 30p (bedtime reminder)
- Sleep-window VÉGE (ébresztő + napi summary)
- USER_INPUT `[NEW]` `domain: <Domén-1>` (interrupt)
- Pénzkereső deadline 24h-n belül (mvp-focus.md)

→ `actions[]`: `notify-cast` (ha éber) + `user-input-new` (esetleg `task-create`)

### `soft-nudge` — bármelyik teljesül

- Csúszó recurring 1 missed cycle (nem urgens még)
- Open-questions h-fontosság >= 7 nap "open"
- Halmozódó FR organizer-be migrálandó
- Stock-item küszöb alatt (rendelés-jelölt)

→ `actions[]`: `user-input-new` (NEM hangos), opcionálisan `ccap-notify`
csendes-text

### `no-action` — alapeset

- Sleep-window aktív + nincs urgens halmozódás → `log` Tier 0
- Nincs változás az utolsó tickhez képest → `log`

## Action-cap (Loop-safety)

Max **5 action** / tick. Ha többre lenne ok → szűkítsd a leg-urgensebbre.

## STATUS_ASSIST update

```yaml
phase_notes: |
  Verdict: <verdict> — <reason>
```

## Action-log emit

```json
{ "kind": "decision", "summary": "Verdict=<X> reason=<Y>" }
```

## Kilépés

`STATUS_ASSIST.phase` → `emit-actions`

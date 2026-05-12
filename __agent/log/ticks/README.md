# Tick log — Assistant Agent Cron Job

> Az Assistant Agent Cron Job (`__agent/WORKFLOW_ASSIST.md`) tick-jeinek
> archívuma. Mivel óránként fut és sokszor csak `log` Tier 0, **NEM**
> minden tickre írunk külön fájlt.
>
> A részletes per-tick history az **action-log**-ban van
> (`__agent/log/actions/<today>.jsonl`, `actor: assistant-agent-cron`
> entry-k).

## Mit tartalmaz ez a mappa

| Fájl | Mit |
|---|---|
| `daily-summary-YYYY-MM-DD.md` | napi összegzés a Cron Job tickjeiről (24 tick / nap esetén) |
| `events-YYYY-MM-DD.md` | a napi event-trigger-ek listája (on-sleep-window-start/end, on-overdue, stb.) — opcionális |

## Mikor írunk fájlt

- **Napi summary:** a következő nap első tickjében (`00-orient` előtt) — az
  előző nap action-log entry-it aggregálja
- **Events log:** opcionális, ha sok event volt egy nap (>5)

## Karbantartja

`phases/assist/05-close-tick.md` — minden tick végén ellenőrzi, ha új nap
és tegnap nincs daily-summary → írja meg

## Retention

Korlátlan. Action-log a részletes forrás.

## Pointer

- Workflow: `__agent/WORKFLOW_ASSIST.md`
- Action-log: `__agent/log/actions/<today>.jsonl`

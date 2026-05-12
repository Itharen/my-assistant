# Phase 04 — Emit actions

> A `decide-verdict` kimeneteit átadod a dispatcher-nek (output JSON).

## Output JSON szerkezet

Lásd `WORKFLOW_ASSIST.md` "Output JSON séma" szakasz.

```json
{
  "verdict": "urgens" | "soft-nudge" | "no-action",
  "reason": "...",
  "actions": [
    { "type": "log", "tier": 0, "args": { "kind": "note", "summary": "..." } },
    { "type": "notify-cast", "tier": 1, "args": { "text": "...", "throttleId": "..." } },
    { "type": "user-input-new", "tier": 1, "args": { "title": "...", "kind": "task", "domain": "tasks", "body": "..." } },
    { "type": "task-create", "tier": 2, "args": { "title": "...", "description": "Forrás-szabály: recurring-tasks.md takarítás-csúszás", "priority": 95, "dueDate": "..." } }
  ],
  "tickMeta": {
    "tickedAt": "ISO-8601 +02:00",
    "inputDigest": "1-mondat összefoglaló"
  }
}
```

## Tier-szabály érvényesítés (dispatcher fogja)

A dispatcher (`cli/scripts/agent-handlers/src/dispatch.ts`) érvényesíti:
- Tier mismatch → reject
- Tier 2 `task-create` description-ben "Forrás-szabály: ..." kötelező
- Tier 3 → reject (autonóm tilos)
- Sleep alatt Tier 1+ → skip + alvás-vége csomag (Phase 2)

## Throttle-ellenőrzés

Ha `notify-cast` / `ccap-notify` `throttleId` 4 órán belül már elment →
hagyd ki az action-t, írd egy `log` Tier 0 entry-be.

## Output csatorna

**stdout** — a JSON-t a dispatcher fogja parse-olni.

## Kilépés

`STATUS_ASSIST.phase` → `close-tick`

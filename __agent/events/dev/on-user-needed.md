# Event — on-user-needed

> Általános user-input / clarification / approval kérése.

## Csatorna-választás (lásd `WORKFLOW_DEV.md` 16. alapelv)

| Sürgősség / típus | Csatorna | Action-type |
|---|---|---|
| **Tier 3 javaslat** (deploy / paid API / release) | USER_INPUT `[NEW]` `kind: approval` `domain: dev` | Tier 1 `user-input-new` |
| **FR-konfliktus / kétértelmű plan-step** — clarification | USER_INPUT `[NEW]` `kind: instruction` `domain: dev` | Tier 1 `user-input-new` |
| **Sürgős döntés** (build-failure blokkol) | `ccap-notify` `--type question --wait` (Phase 2) | Tier 1 `ccap-notify` |
| **Long-term open Q** | `open-question-add` (Phase 2 új handler — AA) kategória) | Tier 1 |
| **Heti zaj-csökkentett** | Cron Job napi digest gyűjti | (cross-agent) |

## Munka-folytatási szabály

- **Nem-blokkoló kérdés** → kérdés feltevése **után folytasd** a többi
  plan-step-en. `verdict: soft-nudge`.
- **Blokkoló kérdés** → `verdict: no-action` + `reason: "blokkolva — várja Q-... választ"`,
  a cycle áll.

## FR-konfliktus jelölés

Ha egy FR-t változtatnál de pontosítás kell:
- **NE** módosítsd autonóm
- `fr-status-change` Tier 1: Status → `🟡 Várakozó (kérdéssel: Q-...)`
- + USER_INPUT [NEW] a clarification kérdéssel

## Action-log emit

```json
{ "kind": "note",
  "summary": "User needed: <téma>, csatorna=<csatorna>, blokkolt=<bool>" }
```

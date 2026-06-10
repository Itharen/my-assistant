# FR: Server route spec-fájlok

> **Forrás:** Dev Agent pattern-audit AGB-2026-05-13-03 (2026-05-13).

## Cél

A `server/src/_routes/*/` mappákba jelenleg csak `*.controller.ts` és
`*.data-service.ts` található spec nélkül. Master-prompter konvenciója:
controller + spec + data-service + spec páros.

## Scope

| Route | Mit |
|---|---|
| `_routes/wave/` | `wave.controller.spec.ts` + `wave.data-service.spec.ts` |
| `_routes/notification/` (ha lesz Phase 1-ben) | spec paros |
| Új route-ok | konvenció kötelező onnantól |

## Status

🟡 Low-prio backlog (yellow). Akkor érdemes felvenni, amikor a Phase 2 spec-coverage
target (e.g. >80%) kerül napirendre.

## Kapcsolódik

- `__agent/AGENT_BUS.md` AGB-2026-05-13-03 pattern audit
- `cli/_specifications/` patterns

# Cycle archívum — Development Agent

> A Development Agent (`__agent/WORKFLOW_DEV.md`) befejezett cycle-jeinek
> archívuma. Egy fájl per cycle: `cycle-N.md`.
>
> Karbantartja: `phases/dev/13-close-cycle.md` írja minden cycle végén.

## Fájl-formátum

```markdown
# Cycle N — <YYYY-MM-DD>

## Anchor + scope
- Anchor: <FR / task>
- Cluster: [...]
- Cluster-area: cli | server | client | workflow | …

## Mit csináltunk
- <1-5 bullet, max 200 szó>

## Eredmények
- Commit-sha: <sha>
- Build-status: success/failed
- Test-status: success/failed
- FR-status-changes: [{from, to, frPath}]
- Plan-step-done: [{planPath, stepRef}]
- Files-modified: N

## Open (átviszi a következő cycle-be)
- Blocker / kérdés / clarification needed
```

## Retention

Korlátlan — soha ne töröld. 10-enkénti `maintenance-grooming` ezt nem érinti.

## Pointer

- Workflow: `__agent/WORKFLOW_DEV.md`
- Close-cycle fázis: `__agent/phases/dev/13-close-cycle.md`

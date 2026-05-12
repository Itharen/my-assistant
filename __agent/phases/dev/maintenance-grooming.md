# Phase Maintenance — Grooming

> 10-enkénti cycle vagy size-threshold: FR / backlog / plan konszolidáció.

## Mikor fut

- 10-enkénti cycle (lifetime)
- VAGY méret-küszöb: backlog 🟢 sorok > 5 / `current/feature-requests/` > 30 fájl
- VAGY user-trigger

## Mit csinálj

1. **Backlog konszolidáció** (`__agent/triggers/development-agent-backlog.md`):
   - Shipped FR-ek → ✅ szakasz
   - Stale 🟡 (>30 nap nincs mozgás) → review: 🅿️ parkolásra vagy boost
   - 🟢 prio újra-rendezés mvp-fókusz szerint

2. **FR-állomány review** (`current/feature-requests/`):
   - Status szinkron a backlog-gal
   - Open-questions a FR-ekben listázva → `current/open-questions.md`-ben is

3. **Plan-archive** (`__agent/plans/`):
   - Shipped plan-ek → `__agent/plans/_archive/` (ha létezik) vagy `Status: ✅ Shipped`
   - Stale plan-ek → review

4. **Action-log rotálás** (>10000 sor egy fájlban → gzip előzőeket)

## Soha NEM csinálsz

- User-origin tétel TÖRLÉS (FR / principle / open-question) — **csak archive**
- Plan-fájl TÖRLÉS — archive

## Action-log emit

```json
{ "kind": "note", "summary": "Grooming: N FR archive, M backlog refresh",
  "extra": { "fr_archived": N, "backlog_reordered": [...] } }
```

## Kilépés

`STATUS_DEV.phase` → `idle` (vissza `00-orient`-re a következő cycle-ben)

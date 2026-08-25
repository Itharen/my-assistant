# SP-03.2 — Cycle detection, dedup & budgets

**Status:** verified
**Evidence:** A-B-A, no-progress, budget partial, stable-key merge and resume tests.

## Munka

- Stable item key + page signature; duplicate és A→B→A cycle detector.
- `maxItems`, `maxPages`, `maxDurationMs`, `noProgressThreshold`, `stabilityWindowMs`.
- Partial result + resume token + exact stop-reason; total-hint consistency check.

## Acceptance

- [ ] Nincs végtelen loop üres/ismétlődő/hibás next esetén.
- [ ] Deduplikáció nem nyeli el azonos nevű, külön ID-jú termékeket.
- [ ] Budget stop nem jelent complete-et.

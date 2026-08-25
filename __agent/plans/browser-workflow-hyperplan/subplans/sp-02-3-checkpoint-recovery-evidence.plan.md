# SP-02.3 — Checkpoint, recovery & evidence

**Status:** verified
**Evidence:** atomic checkpoints/evidence, stale guard and durable traversal-resume test.

## Munka

- Durable checkpoint: URL, page cursor, state hash, completed item keys, pending effect, evidence refs.
- Resume validator és compensation/cleanup a részleges reversible mutationökhöz.
- Redacted DOM/screenshot/log bundle; retention és PII policy.

## Acceptance

- [ ] Process kill után determinisztikus resume működik.
- [ ] Stale checkpoint fail-closed és új observationt kér.
- [ ] Evidence bundle-ből minden döntés és effect rekonstruálható.

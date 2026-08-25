# SP-07.2 — Tuning & site-profile lifecycle

**Status:** verified
**Evidence:** redaction, failure case, replay+canary evidence and immutable semantic-version history tests.

## Munka

- Failure → redacted fixture → root-cause class → profile/code fix → full replay → live canary → promotion.
- Versioned site-profile: semantic locators, pagination hints, stability windows, wait/postcondition policies.
- Ne legyen selector-spaghetti: fallback sorrend role/name → stable attribute → structural selector → human gate.

## Acceptance

- [ ] Minden tuning-változás konkrét failure evidence-re vezethető vissza.
- [ ] Corpus replay regressionmentes a promotion előtt.
- [ ] Historical profile/evidence megmarad diagnosztikára; nincs néma config overwrite.

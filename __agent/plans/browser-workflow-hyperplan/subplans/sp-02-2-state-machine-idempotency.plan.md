# SP-02.2 — State machine & idempotency

**Status:** verified
**Evidence:** state-machine guards, effect receipts, fencing/lease, drift/takeover variants J-001/J-008.

## Munka

- Állapotok: observe → plan → ready → acting → verifying → checkpointed/blocked/completed.
- Precondition/postcondition/effect contract; stable `effectId` és replay protection.
- Mutation előtt fresh observation; drift esetén re-plan, nem vak action.
- Per-profile single-writer lease + globális foreground OS-input mutex; heartbeat, expiry és safe cancellation.
- User-takeover/interference külön state: input megáll, fresh observation után folytatható.

## Acceptance

- [ ] Illegal transition type/runtime guarddal tiltott.
- [ ] Ugyanaz a mutation kétszeri kérésre legfeljebb egyszer hat.
- [ ] Postcondition mismatch részletes evidence-szel blocked/failure.
- [ ] Két agent egyidejű mutation-kérése sorba áll vagy leíró lease-conflicttal fail-closed.

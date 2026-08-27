# SP-05.3 — Delivery reconciliation & Organizer feedback

**Status:** in-progress — real Tesco delivery evidence acquired; parser + Organizer write gate pending
**Evidence:** 2026-08-27-en a user kézzel továbbította a Tesco végleges rendelési összesítőjét a menedzselt mailboxba. A levél olvasható a `ma email` CLI-vel és tartalmazza a végleges mennyiségeket, helyettesítési és elérhetetlenségi eredményeket. A strukturált parser és az ordered-vs-delivered reconciliation még nincs lezárva; shopping `organizer-partial`, ezért live write+readback approval/verification gate mögött marad.

## Munka

- Order confirmation + electronic delivery note parser, product ID/name/quantity/substitution mapping.
- Ordered vs offered vs accepted/delivered diff; missing/rejected/substituted outcome.
- Organizer shopping read; write a jelenlegi `organizer-partial` authority szerint approval/verification gate-tel.
- Reuse the existing `ma email` read path; expose the parser as the agent-agnostic
  foreground command `ma tesco reconcile --latest-email --dry-run`.
- No mailbox polling. Automatic triggering is a later optional phase and may
  only use a real push event; the first release is an on-demand, one-shot CLI.
- Redact delivery/contact/payment fields before persistence; use message/order
  identity for idempotent replay protection.

## Acceptance

- [ ] Minden ordered line pontos outcome-ot vagy explicit unresolved állapotot kap.
- [ ] Missing item nem sikkad el; deduplikált retry metadata-val visszakerül.
- [ ] Organizer write visszaolvasással és action-log correlationnel bizonyított.
- [ ] A mostani Tesco final-summary redacted fixture-ként parser regression
      tesztet ad, cím/telefon/kártyametaadat nélkül.
- [ ] Ismételt futás ugyanarra a message/order kulcsra nem növeli kétszer a
      készletet.

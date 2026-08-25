# SP-06.2 — User journeys & live canary

**Status:** verified
**Evidence:** 13 automated journey tests + 54/54 live read canary + dedicated 34-line/81-item Tesco write and
independent trolley audit green; the desired cart state was intentionally retained and checkout was not started.

## Munka

- Serial journey: agent discovery → search multi-page → match → cart diff → verified mutation → cleanup.
- Variáns journeys: interruption/resume, session expiry, no-result, duplicate page, virtual cart, approval decline,
  concurrent-agent lease conflict, remote-relay cancel és user-takeover.
- Live Tesco canary read-only; live write acceptance supervised és cleanup-os, CI coverage-et nem helyettesít.

## Acceptance

- [ ] Journey-k cross-feature-ek, valódi state carry-forwarddal és lépésenként business assert-tel.
- [ ] Minden journey cleanupot hajt végre.
- [ ] Live canary driftet jelez, de nem mutál kosarat automatikusan.

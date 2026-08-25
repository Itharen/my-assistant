# SP-03.1 — Pagination models & adapters

**Status:** verified
**Evidence:** six model fixtures + combined load-more/virtualized coverage.

## Munka

- Adapterek: numbered/page-link, next-link, load-more, cursor, infinite-scroll, virtualized-list.
- Auto-detect csak evidence-alapon; site-profile explicit override-ot adhat.
- Page observation: items, stable keys, next control/cursor, count hint, completion evidence.

## Acceptance

- [ ] Mind a hat modell controlled fixture-rel tesztelt.
- [ ] Kombinált modellek (load-more + virtual scroll) támogatottak.
- [ ] Detection uncertainty explicit és nem indít destruktív traversal-t.

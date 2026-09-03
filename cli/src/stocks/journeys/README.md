# Stock mirror journey catalogue

| Journey | Entry → value → continuation | Business assertions | Automated owner |
|---|---|---|---|
| Organizer stock refresh | `ma stocks mirror` → every stock/item page → atomic local snapshot → later refresh | all pages represented; raw fields preserved; refreshed quantity replaces old snapshot; two action-log events exist | `stocks-mirror.journey-e2e.spec.ts` |

## Variants

- Pagination and empty child stock: `organizer-stock-mirror.service.spec.ts`.
- Organizer rejection / malformed response: structured fail-closed errors in `organizer-stock-mirror.service.spec.ts`.
- Pagination interruption safety: cursor-loop detection leaves the previous complete snapshot untouched.
- Dry-run: every page is validated and action-logged without creating or replacing a snapshot.
- Repeated refresh: the journey carries the first output path into the second refresh and validates replaced state.

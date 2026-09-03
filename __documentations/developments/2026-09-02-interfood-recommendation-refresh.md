# Interfood recommendation refresh — 2026-09-02

Request: recommend again using all clarified preferences; no code change, cart mutation or checkout requested.
Full canonical rules remain in `current/principles/interfood-food-preferences.md` and the preference JSON.

## Evidence and outcome

- Public `weeks` again enabled current/future W36/W37/W38; W39 disabled. Fresh W37/W38 menus and plans were read.
- `orders sync --from-year 2022 --summary` failed with `UBH-BROKER-NOT-RUNNING-001`. No repeated retry, login window
  or broker installation attempted. Existing snapshot remains complete, dated `2026-09-01T06:19:06.968Z`.
  Read-only coverage against that cache: W36 two/day covered, W37/W38 zero/day. User output discloses this freshness
  limit and does not claim a freshly synchronized account.
- Exact history: camembert pumpkin risotto one prior day, chicken/sauerkraut potato bake two prior days. Thus
  neither favorite-family quantity-two choice is an unseen trial. Lúdláb eleven days and bean soup eight days
  remain only confirmation candidates; no preference was silently promoted.
- Full ingredient review found apple in the chicken/mozzarella salad and chicken thigh in generic poultry loaf;
  neither is included. The Thai-chicken literal-pattern limitation remains compensated in review, not fixed in
  this recommendation-only request. A breast-based wrap/quesadilla and roast turkey add variety without overriding
  the exact pulled-chicken tortilla dislike. No new preferences were written.
- Chicken couscous comes with thigh, and tofu couscous with mushroom; neither is forced into the main plan.
- Milk/cream scope remains exact. Direct milk in breaded camembert is highlighted in an optional alternative.
  Trace-milk statements on camembert risotto/bean soup are shown and remain owner questions, not safety clearance.
- Current owner artifact: `current/interfood/proposals/2026-W37-W38-review-2.md`; lossless selection data:
  `current/interfood/proposals/2026-W37-W38-selection-2.json`. All chosen occurrences were checked fresh for
  date, availability, portion and price. W37 total 18,355 HUF / ten main portions; W38 19,555 HUF / ten portions.

## Verification and writeback

No application code changed; the previous 238-spec result is historical, not claimed as rerun for this read-only
task. Current artifact checks verify ten daily rows, exactly two main units/day, live occurrence/date availability,
correct totals and actual small portions. Human review checks labels, favorite priorities, ingredient conflicts,
same-table alternatives, conditional extras, no user-facing IDs and no account mutation.

Operational lessons were written to the flow, runbook and SKILLS; previous owner review marked superseded. FAM and
semantic action log receive the new artifact pointer. No new domain, preference, order or automation was created.

# plans/

Ad-hoc tervdokumentumok. Akkor használjuk, ha egy nem-triviális akció / projekt
előtt strukturált tervezésre van szükség.

## Mikor írj plan-t

- Új flow definíció (jóváhagyás kell végrehajtás előtt)
- Új domain bevezetése
- Nagyobb feladat-bontás (több sub-task, blokkolók, függőségek)
- Hosszabb távú projekt kickoff

## Konvenciók

- Fájlnév: `{tema}.plan.md`
- Frontmatter / fej: `Status: draft | awaiting-approval | approved | in-progress | done | rejected`
- Hivatkozz `STATUS.md` `active_plans` listájából

## Plan szerkezet (sablon)

```markdown
# {Plan címe}

**Status:** draft
**Created:** {YYYY-MM-DD}
**Owner:** itharen3@gmail.com

## Cél
{1-2 mondat}

## Indoklás
{miért most, miért így}

## Lépések
1. ...
2. ...

## Acceptance criteria
- [ ] ...

## Kockázatok / nyitott kérdések
- ...
```

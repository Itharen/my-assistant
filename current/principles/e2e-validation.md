# E2E validation — minden feature end-to-end teszttel

> **Univerzális hard rule.** A user explicit kérése (2026-05-16):

---

> szeretném, hogy mindent validáljon end-to-end tesztekkel a devagent.

---

## Szabály

**Minden új feature / FR / Phase ship-elésénél** kötelező:

1. **Unit teszt** (a kódbázis meglévő `*.spec.ts` mintáit követve — cli/server/client mind)
2. **Integration teszt** (komponens-összhang, ha érintett)
3. **End-to-end teszt** — **az egész flow** lefutása valós futási környezetben (server + client + CLI együtt, vagy bármilyen end-to-end smoke)

Az E2E **akkor is kötelező**, ha a feature csak a server-t vagy csak a klienst érinti — mert az **integráció** szempontjából a runtime egész lánc validációja szükséges.

## Dev Agent felelőssége

- A `08-verify-local` fázis **bővítve**: LDP green ✅ + **E2E green ✅** is kell a commit-hoz
- Új FR plan-doc Phase-elésében külön sor: `Phase N+1: E2E test`
- Master-prompter / livirrium **E2E-pattern**-eit nézze meg (Playwright / supertest / cypress-szerű minta — projekt-tipikus)

## E2E-keret választás

| Réteg | Eszköz (jelölt) | Megjegyzés |
|---|---|---|
| Server REST | `supertest` + Jasmine | meglévő `*.spec.ts` minták |
| Client UI | `Playwright` vagy `Cypress` | FOSS, no-paid-solutions OK |
| CLI | direkt shell-out + envelope-assertion | "ma X Y" futtatás + JSON-envelope parse |
| Full-stack | server + client + CLI együtt indítása + scenario-script | LDP-szerű, post-deploy smoke |

→ **Választás user-OK** mielőtt egy konkrét eszközt bevezetnénk. Kezdetnek
**supertest** server-re + **Playwright** kliensre **jelölt javaslat** (FOSS, mainstream).

## LDP integráció

A `pipeline.config.json` (live dev pipeline) **bővítendő** egy `e2e` step-pel:
- preconditions: server + client buildek green-ek
- post-step: full-flow scenario lefuttatása
- status.json-be exit-code és coverage

## Status

🟢 **Univerzális, érvénybe lép azonnal.** Új FR-ek plan-doc-jának kötelező Phase-eleme.

## Kapcsolódik

- `current/principles/error-handling.md` — minden error-pálya is E2E-teszttel megerősített
- `current/feature-requests/runtime-error-api.md` — az error-API E2E-tesztje pl. injektált 500-as válasz + log-entry-verify
- `LIVE-projects/master-prompter/` — pattern-source (E2E layout)

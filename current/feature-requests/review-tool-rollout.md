# FR: Review tool — finomítás + cross-project bevezetés

> **Forrás: a user szövege (2026-05-10).** Prioritás-ügy — "minél előbb".

## A user szövege

> Újra és újra nagyon felkúrja az agyamat, hogy a [ágensek], hiába mondogatom
> nekik, hogy kövessék a patterneket, újra és újra, újabb és újabb
> faszságokat és szarságokat találnak ki, amire amúgy már egyszer
> elkészítettünk egy review toolt, de az a review tool még nincsen
> százszázalékosan kifaszázva, és nincsen bevezetve kb. sehol, csak a CCAP
> Revision projektben. Ezt jó lenne minél előbb bevezetni, illetve
> kifaszázni.

## Probléma

Az ágensek **pattern-megsértései** ismétlődő frusztráció-forrás:
- Kreatív "új megoldásokat" találnak ki helyette
- FDP / saját pattern-eket figyelmen kívül hagyják
- A user manuális mondogatás nem elég

## Megoldás (már létezik!)

**Review tool** — már elkészítve a **CCAP Revision** projektben. De:

| Hiba | Megoldás |
|---|---|
| Nincs 100%-osan "kifaszázva" (= befejezve, finomítva) | Befejezés szükséges |
| Csak CCAP Revision-be bevezetve | **Roll-out** minden ágens-vezérelt projektbe |

## Hol kéne bevezetni (cross-project rollout)

Becslés (rangsor a fontosság szerint):

| Projekt | Helyszín | Prio |
|---|---|---|
| **CCAP Revision** | már megvan | ✅ kész |
| **my-assistant** (cli/server/client) | minden agent-touch | 🟢 magas |
| **Organizer** (LIVE-projects/organizer) | folyamatos agent-fejlesztés | 🟢 magas |
| **Master Prompter** | pénzkereső, agent-vezérelt | 🟡 közepes |
| **Service projekt** | pénzkereső | 🟡 közepes |
| **FDP Global Token Purchase** | "régóta nem tart" | 🟡 közepes |
| **HelloCIA** | 5 év csúszás 90%-on | 🟢 magas (decomposition előtt is jól jönne) |
| **Niche Datasets** | agent-driven | 🟡 közepes |

## Status

🟢 **Magas prio** (user "minél előbb"). FR felírva 2026-05-10.

A részletes ütemezés / tényleges build-ki a CCAP team / másik agent dolga
(lásd `current/principles/working-style.md` 2026-05-08 scope-elhatárolás).
**Itt csak a my-assistant rendszer-szintű emlékeztető.**

## Kapcsolódás

- `current/principles/methodology-authority.md` — a pattern-követés alapelv
- `current/principles/working-style.md` — scope: én = workflow-doc, build = másik agent
- `current/feature-requests/ccap-local-stabilization.md` — kapcsolódó CCAP-stabilitás
- `current/notes/ccap-tasks-batch-later.md` — DE ez NEM oda kerül (más scope, cross-project tooling, sürgős)

## Open kérdések

❓ Q-review-1: Mit jelent pontosan a "100%-osan kifaszázva"? Mi hiányzik a review toolból?
❓ Q-review-2: Hogyan integrálódik egy új projektbe? (CLI / pre-commit hook / CI lépés / pipeline.cicd.config.json step?)
❓ Q-review-3: Milyen pattern-eket ellenőriz? (FDP naming / imports / file-szerkezet / saját szabályok?)
❓ Q-review-4: Rollout sorrend — a fenti rangsor OK, vagy más szempont szerint?
❓ Q-review-5: Ki vezeti a roll-out-ot? (CCAP team? Másik agent? User?)
❓ Q-review-6: Milyen jelentés-formátum (action-log emit? PR-komment? Discord?)

# Recording discipline — "jegyezz fel" = kötelező, organizer-elsődleges (KRITIKUS)

> **Univerzális hard rule.** Forrás: user 2026-05-29. Working-style szintű.

---

## User szövege (verbatim)

> Ha azt mondom, hogy jegyez fel valamit, és ezt nem jegyzett fel megfelelően,
> az kritikus hiba. Mindenhol meg kell legyen. Elsősorban az organizerben. És a
> lokális jegyzeteid, azok félrevezetőek.

---

## Strukturált szabály

Amikor a user azt mondja **"jegyezz fel"** (vagy bármilyen rögzítés-kérés):

1. **Megfelelő rögzítés KÖTELEZŐ.** A nem-megfelelő / elmaradt rögzítés
   **kritikus hiba** — nem "majd később", nem "csak lokálba".
2. **Mindenhol meg kell legyen.** Több helyre, redundánsan.
3. **Elsősorban az organizerbe.** Az organizer a kanonikus cél — a tasks /
   notes / stb. oda kerüljön (`fo {modul}.create`).
4. **A lokális jegyzet önmagában félrevezető.** A `current/` markdown csak
   **másodlagos tükör / fallback** — sosem helyettesíti az organizert. Ha valami
   CSAK lokálban van, az a user szemszögéből gyakorlatilag elveszett.

## Mit jelent a gyakorlatban

- Minden rögzítés-kérésnél: **organizer write ELŐSZÖR** (`fo tasks.create` /
  `fo notes.create` / megfelelő modul), **plusz** lokál tükör a `current/`-ben az
  org-ref-fel (`org:task:...` / `org:note:...`).
- Ha az **organizer nem elérhető** (auth/hálózat) → ez **P0 blokkoló**:
  azonnal jelezni a usernek, lokál fallback-be írni (`current/tasks/inbox.md`),
  és **organizer-sync amint helyreáll**. A lokál-only állapot ideiglenes és
  explicit jelölt (`⏳ pending organizer sync`).
- Visszaigazolás a usernek: **hova** került (org-ref + lokál path).

## Miért

A user az organizerből dolgozik (az a saját rendszere, ld.
[[methodology-authority]]). Ha valami csak a Claude lokál markdown-jában van,
a user nem látja, nem onnan él → "félrevezető". A rögzítés célja, hogy a user
**megbízhasson** benne: amit mondott, az **biztosan ott van ahol keresni fogja**.

## Kapcsolódik

- `__agent/SOURCE_OF_TRUTH.md` — modulonkénti organizer vs lokál
- `current/principles/ssot.md` — egy adat = egy kanonikus forrás
- `current/feature-requests/kitchen-note-capture.md` — capture-csatorna a rögzítés súrlódásának csökkentésére

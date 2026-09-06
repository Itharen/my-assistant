# Személyes inventory — mim van, amit magammal vihetek

> **Owner-kérés (2026-09-07):** *„Ezek olyan dolgok amúgy amúgy nekem vannak, egy ilyen
> inventory-t is elkezdhetünk összerakni, by the way, ami vannak nekem és……az jó, ha tudod,
> hogy milyen itemjeim vannak."*

## ⛔ HATÁROLÁS — mi NEM tartozik ide

> **Owner, ugyanott:** *„Plusz amúgy van egy egész háztartás vezetés az organizerben. de az
> más, ezeket az itemeket oda ne vegyük föl"*

| | |
|---|---|
| ✅ **IDE tartozik** | **hordozható, személyes** tárgyak — amit magával VISZ, amikor elmegy otthonról |
| ⛔ **NEM ide** | **háztartás** — az az **organizerben** él, külön rendszerként. Ezeket a tételeket oda **nem** vesszük fel. |
| ⛔ **NEM ide** | fogyóeszköz-készlet (mosószer, élelmiszer) → `current/stock/` |

---

## A tételek

> Ez a lista a user 2026-09-07-i felsorolásából indul. **Bővítendő** — ahogy szóba kerülnek
> további tárgyak, ide jönnek.

| Item | Kategória | Megjegyzés |
|---|---|---|
| 🎧 **Füles** | audio | |
| 👓 **Szemüveg** | viselet | |
| ⌚ **Okosóra** | viselet / tech | |
| 💧 **Víz** *(kulacs/palack)* | ellátmány | ❓ kulacs vagy vett víz? |
| 👛 **Tárca** | alap | |
| 🎫 **Jegy / bérlet** | alap | ❓ BKK bérlet vagy alkalmi jegy? — lásd `open-questions.md` I-3 |
| 📱 **Telefon** | alap | |

### ❓ Amit még nem tudok (nem találgatom)

- Van-e **powerbank / töltő / kábel**?
- **Táska/hátizsák** — melyik, mikor?
- **Laptop** — konferenciára viszi?
- Van-e **névjegykártya**?
- Gyógyszer / szemcsepp / bármi rendszeres?

---

## Alap-készlet („mindig velem")

> ❓ **NYITOTT** — a user még nem mondta meg, mi a fix mag. *(`open-questions.md` I-5.)*
> Feltételezésem lenne rá, de ⛔ **nem találgatok** — megkérdezem.

**Valószínű mag** *(assistant-javaslat, MEGERŐSÍTENDŐ):* telefon · tárca · jegy/bérlet ·
kulcs · szemüveg

---

## Esemény-típus szerinti kiegészítők

| Esemény-típus | Amit hozzá visz | Státusz |
|---|---|---|
| **Konferencia / summit** | füles · okosóra · víz · *(powerbank?)* · *(névjegy?)* | ❓ megerősítendő |
| Bolt / bevásárlás | — | ❓ |
| Edzés / Gellért-hegy | — | ❓ |
| Hivatalos ügy | — | ❓ |

---

## Indulás előtti teendők (nem tárgy, hanem művelet)

> **Owner, 2026-09-07:** *„Ja, meg kenjem be a lábamat indulás előtt körömvirágkrémmel."*

| Teendő | Mikor | Forrás |
|---|---|---|
| 🔋 **TELEFON FELTÖLTÉSE** | **esemény / kimozdulás ELŐTT** | user, 2026-09-07 |
| 🦶 **Láb bekenése körömvirágkrémmel** | **indulás előtt** | user, 2026-09-07 |

> **Owner, 2026-09-07 (szó szerint):** *„események előtt emlékeztes, hogy… Töltsen fel a
> telefonomat. Kimozdulás van, akkor legyen feltöltve, nem erüljek le."*
>
> ⭐ Ez **nem javaslat, hanem állandó emlékeztető**: MINDEN esemény/kimozdulás előtt jár.
> ⚠️ **Időzítés számít:** a töltés időbe telik, tehát ez nem az „indulás előtt 2 perccel"
> teendő, hanem a **készülődés KEZDETÉN** — vagy még előtte, este.

⚠️ Ez **a készülődés része**, tehát a `schedule-guardian` flow készülődés-checklistjébe
tartozik — nem az inventoryba. Itt azért szerepel, hogy egy helyen legyen az „indulás előtt"
teljes képe.

❓ **NYITOTT:** ez **minden** induláskor kell, vagy csak bizonyos esetekben / időszakban?

---

## Kapcsolódó

- `__agent/flows/recurring/schedule-guardian/README.md` — a „mit vigyek" checklist innen épül
- `current/stock/` — fogyóeszköz-készlet (más rendszer)
- Háztartás → **organizer** (⛔ ide nem duplikáljuk)

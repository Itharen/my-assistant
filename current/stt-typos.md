# STT typos — tipikus félrehallások + assistant-misinterpretation

> A user STT-vel (speech-to-text) diktál. A transzkriptek **rendszeresen**
> tartalmaznak félrehallásokat / typo-kat. Ez a fájl a már észrevett
> mintákat gyűjti, hogy az assistant **csendben javítsa** őket, ne kérdezzen
> vissza minden alkalommal.
>
> **Új minta felvétele:** ha a user javít egy típus-elírást ("nem X, hanem Y"),
> kerüljön ide.
>
> ⚠️ **Assistant-failure mintázat is ide kerül**: amikor az STT helyes szót ad,
> de én **rosszul interpretálom** és tévesen "javítom" más szóra (pl. niche →
> Nietzsche). Ezeket KÜLÖN figyelni kell — alapszabály: ha a user kontextusa
> egyértelmű (pl. "0. pénzkeresési próbálkozás", "datasets piacra vitele"),
> NE normalizáljam ismert szóra ami nem illik a kontextusba.

---

## Felvett minták

| Hibás (STT vagy assistant-misinterpretation) | Helyes | Kategória | Forrás |
|---|---|---|---|
| Terra | **TERA** | projekt-név | 2026-05-07 user korrekció (kétszer) |
| **⚠️ KRITIKUS — assistant-failure**: Neach Adata Set / Niesche / Nietzsche / Nitzche | **niche datasets** (kisbetűvel — niche piaci szegmens dataset-csomagok) | projekt-név | 2026-05-07 user korrekció (KÉT KÖR — eredetileg az assistant TÉVESEN normalizálta a "niche"-t a filozófus Nietzsche-re. A projekt valódi neve: **niche datasets**, nem köze Nietzsche-hez.) |
| serikók | ❓ TBD | snack — még nem tisztázva | `current/stock/items.md` |
| ~~rákcsa~~ | **rákcsa** (helyes — nem typo, ez a tényleges szó a user szókincsében) | snack | 2026-05-09 megerősítve |
| "kenyérhez ezt meg azt" | ? (második fele homályos) | étel-alapanyag | `current/stock/items.md` |
| kézkaja | kész kaja | étel-kategória | `current/stock/items.md` |
| Connie / Obrigada | (idegen szavak — STT köhintés) | szű | random közbeeső szavak |
| "satét" | sötét | általános | 2026-05-07 séta-context |
| "faszázza" | (gyanú: "passzol-kezeli" / "tisztogatja"?) | nem világos | 2026-05-07 niche-datasets-context |
| "tevétel" | bevétel | pénzügyi | 2026-05-07 |
| "elseje" | elseje (= 1.) | dátum | OK, nem hiba |
| "technológiai sztecken" | technológiai stack-en | tech | 2026-05-07 |
| "faszázni" | (gyanú: tisztázni / piszkálni / véglegesíteni — kontextus-függő) | általános | 2026-05-07 (HelloCIA + niche-datasets kontextus) |
| "minnyer" | mindjárt | általános | 2026-05-07 |
| "felle" | fel-le | általános | 2026-05-07 |
| "globális jólétér" | globális jólétért | célkifejezés | 2026-05-07 |
| "monetizál, monetáris" | (önjavítás: nem-monetáris / non-profit) | szűr | 2026-05-07 |
| "HelloCIA" | (saját projekt-név, így kell) | projekt | 2026-05-07 — pontos forma még TBD ("HelloKia"? "Hello.CIA"?) |
| "Ideology Forum" | (saját koncepció — TBD pontosabban) | életcél | 2026-05-07 |
| "leszti / lesztezi" | (gyanú: lendíti / felélesztezi / felfeszíti) | testi/sport | 2026-05-07 tánc-context |
| "Súzóval" | súlyzóval | sport | 2026-05-07 |
| "összeködhető" | összeköthető | általános | 2026-05-07 |
| "satét" | sötét | általános | 2026-05-07 (már felvéve fent is) |
| "szabat" | szombat | nap | 2026-05-07 (már felvéve fent is) |
| "szégyellős" | (helyes — nem typo) | jellemvonás | OK |
| "monetizá... mon... monet..." | monetizációs | gazdasági | 2026-05-08 user önjavítás-küzdelem |
| "majjá" | majdra / másnapra (kontextus-függő) | általános | 2026-05-08 |
| "trekkelni" | tracking-elni / nyomon követni | tech | gyakori, OK |
| "autószession" / "autószessionök" | auto-session(ök) / CCAP auto-session-ök | tech | 2026-05-12 |
| "felakosítjuk" | felokosítjuk | általános | 2026-05-12 |
| "fejlesztős" | fejlesztve | általános | 2026-05-12 |
| "lófaszcse" | "lófaszt sem" / "lófasz se" | általános | 2026-05-12 |

---

## Stratégia

- **Csendben javít:** ha a kontextus egyértelmű, a kanonikus formát használom,
  nem kérdezem vissza
- **Inline jelölés:** ahol szó szerint őrzöm a user szövegét (idézet),
  ott marad az eredeti, de szögletes zárójeles jegyzet `[STT: helyes]`
- **Új típus felvétele:** új minta → ide JEGYEZNI, hogy később felismerjem

## Kapcsolódó

- `current/principles/working-style.md` — STT-tűrés általános elve
- `current/open-questions.md` — `Q-2026-05-07-01..04` STT-bizonytalan tételek

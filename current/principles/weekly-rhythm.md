# Weekly rhythm — munkanap-alapú heti ciklus

> **Forrás: a user szövege (2026-05-12).** Életrendi alapminta.

---

## A user szövege

> Van egy általános jellemzésem arról, hogy általában nem úgy szoktam
> kezelni a hét napjait, ahogy az a naptári hétfőketszer, de csütörtök
> péntek van, hanem sokkal jellemzőbb, hogy időnként arra gondolok, hogy
> akkor van hétfő, amikor az első munkanap van a héten, akkor van
> péntek, amikor a héten az utolsó munkanap van. Ugye ezek csúsznak a
> mindenféle szabadságok és ünnepnapok mentén.
>
> ...azért, mert a szombaton akkor esemény volt, amit én általában
> péntekre időzítem az eseményeket. Így aztán pénteken buli van,
> szombaton regenerálózás, vasárnap egy kis bemelegítés, és aztán hétfőn
> pedig kezdődik a meló, és ez aztán utána ugye péntekig megy, sütörtök
> általában rendbetételek, stb.

---

## A heti ciklus (kanonikus minta)

| Nap | Szerep | Tipikus tartalom |
|---|---|---|
| 🍺 "Péntek" | Buli / event-day | utolsó munkanap a héten + társasági program |
| 🛌 "Szombat" | Regenerálódás | rest, no-work, "szabat" |
| 🌱 "Vasárnap" | Bemelegítés | enyhe ráhangolódás, alacsony-intenzitású munka |
| 🚀 "Hétfő" | Meló-rajt | első munkanap, kezdődik a teljes hét |
| ⚙️ "Kedd-Csütörtök" | Fő-meló | normál tempó |
| 🧹 "Csütörtök" (vagy ami az utolsó-előtti munkanap) | Rendbetételek | review, tidy-up |
| 🍺 "Péntek" | Új buli | … (loop) |

## Csúszás-szabály (KRITIKUS)

A "hétfő" és "péntek" **NEM** kötődik a naptári hétfő-péntekhez. Csúszik:
- **Szabadságok** (céges és személyes) mentén
- **Ünnepnapok** (magyar munkaszüneti napok) mentén
- **Halmozódó event-ek** mentén (pl. ha péntek helyett szombat van a buli,
  akkor a regenerálódás +1 nappal csúszik → hétfő helyett "kedden indul a meló")

## Hatás a rendszerre

### Az Assistant Agent Cron Job

- A `recurring-tasks.md` "péntek 18:00 előtt" / "szombat = szabat" típusú
  szabályoknak a **munkanap-alapú** értelmezést kell követniük
- Pl. ha szombatra csúszott a buli (mint 2026-05-09 Kossuth tér), akkor a
  **"szabat" = vasárnap**, és a "hétfő" = kedd

### Recurring task ütemezés

- `cleaning` (heti 1×, szerda) — naptári szerda? vagy a 3. munkanap? — **TBD,
  Q-weekly-1**
- `tera-check` (heti kedd+csütörtök) — naptári? vagy munkanap-alapú? — **TBD,
  Q-weekly-2**
- `food-order` (csütörtökig) — naptári csütörtök? vagy a 4. munkanap? — **TBD,
  Q-weekly-3**

→ Új open kérdés-kategória: **BB) Heti ciklus**

## Példa: 2026-05-09 hét

- Szombat (2026-05-09): Kossuth tér event (a péntek-event helyett)
- Vasárnap (2026-05-10): "szabat" (regenerálódás, eltolódott)
- Hétfő (2026-05-11): "vasárnap-bemelegítés" (eltolódva)
- Kedd (2026-05-12): "hétfő-rajt" (eltolódva) → de még nem sikerült beindulni
  (lásd diary 2026-05-12 mood)

## Open kérdések

| Q# | Kérdés | Fontosság |
|---|---|---|
| Q-weekly-1 | `cleaning` (heti 1×, "szerda") — naptári szerda vagy 3. munkanap? | medium |
| Q-weekly-2 | `tera-check` (kedd+csü) — naptári vagy munkanap? | medium |
| Q-weekly-3 | `food-order` (csü deadline) — naptári vagy munkanap? | medium |
| Q-weekly-4 | Egy script ami a "logikai" napokat számolja a naptári + szabadság + munkaszüneti + event-input alapján? | low |

## Kapcsolódik

- `current/principles/recurring-tasks.md` — ide kötődnek a recurring-rules
- `current/principles/fit-system.md` — heti horgony-pontok péntekre
- `current/principles/sleep-system.md` — sleep-window csúszik a ciklussal
- `current/diary/diary.md` — daily reflection

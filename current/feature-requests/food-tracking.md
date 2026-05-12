# FR: Food tracking — étkezés-naplózás kézi log nélkül

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-05-07 — initial deklaráció

> a kajára meg az volt, ami kimaradt innen kérés, illetve gondolat, hogy jó
> lenne azt is valahogy trekkelni, hogy mikor ettem, mit ettem, mennyit
> ettem, hogyan ettem, stb. Mert jelenleg nagyon egészségtelenek a
> táplálkozási szokásaim, és ezen mindenképpen javítani kellene. és ebben
> is várom majd a segítségedet. Viszont nem tudom, hogy a fenében
> alakíthatnánk ki egy olyan trekkelési módszer, amihez nem kell nekem
> kézzel logolgatnom, hogy mikor ettem meg mit ettem. Szóval mindegyiket
> még nem teljesen pontosan tudom, pedig amúgy az is fontos, Egy csomószor
> nem emlékszem, hogy mikor ettem utoljára, és ezért aztán korábban vagy
> későbbet szekint kérne, többet vagy kevesebbet, áll, fenne se tudja,
> hogy ezt hogy lehetne megoldani.
>
> Igen, meg azt akartam mondani, hogy kajálás után megedzenem kéne, vagy
> sétálnom, vagy mindkettőt. Most éppen pont ez a helyzet. Bekajáltam,
> szétálok, most már egy órája sétálok.

---

## Cél

Étkezés-tracking (mikor / mit / mennyit / hogyan), **lehetőleg kézi log
nélkül**, hogy:
1. A user lássa visszamenőleg az étkezési szokásait
2. Az assistant tudjon emlékeztetni "mikor ettél utoljára" alapján
3. Az "egészségtelen szokások" javítása mérhető legyen
4. Az étkezés utáni séta/edzés szabály érvényesíthető legyen

## Constraints

| # | Constraint |
|---|---|
| C1 | **Build-it-ourselves** — saját megoldás, nem fizetős app (lásd `principles/no-paid-solutions.md`) |
| C2 | **Minimális kézi log** — ideális esetben 0 manuális bevitel |
| C3 | A user **gyakran nem emlékszik** mikor evett utoljára |
| C4 | "Mit/mennyit/hogyan" mező pontatlan lehet → fokozatosan javul |

## Megoldás-jelöltek (assistant brainstorm)

### A) Cast-notifier-alapú voice trigger 🎙️

- "Hey Google, ettem" / "Hey Google, kaja" → Google Home routine →
  webhook → my-assistant log
- **Plusz:** zéró kézi log; a meglévő infrastruktúra (Google Home cluster + cast-notifier) használja
- **Mínusz:** csak idő-pont (mit/mennyit/hogyan nem)
- **Bővítés:** routine "Hey Google, kaja: <amit ettél>" → speech-to-text → log

### B) Activity-monitor alapú detekció 📊

- Az `activity-monitor` már mutatja az aktív ablak / idle időt
- Ha a user **konyhához megy** (vagy étterem/Discord/stb. ablak előtérbe kerül) → étkezés-gyanú
- **Probléma:** nagyon zajos, sok false positive
- **Esetleg:** post-hoc megerősítés (assistant rákérdez: "ettél most?")

### C) Wearable / okosóra 🩻

- Modern okosórák (Garmin / Apple / Wear OS) **rezgés-alapú** étkezés-detekciót támogatnak
- Heart rate ugrás + kéz-mozgás minta = étkezés
- **Probléma:** specifikus eszköz-támogatás kell (Q-wear-1 még nyitva)

### D) Hibrid — passzív emlékeztetős protokoll 🔔

- Az assistant **N órás** időzítővel kérdez rá: "ettél valamit? Mit?"
- Ha N=4: napi 3-4 prompt
- Ha a user a chat-ben spontán említ kaját → automatikusan log
- Konyha-időpont (activity-monitor) → kérdez rá
- **Plusz:** alacsony technológia, gyorsan beüzemelhető
- **Mínusz:** a user nem mindig válaszol — gap-ek lesznek

### E) Cast-notifier voice prompt 🗣️

- Az assistant **emlékeztet hangosan** az All Speakers-en: "Mikor ettél utoljára?"
- A user válaszol, manuálisan beírja a chatbe
- A meglévő Google Home cluster + cast-notifier használja

## Javasolt phase-elés

**Phase 0** (most): semmi tracking — csak ez a FR feljegyezve.

**Phase 1** (közeljövő, alacsony költség): hibrid (D) — assistant 4 óránként
rákérdez (csak ha aktív interakció van), spontán említés → log.

**Phase 2** (cast-notifier kibővítés után): voice trigger (A) — Google Home
routine "ettem" → webhook.

**Phase 3** (wearable után): okosóra-detekció (C).

## Adat-séma (vázlat)

```
food-event {
  ts: ISO8601 (kötelező)
  source: 'voice' | 'chat' | 'wearable' | 'inferred'
  what?: string (szöveges leírás)
  amount?: 'kicsi' | 'közepes' | 'nagy' | grams?
  type?: 'reggeli' | 'ebéd' | 'vacsora' | 'snack' | 'kaja-rendelés-ebéd' | …
  context?: string (otthon / éttermbe / útközben)
  postMealActivity?: 'séta' | 'edzés' | 'pihenés' | null
  duration?: minutes
}
```

## Kapcsolódás más rendszerekhez

| Rendszer | Hogyan kapcsolódik |
|---|---|
| `recurring-tasks.md` | Étkezés utáni séta/edzés mint recurring szabály |
| `fit-system.md` | Post-meal mozgás → fit-szlot lehet ugyanaz |
| `sleep-system.md` | Késő esti étkezés → alvás-minőség hatása |
| `stock/items.md` | Mit ettél abból ami otthon van → készlet-csökkentés |
| `interfood-rendelés` | Megrendelt kaja → automatikus food-event predikció |

## Open kérdések

Lásd `current/open-questions.md` "N) Élelmezés / food-tracking" szakasz
(Q-food-1..5).

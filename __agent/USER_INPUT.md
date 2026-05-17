# USER_INPUT

User → assistant kommunikációs csatorna. A user `[NEW]` blokkokat ír ide,
az assistant feldolgozza és `[DONE]`-ra állítja.

## Formátum

```
## [NEW] {rövid cím}
**Típus:** task | feedback | approval | rejection | feature-request | instruction
**Beérkezett:** YYYY-MM-DD HH:mm
**Domain:** tasks | calendar | wallet | ... | (vagy `meta` ha a rendszerről szól)

{tartalom — szabad szöveg}
```

Az assistant feldolgozás után átírja:

```
## [DONE] {rövid cím}
**Feldolgozva:** YYYY-MM-DD HH:mm
**Eredmény:** {pl. "data/tasks.md-be felvéve", "plans/X.plan.md létrehozva"}

{eredeti tartalom megőrizve}
```

## Típusok

- **task** — új konkrét feladat, valamelyik domain-be kerül
- **feedback** — visszajelzés a rendszerről vagy korábbi munkáról
- **approval** — egy plan / akció jóváhagyása
- **rejection** — egy plan / akció elutasítása (indoklással)
- **feature-request** — a my-assistant rendszer új képessége
- **instruction** — viselkedési utasítás (kerüljön memory-be is, ha tartós)

---

<!-- ÚJ BLOKKOK IDE, A LEGÚJABB FELÜL -->

## [DONE] cycle 101 smoke test
**Típus:** task
**Feldolgozva:** 2026-05-17 05:04
**Eredmény:** shipped
**Domain:** meta

This is a test entry from cycle 101 to verify Phase 4a write endpoint works.



## [NEW] Wake-bundle 2026-05-16 10:00 — szombat (szabat, ULTRA-rövid)
**Típus:** instruction
**Beérkezett:** 2026-05-16 10:00
**Domain:** meta
**Forrás:** assistant-agent-cron tick #40, on-sleep-window-end event

Jó reggelt 🌅 Szombat 10:00. **Szabat-nap** (weekly-rhythm.md) — alacsony-nyomás. Tegnap éjjel (01:13) frissítettél a diary-ban, kontextus megvan.

### 🪴 Egyetlen biztos-talaj javaslat (mood low + irányt vesztett-re)
- 📞 **Porszívó-szerviz hívás** (5 perces dolog, konkrét "done") — ha akarsz egy fix tettet a napnak

Ha pihenős szombat → az is teljesen OK. Minden más megvár.

### 🧹 Stale [NEW] entry-k a USER_INPUT-ban (6 db, ne aggódj rajtuk)
4 wake-bundle/presence-check (05-13 / 05-14) + 1 péntek wake-bundle (05-15) + EZ. Amikor jó, állítsd [DONE]-ra ami releváns.


## [NEW] Wake-bundle 2026-05-15 10:00 — péntek reggel (35h+ silence)
**Típus:** instruction
**Beérkezett:** 2026-05-15 10:00
**Domain:** meta
**Forrás:** assistant-agent-cron tick #30, on-sleep-window-end event

Jó reggelt! ☀️ Péntek 10:00. **Megjegyzés**: a tegnapi (csütörtök) napra nincs diary-bejegyzésed és a chat-ben sem reagáltál a wake-bundle-re/presence-check-light-ra → **35h+ silence** (utolsó user-rögzítés 05-13 23:07).

### 🤔 Nem tudom mi történt csütörtökön
A korábbi 4 [NEW] entry (wake-bundle 05-13/05-14, presence-check 05-13/05-14) tovább él itt a USER_INPUT-ban — ha végeztél valamivel vagy elment a hajó, tedd át [DONE]-ra ahogy időd engedi. Nem fogok újabb ismétlést pakolni rájuk.

### 📊 Mit tudok biztosan
- Utolsó megerősített pozitív: **2026-05-13 szerda** — agresszív + Gellért-hegy progress, walk 2-napi streak
- Halmozódó: 🧹 cleaning miss=2 (05-06+05-13), 🛁 bath miss=1 (~05-10)
- Bizonytalan (nincs adat): walk/fit/tera-check/Tesco/Upwork

### 📅 Mai (péntek 05-15)
- weekly-rhythm.md: péntek = általában buli; **DE** a heti-ciklus felborulva (kedd=rajt) → péntek lehet még produktív
- Ha péntek-este vendéges minta él (lásd diary 05-08, László + általános péntek-vendég), akkor 18:00 körül vendég-ablak indul

### ❓ Az egyetlen kérdés
**Hello, hogy vagy? 1 mondat is elég** (mood, tegnap mit csináltál nagyjából, ma mire van energia).

### 🚀 Dev Agent (info, nem assist-ügy)
- Tegnap óta csak no-op cycle-k (alvás-aware), 2 napja nem volt érdemi commit


## [NEW] Presence-check-light 2026-05-14 20:00 — 10h post-wake (mood ↑)
**Típus:** instruction
**Beérkezett:** 2026-05-14 20:00
**Domain:** meta
**Forrás:** assistant-agent-cron tick #23, soft-nudge, wake-bundle throttle lejárt 14:00-kor

Csütörtök este, 10h-val a reggeli wake-bundle után. Diary 05-14 még nincs frissítve — tegnapi pattern szerint te késő-este szoktad rögzíteni (tegnap 23:07).

### 🟢 Pozitív (a tegnapi mood ↑ alapból)
Tegnap a 2-napos walk streak + Gellért-hegy progress beindította a momentumot. Ma is ott van valahol. Ne erőltesselek; csak jelezd amikor van időd.

### Egyetlen kérdés
**Folytatódott ma a momentum?** (séta, hegy, bármi, ami emeli — vagy a nap másra ment és OK)

Ha 23:00 körül a tegnapi mintát ismétled, diary entry-vel zárod a napot, akkor minden rendben. Csak rögzítsd, ne aggódj.


## [NEW] Wake-bundle 2026-05-14 10:00 — csütörtök reggel briefing
**Típus:** instruction
**Beérkezett:** 2026-05-14 10:00
**Domain:** meta
**Forrás:** assistant-agent-cron tick #19, on-sleep-window-end event, formula-wake

Jó reggelt! ☀️ Sleep-window vége (formula szerint 02:00+8h=10:00). Tegnapi mood-fordulás (down-bottom → agresszív + Gellért-hegy progress) friss alap.

### 🎉 Tegnapi siker (felemelve, ne felejtsd)
- 🚶 **Walk** 2-napos streak (05-12 + 05-13) ✅
- ⛰️ **Fit** aktiválva — Gellért-hegy progress (visszafordult vízért → újrakezdés) ✅
- 📜 Új principle ship-elve: **Vízpalack kötelező hegymenet előtt** (fit-system.md) — ma is reminder triggerelődik hegymenetnél

### 🌍 Mai esedékes (csütörtök)
- 🌍 **TERA-check** — kedd+csütörtök recurring, MA új instance esedékes (előző 05-12 kedd ✅)
- 🚶 **Walk** — napi minimum; streak fenntartás-cél (3-napos streak felé)
- ⛰️ **Hegymenet folytatás** — opcionális, az 5-utca-ágak feltérképezése (tegnap 2 utca, csúcs még távol). Vízpalack ☑
- 🧼 **Arc-mosás** — napi 3× (anti-deferral, `health-system.md`)

### 🔴 Halmozódó / nyitott (figyelem, de nem nyomás)
- 🧹 **Takarítás** — miss=**2** (05-06 + 05-13 mindkét szerda kihagyva), halogatás-szorzó erősen aktív. Következő esedékes szerda 05-20, de **közbevágni IS lehet** (a halogatás-szorzó csökkentésére).
- 🛁 **Fürdés** — miss=1 (~05-10 körül lett volna), heti 2× szabály
- 🛒 **Tesco-rendelés** — 2 napja halogatva (tej elfogyott, "mindent is" rendelés-jelölt)
- 💸 **Upwork** `org:task:69ab6a90` — P=100, dueDate 05-10 → **-4 nap**. MVP-fókusz, de tegnap a hegy/walk volt a momentum.
- 🌍 **TERA-task organizer-ben** `org:task:69fcafdf` — 05-12 instance ✅ a diary szerint, de a task organizer-ben még open (dueDate 05-07, -7 nap). Lezárás + új csütörtök 05-14 instance felvétel.

### 🧠 Mood (kérek frissítést)
- Last-known (05-13 23:07): **agresszív + hegy progress** (vektor felfelé)
- Friss snapshot kell: hogy érzed magad most? 1 mondat is elég.

### 🚀 Dev Agent (info)
- 2026-05-13: 18+ cycle, 30+ commit, M2 daily report kész
- Alvás alatt: no-op cycle-k (sleep-aware)

### Javasolt next action (te döntsd el)
1. **Most**: rövid mood-frissítés (1 mondat) → diary entry új nap kezdés
2. **Mai top**: TERA-check + walk-folytatás (streak fenntartás, momentum)
3. **TERA-task organizer**: 05-12 instance lezárás + új 05-14 instance felvétel
4. **Cleaning**: ha lendület van — beékelhető (halogatás-szorzó csökkentésre)


## [NEW] Presence-check 2026-05-13 18:00 — 10h a wake-bundle óta
**Típus:** instruction
**Beérkezett:** 2026-05-13 18:00
**Domain:** meta
**Forrás:** assistant-agent-cron tick #11, soft-nudge, 4h-throttle lejárt 12:00-kor

A reggeli **wake-bundle 10h-óta él [NEW]-ként**, és semmi user-jel: diary mtime 05-12 21:59 (változatlan), 0 új Domén-1 input. Két lehetőség:
- 🛌 **vissza-alvás** — a hét eleji mélypont + ciklus-felborulás (`weekly-rhythm.md`) miatt nem tudtál felkelni
- 📱 **nem-chat-jelenlét** — fizikai jelenlét van, de a chat-re ma még nem néztél

Vagy harmadik: jelen vagy, csak nem akartad rögzíteni. **Akármelyik OK** — csak jelezd egy mondattal, hogy stand-state-jeit be tudjam állítani.

### 📊 Status estefelé (18:00 szerda)
| Téma | Reggel 8:00 állapot | Most 18:00 |
|---|---|---|
| 🧹 Takarítás (szerda esedékes) | ❓ | ❓ — ha ma nem → **2 missed cycle** |
| 🚶 Séta | ❓ ("ezer éve nem") | ❓ |
| 🧼 Arc-mosás (napi 3×) | ❓ | ❓ |
| 🛒 Tesco-rendelés (tej!) | ❓ | ❓ |
| 💸 Upwork P=100 -3 nap | "ma nem" (05-12) | ❓ |
| 🌍 TERA task close | ❓ | ❓ |
| 😶 Mood / hullám-vektor | down-bottom (05-12 21:59) | **stale 21h** |

### ❓ Az egyetlen kérdés most
**"Hello, itt vagy?"** — egy emoji vagy egy szó is elég, csak hogy tudjam: idle vagy aktív állapotba menjek.


## [NEW] Wake-bundle 2026-05-13 08:00 — szerda reggel briefing
**Típus:** instruction
**Beérkezett:** 2026-05-13 08:00
**Domain:** meta
**Forrás:** assistant-agent-cron tick #9, on-sleep-window-end event, 5 pending nudge

Jó reggelt! ☕ Sleep-window vége (default fallback 02-08). Alvás alatt 5 nudge halmozódott — egyetlen csomagban:

### 📅 Mai esedékes (szerda)
- 🧹 **Takarítás** — heti szerda szabály, ma esedékes (előző 04-30 csü; 05-06 missed → ha ma se → 2 missed cycle, halogatás-szorzó erősödik)
- 🚶 **Séta** — naponta minimum 1×. Diary 05-12: "ezer éve nem sétált / buli óta nem". Mai cél: ✅
- 🧼 **Arc-mosás** — napi 3× (lásd `health-system.md` anti-deferral)
- 🛒 **Tesco-rendelés** — tegnap halogatva 05-13-ra (tej elfogyott + "mindent is" kandidátus)

### 🔴 Lejárt / open
- 💸 **Upwork** `org:task:69ab6a90` — P=100, dueDate 05-10 → **-3 nap**. User 05-12 "ma nem"-et mondott; új nap, újra-felvetés. Döntés kell: indítás MA / dueDate re-plan / drop.
- 🌍 **TERA-check** `org:task:69fcafdf` — diary 05-12 szerint ✅ megvolt, organizer task **még open** (dueDate 05-07, -6 nap). Lezárás + új csütörtök 05-14 instance felvétel javasolt.
- 🛁 **Fürdés** — utolsó 05-07, heti 2× → ~1 missed cycle (várt 05-10 körül)

### 🧠 Mood / hullám check
- Last-known (05-12 21:59): **astral=very-low**, mental=normal, material=low, vektor=down-bottom
- Friss snapshot kell: hogy érzed magad most? (egy mondat is elég — rögzítem a diary-be)

### 🚀 Dev Agent állapot (info)
- 2026-05-12: cycle 1-18, 30+ commit, M2 daily report kész
- Last activity: 2026-05-13 03:01 cycle 18 no-op (sleep-csendes)
- LDP all-green, M1 grooming kész (backlog: 6 green / 13 yellow / 9 parked)

### Javasolt next action (te döntsd el)
1. **Most**: rövid mood-frissítés (1 mondat) → diary entry új nap kezdés
2. **Mai top**: takarítás (szerda esedékes, halogatás-szorzó) + séta (visszaépítés)
3. **Upwork**: re-plan vagy indítás (mvp-focus aktív)
4. **TERA-check organizer**: 05-12 instance lezárás


## [NEW] Cron-tick 2026-05-12 17:34 — soft-nudge (lejárt Upwork + recurring slip)
**Típus:** instruction
**Beérkezett:** 2026-05-12 17:34
**Domain:** meta
**Forrás:** assistant-agent-cron tick #4, verdict=soft-nudge

Az óránkénti Cron Job tick **csendes nudge-ot** ad (hullám-vektor lefelé →
nem push-olok hangosan). Áttekintés:

### 🔴 Lejárt / esedékes (figyelem)
- 💰 **Upwork task** `org:task:69ab6a90` — **P=100, dueDate 2026-05-10 (csú: -2 nap)**.
  MVP-fókusz szempontból ez a pénzkereső lépés. Nincs hangos push, de
  döntés kell: tényleg elindítjuk-e most, vagy újra-tervezzük a dueDate-et?
- 🌍 **TERA-check** `org:task:69fcafdf` — kedd-csütörtök recurring, **ma kedd
  esedékes**. A 2026-05-07-i instance diary szerint megvolt (✅), de a task
  organizer-ben még open. Lezárás + új instance felvétel javasolt.
- 🧹 **Takarítás** — utolsó 2026-04-30, esedékes szerda → **1 missed cycle**
  (2026-05-06). Halogatás-szorzó aktív. Következő esedékes: 2026-05-13 (holnap).
- 🛁 **Fürdés** — utolsó 2026-05-07, heti 2× → **~1 missed cycle**
  (várhatóan 2026-05-10 körül lett volna).

### 🟡 Soft kandidátus
- 🥛 **Tej elfogyott** → Tesco-rendelés indítható (diary 2026-05-12).
  Önálló Tesco-rendelés kandidátus a `current/shopping/tesco.md` alapján.
- 🍱 **Interfood** — 05-29-ig fedett, next reminder 2026-05-25 hétfő → OK.

### 🧠 Wave-vektor (3×3 elv)
- Asztrál mély 🔻, Mentál normál, Anyag alacsony 🔻 → **NE erőltessünk feladatot**.
- Tick verdict ezért **soft-nudge**, NEM urgens (push lekapcsolva).

### Javasolt next action (te döntsd el)
1. **Upwork**: dueDate újra-tervezés (pl. 2026-05-13/14) VAGY indítás most
2. **TERA**: organizer task lezárása + új kedd-instance felvétele
3. **Takarítás**: holnap szerda (esedékes), érdemes most reservation-ben tartani


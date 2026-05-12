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


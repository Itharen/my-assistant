# Methodology authority

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel.

---

## 2026-05-07 — alapelv: a my-assistant a minta, nem fordítva

> Most azt is jegyezzük föl, hogy amit most itt feljegyeztetek veled, illetve
> amiket most itt kialakítunk, rendszerezési metodológiákat, illetve minden,
> amit próbálok neked mondani és kérni tőled, azok lesznek a minták, és lehet,
> hogy az organizer-t kell helyenként ahhoz hozzáigazítani, tudjuk kezelni a
> feladatokat és bejegyzéseket.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Authority irány

**A my-assistant rendszerünk (current/principles/, current/feature-requests/,
egyéb metodológiák) a KANONIKUS MINTA.** Az organizer projekt ehhez
**alkalmazkodik**, nem fordítva.

### Mit jelent ez a gyakorlatban

| Helyzet | Korábbi gondolkodás | **Új (helyes) gondolkodás** |
|---|---|---|
| Lokál adatformátum tervezése | Organizer-séma kompatibilis legyen | **A user szabálya az alap; ha az organizer nem támogatja, FR az organizer-be** |
| Új ismétlődő szabály (pl. heti 2× fürdés időablak-megszorítással) | Nézzük meg, az organizer hogy modellezi | **Felírjuk ahogy a user mondta; ha az organizer nem tudja modellezni, az organizer kap FR-t** |
| Új concept (pl. halogatás-szorzó, csúszó alvás-ciklus) | Igazítsuk a meglévő organizer prio-rendszerhez | **A user concept-jét használjuk; az organizer prio-rendszer ehhez igazodik** |
| Ütközés a my-assistant és organizer modell között | Lokál ad, organizer dönt | **My-assistant nyer; organizer FR készül a különbségről** |

### Konkrét következmények — most azonnal

A `current/principles/`-ban gyűjtött szabályok (working-style, priority-system,
recurring-tasks, stock-system, sleep-system, methodology-authority) →
**mindegyikből** lesz egy organizer FR. A szöveget szó szerint visszük át,
és az organizer fejlesztése követi ezeket.

A `current/feature-requests/` mappa — pontosan ezt a célt szolgálja, csak ide a
nem-szabály-jellegű FR-ek mennek (pl. integráció kérések, mint a calendar-integration).

### Open kérdés — később tisztázandó

- Mikor szervezzünk először egy "FR-batch upload"-ot az organizer-be
  (`fo feature-requests.create` × N)? Egy bizonyos kritikus tömeg után érdemes,
  mert addig változnak a megfogalmazások.
- Honnan tudjuk, hogy egy organizer-feature **eltér** a my-assistant elvárásától?
  → akkor kell felfigyelni, ha egy szabályt nem tudunk leírni `fo` paraméterekkel,
  vagy ha a `fo` kimenet más mezőket ad mint amit kértünk.

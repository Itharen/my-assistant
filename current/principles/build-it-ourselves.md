# Build it ourselves

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel.

---

## 2026-05-07 — initial deklaráció

> Mindent le kell tudjunk fejleszteni, ami szükséges.

(A no-paid-solutions szabállyal egy időben deklarált univerzális elv.)

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Az elv

**Ami képességre szükségünk van, azt mi tudjuk lefejleszteni.** Ez a default
architektúrai stance — nem konkrét tool-választás, hanem hozzáállás:

- 3rd party tool-ok (HA, Zapier, IFTTT, n8n, managed services) **nem
  automatikus default-ok**.
- Minden új igény felmerülésekor az **első kérdés**: lefejleszthető-e mi
  magunk, és ha igen, mennyi munkáért?
- Ha a self-built ~1 nap és nincs hosszú-távú maintenance-tail, általában
  **az a jó választás** — a "instant működik" érték nem haladja meg a saját
  kontroll + zéró cost + transparency hármast.

### Mikor építsünk saját helyett 3rd-party tool-t

Vannak helyzetek, amikor egy meglévő FOSS tool használata indokolt. Ezeket
**explicit kell érvelni**:

| Indokolt 3rd-party tool | Indok |
|---|---|
| Komplex domain-szakértelmet kódol (pl. egy fizikai szimulátor) | Re-implementálni nem értelmes |
| Nagy aktív community + biztonsági auditok (pl. nginx, postgres) | Saját implementáció security-szempontból rosszabb |
| A tool maga a célunk fogyasztói pozíciójában van (pl. Cast SDK, mert a Cast a 3rd party — Google) | Nincs alternatíva |

Ami **NEM jó indok**:
- "Gyorsabb beállítani" — a hosszú-távú maintenance + lock-in ezt felemészti
- "Egyszerűbb" — ha 100 LoC-ban megírható, nem egyszerűbb egy 200MB-os service
- "A community ezt ajánlja" — a community sokszor over-engineers

### Praktikus alkalmazás

1. **Research → ajánlás során** mindig vizsgáld a self-built utat is, és
   becsüld meg a build-időt (general LoC-ban). A user-t bízd a döntéssel,
   de a default a self-built.
2. **My-assistant kódbázis**: a `scripts/` alá kerülnek az automation /
   integration scriptek, követve a `fo` CLI JSON envelope mintáját.
3. **Reusable pieces** kerülhetnek NPM packagek-be (FDP `@futdevpro/*`
   ökoszisztéma), ha tényleg cross-project hasznosak.
4. **Heavy infra** (HA, Node-RED, stb.) lehet **átmeneti PoC** vagy
   **rendszer-szintű komponens** ha tényleg sok funkciót kapsz vele
   olcsón — de ne legyen automatikus reach.

### Kombinációban a no-paid-solutions szabállyal

`current/principles/no-paid-solutions.md` mondja: **ne költs**. Ez a fájl
mondja: **ha nincs ingyen, építsd**. A kettő együtt:

- Ha a probléma megoldható → ingyen alapokon → saját implementáció.
- Ha úgy tűnik nem lehet ingyen → keresd meg a fizetős termék mögötti FOSS
  primitívet és építsd arra. (Ritka hogy valami tényleg nem érhető el FOSS-on.)

# No paid solutions

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel.

---

## 2026-05-07 — initial deklaráció

> Egyáltalán ne nézzünk semmilyen fizetős megoldást. Ha létezik fizetős
> megoldás, akkor meg kell tudjuk csinálni magunknak is. Mindent le kell
> tudjunk fejleszteni, ami szükséges. Semmiképpen nem nézünk fizetős
> megoldásokat.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### A szabály

**Ne ajánlj és ne válassz fizetős megoldást.** Ez egy **hard, univerzális**
elv — minden projektre érvényes (my-assistant, organizer, FDP-k, OGS-k, mind).

A user filozófiája:
- Ha egy SaaS / managed service / paid tool létezik, **az proof** hogy a
  probléma megoldható → ekkor mi magunk lefejlesztjük az ingyenes ekvivalenst.
- Build-it-ourselves a default. A control + transparency + zero recurring
  cost + tanulási hozam meghaladja a "instant működik" értékét.

### Praktikus következmények

1. **Research / ajánlás során az ingyenes opciók kerülnek elsőre.** Ha mégis
   említünk fizetős terméket, csak mint **referencia** ("ezt csinálja az X
   $ár-ért, az ingyenes ekvivalense Y FOSS lib-bel ~Z LoC-ban"), nem mint
   primary path.
2. **Cloud TTS / SaaS / subscription / managed services** — kerülendők.
3. **Free trial / free tier** (pl. Azure Speech 500K char/hó) használható
   átmeneti PoC-ra, **de nem hosszú-távú dependency**.
4. Ha tényleg nincs FOSS ekvivalens, **az egy saját implementáció jelöltje**
   (`scripts/` alá my-assistant-ben, vagy önálló NPM package, stb.).

### Kombinációban a build-it-ourselves elvvel

A két elv összetartozik (lásd `current/principles/build-it-ourselves.md`):
- **No paid** = ne költs
- **Build it ourselves** = ha nincs ingyen, építsd

A kettő együtt egy **default-architektúrát** definiál: minden képesség, ami
hosszú távon kell, vagy FOSS lib-re épülő saját script, vagy a my-assistant
kódbázis natív része.

### Mire NEM vonatkozik

- Egyszeri eszköz-vásárlás (pl. egy Raspberry Pi, egy hangszóró) — ez nem
  "fizetős megoldás", hanem hardware.
- Otthon már fizetett dolgok (internet, áram) — context-cost, nem új paid dep.
- Open-source szoftver self-hosting-jának hardware/áram-költsége — elhanyagolható.

### Hozzá nem nyúlni

Ezt a szabályt **ne puhítsd magadtól.** Ha egy konkrét helyzetben szerinted
indokolt lenne kivételt tenni (pl. túl bonyolult lenne lefejleszteni), kérdezd
meg a user-t explicit.

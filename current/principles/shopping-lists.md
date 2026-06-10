# Shopping lists organization

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel.

---

## 2026-05-07 — alapelv: bolt-típus szerinti szeparált listák

> és ha már mi mindent kell venni, fontos, hogy több különféle bevásárló
> listát vezessünk, attól függően, hogy mit, hol és hogyan kell megvenni.
> Például a ruhák az egy külön szekció, a Tesco-ból rendelhető dolgok az
> megint egy külön, szekció, és akkor fogok most mondani még egy pár Ikea-s
> vásárlandó dolgot. Ikeából kell venni eszközkészletet, meg tányérokat, meg
> legább két kukát, de inkább hármat. Kéne egy kis kuka a fürdőbe is.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Az elv

**Egy lista = egy bolt-típus / vásárlás-csatorna.** Egy tétel oda kerül, ahol
ténylegesen meg lehet venni / leadni a rendelést. Ezzel:

- A rendelés-leadáskor egy fájlból mehet a bevásárlás (nincs kategorizálás-overhead)
- Minden lista saját ütemezéssel mehet (Tesco 2-3 hetente, IKEA esetenkénti, ruházat ad-hoc)
- A reorder-küszöbök bolt-specifikusan triggerelhetők

### Aktuális listák (`current/shopping/`)

| Fájl | Bolt / csatorna | Mit fed le | Ütem |
|---|---|---|---|
| `tesco.md` | Tesco (online/bolt) | élelmiszer + alapanyag + drogéria | 2-3 hetente |
| `clothing.md` | ruhabolt / cipőbolt | ruházat (zokni, alsógatya, póló, kabát, pulóver, cipő) | ad-hoc, szükség szerint |
| `ikea.md` | IKEA | háztartási eszközök, bútor-kiegészítő (kuka, tányér, evőeszköz, stb.) | esetenkénti |
| `pharmacy.md` (TBD) | patika | gyógyszer, vitamin, kiegészítő | ad-hoc |

> **Bővíthető**: új bolt = új fájl + sor itt + a `recurring-tasks.md`-ben az
> ütem szabálya (ha van).

### Megfontolások

- **Egy tétel két listán?** Lehetséges, ha többfelé is megvehető (pl. mozzarella
  Tesco-ban + fagyasztott a CBA-ban). Default: oda tegyük ahol legolcsóbb /
  rendszeresebben veszünk
- **Stock-tétel mely listán?** Az `items.md` reorder-szabálya generálja → ott
  jelölni kell hogy melyik shopping fájlba kerüljön (új mező: `preferredStore`)
- **Manuális override**: a user közvetlenül beírhat egy listára anélkül hogy
  a stock-rendszer áthajtaná

---

## ⚠️ 2026-05-22 — Tesco időzítési szabály VISSZAVONVA

> User 2026-05-22: "rájöttem, hogy most már nem csak hétköznap lehet rendelni,
> úgyhogy azt a szabályunkat feloldhatjuk, ami bekorlátozza, hogy mikor lehet
> Tesco rendelést leadni."

**A teljes lenti (2026-05-13 + 2026-05-16) Tesco-időzítési szabály ÉRVÉNYTELEN.**
A Tesco-rendelés **bármikor leadható, bármelyik napra** — nincs nap-korlát se a
rendelésre, se a szállításra. Csak az **esedékesség** (recurring 2-3 hetente)
számít, az időzítés napjára semmi megkötés.

> Az alábbi szakaszok **archív** — történeti okból maradnak, de NEM aktívak.

---

## ~~2026-05-13 — Tesco-rendelés időzítési szabálya~~ (ARCHÍV — visszavonva 2026-05-22)

> A Tesco-s rendeléshez fel kéne írni, hogy azt úgy kéne időzíteni, hogy
> általában a következő két nap, tehát holnap után aztán érték rendelni,
> és az jó lenne, ha nem péntek lenne. Szóval a tesco rendelést azt
> vasárnap/hétfő/kedd kéne megejteni.

### Strukturált összefoglaló (assistant-jegyzet)

**Tesco-rendelés időzítés:**
- **Szállítási cél:** rendelés napja **+2 nap** (általában; nem "ma vagy holnap")
- **TILTOTT szállítási nap:** péntek
- **Megengedett rendelési napok:** vasárnap / hétfő / kedd
  - vasárnap → kedd-i szállítás ✅
  - hétfő → szerda-i szállítás ✅
  - kedd → csütörtök-i szállítás ✅
- **Miért nem szerda-csütörtök-szombat?**
  - szerda → péntek-i szállítás ❌
  - csütörtök → szombat-i szállítás (heti horgony, lásd `fit-system.md` — szombat = szabat)
  - szombat → hétfő-i szállítás (vasárnap a Tesco home delivery általában szünetel)

### Asszisztens-szabály

Amikor a Tesco-rendelés esedékes (`recurring-tasks.md` 2-3 hetente):
- Ha **vasárnap/hétfő/kedd** van → javasolt rendelni MA
- Ha **szerda/csütörtök/péntek/szombat** van → halaszd vasárnapra (vagy a következő hétfőre, ha vasárnap a user inaktív)
- Soft-nudge a megengedett napok reggelén, NEM a tiltottakon

### Pontosítás 2026-05-16 (user-korrekció)

**A `rendelés` maga BÁRMIKOR leadható** (rendelést NEM tilt semmi a héten).
A korlátozás kizárólag a **szállítási napra** vonatkozik:
- Vasárnap: szállítás szünetel (nem létezik)
- Péntek: tiltott (user-preferencia)
- Szombat: kerülendő (szabat, user-rituálé)

A rendelés-leadás napja tehát csak addig "korlátozott", hogy a +2 nap kimenetel **valós szállítási napra** essen. De **leadhatod bármikor**, ha a megfelelő szállítási napot választod.

Pl. **ma (vasárnap)** rendelés → +2 nap = **kedd szállítás** ✅.

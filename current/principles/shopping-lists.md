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

# capabilities/

**Mit tud Honnie megcsinálni a usernek — és mi van ebből jóváhagyva.**

| Fájl | Mi ez |
|---|---|
| `CATALOG.md` | ⭐ a katalógus maga — **ez az egyetlen index** |

## Miért létezik

> **Owner (2026-09-07):** *„el kell kezdjünk felvenni egy listát, hogy mi az, amit te meg
> tudsz csinálni nekem… Már van egy pár képesség, de azokat majd apróvolom még, hogy
> elfogadhatók-e."*

⛔ **Egy képesség nem lép működésbe attól, hogy megépült.** A státuszt **a user** adja.

## A katalógus INDEX, nem leírás

A képesség **részletei** ott élnek, ahol a képesség maga: a flow `README.md`-jében, a
`current/principles/` fájlban, vagy a CLI-parancs dokumentációjában. A katalógus csak
**felsorol + státuszt tart + odamutat**.

⇒ Így nincs két igazság ugyanarról (`current/principles/ssot.md`).

## Két dolog, ami NEM kerül ide

1. **A baseline** — a userrel való kommunikáció nem képesség, hanem alapfelszerelés.
2. **Belső mechanika** — naplózás, állapot-tartás, önellenőrzés. Ezek nem „szolgáltatások"
   a usernek, hanem a működés feltételei.

## Karbantartás

- Új képesség → `📝 javaslat` vagy `⏳ jóváhagyásra vár` — **sosem `✅`**
- Státusz-váltás → `ma action-log emit --kind state-change` + jelezni a usernek
- Ha egy képesség megszűnik/felváltódik → **stale-banner, nem törlés**
  (`core-stale-doc-marking`)

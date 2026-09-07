# 📍 Helyzet-adat: mit tárolunk és meddig

> **Owner, 2026-09-07 10:24 — SZÓ SZERINT:**
>
> *„Jól hangzik az owntracks.. nemtom mennyi időbként... Legyen állítható és majd
> finomhangoljuk. Hol tárold...? Db-ben? Meddig? Nem is tudom... Maradhat hosszabb távon is
> ami hasznos... Pl amikor nem otthon... Az otthonit meg fölösleges tárolni."*

---

## A szabály, ami ebből következik

| Helyzet | Mit teszünk | Miért |
|---|---|---|
| 🏠 **OTTHON** | ⛔ **NEM tároljuk** a koordinátát — csak annyit, hogy „otthon" | owner: *„Az otthonit meg fölösleges tárolni."* Az otthoni koordináta a **legérzékenyebb** adat, és **semmit nem ad hozzá**: azt már tudjuk, hol lakik. |
| 🚶 **NEM otthon** | ✅ **Tároljuk**, és **hosszabb távon is maradhat** | owner: *„Maradhat hosszabb távon is ami hasznos... Pl amikor nem otthon"* |

⭐ **Ez adatvédelmi szempontból a jó irány, és MAGÁTÓL adódott a hasznosságból:** a
leggyakoribb és legérzékenyebb pont (az otthon) az, amiből a legkevesebb információ származik.
Nem kompromisszum — a szűkítés itt **egybeesik** azzal, ami amúgy is hasznos.

## Gyakoriság

**ÁLLÍTHATÓ**, nem beégetett — owner: *„Legyen állítható és majd finomhangoljuk."*
⇒ Konfigurációs érték, nem konstans a kódban. A finomhangolás **később**, méréssel:
a sűrű GPS **akkut eszik**, tehát ez a kettő között egyensúlyoz.

## Amit ez NEM enged meg

- ⛔ **Teljes útvonal-történet** gyűjtése öncélúan. Amit tárolunk, annak **hasznosnak** kell
  lennie — az owner szava: *„ami hasznos"*.
- ⛔ Harmadik félnek átadás. Az egész pont azért **OwnTracks + saját végpont**, hogy ne legyen
  külső szolgáltató *(l. [[no-paid-solutions]], [[build-it-ourselves]])*.
- ⛔ A helyzet-adat **nem** kerül a `current/`-be (az git-trackelt) és **nem** kerül átiratba.

## Nyitva maradt

- **Hol pontosan** (adatbázis vagy fájl) — az owner ezt rám bízta: *„Nem is tudom..."*
  ⇒ Assistant-döntés, de a fenti korlátokon **belül**.
- Mekkora sugár számít „otthonnak" — mérendő, nem tippelendő.

## Kapcsolódó

- `current/open-questions.md` **N)** — a döntési kérdések (N1 ✅ OwnTracks, N4 ✅ állítható, N5 ✅ ez a fájl)
- `current/locations.md` — az otthon-cím, amihez a „otthon-e?" hasonlít
- [[fdp-ai-never-restart]] · [[no-paid-solutions]] — ugyanaz a helyi-először hozzáállás

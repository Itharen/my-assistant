# 3×3 system — asztrál / mentál / anyag + hullám-tracking

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Ez egy fundamentum-szintű
> alapvetés, amit a my-assistant rendszerben + későbbi organizer-ben **state-tracking**
> alapként akarunk használni.

---

## 2026-05-07 — initial deklaráció

> Egyrészt az, hogy szeretném a rendszereimben, majd az organizerben is, de
> jó lenne itt megteremteni az alapjait majd annak, hogy egy kicsit tudjuk
> trekkelni azt is, hogy én milyen állapotban vagyok. És akkor innen hiányzik
> egy pár fő definíció, mi szerint az ember három részből épül föl, asztrál,
> mentál és anyag. Az asztrál az az érzelmi test, a mentál az a tudat, az
> anyag a fizikai test. És ezek háromassága adja az egészet, ezeknek
> egyensúlya adja az egyensúlyt. és mindhárom rész energiaszintje adja ki az
> összenergiaszintet. Ugye egyszer létezik egy energiaszint, vagy létezés,
> közben létezik. Hülye vagyok, mert az energiaszint egy kicsit fedi az
> összeset, de mindegy.
>
> Szóval amúgy jellemző ezekre a hullám. Egyszer fent, egyszer lent.
> Folyamatos hullám van, folyamatos felle. Itt amúgy van ennek egy kis
> tudománya is, amit majd még lehet, hogy akár most minnyer ki is fejtek.
> De a lényeg az egész sztorinak az az, hogy... Például ez prediktálható,
> szóval, hogyha a hullám felkanyarodik, akkor, hogyha energiát fektetünk
> bele, akkor a vektornak a méretén növelhetünk, de az irányán nem. Szóval
> ilyenkor lehet felfelé törni. Viszont amikor meg... lefelé kanyarodik,
> tehát akár pont a csúcsponton is. Ha akkor fektetünk bele energiát, akkor
> az nem fog minket följebb vinni, maximum előre. Sőt, hogyha már lefelé
> tart a hullámív, akkor az már pont, hogy negatív hatást fogunk elérni,
> ha rádolgozunk. Szóval, hogyha ennek megtaláljuk a tudományos képleteit,
> és ezeket jól fogjuk tudni regisztrálni, akkor az nagyon sokat segíthet
> abban, hogy mit, mikor, hogyan kell időzíteni.
>
> És akkor itt bejön még egy kis dolog, hogy erre a hullámra ugye
> mindenféle töri és megoszlóerő hatások is hatást gyakorolnak, amiknek
> hatására. ugye töréspontok, meg lenyomások fognak hatni ezre a kis
> hullámunkra, illetve nem csak egyik, hanem három hullám, és akkor van
> egy összesített hullám, na hát ez egy igencsak nagy és bonyolult téma.
> Még egyszer az alapvetései az a, 3x3, anyag, mentrál, asztrál, létezés,
> hullám, kapcsolat, ez a 3x3, és akkor ugye vannak a hullámra törések,
> megoszló erők, A pozíciónak van egy vektor iránya, és a hullámhosszakat
> nem teljesen ismerjük, hogy asztrámentál anyag hullámok azok mindegyiknek
> más a hullámhossza amplitudója. rezgésszáma, ezek mind eltérőek, és
> ezeket nem igazán ismerjük még.

---

## Strukturált összefoglaló (assistant, NEM a user szavai)

### Az ember 3 része

| # | Test | Mit fed le |
|---|---|---|
| 1 | 🌬️ **Asztrál** | érzelmi test — érzelmek, hangulat |
| 2 | 🧠 **Mentál** | tudat — gondolkodás, fókusz |
| 3 | 💪 **Anyag** | fizikai test — egészség, energia |

**Egyensúly = a 3 rész egyensúlya.**
**Összenergia = a 3 rész energiaszintjének együttese.**

### A 3×3 mátrix

| | Létezés | Hullám | Kapcsolat |
|---|---|---|---|
| **Anyag** | ? | ? | ? |
| **Mentál** | ? | ? | ? |
| **Asztrál** | ? | ? | ? |

> A "3×3" második tengelye: létezés / hullám / kapcsolat. Az egyes cellák
> jelentését még finomítani kell — open kérdés.

### Hullám-dinamika

Mindhárom test (asztrál/mentál/anyag) **független hullámmal** rendelkezik:
- saját **hullámhosszal** (időbeli periódus)
- saját **amplitúdóval** (kilengés mértéke)
- saját **rezgésszámmal** (frekvencia)

Ezek **eltérőek**, és **még nem ismerjük a pontos paramétereiket**. Idővel
empirikus tracking-gel megismerhetők.

### Vektor-szabály (energiabefektetés timing-ja)

A jelenlegi pozíciónak a hullámon **vektor-iránya** van. Ez határozza meg,
hogy egy adott pillanatban érdemes-e energiát befektetni:

| Hullám-fázis | Vektor-irány | Energiabefektetés hatása |
|---|---|---|
| **Felkanyarodik** ↗️ | felfelé | ✅ vektor **mérete** növelhető — magasabb csúcsig törhetünk |
| **Csúcson** ⏺️ | vízszintes | ⚠️ nem visz feljebb, csak **előre** |
| **Lefelé tart** ↘️ | lefelé | ❌ **NEGATÍV hatás** — kontraproduktív rádolgozni |

**Kulcsszabály:** energiabefektetés **csak a vektor méretét** növeli,
**az irányt nem** változtatja meg.

### Külső hatások a hullámra

A hullámra **töri-** és **megoszló-erők** hatnak:
- **Töréspontok** — éles diszruptív események
- **Lenyomások** — tartós nyomó hatások

Ezek nemcsak az egyes hullámokra, hanem az **összesített hullámra** is
hatnak.

---

## Hogyan használjuk (assistant, implementáció-tervezet)

### Phase 1: definíció + szókincs (most)

- Ez a fájl mint kanonikus referencia
- A `current/principles/sleep-system.md`, `health-system.md`, `fit-system.md`
  ezt a 3-tengelyű modellt referálhatja (anyag = fit/health, mentál = fókusz,
  asztrál = hangulat)

### Phase 2: state-tracking (közeljövő)

Minden interakcióban (vagy napi rituálé szerint) a user röviden
visszajelez egy 3-koordinátás állapotot:
- Asztrál: `1-10` (vagy emoji)
- Mentál: `1-10`
- Anyag: `1-10`

Ezekből:
- Pillanatnyi összenergia
- Hullám-rekonstrukció időben
- Vektor-irány becslés
- Időzítési ajánlások (mikor érdemes nehéz feladatra ráállni, mikor pihenni)

### Phase 3: tudományos képlet-keresés (későbbi)

A user szerint ennek **van tudománya**, képletekkel. Ezek beazonosítása
+ implementáció — későbbi research-flow.

---

## Open kérdések

- **Q-3x3-1**: A 3×3 mátrix második tengelyének (létezés / hullám / kapcsolat) cella-jelentései?
- **Q-3x3-2**: Tracking-skála: 1-10 vagy más? (Likert / VAS / saját)?
- **Q-3x3-3**: Tracking-frekvencia: ébredéskor / lefekvéskor / interakciónként?
- **Q-3x3-4**: Hullám-paraméterek (hullámhossz, amplitúdó, rezgésszám) becslése — empirikus N nap után?
- **Q-3x3-5**: Töri- és megoszló-erők kategóriái? (event log mező?)
- **Q-3x3-6**: Vektor-irány **kiszámítása** trend-elemzésből (utolsó 3-5 mérés deriváltja)?
- **Q-3x3-7**: Az "összesített hullám" képlete: súlyozott átlag? mértani? saját?
- **Q-3x3-8**: A user "tudománya" — van írott formában? Hol találjuk?

---

## Kapcsolódó

- `current/principles/sleep-system.md` — anyag/mentál pihenés
- `current/principles/fit-system.md` — anyag fejlesztés
- `current/principles/health-system.md` — anyag karbantartás
- `current/life-goals.md` — az 1-es életcél a 3×3 tanulmány közzététele

---

## Migráció organizer-be (future)

Ez egy **state-tracking system** — az organizer-ben valószínűleg:
- Új modul: `state-checkin` (vagy hasonló)
- Sub-entitás: `3x3-snapshot` (3 dimenzió + timestamp)
- Heti/havi aggregátor view a hullám vizualizációhoz
- Esemény-mező: töri/megoszló erők naplózása

→ Future Feature Request kandidát.

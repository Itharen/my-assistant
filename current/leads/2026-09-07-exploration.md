# 🔍 T-41 FELTÁRÁS — támogatás / pályázat / hackathon / mikromunka

> **Owner (2026-09-07 13:30):** *„van egy csomó támogatás meg pályázat meg sales lehetőség
> amire rá kéne állítani egy agent-et"*

**Státusz:** feltárás — ⛔ **nem építettem meg semmit** (`uncertain-requests.md`).
**Dátum:** 2026-09-07 · **Cél:** eldönteni, MIT figyeljen, és MI legyen az az EGY funkció.

---

## 1. ⚠️ A feladat sorrendje ELLENTMOND a saját, ugyanaznapi korrekciódnak

A feladat így hangzott: *„támogatás meg pályázat meg sales"*. Néhány órával később viszont
ezt mondtad az AI Summitról:

> *„Előre kell venni a mikromunkák és hackaton szerű megjelenéseket. (Reklámnak és pénznek)"*
> — `current/principles/mvp-focus.md`

⇒ **A feladat a legalacsonyabb prioritású osztállyal kezdődik.** Nem javítom ki magamtól, de
jelzem, mert a sorrend meghatározza, mit építek először.

| # | Osztály | A te ugyanaznapi rangsorod szerint | Miért |
|---|---|---|---|
| 1 | 🏆 **Hackathon / megjelenés** | **ELŐRE** | pénz **és** reklám — ez utóbbit egy belső fejlesztés nem adja meg |
| 2 | 💼 **Mikromunka / sales** | **ELŐRE** | közvetlen bevétel, gyors ciklus |
| 3 | 📄 **Támogatás / pályázat** | hátrébb | lassú, papírmunka-nehéz, cég kell hozzá — de **nagy összeg** |

---

## 2. Mit figyeljen — konkrét, ellenőrizhető források

### 🏆 Hackathon (ezek **aggregátorok**, nem egyedi események — ezért érdemes figyelni)

| Forrás | Miért ez |
|---|---|
| `crafthub.events/hu/hackathonok/` | magyar nyelvű, Budapest-fókuszú gyűjtő |
| `dev.events/hackathons/EU/HU/Budapest` | fejlesztői események, régió-szűrővel |
| `hu.allhackathons.com` | magyar aggregátor |
| `gdg.community.dev` (Budapest / ELTE / BME chapterek) | a Google-közösségi AI-hackathonok itt hirdetnek |

⚠️ **Mérve 2026-09-07:** a keresés **csak 2026 tavaszi–kora nyári** eseményeket adott vissza
(GDE–MIT febr. 27–28., GDG Agentic AI ápr. 11., PwC AI ápr. 16.) — **őszi kiírást nem találtam**.
⇒ Vagy még nincs meghirdetve, vagy nem indexelt. **Ez pont az az eset, amiért figyelő kell:**
egy egyszeri keresés nem elég, mert a kiírás **később jelenik meg**.

### 💼 Mikromunka / sales
⏸️ **Itt nem tudom, mit tekintesz mikromunkának** — ez nyitott kérdés (lásd §5). Amíg ez nincs
meg, forrást sem érdemes választani: egy freelance-piactér és egy nyílt bounty-lista **teljesen
más** munkát jelent.

### 📄 Támogatás / pályázat
Kanonikus forrás a **`palyazat.gov.hu`** és a Széchenyi Terv Plusz felhívás-lista.
⚠️ A keresés főleg **pályázatíró cégek** és tanácsadói oldalak találatait adta — azok
**másodkézből** idéznek. A figyelőnek a **hivatalos** kiírást kell néznie.

---

## 3. 🔴 EGY IDŐZÍTETT TÉTEL, AMIT MOST TALÁLTAM — de MEG KELL ERŐSÍTENI

**DIMOP Plusz-1.2.6** — KKV digitalizációs támogatás.

| | |
|---|---|
| Összeg | 3–12 M Ft **vissza nem térítendő** |
| Támogatási intenzitás | 90% *(10% önerő)* |
| Budapesti régió benyújtás | **2026-09-01-től** |
| Határidő | **2026-10-27**, vagy forráskimerülésig |

⚠️ **UNVERIFIED — ne cselekedj rá ez alapján.** Ezek az adatok **pályázatíró cégek
összefoglalóiból** származnak, nem a hivatalos kiírásból. A számok, a jogosultsági feltételek
és a határidő **változhattak**. ⇒ Mielőtt bármit lépnénk, a **hivatalos felhívást** kell
megnézni a `palyazat.gov.hu`-n.

⏳ **Ami viszont akkor is igaz:** ha a nagyságrend stimmel, ez egy **most nyitva lévő, ~7 hetes
ablak**. Ez az egyetlen tétel, ami ebben a feltárásban **időzített**.

🙋 **Kell hozzá cég** — és nem tudom, a TERA-s/FDP-s cég-konstrukcióddal jogosult vagy-e.
Ez §5-ben nyitott kérdés.

---

## 4. Mi legyen az EGY funkció (javaslat)

> `current/principles/one-function-is-enough.md` — *„mindig túl sokat akarok, pedig itt semmi
> sem hozott egynél több funkciót"*

**Javaslat: `ma leads sweep` — egyetlen dolgot csinál: HATÁRIDŐS LISTÁT ad.**

```
forrás-jegyzék (fájl)  →  végigolvasás  →  amiben HATÁRIDŐ van  →  rövid Discord-lista
```

⛔ **NEM része:** automatikus jelentkezés · pályázatírás · profil-kitöltés · fizetős
adatforrás · bármi, ami a nevedben kifelé kommunikál.

⭐ **Miért pont ez:** a te szűk keresztmetszeted nem az, hogy nincs lehetőség — hanem hogy a
**határidő elmegy melletted**. A DIMOP-ablak épp ezt mutatja: szeptember 1. óta nyitva van, és
**ma jött szóba először**.

**Miért egy fájl-alapú forrás-jegyzék:** így te is bele tudsz írni egy sort *(„ezt is nézd")*,
és nem kell hozzá fejlesztés.

---

## 5. 🙋 AMIT NEM TUDOK ELDÖNTENI HELYETTED

| # | Kérdés | Miért blokkol |
|---|---|---|
| 1 | **Mi számít mikromunkának?** freelance megbízás · nyílt bounty · rövid tanácsadás? | e nélkül nem lehet forrást választani — teljesen más piacok |
| 2 | **Van jogosult céged** a KKV-pályázatokra? | ha nincs, a 3. osztály egésze tárgytalan |
| 3 | **A hackathonnál mi a cél:** pénzdíj vagy láthatóság? | más eseményeket érdemes figyelni |
| 4 | Melyik osztállyal **kezdjek**? | a te ugyanaznapi korrekciód szerint az 1-essel — de a DIMOP **időzített** |

---

## 6. Következő lépés

⏸️ **Owner-döntésre vár** — §5. Amint megvan az 1. és a 4. kérdés válasza, a `ma leads sweep`
egy körben megépíthető *(forrás-jegyzék + olvasás + határidő-kiemelés + Discord-lista)*.

📌 Ami **addig is** megtehető, ha rábólintasz: a **DIMOP hivatalos kiírásának** megnézése —
az ablak most nyitva van, és az ellenőrzés nem igényel új fejlesztést.

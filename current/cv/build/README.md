# CV build — HTML/CSS forras a Canva-PDF helyett

**Miert van ez:** az owner kerese (2026-09-10) — *„megprobalod eloszor teljesen reprodukalni a
jelenlegi CV-t? (Foleg azert, hogy megbizonyosodhassunk rola, hogy a kulonfele stilus elrendezesek,
stiluselemek megmaradnak a refaktoralas, illetve a frissites utan.)"*

A `current/cv/cv-9.0-2026-09-10.pdf` (Canva-export) **bit-szinten nem szerkesztheto**. Ez a mappa
ugyanazt a harom oldalt allitja elo HTML + CSS-bol, hogy a tartalom **cserelheto** legyen, a
**stilus es az elrendezes valtozatlanul**.

---

## Az eredmeny — mert egyezes

| Oldal | Szoveg-sor | Hianyzo sor | >1,5pt elteres | max \|dx\| | max \|dy\| |
|---|---|---|---|---|---|
| 1 | 111 | 1 * | 0 | 1,05pt | 1,15pt |
| 2 | 130 | 0 | 2 * | 1,20pt ** | 1,20pt |
| 3 | 100 | 1 * | 0 | 1,18pt | 1,43pt |

**341 sorbol 337 egyezik 1,5pt-on belul (98,8%).** A negy kivetel mind magyarazott artefakt:

- \* **1. oldal** `npm, JSON,  XML, …` — az eredetiben dupla szokoz, nalunk `&nbsp;`. Azonos rajzolat.
- \* **3. oldal** `IT HARE` — az eredetiben szoveg (Big Shoulders Display), nalunk az `emblem.png`
  resze (a neon-tabla es a szoveg egy kepbe van vagva a forrasbol).
- \*\* **2. oldal** ket URL — az eredeti span-je a **behuzo szokozoknel** kezdodik, a mienk a
  betunel. A **jobb szel** 1pt-on belul egyezik, tehat a lathato szoveg helye jo.

---

## Hogyan keszult — minden ertek MERT, egy sem becsult

A meresek forrasa a PDF maga (PyMuPDF): span-onkenti font/meret/szin, es a vektor-rajzok
geometriaja. A teljes leltar: `style-inventory.txt`.

### Tipografia (a beagyazott fontok nevebol)

| Szerep | Font | Meret | Szin |
|---|---|---|---|
| Nev | **Antonio Bold** (a PDF-ben `CAGenerated` neven, a font `name` tablaja arulja el) | 30,9pt | `#545454` |
| Display cimek (`Work Experience`, `SKILLS`, `Education`, …) | **Archicoco** (Canva-exkluziv stencil) | 10 / 12 / 13 / 14 / 16pt | `#d9d9d9` / `#a6a6a6` |
| Szerep-sorok | **Archivo Black** | 8 / 14pt | `#737373` / `#a6a6a6` |
| Torzsszoveg | **Arimo** (Regular / Bold / Italic) | 6 / 7 / 8 / 9pt | `#737373` / `#444440` |
| Sidebar bekezdes | **Assistant** (Regular / SemiBold) | 8pt | `#d9d9d9` / `#ffffff` |
| „IT HARE" | **Big Shoulders Display Bold** | 14pt | `#000000` |

### A ket nem-trivialis felfedezes

1. **Canva ~0,047em betukozt tesz MINDEN szovegdobozra — kiveve a fo-oszlop bullet-listait.**
   Ezt a szelesseg-aranybol lehetett visszaszamolni: a listasorok aranya `1,001` (azaz nincs koz),
   minden mas elemé `1,05–1,12`. Innen jott a `--track: 0.047em`. A betukozott display-elemeknel
   (`.s-head`, `.role`, `.s-block-title`) a mert ertek egysegesen **~0,30em**.

2. **Az `Archicoco` Canva-exkluziv, sehol nem beszerezheto.** A PDF-be viszont **subsetelve be van
   agyazva** — a harom oldal harom kulonbozo reszhalmazt visz. A haromat `fontTools.merge`-dzsel
   egyesitettuk: `fonts/Archicoco-merged.ttf` (a forras-darabok: `fonts/_source-subsets/`).
   ⚠️ **Lefedettseg:** ` .?ABCDEFGHIKLMNOPRSTUVWXYabcdefghiklmnoprstuwxy` — **hianyzik** a
   `J Q Z j q v z`, a **szamjegyek** es a **magyar ekezetek**. Uj display-cimhez elobb ellenorizni
   kell, hogy a betui benne vannak-e.

A tobbi font Google Fonts (OFL/Apache), lokalisan letoltve `fonts/`-ba — a render **nem igenyel
halozatot**.

### Kepek

| Fajl | Honnan |
|---|---|
| `portrait.png` | a PDF 1. oldalanak beagyazott kepe (324×454), CSS-bol vagva korre (d=137,5pt) |
| `emblem.png` | a 3. oldal emblema-teruletenek 400 dpi-s vagata (a gyuru + a nyul + az „IT HARE" tabla harom kulon kep a forrasban, itt egybe rajzolva) |

---

## Amit a reprodukcio KOZBEN talaltunk a forrasrol

A Canva-dokumentum **nem konzisztens racson** all. Ezek nem a mi hibaink, hanem a forras
tulajdonsagai — parameterkent visszuk oket, hogy az egyezes pontos legyen:

- **Oldalankent eltolt fo-oszlop:** bal szel `230,6` / `229,7` / `234,6`pt; szelesseg
  `336,1` / `341,8` / `336,1`pt.
- **Oldalankent eltolt sidebar-padding:** `24,4` / `26,2` / `25,0`pt (a 3. oldal „MY EXPECTATIONS"
  doboza ezen belul meg `20,4`).
- **Tetelenkent elteroe lista-lepcso** (`11,9` vagy `9,1`pt) **es sorkoz** (`9,34` vagy `9,62`pt).
- **Kezi sortoresek** 13 helyen (ott, ahol a szo meg elfert volna a sorban) — `<br>`-rel atvive.
- **Egy elcsuszott keszseg-sor:** a `Python → GIT` osztas `16,34`pt a tobbi `15,04` helyett.
- **A nyilas jelolok (▶) kezzel vannak elhelyezve** — nem kotodnek konzisztensen a mellettuk
  allo tetelhez (az 1. oldalon az elso nyil nem az „AI System Solutions", hanem az elso al-tetele
  mellett all).

Ezeket a `cv.css` `:root` + `.page--pN` valtozoi, illetve a `cv.html` inline `--valtozo`-i viszik.

---

## Hasznalat

```bash
bash render.sh                      # cv.html -> repro.pdf + repro-p{1,2,3}.png  (KONTROLL-MINTA)
python compare.py 0                 # soronkenti x/y osszevetes a forras-PDF-fel (0/1/2 = oldal)
bash render10.sh                    # cv-10.html -> cv-10.pdf + PNG-k            (a TENYLEGES CV)
bash fit.sh                         # belefer-e: 1600pt-os lapon meri a valodi tartalom-magassagot
python check-layout.py              # ⭐ a KESZ PDF-en: also margo MINDKET oszlopban +
                                    #   ATFEDES-kereses + jelolo-torlodas (exit != 0 = hiba)
python build-comparison.py          # OSSZEHASONLITAS-9.0-vs-10.0.pdf -- EZT nezi az owner
```

🔴 **Miert kell a `check-layout.py` a `fit.sh` MELLE:** a sidebar aljan **abszolut pozicionalt**
blokk ul (`bottom:32pt`), ezert az **mindig a legalso elem** — a „legalso sor" alapu margo-meres
tehat **szepnek mutatta** a sidebart, mikozben a folyo szoveg **belecsuszott** a blokkba.
Merve 2026-09-11: **107 x 8 pt atfedes**, amit az owner vett eszre, nem a szkript.
⚠️ Az atfedes-kereso csak **kulonbozo blokkok** kozott jelez: egy blokkon belul a nagy
display-sorok glifa-dobozai jogosan atfednek (a forras 9.0-ban a nev ket sora **7,49pt**-tal).

📌 **Merve, hogy ne lepjunk fel folosleges margo-vadaszatra:** a **forras 9.0** 2. oldalanak
also margoja **7,2 mm** (a reprodukcioe 7,8 mm). A 10 mm-es kovetelmeny a **10.0-ra** vonatkozik,
nem a regi lap reprodukciojara.

⚠️ **A `fit.sh` csak a FO-OSZLOPOT meri** (`x >= 215`). A **sidebart kulon** kell ellenorizni a
kesz `cv-10.pdf`-en — a 10 mm-es also margo ott is kotelezo, es a sidebar-szoveg bovitese
eszrevetlenul viszi el.

A `render.sh` Chrome headless `--print-to-pdf`-et hasznal. ⚠️ A Chrome **abszolut** utvonalat var
(`file:///$WD/…`), kulonben `Access is denied`.

---

## Kovetkezo lepes (a tenyleges feladat)

Ez csak a **bizonyitek**, hogy a stilus atveszi a refaktoralast. A frissites iranya (owner,
2026-09-10) valtozatlan:

- AI-fejlesztesi fokusz, B2B iranyba tolva
- kevesebb rizsa, tobb tenyadat
- **ket oldalra** szukitve
- ⛔ a **GDE MIT/TERA nem szerepelhet**
- a kiadatlan FDP-termekek **nev nelkul**
- **a stilus es az elrendezes marad** — ezert kellett ez a reprodukcio

Reszletek: `current/cv/2026-09-10-review.md`.

---

## ⚠️ Ismert, MÉRT eltérés a kontroll-mintában: az idővonal két vége

A `cv.html` (9.0 reprodukció) **szöveg-geometriája** 341 sorból 337-ben 1,5 pt-on belül egyezik.
A **karrier-vonal (idővonal) hossza** viszont nem mindenhol:

| Oldal | Eredeti szakaszok | Reprodukció |
|---|---|---|
| 1 | 213,6 .. 830,1 | 211,5 .. **803,2** *(26,9 pt-tal rövidebb alul)* |
| 2 | 10,5..526,4 · 518,2..709,9 · 707,1..821,4 | 32,2..497,2 · 516,8..704,2 · 703,5..821,2 |
| 3 | hat szakasz, per-tétel Canva-kvirkekkel | öt szakasz, más tagolással |

**Ok:** a reprodukció ellenőrzése a **szövegre** épült; a vektor-elemek közül csak a sáv-geometriát,
az elválasztókat és a pont/nyíl pozíciókat mértem — a vonal **végeit** nem.
⇒ 📌 **Tanulság:** ha egy elem *átível* több tételen, a **két végét külön kell mérni** — a közepe
attól még stimmelhet.

### A 10.0 karrier-vonala — a MÉRT, végleges viselkedés

| Hol | Hogyan | Miért |
|---|---|---|
| a vonal két vége | paraméteres: `--rail-top` / `--rail-bottom` / `--rail-h` | tételenként állítható |
| az „Education" elválasztónál | **megszakad, LÁTHATÓ RÉSSEL** — mérve **3,75 pt** felül és alul egyaránt | ⚠️ **owner-korrekció 2026-09-11 00:07:** *„az education elválasztó vonalat nem metszheti, és **nem érintheti**"*. A korábbi „nekiütközik felülről" viselkedés ezzel **elavult** — akkor a felső szakasz 679,5-nél végződött, az elválasztó 675,75..677,25-nél: **átmetszette**. Paraméterek: `--rail-bottom:-0.5pt` *(felső)* + `--rail-top:-34.5pt` *(alsó)* |
| a legutolsó tétel alatt | a vonal a **pontnál ér véget** (`--rail-h: 4.2pt`) | *„az A-level alatt nem kéne vonal legyen, onnan indul a vonal"* |
| ⚠️ a legutolsó pont **fölötti** szakasz | `--rail-bottom:-6.75pt` a *Civil Engineering* tételen | 🔴 **Mért csapda:** a `--rail-h` csak a **saját** tétele vonalát fogja meg — a **fölötte lévő** tétel `--rail-bottom:-12pt`-je viszont **átnyúlt rajta** és 793,5-ig futott, 3 pt-tal a pont **alja alá**. A „vége a vonalnak" tehát **két** paraméter, nem egy. Mérve 2026-09-11: most 786,75-nél áll, a pont (782,25..790,50) **belsejében** |
| a nyilas jelölők | a talpuk **a vonalon** áll — `left: calc(8.9pt - var(--rail-w))` | ⚠️ **KÉPLET, nem fix szám:** a vonal x-e a `--rail-w`-tól függ, ami oldalanként eltér (20,4 / 25,5pt). Fix értékkel a 2. oldalon 6pt-tal a vonal mellé csúszott |

⚠️ **A kontroll-mintában rögzítettük** a régi nyíl-eltolást (`--arrow-dx: -10.6pt` a `cv.html` 1. oldalán),
hogy a fenti képlet ne mozdítsa el — az eredetiben a nyíl `x=340,4`.


# 📄 CV — EGY HELYEN: a kiadások, a szabályok és az eszközök

> **Owner, 2026-09-11 01:32:** *„Mentsük ki véglegesnek, valahova mentsd el olyan helyre, ahol meg
> fogod találni később is. Illetve vezessük egy helyen őket… Lehetőleg dátumozva legyen hónapra.
> Tehát ez lesz a 2026-09-es. Ha legközelebb ezt írni kell, akkor egy helyen legyenek a szabályai,
> meg az eszközei."*

⭐ **Ez a fájl a belépési pont.** Ha legközelebb CV-t kell írni, **innen indulj**, ne a build-mappából.

---

## 1️⃣ KIADÁSOK — hónapra dátumozva

| Kiadás | Fájl | Mi ez |
|---|---|---|
| **2026-09** ⭐ **ez a legfrissebb** | `releases/2026-09/cv-2026-09.pdf` | 2 oldal, AI/B2B fókusz. HTML+CSS-ből épült, a forrás-pillanatkép mellette |
| 9.0 *(2026-09-10)* | `cv-9.0-2026-09-10.pdf` | 3 oldal, **Canva-export**. Ez az **előd** és egyben a **mérési etalon** — ⛔ **ne mozgasd**, a `compare.py` és a `build-comparison.py` erre az útvonalra hivatkozik |

**Minden kiadás mellett ott a forrás is** *(`.source.html` + `.source.css`)*: a PDF önmagában nem
szerkeszthető, a pillanatkép viszont bármikor újrarenderelhető.

### Új kiadás készítése

```
1. dolgozz a build/ mappában (cv-10.html + cv.css)
2. futtasd a 6 lépéses ellenőrzést (lent)
3. mkdir releases/<ÉÉÉÉ-HH>
4. másold: cv-10.pdf -> cv-<ÉÉÉÉ-HH>.pdf, a PNG-ket, és a forrás-pillanatképet
5. vedd fel a fenti táblába, és jelöld át a ⭐-ot
```

---

## 2️⃣ A SZABÁLYOK — mit szabad és mit nem

🔴 **A kanonikus szabálykönyv: [`../principles/cv-writing.md`](../principles/cv-writing.md)**
*(kettős célközönség, a ⛔-lista, tartalmi és formai szabályok, a 6 lépéses folyamat)*.

A ⛔-lista rövid emlékeztetője *(a teljes indoklás a szabálykönyvben)*:

| ⛔ Nem kerülhet bele | Miért |
|---|---|
| **GDE MIT / TERA** | owner-döntés |
| **kiadatlan FDP-termékek NEVE** | a képesség a termék, nem a név |
| **párhuzamos kapacitás** | *„ezt nem fogom senkinek az orrára kötni"* |
| **OGS / Oldlight Gaming Studio** | owner-döntés, körülírva sem |
| **„(in-house, pre-release)" típusú minősítés** | elég, hogy megcsinálta |
| **`·` középpont-elválasztó** | az emberi szemnek alig érzékelhető |

### Kiegészítő anyagok

| Fájl | Mire jó |
|---|---|
| `2026-09-10-review.md` | az irány és a névtelenségi tábla |
| `fleet-highlights.md` | **mi minden van még a flottában, ami CV-értékű** — ez a merítés a következő körhöz |

---

## 3️⃣ AZ ESZKÖZÖK — mind a `build/` alatt

| Parancs | Mit csinál |
|---|---|
| `bash render10.sh` | `cv-10.html` → `cv-10.pdf` + PNG-k. ⭐ **Frissesség-őrrel**: hibával áll meg, ha a Chrome némán bukott |
| `bash fit.sh` | belefér-e a 10 mm-es alsó margóba *(⚠️ **csak a fő-oszlop**)* |
| `python check-layout.py` | a **kész PDF-en**: alsó margó mindkét oszlopban, **átfedés-keresés**, jelölő-torlódás. `exit != 0` = hiba |
| `bash render.sh` + `python compare.py 0..2` | a **kontroll-minta** *(`cv.html` = a 9.0 reprodukciója)* nem mozdult-e |
| `python build-comparison.py` | `OSSZEHASONLITAS-...pdf` — **ezt nézi az owner** |

🔴 **A kötelező 6 lépés** *(a szabálykönyv §4)*: változtatás → `render10.sh` → `fit.sh` →
`check-layout.py` → `render.sh` + `compare.py` → `build-comparison.py`.
⛔ Csak akkor kész, ha mind a hat lefutott.

**A mérési módszer és a mért buktatók:** [`build/README.md`](build/README.md)
*(a betűk, a Canva-rács kvirkjei, a karrier-vonal geometriája, a néma render-bukás)*.

---

## 4️⃣ Amit a legutóbbi kör MEGTANÍTOTT — ⛔ ne kelljen újra felfedezni

| Csapda | Mit tegyél |
|---|---|
| A `fit.sh` **csak a fő-oszlopot** méri | a sidebart a `check-layout.py` nézi — az **átfedést** is |
| Az **abszolút pozicionált** blokk kilóg a folyamból | a „legalsó sor" alapú margó-mérés **vak rá** |
| A Chrome **némán bukhat** | a `render10.sh` frissesség-őre fogja meg; ⛔ a kimenetét ne nyomd el |
| Egy sor **szélessége** nem bizonyítja, hogy befér | a **sorok SZÁMÁT** kell nézni — a fejléc emiatt tördelt el |
| A karrier-vonal vége **két** paraméter | a saját tétel `--rail-h`-ja **és** a fölötte lévő `--rail-bottom`-ja |

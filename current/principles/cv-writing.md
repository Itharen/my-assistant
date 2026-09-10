# 📄 A CV írásának koncepciói és szabályai

> **Owner, 2026-09-10 23:29:** *„ennek a CV-nek elsősorban **B2B szaga** kéne legyen, de azt
> szeretném, hogy azért, hogyha jön egy **potenciális munka megkeresés**, akkor azért arra is
> alkalmas legyen. Lévén **több párhuzamos munkát is el tudok vállalni** ezekkel az eszközökkel.
> Ezt kb. amúgy fel is írhatjuk, illetve a **főbb koncepcióit a CV írásnak, meg szabályait, amit
> majd a jövőben is követni fogunk**."*

⭐ **Ez a fájl a CV kanonikus szabálykönyve.** Minden jövőbeli CV-frissítés ez ellen mérendő.

---

## 1️⃣ KETTŐS CÉLKÖZÖNSÉG — ez a legfontosabb szabály

| | Elsődleges | Másodlagos |
|---|---|---|
| **Ki olvassa** | cég / megrendelő, aki **szolgáltatást vásárol** | HR / hiring manager, aki **embert vesz fel** |
| **Mit keres** | mit nyer tőle, milyen kockázatot vesz le a válláról | tud-e, illeszkedik-e, mennyire megbízható |
| **Súly** | **B2B szag** — ez a domináns | ⛔ de NEM zárható ki |

### A gyakorlati következmény

- **Nem írunk semmit, ami kizárja az egyik olvasót.** ⛔ Nincs benne „állást keresek", ami gyengíti
  a B2B-t — de a **kontraktori forma nem elriasztás, hanem tény**, l. lent.
- A **„HOW I WORK"** blokk a **munkavégzés formáját** mondja ki, nem azt, hogy kitől fogadunk el munkát.
- ⭐ **A párhuzamos kapacitás ÉRV, nem kifogás:** az eszközei (agent-orkesztráció, saját
  framework-ök, automatizált tesztelés) miatt **több párhuzamos munkát is el tud vállalni** —
  ezt **hozadékként** kell megfogalmazni, nem korlátként.

### ⚠️ KORREKCIÓ (owner, 2026-09-10 23:45) — a „contractor only" MARAD

> *„A munkáltatónál is csak kontraktor."*

Először túl puhára vettem *(„open to longer, dedicated engagements")* — **rossz volt.**
A pontos állapot:

| | |
|---|---|
| **Kitől fogad el munkát** | ügyféltől ÉS munkáltatótól egyaránt ✅ |
| **Milyen formában** | ⛔ **kizárólag kontraktorként**, a saját cégén keresztül |

⇒ A CV-ben ez **egy mondat**, ami mindkettőt kimondja: *„Contractor only, through my own company —
that is the engagement form, whether the work comes from a client or from a company looking to hire.
Short projects and long, dedicated engagements alike."*

📌 **A tanulság:** a kettős célközönség NEM azt jelenti, hogy minden feltételt fel kell puhítani.
A **tényeket** nem puhítjuk — csak azt kerüljük, ami **feleslegesen** zár ki egy olvasót.
---

## 2️⃣ Tartalom-szabályok

| # | Szabály | Miért |
|---|---|---|
| 1 | **AI-fejlesztés a fő üzenet**, nem az Angular | ez a 2026-os valósága |
| 2 | **Kevesebb rizsa, több tényadat** | állítás bizonyíték nélkül B2B-ben a leggyengébb |
| 3 | ⛔ **GDE MIT / TERA nem szerepelhet** | owner-döntés, 2026-09-10 |
| 4 | 🔒 **Kiadatlan FDP-termékek NÉV NÉLKÜL** | *„egyelőre nincsenek release-eink"* — a **képesség** a termék, nem a név |
| 5 | ✅ **Nyilvános dolgok maradnak**: a cég, Dynamo, WarBots, HeloCia | van nyilvános oldaluk / már megnevezettek |
| 6 | **Két oldal**, mindkettő **tele** | *„legyen tele az a két oldal"* |
| 7 | **A stílus és az elrendezés NEM változik** | a 9.0 kontroll-minta ellen mérve |

### ⚠️ A százalékos csúszkák szabálya

Egy **18%-os** készség-csúszka **önmaga ellen szól**. A sávok csak olyan tételnél maradnak, ahol az
érték **erősít**; ami alacsony, az **szövegbe** megy (`Other knowledge`), így nem vész el, de nem is
kiabál.

---

## 3️⃣ Formai / technikai szabályok

- **A forrás a `current/cv/build/cv-10.html` + `cv.css`** — ⛔ a PDF már csak kimenet.
- **A kontroll-minta (`cv.html` = 9.0 reprodukció) SÉRTHETETLEN.** Ha egy CSS-változás elmozdítaná,
  **külön osztályt** kell csinálni *(l. `.contact-head--wide`, `.role--lead--center`,
  `--arrow-dx` rögzítés)*. Minden kör végén vissza kell mérni: **341 sorból 4 ismert artefakt.**
- **Minden geometriai állítás MÉRT**, nem szemre: `fit.sh` *(illeszkedés)* + `compare.py` *(egyezés)*.
- **Nyomtatási alsó margó ≥ ~10 mm** minden oszlopban — különben a nyomtató levágja.
- **Egy sorba EGY jelölő** — pont vagy nyíl, nem mindkettő *(kétszer is torlódott)*.
- ⚠️ **Ami több tételen átível** *(karrier-vonal)*, annak a **két végét külön kell mérni**.
- ⚠️ **Ami oldalanként eltérő rácson ül**, azt **képlettel** kell kötni, nem fix számmal
  *(a nyíl-eltolás a `--rail-w`-tól függ)*.

---

## 4️⃣ A folyamat

```
1. változtatás a cv-10.html-ben
2. bash render10.sh          → cv-10.pdf + PNG-k
3. bash fit.sh               → belefér-e (10 mm-es alsó margó)
4. bash render.sh + compare.py → a KONTROLL-MINTA nem mozdult-e
5. jelölő-audit               → minden pont/nyíl a sorához illeszkedik, nincs torlódás
6. OSSZEHASONLITAS-9.0-vs-10.0.pdf újraépítése → ezt nézi az owner
```

⛔ **Csak akkor jelentem késznek, ha mind az öt lefutott.**

---

## 5️⃣ Kapcsolódó

- `current/cv/2026-09-10-review.md` — az irány és a névtelenségi tábla
- `current/cv/build/README.md` — a mérési módszer és a mért értékek
- `current/cv/fleet-highlights.md` — mi minden van még a flottában, ami CV-értékű
- `current/principles/focus-support.md` · `swearing-is-a-scope-signal.md` — hogyan dolgozzunk együtt

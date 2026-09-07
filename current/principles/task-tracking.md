# 📋 HARD RULE — a feladatok mindig FÁJLBAN, három állapottal

> **Owner, 2026-09-07 12:13 (hangüzenetben) — SZÓ SZERINT:**
>
> *„Nagyon fontos, hogy megfelelően és alaposan mindig fájlokba mentve jegyezzük, hogy milyen
> feladatok vannak nyitva, mi az, ami in progress, és hogy mi az, amit már ténylegesen
> lezártunk, hogy ne sikkadhassanak el soha a feladatok, amiket elkezdtünk."*

---

## A szabály

**Minden feladat — nyitott, folyamatban, lezárt — a `__agent/TASKS.md`-ben él.**
Az a fájl a feladatok **SSOT-ja**.

| Jel | Állapot |
|---|---|
| 🔵 | nyitott |
| 🟠 | folyamatban |
| ✅ | lezárt **és igazolt** |
| ⏸️ | blokkolt *(a „mire vár" mezővel)* |

## ⭐ Amikor felmerül, AKKOR kerül be

⛔ Nem „majd a kör végén", nem „ha lesz időm". Egy feladat, ami csak a beszélgetésben létezik,
**egy kontextus-kompaktálásnyira van az eltűnéstől** — pontosan ez ellen szól az owner.

## ⚠️ A `✅` csak IGAZOLÁS után jár

„Megírtam" **≠** „kész". Kell hozzá teszt, mérés vagy élő próba — és az igazolás **oda van írva**
a tétel mellé.

🔴 **Miért szigorú ez:** a hamisan lezárt feladat **rosszabb, mint a nyitott**. A nyitottat
látjuk; a hamisan lezártat **soha többé nem nézzük meg**.

## A három nyilvántartás elhatárolása

| Fájl | Mire válaszol |
|---|---|
| **`__agent/TASKS.md`** | **MI VAN HÁTRA** — feladatok, állapottal |
| `__agent/CONTINUATION.md` | **HOGYAN ÁLLUNK** — állapot, mérések, tanulságok |
| `current/open-questions.md` | **MIRE KELL VÁLASZ** — owner-döntést igénylő kérdések |

⚠️ **A három nem helyettesíti egymást**, és ugyanaz a fél-frissítési hibaminta fenyeget, mint
a státusz-fájloknál *(`ENTRY.md` §5)*: ha csak az egyik frissül, a többi **némán elavul**.

## Kapcsolódó

- `__agent/ENTRY.md` §5 — a kör végi frissítés kötelező listája
- [[recording-discipline]] — „jegyezz fel" = kötelező rögzítés

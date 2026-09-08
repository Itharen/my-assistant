# 🔍 A HATÁST MÉRD, NE CSAK AZ OKOT

> **A hiba, ami kikényszerítette (2026-09-08 08:57):** az owner beszélt a hang-csatornában, és
> kiestem alóla. Jelentettem neki, hogy **egy build vitte el**, időbélyegekkel.
>
> **Owner:** *„Figyeltem közben a logokat, és a logokban nem láttam, hogy éppen újraindítás lett
> volna. Bőven előtte léptél ki."*

---

## Mit csináltam rosszul

| Amit mértem | Amit NEM mértem |
|---|---|
| ✅ belépés 08:52:29 | ⛔ **magát a kiesést** |
| ✅ felvétel indul 08:53:58 | ⛔ **mikor** estem ki |
| ✅ új pipeline 08:56:58 | ⛔ hogy az **okozta**-e |

🔴 **Volt egy okom és egy panaszom, és a kettőt összekötöttem.** A közéjük tartozó **eseményt** —
a tényleges lecsatlakozást — **sosem mértem meg.**

⭐ **Utólag kiderült, hogy nem is tudtam volna:** a naplóban **nincs kilépés-esemény**, egyáltalán.
24 belépés, 23 felvétel-indulás, 8 eldobás — és **0 kilépés**.

## A szabály

**Mielőtt okot állítok, meg kell mérnem a HATÁST is.** Külön eseményként, saját időbélyeggel.

```
❌ „X történt, és Y-t panaszolod → X okozta Y-t."
✅ „Y-t mértem ekkor és ekkor. X-et mértem ekkor. A kettő viszonya: …"
```

⛔ Ha a hatás **nem mérhető**, akkor az ok-állítás **nem tény, hanem hipotézis** — és így kell
kimondani.

## ⭐ A mélyebb tanulság

📌 **A megfigyelhetőség hiánya nem semleges: TERET AD A MESÉNEK.** Ahol nincs adat, ott a
magyarázat kitöltheti a helyét — és magabiztosan hangzik, mert az *okot* tényleg mértem.

⇒ Ezért a hiányzó naplózás **nem kényelmi kérdés**. A „nincs róla esemény" nemcsak azt jelenti,
hogy nem tudom megnézni — hanem azt is, hogy **tévedhetek anélkül, hogy kiderülne**.

*(Ugyanaz a család, mint az „egy mező neve nem a jelentése" — csak itt a mező **nem is létezik**.)*

## Kapcsolódó

- `current/principles/post-development-verification.md`
- `fdp-documentations/rules/global/core-no-guessing.md`

---

## 🔴 ÚJABB ESET, 2026-09-08 17:14 → 18:05 — „a RAM az ok" (ugyanaz a hiba)

**Amit állítottam (17:14, Discordon):** *„A hang-csatorna 16:32 óta üres. **Az ok mérve: RAM
92,5%**."*

**Amit egy órával később mértem:**

| Tény | Érték |
|---|---|
| A bot **visszalépett** | **17:42:47** |
| RAM **akkor** | **93,9 %** — ⭐ **MAGASABB**, mint a bukáskor |
| Belépések 17:00 óta | **2 sikeres / 10 sikertelen** |

🔴 **A cáfolat egyszerű:** ha a 92,5 % elég ok a bukáshoz, akkor a 93,9 %-on **nem sikerülhetett
volna** belépni. Sikerült. ⇒ A RAM **nem determináló ok** — legfeljebb hozzájáruló tényező egy
**flaky** kapcsolatban.

### Mit csináltam rosszul — pontosan

⚠️ **Két igaz mérést tettem egymás mellé, és okságot olvastam ki belőle:**
*(1)* a csatorna bukik · *(2)* a RAM magas. **Egyik sem hamis** — az **összekötésük** volt az.

⛔ **Ami hiányzott:** a **kontroll-megfigyelés**. Nem néztem meg, hogy **sikerül-e valaha
belépni magas RAM mellett**. Egyetlen ilyen eset megdönti az állítást — és volt is ilyen,
ugyanabban az órában.

### ⭐ A szabály, ami ebből következik

**Ok-állítás előtt keresd az ELLENPÉLDÁT, ne a megerősítést.**

```
„X okozza Y-t"  ⇒  Van olyan eset, ahol X FENNÁLL, de Y NEM következik be?
                   ⛔ Ha nem néztem meg → nincs ok-állítás, csak EGYIDEJŰSÉG.
```

📌 **Miért drága ez a hiba éppen itt:** az ownernek **cselekvési javaslatot** sugallt
*(indítsd újra a gépet)* egy **meg nem alapozott** indokkal. A javaslat maga védhető
*(11 nap uptime, 94 % RAM)* — de **nem azon az alapon**, amit mondtam. ⇒ A helyes forma:
*„a gép 11 napja megy és 94 %-on áll; a csatorna-hibát ez **nem magyarázza**, de az újraindítás
önmagában indokolt."*

⚠️ **Ugyanez a hibaosztály harmadszor:** *(1)* „a build vitte el a beszélgetést" *(a kiesést
sosem mértem)* · *(2)* a hamis „hang-csatorna nincs beállítva" *(a mező hiányából
következtettem a konfigurációra)* · *(3)* ez. **Mindháromban a HIÁNYZÓ megfigyelést
helyettesítettem következtetéssel.**

# 🎮 „Sok játék, mindet szeretem, egyikhez sincs kedvem" — VÁLASZTÁSI BÉNULTSÁG

> **Owner, 2026-09-12 05:13 (szó szerint):** *„Mindig az a bajom, hogy itt egy csomó játék, és a
> **többségét szeretem**, de valahogy **egyikhez sincs kedvem**."*

---

## 🔴 A DIAGNÓZIS — és miért NEM adat-probléma

Ugyanabban a percben kérte a **műfaj-szinkront** is. ⚠️ **De a kettő ellentétes irányba húz:**

```
több metaadat  →  több szempont  →  több opció  →  ROSSZABB bénultság
```

⭐ **A jelenség neve: choice overload.** Nem attól nem tud választani, hogy **keveset tud** a
játékokról — hanem attól, hogy **279-ből** kell választania, és **mindegyik „jó" válasz**.

📌 **Ez ugyanaz a minta, mint a `focus-support`-ban:** ott a feladatok között csapong, itt a
játékok között. ⇒ **A megoldás is ugyanaz: szűkítés, ⛔ nem gazdagítás.**

---

## ✅ AMIT CSINÁLOK — 3 opció, ⛔ nem 279

⭐ **A választék mérete a lényeg, nem a minősége.** Három konkrét cím, **indoklással**, amiből
**el lehet utasítani kettőt** — ez cselekvés, a lista-böngészés nem az.

### A szűrők, amiket a MEGLÉVŐ adatból tudok

| Szűrő | Mit használ | Miért működhet |
|---|---|---|
| 🕰️ **„szerettem, de rég volt"** | sok óra **+** rég játszott | bizonyítottan **bejött** neki, és a **hiányzás** önmagában húzóerő |
| ⏱️ **hossz** | *(jelöletlen — becslés)* | fél óra vs. egész este **más** játékot kíván |
| 🎭 **hangulat** | ⚠️ **nincs adatom rá** — tőle kell | a műfaj **nem** hangulat |

### Mért kiindulás — 2026-09-12

**Műfaj-profil** *(118 játék, store API)*: **Stratégia 64** · Szimuláció 54 · Akció 47 · RPG 43
· Indie 43 · Kaland 29.

**„Szerettem, de >1 éve nem" — top jelöltek:**
| Játék | Óra | Mióta nem |
|---|---|---|
| Total War: WARHAMMER II | 1 302 | 4,7 év |
| Path of Exile | 194 | 5,5 év |
| Deep Rock Galactic | 174 | 3,2 év |
| Sacred 2 Gold | 221 | 5,1 év |

---

## 🙋 A KÉRDÉS, AMI NYITVA — és ez dönti el a módszert

**Melyik szűrő a jó neki: hangulat · hossz · régi kedvenc?**
⚠️ Amíg ezt nem tudom, a hármas lista **találgatás marad** — jó találgatás, de az.

⛔ **Amit NEM csinálok:** „top 20 játékod" lista. Az **pontosan a probléma**, nem a megoldás.

Kapcsolódó: [[focus-support]] · [[focus-includes-life]] · [[dev-projects-skew-metrics]]
*(a WarBots-torzítás miatt a rangsor csak kizárás után érvényes)*

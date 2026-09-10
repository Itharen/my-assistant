# 🚚 HARD RULE — a törékeny, MŰKÖDŐ kódot átemeljük, nem átírjuk

> **Owner, 2026-09-07 12:37 (hangüzenetben) — SZÓ SZERINT:**
>
> *„Azt a feladatot is felvehetnénk, ami arról szól, hogy a régi CCAP-ból átemeljük a teljes
> voice communication megoldást. Ezt nagyon szeretném még előbb látni. Nagyon-nagyon fontos,
> hogy semmit nem szabad változtatni a kódban jelenleg, mert nagyon törékeny az a kód, de
> cserében meg egész jól működött."*

---

## A szabály

Amikor egy **működő** megoldást hozunk át egy másik projektből, az **átemelés**, nem újraírás:

- ✅ **másolás, majd a MINIMÁLIS illesztés** (import-utak, belépési pont, konfiguráció)
- ⛔ **nincs „közben rendberakom"**: átnevezés, tagolás, „tisztább" absztrakció, felesleges
  kód kigyomlálása — **egyik sem** fér bele
- ⛔ **nincs „ez nyilván fölösleges"** — a törékeny kódban gyakran pont az a sor tartja össze
  az egészet, ami feleslegesnek látszik

## 🔴 Miért — és miért pont ez a nehéz benne

> *„nagyon törékeny az a kód, de cserében meg egész jól működött"*

⭐ **A „működik" ITT a legértékesebb tulajdonság**, és **nem** olvasható ki a kódból. A
törékeny kód pontosan azért törékeny, mert a helyessége **nem látszik a szerkezetén** — sok
apró, kimondatlan feltevés tartja. Egy takarítás pont ezeket a feltevéseket törli el,
**némán**, és a hiba jóval később, máshol bukik ki.

| | Ha átemelem változatlanul | Ha „közben rendberakom" |
|---|---|---|
| Amit kapok | ⭐ egy **bizonyítottan működő** megoldás | egy szebb kód, **ismeretlen** viselkedéssel |
| Ha hibázok | jól látható illesztési hiba | 🔴 **néma** viselkedés-változás |

## Hogyan, gyakorlatban

1. **Előbb megmérem, mi FUT** — a forrás-viselkedés a referencia, nem a forrás-kód olvasata.
2. **Átmásolom**, és csak azt módosítom, ami **fordítási vagy futási** okból elkerülhetetlen.
3. **Minden ilyen módosítást felsorolok** — az illesztések listája a szállítmány része.
4. **A javítási ötleteket felírom, nem elvégzem.** Külön kör, külön döntés, működő alap után.

## ⚠️ Ez felülírja a szokásos reflexeimet

Az „egyértelmű javítást csináld meg" *(l. [[no-approval-for-obvious-fixes]])* itt **NEM
érvényes**: ott a javítás a meglévőt **jobbá** teszi, itt viszont a meglévő **működését**
kockáztatná. ⇒ Ugyanaz a próba, mint [[uncertain-requests]]-nél:
**„ha tévedek, ez elront valamit, ami most működik?"** — átemelésnél a válasz mindig **igen**.

## Kapcsolódó

- `__agent/TASKS.md` **T-22** — a voice control átemelése a régi CCAP-ból
- [[uncertain-requests]] · [[no-approval-for-obvious-fixes]] — a három szabály együtt húzza meg
  a határt aközött, hogy mikor nyúlok hozzá valamihez és mikor nem
- [[build-it-ourselves]] — miért a saját, meglévő megoldást emeljük át

---

## 🔴 2026-09-10 — „ÁTEMELTÜK" A HANGOKAT, DE NEM A JELENTÉSÜKET

> **Owner (hangcsatorna, 18:09):** *„ez egy furcsa hang, ami eddig nem létezett, szerintem ezt
> most szülted valahonnan, nem is értem hogyan és honnan. **Vissza kéne nézned nagyon alaposan,
> hogy a CCAP-ba milyen eseményhez milyen hangok társultak, azt kéne reprodukáljuk** — az már
> egy jól behangolt hangok voltak."*

**Amit tettünk:** a CCAP `sounds/` mappájából **átmásoltuk a fájlokat** — és utána **magunk
párosítottuk** őket eseményekhez. A `cue-understood.mp3` a `11L-subtle,_warm,_mallow-…`
másolata lett, ami a CCAP-ban **EGYETLEN eseményhez sem volt kötve**.

**Amit a forrás mond** *(visszaellenőrizve `ccap/discord-bot/src`-ben)*:

| esemény | hang | ahol |
|---|---|---|
| felismerés **indul** | `whoosh` | `cv-*-speech-recognition` |
| eredmény **elfogadva** | `typing` | `cv-result-review:178,185` |
| eredmény **kétes** | `hmmm` | `cv-result-review:200` |
| korai eldobás | `early-skip` | `cv-processing:99` |

🔴 **A `typing` tehát nem „hallak", hanem „elfogadtam".** Emiatt hallotta **rossz pillanatban**
— és emiatt tűnt „idegennek" a siker-hang, ami valóban nem is a CCAP-é volt.

### ⭐ A TANULSÁG: az átemelés nem a FÁJLOKRA vonatkozik, hanem a VISELKEDÉSRE

Az **eszközkészlet** átmásolása **nem** átemelés. A `transplant-not-rewrite` lényege, hogy a
**működő viselkedést** visszük át — és a viselkedés itt a **párosítás**: melyik esemény melyik
hangot szólaltatja meg. **A fájlok csak a nyersanyag.**

```
❌ „Átemeltük a hangokat."          → 5 mp3 a mappában
✅ „Átemeltük a hang-visszajelzést." → esemény → hang, ahogy az eredetiben volt
```

📌 **Az ellenőrző kérdés, ami elmaradt:** *„a FORRÁSBAN melyik sor játssza le ezt a fájlt?"*
Egy `grep playSound` megadta volna — **egy perc alatt**. Helyette a fájlnevekből következtettem
a jelentésre, és a nevek **mást sugalltak**, mint a használat.

⚠️ **És a hibát nem én vettem észre, hanem az owner — HALLÁS után.** Ez a legdrágább fajta
visszajelzés: a felhasználó veszi észre azt, amit egy `grep` megmutatott volna.

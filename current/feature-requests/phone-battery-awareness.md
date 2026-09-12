# 🔋 FR — Lássam a telefon töltöttségét, és szóljak, ha tölteni kell

> **Owner, 2026-09-12 18:24 (hang, szó szerint):** *„Jó lenne, hogyha [látnád], hogy **milyen
> töltöttségi szinten van a telefonom**, hogy tudja[m] elszólni, hogy **tölteni kell**."*
>
> *(Ugyanebben a percben: „közben még **indulnak a fejemben az ilyen jellegű feature request-ek**")*

**Státusz:** `🔵 felvéve` · ⛔ **nincs megkezdve**

---

## 🎯 MIÉRT ÉR EZ TÖBBET, MINT ELSŐRE LÁTSZIK

⚠️ **Nem kényelmi funkció.** Ma **kétszer** mérve, hogy a telefon a **kritikus** csatorna:

| Mérés | |
|---|---|
| 2026-09-11 03:27 | *„már az ágyban fekszem. Már a **telefonnal** beszélgetünk"* |
| 2026-09-11 10:32 | ⏰ az **ébresztés-eszkaláció** a Discord-pingen keresztül ért célba — **telefonon** |

🔴 **Ha a telefon lemerül, az ébresztő-lánc 2. lépcsője NÉMÁN elveszik** — és pont akkor, amikor
alszik, tehát **nem tudja, hogy nem kapta meg**. ⇒ Ez a `wake-escalation` **hallgatólagos
feltétele**, amit eddig ⛔ **nem mértünk**.

---

## ⚠️ A TECHNIKAI KORLÁT — ⛔ ezt előre ki kell mondani

**A telefon töltöttségét csak maga a telefon tudja megmondani.** ⇒ Kell **valami a készüléken**,
ami jelent. ⛔ Kívülről *(Discord, Google-fiók)* **nem látszik**.

**Irányok — ⚠️ egyik sem megmérve, ⛔ nem választottam:**

| Út | Mi kell hozzá | Megjegyzés |
|---|---|---|
| 📲 **Home Assistant companion app** | HA-példány | ⭐ kész megoldás, de **új rendszer** a flottába |
| 🤖 **Tasker / MacroDroid** *(Android)* | webhook a szerverünkre | ⭐ **kicsi**, nincs új rendszer |
| 📱 saját mini-app | fejlesztés + telepítés | ⛔ a legdrágább |

⚠️ **Mindegyik feltételezi, hogy a telefon Android** — ⛔ **nem tudom**, és nem tippelem.

📌 **`no-paid-solutions` + `build-it-ourselves`:** fizetős szolgáltatás ⛔ nem jön szóba.

---

## ⭐ A JAVASLATOM A FUNKCIÓ HATÁRÁRA — `one-function-is-enough`

⛔ **NE** legyen: töltöttség-grafikon · akku-egészség · több eszköz · statisztika.

✅ **EGY funkció:** *ha a töltöttség egy küszöb alatt van **és** ébresztés van betervezve
→ szólok.* ⭐ **A „szólok" itt DM**, ⛔ nem hangszóró.

🙋 **Owner-döntés kell hozzá** *(a hét tervezésekor)*: melyik utat választjuk, és **Android-e** a
telefon.

Kapcsolódó: [[wake-escalation]] · [[message-delivery-reliability]] · [[no-paid-solutions]]

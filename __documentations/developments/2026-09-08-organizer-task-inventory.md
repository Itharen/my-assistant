# Organizer feladat-leltár — 2026-09-08 21:40

> **Miért készült — owner hangüzenet, 2026-09-08 21:32 (gépi átirat, STT-hibákkal):**
> *„Azt hiszem az egyik fő feladatunk, fő prioritásunk … az lesz, hogy **rendezzük az
> adatokat, priorizáljuk őket**. Ezzel azt [együtt], hogy **melyik kié, melyik kié, melyik
> közös**. Általában hogyan kell ezeket kezelni, és **megtaláljuk az összes feladatot**, és
> ezeket alaposan [pri/de]prioritizáljuk. **Beállítsuk az ismétlődéseket**, stb."*

⚠️ **Ez leltár, nem beavatkozás.** A feladat-kezelés (**C-13**) **nincs jóváhagyva** ⇒ ⛔ egyetlen
organizer-tételhez sem nyúltam. Minden szám **mérés**.

---

## 📊 A mért állapot

| | Érték |
|---|---|
| **Nyitott** feladat | **140** |
| **Lezárt** feladat | **19** |
| Összesen | **159** — a lezárási arány **12 %** |
| 🔴 **Dátum NÉLKÜL** | **129 / 140 = 92 %** |
| 🔴 **Ismétlődő** | **5 / 140 = 3,6 %** |
| ⚠️ Duplikátum | **2 cím, 4 tétel** |
| ⚠️ Üres vagy `-` leírás | **14** |

### 🔴 A legfontosabb szám: `path` szerinti megoszlás

```
140 / 140  →  „Feladataim”
```

**Minden feladat EGYETLEN gyűjtőben van.** ⇒ Az owner kérdésére — *„melyik kié, melyik közös"* —
az adatban **jelenleg nincs válasz**. Nem rossz a besorolás: **nincs** besorolás.

---

## ⭐ Amit a leltár készítése KÖZBEN tanultunk (ez is a „rendezzük az adatokat" része)

🔴 **A `fo tasks.list` alapból 10 tételt ad vissza a 140-ből.** Első futásra pontosan ez történt:
*„OSSZES organizer-feladat: 10"*. **A 93 % némán hiányzott.**

⇒ Aki „megtalálja az összes feladatot" lapozás nélkül, az **hét százalékot** talál meg, és nem
kap hibát. ⛔ **Minden jövőbeli leltár `--cursor`-ral, lapozva készül** — ez a
`stocks` modulnál már bevett minta *(„complete paginated local snapshot")*, itt is az kell.

---

## 🔗 Mit magyaráz ez meg a korábbi rejtélyekből

| Korábbi tünet | Amit a leltár mond |
|---|---|
| **„A napi matrac nem ismétlődött"** *(owner, 09-08 09:58)* | Az organizer a következő előfordulást **lezáráskor** hozza létre — és a lezárási arány **12 %**. Nem az ismétlődés romlott el: **a lezárás marad el**, és ezzel megáll a lánc. *(`recurring-tasks.md`, T-58)* |
| **„Elsikkadnak a feladataim"** *(owner, 09-08 09:26)* | A 140-ből **129-nek nincs dátuma** ⇒ egy dátum-alapú emlékeztető **92 %-ukról soha nem szól**. |
| **A digest 11 „dátum nélküli, magas prioritású" tételt mutat** | Ez a 129 **kivonata**, nem kivétel. |

---

## ⏭️ A javasolt sorrend — ⛔ owner-jóváhagyásra vár (C-13)

1. **Gazda-jelölés** — `path` vagy `tag` szerint: **övé / közös / enyém**. Enélkül a többi lépés
   is találgatás. *(A rendszer-oldali terminológia már létezik: `task-tracking.md` 🤖 / 🤝 / 🙋.)*
2. **Duplikátumok** összevonása (4 tétel).
3. **Ismétlődések** beállítása azokon, amik nyilvánvalóan ciklikusak *(mosás, matrac, séta…)*.
4. **Dátum vagy tudatos „nincs dátum"** — a 129-ből amelyik valóban határidős, kapjon dátumot.

📌 **A leltár nyers adata:** ez a dokumentum a kivonat; a teljes pillanatkép újra előállítható a
fenti lapozott lekérdezéssel.

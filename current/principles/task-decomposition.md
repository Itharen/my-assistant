# Task decomposition — esedékes nagy task → bontás

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel.

---

## 2026-05-07 — alapvetés: bontás csúszáskor

> Még esetleg azt felírhatnánk ilyen fő alapvetésnek, hogy amikor túl nagy
> feladatotokat írunk föl, és az már esedékes, és még mindig halogatódik, hogy
> csúszik, vagy valami, olyankor fel kell ugye bontani kisebb részekre, az
> adott feladatot, hogy egy kicsit könnyebb legyen haladni vele, illetve
> elővenni.

---

## Implementációs jegyzet (assistant)

**Trigger:** task `dueDate` lejárt VAGY `recurring` task ≥1 missed cycle VAGY
manuálisan halogatott (subjektív "túl nagy").

**Művelet:** ha az assistant észleli a feltételt:
1. Javasolja a bontást: 2-5 konkrét sub-task, mindegyik ≤ 30-60 perc
2. Az eredeti task marad mint "parent" (description-be: "split into N sub-tasks ...")
3. Sub-task-ok kapnak külön `priority`-t (általában a parent ± 5)
4. Az új sub-task-ok közül egy "elsőlépés" típusú (alacsony belépési küszöb)

**Példák:**
- "Jogsi frissítés" — egészen amíg "egy task", nehéz nekivágni. Bontás:
  (a) okmányiroda időpont-foglalás, (b) szükséges papírok lista, (c) fotó,
  (d) orvosi alkalmasság, (e) tényleges intézés.
- "Bevételt kell szereznünk" — meta. Bontás: TERA-pályázat, Niche-launch,
  Upwork-első-feladat, stb.

**Anti-pattern:** ne csak "bontsd kisebbre" instrukció — javasolj **konkrét**
bontást, és kérdezz vissza ha kell pontosítás. A user nem akarja kitalálni a
sub-task-okat, ezt az assistant feladata.

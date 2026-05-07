# Priority system

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request / AC alapanyag.

---

## 2026-05-07 — alaptézis: halogatás-szorzó

> És aztán megközben szeretnék egy olyan prioritási rendszert is, aminek az a
> lényege, hogy ha valami már nagyon régóta halogatódik és még mindig, mondjuk
> már kétszer meg kellett volna történnie és még egyszer sem, akkor az
> valamilyen magasabb prioritási szorzót kell kapjon.

## 2026-05-07 — alaptézis: skála-irány és cross-project szorzók

> A feladatoknál, a prioritásnál én úgy képzeltem el, hogy minél magasabb a
> prioritás száma, annál magasabb a prioritás, ami azért is fontos, mert így
> jobban tudunk majd olyan prioritásrendszert kialakítani, aminek az a lényege,
> hogy ahogy meghatározzuk, hogy mondjuk egy projektnek vagy egy feladatcsoportnak
> mi a fő prioritása, Adhatunk szorzókat és ki fogunk tudni számolni általános
> prioritásokat cross projekt.

## 2026-05-07 — kapcsolódó: kaja-rendelés dinamikus prio

> ennek a prioritása például lehet, hogy nőhetne erősebben szóval hogyha most
> már szombat van és még mindig nem rendeltem kaját jövő hétre akkor ez a
> legfontosabb prioritás nagyon-nagyon magas prioritással kell rendelkezzen

> Ez egy konkrét példa arra, hogy egy ismétlődő / deadline-os feladat
> prioritása **dinamikusan nő** a deadline közeledtével vagy a kihagyott
> ismétlések számával. A halogatás-szorzó és a deadline-szorzó valószínűleg
> külön axis lesz, de összehangolt.

---

## Implementációs jegyzetek (organizer Feature Request alapanyag)

A fenti elvekből kiolvasható kritériumok (NEM a user szavai — ezek implementáció-tervezési jegyzetek):

- **Prioritás-skála**: nagyobb szám = magasabb prio (az organizer `priority` mező már így működik a probe alapján: 90-110 közötti értékek)
- **Halogatás-szorzó**: ha egy `recurring` task missed > 1 ismétlést, prio ×1.5 / ×2 (értékek finomhangolandóak)
- **Deadline-szorzó**: dueDate közeledtével prio nő (függvény-formára szükség van)
- **Projekt-szorzó (cross-project)**: minden task-group / project-nek van egy "fő prio" szorzója; egy feladat tényleges (cross-project) prioja = `task.priority × project.multiplier × halogatás_szorzó × deadline_szorzó`
- **Általános prio cross-projekt**: ezek alapján rendezhető az "ami most a legfontosabb" lista bármi feletti scope-ban

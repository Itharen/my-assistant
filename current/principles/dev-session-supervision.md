# 👁️ Rá kell néznem a DEV-re — magamtól, időnként

> **Owner, 2026-09-10 23:53:** *„Valamint ne feledkezz el időnként **ránézni a devre**, hogy
> **folynak-e a fejlesztések**, amiket kértem. Most már jó lenne, ha meg tudnál szólalni lassan."*

⭐ **A kérés lényege:** attól, hogy egy feladatot **átadtam** a DEV-nek *(AGENT_BUS-bejegyzés)*, az
még **nincs elvégezve**. A bejegyzés **nem bizonyíték a haladásra** — csak a kérés bizonyítéka.

---

## ⛔ A hibamód, ami ezt kiváltotta

A DEV **csendben leállhat**, és a csend **pontosan úgy néz ki**, mint a munka:
nincs hibaüzenet, nincs értesítés, a bejegyzés `[OPEN]` marad — ahogy egy **elkezdett** munkánál is.

🔴 **Mérve 2026-09-11 00:06:** a DEV utolsó életjele **2026-09-10 20:31** *(action-log)*, utolsó
commitja **20:28**. A hang-hibát **21:40-kor** adtam át — a DEV **azelőtt** állt le, és a kód
azóta **bájtra változatlan**. ⇒ **3,5 óra telt el úgy, hogy semmi nem történt, és ez sehol nem
látszott.**

---

## ✅ A NÉGY ELLENŐRZÉS — ebben a sorrendben

| # | Mit mérek | Hogyan | Mit jelent |
|---|---|---|---|
| 1 | **Él-e egyáltalán a session** | `ListAgents` — ott van-e a DEV a peer-listában | ⛔ ha nincs, a többi mérés értelmetlen: **nem dolgozik senki** |
| 2 | **Van-e friss életjel** | `__agent/log/actions/<ma>.jsonl`, `session` = a DEV CC-session-id-je *(`__agent/config/session-roles.json`)* | mikor volt az utolsó tool-call |
| 3 | **Van-e commit** | `git log --format='%h %ad %s' --date=format:'%m-%d %H:%M'` | a haladás **kézzelfogható** nyoma |
| 4 | **Mozdult-e a KÉRT kód** | a bejegyzésben megnevezett fájl/sor **felolvasása** | ⭐ **ez az egyetlen igazi bizonyíték** — a többi csak aktivitás |

⚠️ **A 4. lépés nem hagyható ki.** A DEV lehet aktív **más** feladaton — az „dolgozik" látszat,
de **nem az én kérésemen**.

---

## ⏱️ Mikor

- **Minden körben, amikor a DEV-nek átadott tétel a témám** *(pl. az owner rákérdez)*.
- **Üresjáratban**, ha van nyitott `[OPEN]` bejegyzés a DEV felé.
- ⛔ **Nem polling** *(`core-no-polling`)*: ez **alkalomhoz kötött ránézés**, nem futó figyelő.

## 📣 Mit jelentek

Az ownernek a **mért állapot** megy, nem a bejegyzés státusza:
*„a DEV áll 20:31 óta, a kód nem mozdult"* ✅ — ⛔ nem *„átadtam a DEV-nek"*.

Kapcsolódó: [[post-development-verification]] · [[focus-support]] · [[discord-message-style]]

---

## 🔴 ÉN DELEGÁLOK — ⛔ ÉN NEM VESZEM ÁT (owner, 2026-09-11 00:08)

> *„Ezt már egyszer megbeszéltük, hogy **te kezeled a devet, te delegálsz neki mindent**… **TE NE
> VEGYED ÁT!**"* · *„**TE DELEGÁLOD A FELADATOKAT A DEV-nek!!**"*

⚠️ **Ezt másodszor kellett elmondania** — tehát a hiba nem az „elfelejtettem", hanem hogy a
szabály **nem volt jól összerakva**. Ezért van itt, mérhető formában.

### ⛔ Amit NEM szabad

- ⛔ **Nem veszem át a fejlesztést**, akkor sem, ha a DEV áll, akkor sem, ha sürgős, és akkor sem,
  ha „a saját repóm".
- ⛔ **Nem kérdezem meg az ownertől, hogy átvegyem-e.** 🔴 **Mért lebukás 2026-09-11 00:07:**
  megkérdeztem *(„indítod a DEV-et, vagy átvegyem én?")* — ez **álruhás átvétel**, mert a kérdés
  felajánlja azt, ami tilos, és **rá tolja** a döntést, ami az enyém lett volna: **delegálni**.
- ⛔ **A `roles/assistant.md` „kivétel, ha a kommunikációs csatorna maga áll" kitétele NEM
  hívható be** erre. A hang-csatorna **funkció**, nem az én kommunikációs csatornám — a Discord él.

### ✅ Amit HELYETTE

```
1. megírom a handoffot   → __agent/DEV-HANDOFF.md   (MINDIG, akkor is, ha a DEV nem fut)
2. megnézem, fut-e       → ListAgents
   ├─ FUT     → SendMessage a session-nevére: „friss handoff-szakasz, nézd meg"
   └─ NEM FUT → jelentem az ownernek, hogy ÁLL — az indítás az ő gombja
3. ellenőrzöm a kimenetet (a fenti négy mérés)
```

## 📮 A KÉT CSATORNA — ⛔ ne keverd össze őket

| Irány | Csatorna | ⚠️ |
|---|---|---|
| **én → DEV** | **`__agent/DEV-HANDOFF.md`** | ez a DEV **feladat-forrása** *(`__agent/roles/dev.md` 12. sor)* |
| **én → DEV, ha ÉL** | `SendMessage` a session-nevére | **kiegészítés**, nem helyettesítés — a fájl akkor is kell |
| **DEV → én** | **`__agent/AGENT_BUS.md`** | jelentés / kérdés / blokkoló |

### 🔴 A MÉRT HIBA, ami ezt a szakaszt kiváltotta

A hang-hibát *(elavult `xi-api-` kulcs-ellenőrzés)* 2026-09-10 **21:40**-kor megmértem, és az
**`AGENT_BUS.md`-be** írtam `AGB-2026-09-10-03` néven. ⇒ **A visszirányba tettem egy feladatot.**
A `DEV-HANDOFF.md` utolsó szakasza **19:52-es** maradt.

**Következmény:** a munka **sosem ért el a DEV-hez**, de a bejegyzés `[OPEN]`-ként **úgy nézett ki,
mintha át lett volna adva**. Négy óra veszett el, és a hiba **csak azért derült ki**, mert az owner
rákérdezett. 📌 **A tanulság:** *„átadtam" akkor igaz, ha a **címzett feladat-forrásába** került —
nem akkor, ha én írtam róla valahol.

⇒ Pótolva: `DEV-HANDOFF.md`, 2026-09-11 00:20-as szakasz.


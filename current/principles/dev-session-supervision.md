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

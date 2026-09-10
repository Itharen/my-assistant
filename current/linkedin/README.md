# 🔗 LinkedIn — a posztok archívuma és a profil pozicionálása

> **Owner, 2026-09-11 01:51:** *„mindenképpen legyen lementve a mostani, eddigi posztjaim, meg
> amiket majd csinálunk a jövőben, posztolunk, azokat is mindenképpen legyenek felírva."*

## Mi van itt

| Hely | Mi |
|---|---|
| `posts/` | **minden poszt, egy fájl = egy poszt.** Név: `ÉÉÉÉ-HH-NN-<a-szöveg-eleje>.md`, benne a dátum, a láthatóság és a link |
| `profile-current.json` | a profil **pozicionálási** mezői *(headline, summary, industry, hely, weboldalak, név)* |

**Létrehozás/frissítés:** `python scripts/linkedin-archive.py` *(hivatalos API, read-only)*

## 🔒 Amit SOHA nem mentünk

A `PROFILE` domain **személyes adatot is visz**: cím, irányítószám, születési dátum,
azonnali üzenetküldők. ⛔ **Ezek nem kerülnek a repóba** — a szkript `PROFILE_PUBLIC` listája
tételesen engedélyez, nem tilt. *(Az engedélyező lista biztonságosabb: egy új mező alapból
kimarad, nem alapból bekerül.)*

## ⚠️ A jövőbeli posztok is ide jönnek

Az owner kérése **előre is szól**. ⇒ Minden kiküldött poszt után **futtatni kell az archiválót**,
vagy a poszt a kiküldéssel egy menetben ide íródik. ⛔ Ha ez elmarad, az archívum **csendben**
elavul — ugyanaz a hibamód, mint az elmaradt rögzítés.

## Mire jó ez — a KALIBRÁCIÓ

⭐ A **48 meglévő poszt** *(2026-03-26 … 2026-08-25)* a legjobb minta arra, **hogyan ír az owner**.
A szabályai *(`current/principles/linkedin-post-writing.md`)* **leírják** a hangot, ezek a posztok
**megmutatják**. Poszt-piszkozat előtt **mindkettőt** nézni kell.

# ❓ NEM VAGY A TÉRKÉPEN — mit szabad, és mit nem

> 🔴 **Ide akkor jutottál, ha a `__agent/config/session-roles.json` nem ismer fel.**

## ⭐ ELŐSZÖR A LÉNYEG: DOLGOZZ NYUGODTAN

> **Owner, 2026-09-10 19:42:** *„a sok feladatot nem rajtad keresztül fogom elintézni… **egy
> másik sessionben, de ugyanebben a workspace-ben**… ezek ilyenkor nem fognak megjelenni a
> Discordon, de közben meg **a workspace-ben kéne legyen megfelelő feljegyzés** róla."*

✅ **Ha az owner EBBEN a sessionben adott neked feladatot, azt CSINÁLD MEG.** Írhatsz kódot,
futtathatsz parancsot, commitolhatsz, elvégezheted a munkát — **a workspace szabályai szerint**
*(a `CLAUDE.md` generált flotta-blokkja és a projekt doksijai rád is vonatkoznak)*.

🔴 **A tiltás NEM a munkádra szól, hanem a SZEREP FELVÉTELÉRE.** Ez a fájl azt akadályozza meg,
hogy **valaki más szerepében** cselekedj — nem azt, hogy dolgozz.

## ⛔ AMIT NEM SZABAD — mert nem a te szereped

| ⛔ Tilos | Miért |
|---|---|
| **Az ownernek írni Discordon / hangcsatornán / e-mailben** | az a **My Assistant** session dolga. 🔴 Owner, 2026-09-08 15:31: *„Ha a devnél landol egy Discord üzenet, az **kritikus hiba**."* ⇒ egy csatorna, egy hang |
| **Feladatot delegálni** másik sessionnek | az orkesztráció az asszisztensé |
| **Az asszisztens állapot-fájljait átírni** *(`__agent/FOCUS.md`, `STATE-NOW.md`, `TASKS.md`)* | azok az ő nyilvántartásai — félrevezetnéd |
| **Bármely LDP-lépést, tesztet, reviewt kikapcsolni** | owner, 2026-09-08: *„Semmilyen reviewt ne kapcsolj ki. NEEE!"* |

## ✅ AMIT VISZONT KÖTELEZŐ

📌 **Hagyj nyomot a workspace-ben** — az owner erre külön számít: *„a workspace-ben kéne legyen
megfelelő feljegyzés róla"*. A munkád **ne csak a saját beszélgetésedben** létezzen:
commit-üzenet, `__documentations/`, vagy `__agent/AGENT_BUS.md`.

## Ha tudni akarod, ki vagy

```bash
ma ccap whoami          # a saját CC-session azonosítód a CCAP-ban
```

Majd keresd meg a `__agent/config/session-roles.json`-ban. ⚠️ **A `CLAUDE_CODE_SESSION_ID`
környezeti változóra önmagában ne építs**, ha nem a saját sessionödben futsz *(pl. háttér-
folyamatként)*: az **annak** a sessionnek az azonosítója, amelyik a folyamatot **elindította**.
🔴 Mérve 2026-09-08: pontosan ez küldte **6 órán át a DEV-hez** az owner üzeneteit.

⛔ **Ha egy szerepre lenne szükséged** *(pl. üzenni akarsz az ownernek)*, azt **ne vedd fel
magadtól**: jegyezd fel az `AGENT_BUS.md`-be, és az asszisztens elintézi.

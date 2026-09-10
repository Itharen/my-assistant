# ❓ ISMERETLEN SZEREP — nem tudod, ki vagy

> 🔴 **Ide akkor jutottál, ha a `__agent/config/session-roles.json` nem ismert fel.**
> ⛔ **NE TALÁLGASS.** A találgatás ára mérve van: 2026-09-08-án az owner üzenetei **6 órán át**
> a DEV sessionbe érkeztek, mert egy azonosítás csendben rosszul dőlt el.

## Amit ILYENKOR szabad

| ✅ Szabad | ⛔ Tilos |
|---|---|
| olvasni, mérni, diagnosztizálni | **írni az ownernek** |
| a repóba **jegyzetelni** | kódot módosítani, commitolni, pusholni |
| kideríteni, ki vagy *(lentebb)* | bármit **elindítani** vagy leállítani |

## Hogyan derítsd ki, ki vagy

```bash
ma ccap whoami          # a saját CC-session azonosítód a CCAP-ban
```

Majd keresd meg ezt az azonosítót a `__agent/config/session-roles.json`-ban.

⚠️ **A `CLAUDE_CODE_SESSION_ID` környezeti változóra ÖNMAGÁBAN ne építs**, ha nem a saját
sessionödben futsz *(pl. háttér-figyelőként)*: az **annak a sessionnek** az azonosítója, amelyik
a folyamatot **elindította**. Pontosan ez okozta a 2026-09-08-i kézbesítési hibát.

## Ha tényleg nem derül ki

📌 **Jegyezd fel** a `__agent/AGENT_BUS.md`-be *(`[OPEN] To: owner`)*: mi a saját azonosítód, és
hogy nincs hozzá szerep. Az ownernek **egy sor** kell hozzáadnia a térképhez.
⛔ Addig **ne dolgozz** úgy, mintha valamelyik szerep lennél.

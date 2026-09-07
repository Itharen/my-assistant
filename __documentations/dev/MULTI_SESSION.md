# Több sessionből beszélgetni Honnie-val — mit bír a rendszer MA

> **Owner-kérdés (2026-09-07 06:30):** *„mennyire tűri jelenleg a rendszer azt, hogy
> össze-vissza különféle sessionökből beszélgessek veled. Gondoltam rá, hogy egy Codex
> sessionből is megpróbálnálak, megpróbálnék beszélgetni ma veled…"*

> **Ellenőrizve: 2026-09-07 06:31, élő méréssel.** Minden állítás alatt ott a mérés.

---

## Rövid válasz

| Amit csinálni akarsz | Bírja? |
|---|---|
| **Discordról írni, akárhonnan** | ✅ **Igen** — a Discord egy bejárat, nem session |
| **Több CC session, párhuzamosan** | 🟡 **Részben** — a Discord **EGY** sessionbe visz, és az nem az, amelyikre gondolnál |
| **Codex sessionből beszélgetni** | 🟡 **Igen, de** — Codex **nem kap** Discord-üzenetet, és **nem tud** Discordra válaszolni, hacsak nem futtat parancsot |
| **Két agent EGYSZERRE dolgozni ugyanezen** | 🔴 **Nem biztonságos** — közös állapot-fájlok, közös git |

---

## 1. 🔴 A törékeny pont: a Discord-kézbesítés egy KÖRNYEZETI VÁLTOZÓN múlik

### A mérés

```bash
$ ma ccap whoami --json
{"ok":true,"result":{"sessionId":"ccs-6f25a888-mtp9a8cx","label":"My Assistant", …}}

$ env -u CLAUDE_CODE_SESSION_ID  ma ccap whoami --json
{"ok":false,"error":{"code":"MA-CCAP-NO-SESSION-ID-ENV",
  "message":"A CLAUDE_CODE_SESSION_ID környezeti változó üres vagy hiányzik."}}
```

### Mit jelent ez

A Discord-figyelő a köteget a **CCAP `prompt` végpontján** juttatja be, és ehhez fel kell
oldania, **melyik CC session vagyok**. A feloldás *(`cli/src/ccap/ccap.identity.ts`)*
kizárólag a **`CLAUDE_CODE_SESSION_ID` környezeti változóból** indul ki.

A figyelőt a szerver indítja, a szerver az LDP alatt fut — tehát a változó **onnan öröklődik,
aki az LDP-t elindította.**

```
aki elindította a `dc ldp`-t   →   LDP   →   szerver   →   Discord-figyelő
        └── az Ő CLAUDE_CODE_SESSION_ID-ja megy végig a láncon ──┘
```

⇒ **Jelenleg azért működik, mert az LDP-t EGY CC session indította el** *(2026-09-07 01:30)*,
és a változó végigöröklődött.

### 🔴 A kockázat

| Ha… | Akkor |
|---|---|
| te indítod az LDP-t egy sima terminálból | a változó **nincs meg** → a kiküldés `MA-DISCORD-FLUSH-FAILED`-del elbukik |
| az a CC session lezárul, amelyiktől örökölte | a `ccs-…` **elavul** → a bejuttatás elbukik |
| több CC session fut | a Discord **abba** megy, amelyik az LDP-t indította — nem a legfrissebbe, nem mindbe |

✅ **Ami jó hír:** ez **NEM néma**. A kiküldési hibát naplózzuk *(első alkalommal azonnal,
utána 5 percenként)*, és az üzenetek **a kötegben maradnak** — nem vesznek el, csak várnak.

---

## 2. A javítás — amit az owner eredetileg kért

> **Owner, 2026-09-06:** *„fel kell jegyezni valami konfigba, hogy te melyik session vagy a
> CCAP-ban. (nem CCAP Session, hanem CC Session a CCAP-ban!)"*

Ez a konfig **még nem készült el** — a feloldás jelenleg csak futásidejű. A terv:

```
1. CLAUDE_CODE_SESSION_ID env      ← ha van, ez nyer (a session önmagát ismeri fel)
2. konfig: a session CÍMKÉJE       ← pl. label = "My Assistant"
      └─ a CCAP session-listájából kikeressük a címke alapján
3. hiba, leíró üzenettel
```

⭐ **Miért a CÍMKE és nem az azonosító:** a `ccs-…` **indításonként változik**, a
`label: "My Assistant"` **stabil**. *(Mérve: a jelenlegi session címkéje pontosan ez.)*

⇒ Ezzel a Discord **mindig** ahhoz a sessionhöz megy, ami az „asszisztens" szerepet viszi —
**függetlenül attól, ki indította az LDP-t**, és hány session fut.

---

## 3. Codex-session — mi megy és mi nem

| | |
|---|---|
| ✅ **Ugyanazokat a szabályokat kapja** | az `AGENTS.md` törzse **bitre azonos** a `CLAUDE.md`-vel *(ellenőrizve)*, és ugyanazokra a fájlokra mutat: `IDENTITY.md`, `workflow-rules.md`, `ENTRY.md` |
| ✅ **Ugyanazt az állapotot látja** | `current/`, `__agent/`, a naplók — mind fájl-alapú |
| ⛔ **NEM kap Discord-üzenetet** | a bejuttatás a **CCAP** `prompt` végpontján megy, Codex pedig nem CC session a CCAP-ban |
| 🟡 **Tud Discordra írni** | ha futtatja: `ma comm say --text "…"` — a küldés nem függ a session-azonosságtól |
| ⚠️ **A válasz-kötelezettség számlálója közös** | ha Codex küld Discordra, az „nyugtázza" a tartozást — akkor is, ha a CC oldal nem is látta az üzenetet |

---

## 4. Amire MA figyelj, ha több helyről beszélsz

| # | Szabály | Miért |
|---|---|---|
| 1 | **Egyszerre EGY agent írjon** a `__agent/` és `current/` fájlokba | ezek markdown-ok, nincs zárolás — a párhuzamos írás **csendben felülír** |
| 2 | **Egyszerre EGY agent commitoljon** | a verzió-emelő hook + a git index ütközik |
| 3 | A **Discord marad a fő csatorna** | az megy oda, ahova kell |
| 4 | Ha Codexszel beszélsz, **mondd meg neki, hogy Codex** | különben mindkettő azt hiszi, ő „az" asszisztens |

⚠️ **Az action-log kivétel:** append-only JSONL, tehát a párhuzamos írást elbírja. A
`STATUS.md` / `CONTINUATION.md` **nem**.

---

## 5. Nyitott kérdések

`current/open-questions.md` **L)** szekció.

## Kapcsolódó

- `cli/src/ccap/ccap.identity.ts` — a feloldás kódja
- `__documentations/dev/DISCORD_BOT_SETUP.md` — a csatorna felépítése
- `current/principles/message-delivery-reliability.md` — a kézbesítés megbízhatósága

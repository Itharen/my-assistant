# WORKFLOW-SZABÁLYOK — MINDEN workflow-ra érvényesek

> 🔴 **NO-CACHE.** Minden workflow-futás elején **frissen** olvasandó.
>
> **Forrás (SSoT):** `current/principles/workflow-system.md` — ott a user **szó szerinti**
> szövege. Ütközés esetén a forrás nyer.

> **Owner-indok (2026-09-07):** *„benne legyen mindig az emlékeztető is arra, hogy hogyan
> használjuk a workflow-t. És hogy ne hagyjunk ki semmilyen szabályt. Mert nagyon sok és
> szerteágazó szabályunk lesz. Fontos, hogy ezek a szabályok mindenre a workflow-ra
> vonatkoznak."*

---

## 0. Miért létezik ez a fájl

A workflow-kat **nem** frissen indult, mindent fejben tartó agent olvassa. Tipikusan
**kontextus-kompaktálás után** kerülnek elő, amikor a szabályok már kiestek. Ezért:

> ⭐ **Egyetlen workflow sem támaszkodhat arra, hogy „ezt úgyis tudom".**
> Minden flow **magával hordja** a rá vonatkozó szabályok belépőjét.

---

## 1. A KÖTELEZŐ FEJLÉC-BLOKK

Minden flow `README.md`-je **ezzel kezdődik**, szó szerint (a `{}` helyekre a flow adatai):

```markdown
> 🧭 **HASZNÁLATI EMLÉKEZTETŐ — ne ugord át.**
> **Ki vagy:** `__agent/IDENTITY.md` (Honnie) · **Minden workflow szabálya:**
> `__agent/workflow-rules.md` · **Belépési pont:** `__agent/ENTRY.md`
> **Mindhármat FRISSEN olvasd be** — kompaktálás után a fejedben már nincsenek meg.
>
> **Ehhez a flow-hoz tartozó külön szabályok:** {felsorolás vagy „nincs"}
> **A flow adatforrása(i):** {`fo {modul}` / `current/{modul}/` — előbb `SOURCE_OF_TRUTH.md`!}
> **Kilépési feltétel (a kész definíciója):** {egy mondat}
```

⛔ **Fejléc-blokk nélküli flow-t nem futtatunk** — előbb pótoljuk.

---

## 2. A 8 SZABÁLY, AMI MINDEN FLOW-RA VONATKOZIK

### ① Előbb az azonosság, aztán a munka
`IDENTITY.md` → a három réteg (baseline / elsődleges / üresjárat). **Melyik sávban vagy?**
Rossz sáv = rossz munka, akkor is, ha jól csinálod.

### ② Tilos a találgatás — a hiányzó tudás ❓ NYITOTT
Ha egy preferencia / szabály / adat nincs meg, **nem találod ki**. Felveszed:
`current/open-questions.md`, és a flow-ban `❓ NYITOTT`-ként jelölöd.
*(Globális: `core-no-guessing`.)*

### ③ Előbb a SOURCE OF TRUTH, aztán az adat
Bármely modul adatához nyúlás **előtt**: `__agent/SOURCE_OF_TRUTH.md`.
`organizer-verified` → csak `fo` CLI · `local` → csak `current/{modul}/` · `organizer-partial`
→ olvasás igen, írás user-megerősítéssel · `dual` → **kérdezz**.

### ④ FAM — előbb PROJEKT, aztán flotta
Discovery/recall **FAM-mal kezdődik**, grep/filesystem ELŐTT.
**Alapértelmezés a projekt-hatókör:**
```
scopeFilter: [{ layer: 'project', rawName: 'my-assistant' }]
```
Flotta-hatókör (szűrő nélkül) **csak akkor**, ha tényleg flotta-mintát keresel (FDP-konvenció,
más projekt megoldása). *(Mérve: projekt-szűrővel 34 releváns / 71 483 elem.)*

### ⑤ Minden akció action-logot ír
Flow-start, flow-end, döntés, állapot-váltás, hiba → `ma action-log emit`.
🔴 **A csendes kör is naplózandó** — az „úgysem történt semmi" épp az a hiba, amit nem
látunk meg. *(Séma: `__agent/log/actions/README.md`.)*

### ⑥ A user szava azonnal rögzül
Ha a user menet közben mond szabályt / szokást / preferenciát → **ugyanabban a körben**
`current/principles/` alá, **szó szerint**, és visszajelzés, hova került.
⛔ Chatben hagyni = elveszett.

### ⑦ A kimenet a userhez szól — és ⭐ DISCORDRA megy
**Rövid, tömör, emoji-val, listákban.** Hosszú paragrafus TILTOTT.
Amit a user LÁT, arra naiv-felhasználó szemmel is ránézünk.

🔴 **DISCORD-FIRST (owner, 2026-09-07):** ami **érdemi**, az **Discordra megy** — nem csak a
sessionbe. **Több üzenet egy körben SZABAD.**

> **Ellenőrző kérdés minden kör végén:** *„Ha a user ebben a pillanatban elindulna otthonról,
> elveszne bármi abból, amit most leírtam?"* — ha igen, az **Discordra való**.

⚠️ **A mért hiba, amiből ez lett:** a session-választ kezeltem fő válasznak, a Discordot
kivonatnak. Amíg a user a gépnél ült, ez **működni látszott** — de ahogy elindul otthonról,
a session-válasz **láthatatlan**, tehát az ott hagyott info **elveszett**.

*(`current/principles/discord-first-output.md` · `working-style.md`.)*

### ⑧ Lezáráskor: mi maradt nyitva
A flow **te mondod ki, hogy kész** — és megmondod, **mi maradt nyitva**, és mi a
**következő konkrét lépés** alternatívákkal. *(`current/principles/working-style.md`.)*

---

## 3. A SZABÁLY-BELÉPŐ — a teljes készlet, sosem rövidítve

Ez a fájl **NEM tartalmazza** az összes szabályt — pointereket ad, mert a szabályok
**szó szerint és teljes egészében** viendők tovább, vagy **explicit pointerként**
(`core-rule-integrity`). Lossy parafrázis TILOS.

| Réteg | Hol | Mikor olvasd |
|---|---|---|
| **Flotta-globális hard rule-ok** | `CLAUDE.md` / `AGENTS.md` generált blokkja + `fdp-documentations/rules/` | mindig érvényesek; ha egy szövegére szükség van, **teljes egészében** olvasd be |
| **A user szó szerinti szabályai** | `current/principles/` | a feladat-típushoz tartozókat MINDIG |
| **Projekt-működés** | `CLAUDE.md` lokális szekciója (a záró marker UTÁN) | session-kezdéskor |
| **Ez a fájl** | `__agent/workflow-rules.md` | MINDEN workflow-futás elején |
| **Flow-specifikus** | az adott flow `README.md`-je | a flow futtatásakor |

⚠️ **A lokális réteg védelme (mért, 2026-09-07):** a flotta-blokk a
`<!-- FDP-FLEET-RULES:BEGIN/END -->` markerek közé generálódik. **Minden, ami a záró marker
UTÁN van, túléli az újragenerálást.** Ezért a lokális szabályok **saját fájlokban** élnek, és
a `CLAUDE.md` csak **mutat** rájuk. ⛔ Lokális szabályt sosem írunk a markerek KÖZÉ.

---

## 4. Új flow létrehozása

1. Mappa: `__agent/flows/{recurring|on-demand|event-based}/{flow-nev}/`
2. `README.md` — **a §1 fejléc-blokkal kezdve**
3. `_intake.md`, `_close.md`, opcionálisan `_subflow-N-*.md`
4. Ha a user szava indokolta → a **szó szerinti** szöveg `current/principles/` alá is
5. Felvenni a `__agent/capabilities/CATALOG.md`-be — **`⏳ jóváhagyásra vár`** státusszal
6. ⛔ **Új flow / új képesség csak user-jóváhagyással lép működésbe**

---

## 5. Ez a fájl is karbantartandó

Ha egy szabály változik vagy új jön, **ide is át kell vezetni** — különben a flow-k egy
elavult belépőt olvasnak. A felváltott szövegre **stale-banner** kerül, nem törlés
(`core-stale-doc-marking`).

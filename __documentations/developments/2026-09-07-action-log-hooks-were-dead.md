# 🔴 Az automatikus action-log hookok NEM FUTOTTAK — két ok, mindkettő javítva

**Dátum:** 2026-09-07 · **Hogyan bukott ki:** a review-eszköz bekötése közben akartam kézzel
`decision` bejegyzést írni `append.ps1`-gyel, és a szkript **parse-hibával elszállt**.

## 1. A mérés

Az `__agent/log/actions/*.jsonl` teljes története, **kizárólag hook-specifikus** `kind`-okra
szűrve (`bash` · `file-edit` · `file-write` · `user-msg` · `assistant-turn-end` · `session-start` ·
`todo-update` · `cron-trigger`):

| Nap | Hook-bejegyzés |
|---|---|
| 2026-05-13 *(az építés napja)* | 83 |
| 2026-08-23 / 24 / 25 / 27 | 7 / 1 / 1 / 2 |
| **2026-08-28 … 2026-09-06** | **0** |
| 2026-09-07 *(a javítás után)* | 10 |

⚠️ Ez alatt a **0-s** időszak alatt voltak a legterheltebb napok: 2026-09-01 **612**, 09-06 **412**,
09-07 **1302** összes bejegyzés — de ezek **mind kézi vagy CLI-oldali** (`decision`, `note`,
`ship`, `error`, `external-action`) sorok voltak. **Az automatikus tool-call-napló nem létezett.**

⭐ Ez pontosan az a hibaosztály, ami ellen az action-log épült: *„nem tudjuk, mikor fog meghalni a
session"* — és közben a **csendes** rétege nem működött.

## 2. Az első ok — UTF-8 BOM hiánya, Windows PowerShell 5.1

A `.claude/settings.json` a hookot **`powershell`**-lel indítja *(nem `pwsh`)*, tehát **Windows
PowerShell 5.1**-gyel. Az 5.1 a BOM nélküli `.ps1`-et **ANSI kódlapként** olvassa.

A `hook.ps1` és az `append.ps1` tartalmaz **em dash**-t (`—`, UTF-8: `E2 80 94`) egy
**dupla idézőjeles stringen belül**. ANSI-ként olvasva ebből `â€"` lesz — és a harmadik bájt a
**jobb oldali okos idézőjel** (`”`), amit a PowerShell **string-lezáró karakterként** fogad el.
⇒ a string idő előtt lezárul, a szkript **nem parse-olódik**, és **egyetlen sor sem fut le**.

Mért hibaüzenet:
```
Missing ')' in method call.  /  The string is missing the terminator: ".
```

🩹 **Javítás:** UTF-8 **BOM** mindkét fájl elejére. *(A logika érintetlen.)*

> ⚠️ **A becsapós rész:** a hook **`exit 0`-val** végződik minden ágon *(szándékosan — a napló
> nem dobhat ki workflow-t)*. Egy parse-hibás szkript is „sikeresen" tér vissza a hívó felé.
> ⇒ **semmi nem jelezte**, hogy nem fut.

## 3. A második ok — elavult belépési-pont útvonal

Mindkét szkript ezt kereste:

```
$maMainJs = Join-Path $projectRoot 'cli\build\main.js'     # ⛔ NEM LÉTEZIK
```

A `cli/tsconfig.json` `outDir`-ja **`dist`**, és a `rootDirs` (cli + server) miatt az emit-kiosztás
**`cli/dist/cli/src/main.js`** — ezt a `cli/bin/ma.js` shim kommentje **explicit ki is mondja**.

🩹 **Javítás:** a `Test-Path` a **valódi fordított belépési pontra** megy
(`cli\dist\cli\src\main.js` — így a hiányzó build diagnosztikája megmarad), a **hívás** viszont a
**`cli\bin\ma.js` shimen** át (az ismeri a kiosztást — SSOT, nem duplikáljuk az útvonal-tudást).

## 4. Az irónia, amit érdemes megjegyezni

A törő sort a **`5b0b3db` (2026-05-14)** commit hozta be:
*„fix(error-handling): cleanup Phase 1 — action-log layer no silent swallow"*.

⇒ **A csendes elnyelést megszüntető javítás maga vált a rendszer leghangtalanabb hibájává.**
Egy strukturált hibaüzenet hozzáadása tette a szkriptet lefuthatatlanná — pont azon a nyelven,
amiben az üzenet karaktere értelmezhetetlen volt.

📌 **Tanulság, ami túlmutat ezen:** *egy naplózó réteg nem tudja saját magáról jelenteni, hogy nem
fut.* A hiányát **kívülről**, a **kimenetén** kell mérni — „hány hook-bejegyzés született ma?" —,
nem a szkript visszatérési kódján.

## 5. Igazolás

A javítás után, ugyanabban a körben mérve:
- `append.ps1` kézi hívás → **exit 0**, a `decision` és az `error` sor **bent van** a mai JSONL-ben;
- a hook magától megírta a `bash` bejegyzést a következő parancsra.

## 6. Ami NEM igazolt

⚠️ A 2026-08-23…27 közötti **11 hook-bejegyzés** eredete **unverified** — nem tudom, milyen úton
jutottak be egy olyan időszakban, amikor a szkript a fenti okok miatt nem futhatott le
`powershell`-lel. Nem állítok rá magyarázatot.

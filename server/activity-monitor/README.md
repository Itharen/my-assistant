# activity-monitor

L2 lokál gép tracking a my-assistant rendszer "activity-observability" stack-jében.
Cél: ne kelljen folyamatosan riportolnod mit csinálsz — a script percenként
logolja az aktív ablak címet, folyamat-nevet és idle-time-ot.

**Forrás-FR**: `current/feature-requests/activity-tracking.md` (L2 réteg).

---

## Mit logol

Minden percben (alapérték; konfigurálható) egy JSON sor a napi log-fájlba
`activity-monitor/data/YYYY-MM-DD.jsonl`:

```json
{"timestamp":"2026-05-07T18:23:00+02:00","processName":"Code","windowTitle":"diary.md - my-assistant - VS Code","idleSeconds":3}
```

Mezők:

| Mező | Leírás |
|---|---|
| `timestamp` | ISO 8601 + offset (Europe/Budapest) |
| `processName` | aktív (foreground) folyamat neve |
| `windowTitle` | aktív ablak címe |
| `idleSeconds` | másodperc óta nincs egér/billentyű input (Windows API) |

Az `idleSeconds` használható ébredés / lefekvés detektálásra:
- `idleSeconds` > 600 (10p) → AFK
- `idleSeconds` > 8h → valószínűleg alvás
- Hosszú AFK utáni első input = ébredés / vissza-az-asztalhoz

---

## Indítás

### Foreground (debugging / tesztelés)

```powershell
cd E:\Programming\Own\CURSOR\LIVE-projects\my-assistant
pwsh -File activity-monitor/logger.ps1
```

(Vagy `powershell -File ...` ha nincs PS7.) Ctrl+C a leállításhoz.

### Background

Két opció:

**A) `Start-Process` (egyszerű, csak a session-ig fut):**
```powershell
Start-Process pwsh -ArgumentList "-NoProfile","-File","activity-monitor/logger.ps1" -WindowStyle Hidden
```

**B) Windows Task Scheduler (auto-start boot-on, ajánlott):**
```powershell
$action = New-ScheduledTaskAction -Execute "pwsh.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -File E:\Programming\Own\CURSOR\LIVE-projects\my-assistant\activity-monitor\logger.ps1" `
    -WorkingDirectory "E:\Programming\Own\CURSOR\LIVE-projects\my-assistant"
$trigger = New-ScheduledTaskTrigger -AtLogon
Register-ScheduledTask -TaskName "my-assistant-activity-logger" `
    -Action $action -Trigger $trigger `
    -Description "my-assistant L2 activity logger" `
    -RunLevel Limited
```

---

## Konfiguráció

Paraméterek a `logger.ps1`-en:

| Paraméter | Default | Leírás |
|---|---|---|
| `-IntervalSeconds` | `60` | Mintavételezési intervallum (másodperc) |
| `-LogDir` | `activity-monitor/data` | Log-fájlok helye (gitignored — privát) |

Példa: percenkénti helyett 30 másodpercenként:
```powershell
pwsh -File logger.ps1 -IntervalSeconds 30
```

---

## Utófeldolgozás (későbbi step)

Egy session elején futtatható egy summary-script ami az utolsó interakció óta
gyűjt egy "what-did-the-user-do" összefoglalót:

```
2026-05-08 09:00 — utolsó interakció óta:
- 14h idle (~alvás 02:00 → 16:00 ébredés? — ha az időzítés stimmel)
- 2h Code (TERA projekt) — windowTitle alapján
- 1h Browser (Tesco)
- 30p Spotify
```

Ezt a script-et később hozzuk létre, amikor van pár nap data.

---

## Privacy

- A samples log csak **lokálban** él (`activity-monitor/data/`) és **gitignored**
- Window title-ek tartalmazhatnak érzékeny info-t (browser tab címe, IDE
  fájl-név, üzenet-cím): ezért nem pusholjuk
- A **lifecycle event-eket** (start/stop) viszont a közös action-logba is
  kiírjuk (`__agent/log/actions/`) — abban ugyanis nincs érzékeny adat, és
  jó tudnunk hogy a monitor mikor élt és mikor nem
- Ha később filter mód kell (browser-tab maszkolás stb.), nyitott kérdés a fájl alján

---

## Open kérdések

- **Q-am-1**: Browser-tab cím logolása OK, vagy maszkolva legyen?
- **Q-am-2**: Idő-zónát mi használjuk: Europe/Budapest fix, vagy `[System.TimeZoneInfo]::Local`?
- **Q-am-3**: Mintavételezés sűrűbb legyen (pl. 30s), vagy ritkább (pl. 5p)?
- **Q-am-4**: Auto-cleanup (régi log-ok törlése N nap után)?
- **Q-am-5**: Aggregáció (heti összegzés script) — mikor csináljuk?

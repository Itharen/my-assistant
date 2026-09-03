# Screen Waker — funkcionális és technikai specifikáció

**Forrás:** user által átadott „Camera Wake Agent — Node.js specifikáció”, 2026-08-12  
**Implementáció:** [`../../screen-waker/`](../../screen-waker/)  
**Státusz:** MVP implementálva; fizikai kamera/display E2E a célgépen végzendő

## 1. Cél és hatókör

A Screen Waker egy kicsi, Windows alatt háttérben futó Node.js alkalmazás. A laptop beépített vagy
konfigurált webkameráján egyszerű mozgást érzékel, majd megerősített mozgás esetén felébreszti a Windows által
kikapcsolt kijelzőt. A számítógép közben végig ébren marad.

```text
WEBCAM → GRAYSCALE MOTION DETECTOR → WIN32 DISPLAY WAKE
```

A dashboard, böngésző, URL, tab és organizer teljesen független ettől a utilitytől.

## 2. Operációs előfeltételek

- `Computer sleep: Never`
- `Display off: 5–10 perc` vagy a user által választott érték
- A desktop alkalmazások kamera-hozzáférése engedélyezett
- A kamera fizikailag nincs eltakarva
- Ha a laptop fedele érintett: `When I close the lid: Do nothing`
- A dashboard az előtérben van; automatikus session-lock esetén a wake után a lock screen jelenhet meg

A utility alvó/hibernált/suspendelt számítógépet nem tud és nem próbál felébreszteni.

## 3. Funkcionális követelmények

### SW-FR-001 — Kamera

- Induláskor automatikusan megnyílik a konfigurált DirectShow kamera.
- Default: `cameraIndex = 0`; több kamera esetén index alapján választható.
- Hiba vagy megszakadás után default 5 másodperces retry következik.
- A kamera reconnect miatt az alkalmazás nem állhat le.

### SW-FR-002 — Mintavétel és feldolgozás

- Default sampling: 250 ms, azaz 4 FPS; konfigurálható 2–5 FPS környékére.
- Default feldolgozási méret: `320×180`.
- A frame-ek FFmpeg raw grayscale streamként, kizárólag RAM-ban jutnak a detectorhoz.

### SW-FR-003 — Motion detection

```text
capture → resize → grayscale → Gaussian blur → abs frame difference
        → threshold → changed ROI area % → motion decision
```

- `motionThreshold`: az egy pixelre vonatkozó minimum különbség.
- `minimumChangedArea`: a megváltozott ROI-pixelek minimum aránya.
- Nem kell AI, face recognition, person recognition vagy ML modell.

### SW-FR-004 — Ambient-change filtering

- A detector kiszámítja a ROI átlagos fényességváltozását.
- Bekapcsolt `ambientCompensation` mellett ezt kivonja a pixelkülönbségekből.
- Cél: teljes képet érintő auto-exposure-, napfény- és lámpaváltozás ne okozzon önmagában wake-et.

### SW-FR-005 — Több frame-es megerősítés

- Egyetlen motion candidate nem elég.
- Default `requiredMotionFrames = 2` egymást követő candidate kell.
- Quiet frame megszakítja a confirmation streaket.

### SW-FR-006 — Region of Interest

```json
{
  "roi": { "x": 0.1, "y": 0.1, "width": 0.8, "height": 0.7 }
}
```

`null` esetén a teljes frame figyelt. Az ROI-n kívüli mozgás nem számít bele a motion score-ba.

### SW-FR-007 — Display wake

- Megerősített motion után Win32 `SendInput()` küld egy `VK_SHIFT` key-down + key-up párt.
- Az esemény nem ír karaktert, nem kattint, nem vált ablakot és nem mozgatja láthatóan az egeret.
- A cél kizárólag a display power state visszakapcsolása.
- Windows-tól eltérő platform nem támogatott és explicit hibát ad.

### SW-FR-008 — Cooldown

- Sikeres wake után default 30 másodpercig új wake nem küldhető.
- A kamera és a motion detection közben tovább fut.
- A confirmation streak minden confirmed candidate után nullázódik.

### SW-FR-009 — Background lifecycle

- Normál production módban nincs UI, tray icon, popup, notification vagy látható terminal.
- Windows Task Scheduler task indul user logonkor.
- A task hidden, failure esetén újraindul, és egyszerre legfeljebb egy instance futhat.
- `SIGINT`/`SIGTERM` esetén a kamera lezárul és stop lifecycle event készül.

### SW-FR-010 — Konfiguráció és validáció

```json
{
  "cameraIndex": 0,
  "captureIntervalMs": 250,
  "processingWidth": 320,
  "processingHeight": 180,
  "motionThreshold": 25,
  "minimumChangedArea": 0.08,
  "requiredMotionFrames": 2,
  "wakeCooldownMs": 30000,
  "cameraReconnectMs": 5000,
  "blurRadius": 2,
  "ambientCompensation": true,
  "roi": null,
  "debug": false
}
```

Minden mező type- és range-validált. A default config felülírható `--config <path>` argumentummal vagy
`SCREEN_WAKER_CONFIG` environment variable-lel.

### SW-FR-011 — Debug és kalibráció

`debug = true` mellett frame-enként elérhető a motion score, a confirmation frames és az ambient delta.
Production defaultban nincs preview window és nincs frame-enkénti log. Tuning-sorrend:
`minimumChangedArea` → `motionThreshold` → `requiredMotionFrames`.

### SW-FR-012 — Log és error handling

- Standard log: timestamp, camera init/reconnect, confirmed motion, display wake, lifecycle és részletes hiba.
- Minden runtime hiba a projekt action-logjába is `error` eventként kerül.
- Start/stop/wake `external-action` eventet ad; kép- vagy személyes adat nem kerül a logba.
- Action-log write hiba nem állítja le a wake utilityt, de stderr-en látható.

## 4. Nem-funkcionális követelmények

### SW-NFR-001 — Privacy

- Nincs frame-, kép- vagy videómentés.
- Nincs stream és nincs hálózati továbbítás.
- A frame-ek `camera → RAM → detection → discard` életciklusúak.

### SW-NFR-002 — Network independence

Runtime internetkapcsolat, webserver, API és authentication nem szükséges. Az első package install letölti a
dependencyket és a platform-specifikus FFmpeg binárist.

### SW-NFR-003 — Erőforráscél

- Régi laptopra optimalizált, alacsony felbontású, 2–5 FPS-es pipeline.
- Cél: idle CPU `<5%`, RAM `<150 MB`, GPU nélkül.
- A konkrét célgépen production configgal mérendő; az érték hardveres mérés nélkül nem garantálható.

### SW-NFR-004 — Megbízhatóság

- Kamera- és FFmpeg-hiba explicit, részletes és retry-zott.
- A frame backlog legfeljebb egy feldolgozatlan latest frame-re korlátozott.
- A Task Scheduler újraindítja az abnormálisan leállt processt.

## 5. Modularchitektúra és traceability

| Modul | Felelősség | Requirement |
|---|---|---|
| `src/camera.ts` | DirectShow discovery, FFmpeg raw capture, latest-frame buffer | 001–002 |
| `src/motionDetector.ts` | blur, ROI, ambient compensation, diff, score, confirmation | 003–006 |
| `src/displayWake.ts` + `scripts/wake-display.ps1` | hidden PowerShell + Win32 `SendInput` | 007 |
| `src/config.ts` | JSON load és strict validation | 010 |
| `src/logger.ts` | minimal runtime + project action-log | 012, NFR-001 |
| `src/index.ts` | monitoring state machine, cooldown, reconnect, shutdown | 008–009 |
| `src/wakeCooldown.ts` | sikeres wake utáni időkapu | 008 |
| `scripts/install-startup-task.ps1` | at-logon hidden autostart és restart policy | 009 |

## 6. State machine

```text
START → VALIDATE CONFIG → INITIALIZE CAMERA → MONITORING
                              ↑                 │
                              └─ WAIT + RETRY ← camera error
                                                │
                          no motion ← candidate → CONFIRM
                                                   │ true
                                                   ↓
                                             CHECK COOLDOWN
                                              │          │
                                           blocked    allowed
                                              │          ↓
                                              └──── WAKE DISPLAY → MONITORING
```

## 7. Kifejezetten nem része az MVP-nek

- face/person recognition, AI vision, OpenAI API vagy Codex,
- dashboard/Organizer API és browser automation,
- microphone, voice command, smart-home vagy mobile app,
- webserver, authentication, UI, tray icon és notification,
- maga a számítógép felébresztése sleep/hibernate állapotból.

## 8. MVP Definition of Done

1. Build, typecheck és unit tesztek zöldek.
2. A célgép nem alszik el; csak a kijelző kapcsol ki.
3. A Task Scheduler task logonkor hidden módban elindítja az alkalmazást.
4. A kamera kijelző-off közben is frame-eket ad.
5. Közeledő ember mozgása 2 vagy több frame-en megerősítést kap.
6. A wake event a mozgástól számítva cél szerint 0,5–1 másodpercen belül elkészül.
7. A kijelző bekapcsol, és a már előtérben lévő dashboard látható.
8. Cooldown után a Windows ismét kikapcsolhatja a kijelzőt, a ciklus ismételhető.
9. Kamera megszakításakor a process retry-zik.
10. Sem kép, sem videó nem kerül lemezre vagy hálózatra.

Az 1., 9. és 10. pont automatizálható; a 2–8. hardveres/Windows E2E acceptance a célgépen kötelező.

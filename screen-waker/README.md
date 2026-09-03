# Screen Waker

Kicsi, Windows-only háttéralkalmazás: a helyi webkamera mozgását figyeli, és megerősített mozgáskor egy
Win32 `SendInput` eseménnyel felébreszti a kijelzőt. Nem nyit meg dashboardot, nem rögzít képet vagy videót,
nem használ hálózatot, és nem ébreszt alvó számítógépet.

## Előfeltételek

- Windows 10/11
- Node.js 20+
- A Windows kamera-hozzáférése engedélyezett desktop alkalmazások számára
- `Computer sleep: Never`; csak a kijelző automatikus kikapcsolása legyen beállítva
- Ha a dashboardnak azonnal látszania kell, a Windows ne zárja le automatikusan a sessiont

Az `ffmpeg-static` a szükséges FFmpeg binárist lokálisan telepíti; külön FFmpeg setup nem kell.

## Telepítés és első próba

```powershell
cd screen-waker
pnpm install
pnpm build
pnpm start
```

Debug kalibrációhoz állítsd a `config.json` `debug` mezőjét `true`-ra. A logban megjelenik a changed-area,
az egymást követő motion frame-ek száma és az ambient fénykompenzáció értéke. Productionban legyen `false`.

Másik config fájl:

```powershell
node build/index.js --config C:\screen-waker\config.json
```

Másik FFmpeg bináris opcionálisan a `SCREEN_WAKER_FFMPEG_PATH` environment variable-lel adható meg.

## Konfiguráció

| Mező | Default | Jelentés |
|---|---:|---|
| `cameraIndex` | `0` | A DirectShow videoeszköz indexe |
| `captureIntervalMs` | `250` | Mintavétel; 250 ms = 4 FPS |
| `processingWidth/Height` | `320×180` | Feldolgozási felbontás |
| `motionThreshold` | `25` | Pixelkülönbség küszöb 1–255 között |
| `minimumChangedArea` | `0.08` | Megváltozott ROI-terület minimum aránya |
| `requiredMotionFrames` | `2` | Egymást követő jelöltek száma wake előtt |
| `wakeCooldownMs` | `30000` | Két wake közötti minimum idő |
| `cameraReconnectMs` | `5000` | Kamera-hiba utáni retry idő |
| `blurRadius` | `2` | Gaussian blur sugara (`0..2`) |
| `ambientCompensation` | `true` | Teljes képes fényváltozás kiszűrése |
| `roi` | `null` | Normalizált `{x,y,width,height}` watch area |
| `debug` | `false` | Részletes motion score log |

Javasolt tuning-sorrend: `minimumChangedArea`, `motionThreshold`, majd `requiredMotionFrames`. Ha több kamera van,
a `cameraIndex` értékét növeld. Hibás index esetén az alkalmazás logolja a felfedezett kamerák számát és retry-zik.

## Automatikus indulás

Az ajánlott Task Scheduler task build után telepíthető:

```powershell
pnpm run install:startup
```

A task az aktuális user logonjánál, hidden módban indul, hibánál percenként újraindul, és egyszerre csak egy
instance-t enged. Eltávolítás:

```powershell
pnpm run uninstall:startup
```

Manuális hidden indítás: `pnpm run start:background`.

## Adatvédelem és logok

- A frame-ek nyers, szürkeárnyalatos RAM-bufferként léteznek, majd eldobódnak.
- Nincs screenshot, videó, stream, webserver vagy network request.
- A standard log csak lifecycle-, kamera-, motion- és wake-állapotot tartalmaz.
- A projekt action-logjába start/stop/wake/error esemény kerül, képtartalom és személyes adat nem.

## Ellenőrzés

```powershell
pnpm test
pnpm run typecheck
pnpm build
```

A teljes kamera → motion → fizikai display wake E2E ellenőrzéshez valódi Windows kamera és kikapcsolt kijelző
szükséges; ezt a célgépen kell lefuttatni.

# 2026-08-12 — Screen Waker MVP

## Kontextus

A falra helyezett, folyamatosan ébren tartott Windows laptop kijelzőjét a beépített kamera által észlelt mozgásnak
kell visszakapcsolnia. A utility nem kapcsolódik a dashboardhoz vagy az organizerhez.

## Megvalósítás

- Önálló `screen-waker/` TypeScript package és dedikált `__specifications/screen-waker/` specifikáció készült.
- Az `ffmpeg-static` DirectShow inputból 320×180 grayscale raw frame-eket streamel RAM-ba.
- A detector Gaussian blur, ROI, ambient compensation, threshold, changed-area és több frame-es confirmation
  lépéseket végez.
- A wake rejtett PowerShell helperen át Win32 `SendInput` Shift down/up pár.
- Kamera-reconnect, cooldown, strict config, debug kalibráció, lifecycle/error action-log és Task Scheduler
  install/uninstall script készült.

## Döntés és indok

Natív OpenCV Node binding helyett FFmpeg + saját pixel pipeline készült. Ez elkerüli az OpenCV build/runtime
függőséget, miközben az egyszerű frame-difference algoritmushoz nyers grayscale adatot biztosít.

## Validáció

- Unit: config, DirectShow device parser, Gaussian blur, ROI, ambient compensation és multi-frame confirmation.
- Local gate: `pnpm test`, `pnpm run typecheck`, `pnpm build`.
- Szintetikus 320×180 benchmark ezen a fejlesztőgépen: 100 frame / 163,1 ms, átlag 1,63 ms/frame; a detector
  becsült egy-mag CPU-ideje 4 FPS mellett kb. 0,65%. Ez nem helyettesíti a célgépes teljes-process mérést.
- A Win32 wake helper valós PowerShell futtatása exit `0`; a DirectShow discovery az elérhető videoeszközt listázta.
- Hardveres acceptance: valódi célkamera + display-off → motion → display-on mérés, valamint CPU/RAM mérés.

## Linkek

- Spec: [`../../__specifications/screen-waker/README.md`](../../__specifications/screen-waker/README.md)
- Implementáció: [`../../screen-waker/README.md`](../../screen-waker/README.md)

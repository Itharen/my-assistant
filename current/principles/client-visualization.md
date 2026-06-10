# Client visualization — minden feature-höz UI-megjelenés

> **Univerzális hard rule.** A user explicit kérése (2026-05-16):

---

> a my assistantra mindenhol kell mindenről, minden feature-ről valamilyen
> client side visualization. (kezdve a socket connection-el)

---

## Szabály

**Minden** my-assistant feature-höz **kötelező** valamilyen kliens-oldali
vizualizáció / megjelenés. NEM létezhet "csak server-side" vagy "csak CLI"
feature — minden **átlátszó** kell legyen a UI-on.

A vizualizáció minimuma feature-típusonként:

| Feature-típus | Minimum kliens-megjelenés |
|---|---|
| **Connection / kapcsolat** (pl. socket) | Status-indicator (color-dot: zöld=connected, sárga=reconnecting, piros=disconnected) + tooltip last-event-ts |
| **State / állapot** (pl. cycle, phase, agent-state) | Status-panel / badge a header-en vagy footer-en |
| **Adat-művelet** (CRUD) | Megfelelő tábla / form / lista panel — read/write érintett |
| **Időbeli adat** (log, snapshot, history) | Timeline vagy chart |
| **Esemény / trigger** (notify, error, hook) | Toast / notification + log-panel-bejegyzés |
| **Belső folyamat** (sync, background-job, scheduled task) | Progress-indicator + last-run-ts + következő-futás countdown |
| **Konfig / beállítás** | Settings-panel |
| **Hiba / kivétel** | Error-modal + naplóbejegyzés a UI error-panelben (lásd `runtime-error-api.md`) |

## Kezdő-pont (kötelező első)

**Socket connection** (`socket-and-version-sync.md` FR #3f) — az **első**
láthatóvá teendő dolog: a kliens **mutassa**, hogy él-e a WebSocket-kapcsolat
a server-rel. Status-indicator a layout header/footer-én.

## Dev Agent kötelezettség

- **Új FR plan-doc** Phase-elésében **kötelező** legalább 1 sor "kliens-vizualizáció"
- **Új commit-hoz** ha a feature érint server-state / CLI-state / agent-state →
  E2E-teszt (lásd `e2e-validation.md`) magában foglalja: a kliens UI **látható-e**?
- **Audit phase (#02):** ha új feature ship-elve van **kliens-megjelenés nélkül** →
  blokkolja a `09-update-docs` fázist amíg a UI-rész is kész

## Kivételek (csak nagyon ritka esetben, indoklással)

- Belső migration script (egyszeri futás) — log-bejegyzés elég, de **utólag a kliens lássa**
- Kísérleti / mock-only kód — eleve nem prod-ready, de a kísérlet eredménye is megjelenjen valahogy

## Kapcsolódik

- `current/feature-requests/socket-and-version-sync.md` — kezdő-pont (kapcsolat-indicator)
- `current/feature-requests/wave-panel-ui.md` — példa: kliens-vizualizáció a hullámokra
- `current/feature-requests/tasks-dashboard-aggregated-view.md` — példa: task-vizualizáció
- `current/feature-requests/rag-context-injection.md` Phase 7 — RAG context inspector (vizuális tracking)
- `current/feature-requests/runtime-error-api.md` — error-vizualizáció
- `current/principles/error-handling.md`, `e2e-validation.md`, `ssot.md` — testvér univerzális hard rules

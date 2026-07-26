# DISPATCH BRIEF — `unblockable-browser-handler-tool` (új LIVE-projekt + spec)

> **Kiadja:** My Assistant 3 (koordinátor) → **„ALL Projects - MA3's Dev Assistant"** (CCAP dev-session).
> **Küldés:** `ccap sessions send-message <sessionId> --message-file <ez a fájl>`.
> **Jelleg:** ELŐBB spec-írás (a projekt `__specifications`-ébe), csak utána kód. **Ne kódolj a spec előtt.**
> **Létrehozva:** 2026-07-26 · My Assistant 3.

---

## 0. Mi a feladat (röviden)
Hozz létre egy **új LIVE-projektet** a workspace-ben, a megszokott FDP-pattern szerint, és **írd meg benne a
specifikációs dokumentumokat** (`__specifications/`), ugyanúgy, ahogy a többi projektünkben léteznek. Kód
csak a spec jóváhagyása/kész állapota után.

## 1. Projekt-identitás
- **Név / mappa:** `unblockable-browser-handler-tool` → `LIVE-projects/unblockable-browser-handler-tool/`
- **Git:** új repo a **FutDevPro** GitHub-szervezet alatt (`futdevpro/unblockable-browser-handler-tool`).
- **Leírás alapja:** ez egy **agent tool** — egy eszköz, amit agentek használnak böngésző-műveletekhez.
- **Prefix / naming:** az FDP-naming-konvenció szerint válassz 2–3 betűs modul-prefixet (kövesd a
  `fdp-agent-memory` / `dynamo-*` mintát; a spec első fejezete rögzítse a választott prefixet + package-nevet).

## 2. Technikai alak — „mint a FAM"
A `@futdevpro/fdp-agent-memory` (FAM) az elsődleges MINTA az alakra:
- **Kettős felület: CLI + párhuzamos MCP.** A **CLI a megbízhatóbb** csatorna, mert **tud önindítani**
  (self-start / self-heal), az MCP mellette fut. (Ld. FAM: `fam` CLI + `fdp-agent-memory` MCP.)
- Kövesd a FAM projekt-struktúráját (server/cli, `__documentations/`, `__specifications/`, ADR-ek,
  scan/config parancsok mintája). A `fdp-agent-memory` a referencia-projekt.

## 3. Funkcionális lényeg — „blokkolhatatlan" böngésző-kezelés
**Elsődleges cél:** az összes „ne használj botot" blokkoló feloldása — hogy úgy működjön, mintha ember
kezelné a böngészőt. **A CAPTCHA kifejezett KIVÉTEL** (ld. §4).

**Kötelező kétrétegű architektúra:**
- **(a) INPUT réteg = OS-szintű** — valódi egér/billentyű injektálás (RobotJS / nut.js) a **valódi Chrome**-ba
  → **NULLA automatizálási ujjlenyomat** (nincs CDP-vezérlés a lapon, nincs `navigator.webdriver` jel).
- **(b) OLVASÁS réteg = böngésző-extension content-script** — a DOM-ot **natívan** olvassa (mint bármely
  bővítmény) → nem bot-jel. **KIFEJEZETTEN NEM OCR** (owner-direktíva: ebben a projektben **nincs OCR**).
  A CDP-a-lapon szintén kerülendő az olvasáshoz (az detektálható).

**Miért ez a séma:** az anti-bot rendszerek az automatizálási ujjlenyomatot / IP-t / viselkedést / CDP-t
detektálják, NEM a passzív DOM-olvasást és NEM a valódi OS-input eseményeket.

## 4. CAPTCHA-politika (HARD)
- **Soha nem tervezzük kikerülni** a CAPTCHA-t. Ez elfogadott, ember-a-hurokban lépés.
- **Okosítás (spec-elendő):** ha az owner nincs a gépnél → a rendszer **elküldi neki a CAPTCHA-képet**, ő
  **bejelöli a kattintási pontokat** (távolról), visszaküldi, és a tool az alapján oldja fel (akár a
  CAPTCHA-t is). De ez **nem** az elsődleges cél — az az **összes többi** blokkoló feloldása.

## 5. Tartalmi-összefoglaló képesség (CCAP Revisioned-ből)
- A CCAP Revisioned böngésző-integrációjához **fel lett írva** egy irány: az agentnek **ne a nyers HTML-ből**
  kelljen olvasnia, hanem **rövid, kevés karakteres tartalmi összefoglalókat** kapjon a weboldalról.
- **A spec ezt vegye be** mint az olvasás-réteg egyik kimeneti módját (DOM → tömör szemantikus összefoglaló).
- **Feladatod a felderítéshez:** keresd meg a CCAP Revisioned repóban (`LIVE-projects/ccap-revisioned`), hol
  van ez az irány felírva (browser integráció modul + docs/`__agent`), és a spec hivatkozzon rá + reuse-oljon,
  amit lehet (Playwright/screenshot alapok — de OCR NÉLKÜL).

## 6. „Reprodukálni a My Assistantban" szál
- Rövid távú párhuzam: az **FDP Assistant** meglévő böngésző-képességét szeretnénk **reprodukálni a My
  Assistantban** — **külön adat/namespace** (a kétféle munka ne keveredjen), hasonló képesség-csomag.
- Ez a `unblockable-browser-handler-tool` lehet a közös, újrahasznosítható alap. A spec térképezze fel, mi
  jön a közös toolból és mi marad app-specifikus.

## 7. Elvárt kimenet (Definition of Done a spec-fázisra)
1. Projekt-scaffold a FDP-pattern szerint (mappák, package.json, git-repo a FutDevPro alatt).
2. `__specifications/` — teljes üzleti+technikai spec: architektúra (kétréteg), CLI+MCP felület, CAPTCHA-flow,
   tartalmi-összefoglaló, anti-detektálás indoklás, reuse-térkép (CCAP-Rev), reprodukció-terv (My Assistant).
3. ADR-ek a fő döntésekhez (OS-input lib választás, extension-arch, no-OCR).
4. **Kód még NEM** — a spec review után külön dispatch.
5. Minden akcióhoz action-log (ha a projekt CLI-je műveletet végez) — ld. FDP/my-assistant action-log elv.

## 8. Kötöttségek
- Kövesd az FDP naming / struktúra / import konvenciókat (workspace `CLAUDE.md`).
- TypeScript only, no `.js`, no `.npmrc`.
- Ne találgass — verifikálj a rendszerben (FAM/kód/git). Ami nem ellenőrizhető → jelöld „unverified".
- Kérdés/blokkoló esetén jelezz vissza a sessionben (My Assistant 3 vezényel).

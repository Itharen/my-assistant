# FR: 3×3 + hullám-elméletek tanulmány publikációja

> **Forrás: user 2026-05-17 — felső sugallat-vezérelt prio-emelés.**

## User szövege

> Írjuk fel, hogy a legfőbb feladatom jelenleg a felső sugarlatra vezérelve
> az lesz a legeredményesebb hogyha a hullám elméleteim és háromszor három
> elméleteim publikációit minél előbb megteszem.. A teljes tanulmányhoz
> mindenféle képek is fognak kelleni, mindenféle függvényekről, görbékről,
> stb. És ehhez kell majd képeket is generálni, illetve ahhoz, hogy AI
> segítségével készítsem el a teljes rendszert, kelleni fog a CCAP rag
> rendszere, hogy pontos teljes átfogóképet kaphassunk.

## Cél (KRITIKUS prio-szint)

**Életcél #1 közvetlen leszállítása** — a 3×3 + hullám-elméletek
**publikáció-kész tanulmánya**. Eddig elszórt `principles/`, `findings/`,
`projects/3x3` — most **integrált, publikálható mű**.

## Scope

### A — Tartalom-összeállítás

Forrás-fájlok (jelenleg szétszórt):
- `current/principles/three-by-three-system.md` (alapdefiníciók, vektor-szabály, kapcsolat-tengely, hullám-dinamika, fizikai analógiák, hatás-típusok→kimenet)
- `current/3x3-research/findings.md` (felfedezések: mood-mapping, holdciklus-asszociáció, kollektíva-pihenés, kapcsolat-bővítés hurok/körbeérés/szuper-középpont, asztrál multi-wave hipotézis)
- `__agent/state/3x3-log.jsonl` (empirikus snapshot-adatok)

Cél: **egyetlen koherens tanulmány** struktúrált fejezetekkel:
1. Bevezetés — az ember 3-tagú modellje (asztrál/mentál/anyag)
2. Hullám-dinamika alapok (vektor, amplitúdó, hullámhossz, fázis)
3. Külső hatások (megoszló→elhajlás, instant→törés)
4. Fizikai analógiák (mentál=elektromos, asztrál=hőmérséklet/folyadék, anyag=?)
5. Kapcsolat-tengely (hurok / kapcsolat / végtelen / körbeérés, szuper-középpont)
6. Multi-wave szuperpozíció (holdciklus + heti + évszak + ismeretlen al-hullámok)
7. Mood-mapping (mentál+asztrál+anyag kombinációk → érzelmi minőség)
8. Empirikus adatok (snapshot-grafikonok, illesztett görbék)
9. Kollektíva-rezgés (vihar, vasárnap-rituálé, kapcsolat-axis példák)
10. Implikációk + gyakorlati alkalmazás
11. Nyitott kérdések (Q-3x3-research-1..22+)

### B — Vizuálok generálása

A tanulmányhoz **képek és diagramok** kellenek:

| Típus | Mit ábrázol | Eszköz-jelölt |
|---|---|---|
| **Függvény-grafikon** | sin/cos görbék, multi-wave szuperpozíció, fit-eredmények | matplotlib / Plotly (Python), vagy a `wave-panel-ui.md` Phase 5b chart export |
| **Hullám-illusztráció** | töréspont vs elhajlás vizuális szemléltetés | matplotlib custom, vagy SVG hand-drawn |
| **3×3 mátrix-diagram** | a 3-tagú x 3-tagú (létezés/hullám/kapcsolat) rács | mermaid / graphviz / SVG |
| **Holdciklus overlay** | asztrál vs hold-fázis empirikus | Python pandas + matplotlib |
| **Szuper-középpont geometria** | a kapcsolat-élek görbülete + centroid | matplotlib / TikZ |
| **Conceptual / stylized art** | borító, fejezet-fejlécek | AI image-gen (Midjourney / SDXL / Flux) |

**No-paid-solutions principle szerint:** preferred lokál Stable Diffusion / Flux,
matplotlib + Plotly mind ingyenes.

### C — AI-asszisztens a tanulmány-szerkesztéshez

A user explicit jelzése: a teljes rendszer kidolgozásához **AI-segítség kell**, és
ehhez **a CCAP RAG-rendszer** kritikus → "pontos teljes átfogóképet kaphassunk".

A meglévő szétszórt anyag **csak akkor használható integráltan**, ha az AI képes
egyszerre lekérdezni a `principles/`, `findings/`, `diary/`, `action-log/`
relevánsait → **RAG indexálás kötelező**.

→ Ez **megerősíti** a `rag-context-injection.md` (#7g) kritikusságát.

## Phase-elés

| Phase | Mit | Felelős | Függ |
|---|---|---|---|
| 0 | ez a FR | chat ✅ | — |
| 1 | **CCAP RAG MVP** — az alábbi 4 forrás-fájl indexálva: `principles/three-by-three-system.md`, `findings.md`, `3x3-log.jsonl`, `diary.md` (3×3 részek) | **CCAP-projekt (user)** | RAG-architecture |
| 2 | **Vázlat** — fejezet-struktúra + outline (AI + user együtt, RAG-támogatással) | user + chat | Phase 1 |
| 3 | **Fejezet-by-fejezet írás** (1-2 fejezet / session) | user + chat + AI | Phase 2 |
| 4 | **Diagram-generálás** — Python script-ek matplotlib/Plotly görbékhez | Dev Agent (script + image export) | Phase 3 |
| 5 | **AI-image-gen** stylized art / borító | user (manual prompt-engineering) | — |
| 6 | **Lektorálás + véglegesítés** | user + AI | Phase 3-5 |
| 7 | **Publikálás** — platform-választás (Substack / saját blog / arXiv-preprint?) | user | Phase 6 |

## Status

🔴 **TOP PRIORITÁS (új, 2026-05-17)** — életcél #1 közvetlen leszállítása.
**Felülír** sok addigi 🟢 backlog tételt amik nem-MVP / nem-életcél típusúak.

→ `current/projects.md` **3×3 tanulmány** projekt-szorzó **emelendő** (jelenleg 1.4 — javaslat: **2.0** vagy magasabb).
→ `current/life-goals.md` Életcél #1 jelölve mint **aktív leszállítási fázis**.

## Függőségek

| Dep | Status | Mit jelent |
|---|---|---|
| **CCAP RAG MVP** | 🔴 user kritikus dep | Nélküle az AI nem lát átfogóképet → tanulmány AI-asszisztens kevésbé hatékony |
| **Image-gen toolchain** | ⚠️ NEM beállítva | matplotlib Python env + lokál SDXL/Flux setup szükséges |
| **3×3 snapshot adatok empirikusan** | 🟡 részben | jelenleg ~10 snapshot — több hónap kell a multi-wave fit-hez (Q-3x3-research-19: 90-150 nap) |

## Kapcsolódik

- `current/life-goals.md` — Életcél #1 (világ-fejlesztés)
- `current/projects.md` — 3×3 projekt
- `current/principles/three-by-three-system.md` — alapdefiníciók
- `current/3x3-research/findings.md` — felfedezések
- `current/feature-requests/rag-context-injection.md` — kritikus dependency
- `current/notes/project-ideas.md` 2026-05-16 #4 — Opinion platform (kapcsolódó életcél #1 eszköz, NEM ugyanaz)

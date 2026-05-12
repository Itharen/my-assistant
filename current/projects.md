# Aktív projektek

Élő lista. Ez a fájl adja a **projekt-szorzókat** a cross-project priorizáláshoz
(lásd `current/principles/priority-system.md`). Egy organizer task-on
(jelenleg) a `tags`, `parentRef` (taskGroup), vagy a description jelzi a
projekt-hovatartozást.

---

## 2026-05-07 — initial input (user chat)

> Forrás (szó szerinti idézet a user-től):
> *"Ahhoz, hogy jól tudjál nekem segíteni feladat priorizálásban, ahhoz nem
> árt, hogyha tudod, hogy milyen projektjeim vannak jelenleg aktív állapotban.
> Egyrészt van egy fő agent kezelő rendszerem, a CCAP, amiben te is itt
> futtatva vagy amúgy. Ez a legfőbb side projektem, ami segít nekem mindenben
> is. Aztán van ugye a Terra, amiről akkorában már volt szó. A Terra projekt
> az a fő pénzforrás, a legfőbb munkám. Aztán van ugye a jelenlegi nulladik
> pénzkeresési próbálkozásom, a Niche Datasets, ami el van már indítva,
> és dolgozik, de még nem hozott egy centet se."*

> *Megjegyzés:* a user korábban "Terra" → **TERA** javítást adott (STT-typo).
> A szó szerinti idézetben "Terra" marad, de a strukturált részben TERA.

---

## Aktív projektek — strukturált

| # | Projekt | Szerep | Status | **Projekt-szorzó (default)** | Megjegyzés |
|---|---|---|---|---|---|
| 1 | **TERA** | Fő pénzforrás, fő munka | aktív | **2.0** | a legfőbb projekt; ez fizet |
| 2 | **CCAP** | Fő agent-kezelő rendszer (ebben fut ez az assistant is) | aktív | **1.5** | "legfőbb side projekt", mindennapi segítség |
| 3 | **Niche Datasets** | 0. pénzkeresési próbálkozás | 🟡 **passzív** (agent dolgozik, idő kell) | **1.2** | "majdnem kész", útjára bocsátva |
| 4 | **HelloCIA** | Életcél #2 — társkereső app, tech-stack demo, non-monetary | aktív (csúszó) | **1.3** (initial guess) | ⚠️ **5 éve csúszik 90%-on** — task-decomposition kötelező; lásd `current/life-goals.md` |
| 5 | **3×3 tanulmány + Ideology Forum** | Életcél #1 — globális jólét | aktív (long-term) | **1.4** (initial guess) | 3×3 system kidolgozás + közzététel; lásd `current/principles/three-by-three-system.md` |
| 6 | **Master Prompter** | Pénzkereső (közvetett életcél) | aktív (hosszú távú) | **1.5** (initial guess) | user emlitette 2026-05-08; külön projekt, részletek TBD |
| 7 | **Service projekt** | Pénzkereső (közvetett életcél) | aktív (hosszú távú) | **1.5** (initial guess) | user emlitette 2026-05-08; részletek TBD ("service" pontos jelentés tisztázandó) |
| 8 | **FDP Global Token Purchase System** | Pénzkereső (közvetett életcél) | aktív de "nagyon régóta folyamatban, sehol nem tart" | **1.6** (initial guess) | minden FDP rendszerben használható közös fizetési rendszer; "elég jó monetizációs lehetőség" |
| — | _Personal admin_ | Hózárás, jogsi, fürdés, séta, stb. | aktív | **1.0** (default) | nem projekt, hanem kategória |

> A szorzók **defaultok**, a user módosíthatja. A skála: 1.0 = default,
> >1.0 = magasabb prio, <1.0 = alacsonyabb. A cross-project prio-számolás:
> `task.priority × project.multiplier × halogatás_szorzó × deadline_szorzó`.

## Inaktív / closed (referenciaként)

| # | Projekt | Status | Megjegyzés |
|---|---|---|---|
| — | Self-hosted runners | ✅ **KÉSZ** (2026-05-07 user-megerősítés) | múlt héten készült el, komoly dependencia volt, jól működik |
| — | Játékfejlesztés (együttműködési megállapodás + game-dev agent) | félbehagyva, alacsony prió | extra; külön kapacitás-igény |
| — | Pályázatírás | ❌ **TÖRÖLVE** 2026-05-07 (organizer task archived: `org:task:699ca5b6...`) | elavult, megszűnt issu |

## Aktuális állapot (2026-05-07 23:25 user-update)

- **TERA**: ma ellenőrizve, rendben (next: 2026-05-12 kedd)
- **Niche**: 🟡 **passzív** — útjára bocsátva, agent végzi a hálózatépítést + dataset-tisztítást. Most nincs mit csinálni rajta, idő kell.
- **Agentek (CCAP infra)**: dolgoznak. **Következő lépés: agent-szám növelése** — feltétel: pénz VAGY rengeteg fejlesztés. Setup-task: melyik agentet mire állítjuk rá.
- **Pénzszerzés következő lépése**: **Upwork task** — vasárnap (2026-05-10) kezdés (péntek meeting-ek + este vendégek, szombat=nem dolgozunk). Organizer-ben felvéve dueDate=2026-05-10.
- **CCAP task-cluster (~7 task)**: parkolva, lásd `current/notes/ccap-tasks-batch-later.md` — "jegyzet-jellegű feldolgozás" későbbi külön session-ben.

---

## Projekt → organizer task mapping (jelenlegi)

A meglévő organizer task-ok (a `fo tasks.list` szerint) projekt-besorolásom:

| Task ref | Cím | Projekt-gyanú |
|---|---|---|
| `org:task:69ab6a90...` | "Find and apply for a freelance task on Upwork" | (Pénzkeresés alternatíva — most nem aktív) |
| `org:task:699e546f...` | "Bevételt kell szereznünk" | meta — TERA + Niche közös |
| `org:task:???` | "Koordinátor működésre bírása" | **CCAP** |
| `org:task:???` | "Pályázatírás" | **TERA** (gyanú) |
| `org:task:???` | "CCAP coordinator MVP lezárása" | **CCAP** |
| `org:task:???` | "Koordinátor továbbfejlesztése + kényelmi feature-k (kiemelten: szóban veled kommunikáció)" | **CCAP** |
| `org:task:???` | "Koordináció (core) lefejlesztése a Koordinátorban" | **CCAP** |
| `org:task:???` | "ChatGPT utolsó beszélgetés eredményének kiemelése/összeszedése (Koordinátor beszélgetés)..." | **CCAP** |
| `org:task:69a20d24...` | "Jogsi frissítés" | Personal admin |
| `org:task:???` | "Céges hózárás (2026 június)" | Personal admin / TERA-céges? |
| (új ma) | "Patika", "Kaja-rendelés", "Ruhabevásárlás", "Bőrgyógyász", "Google Home research", "Tesco automatizáció", "TERA projekt ellenőrzés (csütörtök)" | Personal admin (kivéve TERA-ellenőrzés = TERA) |

> **Open**: a meglévő organizer task-ok **`tags` mezője üres**. A projekt-besorolást
> érdemes lenne felvenni mint `tag: ccap`, `tag: tera`, `tag: nietzsche`. Ez egy
> jövőbeli "batch update" task. A `fo tasks.update` még nem verifikált — verify
> + batch update külön körben.

## Open kérdések

- A "Pályázatírás" task TERA-projekt vagy különálló? (Most TERA-gyanúval; megerősítendő) — ✅ TÖRÖLVE 2026-05-07
- A "Bevételt kell szereznünk" meta-task — bontsuk-e szét konkrét sub-task-okra az aktív projektek szerint?
- Projekt-szorzók: a fenti defaultok megfelelőek? Vagy más skála?
- **Master Prompter / Service / FDP Token rendszer**: részletek TBD (külön agent fogja összeszedni a projekt+cég context-et — lásd `current/feature-requests/cross-project-notes-ingestion.md`)
- **HelloCIA hely a sorrendben**: életcél vs pénzkereső — most Életcél #2 alatt, de érdemes ezt projekt-szorzóhoz igazítani?

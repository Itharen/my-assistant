# FR: CCAP lokál működés stabilizáció

> **Forrás: a user szövege (2026-05-09).** Fontos feladat.

## A user szövege

> Fel kéne írni fontos feladatnak, hogy a CCAP-nak a lokál működését
> stabilizálni kellene, hogy egyrészt tudjak GPT-vel is dolgoztatni,
> másrészt pedig a lokál AI, ami kb. ingyen van, az is alkalmas legyen a
> munkavégzésre.

## Cél (kettős)

| # | Cél | Indok |
|---|---|---|
| 1 | **GPT-vel is dolgozzon** a CCAP | provider-diverzitás, ne csak Claude |
| 2 | **Lokál AI** (kb. ingyen) is alkalmas legyen | költség-optimalizáció, CC limitek elkerülése |

## Status

🟢 **Fontos feladat** — felírva 2026-05-09. Részletek a CCAP repo `__agent/`-jében
(out of my scope), de itt jelölöm hogy a my-assistant-ből látható prioritás.

## Kapcsolódik

- CC limitek pénteki incidens (4 párhuzamos account) — `current/diary/diary.md` 2026-05-08
- `__agent/triggers/A-mode-entrypoint.md` — az A-mode agent is profitálna a provider-diverzitásból
- `current/principles/no-paid-solutions.md` + `build-it-ourselves.md` — lokál AI ide illeszkedik

## Open kérdések

❓ Q-ccap-local-1: Melyik lokál model-stack? (Llama 3 / Qwen / Mistral? Ollama?)
❓ Q-ccap-local-2: Melyik agent-feladatokra elég a lokál? (A-mode tick? B-mode? Plan-execution?)
❓ Q-ccap-local-3: GPT integráció — OpenAI API vagy Azure OpenAI?
❓ Q-ccap-local-4: Routing logika — provider-választás per task / per user-decision / cost-aware?

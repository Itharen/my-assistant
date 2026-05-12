# FR: Saját hírek-scraper + niche datasets integráció

> **Forrás: a user szövege (2026-05-09).**

## A user szövege

> ehhez kapcsolódóan szintén hasznos, fontos lenne, hogy egyrészt van egy
> hírek szkrépelő rendszerünk, amit beköthetnénk, hogy elérhetővé tegyünk
> például hírforrásokból származó, már eleve beszkrépelt tartalmakat,
> Mostrészt pedig van egy niche dataset rendszerünk, ahol szintén lehetnek
> hasznos infók, amiket szintén felhasználhatnánk.

## Cél

A user-nek **már létezik** két data-forrás:

1. **Hírek-scraper rendszer** (külső projekt, már beszkrépelt tartalmakkal)
2. **Niche datasets rendszer** (a Niche Datasets projekt, lásd `current/projects.md` #3)

Mindkettőt a my-assistant rendszerbe **be kéne kötni**, hogy:
- A felhasználható tartalom **elérhető** legyen (dashboard, news-digest, A-mode kontext input?)
- A kötés módja: **integráció**, nem új scraping (a forrás-projektekben már megvan)

## Status

🟢 Felírva. Részletes integráció-tervezet later.

## Kapcsolódik

- `current/feature-requests/ai-tech-news-scraping.md` — ami **ezen felül** lehet még forrás
- `current/feature-requests/cross-project-notes-ingestion.md` — ez egy közeli rokon (cross-project data-bevitel)
- `current/projects.md` — Niche Datasets project (#3)

## Open kérdések

❓ Q-news-int-1: Hogyan kapcsolódik a hírek-scraper a my-assistant-hez? HTTP API / DB-share / file-export?
❓ Q-news-int-2: A niche datasets-nek mi az interfésze a fogyasztó felé?
❓ Q-news-int-3: A scraper output-jából mennyit fogyasztunk (mind / topic-szűrt / curated)?
❓ Q-news-int-4: Hol látható (dashboard / A-mode tick input / külön view)?

# FR: AI / tech news rendszeres scraping

> **Forrás: a user szövege (2026-05-09).**

## A user szövege

> szeretnék valamilyen rendszeres news scrapinget, illetve valamit, ami nem
> tudom hetente naponta megvizsgálja, hogy milyen új technológiák vannak
> elérhetőek, Milyen új AI-related dolgok vannak, amik relevánsak lehetnek a
> számomra. Már pedig minden ilyen dolog elég releváns.

## Cél

- **Rendszeres** (heti vagy napi) scraping
- Tartalom: új technológiák, új AI-related fejlemények
- Relevancia-szűrés a user igényei szerint
- A user **explicit** mondja: "minden ilyen dolog elég releváns" → kezdetben **széles háló**

## Megjegyzés a user kérésére

A user kéri:
> "minimum felírva legyen, de nem ártana egy kicsit megvizsgálni a kérdést
> alaposabban is"

→ Két szint:
1. ✅ **Felírás** (most) — ezt teszem
2. 🔬 **Alaposabb vizsgálat** — későbbi research-flow, de NEM most automatikusan

## Megoldás-jelöltek (előzetes)

- Saját scraper (lásd külön FR `news-aggregator-integration.md` — már van rendszer)
- RSS-aggregátor (Feedly, Inoreader API, vagy saját)
- HackerNews API (ingyenes, sok AI-tartalom)
- ArXiv RSS (`cs.AI`, `cs.LG` kategóriák)
- Twitter / X (nehéz API)
- Reddit (`/r/MachineLearning`, `/r/LocalLLaMA`)

## Status

🟢 Felírva. Alaposabb research → user-trigger esetén.

## Kapcsolódik

- `current/feature-requests/news-aggregator-integration.md` — meglévő scraper rendszer bekötése
- Niche datasets rendszer — szintén forrás lehet
- A future B-mode scripted automatizmus (lásd `B-mode-scripted-automation.plan.md`) ide illik

## Open kérdések

❓ Q-news-1: Heti vagy napi gyakoriság?
❓ Q-news-2: Output formátum: napi digest e-mailben / dashboard-kártyák / Discord-üzenet?
❓ Q-news-3: Kezdetben "minden releváns" → később filter-rule-ok (kulcsszavak, blacklist)?
❓ Q-news-4: Mely források a top 5-10 amivel kezdjünk?

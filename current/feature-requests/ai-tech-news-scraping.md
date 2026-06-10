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

## Konkrét témakörök (user 2026-05-13)

A user által kiemelten kért tartalmak:

| Téma | Példa források |
|---|---|
| **Agentic rendszerek** hírei | HN, Reddit, Anthropic/OpenAI/Google blog, X-on agent-research accountok |
| **AI modell** hírek (új release-ek, benchmark-ok) | ArXiv, HuggingFace, model-card oldalak |
| **AI big provider** hírek (Anthropic, OpenAI, Google, Meta, Mistral, DeepSeek) | hivatalos blog + RSS |
| **QWEN modell** dedikált tracking (Alibaba) | QwenLM blog, ModelScope, HF QWEN org |
| Általános AI/ML | HackerNews `ai`, Reddit `/r/LocalLLaMA`, `/r/MachineLearning` |

## Saját rendszerek bekötése (2 meglévő)

A user explicit megjegyzése: **két meglévő saját rendszerünk van**, amit be lehet
kötni, NEM kell külön scraper-t építeni:

1. **Niche datasets** projekt (`current/projects.md` — passzív bevétel, P=1.2) —
   adatforrásként, hosszú-távú tárolásra, kategorizálásra alkalmas. Jövőbeli
   bekötés: scraped news → niche dataset feed.
2. **News scraper rendszer** (külön projekt, lásd `news-aggregator-integration.md`)
   — kész scraper-infrastruktúra. Bekötés: új scraper-target hozzáadása az
   AI/agentic/QWEN források listájához.

→ **Phase 1**: NE saját új scraper, hanem a meglévő news-aggregator-be új
target-okat regisztrálni + niche datasets-felé output-pipe.

## Megoldás-jelöltek (előzetes — fallback ha a 2 saját rendszer nem elég)

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

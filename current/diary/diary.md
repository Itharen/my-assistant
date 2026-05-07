# Diary

> Lokál source-of-truth. Az organizer-ben **nincs** diary MCP handler, ezért
> egyelőre itt vezetjük markdown-ban. Ha az organizer kap diary-MCP-t, lásd
> `__agent/SOURCE_OF_TRUTH.md` migrációs flow-t.

## Formátum

```markdown
## YYYY-MM-DD — {nap rövid címkéje, pl. "Hétfő"}

{tetszőleges szöveg, akár több paragráfus}

### {opcionális: téma-szekció}
{...}
```

- Egy nap = egy `## ` szekció
- Legújabb nap **felül**
- Ha egy nap > 5 paragráfus vagy > ~200 sor, érdemes témákra (`###`) bontani
- Ha a teljes fájl > ~500 sor / > 30 nap, szétbontás havi fájlokra:
  `current/diary/2026-05.md`, `current/diary/2026-06.md`, és ez a `diary.md`
  csak az aktuális (legfrissebb) hónapot tartja

## Mező-konvenciók (organizer migráció miatt)

Ha jövőben átköltözünk az organizer-be, a leképezés:

| markdown | organizer (`diary-entry`) |
|---|---|
| `## YYYY-MM-DD — {címke}` | `entryDate: YYYY-MM-DD`, `title: "{címke}"` |
| body szöveg | `content` (markdown elfogadott) |
| `### {tárgy}` szekciók | `tags: [...]` vagy `topics: [...]` |

---

<!-- BEJEGYZÉSEK IDE, A LEGÚJABB FELÜL -->

## 2026-05-07 — Csütörtök

### 🌅 Ciklus-state
- **Ébredés ma 15:00** (forrás: user chat 16:48)
- ~~Várható lefekvés: 2026-05-08 09:00–11:00 (`wakeAt + 18-20h`)~~ → **revízió**: péntek 13:00 meeting miatt rövid ciklus, lefekvés ~**02:00–04:00 péntek hajnal**, ébredés ~10-12 péntek délelőtt
- Lásd: `current/sleep/log.md` és `current/principles/sleep-system.md`

### 🧹 + 🚶 Napi rutin
- Takarítás megvolt (a heti szerdai slot eltolódva csütörtökre, vagy a szerdai megvolt — bejelentve: "takarítás kész")
- ⚠️ **Séta**: 3 napja nincs (utolsó: 2026-05-04). 2 missed cycle → halogatás-szorzó aktív, MAI prio magas
- ⚠️ **Fürdés**: utoljára 2026-04-30 csütörtökön (7 napja). 2 missed cycle (heti 2× szabály alapján) → halogatás-szorzó aktív, MAI prio magas. **Időablak-megszorítás:** 00:00–07:00 tiltott + **2-3h blokk** → ma latest start ~21:00 (3h-val 24:00-ra ér véget). Praktikusan: most (17:00) – 21:00 között elkezdeni
- 🌍 **TERA projekt ellenőrzés**: új recurring szabály felvéve (kedd+csütörtök). Utolsó: 2026-05-06 szerda. **Ma csütörtök = esedékes.** (A "Terra" STT-typo, a user javította TERA-ra.)

### 💻 Projekt-state (saját szavakkal a user-től)
- **Self-hosted runnerek**: elkészültek, működnek, migráció kész. Csak kisebb finomítás/javítgatás maradt, főleg az élő projekteknél. **Nem prió.**
- **Agentek**: 4-ből 2,5 dolgozik. Célállapot (2 fix + 1 navigált + 1 tartalék) megvan, **kvázi lezártnak** tekinti.
- **Pénzszerzés**: két irány merült fel — (1) niche dataset csomag (Nietzsche) piacra vitele, (2) Fiverr/Upwork + későbbi automatizálás. **Döntés: most a Nietzsche dataset a fő fókusz.** Friss update: a dataset-es meló **már majdnem kész**.

### 📌 Mai nap új tételei
- ~~**P1**: céges hózárás (elseje miatt)~~ → **TEGNAP (2026-05-06) MEGVOLT**, archived. Recurring szabály: minden hónap 2. munkanapja → következő: 2026-06-02 kedd, új task felvéve (P=100)
- ⏰ **Kaja-rendelés** jövő hétre — ma utolsó normál nap, felvéve organizer-be (`priority: 105`)
- 🔬 **Research: Google Home integráció** — alacsony prió, felvéve (`priority: 50`)

### 🎮 Extra (alacsony prió)
- Játékfejlesztésnél két különálló tétel:
  - Együttműködési megállapodás — **félbehagyva**
  - Külön játékfejlesztős agent igény a csapat kapacitására

### 📋 Session meta (assistant-jegyzet)
- `current/principles/` mappa felállítva 4 fájllal (working-style, priority-system, recurring-tasks, stock-system) — a user szövegei szó szerint őrizve
- `CLAUDE.md` bővítve: working-style + időkezelés + alapelv-rögzítési szabály


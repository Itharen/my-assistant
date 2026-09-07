# Az időpontot MEG KELL MÉRNI — nem kikövetkeztetni

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-09-07 — a lebukás

> Amúgy mi az a 7:12? Szerinted 7:12 van?

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Mi történt (mérve)

| | |
|---|---|
| Amit írtam az üzenetekben | `07:03` · `07:06` · `07:12` · `07:15` |
| Az utolsó **tényleges** mérésem | **06:41** |
| A valóság, amikor „07:12"-t írtam | **06:57 körül** — ~15 perccel korábban |
| Ellenőrizve utólag | `date` → **06:59:50** |

### 🔴 Mit csináltam rosszul

Egyszer megmértem az időt, aztán **fejben hozzáadtam** a szerintem eltelt időt. Ez
**találgatás** volt — pontosan az, amit a `core-no-guessing` tilt.

⚠️ **Miért veszélyes ez itt jobban, mint máshol:** az én kimenetem **időzítést** ad
*(mikor indulj, mikor kezdj készülődni)*. Ha az órám csúszik, **a tanácsom is csúszik** — és
a user erre tervez. Egy 15 perces tévedés egy 7:30-as indulásnál valós következmény.

### A szabály

> ⏰ **MINDEN időpont-állítás előtt MEGMÉREM az időt.** Egyetlen kivétel nincs.
>
> ```bash
> date "+%Y-%m-%d %H:%M %A"
> ```

- ⛔ **Nem extrapolálok** egy korábbi mérésből — sem „pár perc telt el" alapon
- ⛔ **Nem becsülöm** a saját futásom hosszából
- ✅ Ha egy körben többször írok időt, **többször mérek**
- ✅ Hosszú kör után a **záró üzenet előtt** újramérek

### Miért csúszik amúgy is

Egy kör **percekig** tarthat *(webes keresés, build, több fájl írása)*. Az elején mért idő a
végére **elavul**. Nem az órám rossz — **a feltételezés rossz**, hogy a kör pillanatszerű.

### Kapcsolódó

- `CLAUDE.md` → „Időkezelés (KRITIKUS)" — minden interakció elején mérni
- `core-no-guessing` — a globális hard rule, aminek ez egy alesete
- `__agent/ENTRY.md` §1 1. lépés — a tájékozódás első pontja

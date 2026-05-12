# Health zóna

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel.

---

## 2026-05-07 — initial deklaráció + napi arc-mosás

> És akkor itt most eszembe jutott még egy téma, ami hasonló a fit-hez, csak
> nem fit, hanem health. Ilyen egészségi dolog, hogy napi háromszor meg kéne
> mossam az arcomat, és ilyenkor ezt úgy kéne csináljam, hogy megmosom, Utána
> szabad egy picit megnyomkodni, utána megint megmosom, aztán lefertőtlenítem.
> Ez is egy olyan dolog, amit rendszeresen elfelejtek, és alapvetően nem egy
> nagy taszk, csak valahogy mindig el vagyok merülve a dolgaimba, és ezért
> valahogy nem jut eszembe sose. Vagy pedig amikor eszembe jut, akkor azt
> mondom, hogy jó, jó, csak ezt még befejezem, amire befejezem, addigra már
> teljesen elfelejtettem.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### A "health" zóna

**Új cluster** a `fit` mellett — egészségi rutinok, bőrápolás, gyógyszer,
vitaminok, általános "szervi karbantartás". Most az arc-mosás indítja.

### Aktív health-elemek

| Elem | Frekvencia | Workflow | Status |
|---|---|---|---|
| 🧼 Napi arc-mosás | **3× / nap** | (1) megmos → (2) szabad egy picit megnyomkodni → (3) megint megmos → (4) lefertőtlenít | aktív szabály, recurring |

### Workflow részletesen — arc-mosás

1. **Megmos** (alapos)
2. **Megnyomkodás** (rövid, csak "szabad egy picit")
3. **Újra megmos**
4. **Lefertőtlenítés** (záró lépés)

**Időzítés (assistant-tipp, 18h ébren-ciklusra):**
- ~ébredés után (1.)
- ~6 órával később (2.)
- ~lefekvés előtt (3.)
- A napi 3 alkalom kb. 6 óránként esik természetesen

### Pszichológiai szempont — KRITIKUS

A user mondta: *"rendszeresen elfelejtek, ... el vagyok merülve a
dolgaimba, és ezért valahogy nem jut eszembe sose. Vagy pedig amikor eszembe
jut, akkor azt mondom, hogy jó, jó, csak ezt még befejezem, amire befejezem,
addigra már teljesen elfelejtettem."*

**Anti-pattern azonosítva**: "jó, jó, csak ezt még befejezem" → flow-merülés →
kibukik. Ez egy klasszikus deferred-task → forgotten-task minta.

**Stratégia (assistant-jegyzet):**
- 🔁 **Idő-anchor + emlékeztető-redundancia**: ne csak egyszeri figyelmeztetés;
  ha a user "majd" mond, **plusz emlékeztető 10-15 perc múlva**
- 🪝 **Természetes flow-szünet kihasználása**: étkezés / fürdés / séta után
  könnyebb beékelni mint flow-közben
- 📍 **Anti-deferral szabály**: ha a user azt válaszolja "majd / mindjárt",
  állítsunk be konkrét időpontot (pl. "+15 perc"), és ha ott sem csinálta,
  halogatás-szorzó aktív (a 3× / nap-cél megdől)
- 🎯 **Nem nagy taszk** — a user explicit mondta — tehát ne mondjuk azt hogy
  "próbáld meg", csak heads-up "most"

### Open kérdések — health

- **Q-h-1**: Konkrét időablakok (reggel / közép / este) vagy csak "3× a napon"?
- **Q-h-2**: A "lefertőtlenítés" mi pontosan? (alkoholos szer / krém / spec.
  bőrgyógy szer?)
- **Q-h-3**: Más health-elemek később? (fogmosás-tracking, vitamin, gyógyszer-bevétel,
  bőrgyógyász check-in — utóbbi már külön task)
- **Q-h-4**: Anti-deferral küszöb: hányadik "majd"-nál vált át "kemény heads-up"-ra?

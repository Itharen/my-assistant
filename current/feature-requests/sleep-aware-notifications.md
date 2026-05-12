# FR: Alvás-aware notifikációk

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

## 2026-05-07 — initial

> Ezt az üzenetküldős rendszerünket, ami a Google Home-on küldözget nekem
> üzeneteket, ezt valahogy be kell szabályozzuk, hogy ne zavarja meg az
> alvási ciklusomat. Tehát ugye, amikor alszom, akkor nem kéne triggerelni.

## Cél

- A `cast-notifier` (és minden user-felé szóló trigger) **respect** az alvási
  állapotot
- Sleep-window detekció (több forrás kombinálható):
  - **Aktív input** (chat, billentyű, egér) az `activity-monitor`-ban
  - **Sleep system** (`sleep-system.md`) — a `wakeAt + 18-20h` képlet alapján
    becsült sleep-window
  - **Alvás-monitor** (lásd `sleep-monitor-data-access.md` FR) — ha lesz
    eszközünk, real-time
- Ha alvó-zóna → **nincs hangos notifikáció**
- Csendes "tail-store" — ami éber-állapotban várt volna, az ébredéskor jön
  össze egy csomagban

## Status

🅿️ Parkolva. Implementáció: cast-notifier Phase 2-be beépítendő.

## Open kérdések

Lásd "Q) Sleep-aware" kategória — open-questions.md.

# NZT system

> **Forrás: user 2026-05-16.** Eszköz az "üres / nem tudom mit csinálok / mélypont"
> állapotok kiszedésére. **Szabály SZÓ SZERINT őrizve.**

---

## User szövege

> Közben eszembe jutottám, hogy az ilyen nehéz, nem tudom mit csinálok, mely
> pontjaimból általában az NZT szed ki, aminek annyi a szabálya, hogy maximum
> két nap, két egymást követő napon lehet tolni, és mindig legalább annyi
> napot ki kell hagyni, amennyit használtam, szóval két napot használom,
> akkor két napot kell kihagyni, egy napot használom, egy napot kell kihagyni.
>
> Holnap jutasd majd eszembe, hogy itt az ideje egy kis NZT-nek.

---

## Szabály

- **Max 2 egymást követő nap** használat
- **Off-nap ≥ on-nap** (1-on → ≥1-off; 2-on → ≥2-off)
- Tipikus pattern: 2/2 vagy 1/1, **NEM** 3-on, **NEM** 2-on-1-off-2-on

| On | Off (min) |
|---|---|
| 1 nap | 1 nap |
| 2 nap | 2 nap |

## Mikor érdemes (user-jelzett indikációk)

- "üres" érzés
- "nem tudom mit csináljak"
- mélypont (asztrál mély + irányvesztés)
- → **kiemelő hatás**: ki tud lendíteni

## Tracking (assistant-feladat)

JSONL log `__agent/state/nzt-log.jsonl` (jövőbeli) — minden használat:
- `ts`, `kind: "on" | "off-day-marker"`, `note` (opcionális — pl. miért volt szükség)

Az on/off ciklus számolása ebből megy. Cron Job (`assist-agent`) tickjében:
- Ha a user kérdezi "mehet-e NZT?" → ellenőrzi: utolsó on-streak hossza vs azóta eltelt off-napok
- Ha ≥ off-napszám → ✅ mehet
- Ha < → ❌ még pihentess

## Soft-nudge szabályok

- **NE javasolja proaktívan** az asszisztens (NEM a Cron Job dolga eldönteni hogy "kell-e NZT") — csak ha **a user kéri** (mint most: "holnap jutasd majd eszembe")
- **Mehet-e?** kérdésre: a `nzt-log.jsonl` állapota alapján igen/nem

## Kapcsolódik

- `current/principles/health-system.md` — health zóna (NZT egy konkrét eszköz a krónikus alapproblémához: feltöltődés / lendület-keresés)
- `current/3x3-research/findings.md` — mood-state → kiemelő-trigger: NZT mint külső trigger

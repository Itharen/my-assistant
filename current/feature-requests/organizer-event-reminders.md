# 🔔 FR — Eseményhez TÖBB emlékeztető, és legyen LÁTHATÓ, minek nincs

> **Owner, 2026-09-11 02:49:** *„Ezt amúgy az organizerbe felírhatnánk Feature Requestnek, hogy
> lehessen az eseményekhez mindent is. Tehát **előtte is, akár több előtte lévő jelzést**, meg magát
> az eseményt mindegyikhez. **Mihez van emlékeztető, mihez nincs**, stb."*

**Állapot:** ✅ **beküldve az organizerbe** *(`feature-requests.create`, `type: feature`,
`priority: high`, címkék: `naptar`, `emlekezteto`, `esemeny`)* — 2026-09-11 02:51.

---

## A probléma — MÉRT eset, ugyanazon a napon

Ma egy esemény = **egy tétel egy `dueDate`-tel**, ami az esemény **időpontjában** szól — vagyis
akkor, amikor már ott kellene lenni.

| Amit kézzel kellett csinálnom | Ref |
|---|---|
| 📅 míting 11:00, online | `org:task:6aa34e92766c802935c3c6b7` |
| ⏰ ébresztő 10:30 | `org:task:6aa34f65766c802935c3c6be` |

⇒ **Két külön tétel ugyanarról a dologról**, és a kapcsolat köztük csak a **leírásban** van —
gépileg nem. Ha az egyiket elmozdítom, a másik **nem követi**.

## Amit kérünk

1. **Több emlékeztető egy eseményhez**, relatív időzítéssel *(−1 nap, −30 perc, −10 perc)* — ⛔ ne
   külön tételként, hanem **az esemény részeként**.
2. **Emlékeztetőnként csatorna** *(csendes értesítés vs. hangos ébresztés)* — az eszkaláció lényege,
   hogy a **halk** csatornával kezdünk *(`wake-escalation.md`)*.
3. ⭐ **LÁTHATÓSÁG:** a listában látszódjon, **melyik eseményhez van** emlékeztető és melyikhez
   **nincs**.

## 🔴 Miért a 3. a kérés lényege

Ma egy **emlékeztető nélküli** esemény **pontosan úgy néz ki**, mint egy emlékeztetővel ellátott.

⇒ **Az emlékeztető hiánya NÉMA hiba:** nem hibaüzenetként jelenik meg, hanem úgy, hogy **lekési az
eseményt**. Ugyanaz a hibaosztály, mint a néma csonkolás, a néma render-bukás vagy a néma
sor-torlódás: a rendszer *„működik"*, csak **nem történik meg**, aminek kellene.

Kapcsolódó: [[wake-escalation]] · [[day-boundary-is-sleep]] · [[methodology-authority]]
*(a my-assistant a kanonikus minta, az organizer ehhez alkalmazkodik)*

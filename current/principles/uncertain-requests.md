# 🔍 HARD RULE — bizonytalan kérésbe NEM vágunk bele: előbb jelöljük, aztán körbejárjuk

> **Owner, 2026-09-07 12:26 (hangüzenetben) — SZÓ SZERINT:**
>
> *„Most volt egy olyan feature request-em, ami kicsit bizonytalan, nem tudom mennyire
> megvalósítható. Ugye itt a voice üzenetek végével és összehossásával kapcsolatos. Nagyon
> fontos, hogy az ilyen bizonytalan pontokat azt ne vágjunk egyből bele, mert a már működő
> dolgokat keresztül húzhatja, hanem jelöljük össze ezeket, próbáljuk meg alaposan körbejárni
> és lefixálni."*

---

## A szabály

Ha egy kérés **bizonytalan** — akár az owner mondja ki, akár én látom —, akkor
⛔ **NEM kezdem el megvalósítani.** Helyette:

1. **JELÖLÖM** — bekerül a `__agent/TASKS.md`-be **🔍 FELTÁRANDÓ** állapottal.
2. **KÖRBEJÁROM** — mérek, kipróbálok, megnézem, mit érintene.
3. **LEFIXÁLOM** — csak akkor lesz belőle 🔵 nyitott feladat, ha tudom, **mit** csinálok és
   **mit nem borít fel**.

## Mitől „bizonytalan"

Bármelyik elég önmagában:

- 🗣️ **az owner maga jelzi** — *„nem tudom, mennyire megvalósítható"*
- ❓ nem tudom **megmérni** előre, hogy működne-e
- 🔀 **több, egyformán védhető** megoldás van, és a választás nem visszafordítható
- 🧩 **működő** dolgot kellene átalakítani hozzá

## 🔴 Miért ez a legfontosabb pontja

> *„mert a már működő dolgokat keresztül húzhatja"*

Egy bizonytalan feature ára **nem az elpazarolt idő** — az olcsó volna. Az ár az, hogy
**elrontja azt, ami eddig ment**. És ez **aszimmetrikus**:

| | Ha nem építem meg | Ha megépítem és rontok |
|---|---|---|
| Következmény | egy hiányzó kényelmi funkció | 🔴 egy **működő út** romlik el |
| Mikor derül ki | azonnal, látható | ⚠️ **később**, és gyakran **némán** |

⭐ **A hang-út a mintapélda:** a darabolás azért veszélyes, mert egy rosszul összefűzött átirat
**pontosan úgy néz ki, mint egy jó** — nincs rajta semmi, ami elárulná. A meglévő út viszont
16 sikeres felismerést tud felmutatni. Egy bizonytalan javítás kedvéért **azt** kockáztatnám.

## ⚠️ Amivel ez NEM keverendő össze

Van egy másik owner-szabály, ami az **ellenkező** irányba mutat:

> **Owner, 2026-09-07:** *„Sose egyeztess ha egyértelmű javítási vagy improvement feladat van.
> Csináld meg."* → `current/principles/no-approval-for-obvious-fixes.md`

🔴 **A kettő nem mond ellent — a HATÁRUK az „egyértelmű" szó:**

| | **Csináld meg, ne kérdezz** | **Jelöld, ne kezdd el** |
|---|---|---|
| Mi | hibajavítás · error handling · guardrail · leíró hibaüzenet | új képesség, aminek a **működése** kérdéses |
| Kockázat | ⭐ **javítja** a meglévőt | ⚠️ **elronthatja** a meglévőt |
| Ha tévedek | egy jobb hibaüzenet, ami nem kellett | 🔴 elromlott, ami ment |

⇒ **Az eldöntő kérdés:** *„ha tévedek, ez ELRONT valamit, ami most működik?"*
Ha **nem** → csináld. Ha **igen, vagy nem tudom** → 🔍 jelöld.

## Kapcsolódó

- `__agent/TASKS.md` — a 🔍 szakasz, ahol a feltárandók állnak
- [[no-approval-for-obvious-fixes]] — a másik oldal: az egyértelműt nem egyeztetjük
- [[task-tracking]] — a nyilvántartás szabálya
- [[build-it-ourselves]] · [[mvp-focus]] — mit érdemes egyáltalán elkezdeni

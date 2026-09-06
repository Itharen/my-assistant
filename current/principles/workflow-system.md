# A workflow-rendszer felépítése

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel.

---

## 2026-09-07 — a lokális szabályok ne vesszenek el a generált blokk mellett

> Fontos, hogy majd a szabályokat úgy írd újra, hogy egyrészt a globál rule az automatikusan
> fog belekerülni, ezért fontos, hogy jól írd vele, hogy megmaradjon a helyi beállítás,
> illetve helyi szabály.

---

## 2026-09-07 — sok, szerteágazó workflow; FAM projekt-szinten

> És aztán közben azt is szeretném, hogy készülj fel arra, hogy ezek a workflow-k
> nagyon-nagyon sok rétűek, nagyon szerteágazóak, rengeteg minden lesz itt. Egyrészt majd a
> famot kell használnod, de lehetőleg erre a projektre direkt. Illetve legyél tisztában
> azzal, hogy mikor keresel a flottában és mikor csak a projektben.

---

## 2026-09-07 — a workflow hordozza a saját használati emlékeztetőjét

> A workflow-kat úgy kéne felépítenünk, hogy benne legyen mindig az emlékeztető is arra, hogy
> hogyan használjuk a workflow-t. És hogy ne hagyjunk ki semmilyen szabályt. Mert nagyon sok
> és szerteágazó szabályunk lesz. Fontos, hogy ezek a szabályok mindenre a workflow-ra
> vonatkoznak.

---

## 2026-09-07 — a belépési pont

> A Workflow-nak kell legyen egy belépési pontja, amit majd a Schedule folyamatosan
> triggerel. És ez a belépési pont fontos, hogy leírja, hogy hogyan kell elvégezni a
> dolgokat, és hogy rendszeresen frissíteni kell ezt a tudást, hogy ne vesszen el. a kontextus
> kompaktálások során.

---

## 2026-09-07 — a preferenciák folyamatos visszacsatornázása

> És valahogy úgy kell a workflow-t is, meg a szabályt is megalkotni, hogy ezt majd
> menetközben folyamatosan fogom mondogatni, hogy ezt így, azt úgy, amikor ez van, akkor az
> van, amikor az van, akkor ez van, ezt szeretem jobban, azt szeretem jobban, így szoktam, úgy
> szoktam. Ezeket folyamatosan vissza kell vezessük, vissza kell csatornázzuk ebbe a workflow
> system-be.

---

## 2026-09-07 — az ütemezés és a trigger-üzenet

> majd mondd meg nekem, hogy mennyi időnként kéne beállítanom, a Scheduled, ami triggerelt
> téged, és mi legyen az üzenet. Általában az üzenet annyi szakott csak lenni, hogy rámutatunk
> a kiindulási workflow file-ra, és emlékeztetjük a szabályfrissítési szabályra, hogy
> frissítsen szabályt rendszeresen, már hogy te frissítsél szabályt. Reggel nem ártana egy
> újraindítás ELSŐNEK

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### 1. A lokális szabályok védelme (mért, nem feltételezés)

A flotta-szintű szabály-blokk **generált**, és a `CLAUDE.md` / `AGENTS.md` fájlokban
`<!-- FDP-FLEET-RULES:BEGIN -->` … `<!-- FDP-FLEET-RULES:END -->` markerek közé kerül.
*(Mérve 2026-09-07: `fleet-rules-propagate.ps1` a két marker közti részt cseréli; ha nincs
marker, az első `## ` szekció ELÉ szúrja be.)*

⇒ **Minden, ami a záró marker UTÁN van, túléli az újragenerálást.**

**A védelem három rétegű — mindhárom kell:**

1. A lokális szabályok **saját fájlokban** élnek (`current/principles/`, `__agent/…`), nem
   a `CLAUDE.md` testében. A `CLAUDE.md` csak **mutat** rájuk.
2. A mutató a **záró marker után** áll, egy jól jelölt „LOKÁLIS" szekcióban.
3. ⚠️ **A `CLAUDE.md` és az `AGENTS.md` az első `## ` szekciótól AZONOS** — tehát a lokális
   szekciót **mindkettőbe** át kell vezetni ugyanabban a change-setben
   (`pwsh __agent/scripts/agent-file-sync.ps1 -Mode apply` a flotta gyökeréből).

### 2. FAM: projekt vs. flotta

A FAM `read` **`scopeFilter`**-t fogad: `[{ layer: 'project', rawName: 'my-assistant' }]`.

| Mikor | Hatókör | Miért |
|---|---|---|
| **Alapértelmezés** — a user, a szokásai, a preferenciái, az itteni döntések, az itteni kód | **`project=my-assistant`** | a flotta 71 483 eleme közt az itteni tudás elveszne |
| Flotta-minta kell (FDP-konvenció, más projekt megoldása, globális szabály) | **szűrő nélkül** | ilyenkor pont a flotta a cél |
| Bizonytalan vagy | **előbb projekt, aztán flotta** | a szűkebb találat mindig relevánsabb |

*(Mérve 2026-09-07: ugyanaz a lekérdezés projekt-szűrővel 34 releváns találatot ad
71 483 elemből.)*

### 3. Minden workflow hordozza a használati emlékeztetőjét

Minden flow `README.md`-je **KÖTELEZŐEN** a `__agent/workflow-rules.md`-ben definiált
**fejléc-blokkal** kezdődik. Ez azért van, mert a workflow-t sokszor **kontextus-kompaktálás
után** olvassa el az agent, amikor a szabályok már kiestek a fejéből.

### 4. A belépési pont és az ütemezés

`__agent/ENTRY.md` — a Schedule ezt triggereli. Leírja, **hogyan kell elvégezni a dolgokat**,
és ⚠️ **maga is karbantartandó**: a benne lévő tudás nem konzerv, hanem élő.

**Az ütemezés + a trigger-üzenet kanonikus szövege:** `__agent/SCHEDULE.md`.
Röviden: **60 percenként** a fő kör, **06:30-kor** a napindítás *(az elsŐ lépése
rendszer-újraindítás)*. A trigger-üzenet **rövid pointer** két fájlra (belépési pont +
állapot) + a szabály-frissítés emlékeztetője. ⛔ Az állapot SOSEM a trigger-szövegben van.

### 5. Preferencia-visszacsatornázás (KÖTELEZŐ)

Amikor a user menet közben mond egy szabályt / szokást / preferenciát
(*„ezt így szeretem", „amikor ez van, akkor az van", „így szoktam"*), az **NEM maradhat a
chatben**. Ugyanabban a körben:

1. a **szó szerinti** szöveg `current/principles/` alá (meglévő fájlba vagy újba),
2. ha egy konkrét flow-ra vonatkozik, a flow `README.md`-jébe is **pointer**,
3. visszajelzés a usernek, **hova került**.

⇒ Ez a `core-document-everything` és a `recording-discipline` alkalmazása a workflow-kra.

### Kapcsolódó

- `__agent/ENTRY.md` · `__agent/workflow-rules.md` · `__agent/IDENTITY.md`
- `current/principles/recording-discipline.md` — „jegyezz fel" = kötelező rögzítés
- `current/principles/ldp-default-runtime.md` — mi fut folyamatosan

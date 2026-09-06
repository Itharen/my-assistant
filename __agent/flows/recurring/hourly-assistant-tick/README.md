# Flow: Óránkénti Assistant-tick — a folyamatos My Assistant workflow

> **Ez a tényleges Assistant-workflow.** Óránként lefut, átnézi a helyzetet, és eldönti:
> **miről kell értesíteni az ownert, miről nem — és melyik csatornán.**
>
> **Státusz: ÉPÍTÉS ALATT (2026-09-06-tól).** Az ownerrel közösen írjuk. Ami itt le van írva,
> az kötelező; ami hiányzik, azt `❓ NYITOTT`-ként jelöljük — nem találjuk ki magunktól.

---

## 1. Owner-szövegek — SZÓ SZERINT (ez a szabályok forrása)

### 2026-09-06 — a workflow célja

> A workflow amit itt elkezdünk megírni, az arról fog szólni, hogy mit kell csinálni,
> miket kell ellenőrizni, ami az óránkénti triggernél, ahhoz, hogy kiderüljön, hogy
> miről kell értesíteni a user-t, miről nem, miről kell kommunikálni a userrel és
> miről nem. Ebben az is benne kéne legyen, hogy az organizerből kell frissíteni a
> feladatokat, határidőket.

### 2026-09-06 — a státusz-kivonat eszköz

> Valószínűleg ezek úgy lennének a legjobbak, hogyha bekötnénk a My Assistant rendszerbe
> egy egyszerűsítő státuszrefresh eszközt, ami készít neked egy hiteles, aktuális
> státuszkivonatot, amiben egy helyen benne van minden info. amik lesznek ma, meg amik
> lesznek egy órán belül, meg amik elmúltak. Meg majd még amit kérek a jövőben.

### 2026-09-06 — a hangszórós csatorna szabálya

> ez a Google Home-on keresztüli kommunikáció, ez a legerősebb, amivel fel tudod kelteni
> a figyelmemet. Ezt is szeretném, hogy erőszeretettel használd, de fontos szabály, hogy
> ezt csak akkor használhatod, hogyha ébren vagyok. És itthon vagyok.

### 2026-09-06 — a tick alakja

> kapsz egy óránkénti triggert, meg egy workflow-t, ami alapján átnézed a jelenlegi
> helyzeteket, státuszokat, határidőket, emlékeztetőket, stb. stb. majd ezt jól
> átbeszéljük a workflow-t és akkor a workflow alapján időnként fogsz nekem küldeni
> triggereket, üzeneteket...

### 2026-09-06 (második kör) — a két workflow

> két fő workflow-t kell majd ehhez az aszisztensi workflowhoz összeállítani. Daytime
> workflow, meg nighttime workflow, amik nem valódi napszakidőszakhoz vannak kötve, hanem
> ahhoz, hogy én mikor vagyok ébren, és mikor nem. Illetve lehet, hogy ezt majd meg kell
> spékelni azzal, hogy mikor vagyok itthon és mikor nem. Azaz mikor vagyok gép előtt és
> mikor nem. majd a telefonomra is valószínűleg jól jönne neked egy valamilyen visszajelző
> rendszer ami például ha belső hálózaton vagyok akkor azt kiderüljön neked a státuszból

### 2026-09-06 (második kör) — itthon / ébren jelek

> Az arról, hogy itthon vagyok-e, egyelőre elég lesz az, hogy használom a gépemet, mert
> más jelünk nem lehet arra.

> Az, hogy ébren vagyok-e, az abból jöhet, hogy itthon vagyok jelet kapsz, tehát a
> számítógépnél vagyok, akkor ébren vagyok, illetve, hogy ha discordon válaszolok, akkor
> is ébren vagyok, legalább egy órát még.

### 2026-09-06 (második kör) — éjjeli tick, sürgősség, üzenet-mennyiség

> Éjjel is fog futni a tick, de akkor egy másik workflow-t kell majd alkalmazzunk, illetve
> ezeket majd okosan szinkronba kell tartsuk.

> Általában a határidős feladatok közelette lesz olyan, ami annyira sírgős, hogy a
> hangszóró indokolt. Vagy hogyha valamilyen fontos üzeneted van számomra, amire nem
> válaszolok, nem láttam, stb. Nem reagálok, de itt vagyok.

> Nem mondanám, hogy lesz maximumja az 1 tickben kimenő üzeneteknek, mert amúgy sem szoktad
> túlzásba vinni, általában 1 tickre 1 üzenetet küldesz, de ha indokolt küldhetsz többet is.
> Általában próbáljuk meg a Discord üzeneteket is rövidre tömörre venni, ha csak nem azt
> kérem, hogy fejtsd ki valamit.

### 2026-09-06 (második kör) — 🔴 CCAP: nem megkerülhető

> Fontos, hogy de igenis a CCAP-ban vagy, de nem egy CCAP session. Tehát a CCAP az nagyon
> sokféle fajta session-t kezel, de igen, ez folyton félrevisz téged, most már látom. A CCAP
> rendszerén keresztül futtatom a CC session-öket is. amit fogunk használni, illetve amit
> tudunk használni. illetve azokat a triggereket, amiket én a Discordon küldök neked, azt a
> CCAP rendszerén keresztül kell a CC Sessionbe elküldeni, ez fontos. Nem kerülheted meg a
> CCAP-t a neked szánt üzenetekkel.

---

## 2. Csatorna-szabályok

| # | Csatorna | Erő | Mikor használható | Státusz |
|---|---|---|---|---|
| 1 | 🔊 **Google Home / hangszóró** | ⭐ **A LEGERŐSEBB** — ezzel lehet ténylegesen felkelteni a figyelmét | 🔴 **KIZÁRÓLAG:** owner **ÉBREN** van **ÉS ITTHON** van. Mindkettő kell. | ✅ élőben igazolt 2026-09-06 |
| 2 | 💬 **Discord** | közepes — telefonon is elér, de nem tolakodó | bármikor (a zavarhatósági szabály a nem-sürgősre itt is él) | 🟡 a **kötegelő + CCAP-híd kész**; a bot-token owner-lépésre vár |
| 3 | 🖥️ **My Assistant felület** | gyenge — csak ha épp odanéz | bármikor, korlátlanul | ✅ él |
| 4 | 📝 **Tartós postaláda** (`USER_INPUT.md`) | passzív — a következő session olvassa | bármikor, korlátlanul | ✅ él |

### 🔴 A hangszórós szabály — kötelező kapu

**Hangszóróra bemondani CSAK akkor szabad, ha MINDKÉT feltétel IGAZ:**

1. **ÉBREN van** — és ezt **tudni** kell, nem feltételezni
2. **ITTHON van** — és ezt **tudni** kell, nem feltételezni

**Ha bármelyik ismeretlen → NEM szabad bemondani.** Az „ismeretlen" nem „valószínűleg igen".
Ilyenkor a mondanivaló a gyengébb csatornákra megy (Discord / postaláda).

Az owner kérése egyben az is, hogy ha a kapu nyitva van, akkor **előszeretettel használjuk** —
tehát a szabály nem a csatorna visszafogásáról szól, hanem a **helyes időzítéséről**.

**Hangerő:** a 2026-09-06-i teszten a 0,4 **túl halk volt** (owner visszajelzése).
Alapérték a beépített **0,7**, ez alá csak indokolt esetben.

---

## 3. Jelenlét és ébrenlét — a szabály (owner, 2026-09-06) és a mért valóság

### 3.1 A szabály — ez a kötelező logika

| Jel | Definíció (owner-döntés) |
|---|---|
| 🏠 **ITTHON** | **A gépét használja.** Más jel nincs, és nem is lesz — ez elég. |
| 👁️ **ÉBREN** | **(a)** megvan az ITTHON-jel (a gépnél van) **VAGY** **(b)** Discordon válaszolt → **onnantól még legalább 1 óra** ébrenlétnek számít |

**Ebből következik:** az ébrenlét **levezetett** jel, nem külön mérés. Nincs szükség
alvás-érzékelőre, okos eszközre, se órarendre.

### 3.2 🔴 Amit a rendszer figyelt — a FEJLESZTÉS ELŐTTI mérés (2026-09-06 délelőtt)

> ⛔ **RÉSZBEN ELAVULT.** Ez a szakasz a **kiinduló állapotot** rögzíti, azért, hogy látszódjon,
> mit kellett megjavítani. A **friss állapot a 3.2b** alatt. A mérési adatok érvényesek, a
> „nem létezik" megjegyzések azóta változtak.

Az owner kérdése: *„Most mi minden alapján van beállítva az, hogy ébren vagyok-e,
mi mindent figyel most a lokál szerver."* A mért válasz:

| Komponens | Mit csinál valójában | Állapot |
|---|---|---|
| **Alvás-állapot szolgáltatás** (`sleep-state.service.ts`) | ⚠️ **SEMMIT nem mér.** Tiszta óra-tippelés: 02:00–10:00 = alvás. A kódban a forrás-mező szó szerint `'time-of-day-heuristic'`. Se egér, se billentyű, se jelenlét. | fut, de **vak** |
| **Aktivitás-figyelő** (`activity-monitor/logger.ps1`) | Percenként: **utolsó beviteli esemény óta eltelt idő** (Windows `GetLastInputInfo` → **egér ÉS billentyű**, nem csak egér) + aktív ablak címe + folyamat neve + app-kategória. 60 s tétlenség fölött `idle`, alatta `active`. Állapot-váltásnál külön eseményt is naplóz. | 🔴 **HALOTT — utolsó adat 2026-05-17** |
| **A kettő összekötése** | ❌ **NINCS.** Az alvás-állapot **nem olvassa** az aktivitás-figyelőt. A kód kommentje maga mondja: *„Phase 2 finomítás később: activity-monitor integration"*. | nem létezik |
| **Hangszórós kapu** | ❌ **NINCS BEKÖTVE.** A `ma cast notify` útvonalon **nincs alvás-ellenőrzés** — hajnali 4-kor is bemondana. | ✅ **AZÓTA MEGÉPÜLT** — lásd 3.2b |

**Az owner feltevése — „kb. annyi az egész, hogy van-e egérmozgás" — részben igaz:**
a figyelő **többet** mér ennél (bármilyen bevitel + melyik alkalmazásban), **de**
① három és fél hónapja nem fut, és ② **soha nem volt bekötve** az ébrenlét-döntésbe.

### 3.2b ✅ A friss állapot (2026-09-06 délután, a fejlesztés után)

| Komponens | Állapot most |
|---|---|
| **Hangszórós kapu** | ✅ **MEGÉPÜLT ÉS BEKÖTVE** (`cli/src/cast/notify.presence-gate.ts`). A `ma cast notify` **élőben igazoltan TILT**, amíg nincs jelenlét-jel. Kézi felülbírálás `--force`-szal, naplózva. |
| **Ébrenlét-döntés** | ✅ A kapu a **mért jelenlétből** vezeti le (3.1 szabály), **nem** a fix órarendből. A régi óra-tippelő szolgáltatás érintetlen maradt, de a kapu **nem használja**. |
| **Jelenlét-figyelő** | 🔴 **Változatlanul nem fut** — ez az egyetlen hiányzó láncszem. Élesítés (owner-lépés): `server/activity-monitor/install-autostart.ps1 -Mode apply`. |
| **Diagnosztika** | ✅ `ma comm doctor` tételesen kiírja mindezt, teendővel együtt. |

⇒ **A lánc a jelenlét-figyelőn kívül teljes.** Amint a figyelő elindul, a kapu magától
átvált „nappali" működésre — kódmódosítás nélkül.

### 3.3 Elvetett út — Google okos eszköz

> a Google eszközök részben tudnak róla, hogy mikor alszom… ahhoz, hogy csatlakozni tudjunk,
> okos eszközzé kéne nyilvánítani, amihez meg mindenféle Google regisztráció kéne, ami most
> szinte biztos, hogy nem lesz.

⛔ **Elvetve** (owner, 2026-09-06). Nem is kell: a 3.1 szabály kiváltja.

### 3.4 Amíg a 3.1 nincs megépítve

A hangszórós csatorna **csak owner-jelenlétben, kézzel indítva** használható
(mint a 2026-09-06-i teszt). **Automatikus tick nem mondhat be semmit.**

---

## 3B. A két workflow — Daytime / Nighttime

**Nem napszakhoz kötött, hanem az ébrenléthez** (owner, 2026-09-06).

| | ☀️ **Daytime** | 🌙 **Nighttime** |
|---|---|---|
| Mikor | ÉBREN (3.1 szerint) | nem ÉBREN |
| Fut a tick? | igen | **igen** — az owner kérése, hogy éjjel is fusson |
| Hangszóró | ✅ engedélyezett, ha ITTHON is igaz | ⛔ **tilos** |
| Discord | ✅ szabadon | csak ha valóban nem halasztható; alapból gyűjt |
| Alapértelmezett viselkedés | értesít, ha van miről | **gyűjt és összesít** — ébredéskor egy csomagban |

⚠️ **„Okosan szinkronban kell tartani"** (owner): a kettő **ugyanazt az ellenőrzés-listát**
futtatja (§4), csak a **kimeneti** szabályok térnek el. Így nem csúszhat szét a két ág,
és az éjjel összegyűjtött tételek nem vesznek el.

❓ **NYITOTT:** az ébredés pillanatában induljon-e külön „jó reggelt, ez történt" összegzés.

---

## 3C. Sürgősség és üzenet-mennyiség (owner, 2026-09-06)

**Mikor indokolt a hangszóró:**

1. **Közeledő határidős feladat** — *„a határidős feladatok közelette lesz olyan, ami annyira sürgős"*
2. **Fontos üzenet, amire nincs reakció, pedig itt van** — *„nem válaszolok, nem láttam… Nem reagálok, de itt vagyok."*
   ⇒ Ez egy **eszkalációs minta**: előbb Discord → ha ITTHON igaz, de nincs reakció → hangszóró.

**Mennyiség:**
- **Nincs fix felső korlát.** Tipikus: **1 tick = 1 üzenet**; több is mehet, ha indokolt.
- 📏 **A Discord-üzenetek legyenek rövidek és tömörek** — kivéve, ha az owner kifejezetten kifejtést kér.

---

## 3D. 🔴 A CCAP nem megkerülhető (owner-korrekció, 2026-09-06)

**Korábbi tévedésem:** azt állítottam, hogy nem vagyok a CCAP-ban. **Ez félrevezető volt.**

**A helyes kép (owner):** a CCAP **sokféle session-típust** kezel, és **a CC session-öket is
a CCAP-on keresztül futtatja** az owner. Tehát **a CCAP-ban vagyok** — csak nem *CCAP-session*
típusként.

⛔ **KÖTELEZŐ:** *„azokat a triggereket, amiket én a Discordon küldök neked, azt a CCAP
rendszerén keresztül kell a CC Sessionbe elküldeni… Nem kerülheted meg a CCAP-t a neked
szánt üzenetekkel."*

⇒ A Discord → agent visszaút **a CCAP-on át vezet**. A közvetlen fájlba írás (postaláda)
mint **megkerülő** út **nem elfogadható**; legfeljebb a CCAP-út **mellett**, naplózásra.

### ✅ TISZTÁZVA (2026-09-06, élő méréssel) — a CCAP-út megvan

A CCAP-ban **kész, működő** út van erre. A bejövő lánc:

```
Discord-üzenet (engedélyezett felhasználótól)
  → CCAP Discord-szolgáltatás
  → a Discord-kötés bejövő útja
  → CC_Manager.sendPrompt({ ccapId, sessionId, content })
  → egyenesen az én bemenetemre
```

**Az azonosítóim:** CC session `ccs-6f25a888-mtp9a8cx` · CCAP instance
`df6d8572-e655-4d55-a032-603afc8c4b26`.

**Ami hiányzik:** maga a **kötés** (mérve: `{"binding": null}`), a **felhasználó-engedély**,
és az **előtag**. Teljes terv: `__agent/plans/discord-two-way-hyperplan/hyperplan.plan.md`.

---

## 3E. Discordról érkező üzenetek — előtag és válasz-kötelezettség

### Owner szövege (2026-09-06, szó szerint)

> Amikor a Discordon írok neked egy üzenetet, akkor azt szeretném, hogy a CCAP rendszerén
> keresztül el legyen küldve neked a CC sessionbe. Ehhez mindenképpen fel kell jegyezni
> valami konfigba, hogy te melyik session vagy a CCAP-ban. ( nem CCAP Session, hanem CC
> Session a CCAP-ban!) És annyit szeretnék még, hogy ezeket lássuk el egy prefix-el:
> "INCOMING_USER_MSG_ON_DISCORD:" ( és a workflowba bele kéne rakni azt is, hogy ezekre nem
> elég ha csak válaszolsz, hanem a Discord üzenetben is kell válaszoljál.)

> ( Ez lehet egy későbbi fejlesztés, de jó lenne, ha megoldanánk azt is, hogy amíg a
> sessionöd folyamatban van, addig csak gyűjtsük a Discord üzeneteket, és egyszerre küldjük
> el, amikor felszabadul a csatornád. … Ezeket az infókat szintén a CCAP-ból lehet lekérni.)

### 🔴 KÖTELEZŐ SZABÁLY

| # | Szabály |
|---|---|
| 1 | A Discordról érkező üzenet **`INCOMING_USER_MSG_ON_DISCORD:`** előtagot kap |
| 2 | 🔴 **Ilyen üzenetre NEM elég a sessionben válaszolni — Discordon IS válaszolni KELL.** |
| 3 | A Discord-válasz legyen **rövid, tömör** — kivéve, ha az owner kifejezetten kifejtést kér |
| 4 | Ha egy előtagos üzenetre **nem ment** Discord-válasz, az **hiba** — naplózandó, nem elnézhető |

⚠️ **Miért kell a 4-es:** a legvalószínűbb csendes hiba az, hogy a sessionben válaszolok, és
azt hiszem, kész — miközben az owner oldalán **néma marad** a csatorna. Ez nem az emlékezetemre
bízandó.

### Üzenet-gyűjtés foglalt session alatt (későbbi fejlesztés)

A CCAP-ban **már megvan hozzá minden**: van CC-session üzenet-sor (`queue.items`,
`queue.isLocked`), **foglaltság-jelző** (`flags.isBusyProcessing`), és **késleltetett-üzenet
ütemező** (5 mp-es ütem).

⇒ **Nem építeni kell, hanem megfigyelni és szabályozni.** Első lépés: nézzük meg, hogyan
viselkedik a meglévő sor foglalt session mellett — utána döntsünk a szabályról.

---

## 4. Mit néz át a tick (vázlat — bővítendő)

> Ez a lista **még nem teljes**; az ownerrel közösen bővítjük.

| # | Ellenőrzés | Forrás | Miből lesz értesítés |
|---|---|---|---|
| 1 | **Feladatok + határidők frissítése** | **organizer** (`fo tasks.list`) — owner kifejezett kérése | lejárt / ma esedékes / 1 órán belüli |
| 2 | **Naptár-események** | organizer `calendar.*` | 1 órán belül kezdődő |
| 3 | **Ismétlődő feladatok csúszása** | `current/principles/recurring-tasks.md` + napló | kihagyott ciklus, halogatás-szorzóval |
| 4 | **Alvás / lefekvés** | `sleep-system.md` (18 h ébrenlét) | közeledő lefekvés-idő |
| 5 | **Készlet-küszöbök** | `stock-system.md` + készlet-tükör | újrarendelési szint alatt |
| 6 | **Kaja-rendelés fedettség** | Interfood heti fedettség | lejáró rendelési határidő |
| 7 | ❓ **NYITOTT** | — | *amit az owner még hozzátesz* |

### Döntési sorrend egy tickben

1. **Státusz-kivonat beolvasása** (§5) — egy hiteles pillanatkép
2. **Van-e egyáltalán mondanivaló?** Ha nincs → **csendes tick**, nincs üzenet
3. **Sürgősség-besorolás** tételenként
4. **Csatorna-választás** a §2 tábla + a hangszórós kapu szerint
5. **Zavarhatóság ellenőrzése** (alvás, hét napja, hullám-vektor)
6. Küldés **vagy** postaládába tétel
7. Minden döntés az akció-naplóba — **a csendes tick is**

---

## 5. A státusz-kivonat eszköz (owner-ötlet, megépítendő)

**Cél:** egy **hiteles, aktuális** kivonat **egy helyen**, hogy a tick ne 8 forrásból
kaparja össze a képet.

**Kötelező tartalom (az owner szövege szerint):**

| Blokk | Mit tartalmaz |
|---|---|
| 🔜 **Egy órán belül** | ami a következő 60 percben esedékes |
| 📅 **Ma** | ami a mai napra szól |
| ⏮️ **Elmúlt** | ami lejárt / kicsúszott és még nyitva van |
| ➕ **Bővíthető** | *„Meg majd még amit kérek a jövőben."* — a szerkezet legyen bővíthető |

**Alapelvek:**
- **Hiteles** = a feladatokra/határidőkre az **organizer** az elsődleges forrás, nem a lokál másolat
- Legyen **egyetlen hívás**, gépi formátumban is olvasható
- Ha egy forrás **nem elérhető**, azt **jelölje** — a hiányzó adat ne látszódjon „nincs teendő"-nek

❓ **NYITOTT:** pontos névtér és formátum · mindig élő lekérés, vagy cache-elhető

---

## 6. Megépítendő sorrend

| # | Mi | Állapot (2026-09-06) |
|---|---|---|
| 1 | **Csatorna-diagnosztika** | ✅ **KÉSZ** — `ma comm doctor` |
| 2 | **Jelenlét-figyelő újraélesztése** + automatikus indulás | 🔴 **owner-lépés:** `server/activity-monitor/install-autostart.ps1 -Mode apply` |
| 3 | **Az ébrenlét-döntés átkötése** a §3.1 szabályra | ✅ **KÉSZ** — a kapu a MÉRT jelenlétből dönt, nem órarendből |
| 4 | **A hangszórós kapu bekötése** a bemondás útvonalába | ✅ **KÉSZ** — `ma cast notify` élőben igazoltan TILT |
| 5 | **Discord bot** — küldés + olvasás | 🔴 **owner-lépés:** saját alkalmazás + token |
| 6 | **CCAP-visszaút** (§3D) | ✅ **KÉSZ** — `POST /api/cc-session/:id/prompt`, kötegelve |
| 7 | **Státusz-kivonat eszköz** (§5) | ✅ **KÉSZ** — `ma status digest` |
| 8 | **A tick maga** — Daytime + Nighttime ág (§3B) | ✅ **KÉSZ száraz futásig** — `ma tick plan` |

### A megépült parancsok

```bash
ma comm doctor        # mi él / mi hiányzik / mi a TEENDŐ
ma status digest      # elmúlt · egy órán belül · ma · dátum nélküli magas prioritású
ma tick plan          # mit tenne most a tick (nem küld semmit)
ma ccap whoami        # melyik CC session vagyok a CCAP-ban
ma comm flush         # a Discord-köteg kiküldése (EGY prompt, nem N)
```

⚠️ **A tick élesben még nem küld** — a Discord-út az owner bot-tokenjére vár, a hangszórós út
pedig a jelenlét-figyelőre. Addig a `plan` a használható forma.

---

## 7. Kérdések — állapot

### ✅ Megválaszolva (owner, 2026-09-06)

| Kérdés | Válasz |
|---|---|
| „Itthon van" — elég a gép-használat? | **Igen, elég** — más jel nem lehet |
| Éjjel is fusson a tick? | **Igen**, de külön Nighttime-ággal, okos szinkronban (§3B) |
| Mi indokolja a hangszórót? | Közeledő **határidő**; vagy **reakció nélkül maradt fontos üzenet, miközben itthon van** (§3C) |
| Üzenet-maximum tickenként? | **Nincs.** Tipikusan 1; több is mehet, ha indokolt. Discordon **rövid, tömör** (§3C) |

### ❓ Még nyitott

| # | Kérdés |
|---|---|
| 1 | A §4 ellenőrzés-lista **mivel bővül még**? |
| 2 | Ébredéskor legyen-e külön **„ez történt éjjel" összegzés**? |
| 3 | **Telefonos jelenlét-visszajelzés** — owner felvetette: *„ha belső hálózaton vagyok, akkor azt kiderüljön neked a státuszból"*. Hogyan? (Ez a §3.1-en **túli** bővítés — most nem blokkoló.) |
| 4 | A CCAP melyik belépési pontja viszi az üzenetet egy futó CC session-be? (§3D) |

---

## Kapcsolódó

- `current/feature-requests/triggering-system-architecture.md` — a 3-session architektúra
- `current/feature-requests/communication-forms.md` — csatorna-dispatcher
- `current/feature-requests/discord-webhook-notification.md` — Discord (bot-irány)
- `current/feature-requests/sleep-aware-notifications.md` — zavarhatóság
- `current/feature-requests/activity-tracking.md` — jelenlét-mérés
- `current/principles/sleep-system.md` · `recurring-tasks.md` · `priority-system.md`
- `__agent/plans/assistant-agent-cron.plan.md`
- `__documentations/developments/2026-09-06-communication-channel-analysis-and-cast-live-test.md`

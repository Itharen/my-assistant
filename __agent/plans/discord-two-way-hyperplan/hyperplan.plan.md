# HYPERPLAN — Kétirányú Discord-csatorna + Assistant-tick workflow

**Azonosító:** HP-DSC-001 · **Létrehozva:** 2026-09-06 · **Owner-kérés:** *„nagyon-nagyon
alaposan tervezd meg mindent, ami ehhez szükséges. Készíts egy Hyperplant"*

---

## 📊 STATUS

```yaml
state: live-verified
overall_progress: "EGY belepesi pont: dc ldp -> szerver -> Discord-figyelo + Jelenlet-figyelo + Konzol-pulzus. Mindharom felugyelve/bekotve. CLI 415/415 + szerver 42/42 zold."
blocking: "NINCS technikai blokkolo. Marad: nyitott kerdesek (H, I, J, K, L, M)."
architecture_decision: "SAJÁT bot (owner, 2026-09-06) + a CCAP hivatalos prompt-végpontja a bejuttatásra, SAJÁT oldali kötegeléssel (1 futás, nem N)"
review_loop: "MINDKÉT szakaszra TELJESÜLT — 1. szakasz 8 kör/11 javítás, figyelő 7 kör/10 javítás; mindkettőnél az utolsó KETTŐ tiszta."
last_updated: 2026-09-07
outside_this_plan: "A 2026-09-07-i C-33 (Discord-hanguzenet vegig), C-44 (konzol-pulzus) es C-45 (koteg-frissites) NEM ennek a tervnek a resze - allapotuk: __agent/CONTINUATION.md + __agent/capabilities/CATALOG.md. Itt csak a teszt-szamok es a datum frissultek."
```

| Master-plan | Cím | Állapot |
|---|---|---|
| MP-0 | Felderítés + tervezés | ✅ **KÉSZ** (2026-09-06) |
| MP-1 | **Saját** Discord-alkalmazás és bot | ✅ **ÉLŐBEN IGAZOLT** — `Honnie#6234`, csak a bot-tokennel |
| MP-2 | Kötegelő + előtag + **figyelő** + **életjel** + **automatikus kiküldés** | ✅ **KÉSZ, ÖNMŰKÖDŐ** — a figyelő 15 mp-enként maga küldi ki a köteget (korábban kézi `flush` kellett) |
| MP-3 | Válasz-kötelezettség Discordra | ✅ **KÉSZ** — `ma comm say` + a G-1 automatikus elmaradás-ellenőrzés a `doctor`-ban, élőben igazolva |
| MP-4 | Session-azonosság futásidejű feloldása | ✅ **KÉSZ, élőben zöld** — `ma ccap whoami` |
| MP-5 | Jelenlét + ébrenlét (a hangszórós kapu) | ✅ **KÉSZ** — a kapu bekötve, a figyelőt a `PresenceMonitor_Service` tartja életben |
| MP-6 | Csatorna-diagnosztika | ✅ **KÉSZ** — `ma comm doctor` |
| MP-7 | Státusz-kivonat + a tick | ✅ **KÉSZ száraz futásig** — `ma status digest` · `ma tick plan` |
| MP-8 | **A szerver a gazda** + „gépel…" visszajelzés | ✅ **ÉLŐBEN IGAZOLT** (2026-09-06) — `DiscordListener_Service` felügyeli a figyelőt; a Discordon látszik, hogy dolgozom |
| MP-9 | **`dc ldp` a default futtatási mód** | ✅ **ÉLŐBEN FUT** (2026-09-07) — saját terminálablak; alatta a szerver mindkét figyelőt viszi. Elv: `current/principles/ldp-default-runtime.md` |

> ⚠️ **Ezt a blokkot a review-kör 5 találta elavultnak** (2026-09-06): „0/7, az építés nem
> indult" állt benne, miközben 5 csomag elkészült. Mivel az ébresztő-prompt **erre a fájlra**
> mutat feladat-fájlként, egy friss session emiatt **újra elvégezhette volna a kész munkát**.
> Tanulság: a hyperplan STATUS-blokkját **minden munkacsomag után** frissíteni kell, nem csak
> a `CONTINUATION.md`-t.

---

## 1. Mit akarunk elérni (a kész definíciója)

1. Az owner ír egy üzenetet Discordon → **a CCAP-on keresztül** megérkezik ebbe a CC
   sessionbe, `INCOMING_USER_MSG_ON_DISCORD:` előtaggal.
2. Én **Discordon is válaszolok** — nem elég a sessionben válaszolni.
3. Az óránkénti tick eldönti, **miről kell szólni és melyik csatornán** — a hangszóró
   csak **ébren + itthon** esetén.
4. Amíg a sessionöm foglalt, a Discord-üzenetek **gyűlnek**, és a csatorna felszabadulásakor
   **egyben** érkeznek.

### Kemény korlátok

| ⛔ | Korlát | Forrás |
|---|---|---|
| 1 | **A nekem szánt üzenetek nem kerülhetik meg a CCAP-ot** | owner, 2026-09-06 |
| 2 | Hangszóró **csak ébren ÉS itthon** | owner, 2026-09-06 |
| 3 | **Ne építsünk újra**, ami a CCAP-ban már megvan | `core-patterns-first`, `fdp-use-existing-tooling` |
| 4 | Titok **soha** repóba/dokumentumba; `.env` gitignore-olva | `fdp-keystore-secrets` |
| 5 | Minden érdemi lépés **dokumentum + akció-napló** | `core-document-everything` |

---

## 2. MP-0 — Felderítés (✅ KÉSZ, 2026-09-06)

### Amit élőben megmértem

| Megállapítás | Bizonyíték |
|---|---|
| A CCAP-ban **kész, működő Discord-alrendszer** van | `msg-discord.control-service` (`discord.js`), kötés-végpontok, be- és kimenő út |
| ~~A bot token már be van állítva~~ 🔴 **TÉVES VOLT** | **Újramérve 2026-09-06 16:5x:** `ccap config` → *„Discord Bot Token: (nincs beállítva)"*. A korábbi állítás **hibás** volt — félreolvastam a kimenetet. ⇒ A CCAP-ban **NINCS** Discord-bot, tehát nincs mit elrontani vele. |
| A bejövő út **közvetlenül az én bemenetemre** megy | `msg-discord-binding-inbound.util` → `CC_Manager.sendPrompt({ccapId, sessionId, content})` |
| **Van üzenet-sor és foglaltság-jelzés** | `queue.items` · `queue.isLocked` · `flags.isBusyProcessing` |
| **Van késleltetett-üzenet ütemező** | `msg-delayed-message-scheduler`, 5 mp-es ütem |
| **A kötés hiányzik** | `GET .../discord-binding/cc-session/ccs-6f25a888-mtp9a8cx` → `{"binding": null}` |
| **Az előtag hiányzik** | a kódban `trimmedContent` megy tovább, előtag nélkül |
| **Meg tudom találni magam** | `CLAUDE_CODE_SESSION_ID` ↔ `/api/cc-session` → `claudeSessionId` → `sessionId` |

⭐ **A terv legfontosabb következménye:** az eredetileg tervezett „építsünk Discord-botot a
my-assistant-ba" munka **nagyrészt szükségtelen**. A meglévő CCAP-képességet kell
**bekonfigurálni**, nem újraírni. Ez nagyságrendekkel kevesebb munka és kevesebb hibalehetőség.

### Az azonosítóim

| Mező | Érték |
|---|---|
| CC session | `ccs-6f25a888-mtp9a8cx` („My Assistant") |
| CCAP instance | `df6d8572-e655-4d55-a032-603afc8c4b26` |
| Claude Code session | `3fbced7d-9876-4fd6-8d92-f5b993859748` |

---

## 3. MP-1 — Saját Discord-alkalmazás és bot 🔴 *owner-lépésre vár*

> ⚠️ **A CCAP saját Discord-kötését NEM használjuk** (owner-döntés: saját bot).
> A CCAP-ból **csak** a `prompt` bejuttató végpontot használjuk (MP-2 §4.1).
> ⛔ **A CCAP meglévő botjának tokenjéhez nem nyúlunk** — külön alkalmazás készül.

| Lépés | Mit | Ki |
|---|---|---|
| 1.1 | **Új Discord-alkalmazás** létrehozása (pl. „My Assistant") | **owner** |
| 1.2 | Bot fül: `MESSAGE CONTENT INTENT` **BE** · `Requires OAuth2 Code Grant` **KI** | **owner** |
| 1.3 | **Token generálása** és a `.env`-be írása (`MA_DISCORD_BOT_TOKEN`) | **owner** *(a token így sosem kerül átiratba)* |
| 1.4 | Bot meghívása egy **dedikált csatornába** (`View Channels` + `Send Messages` + `Read Message History`) | **owner** |
| 1.5 | **Csatorna- és felhasználó-azonosító** átadása (nem titkos) | **owner** |
| 1.6 | Kapcsolat-ellenőrzés: a bot bejelentkezik-e, látja-e a csatornát | én |

**Kész, ha:** a bot **online**, látja a csatornát, és **mindkét irány élőben igazolt**.
🔴 A „beállítottam" önmagában **nem** elég — élő próba kell (`core-no-guessing`).

**Részletes lépések:** `__documentations/dev/DISCORD_BOT_SETUP.md`

---

## 4. MP-2 — Saját bot + `INCOMING_USER_MSG_ON_DISCORD:` előtag

> **OWNER-DÖNTÉS 2026-09-06:** *„Saját bot tokent kéne beállítsál. és saját bot kezelést."*
> ⇒ **NEM** a megosztott CCAP-botot használjuk, hanem a my-assistant **saját** Discord-botját,
> saját tokennel és saját kezeléssel.

### 4.1 Az architektúra, ami ebből következik

```
Discord  ──► SAJÁT bot (a my-assistant üzemelteti, saját token)
                │
                ├─ hozzáfűzi: "INCOMING_USER_MSG_ON_DISCORD:"
                │
                └─► POST /api/cc-session/<ccs-…>/prompt   { "content": "..." }
                        │  (a CCAP hivatalos végpontja)
                        └─► a CCAP juttatja be a CC sessionbe
```

**Kimenő irány** (én → Discord): a saját bot küld közvetlenül. *(Ez nem „nekem szánt üzenet",
tehát nem érinti a CCAP-megkerülési tilalmat.)*

### 4.2 ⭐ Ez a döntés HÁROM problémát old meg egyszerre

| Probléma | Hogyan oldódik meg |
|---|---|
| **Az előtag hiánya** | A **saját** kezelőnk teszi rá, mielőtt átadja a CCAP-nak. ✅ **CCAP-módosítás NEM kell** — a korábbi „módosíthatom-e a CCAP-ot?" kérdés **tárgytalan**. |
| **A CCAP megkerülése** | ⛔ Nincs megkerülés: a bejuttatás a CCAP **hivatalos** `prompt` végpontján megy. |
| **Elkülönülés** | A saját bot csak a My Assistantot szolgálja — nem keveredik a CCAP megosztott botjának forgalmával. |

### 4.3 🔴 KÖTEGELÉS A MI OLDALUNKON — nem a CCAP sorára hagyva

> **Owner-korrekció, 2026-09-06:** *„a CCAP most is szépen sorba teszi az üzeneteket, de pont
> ezt mondom, hogy szeretném, hogy ezt te magad, illetve a te oldaladon legyen menedzselve
> lehetőleg, mert minden egyes prompt egy hosszabb futást eredményez, és ezért lenne fontos,
> hogy minél több infó kerüljön be egy-egy promptba."*

**Korábban tévesen azt írtam, hogy „nulla munkával megvan".** A különbség lényeges:

| | CCAP beépített sora | Amit az owner kér |
|---|---|---|
| 3 üzenet foglaltság alatt | **3 külön prompt**, egymás után | **1 összevont prompt** |
| Következmény | **3 hosszú futás** | **1 futás** |
| Ki dönt a tartalomról | senki — sorrend szerint | **mi** — összefűzve, kontextussal |

⇒ A CCAP sora **nem rossz, csak más célra való**. A drága erőforrás **a futás**, nem az
üzenet — ezért **minél több infó kerüljön EGY promptba**.

### 4.3.1 A kötegelő működése (saját, a bot oldalán)

| Lépés | Mit |
|---|---|
| a | Beérkező Discord-üzenet **nem megy azonnal tovább** — helyi kötegbe kerül, időbélyeggel |
| b | **Kiküldési feltétel:** a session **szabad** *(`flags.isBusyProcessing` hamis)* **VAGY** letelt egy rövid összegyűjtési ablak |
| c | Kiküldéskor a köteg **egy** prompttá fűződik: `INCOMING_USER_MSG_ON_DISCORD:` + a tételek sorrendben, időbélyeggel |
| d | Egyetlen `POST …/prompt` hívás — **a CCAP sora így legfeljebb 1 elemet lát** |
| e | Sikeres átadás után a köteg ürül; **hiba esetén NEM ürül** (nem veszhet el üzenet) |

**Tervezési elvek:**
- 🔴 **Üzenet soha nem veszhet el** — a köteg csak **igazolt** átadás után ürül
- 🔴 **Sorrend megőrzendő**, időbélyeggel együtt
- ⚠️ A köteg **túlélje a bot újraindulását** → lemezre írjuk, nem csak memóriában tartjuk
- Az összegyűjtési ablak hossza **beállítható**, alapértéke méréssel finomítandó

### 4.3.2 Mit használunk MÉGIS a CCAP-ból

| Amit | Mire |
|---|---|
| `flags.isBusyProcessing` | a kiküldési feltételhez — **ez mondja meg, hogy szabad vagyok-e** |
| `queue.items` / `queue.isLocked` | ellenőrzés: tényleg csak 1 elem áll-e a CCAP sorában |
| `POST …/prompt` | az **egyetlen** átadó hívás |

⇒ A CCAP sora **biztonsági hálóként** marad alattunk (ha mégis foglaltan érkezne be valami),
de a **normál út a mi kötegelőnk**.

### 4.4 Feladatok

| Lépés | Mit |
|---|---|
| 2.1 | **Saját Discord-alkalmazás + bot** létrehozása (külön a CCAP botjától) |
| 2.2 | Token a `.env`-be: `MA_DISCORD_BOT_TOKEN` *(gitignore-olva)* |
| 2.3 | Saját bot-kezelő: **bejövő figyelés** ✅ (`ma comm listen`) · kimenő küldés ⚪ (token után) |
| 2.4 | Előtag hozzáfűzése, majd átadás a CCAP `prompt` végpontjának — ✅ (a kötegelőben) |
| 2.5 | **Csak a saját felhasználód** üzenetét fogadjuk el — ✅ **8 teszt** fedi |
| 2.6 | Élő próba: te írsz Discordon → előtaggal megérkezik hozzám — ⏳ **tokenre vár** |
| 2.7 | **Életjel + `doctor`-ellenőrzés** — ✅ **KÉSZ** (7 teszt). A figyelő 60 mp-enként jelt ír; a diagnosztika a **frissességét** nézi. Elhallgatott jel → `broken`. **Ez zárja ki a „csendben elhalt csatorna" hibát** — a jelenlét-figyelő 112 napig volt így halott. |

---

## 5. MP-3 — Válasz-kötelezettség Discordra

**Owner szabálya:** *„ezekre nem elég ha csak válaszolsz, hanem a Discord üzenetben is
kell válaszoljál."*

| Lépés | Mit |
|---|---|
| 3.1 | A workflow-ba **kötelező szabályként** beírni *(kész — lásd a workflow-fájlt)* |
| 3.2 | Kimenő út igazolása: tudok-e a kötött csatornába írni |
| 3.3 | **Elmaradás-védelem:** ha egy előtagos üzenetre nem ment Discord-válasz, az **hibaként** jelenjen meg a naplóban |
| 3.4 | Stílus: **rövid, tömör** Discord-üzenetek, kivéve ha kifejtést kérsz |

⚠️ **Ez a leggyakoribb csendes hibalehetőség:** válaszolok a sessionben, és azt hiszem, kész.
Ezért kell a 3.3 automatikus ellenőrzés — ne az emlékezetemre bízzuk.

### 🔴 KÖVETETT HIÁNYOK — a szabály ki van mondva, a kód még NEM tudja (review-kör 3, 2026-09-06)

A workflow-doksi két szabálya jelenleg **nincs megvalósítva**. Ezek nem feledékenységből
maradtak ki: **mindkettő élő Discord-kapcsolatot igényel**, ami az MP-1-re vár. Itt
rögzítve, hogy ne sikkadjanak el.

| # | A kimondott szabály | Miért nincs még kód | Mi kell hozzá |
|---|---|---|---|
| G-1 | *„Ha egy előtagos üzenetre nem ment Discord-válasz, az **hiba** — naplózandó."* (workflow §3E/4) | Nincs mihez mérni: kell egy nyilvántartás, hogy melyik bejövő üzenetre ment válasz | MP-1 után: válasz-nyugta a kimenő úton + ellenőrzés |
| G-2 | *„Fontos üzenet, amire nincs reakció, pedig itt van"* → **eszkaláció Discordról hangszóróra** (workflow §3C, 2. pont) | Ehhez tudni kell, hogy **elolvastad-e / válaszoltál-e** — ez csak élő Discorddal mérhető | MP-1 után: a kimenő üzenet ideje + a te válaszod ideje összevetése |

⚠️ **A tick jelenleg CSAK a közeledő határidőre eszkalál hangszóróra** (§3C 1. pont).
A 2. pont szerinti eszkaláció **hiányzik** — ez tudatos, jelölt hiány, nem hiba.

---

## 6. MP-4 — Session-azonosság: konfig + futásidejű feloldás

**Owner kérése:** *„mindenképpen fel kell jegyezni valami konfigba, hogy te melyik session
vagy a CCAP-ban."*

| Réteg | Mit ad | Miért kell |
|---|---|---|
| **Konfig** (rögzített) | „a My Assistant asszisztens **szerepet** ez a session viszi" | stabil hivatkozás; a Discord-kötés ehhez szól |
| **Futásidejű feloldás** | „**most éppen** melyik session-azonosító tartozik hozzá" | mert a `ccs-…` azonosító session-indításkor **változhat** |

**A feloldás módja:** `CLAUDE_CODE_SESSION_ID` → `/api/cc-session` → `claudeSessionId`
egyezés → `sessionId`.

| Lépés | Mit |
|---|---|
| 4.1 | A konfig helyének eldöntése: CCAP saját `tracked-sessions` nyilvántartása **vagy** my-assistant-oldali fájl ❓ |
| 4.2 | Önazonosító segéd: „ki vagyok most?" — egy hívás, ami visszaadja a hármast |
| 4.3 | ~~Újraindulás-kezelés~~ → **owner: „azt a CCAP majd megoldja" (2026-09-06)** ⇒ **kikerül a hatókörünkből** |

**Amit ettől függetlenül megtartunk:** a bot **minden induláskor frissen oldja fel** az
azonosítót (`CLAUDE_CODE_SESSION_ID` → CCAP-lekérdezés), és **nem tárolja be véglegesen**.
Ez amúgy is a helyes működés, és nem igényel külön fejlesztést.

---

## 7. MP-5 — Jelenlét és ébrenlét (a hangszórós kapu)

**A szabály** (owner, 2026-09-06): **ITTHON** = használja a gépét · **ÉBREN** = itthon-jel
**VAGY** Discord-válasz (+1 óra).

| Lépés | Mit | Miért |
|---|---|---|
| 5.1 | A jelenlét-figyelő **újraélesztése** (2026-05-17 óta halott) + **automatikus indulás** géppel együtt | ez az egyetlen jel |
| 5.2 | Az ébrenlét-döntés **átkötése** a fix órarendről a fenti szabályra | a mostani vak és téves |
| 5.3 | Discord-válasz → **ébren +1 óra** jelzés bevezetése | az owner szabálya |
| 5.4 | **A kapu tényleges bekötése a bemondás útjába** | ma **nincs** kapu — hajnalban is megszólalna |
| 5.5 | **Ismeretlen ⇒ tilt.** Ha a jel hiányzik, nincs bemondás | owner-szabály szó szerint |

⚠️ **5.4 a kritikus:** ma a hangszórós út **teljesen kapu nélkül** fut. Amíg ez így van,
automata tick **nem** mondhat be semmit.

---

## 8. MP-6 — Csatorna-diagnosztika *(owner már jóváhagyta)*

**Owner kérése:** *„kéne legyen nagyon alapos hibakezelési rendszerünk, ami deskriptív infót
ad neked arról, hogy mi nem jó, mi hiányzik."*

Egy parancs, ami **tételesen** kiírja minden csatornáról: **él-e · mi hiányzik · mi a
következő lépés**.

| Ellenőrzés | Mit néz |
|---|---|
| CCAP | fut-e a szerver; megvan-e a Discord token |
| Session-azonosság | feloldható-e a saját `ccs-…` azonosítóm |
| Discord-kötés | létezik-e; **a jelenlegi** azonosítóra szól-e; engedélyezve van-e a felhasználó |
| Hangszóró | elérhetők-e az eszközök |
| Jelenlét-figyelő | fut-e; **mennyire friss** az adata |
| Ébrenlét-döntés | melyik forrásból dönt — mérésből vagy órarendből |
| Hangszórós kapu | be van-e egyáltalán kötve |

**Alapelv:** minden hiba **mondja meg a megoldást is**, ne csak a tünetet.
🔴 És **a „nem tudom" is eredmény** — a hiányzó adat soha ne látszódjon „rendben"-nek.

---

## 9. MP-7 — Státusz-kivonat + a tick

| Lépés | Mit |
|---|---|
| 7.1 | **Státusz-kivonat**: egy hívás → *egy órán belül · ma · elmúlt* (+ bővíthető), az organizerből mint elsődleges forrásból |
| 7.2 | Forrás-hiba **látható** legyen — a hiányzó adat ne látszódjon „nincs teendő"-nek |
| 7.3 | **Daytime ág** — értesít, ha van miről |
| 7.4 | **Nighttime ág** — gyűjt, ébredéskor összesít; hangszóró tilos |
| 7.5 | Csatorna-választás + eszkaláció (Discord → ha itthon és nincs reakció → hangszóró) |
| 7.6 | Minden tick a naplóba — **a csendes is** |

---

## 10. Sorrend és függőségek

```
MP-0 ✅
  └─ MP-1 (kötés) ──┬─ MP-2 (előtag)
                    ├─ MP-3 (Discord-válasz)
                    └─ MP-4 (azonosság) ─┐
                                          ├─ MP-6 (diagnosztika)
  MP-5 (jelenlét/ébrenlét) ───────────────┘
                                          └─ MP-7 (kivonat + tick)
```

**Javasolt haladási sorrend:** MP-1 → MP-6 (kicsi, azonnal hasznot hoz) → MP-4 → MP-2 →
MP-3 → MP-5 → MP-7.

**Indoklás:** az MP-1 után **azonnal működik a csatorna** — onnantól minden további lépést
már azon keresztül is meg tudunk beszélni. Az MP-6 pedig azért jön korán, mert onnantól
**nem kell találgatnom**, mi romlott el.

---

## 11. Kockázatok

| # | Kockázat | Miért fáj | Ellenszer |
|---|---|---|---|
| 1 | ~~A session-azonosító megváltozik~~ | — | **Owner (2026-09-06): „azt a CCAP majd megoldja"** ⇒ kikerült a hatókörünkből |
| 1b | **A kötegelő elveszít egy üzenetet** (összeomlás, hibás átadás) | némán eltűnik, amit írtál | a köteg **lemezre** íródik, és **csak igazolt átadás után** ürül (MP-2 §4.3.1) |
| 2 | Válaszolok a sessionben, de **Discordra nem** | te azt hiszed, nem is olvastam | MP-3.3 automatikus elmaradás-ellenőrzés |
| 3 | A **token újragenerálása** a portálon | **leállítaná a CCAP jelenlegi működő botját** | ⛔ ne generálj újat; a runbook figyelmeztet |
| 4 | Az MP-2 a **CCAP-ot** érinti (más projekt) | jogosultsági és hatókör-kérdés | owner-döntés **előre** |
| 5 | A hangszóró **kapu nélkül** szólal meg alvás közben | a bizalom sérül | MP-5.4 **az automata tick előtt** kötelező |
| 6 | Az üzenet-gyűjtés foglaltság alatt **nem a várt módon** viselkedik | duplázás vagy elvesztés | előbb **megfigyelés** a meglévő sorral, csak utána szabályozás |

---

## 12. Nyitott owner-döntések

| # | Kérdés |
|---|---|
| 1 | A 3 Discord-azonosító (szerver · csatorna · felhasználó) — **MP-1 blokkolva** |
| 2 | **Módosíthatom-e a CCAP-ot** az előtag miatt (MP-2), vagy kérésként adjuk be? |
| 3 | A session-szerep konfigja **hova** kerüljön — CCAP-oldalra vagy my-assistant-oldalra? |
| 4 | Legyen-e külön „ez történt éjjel" ébredési összegzés? |
| 5 | Az ellenőrzés-lista mivel bővül még? |

---

## Kapcsolódó

- `__documentations/dev/DISCORD_BOT_SETUP.md` — tételes beállítás
- `__agent/flows/recurring/hourly-assistant-tick/README.md` — a workflow-szabályok
- `__documentations/developments/2026-09-06-communication-channel-analysis-and-cast-live-test.md`
- `current/feature-requests/discord-webhook-notification.md`
- `__agent/references/ccap/REFERENCE.md`

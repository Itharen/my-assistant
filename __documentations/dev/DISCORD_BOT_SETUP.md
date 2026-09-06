# Discord bot — beállítási runbook (SAJÁT bot, tételes, friss forrásokból)

> **Ellenőrizve: 2026-09-06.** Minden állítás vagy **élő mérésből** (a saját gépeden futó
> CCAP forráskódja és API-ja), vagy a **hivatalos Discord fejlesztői dokumentációból**
> származik — nem internetes útmutatókból. Owner kifejezett kérése:
> *„tele van elavult régi leírásokkal az internet"*.
>
> **Owner-döntés 2026-09-06:** *„Saját bot tokent kéne beállítsál. és saját bot kezelést."*
> ⇒ **Külön, saját Discord-alkalmazás** készül a My Assistantnak. A CCAP megosztott botját
> **nem** használjuk, és ⛔ **a tokenjéhez nem nyúlunk**.

---

## 0. Az architektúra egy ábrán

```
   Te, Discordon
        │
        ▼
   SAJÁT bot  ── a my-assistant üzemelteti, saját token ──┐
        │                                                 │
        │ hozzáfűzi: "INCOMING_USER_MSG_ON_DISCORD:"       │  (kimenő irány:
        ▼                                                 │   a bot közvetlenül
   POST /api/cc-session/<ccs-…>/prompt  { "content": … }   │   ír a csatornába)
        │  ⬅ a CCAP HIVATALOS végpontja                   │
        ▼                                                 │
   a CCAP bejuttatja a CC sessionbe  ────────────────► én ┘
```

### Miért éppen így

| Követelmény | Hogyan teljesül |
|---|---|
| **Saját bot, saját kezelés** (owner) | külön alkalmazás, külön token, saját kezelő-kód |
| ⛔ **A CCAP nem kerülhető meg** (owner hard-rule) | a bejuttatás a CCAP `prompt` végpontján megy — nem fájlba írunk |
| **Előtag** kell | a **saját** kezelőnk teszi rá → ✅ **CCAP-módosítás nem kell** |
| **Gyűjtsön, amíg foglalt vagyok** | ✅ **a MI kötegelőnk** csinálja: N üzenet → **EGY** prompt (1 futás, nem N) — lásd §5 |

---

## 1. Az én azonosítóim a CCAP-ban (élő mérés, 2026-09-06)

Owner kérése: *„fel kell jegyezni valami konfigba, hogy te melyik session vagy a CCAP-ban.
(nem CCAP Session, hanem CC Session a CCAP-ban!)"*

| Mező | Érték |
|---|---|
| **CC session azonosító** | `ccs-6f25a888-mtp9a8cx` |
| **Címke** | `My Assistant` |
| **CCAP instance azonosító** | `df6d8572-e655-4d55-a032-603afc8c4b26` |
| Munkakönyvtár | `E:\Programming\Own\CURSOR\LIVE-projects\my-assistant` |
| Claude Code session azonosító | `3fbced7d-9876-4fd6-8d92-f5b993859748` |

### ⭐ Hogyan találom meg magam bármikor, kézi konfig nélkül

```
CLAUDE_CODE_SESSION_ID  (környezeti változó)
        ↓ ezzel egyezik a
GET http://localhost:39050/api/cc-session   →   sessions[].claudeSessionId
        ↓ ugyanannak a rekordnak a
sessions[].sessionId   =   ccs-6f25a888-mtp9a8cx
```

⚠️ **Miért kell MÉGIS konfig-bejegyzés:** a `ccs-…` azonosító **session-indításonként
változhat**. A konfig azt rögzíti, **melyik session „a My Assistant asszisztens" szerep**;
a futásidejű keresés azt, hogy **most éppen melyik**. A kettő **együtt** kell.

🔴 **A legalattomosabb hibalehetőség:** ha a session újraindul, és a bot még a régi
azonosítóra küld, **az üzeneteid csendben a semmibe mennek.** Ezért a bot **minden
indulásnál** oldja fel újra az azonosítót, ne tárolja be véglegesen.

---

## 2. Discord Developer Portal — a SAJÁT alkalmazás létrehozása

> 🔴 **KORREKCIÓ (2026-09-06, újramérve):** korábban azt írtam, hogy a CCAP-ban már be van
> állítva egy Discord bot-token. **Ez TÉVES volt** — a `ccap config` valójában ezt mondja:
> *„Discord Bot Token: (nincs beállítva)"*. Félreolvastam a kimenetet.
> ⇒ **Nincs meglévő CCAP-bot, amit el lehetne rontani.** A korábbi „ne nyúlj hozzá"
> figyelmeztetés tárgytalan.

### 2.0 🔴 HÁNY KULCS KELL VALÓJÁBAN? — a leggyakoribb félreértés

Egy Discord-alkalmazásnak **három** hitelesítő adata van. Nekünk **egyetlen egy** kell:

| Adat | Mire való | Nekünk kell? |
|---|---|---|
| **Client ID** *(Application ID)* | az alkalmazás azonosítója; ez van a meghívó linkben | ⚪ **nem külön** — a link tartalmazza |
| **Client Secret** | **csak** ahhoz, ha felhasználók nevében kérnénk hozzáférést (OAuth2 kód-csere) | ⛔ **NEM KELL** |
| 🔑 **Bot Token** | **ez az egyetlen**, amivel a bot csatlakozik és üzenetet olvas/küld | ✅ **EZ KELL** |

> A hivatalos dokumentáció szerint a Client Secret *„not required for bots that only use the
> gateway"* — a bot-token önmagában elég a kapcsolathoz és az üzenet-műveletekhez.

⚠️ **Tehát NEM „két kulcs egy OAuth2 linkben".** A meghívó link **nem tartalmaz titkot** —
csak az alkalmazás-azonosítót, a hatókört és a jogosultságokat. A **token külön**, a Bot fülön
születik, és **csak egyszer látszik**.

**Összesen tehát:** 🔒 **1 titok** (bot-token) + **2 nem-titkos azonosító** (csatorna, a te
felhasználód) — ez utóbbi kettő nem a portálról, hanem magából a Discordból jön (§3).

### 2.1 A LÉPÉSEK — a JELENLEGI portál szerint

> ⚠️ **2026-09-06-i frissítés:** a Developer Portalon ma már **`Installation` fül** van, és
> a Discord **`Discord Provided Link`**-et ad. Ez **leváltotta** a régi
> „OAuth2 → URL Generator" utat, amit a legtöbb internetes útmutató (és a runbook korábbi
> változata) még mindig ír. Az `Installation` utat használd.

| # | Lépés | Hol |
|---|---|---|
| 1 | **New Application** → név: pl. `My Assistant` | `discord.com/developers/applications` |
| 2 | 🔑 **`Reset Token`** → a token **egyszeri** megjelenítése → **azonnal a `.env`-be** (§4) | **Bot** fül |
| 3 | 🔴 **`MESSAGE CONTENT INTENT` → BE** — enélkül nem látja az üzenetek szövegét | **Bot** fül |
| 4 | **`Public Bot` → KI** (csak te hívhatod meg) | **Bot** fül |
| 5 | ⚠️ **`Requires OAuth2 Code Grant` → KI** — ha be van, a meghívás elbukik | **Bot** fül |
| 6 | **Install Link: `Discord Provided Link`** | **Installation** fül |
| 7 | **Guild Install** hatókör: `bot` · jogosultságok: `View Channels` + `Send Messages` + `Read Message History` | **Installation** fül |
| 8 | A megadott linket megnyitod → **„Add to server"** → a dedikált szervered | böngésző |

*(A „User Install" kontextus nekünk **nem kell** — az csak parancsokat tesz elérhetővé a
felhasználónál, bot-jelenlétet nem ad a szerveren.)*

### 2.2 A hivatalos dokumentáció két lényeges pontja

**A meghívó link NEM tartalmazza a tokent.** Csak `client_id` + `scope` + `permissions`.
A dokumentáció szó szerint: a token *„server-side only and is never exposed in URLs"*.
*(Ez korrigálja a 2026-09-06-i feltevést, hogy a linkben benne lenne a token.)*

**Az üzenet-tartalom olvasása privilegizált jog.** Három ilyen van összesen
(`GUILD_PRESENCES` · `GUILD_MEMBERS` · **`MESSAGE_CONTENT`**).
**10 000 felhasználó alatt nem kell hozzá jóváhagyás** — nálad ez sosem lesz kérdés.
🔎 **Ha nincs bekapcsolva, a bot kapcsolata `4014` záró-kóddal bomlik le** — ez a biztos jel.

### 2.3 Ami korábban „trükkös" volt

Owner emlékezete: *„valamit publikusra kellett állítani… utána meg vissza kellett állítani."*

⇒ Ez a **`Public Bot`** kapcsoló. **De a legvalószínűbb valódi ok a `Requires OAuth2 Code
Grant`** volt: ha az **be** van kapcsolva, az egyszerű meghívó link nem működik, és az ember
elkezd más kapcsolókkal kísérletezni. **Nézd meg elsőként — legyen KI.** Akkor a
publikusra-állítgatás valószínűleg elhagyható.

---

## 3. Amit tőled kérek

| # | Mi | Titkos? | Hogyan add át |
|---|---|---|---|
| 1 | **Bot token** | 🔒 **IGEN** | ⭐ **te írd be a `.env`-be** (§4) — így sosem kerül a beszélgetés-átiratba |
| 2 | **Csatorna azonosító** | nem | chatben is mehet |
| 3 | **A te felhasználó-azonosítód** | nem | chatben is mehet |

*(Azonosító másolásához: Discord → Beállítások → **Speciális → Fejlesztői mód: BE**, majd
jobb klikk a csatornára / a nevedre → „Azonosító másolása".)*

---

## 4. A `.env` bejegyzések

🔒 A `.env` **gitignore-olva** (ellenőrizve 2026-09-06: `.gitignore:6`).
⛔ Token repóba, dokumentumba, jegyzetbe **soha**.

```dotenv
MA_DISCORD_BOT_TOKEN=<a saját botod tokenje>
MA_DISCORD_CHANNEL_ID=<a dedikált csatorna azonosítója>
MA_DISCORD_USER_ID=<a te Discord felhasználó-azonosítód>
```

---

## 5. A „gyűjts, amíg foglalt vagyok" — a MI kötegelőnk csinálja

Owner ötlete: *„amíg a sessionöd folyamatban van, addig csak gyűjtsük a Discord üzeneteket,
és egyszerre küldjük el, amikor felszabadul a csatornád."*

A CCAP `prompt` végpontja **magától ezt csinálja** (mérve a forráskódban, 2026-09-06):

| Helyzet | Viselkedés |
|---|---|
| a session **foglalt** | **sorba teszi**, `queued=true` |
| **van már sorban álló** elem | sorba teszi + megpróbálja kézbesíteni a következőt |
| szabad | azonnal átadja |

> ⛔ **KORREKCIÓ (owner, 2026-09-06):** *„szeretném, hogy ezt te magad, illetve a te oldaladon
> legyen menedzselve… mert minden egyes prompt egy hosszabb futást eredményez."*
>
> A CCAP sora **N külön promptot** ad → **N futás**. Ezért a kötegelés **a MI oldalunkon**
> történik (`cli/src/discord/`): N üzenetből **EGY** prompt lesz. A CCAP sora ezután már
> legfeljebb 1 elemet lát, és **biztonsági hálóként** marad alattunk.

⇒ Az alábbi CCAP-viselkedést tehát **ismerjük és használjuk** (a foglaltság-jelzőt a
kötegelő olvassa), de **nem erre hagyatkozunk** a gyűjtésben.
A sor és a foglaltság bármikor lekérdezhető:
`GET /api/cc-session/<ccs-…>/inspect` → `queue.items` · `queue.isLocked` ·
`flags.isBusyProcessing`.

---

## 6. Hibakeresési térkép

| Tünet | Legvalószínűbb ok |
|---|---|
| 🔴 **Írtam Discordon, és semmi nem történt** | **ELŐSZÖR ezt nézd:** fut-e a figyelő — `ma comm doctor` → *Discord-figyelő ÉL* sor (§6c). Ez a leggyakoribb ok. |
| A bot nem hívható meg a linkkel | `Requires OAuth2 Code Grant` **BE** (§2) |
| A bot bent van, de nem látja az üzenetek szövegét | `MESSAGE CONTENT INTENT` **KI** → `4014` záró-kód (§2.2) |
| A bot lát üzenetet, de nem jut el hozzám | rossz vagy elavult CC session-azonosító (§1) — **a legcsendesebb hiba** |
| Eljut hozzám, de nincs előtag | a saját kezelőnk nem tette rá (§0) |
| „Elküldtem, de nem reagált" | a session foglalt volt → **sorban áll**; `inspect` → `queue.items` (§5) |
| Semmi nem történik | a CCAP szerver nem fut → `ccap status` |

---

## 6b. Ki futtatja a figyelőt — **a SZERVER** (2026-09-06 óta)

> **Owner-döntés (2026-09-06):** *„a szervernek kéne futnia, a szervernek kéne ezt figyelnie, és
> amúgy azért kéne LDP-vel futtassuk, hogy folyamatosan fusson."*

Normál üzemben **nem indítasz semmit külön** — elég, hogy a `my-assistant` szerver fut:

```bash
dc ldp                                  # a szokásos fejlesztői mód: folyamatosan újraindítja a szervert
npm --prefix server run start-prod      # vagy önmagában csak a szerver
```

A szerver a `DiscordListener_Service`-en át **gyermek-folyamatként** indítja a figyelőt
(`server/src/_services/discord-listener.service.ts`), és:

| Mit tesz | Miért |
|---|---|
| összeomlás után **újraindít** (5 mp → ×2 → max 5 perc) | egy csendben elhalt figyelő ugyanúgy néz ki, mint ha nem írtál volna |
| a gyermek **utolsó 12 kimeneti sorát** a hiba-bejegyzésbe teszi | a naplóból derüljön ki, MI hiányzik — ne csak az, hogy „meghalt" |
| friss **idegen életjel** esetén nem indít másodikat | két párhuzamos gateway-kapcsolat fölösleges |

⛔ **A figyelő logikája NEM másolódott a szerverbe.** A kanonikus megvalósítás a CLI-ben van,
egységtesztekkel; a szerver csak **futtatja és felügyeli**.

### Kézi indítás (diagnosztikához)

```bash
ma comm doctor     # elobb: minden zold-e (a 3 Discord-sor OK legyen)
ma comm listen     # a figyelo indul; Ctrl+C allitja le
```

A figyelő **hosszan fut**. Amíg fut, az üzeneteid a **kötegbe** kerülnek, és onnan egyetlen
összevont prompttal jutnak be a CC sessionbe a CCAP-on át.

### ⭐ A kiküldés AUTOMATIKUS — és ez egy javított, kritikus hiány

🔴 **Mért hiba (2026-09-06):** a figyelő eddig **csak gyűjtött**. A köteg átadásához valakinek
**kézzel** kellett `ma comm flush`-t futtatnia. Vagyis **futó figyelő mellett is** a köteg-fájlban
álltak volna az üzenetek — miközben kívülről ez pontosan úgy néz ki, mintha meg sem érkeztek volna.
A csatorna nem lehet „mindig élő", ha az utolsó lépéshez ember kell.

⇒ A figyelő mostantól **15 másodpercenként** magától megnézi, kiküldhető-e a köteg. A `ma comm flush`
megmaradt **kézi/diagnosztikai** útnak.

### ⌨️ „Gépel…" visszajelzés

> **Owner-kérés (2026-09-06):** *„vagy dolgozol, vagy valami visszajelzést… egy typing üzét
> küldhetnél a Discordon időnként. Ugye az egy idővel le is jár, ilyenkor frissíteni kell."*

A bot **gépel…** jelzést mutat, ha **van várakozó üzenet** vagy **válasz-tartozás**:

| Beállítás | Érték | Miért |
|---|---|---|
| frissítés | **7 mp** | a Discord jelzése ~10 mp után magától lejár |
| biztonsági szelep | **15 perc** | az örökké gépelő bot félrevezetőbb, mint a néma |

Megvalósítás: `cli/src/discord/discord.typing-indicator.ts` (a döntés tiszta függvény, ezért
élő kapcsolat nélkül is tesztelt).

---

## 6c. 🔴 Honnan tudod, hogy a figyelő ÉL?

A figyelő **60 másodpercenként** (és minden feldolgozott üzenetnél) frissít egy **életjelet**.
A diagnosztika ennek a **frissességét** nézi — nem azt, hogy be van-e állítva:

| `ma comm doctor` sora | Mit jelent |
|---|---|
| ✅ **Discord-figyelő ÉL** — „Fut (*bot neve*), N üzenet feldolgozva" | rendben |
| 🔴 **Discord-figyelő ÉL** — „az utolsó életjel N perce, a figyelő NEM fut" | ⚠️ **a Discordon írt üzeneteid NEM jutnak el** |
| ⚪ **Discord-figyelő ÉL** — „nincs életjel" | még sosem futott ezen a gépen |

⭐ **Miért kellett ez:** a jelenlét-figyelő **112 napig volt halott** anélkül, hogy bárki
észrevette volna — mert semmi nem ellenőrizte, hogy fut-e. Egy csendben elhalt Discord-figyelő
**pontosan úgy néz ki, mintha nem írtál volna**. Ezért az életjel nem extra, hanem alapfelszerelés.

*(Az életjel írása sosem dob hibát: ha nem írható, a diagnosztika inkább „halott"-nak látja —
az óvatos irányba téved. A hamis „él" lenne a veszélyes.)*

---

## 7. Élő próba — enélkül nincs „kész"

1. **Te → én:** írsz a csatornába → nálam megjelenik `INCOMING_USER_MSG_ON_DISCORD:` előtaggal
2. **Én → te:** válaszolok → megjelenik a csatornában
3. **Foglaltság:** amíg dolgozom, írsz kettőt → **mindkettő megérkezik**, sorrendben, amikor felszabadulok

🔴 Amíg ez a három nem ment át élőben, a csatorna **nincs kész** (`core-no-guessing`).

---

## Kapcsolódó

- `__agent/plans/discord-two-way-hyperplan/hyperplan.plan.md` — a teljes terv
- `__agent/flows/recurring/hourly-assistant-tick/README.md` — a workflow-szabályok
- `__documentations/developments/2026-09-06-communication-channel-analysis-and-cast-live-test.md`
- `__agent/references/ccap/REFERENCE.md`

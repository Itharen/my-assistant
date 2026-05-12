# FR: Google Home integráció

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag — később
> `fo feature-requests.create`-tel feltölthető.
>
> **Kapcsolódó organizer task:** `org:task:69fca4a9d440d3f484cedf05` —
> *"Research: Google Home integráció"* (P=50). Ez a fájl a research output-ja.

---

## 2026-05-07 — initial deklaráció

> Hogyan lehet Google Home-hoz csatlakozni, IO-t kialakítani vele (notifikáció /
> wakeup / hang-output a my-assistant-hez).

*(Forrás: user input 2026-05-07; a fenti idézet a task description-be került
felvételkor. Az eredeti chat-üzenet nem őrződött szó szerint külön — ha
újrafogalmazás szükséges, nyitott marad.)*

### Kontextus (miért merült fel)

- **Bedtime push** (`current/principles/sleep-system.md`): a 18h fix
  ébrenléti ablak után **nem chat-alapú**, hanem **proaktív hang-emlékeztetőt**
  szeretnénk → "ideje lefeküdni" 17h-nál first warn, 18h-nál bedtime, 19h+
  overshoot warn.
- **Recurring task heads-up** (`current/principles/recurring-tasks.md`): séta /
  fürdés / takarítás / kaja-rendelés szabályok halogatás-szorzós eszkalációval —
  a "ma esedékes" jelzéseket szóban is jó lenne hallani.
- **Voice input** (opcionális, alacsonyabb prio): "Hey Google, mondd meg a
  my-assistant-nek hogy ..." — gyors lokál input STT helyett a hangszóróba.

---

## 2026-05-07 (17:55) — user clarification + scope-szűkítés

> Most első körben azt hiszem fókuszálunk kéne az emlékeztetőkre, illetve a
> triggerekre, amivel a Google Home eszközökre küldhetünk triggereket. Lehet,
> hogy ez egyszerű emlékeztetők beállításával, naptáreseményekkel is elérhető
> lehet. Van itthon egy egész klaszternyi Google Home és Google Nest hangszóró
> szerte mindenhol a lakásban. Folyamatosan fut a Google Home Assistant. A Voice
> input az elsősorban kevésbé prió, mint az, hogy a Google Home-on keresztül
> tudjon nekem üzeneteket küldeni a rendszerem, illetve itt az aszisztant.

### Mit változtat

1. **Hardware confirmed ✅** — több Google Home + Nest szerte a lakásban; Google
   Assistant 24/7 fut. Discovery / cluster planning már nem nyitott kérdés.
2. **Scope V1 = output only** — TTS / notification PUSH a hangszóróra. Voice
   input visszacsúszik a roadmap végére (vagy törölve a V1-ből).
3. **Új path-prio**: a user explicit felvetette hogy "egyszerű emlékeztetők /
   naptáresemények" is elég lehet. Ez egy **teljesen más architektúra** mint az
   eredeti research (HA + Cast push) — itt a **Google ökoszisztémán BELÜL**
   maradunk: Calendar API / Reminders / Tasks / Routines, és a Google saját
   rendszere szól a hangszóróra. Ez egy **fókuszált follow-up research** tárgya
   (lásd lentebb a 2026-05-07 18:00 szakaszt).
4. **Open kérdések közül elesett**: 1 (hardware) ✅. Még válaszra vár: HA igény,
   költség-tolerancia, multi-room broadcast-stratégia, my-assistant vs HA mint
   "scheduler authority".

---

## 2026-05-07 (18:05) — follow-up research: Google natív path-ok (zero-3rd-party)

> **Kérdés:** ha kizárólag a Google ökoszisztémán belül maradunk (Calendar /
> Reminders / Tasks / Routines), van-e mód arra, hogy a my-assistant a hangszórón
> proaktívan **megszólaltasson** egy üzenetet — Home Assistant, Cast lib, IFTTT
> nélkül?
>
> **Válasz: NEM.** ❌
>
> 2026 májusában **egyetlen olyan natív Google mechanizmus sincs**, amit egy
> server-side script programatikusan triggerelni tud, és ami **hangosan
> felolvas** valamit a Nest hangszórón. Google szándékosan nem nyitotta meg ezt
> a felületet.

### Útvonal-tábla

| Path | Hangosan szól? | Programatikusan triggerelhető? | Verdict |
|---|---|---|---|
| **Calendar event** (saját + Google Calendar API) | ❌ Csak LED flash ~10 percig, nincs spoken announcement | ✅ API van | ❌ |
| **Google Reminders** (klasszikus "Hey Google, remind me at 6pm…") | ✅ Igen, pulse + spoken | ❌ Nincs publikus REST API, csak voice/UI | ⚠️ csak manuálisan |
| **Google Tasks** (Tasks API) | ❌ Csendben marad due time-nál; csak "what are my tasks"-ra olvas | ✅ API stabil | ❌ |
| **Routines / Automations Script Editor** (`time.schedule` + `assistant.command.Broadcast`) | ✅ Igen, statikus üzenettel | ❌ Csak Home APIs SDK (Android-only Kotlin), **nincs server SDK** | ⚠️ csak manuál setup |
| **Family Bell** | n/a | n/a | ☠️ **Deprecated 2024-2025** |
| **Google Keep reminders** | ❌ Migrálva Tasks-ba 2026-01 | n/a | ❌ |
| **Broadcast** ("Hey Google, broadcast 'X'") | ✅ | ❌ Nincs hivatalos server API; csak unofficial Assistant SDK simulate-tel | ❌ natív szempontból |
| **Gemini for Home** (post-2026-03) | Ugyanaz mint Routines | Ugyanaz | ⚠️ jobb NLP, **azonos architectural ceiling** — magyar Nest-en még nem teljes |

### Részletek a két "majdnem-jó" útról

**Voice-created Reminders** (⚠️):
- Még működik 2026-ban: "Hey Google, emlékeztess este 10-kor lefeküdni" → 22:00-kor a hangszóró pulzál + felolvassa
- Tárolás háttérben átmigrálva Google Tasks-ba (2026-01), location reminders eltávolítva
- **Nincs publikus API** ami létrehoz egy "speaker-spoken reminder"-t — csak hangparanccsal vagy a Google Home UI-ban
- → my-assistant-ből nem szólítható meg programatikusan, **csak ha a user maga mondja be**

**Routines `time.schedule` + `BroadcastCommand`** (⚠️):
- Manuálisan a Google Home appban létrehozható: "minden nap 22:00 → broadcast 'ideje lefeküdni'"
- Statikus szöveg per routine — nincs változó, nem tud calendar event-et felolvasni
- `time.schedule` recurring (hét napjai) — **one-time dátum-trigger nincs dokumentálva**
- A Home APIs SDK (Android-only) tudna routine-t létrehozni, de **server-ről nem hívható**
- → fix idejű, ismétlődő, statikus üzenetekre OK; dinamikus / one-shot / variable text-re ❌

### Mit jelent ez a use case-ekre

| Use case | Natív Google-only működik? | Miért |
|---|---|---|
| **Bedtime push (sliding 26h ciklus, sleep-system.md)** | ❌ | Az ébredés-idő naponta változik → a bedtime is. Statikus recurring routine nem tudja kiszolgálni. |
| **Recurring task heads-up** ("ma esedékes a séta", "fürdés overdue") | ❌ | Dinamikus content, halogatás-szorzós eszkalációval. Statikus routine nem érti a state-et. |
| **Általános "új emlékeztetőd van" pingelés** | ⚠️ | Egyetlen statikus routine + virtual switch trigger-rel **lehetne**, de a user nem tudja mire emlékeztet — vissza kell néznie chat-en. Marginal value. |
| **Fix idejű recurring** (pl. "vasárnap 18:00 takarítás emlékeztető") | ✅ | Statikus routine OK, manuálisan a Home appban beállítva. De ez **a my-assistant-től függetlenül** él — ha a szabály változik, kézzel kell frissíteni. |

### Egyetlen "natív hack" út, ha mindenképp 3rd-party-mentes kell

**Smart Home Cloud-to-cloud "fake device" + pre-built routines**:
1. Egy OAuth app + fulfillment endpoint (a my-assistant exposolja magát "smart device"-ként a Google-nek)
2. Manuálisan létrehozott routine-ok: starter = "amikor a virtuális kapcsoló bekapcsol" → action = `BroadcastCommand` statikus szöveggel
3. Server flippeli a virtual switch state-et → routine triggerel → hangszóró szól
4. **Korlát**: minden egyedi szöveghez **külön routine + külön virtual device** kell. Ha 10 különböző üzenet kell → 10 routine + 10 virtual switch előre létrehozva manuálisan.

**Verdict erre is**: **több munka mint HA**, kevesebb flexibilitás, és a Cloud-to-cloud
fulfillment endpoint OAuth/HTTPS infrastruktúrát igényel ami már nem kevésbé
"3rd-party" mint egy HA Docker container. **Nem ajánlott.**

---

## 2026-05-07 (18:25) — user push-back: NO PAID + build-it-ourselves

> Egyáltalán ne nézzünk semmilyen fizetős megoldást. Ha létezik fizetős
> megoldás, akkor meg kell tudjuk csinálni magunknak is. Mindent le kell
> tudjunk fejleszteni, ami szükséges. Semmiképpen nem nézünk fizetős
> megoldásokat.
>
> Nagyon rosszul néz ki, nincs olyan táblázatod, amiben azt mondanád, hogy
> valami végtődik [működik]. Mindenhol csak azt látom, hogy semmi sem végtődik
> sehogy se. Nincsen egyetlen egy clear módja annak, hogy bármilyen módon
> készítsünk egy üzenetet, amit valahogy ráveszünk a Google Home eszközöket,
> hogy kimondja azt az üzenetet. Akár úgy, hogy 5 perccel előtte beállítjuk,
> vagy pár perccel előtte beállítjuk, vagy én nem tudom, de nem hiszem el,
> hogy nincsen működő megoldás. és nem egy előre nagyon krediktálható dologra
> lenne szükség, hanem egy olyanra, ami 5 percen belül küld nekem valamilyen
> felkiáltás vagy hé haver, valami van. Mindig custom üzenetekkel.

### Mit változtat (assistant-jegyzet, NEM a user szavai)

1. **Nabu Casa, Azure neural, ElevenLabs — mind kihúzva.** Új univerzális elv
   rögzítve: `current/principles/no-paid-solutions.md` + `build-it-ourselves.md`.
   CLAUDE.md frissítve.
2. **Az előző szintézis tévesen sugalta, hogy semmi sem működik ingyen.**
   Korrekció: **több ingyenes, működő út van**. Az igazság: a *natív Google*
   path nem ad spoken output-ot, **de a Cast protocol-on keresztül egyszerűen
   lehet** — saját scripttel, FOSS könyvtárakkal.
3. **A use case is élesedett**: "5 perccel előtte / pár perccel előtte / akár
   azonnal — custom üzenettel". Ez a **Cast push** pattern dolgos kenyere.
   Latency ~1-2 másodperc trigger-től hangszóróra.

---

## 2026-05-07 (18:30) — TISZTA TÁBLÁZAT: mi MŰKÖDIK ingyen, self-built módon

| Komponens | Lib / megoldás | Költség | License | Working 2026-ban? |
|---|---|---|---|---|
| **Cast push** (Node) | `castv2-client` (thibauts) | Free | MIT/BSD | ✅ Igen, building block stable |
| **Cast push** (Python) | `pychromecast` (home-assistant-libs) | Free | MIT | ✅ Igen, aktívan karbantartott (v14.x 2026-03) |
| **Mini HTTP server** MP3 szolgáltatáshoz | Express / FastAPI / Python `http.server` | Free | (built-in / MIT) | ✅ |
| **TTS — magyar, ingyen, online** | Google Translate TTS REST | Free | (no auth, public) | ✅ Robotikus, érthető |
| **TTS — magyar, ingyen, lokál** | Coqui XTTS v2 (HU támogatott) | Free | MPL-2.0 | ✅ Voice cloning, jó minőség |
| **TTS — magyar, ingyen, lokál, könnyebb** | gTTS (Python lib Translate REST körül) | Free | MIT | ✅ |
| **mDNS / cluster discovery** | castv2-client beépített / pychromecast Zeroconf | Free | (built-in) | ✅ |

**Verdict**: 🟢 **Igen, van konkrét működő ingyen megoldás.** Több is. Self-built, ~150-300 LoC, my-assistant repo `scripts/` alá.

### Az egész flow vázlata (Node példa)

```
my-assistant scripts/notify-cast.ts
   1. POST {text, target?} érkezik (vagy CLI argumentum)
   2. Generál MP3-at:
      - opció A: gTTS-szerű hívás Translate REST-re → MP3 buffer
      - opció B: lokál Coqui XTTS v2 → MP3 fájl
   3. Express mini server (0.0.0.0:randomPort) szolgálja az MP3-t
      időkorlátos URL-en (auto-cleanup ~30s után)
   4. castv2-client → discover Nest hangszóró(k) target alapján
   5. DefaultMediaReceiver.load(MP3 URL)
   6. Várja a "FINISHED" eventet, leállítja az Express server-t
```

**Latency**: típikusan **1-3 másodperc** trigger-től hangszóróra (TTS gen idő + mDNS resolve + Cast handshake + buffer).

**Working set ami már megvan a my-assistant-ben**: semmi még, de a `scripts/` mappa készen áll a CLAUDE.md alapján.

### Magyar TTS minőség — ingyen opciók ranking

| Opció | Minőség | Setup | Mikor jó |
|---|---|---|---|
| **gTTS / Translate TTS REST** | 🟡 Robotikus de érthető | Trivial (egy HTTP hívás) | **V1 default** — gyors, no infra |
| **Coqui XTTS v2 lokál** | 🟢 Jó, voice cloning lehet | ~Python venv + ~2GB model letöltés, GPU preferred | **V2 upgrade** ha a robotikusból elég |
| **Piper lokál** | 🟡 Tiszta, nincs official HU model | Saját HU model training (vagy community fork keresése) | Ha gTTS megy de Coqui túl heavy |

### Risks & maintenance ownership

A self-built path-ot a user vállalja (build-it-ourselves):
- **Cast protocol cert/firmware drama** (lásd 2025 márciusi ICA cert outage):
  ha újra történik, mi frissítjük a CA whitelist-et a saját scriptünkben.
  A `castv2-client` és `pychromecast` aktív repo-k, általában gyorsan kapnak fix-et.
- **mDNS** csak ugyanazon a L2 segmensen működik. Ha a Windows gép és a
  hangszórók más VLAN-on vannak, egy Avahi reflector kell — egyszeri config.
- **Multi-room**: castv2-client-tel target paraméter alapján más hangszórót
  választunk. Multi-cast (egyszerre több helyre) szervezhető Cast Group-on
  keresztül, amit a Google Home appban lehet csoportosítani (ingyen).

---

## 2026-05-07 (18:35) — végső szintézis és ajánlás (REVISED)

### Igazság

- **A Google natív path-ok** (Calendar event spoken / Reminders API / Tasks API spoken / Routines server-API) **mind nem működnek** programatikusan dinamikus content-tel. Ez tény, nem változott.
- **DE a Cast protocol** (ami szintén Google, csak más rétegen) **igenis működik** — azon megy minden YouTube cast, Spotify cast, sőt a Google Home app saját TTS-e is. A `castv2-client` (Node) és `pychromecast` (Python) FOSS lib-ek ezt a protokollt implementálják.
- → **Saját scripttel, ingyen, my-assistant repo-n belül megoldható** a "5 perc múlva mondj nekem custom üzenetet a hangszórón" use case.

### 🎯 Konkrét ajánlás — saját scripttel, ingyen, my-assistant-ben

**Phase 1 — V1 PoC (1 nap, 0 Ft)**: `scripts/notify-cast.ts` (Node) vagy `scripts/notify_cast.py` (Python)

**Stack**:
- **Cast lib**: `castv2-client` (Node) **vagy** `pychromecast` (Python) — válassz a my-assistant kódbázis preferencia szerint
- **TTS**: Google Translate TTS REST hívás (free, no auth) — gTTS-szerű 1 függvény
- **Mini HTTP server**: Express / Python http.server az MP3 időkorlátos URL-en
- **Discovery**: castv2 / pychromecast beépített mDNS

**API forma** (egyezzen az `fo` CLI JSON envelope mintával — CLAUDE.md előírja):

```bash
# CLI használat
node scripts/notify-cast.js --text "Ideje lefeküdni" --target "Hálószoba" --pretty

# vagy programatikus hívás my-assistant-en belül
import { notifyCast } from './scripts/notify-cast';
await notifyCast({ text: "Ideje lefeküdni", target: "Hálószoba" });
```

**Output envelope**:
```json
{
  "ok": true,
  "action": "notify-cast",
  "requestId": "...",
  "elapsedMs": 1842,
  "result": { "playedOn": "Hálószoba.local", "duration": 2.3 }
}
```

**Phase 2 — magyar TTS upgrade (opcionális, ~fél nap, 0 Ft)**: gTTS → Coqui XTTS v2 lokál ha a robotikus magyar hang zavaró. Ugyanaz a script, csak a TTS gen-réteg cserélődik.

**Phase 3 — Calendar / scheduler integráció (több nap, 0 Ft)**: my-assistant scheduler ami a sleep-system / recurring-tasks szabályait olvassa, és ütemezi a `notify-cast` hívásokat (lokál cron / setTimeout / `node-schedule`). **Az authority a my-assistant marad**, a hangszóró csak a "hangosító".

### Voice INPUT (későbbre)

A user explicit jelezte: alacsonyabb prio. Ha mégis kell, **szintén ingyen, self-built**:
- HA Voice PE *hardware*-ből (~$60) — DE ez paid hardware, nem paid service. Ha kerülnénk: DIY satellite USB mikrofonnal egy Pi-n (~$30 hardware ha még nincs Pi).
- Whisper.cpp lokál (Free, MIT) magyar small/medium model
- Piper TTS magyar (community model vagy saját training)
- Ez nincs scope-ban most.

### Open kérdések — refresh a "no-paid + build-it-ourselves" után

1. **Node vagy Python a `notify-cast` script-nek?** A my-assistant repo-ban mi van inkább? (Node fitting az `fo` CLI mintához.)
2. **Multi-room policy?** Cast Group használata a Google Home appban (ingyen) → `target: "Mindenhol"` kulcsszó működjön?
3. **Implementáció prio**: organizer-task `org:task:69fca4a9d440d3f484cedf05` most P=50. Felemeljük V1-hez?
4. **Telepítendő dependencyk** OK-e Windows-on? Node esetén `npm install castv2-client` → semmilyen system dep nem kell. Python esetén `pip install pychromecast gtts`. Mindkettő ártalmatlan.
5. **Magyar TTS minőség elfogadható-e gTTS-szel V1-re?** (Robotikus, de érthető.) Ha igen → Phase 1 ship, Phase 2 opcionális. Ha nem → induljunk rögtön Coqui XTTS v2-vel (nehezebb setup, jobb hang).

---

## 2026-05-07 — research összefoglaló (assistant-jegyzet, NEM a user szavai)

> ⚠️ **A landscape jelenleg instabil.** A Google Assistant-et **2026 márciusától
> kivezetik**, a Gemini for Home váltja. A 3rd-party integráció lehetőségei
> ezzel részben megrendültek; a research a **május 2026-os állapotot** tükrözi
> és minden ajánlás ennek figyelembe vételével lett súlyozva.

### TL;DR

| Use case | Lehetséges 2026-ban? | Ajánlott megoldás |
|---|---|---|
| **TTS push (hang-output)** a hangszóróba | ✅ igen, de unofficial path-on | Home Assistant + Nabu Casa Cloud TTS (Azure `hu-HU-TamasNeural`) + webhook |
| **Voice input (Hey Google → my-assistant)** magyarul | ❌ nem praktikus | Nest hangszóró nem érti a magyart 2026-ban sem; cserébe HA Voice PE + Whisper-small + magyar Piper/intents |
| **Custom voice command angolul** | ⚠️ korlátozottan | HA script `notify.google_assistant_sdk`-n keresztül (templated phrasing, no slot capture) |
| **Routine trigger webhook-ról** | ❌ hivatalosan nincs | Csak unofficial bridge-eken (IFTTT degradált; Cloud-to-cloud "fake device" → routine listener) |

### Hivatalos Google API landscape — mind dead-end vagy korlátozott

| API / SDK | Status 2026-ban | Praktikus a my-assistant-nek? |
|---|---|---|
| **Conversational Actions** ("Hey Google, talk to MyApp") | ☠️ Sunset 2023-06-13 | Nem |
| **Google Assistant SDK** (embedded, Pi) | ☠️ Effectively dead, Assistant 2026-03 kivezetve | Nem |
| **Smart Home Cloud-to-cloud** | ✅ Live | Korlátozottan: csak templated trait-ek ("turn on X"), nincs free-form |
| **Google Home APIs** (2024-ben bejelentve) | ⚠️ Mobile-only SDK (Android beta, iOS GA közeli) | **Nincs server SDK** → 3rd party server nem hívhatja |
| **`BroadcastCommand`** (új Automations DSL) | ✅ Live | Csak egy automation-en BELÜL, nem direkt HTTP-vel |
| **Google Cast SDK** | ✅ Live | Nincs hivatalos TTS API; community pattern (TTS-MP3 cast) **unofficial** |
| **Google Home Routines via webhook** | ❌ Nincs hivatalos endpoint | Workaround: IFTTT (degradált) vagy fake Smart Home device state-trigger |
| **Matter / Thread** | n/a | Nincs "speak text" cluster, irreleváns |

**Verdict**: hivatalosan **se** notification push, **se** voice command nem támogatott
egy server-side asszisztensnek. Minden működő opció community / unofficial path.

### Cast protocol — 2025 márciusi cert-regression

A Google ICA 3 intermediate certificate **2025 márciusban lejárt**, és minden
3rd-party Cast lib (köztük a `google-home-notifier` is) hibásan auth-olt
amíg a CA whitelist-et nem frissítették. A `google-home-notifier` (noelportugal)
**dead repo** (utolsó publish ~6 éve), a fix nincs benne — a **karbantartott
forkokat / castv2-client ≥ 4.x / pychromecast ≥ 14.x** kell használni.
Ez egy ismétlődő risk: a Cast-ökoszisztéma firmware-érzékeny.

### TTS push megoldások (output)

| Approach | Hogyan | Magyar voice | Karbantartott | Verdict |
|---|---|---|---|---|
| **`google-home-notifier` (npm)** | mDNS + castv2 + Translate TTS | ✅ (Translate hu) | ☠️ Dead | Csak gyors PoC-hoz |
| **`castv2-client` direkt** | Saját MP3 → Cast `DefaultMediaReceiver` | (TTS engine választás) | ✅ Building block stable | Recommended ha self-host |
| **`pychromecast` + gTTS / Cloud TTS** | Python equivalent | (TTS engine választás) | ✅ Aktív (v14.x 2026-03) | Recommended Python stack-hez |
| **Home Assistant `tts.cloud_say` + Cast media_player** | HA owns speaker + TTS provider | ✅ Azure Tamás (HD) | ✅ Aktív | **🏆 Primary recommendation** |
| **HA webhook trigger** + fenti | Server POST → HA → TTS → speaker | (HA TTS-en keresztül) | ✅ Native pattern | **🏆 Combine with above** |
| **IFTTT webhook → Google Assistant** | Webhook receive → Assistant action | n/a | ☠️ Severely degraded 2022 óta | Dead-end |
| **Pushover/ntfy + Android tablet OS-TTS** | Notification → tablet TTS | ✅ (Android system TTS) | ✅ | Solid fallback (no Cast risk) |

### Magyar TTS hangminőség — súlyozás

| Engine | Magyar voice quality | Költség | Verdict HU-ra |
|---|---|---|---|
| **Google Translate TTS** | 🟡 Robotikus, érthető | Free | OK rövid emlékeztetőkre |
| **Google Cloud TTS** | 🟡 Csak Standard tier (nincs WaveNet/Neural2/Studio HU) | Olcsó | Skip — nem jobb mint Translate |
| **Azure Neural TTS** | 🟢 `hu-HU-TamasNeural` (megbízható), `hu-HU-NoemiNeural` (néha mispronounce) | $$ Neural HD ~$22/M chars | **🏆 Cloud sweet spot** |
| **ElevenLabs** | 🟢 Multilingual v2 / v3, jó-kiváló | $$$ | Overkill, néha angol akcentus szivárog |
| **Coqui XTTS v2 (lokál)** | 🟡 Tisztességes, voice cloning lehet | Free, GPU pref | Self-host fallback |
| **Piper (lokál)** | ⚠️ HU model **nem hivatalos** rhasspy listán | Free | Saját training kell |

### Voice INPUT — magyarul Google Home-ról: ❌ nem praktikus

**Megerősített**: a Nest speaker-ek **2026 májusában sem értik a magyart** native
voice command-ra. Csak Live Translate / Interpreter feature-ben van magyar.
A Gemini for Home 2026 áprilisi nyelvi expansion-jében (16 új nyelv: FR/DE/JP
stb.) **a magyar nincs benne**.

→ Ha voice input kell magyarul, **NEM a Google Home a path**, hanem:
- **Home Assistant Voice PE** hardware (~$60/db) + Whisper-small HU + Piper HU + HA Assist
- HA `intent_script` / sentence triggers `{slot}` capture-rel ("mit eszek {meal}-ra")
- N100 mini-PC ($300 used) szükséges Whisper-small futtatáshoz HU-ra

### Voice INPUT angolul Google Home-ról: ⚠️ korlátozott

Lehetséges, de:
- Csak **templated phrasing** (Smart Home traits) vagy **fix phrase = fix script** (HA script-as-scene + Google Routine)
- Nincs slot capture (nem lehet "what's for {meal}" típusú változó)
- Egy fix phrase = egy script — több intent = több script

---

## Architektúra-javaslatok (kiválasztandó)

### 🥇 Option A — Home Assistant + Nabu Casa + webhook (RECOMMENDED PRIMARY)

```
my-assistant (Windows)
   │
   │ POST /api/webhook/<id>  { "text": "Ideje lefeküdni 🌙", "target": "bedroom" }
   ▼
Home Assistant (Docker on Windows or Pi)
   │ tts.cloud_say (Nabu Casa → Azure hu-HU-TamasNeural)
   │ media_player.play_media → cast hangszóró(k)
   ▼
Google Nest hangszóró
```

**Pros**:
- Legjobb magyar hang (Azure Tamás)
- Cast cert/firmware drama-tól izolálva (HA frissíti)
- Bonus: media_player entity, queueing, volume control, HA dashboard
- Pattern illeszkedik a meglévő `current/` filozófiához (server POST → HA owns the rest)

**Cons**:
- Extra service futtatandó (HA Docker / Pi)
- Nabu Casa előfizetés ~$6.5/hó (vagy BYO Azure Speech key ~free at low volume)

**Setup-becslés**: 1 nap (HA install + Nabu Casa + 1 cast device discovery + 1 webhook automation + my-assistant webhook hívás script)

### 🥈 Option B — Lean: Node script `castv2-client` + Azure REST (no HA)

```
my-assistant scripts/notify-cast.ts
   │ Azure TTS REST (hu-HU-TamasNeural) → temp MP3
   │ Mini Express server (0.0.0.0:port) szolgálja az MP3-t
   │ castv2-client → DefaultMediaReceiver.load(URL)
   ▼
Google Nest hangszóró
```

**Pros**: nincs extra long-running service, ~150 LoC, full control
**Cons**: saját CA/cert churn (Cast protocol regressionöket követni kell), saját queueing
**Setup-becslés**: 0.5-1 nap

### 🥉 Option C — Fully local: PyChromecast + Coqui XTTS v2

```
my-assistant scripts/notify-local.py
   │ Coqui XTTS v2 (HU model) → MP3 lokálisan
   │ pychromecast / googlecontroller → Cast
   ▼
Google Nest hangszóró
```

**Pros**: zéró cloud dep, zéró recurring költség, voice cloning lehet
**Cons**: Coqui setup overhead, hangminőség < Azure neural, GPU preferred
**Setup-becslés**: 1-2 nap

### Hybrid (long-term cél)

- **Output**: Option A (HA + Nabu Casa) — Nest hangszórók megmaradnak emlékeztetőre
- **Input** (ha kell): HA Voice PE + Whisper HU + my-assistant webhook intent_script-ből
- Ez **kivezet a Google Assistant függésből** mire a Gemini for Home transition stabilizálódik

---

## Open kérdések (user-döntésre vár)

1. **Van-e már Google Home / Nest hangszóró otthon?** Modell + db szám
   szükséges a discovery / VLAN / mDNS planninghez.
2. **Van-e már Home Assistant futás?** Ha nincs, telepítés + Nabu Casa elfogadható-e?
3. **Voice INPUT mennyire fontos?** Ha nem priority, akkor Option A elég — a HA Voice PE-vel megvárható későbbre.
4. **Költség**: Nabu Casa ~$6.5/hó OK? Vagy menjünk BYO Azure Speech key-vel (free tier 500K char/hó)?
5. **Bedtime push**: a sleep-system.md fix 18h logikája hol fusson — my-assistant lokál cron, vagy HA timer? (Javaslat: my-assistant marad az authority, HA csak a "hangosító".)
6. **Multi-room**: csak egy hangszóró kell-e szólni, vagy minden szobába broadcast (pl. "ideje lefeküdni" → hálószoba+nappali)?

---

## Kapcsolódó

- `current/principles/sleep-system.md` — bedtime emlékeztető fix 18h logika (a hang-output ezt szolgálná ki)
- `current/principles/recurring-tasks.md` — ismétlődő feladat heads-up (séta, fürdés, kaja-rendelés)
- `current/feature-requests/calendar-integration.md` — Teams/Google Calendar read (analog: external integration)
- `current/feature-requests/tesco-integration.md` — Tesco automatizáció (analog: external integration)

---

## Migráció organizer-be (later)

Amikor az organizer feature-requests modul használatra kész, ez a fájl
`fo feature-requests.create`-tel feltölthető. Mező-mapping:

| Lokál | Organizer |
|---|---|
| Cím | `title: "Google Home integráció"` |
| Initial deklaráció + research summary | `description` (markdown) |
| Open kérdések | `acceptanceCriteria[]` (kérdésenként egy AC) |
| Kapcsolódó | `relatedRefs[]` (sleep-system, recurring-tasks principle ref-ek ha lesznek) |
| Architektúra-opciók | `notes` vagy külön `task-group` ha implementációs sub-task-ok kellenek |

---

## Sources (research 2026-05-07)

### Hivatalos Google
- [Conversational Actions sunset overview](https://developers.google.com/assistant/ca-sunset)
- [Google Assistant SDK release notes](https://developers.google.com/assistant/sdk/release-notes)
- [Google Home APIs overview](https://developers.home.google.com/apis)
- [Cloud-to-cloud Notifications](https://developers.home.google.com/cloud-to-cloud/integration/notifications)
- [BroadcastCommand reference](https://developers.home.google.com/automations/schema/reference/entity/assistant/broadcast_command)
- [Google Cast SDK release notes](https://developers.google.com/cast/docs/release-notes)
- [Bringing Gemini intelligence to Google Home APIs](https://developers.googleblog.com/bringing-gemini-intelligence-to-google-home-apis/)
- [9to5Google — Gemini replaces Assistant in 2026](https://9to5google.com/2025/12/19/google-assistant-gemini-2026/)

### TTS / Cast community
- [google-home-notifier on GitHub](https://github.com/noelportugal/google-home-notifier)
- [thibauts/node-castv2-client](https://github.com/thibauts/node-castv2-client)
- [home-assistant-libs/pychromecast](https://github.com/home-assistant-libs/pychromecast)
- [Home Assistant TTS integration](https://www.home-assistant.io/integrations/tts/)
- [Home Assistant Google Cast integration](https://www.home-assistant.io/integrations/cast/)
- [Nabu Casa Cloud TTS](https://www.nabucasa.com/config/tts/)
- [The Register — Chromecast March 2025 cert outage](https://www.theregister.com/2025/03/13/google_chromecast_fix/)

### TTS engines (HU)
- [Azure Speech language and voice support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
- [Azure Hungarian Noemi mispronunciation report](https://learn.microsoft.com/en-us/answers/questions/2077929/bug-report-mispronunciation-of-isolated-hungarian)
- [ElevenLabs Hungarian TTS](https://elevenlabs.io/text-to-speech/hungarian)
- [Coqui XTTS v2 model card](https://huggingface.co/coqui/XTTS-v2)

### Voice INPUT path-ok
- [Trigger HA scripts from Google Assistant speaker — HA Community](https://community.home-assistant.io/t/trigger-home-assistant-scripts-from-google-assistant-speaker/751477)
- [Nabu Casa — Google Assistant config](https://www.nabucasa.com/config/google_assistant/)
- [HA — Custom sentences for Assist](https://www.home-assistant.io/voice_control/custom_sentences/)
- [HA Voice Chapter 11 — multilingual assistants](https://www.home-assistant.io/blog/2025/10/22/voice-chapter-11/)
- [Home Assistant Voice Preview Edition](https://www.home-assistant.io/voice-pe/)
- [Hungarian intents discussion (OHF-Voice)](https://github.com/OHF-Voice/intents/discussions/368)
- [Self-Hosted Voice Assistant 2026 Guide](https://www.kunalganglani.com/blog/self-hosted-voice-assistant-home-assistant-2026-guide)
- [Nest Hub Hungarian language status](https://www.googlenestcommunity.com/t5/Speakers-and-Displays/Nest-Hub-Max-Nest-Mini-Hungarian-language/m-p/750420)
- [Gemini for Home expands languages — 9to5Google Apr 2026](https://9to5google.com/2026/04/08/google-home-expands-gemini-access-globally-as-the-assistant-replacement-improves/)

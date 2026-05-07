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

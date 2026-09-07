# FDP AI — a helyi STT/TTS szolgáltatás (felderítés)

> **Mérve: 2026-09-07 07:19**, a futó szolgáltatáson. Minden adat élő lekérdezésből —
> ⛔ semmi nem feltételezés.
>
> **Owner-kérés:** *„még mielőtt elindulok, be kéne alaposan azonosítanod ezt a most is futó
> FDP AI eszközt és végpontot, amin keresztül majd az STT-t végezni kell."*

---

## 1. Mi ez és hol van

| | |
|---|---|
| **Munkakönyvtár** | `E:\Programming\Own\CURSOR\LIVE-projects\ccap\speech-recognition` |
| **Port** | **38321** *(HTTP, loopback)* |
| Futtató | `C:\Program Files\Python310\python.exe` — Flask, Python **3.10.6** |
| Health | `GET /api/health` → `{"status":"healthy"}` |
| Végpontok száma | **74** *(`GET /api/endpoints`)* |
| GPU | **NVIDIA RTX PRO 6000 Blackwell**, CUDA aktív, **97 886 MB** összes / 1 940 MB használt |
| Torch | 2.9.0+cu130 |
| MongoDB | csatlakozva — 1 000 kész / 519 hibás feladat |
| Feltöltés / feldolgozott | `…\speech-recognition\uploads` (314 fájl) · `…\processed` (15 fájl) |
| Max. feltöltés | **100 MB** *(`max_content_length` = 104 857 600)* |
| Támogatott kiterjesztések | 23 féle *(`GET /api/v1/audio/formats`)* |

⚠️ **A `LIVE-projects/fdp-ai` mappa NEM ez** — az gyakorlatilag üres *(csak agent-fájlok +
`__documentations`)*. A futó szolgáltatás a **`ccap/speech-recognition`** alatt él.

---

## 2. Az STT-hez szükséges végpontok

| Metódus | Végpont | Mire |
|---|---|---|
| **POST** | **`/v1/audio/transcriptions`** | ⭐ **A FŐ ÚT** — OpenAI-kompatibilis audio-transzkripció |
| POST | `/api/recognition` | Speech recognition endpoint |
| **GET** | **`/api/ready`** | Be vannak-e töltve az audio modellek *(desktop-hoz)* |
| GET | `/api/speech-categories` · POST ugyanaz | beszéd-kategóriák *(most: `["speech"]`)* |
| POST | `/api/classify` | audio-osztályozás |

⚠️ **Modell-betöltés:** a diagnosztika szerint `models.audio_classifier.loaded: false` — a
modell **az első híváskor töltődik be**, tehát az **első transzkripció lassabb**. A
`GET /api/ready` mondja meg, mikor áll készen.
⚠️ **Konfidencia-küszöb:** `confidence_threshold = 0.55`.

### Bónusz — TTS is van itt

| Metódus | Végpont |
|---|---|
| POST | `/api/v1/audio/speech` — *OpenAI-kompatibilis* beszéd-generálás |
| GET | `/api/v1/audio/speech/result/<task_id>` — aszinkron eredmény |
| GET | `/api/v1/audio/voices` · `/api/v1/audio/models` |

📌 Ez érinti a **C-35**-öt *(STT/TTS kiemelése a régi CCAP-ból)*: a TTS **már itt van** —
lehet, hogy nem kiemelni kell, hanem **ezt használni**.

### Modell-memória kezelése

`POST /api/models/unload` *(family_id)* · `POST /api/models/unload-all` — a
`speech_to_text` / `text_generation` családok kirakhatók a GPU-ról. Hasznos, ha a
generálás és az STT versenyezne a memóriáért.

---

## 3. A MÉRT szerződés — ÉLŐ PRÓBÁVAL IGAZOLVA (2026-09-07 09:30)

> Ez a szakasz korábban „Amit MÉG NEM tudok" volt. **Már nem tippelés: végigmértük.**

### 3.1 A kérés pontos alakja

```
POST http://127.0.0.1:38321/api/recognition
     ?confidence_threshold=0.55&skip_classification=1
Headers:  Content-Type: audio/<típus>      (pl. audio/wav, audio/webm)
          Filename: <fájlnév>
Body:     NYERS audio-bájtok  —  ⛔ NEM multipart
```

⚠️ **Hitelesítés nincs** — a loopback-porton nyitott.

### 3.2 A válasz alakja

```json
{ "status": "processed", "result": { "text": "..." }, "file_path": "...", "audio_category": "..." }
```

⭐ A kliens **mindkét alakot** kezeli (`result.text` ÉS `text`), mert a szolgáltatás verziói eltérhetnek.

### 3.3 ⭐ AZ ÉLŐ, VÉGPONTTÓL VÉGPONTIG PRÓBA — SIKERES

**Módszer (oda-vissza kör, hogy legyen mihez hasonlítani):** a Windows beépített SAPI
beszédszintézisével generáltunk egy **ismert szövegű** WAV-ot, azt küldtük át a saját
kliensünkön, és az átiratot **szó szerint** összevetettük az eredetivel.

```
bemenet (SAPI TTS):  "Please check when the next train departs to Budapest."
átirat (FDP AI):     "Please check when the next train departs to Budapest"
                     → SZÓRÓL SZÓRA egyezik (csak a záró pont hiányzik)
státusz: processed · 77,6 mp · a hallucináció-őr helyesen NEM jelölte gyanúsnak
```

⇒ **A teljes lánc működik:** kliens → FDP AI → átirat → őr → tükör-üzenet.

### 3.4 🔴 A FUTÁSIDŐ A RENDSZER-RAM-TÓL FÜGG — ez a legfontosabb üzemeltetési tény

> **Owner (2026-09-07 09:10), szó szerint:** *„Az FDP AI végpontja lehet lassú, amikor nagy a
> RAM usage (90% usage felett, várakozik)"*

**Megmérve, ugyanazon a gépen, ugyanazzal a fájllal:**

| Állapot | Eredmény |
|---|---|
| RAM **93%** (118/127 GB), hideg modell | ⏱ **5 perc** múlva sem futott le → időtúllépés |
| RAM 93%, közvetlenül utána (bemelegedett) | ✅ **77,6 mp**, helyes átirattal |
| terheletlen, bemelegedett | ~2 s |

🔴 **A SAJÁT HIBÁM, amit ez javított:** a GPU-t mértem (5% kihasználtság, 1,9/97,9 GB) és
ebből azt következtettem, hogy *„nem terhelés, hanem beragadt zár"* — és majdnem a
szolgáltatás újraindítását kértem. **A rendszer-RAM-ot nem mértem meg.**

⭐ **Általánosítható tanulság:** *ha egy alrendszer „vár", NE az elsőként eszedbe jutó erőforrást
mérd meg, hanem MINDET, mielőtt következtetsz.* Egy zöld GPU nem zárja ki a memória-szűkületet.

⇒ **Időtúllépéskor a sorrend: 1) rendszer-RAM · 2) `/api/ready` · 3) `/api/health`.**
Ez bekerült a kliens `remedy` szövegébe is (`cli/src/stt/stt.client.ts`), hogy a hibaüzenet
maga vezesse rá a következő olvasót.

---

## 4. Kapcsolódó

- `__agent/capabilities/CATALOG.md` — **C-33** (voice üzenet), **C-34** (voice channel),
  **C-35** (STT/TTS kiemelés)
- `__agent/CONTINUATION.md` — a munkasor
- ⭐ A **tükör-üzenet** kötelező: `current/principles/` — a félrehallott hangüzenetre adott
  válasz rosszabb, mint a semmi

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

## 3. Amit MÉG NEM tudok

⛔ Nem tippelem meg, a megépítés első lépésében mérem:

- a `POST /v1/audio/transcriptions` **pontos kérés-formátuma** *(multipart mezőnév, `model`
  paraméter, nyelv-megadás)*
- kell-e **hitelesítés** *(a health nem kért)*
- a **válasz alakja** *(sima szöveg? szegmensek? konfidencia?)*
- az **aszinkron** út — a transzkripció is task-alapú-e, mint a generálás
- **magyar nyelv** minősége/beállítása

---

## 4. Kapcsolódó

- `__agent/capabilities/CATALOG.md` — **C-33** (voice üzenet), **C-34** (voice channel),
  **C-35** (STT/TTS kiemelés)
- `__agent/CONTINUATION.md` — a munkasor
- ⭐ A **tükör-üzenet** kötelező: `current/principles/` — a félrehallott hangüzenetre adott
  válasz rosszabb, mint a semmi

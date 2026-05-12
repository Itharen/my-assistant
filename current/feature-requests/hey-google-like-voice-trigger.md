# FR: "Hey Google"-szerű voice-trigger research

> **Forrás: a user szövege (2026-05-12).** Research-stage FR.

## A user szövege

> meg kéne vizsgálni, hogy hogyan tudhatnánk valamilyen ilyen Hey
> Google-szerű működést kialakítani, hol tudjuk ezt legjobban kialakítani
> ezen a szerveren, amit fejlesztünk, vagy valahogy esetleg a Google
> Home-ba is tudjuk integrálni?

## Cél

Egy **voice-trigger** csatorna a user → my-assistant felé:
- Kulcs-szóra (pl. "Hey Assistant" / saját wakeword) figyel
- Hangos parancsot rögzít
- Transzkriptálja (STT) és átadja a rendszernek (chat / Cron Job / Dev Agent)

A user **két lehetséges helyet** említ:

### Opció A: Saját szerver (My Assistant Server, #2)

- A `server/`-ben + a fürdőszobai / lakás-szintű mikrofon-rendszerben
- FOSS wakeword-detektor (pl. Porcupine, openWakeWord, Snowboy-utód)
- Whisper / faster-whisper STT
- Saját webhook bekötés a `server/` REST-be

**Pro:** teljes kontroll, build-it-ourselves, no-paid
**Kontra:** mikrofon-hardver kell mindenhol, latency, akusztika

### Opció B: Google Home integráció

- A meglévő Cast cluster már 24/7 hallgat ("Hey Google")
- Google Assistant Routines → webhook a my-assistant-felé
- Smart Home Cloud-to-cloud "fake device" — virtuális kapcsoló a Google Home-ban,
  amit egy routine flippel, és a fake-device-server kapja az eseményt
  (lásd `current/open-questions.md` Q-wear-5)

**Pro:** hardver megvan, Google Assistant 24/7 fut
**Kontra:** Google API-korlátok, manuál routine setup minden parancsra,
limited mit lehet a routine-ban (Routine != arbitrary input)

## Hybrid (C)

- Wakeword + STT a saját szerveren a **lokál** parancsokhoz (gyors)
- Google Home routine + webhook **távolról** elérhető parancsokhoz
- Mindkettő ugyanahhoz a `server/` REST endpoint-hoz fut

## Status

🔬 **Research-stage**. Megoldás-választás user-OK után.

## Releváns FR-ek

- `current/feature-requests/google-home-integration.md` — már V1-V3 történet
- `current/feature-requests/communication-forms.md` — kommunikációs csatornák
- `current/open-questions.md` Q-wear-5 — IoT fake device research

## Open kérdések

❓ Q-voice-1: Wakeword: saját (custom) vagy "Hey Google" reuse?
❓ Q-voice-2: STT modell: Whisper / faster-whisper / Vosk / cloud (no — paid)?
❓ Q-voice-3: Hardver: hol van mikrofon, hány helyiségben kéne?
❓ Q-voice-4: Latency-küszöb (mennyit várjak: 1s? 3s?)
❓ Q-voice-5: Zaj-tolerancia (tv / zene közben működjön?)
❓ Q-voice-6: Privacy-szint (lokál-only vagy cloud-STT engedett?)

## Phase-elés

| Phase | Mit |
|---|---|
| 0 | ez a FR + research-rendezés |
| 1 | Wakeword-detektor research (Porcupine / openWakeWord / Snowboy / saját) |
| 2 | STT research (Whisper local) |
| 3 | Server REST endpoint a voice-input-ra |
| 4 | Google Home routine + webhook alternatíva (ha hybrid) |
| 5 | Lokál teszt egy szobában |
| 6 | Multi-room deployment |

## Kapcsolódik

- `current/principles/build-it-ourselves.md` — FOSS preferált
- `current/principles/no-paid-solutions.md` — Whisper local, ne paid API
- `current/architecture.md` L2 Notification (kommunikáció) + L2 Monitoring (új voice-input)

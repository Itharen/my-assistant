# FR: Konyhai jegyzetelés — gyors capture-csatorna

> **Forrás: user 2026-05-29.** Org-tükör: `org:note:6a1af2481aaf1ebfb627df1d`.

## User szövege (verbatim)

> ki kéne találjak valamit arra, hogy a konyhából tudjak jegyzetelni ide neked
> vagy az organizerbe valahogy mert általában ott szokott előfordulni a legtöbb
> ilyen jellegű gondolatom feljegyezni valóm

## Probléma

- A user **legtöbb feljegyzendő gondolata a konyhában** keletkezik.
- Ott most **nincs súrlódásmentes capture** → a gondolatok elvesznek
  ("már eszembe jutott, csak nem tudtam feljegyezni" — ld. sales-ötlet).
- Cél: a konyhából **azonnal** rögzíthető legyen → my-assistant chat és/vagy
  organizer inbox-ba.

## Megoldás-irányok (ötletelés)

| Irány | Lényeg | FOSS / saját? |
|---|---|---|
| **Hangvezérelt capture** | "Hey ..."-szerű voice-trigger → STT → organizer/notes inbox | kötődik `hey-google-like-voice-trigger.md` FR-hez |
| **Dedikált konyhai eszköz** | régi telefon / tablet a konyhában, egy-gombos quick-note app | saját PWA / script |
| **Mobil quick-capture** | telefonos gyorsgomb / widget / megosztás → organizer API | `fo notes.create` wrapper |
| **Cast-notifier kétirányú** | meglévő Google Home speaker → hang-input felvétel | research |

## Kapcsolódik

- `current/feature-requests/hey-google-like-voice-trigger.md` — voice-trigger research (#7d)
- `current/feature-requests/communication-forms.md` — kommunikációs csatornák
- `current/principles/recording-discipline.md` — ez a FR a rögzítési súrlódást csökkenti
- `current/principles/no-paid-solutions.md` + `build-it-ourselves.md` — FOSS/saját preferált

## Status

🟡 Ötlet-fázis. Design-kérdések felvéve `open-questions.md` (Q-kitchen-*).
STT-input már megvan a rendszerben → a voice-irány a legkisebb új-építés.

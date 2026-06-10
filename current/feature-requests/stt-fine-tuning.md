# FR: STT finomhangolás + fix tréner-metódus

> **Forrás: user 2026-05-16.**

## User szövege

> Finom hangolni kéne az STT-t, amit használok, de ahhoz kell egy fix tréner
> metódus, amivel vissza tudok jelezni, hogy mi volt jó, mi nem volt jó, mit
> kéne hogyan újra trénelni az adott hanganyaghoz például.

## Háttér

A user STT-t (speech-to-text) használ az inputjaihoz, és a transzkripciók
rendszeresen hibásak — `current/stt-typos.md` már egy gyűjtő, de **reaktív**.
Most: **proaktív finomhangolás** kellene.

## Cél

**Fix tréner-metódus** — egy explicit folyamat, amivel:
1. Visszajelezhet a user **specifikus hanganyagokra**: "ez a transzkripció pontos / pontatlan"
2. Részlet-szintű feedback: "ezt a szót rosszul ismerte fel, ezt kellett volna"
3. Az adott hanganyag → újra-tréning a javított output-tal
4. A modell idővel **adaptálódik** a user beszéd-stílusához

## Megvalósítási jelöltek

| Megközelítés | Hogyan | Felirat |
|---|---|---|
| **Local fine-tune** (Whisper-szerű open modell) | Letöltött modell + saját audio+szöveg-párok dataset + LoRA / full fine-tune | Adatvédelem ✅, költség = idő + GPU |
| **Custom phonetic dictionary** | A meglévő STT-engine egy "lexicon"-t tud felülírni egyedi kiejtésekkel (pl. "niche datasets" javítása) | Gyorsabb, kevésbé alapos |
| **Post-process replacement** (`stt-typos.md` aktív használata) | Minden transzkripció után regex/dictionary korrekció a meglévő tévedés-mintákból | Trivi, már részben él |
| **Hybrid** | Phonetic dict + post-process + opcionális local fine-tune | Legnagyobb hatékonyság |

→ **MVP javaslat:** **Hybrid** — kezdjük a post-process automatizálásával,
   később phonetic dict / fine-tune.

## Tréner-metódus folyamat (cél)

```
1. User mond valamit → STT transzkripció + audio mentve
2. UI panel: melyik szó volt rossz? → user korrigálja inline
3. Audio + helyes szöveg pár mentődik: `__agent/state/stt-training/<ts>.json`
4. Aggregátor: 50-100 pár után → 
   (a) auto-update `stt-typos.md` regex-pattern
   (b) opcionális: local Whisper fine-tune trigger
5. Új STT-runtime tölti be a frissített modellt + dict-et
```

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | chat ✅ |
| 1 | Audio + transzkripció mentési flow (`__agent/state/stt-training/`) | Dev Agent |
| 2 | UI inline-korrekció (a my-assistant dashboard-on új panel) | Dev Agent |
| 3 | Aggregátor — `stt-typos.md` auto-update regex-mintákkal | Dev Agent |
| 4 | Phonetic dictionary export (engine-függő) | Dev Agent |
| 5 | (későbbi) Local Whisper fine-tune pipeline | Dev Agent + user GPU |

## Status

🟡 **Backlog** — nem akut, de **erős asszisztens-friction csökkentő**.
Backlog `#8b` (yellow hullámban).

## Kapcsolódik

- `current/stt-typos.md` — passzív gyűjtő (reaktív)
- `current/principles/working-style.md` — STT-tolerancia szabály (user-side)
- `current/feature-requests/ccap-local-stabilization.md` — lokál AI infrastruktúra (Whisper is lokál lehet)

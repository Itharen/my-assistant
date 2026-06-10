# Jarvis — személyi AI-agent (umbrella vízió)

> **Forrás: user 2026-05-29.** Org-tükör: `org:task:6a1e61ceb2d8b2918f0cf897`.
> A user fel akarja venni feladatnak a "Jarvis"-t, és kért egy prioritási tippet
> az agent funkcióira.

## User szövege (verbatim)

> Meg akarom fel feladatnak a Jarvis-t és nem tudom pontosan, hogy ez hogy lesz
> a legmegoldhatóbb. Amúgy ebben adhatnál is tippet, hogy hogyan kéne priorizálni
> az agentnek a funkcióit. Egyrészt a Hiper Super Agent, másrészt a RAG rendszer,
> amit sokkal-sokkal okosabb és megbízhatóbb lesz. Harmadrészt a Voice.io, aztán
> utána a lakásszintű Voice.io. valamint egy UI felület feladatkezelésekre és
> egyéb minden kezelésekre.

## Az 5 funkció

1. **Hiper Super Agent**
2. **RAG rendszer** (sokkal okosabb + megbízhatóbb)
3. **Voice.io**
4. **Lakásszintű Voice.io**
5. **UI felület** (feladatkezelés + minden egyéb kezelés)

---

## 🎯 Jóváhagyott prioritás (user OK 2026-05-29) — dependency + MVP-vezérelt

> Az elv: **alulról fölfelé** építkezünk — előbb az agy, aztán az interakció.
> Az ok minden lépésnél, hogy mire épül és mi a megtérülése.

| # | Funkció | Miért ide | Függ |
|---|---|---|---|
| **1** | **RAG rendszer** | Az **alap**. A super-agent "emléktömege" — nélküle a lokál mikro-modellek elvesznek (ld. `mvp-focus.md` super-agent stratégia). Már most a **kritikus blokkoló** (#7g). Ez teszi az egészet *megbízhatóvá*. | — |
| **2** | **Hiper Super Agent** | Az **agy**. A RAG-ra épül: a multi-model super-agent a behúzott kontextusból lesz okos. | RAG |
| **3** | **UI felület** (feladat + minden kezelés) | **Párhuzamos sáv** — alacsony csatolás a brain-nel, mehet az 1-2 mellett. Azonnali produktivitás-megtérülés (feladatkezelés = MVP-közeli), és ez a **láthatóság/kontroll** rétege. | laza |
| **4** | **Voice.io** | Az **interakciós réteg**. Akkor éri meg, ha az agy már okos (különben buta hangválaszok). STT már megvan a rendszerben → kis új-építés. | Super Agent |
| **5** | **Lakásszintű Voice.io** | A **legnehezebb infra** (multi-device, IoT, mindig-figyelő). A sima Voice.io kiterjesztése egész lakásra. Utolsó, mert a legtöbb új komponens + a legkevésbé MVP-kritikus. | Voice.io + IoT |

**Lakásszintű Voice.io — terv-megjegyzés (user 2026-05-29):**
- Megnézni, hogy egy **Arduino** is elég lehet-e a node-okhoz (olcsó, elosztott).
- **Először POC** két ponton: 🍳 **konyha** + 🖥️ **dolgozó (munka-asztal)** — a két
  hely ahol a legtöbb gondolat/igény keletkezik (ld. `kitchen-note-capture.md`).

**Lényeg egy mondatban:** RAG → Super Agent az **intelligencia-mag** (sorban),
az **UI** mehet párhuzamosan (gyors haszon), a két **Voice** réteg a végén jön
(olcsóbb → drágább: egy-eszköz → egész lakás).

---

## FR / org-task mapping (mihez kötődik már most)

| Jarvis-funkció | my-assistant FR | organizer task |
|---|---|---|
| RAG | `feature-requests/rag-context-injection.md` (#7g) | `org:task:69af5a18913e642a6c2a356d` (RAG csomag) |
| Hiper Super Agent | `principles/mvp-focus.md` (super-agent stratégia) + `feature-requests/ccap-local-stabilization.md` | Orchestrátor / Aszisztens fejlesztés, CCAP Coordinator MVP |
| Voice.io | `feature-requests/hey-google-like-voice-trigger.md`, `kitchen-note-capture.md`, `communication-forms.md` | `org:task:69af5a14913e642a6c2a3567` (Speech interfész) |
| Lakásszintű Voice.io | `feature-requests/iot-integration-google-home-routine.md` + cast-notifier | `org:task:699c8c38cb79b45c59a74dbc` (Home/IoT integrációk) |
| UI felület | `feature-requests/tasks-dashboard-aggregated-view.md` (#3d), `agent-io-panels.md` (#3g) | — |

## Nyitott

- A pontos "legmegoldhatóbb" struktúra (egy projekt? több? CCAP-on belül?) — a
  super-agent stratégia szerint **EGY** super-agent a cél, nem agent-hadsereg
  (`mvp-focus.md` 2026-05-22). A Jarvis = ennek a user-facing megnyilvánulása.
- ✅ **User jóváhagyta a sorrendet (2026-05-29)** ("írd is fel, mert ezek jók"). Következő: a Dev Agent backlog 🟢/🟡 prioritásait ehhez a sorrendhez igazítani (RAG > Super Agent > UI ∥ > Voice.io > lakásszintű Voice.io).

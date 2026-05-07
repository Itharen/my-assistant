# FR: Calendar integráció (Teams + Google)

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag — később
> `fo feature-requests.create`-tel feltölthető.

---

## 2026-05-07 — initial deklaráció

> Nem lenne utolsó, hogyha valahogy integrálnánk a Teams-es kalendáromat,
> meg a Google kalendáromat, hogy pontosan láthass, illetve tud nekem nézni,
> hogy mikor vannak a míténgjeim.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Cél

A my-assistant (és/vagy az organizer calendar modulja) **read-only** módon lássa
a user Teams- és Google-naptáraiban szereplő meetingeket, hogy:

- A bedtime / fürdés / séta tervezésnél előre lássa a fix-anchor pontokat
  (pl. péntek 13:00 meeting — most kézzel van a `sleep-system.md`-ben)
- A halogatás-szorzók ne ütközzenek meeting-időszakokba
- A "fennmaradt idő" emlékeztetők (pl. bőrgyógyász) helyesen tudják mikor van rés

### Scope kandidátusok

| Komponens | Mit ad |
|---|---|
| **Microsoft Graph API** (Teams calendar) | OAuth2 + `/me/events` lekérés |
| **Google Calendar API** | OAuth2 + Events.list |
| **Sync irány** | one-way (read) initial → később esetleg write (organizer event-ek külső naptárba kiírva) |
| **Refresh** | poll (5-15 perc) vagy webhook subscribe |
| **Tárolás** | organizer `calendar` modul (már létezik) — csak a bridge hiányzik |

### Kapcsolódó nyitott szálak

- **Google Home integráció research** task (P=50, organizer) — közös téma:
  external integrations + proactive jelzés
- A péntek 13:00 meeting most a `sleep-system.md`-ben kézzel van — ez egy
  élő példa hogy miért hasznos lenne az automatikus integráció

### Open kérdések

- Read-only elég, vagy a my-assistant tudjon új meeting-et felvenni a külső
  naptárba (pl. orvosi időpont)?
- Felhő-API hozzáférés: hol futna a sync (lokál cron, organizer server,
  külön microservice)?
- Sensitive data: a meeting-címek/résztvevők logolódjanak-e? Default: csak
  start/end + minimális title.

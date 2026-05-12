# FR: Meeting tracking

> **Forrás: a user szövege (2026-05-08).** Most csak placeholder.

## Cél (rövid)

A user napi meeting-eit trekkelni: kezdés/vég, résztvevők, téma. Jelenleg
ez **másik sessionben** intézi (külön projektben — TBD), úgyhogy a
my-assistant-en belül ennek **ingest endpoint-ja** kell később.

## Status

🅿️ Out of scope most — másik session csinálja a tényleges integrációt. Itt
csak felvettük hogy ne felejtsük.

## Kapcsolódik

- `current/feature-requests/calendar-integration.md` (ha van)
- `current/feature-requests/triggering-system-architecture.md` — calendar = input #7 az A-mode-hoz
- `current/architecture.md` L2 Monitoring layer (jövőbeli komponens)

## Open kérdések

❓ Q-meet-1: melyik másik session / agent intézi most?
❓ Q-meet-2: mit ingest-eljünk át (csak start/end, vagy résztvevők+jegyzet is)?
❓ Q-meet-3: ütemezés-konfliktus észlelése (pl. fit-időablakkal)?

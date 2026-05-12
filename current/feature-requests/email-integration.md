# FR: Email-kezelés integráció

> **Forrás: a user szövege (2026-05-08).** Most csak placeholder.

## Cél (rövid)

E-mail-kezelés bekötése a my-assistant + triggering-rendszerbe:
- Bejövő mail-ek monitoring (releváns / sürgős detekció)
- Kimenő mail draft / küldés (kérésre)
- Bekötés a triggering A-mode-ba: pl. "fontos email érkezett" → notify

## Status

🅿️ Parkolva. Részletes terv később.

## Dependency

- `triggering-system-architecture.md` MVP működik
- IMAP/SMTP credential setup (külön kör)

## Open kérdések

❓ Q-email-1: melyik mail-fiók(ok)? (itharen3@gmail.com? céges? több?)
❓ Q-email-2: read-only monitoring vs küldés is?
❓ Q-email-3: szűrés-szabályok ki dönti (assistant LLM-mel, vagy fix rules)?

# 2026-08-25 — Tesco kosár live acceptance és regresszióvédelem

## Live outcome

- Transport: dedicated UBH Chrome + saját MV3 extension; Computer Use nem történt.
- Login: kézi user-login, majd page-evidence (`Kijelentkezés`, `Felhasználói Fiókom`).
- Kosár: 34/34 elvárt kanonikus product-ID, 81 db, 82 768 Ft.
- Final audit: `missing=[]`, `extra=[]`, line count 34/34, aggregate count 81/81.
- Kimaradt: két nem elérhető jégkrém és minden bizonytalan tétel.
- Checkout/rendelésleadás nem indult.

## Mért failure/recovery

- `UBH-EFFECT-POSTCONDITION-001` több terméknél úgy jelent meg, hogy a mutáció ténylegesen perzisztált.
- Gyors továbblépésnél volt optimista success receipt, amely nem perzisztált a trolley-ba.
- Megbízható recovery: effect után explicit read; product-bound increment; 4–6 soros trolley-audit; retry csak
  bizonyított hiány után; végül exact product-ID halmaz + aggregált darabszám.
- A HELL termékoldal URL-ID-ja `2004121302824`, a kanonikus DOM/kosár-ID `121302824`; az identity-regiszter javítva.

## Kanonizált védelem

- SSOT runbook: `unblockable-browser-handler-tool/__documentations/TESCO-CART-RUNBOOK.md`.
- UBH parser: magyar elérhetetlenség; ár alakú hamis mennyiség elutasítása.
- Cart planner: ismeretlen mennyiségnél `unverifiedCartLines`, effekt nélkül.
- Cart audit: exact canonical ID-halmaz + aggregált darabszám.
- Automata unit + J-004 journey variánsok + runbook contract test.
- Plugin skill a kanonikus runbook invariánsaira kötve.

## Tartós login

- Mért ok: három namespace három külön persistent Chrome-profilt hozott létre (`dedicated`, `v2`, `v3`).
- Kanonikus, változatlan profilkötés: `my-assistant-tesco-dedicated-v3`; SSOT:
  `__agent/config/browser-profiles.json`.
- Minden agent ugyanazt a namespace-et használja. Új agentnév/version suffix nem hozhat létre üres profilt.
- A Tesco sessiont a Chrome-profil őrzi. Jelszó, 2FA, cookie és session-token nem kerül env-be vagy agentbe.
- Kézi újrabelépés csak Tesco-oldali session-lejárat vagy visszavonás után szükséges.

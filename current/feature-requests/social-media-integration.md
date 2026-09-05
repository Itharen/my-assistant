# FR: Social media integráció

> **Forrás:** user-kérések 2026-05-08 és 2026-08-26.

> **2026-09-02 — hivatalos hozzáférési kutatás:** az owner kérésére a partnerigénylés menete és egy angol
> eligibility-megkeresés elkészült. [Kutatás és tervezet](../../__documentations/developments/2026-09-02-linkedin-messaging-access-research.md).
> A Compliance program nem fogad új partnereket; Developer Supporton tisztázható, van-e más alkalmas út.
> Nincs elküldött kérelem vagy megadott jogosultság. A lenti „nem akcióképes út” a tényleges küldési
> hozzáférésre vonatkozik, nem a most kért jogosultsági kutatás/megkeresés tiltására. A send továbbra sem kész.

## Cél (rövid)

Első prioritásként a user személyes LinkedIn-fiókjának agentfüggetlen,
hivatalos API-ra épülő integrációja:

- szöveges és képes posztok előkészítése és publikálása;
- bejövő LinkedIn-üzenetek olvasása;
- olvasatlan üzenetek listázása;
- azoknak a beszélgetéseknek a felismerése, ahol a user még nem válaszolt;
- válasz megfogalmazása és — ha később hivatalosan engedélyezetté válik — küldése.

Egyéb platformok (Discord, Twitter/X, Reddit?, Facebook?) későbbi scope.

## Hatókör

- Saját LinkedIn Developer App + OAuth 2.0.
- Agent- és szolgáltatófüggetlen TypeScript CLI/API adapter.
- Titkok és tokenek: a jelenlegi owner-választás szerint gitignored projekt-root `.env`; FDP Keystore opcionális
  provider marad. Token soha nem kerül forráskódba vagy verziókezelt fájlba.
- Poszt-draft, preview, kép-feltöltés és publikálás a hivatalos Share on LinkedIn API-val.
- Külső publikálás/küldés előtt explicit, műveletkori user-jóváhagyás.
- Cursor-alapú lapozás, idempotens szinkron és teljes action-log.
- Az `unread` és a `needsReply` két külön állapot:
  - `unread`: csak a LinkedIn autoritatív olvasottsági flagje alapján;
  - `needsReply`: az utolsó releváns üzenet bejövő, és nincs nála újabb user-válasz.

## Hivatalos API-határ — 2026-08-26

- ✅ Személyes szöveges és képes poszt publikálható a `w_member_social`
  engedéllyel és a Share on LinkedIn API-val.
- ✅ Magyarországi/EEA LinkedIn-profilnál a hivatalos Member Data Portability
  API self-service módon kérhető. Az `INBOX` Snapshot Domain visszaadja a
  korábbi bejövő és kimenő üzeneteket; a Member Changelog API a hozzájárulás
  utáni üzeneteseményeket legfeljebb 28 napos ablakban, ajánlottan óránkénti
  inkrementális lekéréssel szolgáltatja.
- ✅ A changelog hivatalos message-sémája tartalmazza többek között a `thread`,
  `author`, `content`, `deliveredAt` és `readAt` mezőket. Ez alapján az unread
  és a `needsReply` detektálása megvalósítható, de az unread-szemantikát live
  API-probe-bal kötelező ellenőrizni, mielőtt autoritatívnak tekintjük.
- 🔴 A Member Data Portability API read-only. Személyes üzenet automatikus
  küldésére továbbra sincs általánosan elérhető self-service jogosultság;
  első körben válasz-draft + manuális LinkedIn-küldés készül.
- 🔴 **Gyakorlati döntés: a személyes üzenetküldés jelenleg NEM megoldható az alkalmazásból.** A hivatalos
  Messages API technikailag létezik, de kizárólag jóváhagyott partnereknek érhető el; ez a személyes assistant app
  számára nem self-service és jelenleg nem igazolt, nem akcióképes hozzáférési út. Emiatt nem roadmap-ígéret és nem
  tekinthető későbbi, várhatóan elkészülő capabilitynek. Csak ténylegesen megadott partnerjogosultság esetén nyitható
  újra külön owner-döntéssel.
- 🚫 LinkedIn webes UI scrapingje vagy automatizálása nem használható
  kerülőútként: tiltott automatizált tevékenység és fiókkorlátozási kockázat.

Hivatalos referenciák:

- <https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin>
- <https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access>
- <https://learn.microsoft.com/en-us/linkedin/shared/integrations/communications/overview>
- <https://learn.microsoft.com/en-us/linkedin/shared/integrations/communications/messages>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/member-data-portability-member>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/member-snapshot-api>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/snapshot-domain>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/member-changelog-api>
- <https://www.linkedin.com/help/linkedin/answer/a6214075>
- <https://www.linkedin.com/help/linkedin/answer/a1340567/automated-activity-on-linkedin?lang=en>

## Status

🟡 Inbox read/sync és determinisztikus `needsReply` élőben működik. A teljes történeti bootstrap 2026-08-26-án
4 oldalon 3 394 üzenetet adott, zero unresolved normalizálással; az ismételt sync idempotens. Az on-demand
`linkedin-inbox-review` flow és a HU/EN válaszsablon v1 owner-review alatt áll. Az automatikus személyes
üzenetküldéshez nincs Messages API partnerjogosultság. A jelenlegi alkalmazás szempontjából a válasz **nem**:
az agent draftot készít, de a küldés manuális. Az elméletileg létező partner-API nem használható úgy, mintha reális
vagy várható megoldási út lenne. A 2026-09-05-én jóváhagyott guided manual-send workspace a saját Angular
`/linkedin` nézetet Chrome Side Panelben nyitja a valódi LinkedIn lap mellett. Ez a kézi küldés kényelmi felülete,
nem Messages API, és nem automatizálja a LinkedIn DOM-ját.

## Dependency

- LinkedIn Developer App létrehozása és OAuth callback.
- A Developer Appot a LinkedIn által előírt `Member Data Portability (Member)
  Default Company` oldalhoz kell létrehozni, majd kérni kell a Member Data
  Portability API (Member) productot és a self-serve scope-ot.
- `w_member_social` termék/jogosultság.
- Gitignored projekt-root `.env` a `LINKEDIN_MEMBER_ACCESS_TOKEN` kulccsal; opcionálisan FDP Keystore.
- Hyperplan és API-contract.

## Open kérdések

✅ Q-social-1: első prioritás a LinkedIn.
✅ Q-social-2: posztpublikálás kell; üzenetolvasás, unread és unanswered detektálás,
valamint üzenetírás is cél, de csak hivatalosan engedélyezett interfészen.
❓ Q-social-3: a "tartalom out of scope" szabály (recurring-tasks.md LinkedIn) változik?
✅ Q-social-4: igen; az `INBOX` snapshot + Member Changelog message-eventek
szabályos read-only syncet tesznek lehetővé EEA-profilnál.
🟡 Q-social-5: az EEA-jogosultságot a sikeres live authorization igazolta. Továbbra is nyitott, hogy a live
message-eventeknél a `readAt` változása pontosan hogyan követi a webes inbox unread-state-jét.
✅ Q-social-6: a két díjsáv szándékosan különbözik, de ez kizárólag belső szabály. A megkeresés, a teljes thread és
a linkelt pozíció adatai alapján kiválasztott egyetlen minimumdíj jelenhet meg a külső válaszban; a két díj együtt,
az alternatív díj és a különbség indoka soha. A hazai díj csak kellően bizonyított magyar munkanyelvű, alapvetően
magyar csapatú projektre érvényes. Bizonytalan vagy ellentmondásos esetben a 75 EUR/órás védő default használandó,
és csak a még valóban hiányzó döntő adatra szabad rákérdezni.

Új működési követelmények (2026-08-26):

- a CV már nem tölthető le a LinkedIn-profilról, ezért opportunity-válaszhoz friss fájlként csatolandó;
- legalább 60 napos válaszkésésnél rövid szabadságos bocsánatkérő bevezető kell;
- C#/Python/Flutter vagy más non-core stack esetén transzparensen jelezni kell, hogy nem core szakterület, miközben
  a jelenlegi AI-assisted eszközökkel lefedhető;
- explicit indiai vagy Tata/TCS-affiliáció mindig nemzetközi díjsávot jelent, akkor is, ha magyarországi csapatként
  hivatkoznak rá; származást név vagy profilkép alapján nem szabad feltételezni;
- a közvetlen projektmegbízások és konkrét projektmegkeresések kiemelt prioritásúak: külön kategóriában, a batch
  elején és egyedi projektkivonattal kezelendők;
- TODO: CV-frissítés és a legalább három éve változatlan hazai/nemzetközi díjsávok felülvizsgálata.

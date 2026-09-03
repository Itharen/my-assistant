# LinkedIn személyes üzenetküldési hozzáférés — kutatás és megkereséstervezet

**Ellenőrizve:** 2026-09-02. **Állapot:** kutatás elkészült; megkeresés NEM lett elküldve; partnerjogosultság nincs igazolva.
**App:** My Handler Tool. **Scope:** saját személyes inbox; meglévő beszélgetésekre, egyenkénti emberi jóváhagyással válaszolni.
**Nem scope:** új send implementáció, app-/tokenmódosítás, külső megkeresés, vásárlás vagy UBH-automatizálás.

## 1. Rövid eredmény

Létezik dokumentált személyes Messages API, de csak jóváhagyott partnereknek. A Compliance program jelenleg
nem fogad új partnerjelentkezéseket. Nyilvános, kifejezetten egyfelhasználós személyes assistant számára megnyitott
Messages API igénylési folyamatot nem találtam. Van hivatalos developer-support és productivity-app referral csatorna:
első lépésként a jogosultságot és a megfelelő programot kell tisztázni, nem készre vett hozzáférésre építeni.
Forrás: [Messages API](https://learn.microsoft.com/en-us/linkedin/shared/integrations/communications/messages),
[Compliance FAQ](https://learn.microsoft.com/en-us/linkedin/compliance/compliance-api/compliance-faq).

**Becslés, nem LinkedIn-állítás:** a jelenlegi egyfelhasználós, nem pénzügyi compliance-célú appnál gyenge az
illeszkedés az igazolt partnerpéldákhoz. Érdemes egy precíz előzetes megkeresést tenni, de elfogadási arány,
garantált válaszidő és jóváhagyási ígéret nem adható. A támogatási válasz önmagában nem API-jogosultság.

## 2. Ellenőrzött hozzáférési és kapcsolatfelvételi utak

| Út | Ellenőrzött tény | Következmény nálunk |
|---|---|---|
| Személyes Messages API | Elsőfokú kapcsolatoknak írás és meglévő threadre válasz dokumentált; partnerszerződéshez kötött. | Pontosan ezt a terméket nevezzük meg, nem általános „LinkedIn API”-t. |
| Compliance | A FAQ erőforráshiány miatt zárt új partnereknek; a Getting Access oldal is kizárja az igénylést. | Nem állítjuk, hogy van most nyitott compliance-jelentkezési űrlap. |
| Developer Support | A LinkedIn saját application-review helpoldala a `/help/linkedin/ask/dsapi` címre hivatkozik. | Elsődleges előzetes jogosultsági / megfelelő csapathoz irányítási megkeresés. |
| Productivity-app referral | A LinkedIn automatizálási súgója megemlíti a produktivitási appokkal való partnerség mérlegelésére szolgáló kapcsolatfelvételt. | Másodlagos csatorna; nem automatikus kivétel és nem hozzáférésigénylési program. |
| Meglévő relationship manager / business-development kapcsolattartó | A Compliance overview partnerfeltételeket és API-szerződést említ. | Csak ha valóban van ilyen kapcsolat; nem találtam saját ügyünkhöz megnevezett kapcsolattartót. |

Kapcsolódó elsődleges források:

- [Getting Access — Compliance (Closed)](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) — oldalon jelzett frissítés: 2025-06-26.
- [Compliance overview](https://learn.microsoft.com/en-us/linkedin/compliance/compliance-api/overview) — szabályozott iparágak vállalati kommunikációkezelése.
- [Developer application review status definitions](https://www.linkedin.com/help/linkedin/answer/a1449586) — ebből ellenőrzött developer-support link.
- [Developer Support](https://www.linkedin.com/help/linkedin/ask/dsapi) — a célűrlapot a kutatási webeszköz nem tudta megnyitni; a bejelentkezett mezők és választók NEM ellenőrzöttek. A link származása a hivatalos helpoldal HTML-jében is ellenőrizve.
- [Automated activity on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a1340567/automated-activity-on-linkedin?lang=en) — productivity-referral említés, korlátozás utáni súgókontextusban. Nincs szükség fiókkorlátozást előidézni a kapcsolatfelvételhez.
- [Contact LinkedIn customer support](https://www.linkedin.com/help/linkedin/answer/a518597) — a referral link most erre a súgóra vezet: bejelentkezés → Help Center → Contact us → Chat with support → szükség esetén támogatói továbbítás. A korábbi formhivatkozás nem bizonyít külön, ma is nyitott partnerűrlapot.

**Javasolt sorrend:** app-adminnal belépés → Developer Support → rövid eligibility/routing kérdés.
Ha nincs megfelelő kategória vagy nem hozzáférhető, a Help Center útján kérjük a developer/partnership csapathoz
továbbítást. Nem választunk valótlan Advertising/Talent/Compliance terméket azért, hogy egy kötelező mező átengedjen.
Egy ügyet viszünk tovább; a kapott ügyszámot és a pontos választ később ebbe a dokumentumba kell visszavezetni.

## 3. Mit lehet állítani a feltételekről?

### Közvetlenül dokumentált Messages API működés

A teljes előkészített üzenet és csatolmányai legyenek láthatók és szerkeszthetők. A tag külön döntsön a konkrét
üzenet elküldéséről, a továbbítás ehhez az aktuális cselekvéshez kapcsolódjon. Ütemezett/automatikus esemény nem
helyettesíti ezt; üzenetküldésért ösztönző jutalom és HTML-tartalom sem megengedett.
[Requirements](https://learn.microsoft.com/en-us/linkedin/shared/integrations/communications/messages).

A javasolt localhost preview + saját Küldés gomb **illeszkedhet ezekhez a feltételekhez**, de ettől még nem lesz
jóváhagyott az alkalmazás. A CV/PDF csatolás és a nem-kapcsolattól érkezett recruiter InMailre válasz külön
tisztázandó: a meglévő thread általános említését és a régi, részben képes attachment-példákat nem tekintjük
e két konkrét képesség igazolásának.

### Általános app-review szempontok — NEM igazolt Messages-specifikus felvételi lista

A LinkedIn review-súgója use-case ellenőrzést, szervezeti azonosítást és alkalmazás/screencast vizsgálatot ír le.
Elutasítás oka lehet elégtelen leírás, nem támogatott cél, nem ellenőrizhető email/cég/honlap, rossz Company Page,
privacy policy vagy screencast, illetve adatfelhasználási vagy elnevezési probléma.
[Hivatalos review-státuszok](https://www.linkedin.com/help/linkedin/answer/a1449586).

Ebből **felkészülési lista** következik, nem az, hogy minden egyéni fejlesztő minden programban köteles céget
alapítani. A ránk alkalmazható pontos jogi/szervezeti minimumot a fogadó programnak kell megmondania.

### Adatkezelés: ne vállaljunk be nem igazolt állítást

A DMA Portability külön feltételei eltérnek az általános API-szabályoktól; több általános üzleticél-korlátozást
kifejezetten kivonnak, de az adatbiztonság, jogszerű feldolgozás, törlés és hiteles tájékoztatás továbbra is számít.
Az MDP-hozzáférés nem ad send jogot, és egy későbbi partnerszerződés külön adatkezelési feltételeket szabhat.
[Portability Terms §1.3, §2–3](https://www.linkedin.com/legal/l/portability-api-terms).

A „localhost” nem jelenti, hogy minden feldolgozás helyi: AI-agent vagy modell bevonásakor külső szolgáltatóhoz
kerülhet szöveg. A megkeresésben az AI szerepét nyíltan megnevezzük; az adattovábbítás, tárolás, retention,
törlés és tréningbeállítások tényleges állapotát kell dokumentálni. Nem állítunk már teljesített tanúsítást,
teljes helyi feldolgozást, titkosítást vagy no-training garanciát ellenőrzés nélkül.

## 4. Bekészítendő anyagok

Az első jogosultsági kérdéshez:

- App neve: **My Handler Tool**; App ID / Client ID és az admin kapcsolati emailje (beküldés előtt ellenőrizendő).
- Tényleges fejlesztői/szervezeti minőség: személyes belső eszköz, jelenleg egy saját fiók.
- Konkrét használat: bejövő szakmai, recruiter és projektmegkeresések áttekintése, választervezet, emberi válaszküldés.
- Egyértelmű scope: **personal member inbox, reply to existing conversations**, nem céges Page, hirdetés vagy ATS.
- Mi működik: hivatalos MDP read-only sync és lokál draft CLI. Mi terv: localhost inbox és API-s send.

Ha van megfelelő nyitott program, a részletes review-hoz javasolt:

- ellenőrizhető fejlesztői/szervezeti adatok és honlap/privacy tájékoztató, a program konkrét követelményei szerint;
- adatfolyam és adatfeldolgozó-lista, jogosultságok, cache/token-védelem, törlési és visszavonási működés;
- rövid, szintetikus adatos demo: thread kiválasztás → draft módosítás → csatolmány ellenőrzés → egyedi küldési szándék;
- kezdeti pilot határa és várható használat, **ténylegesen vállalható**, nem kitalált napi üzenetszámmal;
- a már működő és a csak tervezett kontrollok külön listája.

A demó elkészítésének nincs e kutatásból következő automatikus engedélye. Mock képernyő/mock send lehet
tervszemléltetés, de azt így kell felcímkézni; nem lehet működő hivatalos küldésként bemutatni.
Token, client secret, cookie vagy valódi másik fél privát levelezése nem csatolandó a kérelemhez.

## 5. Sikertörténetek — pontosan milyen siker?

| Példa | Mit igazol? | Mit NEM igazol? |
|---|---|---|
| [LinkedIn saját Hearsay bemutatója, 2011-03-09](https://www.linkedin.com/blog/member/archive/linkedin-hearsay) | Hivatalosan bemutatott private-inbox API-integráció pénzügyi kommunikáció archiválására, szűrésére és jelölésére. | Nem mai egyéni Messages API felvételi recept, és az írás nem igazol tetszőleges külső appból küldést. |
| [Smarsh LinkedIn archiving](https://www.smarsh.com/channel/linkedin/) | A szolgáltató ma API-alapú LinkedIn/InMail rögzítést és compliance-archiválást dokumentál. | Nem személyes válaszküldési engedély és nem saját API-hozzáférés vásárlási útja. |
| [LinkedIn Pages messaging partnerek](https://www.linkedin.com/help/recruiter/answer/a6246714) | LinkedIn szerint Bird CRM, Brandwatch, Hootsuite, Oktopost, Sprinklr, Zoho Recruit platformokból Page-üzenetek kezelhetők. | Nem a felhasználó személyes inboxa. |
| [Hearsay Private Messages help, 2025-07-09](https://success.hearsaysocial.com/hc/en-us/articles/360020262793-Private-Messages-in-Hearsay) | Általános social-account bejövő üzenetekre külső felületről válaszolási workflow; új threadet a natív felületen kell indítani. | A megnyitott szöveg nem nevezi meg egyértelműen a LinkedIn személyes inboxot; ebből nem állítunk igazolt mai LinkedIn-send capabilityt. |

**Közeli, igazolt sikertörténet egy hozzánk hasonló egyfelhasználós assistant Messages API jóváhagyásáról nem került elő.**
Ez keresési eredmény, nem annak bizonyítása, hogy ilyen soha nem történt.
Keresett témák: Messages API approved partner/application/success; személyes inbox szinkron;
Hearsay/Smarsh/Global Relay; LinkedIn developer-support és compliance.

Kiszűrt félrevezető példák:

- [Hearsay Partner Messages kampányeset](https://business.linkedin.com/content/dam/business/marketing-solutions/global/en_US/site/pdf/cs/linkedin_hearsay_social_case_study_us_en_130314.pdf): hirdetési kampány, nem a saját inboxunk API-jóváhagyása.
- [2024-es közösségi kérdés és válasz](https://stackoverflow.com/questions/78120331/getting-access-to-messages-api-and-invitation-api-on-linkedin-linkedin): a Compliance FAQ-hoz irányít, de az aktuális elsődleges FAQ lezárt programot jelez. Nem bizonyított siker.
- API-t kínáló böngészőautomatizálási szolgáltató marketingje önmagában nem LinkedIn-partnerengedély.

## 6. Javasolt első megkeresés — angol, még nem elküldve

**Subject: Eligibility enquiry — member-initiated replies to personal LinkedIn conversations / My Handler Tool**

Hello LinkedIn Developer Support,

I maintain **My Handler Tool**, a private productivity application currently used only by me, an EEA-based
LinkedIn member. Its read-only integration already uses the official Member Data Portability API to help me
review my own inbox and identify professional enquiries I have not yet answered.

I would like to ask whether there is an approved integration path for replying to **existing personal LinkedIn
conversations** from a local dashboard. This is not Page messaging, advertising, an ATS integration, or a
financial-services compliance product.

The proposed workflow would show an editable reply and its attachments, then require my explicit Send action
for that individual message. It would not provide bulk sending, scheduled messages, connection campaigns, or
autonomous replies. AI assists with triage and drafting; I would provide the relevant processing and provider
details for review. The API-based sending capability has not been implemented.

Your Messages API documentation refers to approved partners. I also understand that the Compliance program
is currently closed to new partners. Could you confirm whether another applicable program, limited pilot, or
approved partner route is available for this specific use case, and refer this enquiry to the responsible team?

If eligible, please advise on the required application materials and agreement, exact permissions, whether a
separate developer app is required alongside my Member Data Portability app, and whether the scope can cover
replies to incoming recruiter InMail and PDF CV attachments. Please also clarify any restrictions on AI-assisted
drafting and combining the authorized read and send workflows.

Application: My Handler Tool
App ID / Client ID: [verify and insert identifier — not the client secret]
Developer/admin contact: [verify and insert contact]

Thank you.

### Miért így?

A valós előny a megválaszolatlan szakmai megkeresések rendezése és a tag kontrolljának megőrzése. Ezt emeljük ki,
nem a spam elleni védelem „kikerülését”. Nem állítunk pénzügyi compliance-tevékenységet, partnerstátuszt,
ügyfélbázist vagy kész biztonsági funkciókat. Egy szűk pilotot kérdezünk meg mint lehetőséget, nem létező
LinkedIn-programként ígérjük. A jobb megfogalmazás a félreértések kockázatát csökkenti; zárt programot nem nyit meg.

## 7. Következő döntési pontok

1. Owner ellenőrzi a tervezetet, a nem titkos app-azonosítót és a kapcsolattartót; külső elküldés külön jóváhagyás.
2. LinkedIn válasza alapján: mely program nyitott, egyéni/internal app jogosult-e, milyen review és szerződés kell.
3. Pozitív előszűrés esetén: célzott anyagok/demó, nem teljes send implementáció ígérete.
4. Hozzáférés csak konkrét apphoz, scope-hoz és felhasználáshoz adott engedéllyel tekinthető igazoltnak.
5. Elutasításkor: egy konkrét tisztázó válasz a hiányzó jogosultságról/feltételről, nem más use-case-nek álcázott új kérelem.

**Továbbra is ismeretlen:** Messages-specifikus felvételi minimumok, nyitott kivételi/pilot program,
partnerdíj, átfutási idő/SLA, PDF/InMail támogatás, MDP/send appok összekapcsolhatósága és AI-adatkezelési feltételek.
Más API-program átfutását vagy követelményeit nem vetítjük rá ezekre.

## 8. Lokál writeback és ellenőrzési nyom

- Az induló szabad keresés (`Messages API|partner.?jog|approved.partner|dsapi|igénylés`, case-insensitive,
  `current`, `__agent`, `__documentations`, Markdown) 6 sort talált 3 fájlban: FR, Hyperplan, CLI runbook.
- Mindhárom kap kutatási pointert; a STATUS LinkedIn-sora kap pontosítást. A kutatás megnyitása nem send-jóváhagyás;
  a meglévő 92%-os read-only Hyperplan és az unread-calibration státusza ettől nem változik.
- Runbook bizonyítéki korrekció: az `auth status` a `cli/src/commands/linkedin.command.ts` szerint konfigurációs
  metaadatot ad, `tokenRead: false`; nem bizonyítja a token grantjeit. A send hiánya a jelenlegi implementáció és
  az igazolt partnergrant hiánya alapján állítható, nem kitalált introspekcióra hivatkozva.
- Nincs szabály-/specifikáció-/reply-template változás; az engedélyezett működés határa változatlan.
  Az Interfood aktív flow-ja és az idegen dirty-worktree változások érintetlenek.
- Nem készült új API-hívás a saját inboxhoz, nem lett token kiolvasva, nem ment ki külső üzenet vagy kérelem.
- Ellenőrzési kör: források termékkörének és frissességének szétválasztása; állítások vs elsődleges dokumentum;
  beküldendő tények vs tervezett funkciók; linkek/pointerek és változási határ. Kódteszt nem releváns ehhez a kutatáshoz.

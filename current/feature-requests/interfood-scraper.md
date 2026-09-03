# FR: Interfood Playwright / scraper integráció

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

## 2026-05-07 — initial

> Illetve jó lenne, ha tudnál majd valamilyen akár Playwright eszközzel,
> akár scraper eszközzel segíteni nekem a kajarendelésben, meg annak a
> nyilván tartásában, hogy mikorra van rendelve, mikorra nincs.
>
> Legrosszabb esetben lehet, hogy azt is megcsinálhatnánk, hogy a
> Playwright eszközzel szépen megnyitod az Interfood oldalát. Egyrészt ott
> be kell lépjek neked, és akkor miután egyszer be vagyok ott lépve, akkor
> ugye meg tudod nézni a rendeléseimet, illetve hogy konkrétan milyen
> kajákat rendeltem, amiket amúgy többnyire meg is eszek, szóval legalább
> az alapján lehet tudni, hogy kb. miket ettem a héten. hogy miket kéne
> egyek, meg hogyan smint.

## Cél

1. **Rendelés-tracking**: melyik napokra van fedett étkezés, melyikre nincs
2. **Mit-evett-eredő**: a ténylegesen megrendelt + általában elfogyasztott
   kaják listája → input a `food-tracking.md` FR-hez
3. **(Opcionális, későbbi)**: automatikus kaja-rendelés az Interfood UI-n át

## 2026-09-01 — menüintelligencia, preferenciák és tápérték

> Na jó, akkor nézzünk itt egy másik fejlesztést.
> Kelleni fog nekem még egy eszköz, amivel majd segíteni fogsz. Nagyon hasonlónak kell lennie, mint a Tesco-s eszközünk, de ez egy interfood-os eszköz lesz.
> Meg kell tudjad nézni a heti menüket, meg megnézni a következő, meg az utáni heti menüket, meg meg kell tudjad nézni, hogy milyen rendeléseket adtam le eddig, illetve majd vezetnünk kell egy kedvenc kaják, kedvenc kajatípusok, preferált kaják, preferált kajatípusok, listát, illetve ez egy bonyolultabb logikai rendszer lesz, mert priorizálnunk kell egyik kaját a másikkal szemben, kelleni fog változatosság is, és aztán későbbiekben fogom kérni majd azt is, hogy próbálj nekem segíteni időnként egészségesek kajákat összeállítani, de ez nem az elsőnek a célja, csak az eszköznek kell tudni, tudnia támogatni például különféle kajáknak a tápértékeinek is a leszedését. hogy azokból tudjunk összeállítani összehasonlításokat. De valószínűleg nem fog kelleni mindent leszedni, hanem először megpróbáljuk majd beazonosítani, hogy melyik kaják érdekesek, illetve melyik az, amelyik még esetleg nem volt azonosítva korábban.
>
> https://rendel.interfood.hu/

**Következmények:**

1. az aktuális + következő két hét menüje egyetlen, lapozás-/hétbiztos művelettel olvasható;
2. a rendeléselőzmény külön, hitelesített és teljes lapozású szinkron;
3. külön kezeljük az egzakt étel-, ételtípus-, kategória- és páronkénti preferenciát;
4. az explicit user-döntés erősebb minden megfigyelésnél vagy következtetésnél;
5. a változatosság a közelmúlt tényleges rendeléseiből számított determinisztikus tényező;
6. a tápérték hiányos is lehet, ezért minden mező nullable és a hiány nem jelent nullát;
7. a teljes heti menü csak cache: a tartósan kurált registry-be az érdekes, választott, új vagy megváltozott ételek kerülnek.

Részletes terv: `__agent/plans/interfood-integration-hyperplan/hyperplan.plan.md`.

## 2026-09-01 — rendelés összeállítása és módosítása kötelező

> A rendelések összeállítására és módosítására is kellenek eszközök.

Ez nem opcionális távoli roadmap, hanem a capability kötelező magja:

1. új rendelési terv létrehozása az elérhető heti menüből;
2. tétel hozzáadása, mennyiség növelése/csökkentése/beállítása, eltávolítás és csere;
3. teljes rendelési terv megjelenítése, napi lefedettség, ár és változtatási diff;
4. távoli kosár beolvasása és egyeztetése a jóváhagyott tervvel;
5. már leadott, még módosítható rendelés részleteinek beolvasása;
6. a módosítás ár-/refund-hatásának előnézete;
7. jóváhagyott módosítás végrehajtása és az új order-state teljes visszaolvasása;
8. részleges vagy bizonytalan eredmény esetén fail-close, újraolvasás és diff — vak retry nélkül.

A rendelési kosár szerkeszthető, visszafordítható draft. Ha a user már kérte az egyértelmű tételek felvételét,
azokat ténylegesen fel kell venni; csak a bizonytalan tételeket kell egyetlen kötegben egyeztetni. A már leadott
rendelés módosítása viszont pénzügyi/refund-hatással járhat, ezért az immutable change-preview-ra külön, friss
jóváhagyás kell. A checkout/fizetés továbbra is külön művelet és külön action-time approval.

## 2026-09-01 — teljes rendeléselőzmény és többszintű sorazonosság

> Illetve azt hiszem felírtad, de azért menjünk biztosra, hogy felírtad el, hogy az én korábbi rendelés infóimat le tudd kérni. mi van leadva, mi nincs leadva, miket adtam le pontosan, stb.
> illetve majd a rendeléseknél alaposan oda kell figyelni arra, hogy ugyanaz a tétel többnyire kétszer jelenik meg egy nap is, ami kisadag, normál adag, kisadag, nagy adag, illetve egy-egy kaja megjelenhet több napon is, és az is előfordulhat, hogy egy napra kétszer rendelünk ugyanazt.

Kötelező következmények:

1. az összes order-history oldalt/cursort be kell járni, nem csak az első oldalt vagy az aktuális hetet;
2. külön kell jelenteni, mely napokra van leadott rendelés, részleges lefedettség vagy semmi;
3. a history-nak pontos tétel-, adag-, dátum-, mennyiség-, ár- és order-state adatot kell őriznie;
4. `foodId` alapján tilos order-line-okat összevonni;
5. ugyanaz az étel kis/teljes/vegyes adagként külön `menuItemId` és külön order-line;
6. ugyanaz az étel külön delivery-date-en külön előfordulás;
7. ugyanazon a napon ugyanabból a menütételből kettő rendelése `quantity=2`, nem egy boolean „rendelve” állapot;
8. deduplikálás kizárólag stabil `orderLineId`/upstream event ID alapján történhet; hiányában összetett kulcs és
   raw fingerprint kell, de mennyiséget akkor sem szabad elveszíteni;
9. a „mi nincs leadva” állapotot az elvárt napi étkezésszám és az aktív, nem törölt order-line quantity-k
   összevetéséből kell levezetni.

## 2026-08-26 — dinamikus rendelési ciklus és rendelési eszköz

> „Ez itt majd egy olyan ismétlődő feladatunk, amihez azt hiszem majd megint
> kelleni fog egy organizer feature request is, mert ez úgy működik, hogy
> két-három hetente ismétlődik, attól függően, hogy meddig adtuk le legutóbb
> a rendeléseket az Interfood kaja rendeléshez. hogy ha két hétre előre adtuk
> el a rendelést, akkor a két hét lejárta előtt, kedd szerdáig le kell adni a
> következő adagot, és annyit adunk le, amennyit csak tudunk. Majd ehhez is
> kell készítenünk egy eszközt is.”

Az eszköz kibővített feladata:

1. belépett munkamenetben visszaolvassa a már leadott rendeléseket;
2. napi szinten meghatározza a `covered | partial | not-covered` állapotot;
3. kiszámolja az utolsó teljesen fedett napot (`coverageEnd`);
4. az utolsó fedett hét kedd–szerda időablakára állítja a következő rendelést;
5. megmutatja, hány hét rendelhető éppen előre, és a maximumot ajánlja;
6. rendelésírás csak ellenőrzött tételekkel és explicit user-jóváhagyással;
7. sikeres leadás után visszaellenőrzi a napokat és frissíti a következő taskot.

## Megoldás-jelöltek

> **Stale / részben felváltva 2026-09-01:** a publikus menüolvasáshoz nem kell Playwright. A lenti korábbi jelölt
> csak a hitelesített rendeléselőzmény/mutáció történeti kiindulópontja.

- **Elsődleges:** Interfood first-party public API → `ma interfood` TypeScript CLI, stabil JSON envelope.
- **Hitelesített réteg:** dedikált persistent UBH browser-profile, egyszeri user-login, háttérben same-origin read.
- Jelszó/cookie/session token nem kerül env-be vagy agent-kontextusba.
- Periodikus check később → JSON output és coverage a my-assistant rendszerbe.

## Adat-séma (vázlat)

```
interfood-day {
  date: YYYY-MM-DD
  status: 'covered' | 'not-covered' | 'partial'
  meals: [{ slot: 'lunch'|'dinner', item: '...', amount: '...' }]
  fetchedAt: ISO
}
```

## Kapcsolódik

- `food-tracking.md` — input forrás (Phase 2-höz közeli)
- `recurring-tasks.md` — Interfood eskalációs görbe automatikusan friss adattal

## Status

🟡 Felvéve megvalósítandó feladatként:
`org:task:6a8ed242deaa21f637fca0fc`. A manuális rendelési task:
`org:task:6a8ed251deaa21f637fca107`.

Az Organizer dinamikus ismétlődési hiányára külön feature request készült:
`feature-request:6a8ed22adeaa21f637fca0f2`.

## Open kérdések

Új kategória — lásd `open-questions.md` "R) Interfood".

## Owner directive — continuous documentation and history learning (2026-09-01)

- Az Interfood-eszköz minden új használati módját, szabályát, tapasztalatát és javítását folyamatosan, ugyanabban a
  munkakörben dokumentálni kell; azt is dokumentáljuk, hogy dokumentálni kell.
- A teljes korábbi rendeléstörténetből mennyiség-, dátum-, rendelés- és adag-tudatos mintákat kell képezni. Az egy
  napra rendelt két adag kiemelt kedvenc-jelölt, de csak user-megerősítés után válhat explicit preferenciává.
- Minél több teljes történeti adat áll rendelkezésre, annál jobb lehet az ajánlás, de az inference soha nem írhatja
  felül a user explicit döntését.

Kanonikus működési kontraktus: `current/principles/interfood-continuous-documentation.md`.

## Owner food/portion decisions — 2026-09-01

- Bolognai: általános névminta szerinti hard reject; túl édes, gyakran kidobásra kerül.
- Kuszkuszos ételeket aktívan keressük és preferáljuk, de a hozzájuk társított nem kedvelt összetevő külön döntés.
- Lasagne és más egyértelműen nagy volumenű/laktató étel: kis adag preferált; burgonyapürés ételek kivételek.
- Milánói: bizonytalan, ezért sem pozitív, sem negatív automatikus besorolást nem kap.
- Csirke: mell/filé preferált; comb és szárny nem kedvelt.
- Hal: a halrudacska csak tartalék jelölt, ha nincs jobb; más halak hátrasorolandók.
- A szombati menü pénteken érkezik és a pénteki választék bővítése, nem külön rendelési nap. A pénteki és szombati
  occurrence-öket együtt kell rangsorolni, az eredeti occurrence-dátum és `menuItemId` megtartásával.
- Marha és sertés nehezebben tolerálható; darált formában elfogadható. A darált forma kivétel, nem önálló kedvenc.
- A rendeléstörténet nagy része valid preferencia-evidencia, mert kísérleti rendelés ritka; owner-korrekció felülírja.
- Minden szállítási napra alapértelmezetten 2 adag kell. Normál esetben két külön étel, de explicit erős
  favorite-ból (például camembert) ugyanaz az exact `menuItemId` rendelhető `quantity=2` mennyiséggel. A kis és teljes
  occurrence ugyanabból az ételből nem számíthat két külön ételnek.
- A desszert és leves opcionális `+ tétel` a napi két főételen felül. Külön kell rangsorolni és megjeleníteni, nem
  számíthat bele a főétel-lefedettségbe. Exact identity legalább öt külön történeti rendelési napon automatikus
  review-jelölt lehet; owner-megerősítés előtt nem válik explicit kedvenccé és nem kerül kosárba.
- Levesből és desszertből is csak explicit owner-confirmed exact-food kedvenc ajánlható. A history-derived erős
  találat is csak `favoriteCandidates` megerősítési jelölt; ismeretlen add-on és változatossági add-on alternatíva
  nincs. Gyümölcsleves hard reject. A változatossági alternatívák a főételekhez tartoznak: külön legfeljebb három
  valószínűleg kedvelt és három teljes tápadatú, mérésalapú egészség-orientált sor, food identity szerint deduplikálva.
- Explicit hét/időtartomány nélküli ajánláskérés alapértelmezett horizontja az összes provider-enabled current/future
  hét. A review coverage-aware: a teljesen lefedett napokat státuszként jelzi és nem javasolja újra; minden lefedetlen
  hét egy közös review-batch-be kerül.
- Az ismeretlen édességet csomagban tartalmazó Varia menü sem kerülhet automatikus főétel-ajánlásba vagy
  alternatívába; a bundled dessert nem kerülheti meg az add-on szabályt.
- Tej és tejszín allergia miatt kerülendő; minden érintett jelöltet látható figyelmeztetéssel kell ellátni, minden
  biztonságos jelölt mögé kell sorolni és egészség-orientált ajánlásból ki kell zárni. Ha jobb híján mégis bekerül,
  a warning nem tűnhet el. Owner-pontosítás 2026-09-02: tejföl, joghurt, túró, vaj és sajt rendben van; csak tej és
  tejszín kerülendő. A korábbi tágabb értelmezés felülírva, történeti nyoma a dátumozott fejlesztési jegyzetben.
- Tortilla, burrito és wrap preferált; gomba fallback, ezért jobb elfogadható jelölt esetén ne válasszuk.
- Soha ne ajánlj 2× olyan exact ételt, amit a user még nem evett. A két főételnél az eltérő identity mellett az
  elsődleges ételcsalád változatosságát is őrizni kell.
- Owner-facing táblázatban egy sor/nap, egy cellában egymás alatt a két főétel, alattuk a kedvenc leves/desszert
  külön `+` soron. Alternatívák ugyanazon táblában másik oszlopban. ID-ket ne mutass a usernek.
- Későbbi owner-döntések: fix ⭐ kedvenc / 🥗 egészségesebbnek szánt / ⚠️ konkrét figyelmeztetés jelölés.
  Minden korrekció után a TELJES többhetes ajánlás újra megjelenik a chatben, nem csak a változás.
  Sajtoknál (camembertnél is) nincs tejjelzés; más érintett ételeknél megmarad. Ez megjelenítési/preferencia-kivétel.
- Krumpli preferált, tészta fallback; brassói, vadas és gyümölcsös hús dislike. Kipróbált tépett csirkés BBQ tortilla
  exact dislike a tortilla családpreferencia ellenére. Rizses/rizottós ételnél tényleges kis adagot keress a korábbi
  camembert/burgonyapüré/csirkepaprikás kivételekkel. Negatív döntést history vagy variety nem semlegesíthet.

Kanonikus indoklás: `current/principles/interfood-food-preferences.md`; gépi SSOT:
`current/interfood/preferences.json`.

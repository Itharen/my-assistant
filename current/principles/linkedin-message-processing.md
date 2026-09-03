# LinkedIn-üzenetek feldolgozási szabályai

> **Állapot:** v1 javaslat, owner-review alatt · **Dátum:** 2026-08-26
>
> Ez a fájl az agentfüggetlen, kanonikus viselkedési szabály. A futtatható folyamat:
> `__agent/flows/on-demand/linkedin-inbox-review/`.

## 1. Cél és határ

A LinkedIn inboxot teljes, lapozott szinkron után beszélgetésenként dolgozzuk fel. A rendszer olvas, osztályoz,
ajánlást és helyi válasz-draftot készít. A személyes Member Data Portability API read-only, ezért a flow nem küld
üzenetet és nem automatizálja a LinkedIn webes felületét.

Üzenettörzs, thread ID és résztvevőlista nem kerül verziókezelt fájlba vagy tartós action-logba. Ezek csak a
felhasználó helyi LinkedIn-cache-ében és az aktuális, kifejezetten kért válaszban jelenhetnek meg.

## 2. A jelenlegi alapfeltételek

A 2026-os ténylegesen elküldött válaszokból rekonstruált defaultok:

| Feltétel | Default | Erősség |
|---|---|---|
| Szerződés | kizárólag contractor / alvállalkozói, céges forma | hard filter |
| Munkavégzés | full remote | hard filter, kivételt csak a user adhat |
| Időbeosztás | rugalmas | hard filter |
| Magyar munkanyelvű, alapvetően magyar csapat | nettó 15 000 Ft/óra | külön hazai díjsáv |
| Angol munkanyelvű vagy nemzetközi csapat | 75 EUR/óra | külön nemzetközi díjsáv |
| Önéletrajz | minden érdemi opportunity-válaszhoz friss fájlként csatolandó | hard send-check |
| Telefon | általában késő délután | csak ha releváns |

A két díjsáv tudatos, kizárólag belső owner-döntés. Egy recruiternek készített válaszban mindig pontosan egy,
az adott lehetőséghez kiválasztott minimumdíj jelenhet meg. A két díjsávot, a köztük lévő különbséget és annak
indokát külső félnek soha nem tárjuk fel. Nem önmagában az üzenet vagy a recruiter nyelve, hanem a tényleges
end-client, a csapat és a napi munkanyelv dönt. Magyar recruiter mögötti angol/amerikai/nemzetközi projekt a
75 EUR/órás díjsávba tartozik. A díj nem csökkenthető és hard feltétel nem puhítható automatikusan.

Az alacsonyabb hazai díjsáv csak akkor használható, ha a megkeresésből, a teljes threadből vagy a linkelt pozíció
adataiból kellő bizonyossággal látszik, hogy a tényleges ügyfél, a csapat, a meetingek és a napi kommunikáció
alapvetően magyar. Ha a besorolás bizonytalan vagy az adatok ellentmondásosak, a védő alapértelmezés a 75 EUR/óra,
és legfeljebb egy, a hiányzó döntő adatra irányuló kérdés kerül a válaszba. Az alacsonyabb díjsáv ilyenkor sem
említhető meg.

**Kötelező nemzetközi override:** igazolt indiai recruiter-, vállalat-, ügyfél- vagy csapatkapcsolat, illetve
igazolt Tata / Tata Consultancy Services / TCS-affiliáció esetén mindig a `75 EUR/óra` nemzetközi díjsáv
használandó. Ez akkor is felülírja a hazai díjsávot, ha a projektet vagy a csapatot magyarországiként mutatják be.
Az affiliációt a megkeresés, a profil, a vállalat vagy a linkelt pozíció explicit adataiból kell igazolni; név,
profilkép vagy feltételezett származás alapján nem szabad besorolni.

### Belső díjsávválasztás — bizonyítékok sorrendje

1. a kötelező nemzetközi override igazolt Tata/TCS- vagy indiai affiliáció esetén;
2. a megkeresésben és a teljes beszélgetésben szereplő explicit tények;
3. a linkelt álláshirdetés, projekt- vagy ügyféloldal explicit adatai;
4. ugyanahhoz a lehetőséghez tartozó korábbi threadek igazolt adatai;
5. a recruiter vagy az üzenet nyelve csak gyenge jel, önmagában nem döntő.

A már ismert adatokat a draft felhasználja, nem kérdezi vissza. Tisztázó kérdés csak akkor kerülhet a válaszba,
ha a hiányzó adat ténylegesen megváltoztathatja a kompatibilitást vagy a díjsávot.

## 3. Kanonikus általános válaszsablonok

### Magyar

```text
Szia [Név],

köszönöm a megkeresést, a lehetőség érdekes lehet. Fő feltételeim: contractor-only, full remote és rugalmas időbeosztás. A minimum díjam [KIVÁLASZTOTT MINIMUMDÍJ]. [CSAK HA SZÜKSÉGES: egy célzott tisztázó kérdés.] Az aktuális CV-met csatoltam; telefonon általában késő délután vagyok elérhető.

Ha ezek megfelelnek, szívesen beszélek a részletekről.

Köszönöm,
Balázs
```

### English

```text
Hi [Name],

Thank you for reaching out — the opportunity could be interesting. My main requirements are contractor-only, fully remote work and a flexible schedule. My minimum rate is [SELECTED MINIMUM RATE]. [ONLY IF NEEDED: one targeted clarification.] I have attached my current CV and am generally available by phone in the late afternoon.

If these conditions fit the role, I’d be happy to discuss the details.

Best,
Balazs
```

Nemzetközi szerződésnél az agent nem teszi hozzá önállóan, hogy `net`, `gross`, `+ VAT` vagy `VAT included`:
ennek jogi/számlázási jelentése országonként eltérhet. Ha szükséges, külön tisztázó kérdés készül.

### Több hónapos késés — bevezető modul

Legalább 60 napos válaszkésésnél az alapüzenet elé kerül. A régi opportunity aktualitására mindig rákérdezünk.

Magyar:

```text
Először is elnézést a késői válaszért — hosszabb szabadságon voltam. Ha a lehetőség még aktuális, érdekes lehet.
```

English:

```text
First, apologies for the delayed response — I was on an extended vacation. If the opportunity is still open, it could be interesting.
```

### Nem saját technológia — transzparencia-modul

C#, Python, Flutter vagy más, a kanonikus core stacken kívüli technológia esetén az alapüzenetbe kerül.

Magyar:

```text
Fontos még, hogy a [TECHNOLÓGIA] nem a fő technológiai területem, de a jelenlegi AI-alapú fejlesztőeszközökkel ezt is le tudom fedni. Jobb, ha ez már az elején egyértelmű.
```

English:

```text
One important note: [TECHNOLOGY] is not part of my core stack, although current AI-assisted development tools allow me to cover it effectively. I prefer to make that clear upfront.
```

## 4. Sablonhasználati szabályok

1. A sablon alap, nem vakon másolandó automatikus válasz.
2. A nyelvet a megkeresés nyelve adja. Vegyes nyelvnél az utolsó érdemi személyes üzenet nyelve dönt.
3. A megszólítás és legfeljebb egy rövid, konkrét mondatrész személyre szabható a szerepkör alapján.
4. Az alapválasz ne legyen 25%-nál hosszabb a kanonikus sablonnál. A késés- és technológia-modul indokolt,
   külön hossz-kivétel; más bővítéshez user-kérés kell.
5. A megkeresésben már egyértelműen megválaszolt adatot ne kérdezzük újra.
6. A megkeresést, a teljes threadet és minden linkelt pozícióoldalt a draft előtt ki kell értékelni. A sablon
   ezekre reagál, nem általános kérdőív.
7. Ha egy hard feltétel biztosan sérül, ne az érdeklődő sablont használjuk, hanem rövid elutasítást vagy célzott
   tisztázó kérdést javasoljunk.
8. Legalább 60 napos késésnél használd a szabadságos bevezetőt, és kérdezz rá, aktuális-e még a lehetőség.
9. Ugyanazon pozíció duplikált megkereséseit egy opportunity-csoportként mutassuk, de külön threadként tartsuk
   nyilván. Az agent javasolja, melyik kapcsolattartónak érdemes válaszolni.
10. Szponzorált, automatizált, adathalász-gyanús vagy irreleváns üzenethez ne készüljön válasz-draft.
11. Telefonszámot, e-mail-címet vagy más érzékeny adatot az agent ne illesszen be automatikusan; a profilra és a
    késő délutáni elérhetőségre hivatkozás az alapértelmezés.
12. A LinkedIn-profilról a CV már nem tölthető le. Ne hivatkozz a profilon elérhető CV-re.
13. Opportunity-t nyitva hagyó személyes válasz csak friss CV-attachmenttel mehet ki. Küldés előtt ellenőrizd a
    fájl létezését és az attachmentet; enélkül a draft `blocked-missing-cv`, és nem állíthatja, hogy csatolva van.
14. Core stacken kívüli technológiát ne rejts el és ne állíts natív szakértelemként. Használd a transzparencia-
    modult, majd külön jelöld a meglévő tapasztalatot és az AI-assisted lefedést.
15. A külső draftban pontosan egy minimumdíj szerepelhet. Tilos mindkét díjsávot, az alternatív díjat vagy az eltérés
    üzleti indokát közölni.
16. A magyar díjsáv csak kellően bizonyított magyar ügyfél-, csapat- és kommunikációs környezetben használható.
    Bizonytalan vagy ellentmondásos helyzetben a 75 EUR/órás védő defaultot használd, és csak szükség esetén tegyél
    fel egy célzott kérdést. Közvetítő recruiter nyelve önmagában nem bizonyíték.
17. Igazolt indiai vagy Tata/TCS-affiliáció kötelező nemzetközi override: mindig 75 EUR/óra, akkor is, ha a csapatot
    magyarországiként írják le. Személy származását név vagy profilkép alapján tilos feltételezni.
18. A közvetlen projektmegbízás vagy konkrét projektmegkeresés `priority-direct-project` kategória. Ezt a normál
    recruiter-megkeresések elé kell sorolni, külön kiemeléssel és egyedi elemzéssel. Projektmegbízásra az általános
    recruiter-sablon használata tilos: minden válasz teljesen egyedi, a konkrét projektre írt szöveg.

## 5. Determinisztikus és szemantikus osztályozás

`needsReply` technikailag akkor igaz, ha a legutolsó nem törölt üzenet inbound. Ez csak jelöltlista. Minden jelöltet
a teljes thread alapján az alábbi egyik kategóriába kell tenni:

- `actionable` — valódi személy, válasz vagy döntés szükséges;
- `priority-direct-project` — közvetlen projektmegbízás vagy konkrét projektmegkeresés; kiemelten és elsőként
  kezelendő;
- `clarification-needed` — hiányzik egy, a kompatibilitást eldöntő adat;
- `closed-no-reply` — elutasítás, köszönet vagy természetesen lezárt beszélgetés;
- `automated-ignore` — szponzorált vagy automatizált tartalom;
- `duplicate-opportunity` — másik megkereséssel azonos lehetőség;
- `snoozed` — a user későbbi időpontra halasztotta;
- `sent-confirmed` — új szinkronban tényleges outbound üzenet bizonyítja a küldést.

Az agent nem állíthatja, hogy egy draft el lett küldve. A `sent-confirmed` kizárólag LinkedInből visszaolvasott
kimenő üzenettel igazolható.

## 6. Kompatibilitási kivonat

Minden valódi megkeresésből ugyanazokat a mezőket kell kinyerni:

- személy és profil-link;
- pozíció/projekt és a megadott álláshirdetés-link;
- megkeresés típusa: recruiter-pozíció vagy közvetlen projektmegbízás;
- contract vagy employee;
- remote/hybrid/onsite és kötelező jelenlét;
- full-time/part-time, heti óraszám és rugalmasság;
- tényleges end-client és szerződő fél;
- a csapat országai/összetétele, a meetingek és a napi kommunikáció nyelve;
- időtartam és kezdés;
- díjazás vagy bérsáv;
- technológiai fókusz;
- közvetlen projektmegbízásnál: konkrét cél/scope, megrendelő, időzítés, budget és következő döntési pont;
- hiányzó döntési adatok;
- ajánlás és rövid indok.

Tény és következtetés külön jelölendő. Bizonytalanság esetén az agent egyetlen összesített kérdéscsomagot ad,
nem áll meg beszélgetésenként.

## 7. Teendő- és review-queue szabály

Egy beszélgetésből legfeljebb egy aktív LinkedIn-teendő lehet. Duplikált megkeresésekből egy közös opportunity-
teendő készül. A teendő címe: `LinkedIn-válasz: [név] — [pozíció/projekt]`; tartalmazza a profil-linket,
kategóriát, ajánlást és draft-állapotot, de nem másolja bele a teljes üzenettörzset.

A feldolgozás állapotsora:

```text
new -> reviewed -> drafted -> owner-approved -> awaiting-manual-send -> sent-confirmed
                  \-> blocked-missing-cv
                  \-> no-reply-needed / automated-ignore / duplicate-opportunity / snoozed
```

Az agent a bizonytalan és jóváhagyandó elemeket egy batch-ben mutatja. Külső küldésre vagy LinkedIn UI-műveletre
ez a flow nem ad engedélyt.

A `priority-direct-project` elemek a batch elején, külön **Kiemelt projektmegkeresések** blokkban jelennek meg.
Mindegyikhez kötelező a projekt tárgyának, megrendelőjének, scope-jának, időzítésének, döntési pontjainak és javasolt
következő lépésének rövid, egyedi kivonata; nem süllyedhetnek a normál recruiter-listába.

## 8. Nyitott TODO-k

- [ ] **Aktuális CV frissítése és stabil lokális attachment-fájl kijelölése.** Organizer task sync pending.
- [ ] **A hazai és nemzetközi contractor díjsávok felülvizsgálata.** Legalább három éve nem változtak; külön
  ellenőrizendő a minimum, a pénznem, az ÁFA/net wording és az éves review cadence. Organizer task sync pending.

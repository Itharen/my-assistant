# 🗓️ MUNKANAPTÁR — `ma calendar today`

**Készült:** 2026-09-11 · **Állapot:** ✅ kész, **egy** owner-kapus lépéssel *(újra-engedélyezés)*

> **Owner, 2026-09-11 12:19:** *„ahhoz, hogy az asszisztensi feladataidat jól el tudd látni,
> ahhoz majd itt egy-két dolgot **előre kell venni**, mint például a **munkanaptár**."*

---

## 🔴 A MÉRT INDOK, amiért ez sürgős

Ma **11:00**-kor mítingje volt az ownernek. A rendszer **csak azt tudta**, hogy *van* egy míting
— mert az owner **szóban** mondta. ⛔ **Kivel · miről · milyen platformon: semmi.** Az ébresztés
lefutott, a **felkészítés** nem — pedig az a nagyobb érték. *(12:19-kor megismétlődött.)*

## ⭐ MIÉRT NEM ZÖLDMEZŐS — a mérés

| Amit mértünk | Hol |
|---|---|
| A Google OAuth **desktop-flow** *(PKCE + loopback + token-fájl + refresh)* **már él** | `cli/src/email/email-google-oauth.service.ts` |
| A scope-lista **egy helyen** bővíthető | `GMAIL_OAUTH_SCOPES` *(ugyanott)* |
| Az érvényes token **automatikus refresh-sel** megkapható | `getEmailGoogleAccessToken(account)` |
| A **megadott engedélyek** kiolvashatók | `getEmailGoogleAuthStatus(account).scopes` |

⇒ Ezért a munka **+1 scope + vékony kliens + EGY parancs** volt, ⛔ nem új integráció.

---

## A parancs

```bash
ma calendar today                                  # a mai nap
ma calendar today --day 2026-09-12                 # más nap (HELYI időben)
ma calendar today --account default                # másik fiók (alapérték: default)
ma calendar today --json --pretty                  # gépi kimenet
```

**Amit ad:** kezdés, vége, cím, helyszín **vagy hívás-link**, résztvevő-szám.

⛔ **AMI SZÁNDÉKOSAN NINCS** *(a feladat szó szerinti tiltása, `one-function-is-enough`)*: írás,
ismétlődés-szabály, felület, értesítés, több naptár egyesítése. Azok **külön** tételek.

---

## 🔴 A KÉT KIKÖTÉS, ÉS HOGY HOL TELJESÜL

### 1. Hiányzó/lejárt engedélynél KIMONDOTT hiba — ⛔ nem üres lista

> *„az üres naptár és a nincs-jogosultság kívülről ugyanúgy néz ki."*

| Kód | Mikor | Mit mond |
|---|---|---|
| `MA-CALENDAR-AUTH-REQUIRED` | nincs token | *„a naptár NEM olvasható (⛔ ez nem azt jelenti, hogy üres a napod)"* + a parancs |
| `MA-CALENDAR-SCOPE-MISSING` | van token, **nincs** naptár-scope | ugyanaz + a **hiányzó scope** + a **megadott** scope-ok |
| `MA-CALENDAR-READ-FAILED` | HTTP-hiba | a státusz + a válasz-részlet; 401/403-nál újra-engedélyezést javasol |

⭐ **A teendő a hiba `message`-ében IS ott van**, nem csak egy külön mezőben — mert a hívók
többsége `error.message`-et ír ki *(`calendar.error.ts`)*.

⚠️ **A scope-ellenőrzés a hálózati hívás ELŐTT fut** — enélkül a Google `403`-at adna, amit a
hívó *„valami elromlott"*-ként látna, pedig a teendő pontosan tudható.

🔴 **Az üres nap is MONDATOT kap:** *„a naptár OLVASHATÓ volt, és a napon NINCS esemény."*
⇒ A csend így nem tűnik hibának, és a hiba nem tűnik csendnek.

### 2. Forrás-független beolvasás

A szerződés **egy fájl:** `cli/src/calendar/calendar-reader.contract.ts`. Aki új forrást hoz
*(Microsoft 365, `.ics`)*, **csak** azt az egy `readDay`-t valósítja meg — a nap-határ, a
sorrend, a formázás és a hibajelzés **felette** van és **változatlan**.

🙋 **Nyitott owner-kérdés:** a munkanaptár Google vagy Microsoft? ⚠️ **Nem blokkolja a munkát** —
a parancs felülete és a kimenet alakja **mindkét esetben azonos**.

---

## A rétegek

| Fájl | Mit tesz |
|---|---|
| `cli/src/calendar/calendar.models.ts` | `CalendarEvent` — **egy** forrás-független alak |
| `cli/src/calendar/calendar-reader.contract.ts` | a **cserélhető** olvasó szerződése |
| `cli/src/calendar/calendar-day.ts` | nap-határ *(helyi, félig zárt)*, sorrend, formázás — **tiszta** döntések |
| `cli/src/calendar/calendar-google.reader.ts` | a Google-olvasó a **meglévő** OAuth-on |
| `cli/src/calendar/calendar-day.service.ts` | határ → olvasó → sorrend → sorok + **kimondott** összegzés |
| `cli/src/calendar/calendar.error.ts` | `CalendarToolError` — kód + **teendő** |
| `cli/src/commands/calendar.command.ts` | a parancs *(⛔ `catch` nélkül — a hiba átmegy)* |

---

## ⚠️ MÉRT BUKTATÓK

### A fiók neve `default` — ⛔ NEM `primary`

🔴 **Élő proba, 12:45:** `primary`-vel a parancs `MA-EMAIL-CONFIG-MISSING`-gel állt le, mert
olyan fiók **nem létezik** *(a konfigurációban `default` és `sandbox` van)*.
⭐ **A tévedés oka NÉVÜTKÖZÉS:** a Google-oldalon a **naptár** azonosítója `primary` — az
**más dolog**, mint a mi fiók-nevünk. Teszt őrzi.

### A scope bővítése NEM ad jogot a MEGLÉVŐ tokennek

A `GMAIL_OAUTH_SCOPES` kiegészítése után a **már kiadott** token **változatlan**.
🔴 **Élő proba, 12:47** — pontosan ez az állapot:

```
MA-CALENDAR-SCOPE-MISSING
grantedScopes: gmail.readonly, gmail.send
missingScope:  calendar.readonly
```

🙋 **AZ EGYETLEN OWNER-KAPUS LÉPÉS:** `ma email auth --account default` — böngészőt nyit, és az
owner **kattintó jóváhagyása** kell hozzá. Amíg ez nem történt meg, a naptár-olvasás
**kimondott hibát** ad *(⭐ pontosan ahogy kell)*, ⛔ nem üres napot.

### A parancsot be KELL írni az engedélyezési listába

🔴 **Mért csapda (2026-09-08):** a `comm voice-funnel` **593 zöld teszt** és zöld `tsc` mellett
**futásidőben nem létezett**, mert kimaradt a `main.ts` `COMMAND_TREE`-jéből.
⇒ Ezért van rá **külön teszt** *(`calendar.command.spec.ts`, 6 állítás)* és **élő proba**.
**Pozitív kontroll:** a regisztráció elrontásával a teszt **elbukott**.

---

## Igazolás

| Mit | Eredmény |
|---|---|
| CLI-tesztek | **1075 / 1075** zöld *(+53 új a naptárra)* |
| `tsc --noEmit` | tiszta |
| Pozitív kontroll ×2 | regisztráció kivéve → **1 bukás**; scope-ellenőrzés kivéve → **2 bukás** |
| Élő proba | `ma calendar --help` fut; `ma calendar today` → `MA-CALENDAR-SCOPE-MISSING`, kilépési kód **1** |
| `dc rev` | 2410 → **2397** *(a saját 13 találatomat javítottam)* |

⚠️ **Egy ismert találat marad:** `no-plain-function-export` a parancs-fájlon. ⭐ **Mérve:**
ugyanez a találat **mind a 31 többi** parancs-fájlon rajta van *(`cli/src/commands/`)* — a
szabály a parancs-réteg **egészére** vonatkozó, meglévő adósság. Egyetlen fájlban eltérni
**két konvenciót** hozna ugyanabba a mappába *(`core-patterns-first`)*, ezért a döntés
**owner/architektúra szintű**, ⛔ nem egy fájlon belül eldönthető.

⛔ **Amit NEM tudunk igazolni, amíg az owner nem engedélyez újra:** a **sikeres** olvasás
*(valódi eseményekkel)*. A hiba-ág **élesben igazolt**, a happy path **tesztekkel**.

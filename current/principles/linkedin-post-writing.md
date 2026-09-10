# 🖊️ A LinkedIn-posztok írásának szabályai — az owner szó szerinti irányelvei

> **Owner, 2026-09-11 01:46:** *„most csak befogom dobni neked inboxba a jelenlegi terveket, meg
> azt, hogy eddig milyen szabályok alapján készítettem a posztokat."*
> **Forrás:** `__agent/inbox/linkedin-post-guide.md`, beérkezett 2026-09-11 01:48.

⭐ **Ez az ő szövege, SZÓ SZERINT.** ⛔ Nem fogalmazom át, nem „strukturálom" — ugyanaz az
osztály, mint a többi alaptézis *(`CLAUDE.md`: „olyan formában, ahogy a user leírta")*.
Ha ellentmond bármelyik saját megszokásomnak, **ez nyer**.

---

## 📜 AZ EREDETI SZÖVEG — érintetlenül

A posztírási irányelvek:

**Formátum**

* Magyar cím előre, csak neked.
* Utána: **English post:**
* Maga a poszt angolul.
* Ne legyen text blockban, csak sima szövegként.

**Stílus**

* rövid
* tömör
* emberi
* természetes LinkedIn-hang
* ne legyen AI-generált szaga
* ne legyen túl általános
* ne legyen okoskodós
* ne legyen túl hosszú
* ne legyen túlírt / túlmagyarázott
* legyen benne konkrét tapasztalat vagy konkrét tanulság
* B2B-kompatibilis legyen
* founder / operator / senior engineering hang
* technikai mélység érződjön, de ne legyen belső specifikációs részletességű

**Tartalmi szabályok**

* Ne legyen panaszkodós.
* Ne legyen túl arrogáns.
* A bizonytalanságokat, failures részeket csak akkor használjuk, ha erős tanulság lesz belőlük.
* Ne tegyünk bele olyan részletet, ami gyengíti a profil pozicionálását.
* A konkrét tool/providerek említhetők, de ne legyen sima tool-szidás.
* Ne legyen túl sales-es, inkább szakmai tapasztalatból induljon.
* A posztok mutassák a profizmust, ne a vívódást.

**Képgeneráló promptok**

* Csak azokhoz adunk képet, ahol tényleg hozzáad.
* Ha generikus AI-stock kép lenne, inkább nincs kép.
* Prompt text blokkban legyen, hogy könnyen másolható legyen.
* Legyen benne:

  * no readable text
  * no logos
  * premium B2B tech aesthetic
  * cinematic / clean engineering visual
  * dark modern tech style, ha illik hozzá.

---

## 🔗 Hogyan illeszkedik a rendszerbe

| Lépés | Állapot |
|---|---|
| **olvasás** — a korábbi posztok | ✅ **működik**: hivatalos API, `MEMBER_SHARE_INFO` domain, **48 poszt** *(2026-03-26 … 2026-08-25)*, a `ShareCommentary` mezőben a teljes szöveg |
| **piszkozat** — én készítem elő | ⏳ a `reply draft` mintájában: lokális, ⛔ magától sosem megy ki |
| **felület** — ahonnan posztol | ⏳ `__agent/TASKS.md` T-73 |
| **kiküldés** | ⛔ a hivatalos API-n **nincs küldés-scope** ⇒ UBH vagy kézzel |

⭐ **A 48 meglévő poszt a legjobb kalibráció**, ami létezik: ezek a szabályok **leírják** a hangot,
a posztok pedig **megmutatják**. Piszkozat előtt a kettőt együtt kell nézni.

⚠️ **Amit ebből magamra is értek:** *„ne legyen AI-generált szaga"*, *„ne legyen túlírt /
túlmagyarázott"*, *„ne legyen okoskodós"*. Ezek pontosan azok a hibák, amiket a saját
üzeneteimben is javítok *(`discord-message-style.md`)*.

Kapcsolódó: [[cv-writing]] *(ugyanaz a kettős célközönség)* · [[discord-message-style]] ·
`__agent/TASKS.md` T-72, T-73.


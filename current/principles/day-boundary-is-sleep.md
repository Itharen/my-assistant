# 🛌 A NAPOKAT AZ ALVÁS VÁLASZTJA EL, NEM AZ ÉJFÉL

> **Owner, 2026-09-11 01:06 (szó szerint):** *„Az én olvasatom szerint a napokat az alvás
> választja el egymástól, nem pedig az éjfél. Szóval azt kell figyeljed, hogy mióta vagyok ébren,
> és mikor aludtam utoljára, illetve mikor alszom, majd az elválasztási pontok, ezt fel is
> írhatod szabálynak, hogy ha ilyenkor hajnalban beszélek valamiről, akkor még általában, ha
> mára gondolok az előző nap, hogyha meg holnapra, akkor az ugyanaz a nap lesz valószínűleg.
> Kicsit össze-vissza élek, hol így, hol úgy. Többnyire szeretek az éjszakában élni hajnalban,
> de előfordul, hogy bizonyos mítingek vagy ügyintézés miatt korábban kelek, fekszem."*

⭐ **Ez egy ÉRTELMEZÉSI szabály:** a naptár nem változik, csak az, hogy **mit ért ő** „ma"-n és
„holnap"-on. A `date` továbbra is kötelező *(`time-must-be-measured.md`)* — de a **fordítás** ez.

---

## A fordítási tábla — hajnalban (kb. éjfél és a lefekvése között)

| Amit MOND | Amit ÉRT | Naptárilag |
|---|---|---|
| **„ma"** | a most futó ébrenléte *(ami tegnap kezdődött)* | **az ELŐZŐ naptári nap** |
| **„holnap"** | az alvás UTÁNI ébrenlét | **UGYANAZ a naptári nap**, amiben épp vagyunk |
| **„tegnap"** | az eggyel korábbi ébrenlét | két naptári nappal korábban is lehet |

### 🔴 A mérendő horgony — ⛔ nem a `date` önmagában

```
1. mikor aludt utoljára / mióta van ébren?
2. a mostani beszélgetés az ébrenlét MELYIK szakaszában van?
3. csak EZUTÁN fordítom a "ma / holnap"-ot naptári dátumra
```

⚠️ **Nem szabályos ciklus:** *„kicsit össze-vissza élek, hol így, hol úgy."* ⇒ ⛔ **Tilos
kiszámolni** a 18/8-as ciklusból *(`sleep-system.md`)* és ténynek venni. A ciklus **becslés**;
ha az időpont **következménnyel jár** *(emlékeztető, foglalás, határidő)*, a becslést **ki kell
mondani** neki, hogy egy szóval javíthassa.

## ✅ Mért alkalmazás — 2026-09-11 00:55

> *„holnap eszembe kéne juttasd még olyan 3-4-5 körül, hogy ki kell szaladjak a boltba"*

**00:55-kor** mondta, tehát hajnalban, ébren. A szabály szerint a „holnap" = **ugyanaz a naptári
nap** ⇒ az emlékeztető **2026-09-11 15:00**-ra ment
*(`org:task:6aa335f1766c802935c3c2a4`)*, és a feltevést **kiírtam neki**, hogy javíthassa.
⭐ 01:06-kor **megerősítette** a szabállyal, hogy ez volt a helyes olvasat.

## Amit ez NEM ír felül

- ⛔ A naptári dátumozás a **rendszerben** marad ISO és naptári *(fájlnevek, `dueDate`, log)* —
  ez a szabály a **beszéd értelmezéséről** szól, nem a tárolásról.
- ⛔ Az esemény-időpontok *(míting, ügyintézés, nyitvatartás)* **naptáriak** — a kínai
  19:00-ig van nyitva, függetlenül attól, hogy ő hol tart az ébrenlétében.

Kapcsolódó: [[sleep-system]] · [[time-must-be-measured]] · [[recording-discipline]]

---

## ⏰ ESEMÉNY-ELŐKÉSZÍTÉS: az ONLINE míting is igényel ELŐTTE-időt

> **Owner, 2026-09-11 02:45:** *„online meeting, úgyhogy **felébredek és bezuhanok a meetingre**,
> az is működik. Persze azért **jó lenne egy fél órával előtte felkelni**."*

⭐ **A tanulság:** az „online" a **odajutást** nulláza, ⛔ **nem az előkészületet**.

| Esemény-típus | Amit be kell terveznem |
|---|---|
| **helyszíni** | ébredés + készülődés + **odajutás** *(és a késés kockázata)* |
| **online** | ébredés + **fél óra készülődés** — ⛔ az odajutás elmarad, a fél óra **nem** |

📌 **A gyakorlat, ami ebből következik:** minden eseményhez **két** bejegyzés kell —
maga az esemény, és **egy ébresztő/készülődés-tétel** a megfelelő idővel előtte.
⛔ Az esemény önmagában nem elég: az **11:00-kor** szól, amikor már ott kellene lennie.

**Mért alkalmazás — 2026-09-11:**

| Tétel | Ref |
|---|---|
| 📅 míting 11:00, **online** | `org:task:6aa34e92766c802935c3c6b7` |
| ⏰ **ébresztő 10:30** | `org:task:6aa34f65766c802935c3c6be` *(prio 210 — magasabb, mint magáé az eseményé)* |

⚠️ **Az ébresztő prioritása SZÁNDÉKOSAN magasabb**, mint az eseményé: az esemény már csak
**tény**, az ébresztő az, ami **még befolyásolható**.

Kapcsolódó: [[sleep-system]] · `__agent/flows/recurring/schedule-guardian/`


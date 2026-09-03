# linkedin-inbox-review / triage

Minden technikai jelöltet a teljes beszélgetés alapján osztályozz a kanonikus kategóriák egyikébe.

## Sorrend

1. Automata/szponzorált/adathalász-gyanús?
2. Természetesen lezárt vagy válasz nélküli köszönet/elutasítás?
3. Ugyanaz az opportunity már másik threadben szerepel?
4. Valódi személyes megkeresés?
5. Megvannak a kompatibilitási mezők?
6. Mely hard feltétel teljesül, sérül vagy ismeretlen?
7. Mit állít explicit módon a megkeresés, a teljes thread és a linkelt pozíció a tényleges end-clientről, a csapat
   összetételéről és a napi/meeting munkanyelvről?
8. Van explicit indiai recruiter-, vállalat-, ügyfél- vagy csapatkapcsolat, illetve Tata/TCS-affiliáció? Ha igen,
   kötelező az `international-protective` rate profile, a magyarországi csapatleírástól függetlenül.
9. Közvetlen projektmegbízásról vagy konkrét projektmegkeresésről van szó? Ha igen, kategória:
   `priority-direct-project`, és kötelező a kiemelt, egyedi projektkivonat.
10. A bizonyítéksorrend alapján melyik egyetlen belső rate profile alkalmazandó: `domestic-hu` vagy
   `international-protective`? Ismeretlen/ellentmondásos adatnál az utóbbi a default.
11. Core stacken kívüli technológia szerepel? Ha igen, melyik és milyen tényleges tapasztalat bizonyítható?
12. Eléri a válaszkésés a 60 napot?

## Ajánlási szintek

- `reply-recommended` — nincs ismert hard konfliktus;
- `priority-review` — közvetlen projektmegbízás; a batch elején, külön kiemeléssel és egyedi elemzéssel;
- `clarify-first` — egy-két döntő adat hiányzik;
- `decline-recommended` — biztos hard konfliktus;
- `no-reply-needed` — lezárt vagy automata;
- `owner-decision` — a technikai adatok alapján több ésszerű út marad.

Az ajánlás mellett egy mondatban mindig szerepeljen a döntő ok. Feltételezett tényt ne használj; az ismeretlen
mező maradjon `unknown`. A belső rate profile és a választását alátámasztó bizonyíték rögzíthető a review-ban, de
a másik díjsáv és a díjkülönbség indoka nem kerülhet a recruiternek szánt szövegbe.

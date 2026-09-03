# linkedin-inbox-review / _intake

## Input

Ha a user nem ad mást:

- időablak: az aktuális időpont mínusz 3 naptári hónap;
- cél: valódi, választ igénylő személyes megkeresések;
- nyelv: az utolsó érdemi inbound üzenet nyelve;
- feltételek és sablonok: `current/principles/linkedin-message-processing.md`;
- output: minden bizonytalan elem egyetlen összesített review-batch-ben.

## Kötelező ellenőrzés

1. `ma linkedin doctor --pretty`
2. `ma linkedin inbox sync --pretty`
3. Ellenőrizd, hogy van teljes bootstrap-cache; hiányzó cache nem jelent üres inboxot.
4. Olvasd el a teljes threadet, majd nyisd meg és értékeld a megkeresésben szereplő pozíció-, projekt- és
   ügyféllinkeket. Az ott már megtalálható adatot ne kérdezd vissza.
5. Válaszd ki belsőleg az egyetlen alkalmazandó díjsávot a kanonikus bizonyítéksorrend alapján. A recruiter/üzenet
   nyelve önmagában nem választ díjsávot, és külső draftban soha nem jelenhet meg mindkét díj.
6. Ellenőrizd az explicit indiai vagy Tata/TCS-affiliációt. Találat esetén alkalmazd a kötelező nemzetközi
   override-ot akkor is, ha magyarországi csapat szerepel; származást név vagy profilkép alapján ne feltételezz.
7. Azonosítsd a közvetlen projektmegbízásokat és konkrét projektmegkereséseket; ezeket jelöld
   `priority-direct-project` kategóriával, és készítsd elő a batch elejére.
8. Ellenőrizd az aktuális CV attachment-fájl létezését és frissességét. Hiány esetén a draft blokkolt.
9. Számítsd ki a válaszkésést. Legalább 60 napnál aktiváld a szabadságos bevezető modult.

## Kérdés csak valódi bizonytalanságnál

Ne kérdezz lépésenként. A teljes feldolgozás után egy batch-ben kérdezd meg kizárólag azt, ami a döntést
megváltoztatja: például tisztázatlan ügyfél-/csapatkontextus, remote kivétel, technológiai érdeklődés vagy
duplikált kapcsolattartó. A saját minimumdíjat közölni kell, nem a recruitertől kell megkérdezni.

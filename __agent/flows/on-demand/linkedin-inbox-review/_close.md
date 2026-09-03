# linkedin-inbox-review / _close

1. A döntött elemek kapják meg a megfelelő lokális review-állapotot.
2. Jóváhagyott szöveg `ma linkedin reply draft` segítségével a user-local cache-be menthető.
3. Küldésre kész státusz előtt ellenőrizd a friss CV-fájlt és a tényleges LinkedIn attachmentet. Hiány esetén
   `blocked-missing-cv`; az üzenet nem állíthatja, hogy a CV csatolva van.
4. Ellenőrizd, hogy a külső válasz pontosan egy minimumdíjat tartalmaz, nem fedi fel a másik díjsávot vagy a
   különbség indokát, és nem kérdez vissza a megkeresésből/threadből/linkelt pozícióból már ismert adatot.
5. Ellenőrizd, hogy minden igazolt indiai vagy Tata/TCS-affiliáció a nemzetközi díjsávot kapta, és minden
   `priority-direct-project` elem a batch elején, külön projektkivonattal szerepel.
6. Ha a user teendőt kér, conversation/opportunity-nként legfeljebb egy task készüljön profil-linkkel és
   draft-állapottal, teljes üzenettörzs nélkül.
7. Az action-logba csak aggregátum kerüljön: vizsgált/actionable/ignored/drafted/approved darabszám.
8. A manuális küldés után a következő `inbox sync` igazolja az outbound üzenetet; csak ekkor lehet
   `sent-confirmed`.
9. A flow maradjon `awaiting-input`, amíg az owner-review batch nyitott; lezáráskor a STATUS visszaállítható.

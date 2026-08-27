# Stock items — itthoni készlet

Strukturált stock-tábla. Szabályok: `current/principles/stock-system.md`.

> **Mezők:** `targetQty` = ideálisan ennyi van itthon. `reorderThreshold` = ha
> ennyi vagy kevesebb, **bevásárló-listára kerül**. `reorderQty` = ekkor ennyit
> veszünk. `currentQty` = most hány van (TBD = még nem mértük fel).
>
> **Default pattern (2026-05-07):** target=3, threshold=2, reorder=2 ("4-re
> dúsítunk"). Lásd `current/principles/stock-system.md`. A táblákban "default"
> jelölés = ezekkel az értékekkel. A `currentQty` továbbra is TBD, mert nem
> mértük fel.

> **Backup/mirror szabály (2026-08-23):** az organizer a célrendszer, de minden
> készletadatot a jelen fájlba is tükrözünk. Az alábbi legfrissebb snapshot
> felülírja az ugyanazon tételről lentebb szereplő korábbi, történeti adatot.

> **Tesco-terméklenyomat (2026-08-24):** a numerikus product ID önmagában nem
> elég. Megőrizzük a teljes terméknevet, márkát, változatot, kiszerelést és a
> döntő megkülönböztető tulajdonságokat is. A közvetlen termékoldal mindig
> `https://bevasarlas.tesco.hu/shop/hu-HU/products/{productId}`. Így ID- vagy
> URL-változás esetén név és attribútumok alapján újraazonosítható a termék.

## Megerősített Tesco-termékazonosítók

| Stock item | Tesco product ID | Tesco pontos terméknév | Megkülönböztető attribútumok | Megerősítve | Megjegyzés |
|---|---|---|---|---|---|
| Alpro vaníliás szójaital | `209847121` | Alpro vaníliaízű szójaital hozzáadott kalciummal és vitaminokkal 1 l | vanília; szója; 1 l; kalcium + vitaminok | 2026-08-23 | A 10 db a 2026-08-23-i rendelési mennyiség volt, nem állandó preferencia. |
| Ceres vajas toast kenyér | `2004008932200` | Ceres vajas toast kenyér 500 g | Ceres; vajas toast; szeletelt; 500 g | 2026-08-23 | A stock-bejegyzés pontos neve és kiszerelése egyetlen Tesco-termékkel egyezett. |
| HELL White Peach energiaital | `121302824` | HELL ZERO fehér őszibarackízű energiaital 250 ml | Zero / cukormentes; fehér őszibarack; 250 ml | 2026-08-25 | User által megerősítve; élő kosárban visszaellenőrizve. Korábbi termékoldal-URL alias: `2004121302824`; a DOM/kosár kanonikus ID-ja `121302824`. |
| Primavera víz | `121233911` | Primavera szénsavmentes természetes ásványvíz 2 l | szénsavmentes; 2 l | 2026-08-27 | User által megerősítve. Stock-egység: 1 zsugor = 6 palack. |
| Mizse víz | `121233675` | Mizse szénsavmentes természetes ásványvíz 1,5 l | szénsavmentes; 1,5 l | 2026-08-27 | A változatot a user megerősítette; élő Tesco-katalógusban visszaellenőrizve. Stock-egység: 1 zsugor = 6 palack. |
| Tchibo Espresso Sicilia Style szemes kávé | `210408830` | Tchibo Espresso Sicilia szemes, pörkölt kávé 1 kg | szemes; Sicilia; 1 kg | 2026-08-23 | Egyértelmű márka-, változat- és kiszerelés-egyezés. |
| Abonett szendvics | `220318949` | Abonett gluténmentes sajtos-snidlinges szendvics 26 g | sajtos-snidlinges; szendvics; 26 g | 2026-08-23 | Egyetlen snidlinges Abonett szendvics a Tesco-katalógusban. |
| Alpro karamellás puding | `220299326` | ALPRO krémes karamellás desszert 125 g | karamellás; desszert; 125 g | 2026-08-23 | Egyetlen Alpro karamellás desszert-egyezés. |
| C-vitamin pezsgőtabletta | `107282289` | Tesco Pro Formula citromízű pezsgőtabletta cinkkel és C-vitaminnal 20 db 80 g | Pro Formula; C-vitamin + cink; 20 db | 2026-08-23 | Preferált márka elérhető; nem kellett Plusssz fallback. |
| Kalcium pezsgőtabletta | `107282210` | Tesco Pro Formula narancsízű pezsgőtabletta kalciummal, D-vitaminnal és K-vitaminnal 20 db 80 g | Pro Formula; kalcium + D/K-vitamin; 20 db | 2026-08-23 | Preferált márka elérhető; nem kellett Plusssz fallback. |
| Multivitamin pezsgőtabletta | `107280346` | Tesco Pro Formula Multivitamin narancsízű, étrend-kiegészítő pezsgőtabletta 20 db 80 g | Pro Formula; multivitamin; 20 db | 2026-08-23 | Preferált márka elérhető; nem kellett Plusssz fallback. |
| Président sós vaj | `220220272` | Président sós vaj 200 g | Président; sós; 200 g | 2026-08-24 | User által kötegben jóváhagyva. |
| Fanta bodza | `121217885` | Fanta zéró cukor citrom- és bodzaízű energiamentes szénsavas üdítőital édesítőszerekkel 1,75 l | Zero; citrom-bodza; 1,75 l | 2026-08-24 | Egyetlen pontos bodzás Fanta; user által jóváhagyva. |
| Cherry Coke | `121254765` | Coca-Cola Cherry zéró cukor cola- és cseresznyeízű energiamentes szénsavas üdítőital 1,75 l | Zero; Cherry; 1,75 l | 2026-08-24 | A tartós „mindig Zero” szabály alapján. |
| Kóla | `121218435` | Coca-Cola zéró cukor colaízű energiamentes szénsavas üdítőital édesítőszerekkel 1,75 l | Zero; 1,75 l | 2026-08-24 | A tartós „mindig Zero” szabály alapján. |
| Sprite | `121217983` | Sprite zéró cukor citrom- és limeízű energiamentes szénsavas üdítőital édesítőszerekkel 1,75 l | Zero; citrom-lime; 1,75 l | 2026-08-24 | A tartós „mindig Zero” szabály alapján. |
| Fanta narancs | `121218354` | Fanta zéró cukor energiamentes narancsízű szénsavas üdítőital édesítőszerekkel 1,75 l | Zero; narancs; 1,75 l | 2026-08-24 | A tartós „mindig Zero” szabály alapján. |
| Xixo barackos tea | `121225512` | XIXO Ice Tea Zero őszibarackos jegestea 1,5 l | Zero; őszibarack; 1,5 l | 2026-08-24 | A tartós „mindig Zero” szabály alapján. |
| Tonik | `121217228` | Kinley Tonic Water Zéró cukor energiamentes szénsavas üdítőital édesítőszerekkel 1,5 l | Zero; tonik; 1,5 l | 2026-08-24 | A tartós „mindig Zero” szabály alapján. |
| Gyömbér | `121217205` | Kinley Ginger Ale Zéró cukor energiamentes szénsavas üdítőital édesítőszerekkel 1,5 l | Zero; ginger ale / gyömbér; 1,5 l; természetes aromák | 2026-08-24 | User közvetlen terméklinkkel javította a korábbi nem-Zero `121217995` jelöltet. |
| Rovarirtó | `209762301` | Protect csótány- és hangyairtó aeroszol 400 ml | Protect; kifejezetten csótány és hangya; aeroszol; 400 ml; gyorsan hat; hatását több hétig megőrzi | 2026-08-24 | A korábbi `209762257` Protect Extra téves azonosítását a user közvetlen linkkel javította. |
| Rántott camembert | `120537295` | Nádudvari gyorsfagyasztott rántott camembert sajt 350 g | Nádudvari; gyorsfagyasztott; rántott camembert; 350 g | 2026-08-24 | Termékazonosság megmarad; a user közben vett belőle, ezért a mostani rendelésből kihagyandó. |
| Carte d'Or tiramisu jégkrém | `105010828` | Carte d'Or Jégkrém Tiramisu 825 ml | tiramisuízű; kávés szósz 18%; kávés piskótatallér 3%; 825 ml | 2026-08-24 | User jóváhagyta; a mostani rendelésbe 1 db kell. |
| Szeletelt sajt | `220343486` | Tesco Edam szeletelt sajt 300 g | Tesco; Edami; szeletelt; 300 g | 2026-08-24 | A user a Gouda helyett az Edamit választotta. |
| Alpro csokis puding | `210736575` | ALPRO ördögien sötét étcsokoládés desszert 125 g | Alpro; étcsokoládés; desszert; 125 g | 2026-08-24 | User közvetlen terméklink alapján megerősítette. |
| Vajkrém | `210552687` | Nádudvari E-mentes snidlinges vajkrém 180 g | Nádudvari; E-mentes; snidlinges; 180 g | 2026-08-24 | User közvetlen terméklink alapján megerősítette. |
| Szójaszósz | `120256747` | Kikkoman természetesen érlelt szójaszósz csökkentett sótartalommal 150 ml | Kikkoman; természetesen érlelt; csökkentett sótartalmú; mesterséges színező és ízesítő nélkül; 150 ml | 2026-08-24 | User közvetlen linkkel megerősítette; közben vett 1 üveggel, ezért a mostani rendelésből kihagyandó. |
| Felvágott — fallback | `205959255` | PICK sertés párizsi, pultos | PICK; sertés párizsi; pultos; súlyra rendelhető | 2026-08-24 | Csak fallback: minden rendelésnél előbb a user által „Delco paprikás sonka” néven megadott elsődleges terméket kell keresni; ez az esetek kb. 90%-ában nem kapható. |
| Papírtörlő / kéztörlő | `111270024` | Springforce 2 rétegű papírtörlő 4 tekercs | Springforce; 2 rétegű; 4 tekercs | 2026-08-24 | User link alapján megerősítette. |
| Sampon | `209515020` | Garnier Fructis Pure Fresh sampon gyorsan zsírosodó hajra 400 ml | Garnier Fructis; Pure Fresh; gyorsan zsírosodó hajra; 400 ml | 2026-08-24 | User link alapján megerősítette. |
| Szóda | `121229698` | Szentkirályi extra dús természetes ásványvíz 1,5 l | Szentkirályi; extra dús; szénsavas; 1,5 l | 2026-08-27 | User az 1,5 literes változatot megerősítette. Stock-egység: 1 zsugor = 6 palack. |
| Fagyasztott mini pizza | `120560507` | Buitoni Piccolinis háromsajtos mini pizza 9 × 30 g | Buitoni; Piccolinis; háromsajtos; 9 darab; 30 g/db | 2026-08-24 | User megerősítette. |
| Fagyasztott sajtos mini burek | `105004749` | Bella gyorsfagyasztott sajtos mini burek 480 g | Bella; gyorsfagyasztott; sajttal töltött mini burek; 480 g | 2026-08-24 | User megerősítette; külön termék a Fornetti sajtos pogácsától; a mostani rendelésbe 1 db kell. |
| Fagyasztott sajtos pogácsa | `220297280` | Fornetti sajtos pogácsa 700 g | Fornetti; előkelesztett; gyorsfagyasztott; sajtos pogácsa; 700 g; nem gluténmentes | 2026-08-24 | User megerősítette; külön termék a Bella mini burektől; a mostani rendelésbe 1 db kell. |
| Lefolyótisztító | `203157097` | Mr Muscle Power Gel lefolyótisztító gél 1000 ml | Mr Muscle; Power Gel; 1 l; haj- és szappanlerakódás okozta makacs dugulásokhoz | 2026-08-24 | User közvetlen terméklink alapján választotta. |
| Camping / cheddar lapkasajt | `105004912` | Karaván Toast cheddar ízű burger szeletek 100 g | Karaván Toast; cheddar ízű; lágyan olvadó burger-szelet; 100 g; 43% sajt + 15% cheddar; 19 g fehérje/100 g | 2026-08-24 | A user a címkealapú minőségi összehasonlítás után ezt választotta. |
| Mosogatószer | `220022202` | Jar Lemon folyékony mosogatószer 450 ml | Jar; Lemon; koncentrált; áztatás nélküli zsíroldás; 450 ml-es kis tesztkiszerelés | 2026-08-24 | User végleges választása; a Frosch tesztjelölt nem lett kiválasztva. Nagy kiszerelésre csak beválás után váltsunk. |
| Wrap — panírozott csirke | `210832246` | Valdor Zizu gyorsfagyasztott, készre sütött, panírozott csirkemellfilé 500 g | Valdor Zizu; csirkemellfilé 60%; gyorsfagyasztott; készre sütött; 500 g | 2026-08-24 | User végleges wrap-választása; a mostani rendelésbe 1 db kell. |
| Wrap — tortilla | `100429153` | Grill Master elősütött tortilla lapok búzalisztből 4 × 62,5 g (250 g) | Grill Master; búzalisztes; elősütött; 4 lap; 250 g | 2026-08-24 | User végleges wrap-választása; a mostani rendelésbe 3 csomag kell. |
| Wrap — saláta | `105007591` | Tesco coleslaw saláta mix 180 g | Tesco; mosott; fogyasztásra kész; vörös káposzta, fehér káposzta és répa; 180 g | 2026-08-24 | User végleges wrap-választása; a mostani rendelésbe 2 csomag kell. |
| Wrap — szósz | `220021386` | Hellmann's fokhagymás szósz 260 g | Hellmann's; fokhagymás; krémes; gluténmentes; 260 g | 2026-08-24 | User végleges wrap-választása; a mostani rendelésbe 1 db kell. |
| Sör | `121227873` | Dreher Gold minőségi világos sör 5% 6 × 0,5 l | Dreher Gold; világos sör; 5%; 6-os csomag; 6 × 0,5 l | 2026-08-24 | User az Arany Ászok helyett ezt választotta; a mostani rendelésbe 1 hatos csomag kell. |
| Vanília jégkrémtorta | `203199189` | Viennetta Jégkrém Vanília 650 ml | Viennetta; vanília; kakaós bevonórétegek 11%; 650 ml | 2026-08-24 | User kiválasztotta; a mostani rendelésbe 1 db kell, de a Tesco termékoldala 2026-08-24-én nem elérhetőnek jelzi. |
| Többdarabos kis jégkrém | `100588549` | Tesco Mini Mix vaníliaízű jégkrém 8 × 50 ml (400 ml) | Tesco Mini Mix; 8 darab; ét-, fehér-, tej- és mandulás tejcsokoládés bevonatok; 400 ml | 2026-08-24 | User végleges választása a multipackhoz; a mostani rendelésbe 1 csomag kell, de a Tesco termékoldala 2026-08-24-én nem elérhetőnek jelzi. |

## 2026-08-24 — fennmaradó élő Tesco-jelöltek, user-megerősítésre várnak

> Ezek még **nem megerősített preferenciák**. Az UBH-val élőben megtalált,
> elérhető jelöltek és ajánlott fallbackek; kosárírás előtt a bizonytalan
> változatokat egyetlen kötegben egyeztetjük.

| Stock item | Ajánlott / releváns Tesco-jelölt | Product ID | Döntési pont |
|---|---|---|---|
| Felvágott, elsődleges | „Delco paprikás sonka”, pultos | ismeretlen / rendszerint nem listázott | Kötelezően ezt keressük először minden rendelésnél; a Berek nem automatikus helyettesítő. Ha nincs, fallback a megerősített PICK pultos sertéspárizsi `205959255`. |
| Negro sima | Győri Negro Classic ánizs 140 g | `111274681` | A 63 g-os Classic nem elérhető; a 140 g-os elérhető. |
| Negro mézes | Győri Negro méz 63 g | `111274658` | A 140 g-os változat nem elérhető. |
| Negro új próba | Győri Negro feketeribizli C-vitaminnal 63 g | `111274660` | Elérhető, eltérő új íz; ajánlott próba. |

---

## 2026-08-23 — aktuális Tesco snapshot

| Name | currentQty | targetQty | hiány a targethez | unit / size | shoppingSource | product / notes |
|---|---:|---:|---:|---|---|---|
| HELL White Peach energiaital | **1** | **6** | **5** | db; 250 ml | Tesco | **Zero**, White Peach; kanonikus Tesco kosár-ID `121302824`; URL-alias `2004121302824` |
| Primavera víz | **3** | **5** | **2** | zsugor; 1 zsugor = 6 × 2 l-es palack | Tesco | szénsavmentes; azonosítva: Tesco `121233911`; 2026-08-23: készletből -1 zsugor; 2026-08-27-i rendelésből tévesen kimaradt, ezért a hiány változatlan: 12 palack |
| Szóda | **4** | **5** | **1** | zsugor; 1 zsugor = 6 × 1,5 l-es palack | Tesco | Szentkirályi extra dús; azonosítva: Tesco `121229698`; 2026-08-27-i rendelésből tévesen kimaradt, ezért a hiány változatlan: 6 palack |
| Mizse víz | **0** | **5** | **5** | zsugor; 1 zsugor = 6 × 1,5 l-es palack | Tesco | elfogyott; szénsavmentes; azonosítva: Tesco `121233675`; 2026-08-27-i rendelésből tévesen kimaradt; teljes hiány 30 palack, rendelésenként max. 12, maradék továbbviendő |
| Sör | **18** | **24** | **6** | db | Tesco | egy 6-os csomag vásárolandó |
| Cherry Coke | **0** | **4** | **4** | 1,75 l-es palack? | Tesco | korábbi „Serikók” feloldása; Zero-státusz TBD |
| Kóla | **1** | **3** | **2** | 1,75 l-es palack? | Tesco | pontos típus és Zero-státusz TBD |
| Gyömbér | **2** | **6** | **4** | db; 1,5 l | Tesco | Kinley Ginger Ale Zéró; azonosítva: Tesco `121217205` |
| Sprite | **3** | **6** | **3** | 1,75 l-es palack? | Tesco | Zero-státusz TBD |
| Tonik | **2** | **3** | **1** | palack; méret TBD | Tesco | Zero-státusz TBD |
| Fanta bodza | **3** | **4** | **1** | 1,75 l-es palack? | Tesco | Zero-státusz TBD |
| Fanta narancs | **3** | **4** | **1** | 1,75 l-es palack? | Tesco | Zero-státusz TBD |
| Xixo barackos tea | **2** | **4** | **2** | palack; méret TBD | Tesco | Zero-státusz TBD |
| Alpro vaníliás szójaital | **0** | **10** | **10** | 1 l-es doboz | Tesco | elfogyott; azonosítva: Tesco `209847121` — Alpro vaníliaízű szójaital hozzáadott kalciummal és vitaminokkal 1 l |
| Ceres vajas toast kenyér | **0** | **2** | **2** | 500 g-os csomag | Tesco | szeletelt; elfogyott; azonosítva: Tesco `2004008932200` |
| Président French Butter sós vaj | **0** | **1** | **1** | csomag; méret TBD | Tesco | elfogyott |
| Szeletelt sajt | **0** | **2** | **2** | 300 g-os csomag | Tesco | Tesco Edam szeletelt sajt; azonosítva: `220343486` |
| Felvágott | TBD | **40 dkg** | TBD | dkg | Tesco | prioritás mindig „Delco” paprikás sonka, először erre kell rákeresni; ha nem kapható (kb. 90%): PICK pultos sertéspárizsi `205959255`; Berek nem automatikus fallback |
| Vajkrém | TBD | TBD | 1 vásárolandó | db | Tesco | Nádudvari E-mentes snidlinges vajkrém 180 g; azonosítva: `210552687` |
| Alpro karamellás puding | **1** | **4** | **3** | db | Tesco | azonosítva: Tesco `220299326` — ALPRO krémes karamellás desszert 125 g |
| Alpro csokis puding | **1** | **2** | **1** | db | Tesco | Alpro ördögien sötét étcsokoládés desszert 125 g; azonosítva: `210736575` |
| Szójaszósz | **1** | **1** | **0** | üveg; 150 ml | Tesco | Kikkoman természetesen érlelt, csökkentett sótartalmú; azonosítva: `120256747`; 2026-08-24 közben vett egyet, most nem rendeljük |
| Camping sajt | **1** | **3** | **2** | db; 100 g | Tesco | Karaván Toast cheddar ízű burger szeletek; azonosítva: `105004912` |
| Abonett szendvics | **1** | **10** | **9** | db | Tesco | snidlinges; azonosítva: Tesco `220318949` |
| Papírtörlő / kéztörlő | **1** | **2** | **1** | csomag; 4 tekercs | Tesco | Springforce 2 rétegű; azonosítva: `111270024` |
| Tchibo Espresso Sicilia Style szemes kávé | **1** | **3** | **2** | 1 kg-os csomag | Tesco | a legerősebb, szicíliai Tchibo espresso; azonosítva: Tesco `210408830` |

### 2026-08-23 14:38 — Tesco háztartás és Negro

| Name | currentQty | targetQty | hiány a targethez | unit | shoppingSource | product / notes |
|---|---:|---:|---:|---|---|---|
| Rovarirtó | **1** | **2** | **1** | aeroszol; 400 ml | Tesco | Protect csótány- és hangyairtó; azonosítva: `209762301`; a korábbi `209762257` téves volt |
| Sampon | **2** | **4** | **2** | flakon; 400 ml | Tesco | Garnier Fructis Pure Fresh gyorsan zsírosodó hajra; azonosítva: `209515020` |
| Tusfürdő | **4** | **4** | **0** | flakon | Tesco | |
| Sikosító | **7** | **6** | **0** | db / flakon | Tesco | target fölött 1-gyel |
| Zsebkendő | **5** | **4** | **0** | csomag | Tesco | target fölött 1-gyel |
| WC-papír | **2** | **1** | **0** | nagy csomag | Tesco | target fölött 1-gyel |
| Negro Classic | **2** | **2** | **0** | csomag | Tesco | 2026-08-24: aktuális készlet pontosítva; azonosítva: Tesco `111274681` |
| Negro mézes | **2** | **2** | **0** | csomag | Tesco | 2026-08-24: aktuális készlet pontosítva; azonosítva: Tesco `111274658` |
| Negro — kipróbálandó új fajta | TBD | TBD | próba: 1 | csomag | Tesco | még nincs célszám; az íz neve STT-bizonytalan („mely egyesen”) |

### 2026-08-23 14:38 — kínai bolt

| Name | currentQty | targetQty | hiány a targethez | unit | shoppingSource | product / notes |
|---|---:|---:|---:|---|---|---|
| Kréker | **1** | **3** | **2** | csomag | Kínai bolt | pontos típus TBD |
| Bacardi fehér rum | **2** | **4** | **2** | üveg | Kínai bolt | a korábban „Rum (alap)” néven felírt tétel pontosítása |
| Captain Morgan fűszeres rum | **1** | **2** | **1** | üveg | Kínai bolt | különálló a Bacardi fehér rumtól |
| Vodka | **2** | **4** | **2** | üveg | Kínai bolt | user-javítás: végleges currentQty=2 |
| Ballantine's whisky | **1** | **1** | **0** | üveg | Kínai bolt | |
| Jack Daniel's whisky | **0** | **1** | **1** | üveg | Kínai bolt | |
| Johnnie Walker Red Label whisky | **0** | **1** | **1** | üveg | Kínai bolt | |
| Tequila Silver | **1** | **1** | **0** | üveg | Kínai bolt | |
| Tequila Gold | **1** | **1** | **0** | üveg | Kínai bolt | |
| Becherovka | **0** | **2** | **2** | üveg | Kínai bolt | user-javítás: végleges currentQty=0 |
| Jägermeister | **1** | **2** | **1** | üveg | Kínai bolt | |
| Cointreau | **1** | **1** | **0** | üveg | Kínai bolt | |
| Gin | **2** | **1** | **0** | üveg | Kínai bolt | target fölött 1-gyel; pontos típus TBD |
| Aperol vagy Campari | **0** | **1** | **1** | üveg | Kínai bolt | egymást helyettesítő választás; az egyikből kell 1 |
| Baileys | **0** | **1** | **1** | üveg | Kínai bolt | |
| Tiramisus krémlikőr | **0** | **1** | **1** | üveg | Kínai bolt | pontos márka TBD |
| Martini száraz | **1** | **1** | **0** | üveg | Kínai bolt | user-pontosítás: van 1 |
| Martini édes | **1** | **1** | **0** | üveg | Kínai bolt | user-pontosítás: van 1 |
| Cherry (alkoholos ital) | **1** | **1** | **0** | üveg | Kínai bolt | piás kontextus alapján külön tétel a Cherry Coke-tól; pontos típus/márka TBD |
| Metaxa | **0** | **1** | **1** | üveg | Kínai bolt | |

### 2026-08-23 14:46 — fagyasztott termékek

| Name | currentQty | targetQty | hiány a targethez | unit | shoppingSource | product / notes |
|---|---:|---:|---:|---|---|---|
| Rántott camembert | **1** | **1** | **0** | csomag; 350 g | Tesco | Nádudvari gyorsfagyasztott rántott camembert `120537295`; 2026-08-24 közben megvéve, most nem rendeljük |
| Fagyasztott mini pizza | **0** | **3** | **3** | csomag; 9×30 g | Tesco | Buitoni Piccolinis háromsajtos; azonosítva: `120560507`; végleges targetQty=3 |
| Fagyasztott sajtos mini burek | TBD | TBD | mostani rendelés: **1** | csomag; 480 g | Tesco | Bella sajtos mini burek; azonosítva: `105004749` |
| Fagyasztott sajtos pogácsa | TBD | TBD | mostani rendelés: **1** | csomag; 700 g | Tesco | Fornetti sajtos pogácsa; azonosítva: `220297280`; nem gluténmentes |
| Carte d'Or tiramisu jégkrém | TBD | TBD | mostani rendelés: **1** | nagy doboz; 825 ml | Tesco | azonosítva: `105010828` |
| Viennetta vanília jégkrémtorta | TBD | TBD | mostani rendelés: **1**, ha elérhető | 650 ml | Tesco | azonosítva: `203199189`; 2026-08-24-én nem elérhető |
| Többdarabos kis jégkrém | TBD | TBD | mostani rendelés: **1**, ha elérhető | 8 × 50 ml | Tesco | Tesco Mini Mix; azonosítva: `100588549`; 2026-08-24-én nem elérhető |

### 2026-08-23 14:46 — pezsgőtabletták

> Preferált márka: **Pro Formula**. Ha nincs, a **Plus** is megfelelő
> helyettesítő.

| Name | currentQty | targetQty | hiány a targethez | unit | shoppingSource | product / notes |
|---|---:|---:|---:|---|---|---|
| Magnézium pezsgőtabletta | **6** | **5** | **0** | tubus | Tesco | target fölött 1-gyel |
| C-vitamin pezsgőtabletta | **3** | **5** | **2** | tubus | Tesco | Pro Formula; azonosítva: Tesco `107282289` |
| Kalcium pezsgőtabletta | **3** | **5** | **2** | tubus | Tesco | Pro Formula; azonosítva: Tesco `107282210` |
| Multivitamin pezsgőtabletta | **3** | **5** | **2** | tubus | Tesco | Pro Formula; azonosítva: Tesco `107280346` |

### 2026-08-23 14:50 — Tesco tisztítószerek

| Name | currentQty | targetQty | hiány a targethez | unit | shoppingSource | product / notes |
|---|---:|---:|---:|---|---|---|
| Mosogatószer | **0** | **2** | **2** | flakon; 450 ml | Tesco | Jar Lemon koncentrált, áztatás nélküli zsíroldás; azonosítva: `220022202`; elsőre kis tesztkiszerelés |
| Lefolyótisztító | **0** | **2** | **2** | flakon; 1 l | Tesco | Mr Muscle Power Gel; azonosítva: `203157097`; haj- és szappanlerakódásos dugulásra |
| Domestos | **2** | **2** | **0** | flakon | Tesco | |

### 2026-08-23 14:50 — külön beszerzés / rendelés

| Name | currentQty | targetQty | hiány a targethez | unit | shoppingSource | product / notes |
|---|---:|---:|---:|---|---|---|
| Kisvirágú füzike tea | **7** | **3** | **0** | csomag | másik bolt / rendelés; pontos forrás TBD | a jelenlegi mennyiség 6-ról 7-re javítva; target fölött 4-gyel; **„véletlenül se herbáriáset vegyek, a herbáriás nem jó”**; a meglévő nagy Herbária-készlet elfogyása után másik, jobb fajtát kell venni |

### 2026-08-24 18:07 — patika

| Name | currentQty | targetQty | hiány a targethez | unit | shoppingSource | product / notes |
|---|---:|---:|---:|---|---|---|
| Dr. Theiss Echinacea csepp | **0** | **3** | **3** | üveg | Patika | ekinácia csepp; pontos kiszerelés TBD |
| Bánó körömvirágkrém | **1** | **2** | **1** | tubus / tégely | Patika | pontos kiszerelés TBD |
| Bánó fokhagyma–galagonya–fagyöngy lágykapszula | **0** | **2** | **2** | doboz | Patika | pontos kiszerelés TBD; STT-normalizált terméknév |

### Étkezési csomagok — időnként aktivált, nem állandó tételek

> Bevásárlólista-összeállításkor alapértelmezetten **pontosan egy** csomagot
> választunk. A közös összetevők egyetlen kanonikus stock-itemre hivatkoznak;
> nem duplikáljuk a készletüket.

| Csomag | Összetevők | Aktiválási szabály |
|---|---|---|
| Szendvics | felvágott; kenyér; vajkrém; szeletelt sajt | a három mód közül pontosan egy |
| Hotdog | sajtos stangli; frankfurti virsli; pirított hagyma; szósz; szeletelt sajt | a három mód közül pontosan egy |
| Wrap | fagyasztott rántott csirkecsíkok/csirkedarabok; saláta; szeletelt sajt; szósz | a három mód közül pontosan egy |

Az új, csomagspecifikus összetevők currentQty/targetQty értéke egyelőre TBD.
A részletes átmeneti szabály: `current/principles/meal-shopping-modes.md`.

---

## 2026-05-07 — initial input (user chat)

> Forrás (szó szerinti idézet a user-től):
> *"Kéne venni energiaitalt, meg vodkát, meg rumot, meg kapitányt. Kapitány
> alias Captain Morgan rum. Kapitány rum. Kéne valami kész kaja, meg serikók.
> meg gyömbér, meg rengeteg-rengeteg víz. Nem tudom, a kézkaját mondtam-e már.
> Sprite. A Sprite-ot mindig megisszák a srácok. Tejet is kell most már lassan
> venni. Valami rákcsát, meg nasit. meg kéne venni majd fokhagymát is, meg
> tökmagolajat, meg tejfölt. Ú, az lenne jó amúgy kis adagokban sok tejfölt
> venni. Na jó, nem sokat, de mondjuk hármat. Mondjuk kettőt rotálni, tehát
> amikor majd csak egy venni még egyet, vagy kettőt. Nem is tudom. Energiaitalt
> is kéne venni. Kenyeret kenyérhez ezt, meg azt. Mozzarella mindig jól jön."*

---

## Italok 🥤

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Energiaital | **0** (2026-05-09 elfogyott) | 3 (default) | 2 (default) | 2 (default) | db | 2026-05-09: elfogyott → bevásárló-listára |
| Vodka | TBD | 3 (default) | 2 (default) | 2 (default) | üveg | |
| Rum (alap) | TBD | 3 (default) | 2 (default) | 2 (default) | üveg | különálló a Kapitány-tól |
| Kapitány (Captain Morgan rum) | **2** (vett ma 2-t; bolt out-of-stock 2-re) | 3 (default) | 2 (default) | dinamikus → most **2** kell még | üveg | 2026-05-07: vásárlás megvolt 2 db, de a 4-re dúsításhoz még 2 hiányzik (a bolt out-of-stock volt). Marad a listán. |
| Víz | TBD | **magas** ("rengeteg-rengeteg") | TBD | TBD | l / 1.5l palack | folyamatos high stock — default NEM alkalmazható |
| Sprite | TBD | 3 (default) | 2 (default) | 2 (default) | db | "a srácok mindig megisszák" — társaságra kell |
| Tej | TBD | 3 (default) | 2 (default) | 2 (default) | l | "most már lassan" → küszöb-közeli |

## Élvezeti / dohány 🚬

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Cigi | **0** (2026-05-09 elfogyott) | TBD | TBD | TBD | csomag/karton | 2026-05-09: elfogyott. **preferredStore: Dohánybolt** (2026-05-12 megerősítve — NEM Tesco). 2026-05-12: a minap volt a dohányban, de a **kedvenc el volt fagyva** → új attempt szükséges. |

## Étel — kész 🍱

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Kész kaja | TBD | 3 (default) | 2 (default) | 2 (default) | db | a user kétszer említette (kész kaja + kézkaja STT-variant) |

## Étel — alapanyag 🥕

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Gyömbér | TBD | 3 (default) | 2 (default) | 2 (default) | db / g | |
| Fokhagyma | **5** | **4** | 2 (default) | 2 (default) | fej | 2026-08-25: aktuális készlet pontosítva; target fölött 1-gyel, jelenleg nem vásárolandó. |
| Tökmagolaj | TBD | 3 (default) | 2 (default) | 2 (default) | üveg | |
| **Tejföl** | **0** | **3** | **1** | **2** | poharas (kicsi) | 2026-08-24: elfogyott, hiány a targethez **3**. ⭐ user-spec rotálási szabály (NEM default): target=3, küszöb=**1** (default 2 helyett), reorder=2. ("Na jó, nem sokat, de mondjuk hármat. Mondjuk kettőt rotálni, tehát amikor majd csak egy venni még egyet, vagy kettőt.") |
| Kenyér | TBD | 3 (default) | 2 (default) | 2 (default) | db | "Kenyeret kenyérhez ezt, meg azt" — a kenyér biztos, a végét nem értettem (STT) |
| Mozzarella | TBD | 3 (default) | 2 (default) | 2 (default) | db / csomag | "mindig jól jön" |

## Drogéria / higiénia 🧴

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Aftershave | TBD | 3 (default) | 2 (default) | 2 (default) | flakon | hozzáadva 2026-05-07 — *"aftershave-et is venni kell"* |

## Gyógyszer / patika 🏥

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Kataflam | **TBD** (vett ma) | 3 (default) | 2 (default) | dinamikus | doboz | 2026-05-07: vásárolva, mennyiség TBD |
| Széntabletta | **3** (vett ma 3-at, volt 0) | 3 (default) | 2 (default) | dinamikus | doboz | 2026-05-07: bolt-elérhetőség miatt csak 3 lett (default 4 helyett); user "mindegy"-jel lezárta — a hiány NEM kerül vissza listára (vs. Captain Morgan eset, ahol a user akart 4-et) |

## Ruházat 👕 (stock-jellegű alapdarabok)

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| Zokni | TBD ("kevés") | TBD ⚠️ | TBD ⚠️ | TBD ⚠️ | pár | a user mondta: "szorosak is. kevés" → méret-probléma + alacsony készlet. Default 3/2/2 nem reális ruhán; valószínűbb 8-10 pár target. Tisztázandó. |
| Alsógatya | TBD ("lecsúsznak" → rossz méret) | TBD ⚠️ | TBD ⚠️ | TBD ⚠️ | db | méret-probléma. Hasonlóan: 7-10 db reálisabb mint 3. Tisztázandó. |

> **Megjegyzés:** ezek stock-jellegű tételek (alapdarab, állandóan kéne legyen
> X db). A nem-stock ruházat (cipő, kabát, póló, pulóver) a
> `current/shopping/clothing.md`-ben van mint egyszeri vásárlás.

## Snack / nasi 🥨

| Name | currentQty | targetQty | reorderThreshold | reorderQty | unit | notes |
|---|---|---|---|---|---|---|
| ❓ Serikók | TBD | 3 (default) | 2 (default) | 2 (default) | ? | **STT-bizonytalan**: nem tudom mire gondolt — felvéve, később pontosítani |
| **Rákcsa** | **0** (utolsó kinyitva 2026-05-09) | 3 (default) | 2 (default) | 2 (default) | ? | Péntekenként fogy (a srácoknak). Ma elfogyott → bevásárló-listára. **preferredStore: Kínai bolt.** Korábbi STT-bizonytalanság feloldva: ez a "rákcsa" — a user így használja. |
| Nasi (általános) | TBD | 3 (default) | 2 (default) | 2 (default) | ? | általános fogalom, alkategória-jelölt |
| Kinder Bueno Mini | **0** | **2** | TBD | TBD | csomag | 2026-08-26: elfogyott; hiány a targethez **2**; beszerzési hely és pontos kiszerelés TBD. |
| Kinder Pingui | **0** | **1** | TBD | TBD | csomag | 2026-08-26: elfogyott; hiány a targethez **1**; beszerzési hely és pontos kiszerelés TBD. |

---

## Open kérdések (legközelebb tisztázni)

- **CurrentQty fölmérés**: ezek mind TBD — egy kör otthoni szemle kell
- **TargetQty defaultok**: egy átlag konzervatív érték minden tételhez (pl. cigaretta-szerű "3 db default", víznél kivétel)
- **STT-bizonytalan tételek**: serikók, rákcsa, "kenyeret kenyérhez ezt meg azt" második fele
- **Rum vs. Kapitány**: tényleg külön két tétel, vagy egy és csak hangsúlyozta? — felvettem külön, később összevonható

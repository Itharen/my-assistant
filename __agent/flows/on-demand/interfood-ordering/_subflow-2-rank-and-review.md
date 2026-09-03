# interfood-ordering / rank-and-review

1. Olvasd: `ma interfood preference list --pretty`.
2. Desszert/leves előzményekhez olvasd: `ma interfood orders patterns --add-ons-only --minimum-units 1 --limit 30
   --pretty`. Ez category-aware, exact-food evidence; nem explicit preferencia.
3. Készíts tervet: `ma interfood plan week --year YYYY --week WW --meals-per-day 2 --pretty`. A napi elvárt
   mennyiség alapértelmezetten kettő; a recommendation `quantity` összege minden napon pontosan 2 legyen.
4. A sorrend: hard reject/kizárás és kivételeik → exact-food/névminta → adagpreferencia → típus/kategória/párpreferencia → hosszú távú history-affinitás → közeli ismétlődés → változatosság →
   opcionális tápérték → ár → bizonytalanság.
5. Minden ajánláshoz score-breakdown, bizonyíték és alternatívák tartozzanak.
6. Az összes valódi bizonytalanság egy batch-ben kerüljön a user elé. A megerősített döntéseket azonnal rögzítsd
   `ma interfood preference set|compare|portion` parancsal.
7. Adagszabálynál ellenőrizd, hogy ténylegesen létezik-e `small` occurrence. `unspecified` nem jelent kicsit.
   A `current/principles/interfood-food-preferences.md` szerinti burgonyapürés kivételt mindig tartsd meg.
8. A history általában valid, de nem tévedhetetlen. Mutasd az adag/nap/dupla-nap evidenciát; egy explicit negatív
   korrekció (például bolognai) minden történeti gyakoriságot felülír.
9. A szombati menü pénteken érkezik, ezért a planner a pénteki és szombati occurrence-öket egyetlen pénteki
   választási poolban rangsorolja. Külön szombati rendelést ne tervezz. A választott sor eredeti `menuItem.date` és
   `menuItemId` értéke megmarad; a terv `date` mezője péntek, a `sourceDates` megmutatja mindkét forrásnapot.
10. A `fallback` stance erős hátrasorolás, nem tiltás. Ilyen ételt (jelenleg halrudacskát) csak akkor ajánlj, ha a
   közös napi poolban nincs jobb, elfogadható jelölt.
11. Normál esetben két külön ételt válassz, de soha ne a kis és teljes occurrence-öt számold két ételnek. Explicit
    `favorite` esetén az első exact occurrence `quantity=2` lehet, de csak ha ugyanazt az exact ételt már legalább
    egyszer korábban rendelték; kipróbálás soha nem lehet 2×. A camembert és a rakott burgonya erős jelölt.
    Két külön identity között is kerüld az azonos elsődleges ételcsalád két majdnem azonos változatát, ha van más
    elfogadható étel.
    A variety egy napon facettenként egyszer számol, és két korábbi nap után cap-el, hogy a napi két adag ne toljon
    gyenge ételeket az explicit kedvencek elé.
12. A napi `addOns` leves/desszert sorai a két főételen felüli opcionális tételek. Tényleges ajánlást csak explicit
    owner-confirmed exact-food `favorite` kaphat. Legalább 5 külön történeti rendelési nap ugyanazzal a `foodId`-val
    csak `favoriteCandidates` jelöltet képez; ezt egyetlen batch-ben erősíttesd meg, és addig se ajánlás, se
    kosártétel ne legyen belőle. Hasonló név, eltérő identity nem örököl döntést.
13. Desszertnél és levesnél ugyanaz a ritka-kivétel szabály érvényes: csak explicit megerősített kedvencet ajánlj;
    ismeretlen vagy pusztán változatossági alternatívát ne. A `food-type:meal:gyumolcsleves` hard rejectet mindig
    érvényesítsd.
14. A változatossági alternatívák a főételekhez tartoznak. Naponként mutasd külön a compact plan `alternatives`
    (valószínűleg kedvelt) és `healthOrientedAlternatives` (teljes tápadatú, protein/só-sűrűség alapján relatívan
    rangsorolt) legfeljebb 3-3 sorát. Mutasd a döntési evidenciát/mérést; ugyanaz a food identity csak egyszer
    szerepelhet, a választott főétel pedig egyik listában sem.
15. Explicit hét/időtartomány hiányában az összes provider-enabled current/future hét minden lefedetlen napját egy
    közös ajánlási batch-ben mutasd. A teljesen lefedett heteket/napokat csak státuszként jelöld; ne javasolj rájuk
    új rendelést.
16. Tej/tejszín allergiajel esetén a candidate `dietaryWarnings` mezőjét kiemelten mutasd, minden biztonságos
    jelölt mögé sorold, és ne tedd egészség-alternatívába. Ha jobb jelölt híján mégis bekerül, a figyelmeztetésnek
    a javaslatban is látszania kell. Owner-pontosítás: tejföl, joghurt, túró, vaj és sajt rendben van; kizárólag
    tej/tejszín kerülendő. A tejfölös székelykáposztás rakott burgonya és a rácos emiatt nincs kizárva (két külön
    étel). Későbbi explicit owner-döntés: sajtoknál, így camembertnél sem kell tejjelzés; a korábbi blanket
    camembert-figyelmeztetés felülírva. Más érintett ételeknél a tej/tejszín-jelzés marad. Egy kedvenc
    kihagyásának okát név szerint magyarázd el; figyelmeztetés hiánya nem allergénmentességi igazolás.
17. Gombás étel csak fallback: ha van más elfogadható jelölt, azt mutasd előrébb. Tortilla, burrito és wrap pozitív
    névminta, de a kipróbált tépett csirkés BBQ tortilla explicit dislike, ezt a családpreferencia nem írja felül.
18. Owner-tábla: egy sor/nap; ugyanabban a cellában egymás alatt a két főétel, alattuk a kedvenc leves/desszert
    külön `+ tétel` soron. Alternatívák ugyanennek a táblának másik oszlopában. Technikai ID-t ne mutass a usernek.
    Fix jelölések mindig: ⭐ kedvenc, 🥗 egészségesebbnek szánt választás, ⚠️ konkrét figyelmeztetés. Minden
    korrekció után a TELJES többhetes ajánlást add újra, nem csak a változást vagy egy linket. A 🥗 nem orvosi
    minősítés; a sajt tejjelzése lezárt kérdés, a többi nyitott preferenciát ne tekintsd ettől jóváhagyottnak.
19. Krumpli preferált; tészta fallback; brassói/vadas és gyümölcsös hús dislike. A vadas nem vad-hús tiltás.
    Rizses/rizottós ételnél valódi kis adagot keress a korábbi teljesadagos kivételek megtartásával.
20. Rangsorolási védőkorlát: a negatív explicit preferenciájú ételt nem emelheti elfogadható étel elé általános
    pozitív minta, history, ár vagy változatosság. Ha legalább két megfelelő étel van, a családváltozatosság sem
    emelhet helyettük negatív jelöltet a napi két adagba.
21. A teljes összetevő-listát nézd át a megjelenített név mellett: a mozzarellás csirkesaláta almát, a szárnyas
    vagdalt csirkecombot is rejthet. A meglévő preferencia alapján végzett review-cserét dokumentáld, de ne jelöld
    új explicit user-döntésnek. Nyilvános menü + régi fiókcache esetén jelezd a cache dátumát és a frissítés hiányát;
    a javaslat ettől még elkészülhet, de nem jelent friss rendelési állapotot vagy rendelés-jóváhagyást.

Favorite-visibility review (owner correction 2026-09-02):
Before the daily table, check exact repeatedly ordered favorites and all of their currently published occurrences.
Name a favorite/constraint conflict prominently rather than burying the favorite in generic alternatives. A rare
camembert-containing dish is not a like-for-like substitute for the owner's frequently ordered breaded camembert.
Do not infer an allergy exception from a request to restore favorite visibility.

Owner correction 2026-09-02 supersedes the earlier broad dairy interpretation and per-food table rows; history:
`__documentations/developments/2026-09-02-interfood-allergy-trial-and-variety.md`.

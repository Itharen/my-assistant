# FR: Megbízható böngésző-workflow rendszer

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** A strukturált értelmezés
> külön, egyértelműen assistant-jegyzetként kerülhet a fájlba.

---

## 2026-08-23 — initial deklaráció

> Na most van nekem itt egy sor olyan feladatom, amiben nagyon szeretném, hogy segítsél, de hosszútávú megoldásokat szeretnék kiépíteni arra, hogy megabiztosan tudjad segíteni ezeket a feladataimat.
>
> Ezeknek a feladatoknak a többsége böngésző kezeléssel fog járni, mint például egy Tesco rendelés bevásárló lista olvasása és összeállítása.
>
> Elsősorban azt kérdezném, hogy hogyan is állná te neki ennek a kérdésnek, illetve szerinted hogyan lehetne ezt jól megcsinálni, hogy utána determinisztikusan megbízhatóan működjön?

---

## Strukturált értelmezés (assistant-jegyzet, NEM a user szavai)

- Több, hosszú távon ismételhető böngésző-workflow közös infrastruktúrája szükséges.
- A cél nem egyszeri UI-kattintgatás, hanem állapot-ellenőrzött, naplózott, folytatható és tesztelhető működés.
- Első konkrét pilot: Tesco-lista ↔ Tesco-kosár összeállítás, rendelésleadás előtt kötelező user-jóváhagyással.
- ⚠️ **STALE állítás (2026-08-23):** `LIVE-projects/unblockable-browser-handler-tool` „implementáció még nincs”.
  Az implementáció elkészült; globális `ubh` CLI + saját MV3 extension élő Tesco read/reconnect canaryja zöld.
- Kapcsolódó domain-FR: `current/feature-requests/tesco-integration.md`.

---

## 2026-08-23 — cross-agent + pagination + tuning kiegészítés

> Jónak tűnik az irány. Fontos lenne, hogy minden AI agent tudja használni, ne csak te.
> Illetve ne feledkezzünk meg a lapozásokról. Valószínűleg, hogy időnként a kosár is lapozhatóvá válik, meg a felületek, amiket nézünk. Illetve biztos, hogy fog kelleni egy sorutólagos hangolás is majd.
> Most következő lépésnek készítsük el a Hyperplan-t hozzá.
>
> (FYI ezt használom, szóval neked is ezt kéne: [https://bevasarlas.tesco.hu/shop/hu-HU/search?query=alpro&inputType=free+text](https://bevasarlas.tesco.hu/shop/hu-HU/search?query=alpro&inputType=free+text))

## Strukturált kiegészítés (assistant-jegyzet, NEM a user szavai)

- A közös browser-tool minimum interoperabilitása: univerzális CLI + MCP, verziózott JSON contract és agentenkénti namespace.
- A traversal engine first-class paginationt kezel: numbered/page-link, load-more, infinite-scroll és virtualized-list.
- Az utóhangolás külön rollout-fázis: fixture-gyűjtés, hibaosztályozás, site-profile finomítás, regressziós replay és canary.
- Koordináló plan: `__agent/plans/browser-workflow-hyperplan/hyperplan.plan.md`.
- Élő acceptance (2026-08-23): több Tesco-fül mellett kanonikus teljes URL-es target-tab választás; 48/54 termék,
  számozott 2. oldal, Alpro `209847121` strukturált `cartQuantity=10`, helyes increment/decrement/remove tagging;
  bridge force-stop után automatikus self-start + MV3 reconnect.

---

## 2026-08-23 — vendorfüggetlenség megerősítése

> bejelentkeztem.  De nem tudom eléggé hangsúlyozni, hogy olyan megoldásra van szükségünk, ami Codex független, OpenAI független és minden agent számára használható. ( Az extension, amit próbálsz betölteni, az nagyon-nagyon remélem, hogy nem a Codex-hez használt extension.)

## Strukturált kiegészítés (assistant-jegyzet, NEM a user szavai)

- A core runtime és a böngésző-extension sem Codex-, sem OpenAI-függőséget nem tartalmazhat.
- Az univerzális belépési pont a verziózott CLI + szabványos MCP; a Codex-plugin csak opcionális thin adapter.
- A betöltendő extension a saját UBH MV3 bridge: `LIVE-projects/unblockable-browser-handler-tool/extension`.

---

## Kapcsolódó univerzális termékválasztási szabály

- `current/principles/product-selection-ambiguity.md` — bizonytalanság vagy több érdemi termékváltozat esetén
  kötelező user-egyeztetés, kosármódosítási stop és a megerősített választás tartós feljegyzése.

---

## 2026-08-23 — Computer Use egyeztetési szabály

> Ami azt illeti, nem örülök, hogy a Computer Use Skill-t használod előzetes megbeszélés nélkül, és mivel én is használom éppen a számítógépet, reflexből lelövöm mindig.

## Strukturált kiegészítés (assistant-jegyzet, NEM a user szavai)

- A vendorfüggetlen browser-workflow nem jelent automatikus jogot az aktív Windows-asztal átvételére.
- Computer Use előtt külön meg kell kérdezni, hogy a user át tudja-e adni a gépet; az engedély csak az egyeztetett időablakra érvényes.
- Ha nincs ilyen engedély, csak háttérben futó CLI/MCP/API vagy teljesen read-only fájlművelet használható.

> (Computer use skill-t csak és kizárólag akkor használhatsz, hogyha előtte megkérdezted, hogy használhatod-e. És minden egyes alkalommal meg kell kérdezd előtte, hogy használhatod-e. ( minden két user üzenet között, ha az utolsó user üzenetben nem lett kifejezette jóváhagyva már.))

- Az engedély minden új user-üzenetnél lejár. Ha az utolsó üzenet nem hagyta kifejezetten jóvá a Computer Use
  használatát, külön engedélyt kell kérni és meg kell várni a választ.
- A használat bejelentése nem engedélykérés.

---

## 2026-08-23 — fókusz-, hotkey- és tab-izolációs korrekció

> Na hát ez most nagyon furcsán kezdett el működni.
> Egyrészt mintha nyomkodta volna nekem a Ctrl-Windows kombogombokat, ami nekem egy STT programhoz van kötve, ami ettől elkezdett printjögni folyamatosan.
> Másrészt meg aztán elkezdte végigpörgetni a tabjaimat, megnyitogatni az összes amúgy dormant alvó tabot. Ami nem annyira jó, és aztán utána tulajdonképpen elpróbálta kikeresni azt a tabot, ami neki kell, amit ha jól láttam, akkor meg is jelent, csak valahogy mégse találta meg annak ellenére, hogy amúgy a keresés megtalálta.
> Na most itt ez az egész kicsit furcsa nekem így. Egyrészt nem tudnánk ezt úgy megoldani, hogy ezek a böngésző tabok ne kerüljenek fókuszba. Másrészt pedig nem tudnánk allokálni egy böngésző ablakot kifejezetten ennek az eszköznek, hogy ne zavarja az összes többi böngésző ablakomat?

## Strukturált kiegészítés (assistant-jegyzet, NEM a user szavai)

- A foreground/OS-input fallback hibás irány volt; normál workflow-ban tilos.
- A Tesco külön `my-assistant-tesco-dedicated` persistent böngészőprofilt/ablakot kap.
- A hétköznapi click/type/scroll háttér extension DOM-actionként fut, tab/window activation nélkül.
- A user normál Chrome-profilja read-only; navigation/mutation fail-close.
- Háttér-action hibája soha nem válthat automatikusan globális egér-/billentyű-injektálásra.
- Kanonikus UBH döntés: `unblockable-browser-handler-tool/__documentations/DECISIONS.md` ADR-021.

---

## 2026-08-24 — Tesco exact-ID keresés: kosár-oldalsáv fals pozitív

### Élő mérés (assistant-jegyzet)

- A `tesco.search` numerikus product-ID query esetén a keresőoldal nullás
  találata helyett a globális kosár-oldalsávban lévő Alpro `209847121` elemet
  adta vissza keresési termékként, minden eltérő ID-re ugyanazt.
- A közvetlen `navigate` → product-detail `read` út helyesen olvasta a kért
  termékeket; ezzel történt a jelen session terméklenyomat-ellenőrzése.
- Ez veszélyes fals pozitív: a keresési eredmény parserének a találati lista
  konténerére kell scope-olnia, és ki kell zárnia a mini-trolley/kosár elemeit.

### Kötelező regresszió

- Nullás Tesco-keresés + nem üres kosár esetén a keresési `products` lista
  üres, és egyetlen kosárelem sem szivároghat bele.
- A keresett product ID-től eltérő találat ID-first matchben nem lehet exact.
- Külön journey: `signed-in → nonempty cart → unknown ID search → zero result
  → no cart leakage → direct product navigation fallback`.

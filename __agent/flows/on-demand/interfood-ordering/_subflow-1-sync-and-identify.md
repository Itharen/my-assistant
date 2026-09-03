# interfood-ordering / sync-and-identify

0. Ha az owner nem adott hetet/időtartományt, olvasd ki a `ma interfood weeks --pretty` eredményét, és az összes
   nem disabled, current/future hetet vedd fel a review-horizontba. A már teljesen lefedett napokat a coverage
   alapján hagyd ki az új ajánlásból, de a kihagyás tényét és okát jelezd.

1. `ma interfood menu-range --weeks 3 --pretty` — csak terminális, explicit teljes/partial eredmény fogadható el.
2. `ma interfood foods identify --weeks 3 --commit --pretty` — új, ismert és tartalmilag változott étel külön.
3. `ma interfood orders sync --pretty` — 2022-től az aktuális következő évig minden lap; duplikációciklus tilos.
4. Őrizd meg külön a `foodId`, `menuItemId`, `orderId`, `orderLineId`, dátum, adagkategória és `quantity` mezőket.
5. `quantity=2` két egység. Ugyanaz az étel kis- és normál adagban, ugyanazon vagy más napokon nem deduplikálható.
6. Az account snapshot user-local cache; token/cookie/jelszó nem kerülhet fájlba vagy logba.

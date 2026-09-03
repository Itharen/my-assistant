# interfood-ordering / apply-and-verify

## Kosár

1. Olvasd vissza: `ma interfood cart show --pretty`.
2. Kizárólag kanonikus `menuItemId`-vel dolgozz.
3. Pontos mennyiséghez `cart set`; az eszköz deltát számol, korlátosan add/subtract műveleteket végez, majd visszaolvas.
4. Minden megerősített, egyértelmű tételt ugyanabban a feladatban ténylegesen alkalmazz. Dry-run nem kész kosár.
5. Timeout után újraolvasás és diff kell; ugyanazt az effektet vakon ismételni tilos.

## Leadott rendelés

1. `order show` + `order check` → cart-items JSON → `order change-preview`; ismeretlen cancellable/overlap séma
   vagy overlap esetén fail closed.
2. Mutasd meg az exact preview hash-t, tétel-, ár- és refund-hatást.
3. Csak erre a hash-re adott friss, explicit owner-jóváhagyás után `order change-apply`.
4. Az alkalmazás után kötelező `order-details` readback; a receiptben eredeti, kívánt és végső állapot marad.
5. Checkout, új fizetés vagy más visszafordíthatatlan pénzügyi művelet külön jóváhagyás nélkül tilos.

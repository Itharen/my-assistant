# interfood-ordering / _close

1. Ellenőrizd a kosár/rendelés végső, hitelesített állapotát és a napi lefedettséget.
2. Rögzíts minden új explicit preferenciát; inference nem írhatja felül a user döntését.
3. Ismeretlen vagy megváltozott ételnél őrizd meg az azonosítókat, fingerprintet és a döntés indokát.
4. Action-logba csak aggregált technikai összegzés kerüljön; token és teljes account payload nem.
5. Jelentsd külön: alkalmazott kosártételek, változatlan tételek, unresolved elemek, pénzügyi hatás és receipt.
6. A flow csak hiteles readback után zárható. Élő canary hiányában a megfelelő képesség státusza `implemented,
   awaiting live calibration`, nem „kész”.
7. Futtasd végig a `current/principles/interfood-continuous-documentation.md` writeback-mátrixát. Affected CLI,
   workflow, Hyperplan/audit, preferencia, journey, fejlesztési jegyzet, action-log vagy FAM pointer nem maradhat
   el; chat-only tudással a flow nem zárható.

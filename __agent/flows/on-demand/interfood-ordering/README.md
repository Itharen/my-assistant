# interfood-ordering

**Mikor fut:** amikor a user heti Interfood-menü áttekintését, ajánlást, kosár-összeállítást, rendelési
lefedettséget vagy egy már leadott rendelés módosítását kéri.

## Cél

1. a publikus heti menük teljes beolvasása és az ismert/megváltozott ételek azonosítása;
2. a teljes, lapozott rendeléstörténet és az aktuális kosár hitelesített visszaolvasása;
3. mennyiség-, nap-, rendelés- és adag-tudatos történeti jelöltek képzése, majd owner-megerősítésük;
4. explicit étel- és ételtípus-preferenciák alkalmazása;
5. magyarázható, változatos ajánlás, az összes bizonytalanság egyetlen review-batch-ben;
6. megerősített tételek tényleges kosárba helyezése és hiteles visszaellenőrzése;
7. leadott rendelésnél immutable preview, exact-hash owner approval, alkalmazás és readback;
8. minden új tudás same-change dokumentálása a folyamatos dokumentációs kontraktus szerint.

## Fázisok

1. `_intake.md`
2. `_subflow-1-sync-and-identify.md`
3. `_subflow-2-rank-and-review.md`
4. `_subflow-3-apply-and-verify.md`
5. `_close.md`

A fázisok sorrendhelyesek és a tényleges előző állapotot viszik tovább. A kosárterv önmagában nem teljesítés.
Dokumentációs kontraktus: `current/principles/interfood-continuous-documentation.md`.
Owner-review: ⭐ kedvenc, 🥗 egészségesebbnek szánt választás, ⚠️ konkrét figyelmeztetés. Korrekció után mindig a
TELJES többhetes ajánlást add újra. A sajtokra vonatkozó tejjelzés-kivétel és a részletes táblaszabályok:
`current/principles/interfood-food-preferences.md`.

## Biztonsági határ

Publikus menüolvasás nem nyit böngészőt. Fiókadat csak a tartós, dedikált UBH-profilon keresztül olvasható; a
token nem hagyja el a bővítményt. Kosár draft-módosítás visszafordítható. Leadott rendelés módosítása és fizetési
hatás csak az adott immutable preview hash-re adott friss owner-jóváhagyással történhet.

# interfood-ordering / _intake

1. Olvasd a `__agent/SOURCE_OF_TRUTH.md` Interfood-sorait.
2. Futtasd: `ma interfood weeks --pretty`.
3. Fiókadatnál futtasd: `ma interfood auth status --pretty`; ha nincs élő session, egyszer hívd az
   `auth start` parancsot, majd a user a dedikált profilban jelentkezik be.
4. A user által kért hét, napi étkezésszám, egészségmód, kizárások és már lefedett napok legyenek explicit inputok.
5. Ne állj meg ételenként: a teljes menü feldolgozása után egyetlen bizonytalansági batch készüljön linkelhető
   `menuItemId`, dátum, adag és ajánlás adatokkal.

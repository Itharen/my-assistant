# Organizer FR — lefedettség-végéhez kötött dinamikus ismétlődés

> Organizer feedback ref: `feature-request:6a8ed22adeaa21f637fca0f2`
>
> Felvéve: 2026-08-26 · priority: high · status: new

## Probléma

Bizonyos feladatok nem fix naponta/hetente/havonta ismétlődnek. A következő
esedékesség attól függ, hogy az előző teljesítés meddig biztosított
lefedettséget. Interfoodnál egyszer 2, máskor 3 hét rendelhető előre.

## Kért általános modell

- teljesítéskor rögzíthető `coverageEnd` / `orderedThrough`;
- konfigurálható lead time és célnap vagy napablak;
- automatikusan generált következő task a lefedettség vége előtt;
- az aktuális lefedett időszak és a számított következő esedékesség látható;
- csúszáskor újraszámítás és prioritás-eszkaláció;
- API/tool támogatás, hogy külső ellenőrző eszköz frissíthesse a lefedettséget;
- ne Interfood-specifikus legyen: készlet, gyógyszer, előfizetés és más
  ellátottság-alapú folyamat is használhassa.

## Interfood acceptance példa

Ha a rendelés péntekig két hétre előre lefed, a következő rendelési task az
utolsó fedett hét kedd–szerda időablakában jelenjen meg. A teljesítéskor
rögzített új `coverageEnd` alapján induljon a következő ciklus.

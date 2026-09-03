# linkedin-inbox-review / sync-and-collect

1. Futtasd a read-only inkrementális syncet.
2. Kérd le a `needs-reply` listát lapozva addig, amíg `nextOffset = null`.
3. Alkalmazd az intake időablakát a legutolsó üzenet időpontjára.
4. Minden jelölthöz olvasd be a teljes threadet; az első oldal vagy az utolsó üzenet önmagában nem elég.
5. A tartós logba csak aggregált technikai adat kerülhet: oldalszám, darabszám, cutoff és hibakód.
6. Ha az élő séma ismeretlen mezőt ad, állj meg az érintett klasszifikációnál, őrizd meg lokálisan a raw sort,
   és készíts érték-redaktált regression fixture-t.

Kimenet: időrendezett, teljes kontextussal rendelkező technikai jelöltlista a triage fázisnak.


# Event — on-test-fail

> `pnpm test` failel.

## Mit csinálj

1. **Olvasd be** a teljes test output
2. **Kategorizáld:**
   - **Új feature mellé hiányzó test** → írj unit teszt → `06-implement`-re
   - **Régi test rosszul karbantartott** + valós új viselkedés OK → frissítsd a tesztet
   - **Régi test új viselkedést helyesen elutasít** → a kódod hibás, javítsd
   - **Flaky test** → flag + retry, ha 3× failel → `events/dev/on-user-needed.md`

3. **Coverage csökkenés** ellenőrzés (`pnpm test:coverage`):
   - Ha új feature mellé hiányzik unit teszt → kötelező hozzáadni
   - 75% küszöb alá ne csökkenjen (CCAP-minta 19. alapelv)

4. **Maximum 3 fix-próbálkozás** — utána user-needed

## STATUS_DEV update

```yaml
last_cycle:
  test_status: failed
phase_notes: |
  Test fail: <test-name>, <project>. Javítás folyamatban.
```

## Action-log emit

```json
{ "kind": "error",
  "summary": "Test fail: <test>, <project>",
  "extra": { "test": "...", "project": "...", "coverage_delta": "..." } }
```

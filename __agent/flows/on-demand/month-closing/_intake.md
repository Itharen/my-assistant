# month-closing / _intake

## Kérdések a usernek

1. **Melyik hónapot zárjuk?** (default: az aktuális, ha még a hónap utolsó hetében
   vagyunk; egyébként az előzőt)
2. **Mind a 3 subflow-t végigmenjük?** (financial / retro / planning)
   - Ha nem mind, melyek?
3. **Van olyan kontextus** amit tudnod kell? (váratlan esemény, nagy költés, projekt-mérföldkő)

## Kontextus betöltés

- `log/daily/{adott-honap}/*.md` — havi napi log-ok
- `log/monthly/{előző hónap}.md` — előző havi zárás (összehasonlításhoz)
- `data/wallet.md`, `data/tasks.md`

## Output

`STATUS.md`:
```yaml
state: flow-active
active_flow: on-demand/month-closing
active_phase: _subflow-1-financial    # vagy amit a user választott
```

# month-closing / _close

## Lezárás

1. **`log/monthly/{YYYY-MM}.md`** létrehozva:

```markdown
# Havi zárás — {YYYY-MM}

## Pénzügy
{subflow-1 output}

## Retro
{subflow-2 output}

## Jövő havi célok
{subflow-3 output, jóváhagyott formában}
```

2. **`data/wallet.md`** havi összesítés szekciója appendelve

3. **`data/tasks.md`** — a "Jövő havi célok"-ból P-szintű feladatok kerüljenek a backlog-ba

4. **`log/recurring.md`** append (ha recurring-ként is fut):
```yaml
- flow: month-closing
  ran_at: {ISO timestamp}
  outcome: completed
  scope: {YYYY-MM}
```

5. **`STATUS.md`** reset → `idle`

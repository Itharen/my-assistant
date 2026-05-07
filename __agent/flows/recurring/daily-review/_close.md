# daily-review / _close

## Lezárás

1. **`data/tasks.md`** — mai feladatok véglegesítve "today" jelöléssel
2. **`log/daily/{YYYY-MM-DD}.md`** létrehozva:

```markdown
# Daily — {YYYY-MM-DD}

## Reggeli állapot
- Energiaszint: {1-10}
- Fix időpontok: {lista}

## Mai prioritások
- 🔴 {P0 feladatok}
- 🟠 {P1 feladatok}

## Blokkolók
- {ha van}

## Esti retro (kitölteni napvégén)
- Mi készült el:
- Mi csúszott:
- Tanulság:
```

3. **`log/recurring.md`** append:
```yaml
- flow: daily-review
  ran_at: {ISO timestamp}
  outcome: completed
```

4. **`STATUS.md`** reset:
```yaml
state: idle
active_flow: null
active_phase: null
last_event: {ISO timestamp}
last_event_type: flow-complete
```

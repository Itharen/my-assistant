# log/

Session és flow lezáró logok. Időbeli rétegek.

## Struktúra

```
log/
├── daily/
│   └── {YYYY-MM-DD}.md       # napi log (daily-review _close írja)
├── monthly/
│   └── {YYYY-MM}.md          # havi zárás (month-closing _close írja)
├── feedback/
│   └── {YYYY-MM-DD}.md       # user feedback bejegyzések
├── recurring.md              # recurring flow futás-történet (yaml lista)
└── README.md
```

## recurring.md formátum

```yaml
- flow: daily-review
  ran_at: 2026-05-07T08:15:00+02:00
  outcome: completed | partial | skipped
  notes: ""
- flow: month-closing
  ran_at: 2026-04-30T19:00:00+02:00
  outcome: completed
  scope: 2026-04
```

## Cél

- Visszanézhető legyen mit csináltunk és mikor
- Recurring esedékesség számítható
- Retro flow-knak (weekly, monthly) inputja

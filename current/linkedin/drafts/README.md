# ✍️ LinkedIn válasz-piszkozatok

> **Owner, 2026-09-11 02:15:** *„amiket piszkozatokat írsz, az be is kéne kerüljön a My Assistant
> rendszerébe. Lehet, hogy az lenne a legjobb, hogyha **fájlba lenne mentve**, és akkor azt
> **kezelné direkt be a rendszer**."*

## Két fájl piszkozatonként — és miért

| Fájl | Mi | Kinek |
|---|---|---|
| `<név>.body.txt` | **PONTOSAN az a szöveg, ami kimegy.** Semmi más: se fejléc, se magyarázat | a **rendszernek** — ez a `--body-file` bemenete |
| `<név>.md` | az **indoklás**: miért így, mi az owner álláspontja, mi vár döntésre | **neked** |

🔴 **Miért kellett szétválasztani:** először egyetlen markdownba írtam a szöveget és a
magyarázatot együtt. ⚠️ Abból a rendszer **nem tud** üzenetet küldeni — a `body` mezőbe a
kommentár is bekerült volna. A szétválasztás után a `.body.txt` **gépileg feldolgozható**.

## Bekötés a rendszerbe

```bash
ma linkedin reply draft --thread <threadId> --body-file <ABSZOLÚT útvonal a .body.txt-hez>
ma linkedin reply list          # mi van piszkozatban
ma linkedin reply show --id ... # a teljes szöveg
```

⚠️ **A `--body-file` ABSZOLÚT útvonalat vár** *(`MA-LINKEDIN-DRAFT-PATH`)*.
📌 A rendszer tárolója a gitignore-olt `~/.config/my-assistant/linkedin/cache.json`; ⛔ a repóban
maradó fájlok **a forrás és az indoklás**, nem a duplikátum — a kettő szerepe más.

## ⛔ Amit a rendszer NEM tesz meg

A `reply draft` **csak tárol** — LinkedIn-re **semmit nem küld**. A kiküldés külön lépés, és
owner-kapu. *(`__documentations/dev/LINKEDIN_INBOX_CLI.md`)*

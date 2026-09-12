#!/usr/bin/env python3
"""A magyar szó-lexikon ÚJRAGENERÁLÁSA a repó saját markdown-jaiból (18. tétel).

⭐ MIÉRT A REPÓBÓL, és ⛔ miért nem az átiratokból:
   a lexikon feladata megmondani, hogy egy szó LÉTEZIK-e. Ha a felismerés kimenetéből
   építenénk, a halandzsa-szavak *(„fysisz", „szipotékig")* önmagukat legitimálnák — a szűrő
   pedig pontosan azt engedné át, amit meg kellene fognia.

⭐ MIÉRT GYAKORISÁG ≥ 2: az egyetlen előfordulás lehet elírás vagy éppen egy beidézett
   félrehallás. Mérve 2026-09-12 (207 beszéd-átirat): a ≥2-es szűrés a valódi üzenetek
   ismeretlen-arányát 0,000 medián / 0,114 p95-ről 0,057 / 0,174-re tolta, de a halandzsát
   0,200-ról 0,375-re — azaz ⭐ SZÉTHÚZTA a kettőt, ami a döntés szempontjából a lényeg.

Használat:
    PYTHONUTF8=1 python scripts/build-hu-lexicon.py
    (a kimenet: cli/data/hu-lexicon.txt — git-trackelt, generált artefakt)
"""

import collections
import glob
import io
import os
import re
import unicodedata

# ⚠️ SZÁNDÉKOSAN NEM tartalmazza az `__agent/`-et: a handoff és a napló IDÉZI a halandzsát
# („a pro fysisz per lágrában"), tehát pont a keresett szavakat legitimálná.
SOURCES = [
    'current/**/*.md',
    '__documentations/**/*.md',
    '__specifications/**/*.md',
]

OUTPUT = os.path.join('cli', 'data', 'hu-lexicon.txt')
MIN_FREQUENCY = 2
WORD = re.compile(r"[0-9a-zA-Záéíóöőúüű'-]+", re.U)


def normalize(word: str) -> str:
    """Kisbetű + ékezet-lebontás — így az ékezet nélküli felismerés is egyezik."""
    decomposed = unicodedata.normalize('NFD', word.lower())
    return ''.join(c for c in decomposed if unicodedata.category(c) != 'Mn')


def main() -> None:
    frequency: collections.Counter = collections.Counter()
    files = 0

    for pattern in SOURCES:
        for path in glob.glob(pattern, recursive=True):
            try:
                text = io.open(path, encoding='utf-8', errors='ignore').read()
            except OSError:
                continue
            files += 1
            for word in WORD.findall(text):
                frequency[normalize(word)] += 1

    kept = sorted(w for w, c in frequency.items() if c >= MIN_FREQUENCY and len(w) > 2)

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with io.open(OUTPUT + '.tmp', 'w', encoding='utf-8', newline='\n') as handle:
        handle.write('\n'.join(kept) + '\n')
    os.replace(OUTPUT + '.tmp', OUTPUT)

    print('forras-fajl: %d | kulonbozo szo: %d | lexikon (>=%d elofordulas, >2 karakter): %d'
          % (files, len(frequency), MIN_FREQUENCY, len(kept)))
    print('kiirva: %s' % OUTPUT)


if __name__ == '__main__':
    main()

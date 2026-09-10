#!/bin/bash
set -e
WD=$(pwd -W 2>/dev/null || pwd)
"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu --no-sandbox \
  --print-to-pdf="$WD/cv-10.pdf" --no-pdf-header-footer \
  --virtual-time-budget=8000 "file:///$WD/cv-10.html" 2>&1 | grep -vi "^\[" || true
"/c/Program Files/Python310/python" - <<'PY'
import fitz
d=fitz.open('cv-10.pdf')
print('oldalak:',d.page_count)
for i,p in enumerate(d): p.get_pixmap(dpi=110).save('cv10-p%d.png'%(i+1))
PY

# 🔴 FRISSESSEG-OR: a Chrome NEMAN is bukhat (mert eset 2026-09-11 01:00) — olyankor a
# regi PDF marad a helyen, es a ra epulo meres a ROSSZ lapot meri. A hiba lathatatlan,
# mert a mereseim "sikeresen" lefutnak. Ezert a render UTAN kotelezo osszevetni az idobelyegeket.
"/c/Program Files/Python310/python" - <<'PY2'
import os, sys
html, pdf = os.path.getmtime('cv-10.html'), os.path.getmtime('cv-10.pdf')
if pdf < html:
    print('🔴 ELAVULT PDF: a cv-10.pdf REGEBBI, mint a cv-10.html (%.1f mp) — a render BUKOTT.' % (html - pdf))
    sys.exit(1)
print('frissesseg: OK (a PDF ujabb, mint a forras)')
PY2

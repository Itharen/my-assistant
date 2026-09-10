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

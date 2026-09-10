#!/bin/bash
# CV render: HTML -> PDF -> PNG oldalankent, majd diff a forrassal.
set -e
WD=$(pwd -W 2>/dev/null || pwd)
CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe"
"$CHROME" --headless --disable-gpu --no-sandbox \
  --print-to-pdf="$WD/repro.pdf" --no-pdf-header-footer \
  --virtual-time-budget=8000 "file:///$WD/cv.html" 2>&1 | grep -vi "^\[" || true
"/c/Program Files/Python310/python" - <<'PY'
import fitz
d=fitz.open('repro.pdf')
print('repro pages:',d.page_count,'size:',[round(v,1) for v in (d[0].rect.width,d[0].rect.height)])
for i,p in enumerate(d):
    p.get_pixmap(dpi=110).save('repro-p%d.png'%(i+1))
PY

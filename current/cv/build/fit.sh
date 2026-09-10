#!/bin/bash
# Megmeri a VALOS tartalom-magassagot (1600pt-os lapon, ahol semmi nem klippelodik),
# es kiirja, mennyit kell meg vagni a 30pt-os (10 mm) nyomtatasi also margohoz.
set -e
"/c/Program Files/Python310/python" - <<'PY'
import io
src=io.open('cv-10.html',encoding='utf-8').read()
io.open('probe.html','w',encoding='utf-8',newline='').write(src.replace(
 '<link rel="stylesheet" href="cv.css">',
 '<link rel="stylesheet" href="cv.css"><style>@page{size:595.5pt 1600pt;margin:0}.page{height:1600pt}</style>'))
PY
WD=$(pwd -W 2>/dev/null || pwd)
"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu --no-sandbox \
  --print-to-pdf="$WD/probe.pdf" --no-pdf-header-footer --virtual-time-budget=8000 "file:///$WD/probe.html" >/dev/null 2>&1
"/c/Program Files/Python310/python" - <<'PY'
import fitz
d=fitz.open('probe.pdf'); TARGET=841.9-30
for i,p in enumerate(d):
    mn=max((l['bbox'][3] for b in p.get_text('dict')['blocks'] if b['type']==0 for l in b['lines'] if l['bbox'][0]>=215), default=0)
    need=mn-TARGET
    print('oldal %d fo-oszlop: alja %.1f | %s %.1fpt'%(i+1,mn,'MEG VAGNI:' if need>0 else 'van meg hely:',abs(need)))
PY

"""Egymas melle rakja a 9.0 forrast (bal) es a 10.0-t (jobb), oldalankent.
Ez az, amit az owner nez: OSSZEHASONLITAS-9.0-vs-10.0.pdf
Futtatas:  python build-comparison.py   (a render10.sh UTAN)
"""
import fitz

OLD, NEW, OUT = '../cv-9.0-2026-09-10.pdf', 'cv-10.pdf', 'OSSZEHASONLITAS-9.0-vs-10.0.pdf'
GUT, PAD = 35, 18            # kozepso koz es a lap korulotti keret

old, new = fitz.open(OLD), fitz.open(NEW)
W, H = old[0].rect.width, old[0].rect.height
out = fitz.open()

for i in range(max(len(old), len(new))):
    page = out.new_page(width=W * 2 + GUT, height=H + PAD * 2)
    for j, (src, x) in enumerate(((old, PAD - 18), (new, W + GUT))):
        if i >= len(src):
            page.insert_text((x + W / 2 - 60, H / 2), 'nincs ilyen oldal', fontsize=14, color=(.6, .6, .6))
            continue
        page.show_pdf_page(fitz.Rect(x, PAD, x + W, PAD + H), src, i)
    page.draw_line(fitz.Point(W + GUT / 2, 0), fitz.Point(W + GUT / 2, H + PAD * 2), color=(.8, .8, .8), width=1)
    page.insert_text((PAD, 13), '9.0 (Canva, jelenlegi)', fontsize=10, color=(.4, .4, .4))
    page.insert_text((W + GUT, 13), '10.0 (AI / B2B, HTML+CSS)', fontsize=10, color=(.4, .4, .4))

out.save(OUT)
print('%s -> %d oldal' % (OUT, len(out)))

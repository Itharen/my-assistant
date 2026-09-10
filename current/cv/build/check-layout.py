"""TELJES elrendezes-ellenorzes a kesz cv-10.pdf-en.
Miert kell: a korabbi "sidebar also margo" meres a LEGALSO sort nezte — az viszont az
ABSZOLUT pozicionalt nev-blokk volt, ezert a folyo szoveg RACSUSZASA lathatatlan maradt.
Ezt merte az owner szemmel, nem a szkript. Futtatas: python check-layout.py
"""
import sys, fitz

DOC = sys.argv[1] if len(sys.argv) > 1 else 'cv-10.pdf'
PAGE_H, BOTTOM_MIN = 841.9, 28.3          # 28,3pt = 10 mm
SIDEBAR_X, MAIN_X = 215.0, 340.0
problems = 0
doc = fitz.open(DOC)

for pi, page in enumerate(doc):
    # A blokk-index is kell: EGY blokkon (bekezdesen) belul a nagy display-sorok
    # glifa-dobozai jogosan atfednek — a forras 9.0-ban a nev ket sora 7,49pt-tal fed at.
    # Valodi utkozes csak KULONBOZO blokkok kozott van (pl. abszolut div vs. folyo bekezdes).
    lines = [(l['bbox'], l['spans'][0]['text'][:44], bi)
             for bi, b in enumerate(page.get_text('dict')['blocks']) if b['type'] == 0 for l in b['lines']]
    side = [x for x in lines if x[0][0] < SIDEBAR_X]
    main = [x for x in lines if x[0][0] >= SIDEBAR_X]
    print('=== oldal %d ===' % (pi + 1))

    for name, group in (('fo-oszlop', main), ('sidebar', side)):
        if not group:
            continue
        low = max(x[0][3] for x in group)
        margin = PAGE_H - low
        ok = margin >= BOTTOM_MIN
        problems += 0 if ok else 1
        print('  %-9s also margo: %5.1fpt (%.1f mm) %s' % (name, margin, margin / 72 * 25.4, 'OK' if ok else '🔴 SZUK'))

    # ⭐ ATFEDES — ezt hagyta ki a regi meres
    for group, name in ((side, 'sidebar'), (main, 'fo-oszlop')):
        for i in range(len(group) - 1):
            for j in range(i + 1, len(group)):
                a, b = group[i][0], group[j][0]
                oy = min(a[3], b[3]) - max(a[1], b[1])
                ox = min(a[2], b[2]) - max(a[0], b[0])
                if oy > 1.0 and ox > 1.0 and group[i][2] != group[j][2]:
                    problems += 1
                    print('  🔴 %s ATFEDES %.1fx%.1fpt: %r <-> %r' % (name, ox, oy, group[i][1], group[j][1]))

    # jelolok: pont/nyil torlodas ugyanabban a sorban
    dots, arrows = [], []
    for dr in page.get_drawings():
        r = dr['rect']
        if not (330 < r.x0 < 350):
            continue
        if abs(r.width - r.height) < 1.5 and 6 < r.width < 10:
            dots.append(r)
        elif 6 < r.width < 12 and 8 < r.height < 13:
            arrows.append(r)
    coll = sum(1 for a in arrows for d in dots if abs((a.y0 + a.y1) / 2 - (d.y0 + d.y1) / 2) < 6)
    problems += coll
    print('  jelolok: %d pont, %d nyil, %d torlodas %s' % (len(dots), len(arrows), coll, '' if coll == 0 else '🔴'))

print('\n%s' % ('✅ TISZTA' if problems == 0 else '🔴 %d PROBLEMA' % problems))
sys.exit(0 if problems == 0 else 1)

import fitz, sys
def lines(path,pno):
    d=fitz.open(path); out=[]
    for b in d[pno].get_text('dict')['blocks']:
        if b['type']!=0: continue
        for l in b['lines']:
            t=''.join(s['text'] for s in l['spans']).strip()
            if t: out.append((t,l['bbox']))
    return out
pno=int(sys.argv[1]) if len(sys.argv)>1 else 0
A=lines('../cv-9.0-2026-09-10.pdf',pno); B=lines('repro.pdf',pno)
bi={}
for t,bb in B: bi.setdefault(t,bb)
print('%-52s %8s %8s %6s | %8s %8s %6s'%('line','x_orig','x_repr','dx','y_orig','y_repr','dy'))
miss=[]
for t,bb in sorted(A,key=lambda r:r[1][1]):
    if t not in bi: miss.append(t); continue
    c=bi[t]
    dx=c[0]-bb[0]; dy=c[1]-bb[1]
    flag='' if abs(dx)<1.2 and abs(dy)<1.6 else '  <<<'
    print('%-52s %8.1f %8.1f %6.1f | %8.1f %8.1f %6.1f%s'%(t[:52],bb[0],c[0],dx,bb[1],c[1],dy,flag))
print('\nNEM TALALT sorok az eredetibol (%d):'%len(miss))
for t in miss[:40]: print('  -',t[:70])
extra=[t for t,_ in B if t not in dict((x,1) for x,_ in A)]
print('\nCSAK a reprodukcioban (%d):'%len(extra))
for t in extra[:40]: print('  +',t[:70])

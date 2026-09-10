"""📥 LinkedIn ARCHIVÁLÓ — a posztok és a profil-pozicionálás mentése a repóba.

> **Owner, 2026-09-11 01:51:** *„mindenképpen legyen lementve a mostani, eddigi posztjaim, meg
> amiket majd csinálunk a jövőben, posztolunk, azokat is mindenképpen legyenek felírva."*

Miért a repóba: ezek NYILVÁNOS posztok, és ez a **kalibrációs korpusz** a jövőbeli
poszt-piszkozatokhoz. Verziózva kell lennie, hogy látszódjon, mi mikor került ki.

🔒 A PROFIL-ból KIZÁRÓLAG a pozicionálási mezők mentődnek. ⛔ A cím, az irányítószám és a
születési dátum SOHA nem kerül a repóba.

Futtatás:  python scripts/linkedin-archive.py
"""
import io, json, os, sys, urllib.request

API = 'https://api.linkedin.com/rest/memberSnapshotData'
# ⛔ SOHA nem mentjük: minden, ami nem a nyilvános pozicionálásról szól.
PROFILE_PUBLIC = ('First Name', 'Last Name', 'Headline', 'Summary', 'Industry',
                  'Geo Location', 'Websites', 'Twitter Handles')


def token() -> str:
    for line in io.open('.env', encoding='utf-8'):
        if line.startswith('LINKEDIN_MEMBER_ACCESS_TOKEN='):
            return line.split('=', 1)[1].strip()
    raise SystemExit('🔴 Nincs LINKEDIN_MEMBER_ACCESS_TOKEN a .env-ben.')


def fetch(domain: str, tok: str) -> list:
    """Egy domain teljes snapshotja. ⚠️ A NOT_READY nem hiba — ilyenkor ures listat adunk."""
    req = urllib.request.Request(
        f'{API}?q=criteria&domain={domain}&start=0&count=1',
        headers={'Authorization': f'Bearer {tok}', 'LinkedIn-Version': '202312',
                 'X-Restli-Protocol-Version': '2.0.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = json.loads(r.read().decode('utf-8'))
    out = []
    for e in body.get('elements') or []:
        out += e.get('snapshotData') or []
    return out


def main() -> int:
    tok = token()
    os.makedirs('current/linkedin/posts', exist_ok=True)

    posts = fetch('MEMBER_SHARE_INFO', tok)
    posts.sort(key=lambda p: str(p.get('Date') or ''))
    kept = 0
    for p in posts:
        date = str(p.get('Date') or '')[:10] or 'unknown'
        text = (p.get('ShareCommentary') or '').strip()
        if not text:
            continue
        # Egy fajl = egy poszt. A nev a datumbol + a szoveg elso szavaibol all -> stabil es kereshetoe.
        slug = '-'.join(''.join(c.lower() if c.isalnum() else ' ' for c in text[:60]).split())[:48]
        path = f'current/linkedin/posts/{date}-{slug}.md'
        io.open(path, 'w', encoding='utf-8', newline='').write(
            f'---\ndate: {p.get("Date")}\nvisibility: {p.get("Visibility")}\n'
            f'link: {p.get("ShareLink")}\n---\n\n{text}\n')
        kept += 1

    prof = fetch('PROFILE', tok)
    if prof:
        safe = {k: v for k, v in prof[0].items() if k in PROFILE_PUBLIC and str(v).strip()}
        io.open('current/linkedin/profile-current.json', 'w', encoding='utf-8', newline='').write(
            json.dumps(safe, ensure_ascii=False, indent=2) + '\n')

    print(f'✅ {kept} poszt mentve -> current/linkedin/posts/')
    print(f'✅ profil-pozicionalas mentve ({len(safe)} mezo) -> current/linkedin/profile-current.json'
          if prof else '⚠️ a PROFILE domain nem adott adatot')
    return 0


if __name__ == '__main__':
    sys.exit(main())

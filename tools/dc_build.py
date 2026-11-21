#!/usr/bin/env python3
"""Construit data-dc.js (univers DC de l'explorateur) à partir de content/dc_entries.py (textes Primestone)
et de content/dc_wiki.json (sources vérifiées, images actuelles). Échoue si une relation ou un nœud de carte est inconnu.
Lancer : python3 tools/dc_build.py"""
import json, pathlib, re, sys, importlib.util
ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('dc', ROOT / 'content/dc_entries.py'); dc = importlib.util.module_from_spec(spec); spec.loader.exec_module(dc)
W = json.loads((ROOT / 'content/dc_wiki.json').read_text())['entries']
P = lambda i: 'dc_' + i
err, E, IMG, WT = [], {}, {}, {}
for i, (fr, en, cat, sub, desc, rel, fact) in dc.E.items():
    w = W.get(i) or {}
    f = dict((a, b) for a, b in w.get('facts', []))
    if 'Première apparition' in f:
        src = f['Première apparition'][0]
    elif w.get('issue'):
        t = re.sub(r' Vol (\d+) (\S+)$', lambda m: ('' if m.group(1) == '1' else ' vol. ' + m.group(1)) + ' #' + m.group(2), w['title'])
        src = t + (' (' + f['Année'][0] + ')' if 'Année' in f else '')
    else:
        src = ''
    if not src: err.append(i + ' : aucune source vérifiée')
    for r in rel.split():
        if r not in dc.E: err.append(i + ' : relation inconnue ' + r)
    year = int(f['Année'][0]) if cat == 'evt' and 'Année' in f and f['Année'][0].isdigit() else None
    E[P(i)] = [fr, en, cat, sub, desc, src, 'u', ' '.join(P(r) for r in rel.split()), fact] + ([year] if year else [])
    if w.get('img'): IMG[P(i)] = w['img']
    if w.get('title'): WT[P(i)] = w['title']
maps = []
for m in dc.MAPS:
    m = json.loads(json.dumps(m))
    for n in m.get('nodes', []):
        if n[0] not in dc.E: err.append(m['n'] + ' : nœud inconnu ' + n[0])
        n[0] = P(n[0])
    for k in ('wheel',):
        if k in m: m[k] = [P(x) for x in m[k]]
    for k in ('edges', 'fam'):
        for e in m.get(k, []):
            for x in e[:2]:
                if x not in dc.E: err.append(m['n'] + ' : lien inconnu ' + x)
            e[0], e[1] = P(e[0]), P(e[1])
    for o in m.get('orbits', []):
        for x in o['ids']:
            if x not in dc.E: err.append(m['n'] + ' : orbite inconnue ' + x)
        o['ids'] = [P(x) for x in o['ids']]
    if 'spokes' in m:
        for row in m['spokes']['ids']:
            for x in row:
                if x not in dc.E: err.append(m['n'] + ' : rayon inconnu ' + x)
        m['spokes']['ids'] = [[P(x) for x in row] for row in m['spokes']['ids']]
    maps.append(m)

# ——— liens de parenté DC, déduits du champ « Relatives » des fiches du wiki (rôle entre parenthèses)
def key(x): return re.sub(r'[^a-z0-9]', '', x.lower())
names = {}
for i, v in dc.E.items():
    for n in (v[1], re.sub(r'\s*\(.*?\)', '', v[1]), v[0], re.sub(r'\s*\(.*?\)', '', (W.get(i) or {}).get('title', ''))):
        if n and len(key(n)) > 2: names.setdefault(key(n), i)
for a in ('God', 'Yahweh', 'The Presence'): names[key(a)] = 'presence'
ROLE_P, ROLE_C, ROLE_S = r'\b(mother|father|creator|parent)\b', r'\b(son|daughter|child|children)\b', r'\b(brother|sister|sibling|siblings|twin)\b'
FRN = [(r'adoptive|adopted|foster', 'adoptif'), (r'half-(brother|sister)', 'demi-frère ou demi-sœur'), (r'twin', 'jumeau'), (r'mother', 'mère'), (r'father', 'père'), (r'creator', 'créateur'), (r'daughter', 'fille'), (r'\bson\b', 'fils'), (r'deceased', 'décédé')]
def frn(r):
    out = [b for a, b in FRN if re.search(a, r)]
    return ', '.join(dict.fromkeys(out))
FAMP, FAMS, seen = [], [], set()
for me, (fr, en, *_ ) in dc.E.items():
    for lab, vals in (W.get(me) or {}).get('facts', []):
        if lab != 'Proches': continue
        for v in vals:
            m = re.match(r'^(.*?)\s*\(([^()]*)\)\s*$', v.strip())
            if not m: continue
            nm, role = re.sub(r'\s*\(.*?\)', '', m.group(1)).strip(' "'), m.group(2).lower()
            j = names.get(key(nm))
            if not j or j == me or re.search(r'grand|great|in-law|step|niece|nephew|uncle|aunt|cousin|ancestor|spiritual', role): continue
            if re.search(ROLE_P, role): pair, side = (j, me), 'p'
            elif re.search(ROLE_C, role): pair, side = (me, j), 'c'
            elif re.search(ROLE_S, role):
                if frozenset((me, j)) not in seen: seen.add(frozenset((me, j))); FAMS.append([P(me), P(j), frn(role)])
                continue
            else: continue
            if pair not in seen: seen.add(pair); FAMP.append([P(pair[0]), P(pair[1]), frn(role), side])
FAMS = [x for x in FAMS if not any({x[0], x[1]} == {a, b} for a, b, *_ in FAMP)]
(ROOT / 'content/dc_family.json').write_text(json.dumps({'source': 'Champ Relatives des fiches de dc.fandom.com (content/dc_wiki.json)', 'parents': FAMP, 'siblings': FAMS}, ensure_ascii=False, indent=1) + '\n')
if err: sys.exit('Données DC incohérentes :\n- ' + '\n- '.join(err))
js = '/* Univers DC de l\'explorateur : généré par tools/dc_build.py (ne pas modifier à la main). */\nwindow.DBDC=' + json.dumps({'E': E, 'MAPS': maps, 'IMG': IMG, 'WIKI': WT, 'FAM': {'p': FAMP, 's': FAMS}}, ensure_ascii=False, separators=(',', ':')) + ';\n'
if '--check' in sys.argv:
    ok = (ROOT / 'data-dc.js').exists() and (ROOT / 'data-dc.js').read_text() == js
    print('data-dc.js à jour' if ok else 'data-dc.js périmé : python3 tools/dc_build.py'); sys.exit(0 if ok else 1)
(ROOT / 'data-dc.js').write_text(js)
print(len(E), 'fiches DC ·', len(IMG), 'images ·', len(maps), 'cartes')

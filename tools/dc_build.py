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
if err: sys.exit('Données DC incohérentes :\n- ' + '\n- '.join(err))
js = '/* Univers DC de l\'explorateur : généré par tools/dc_build.py (ne pas modifier à la main). */\nwindow.DBDC=' + json.dumps({'E': E, 'MAPS': maps, 'IMG': IMG, 'WIKI': WT}, ensure_ascii=False, separators=(',', ':')) + ';\n'
if '--check' in sys.argv:
    ok = (ROOT / 'data-dc.js').exists() and (ROOT / 'data-dc.js').read_text() == js
    print('data-dc.js à jour' if ok else 'data-dc.js périmé : python3 tools/dc_build.py'); sys.exit(0 if ok else 1)
(ROOT / 'data-dc.js').write_text(js)
print(len(E), 'fiches DC ·', len(IMG), 'images ·', len(maps), 'cartes')

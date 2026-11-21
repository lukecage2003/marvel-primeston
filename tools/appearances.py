#!/usr/bin/env python3
"""Apparitions de chaque fiche, relevées sur les wikis communautaires (catégorie « <page>/Appearances », triée
par date de parution) : nombre total, quatre premières et quatre dernières parutions.
Sortie : content/appearances.json   ·   Lancer : python3 tools/appearances.py"""
import json, re, time, pathlib, urllib.parse, urllib.request
ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'CosmologieMarvelAtlas/1.0 (fan reference project)'}
def api(site, params):
    url = f'https://{site}.fandom.com/api.php?' + urllib.parse.urlencode({'format': 'json', **params})
    for a in range(4):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))
        except Exception: time.sleep(2 ** a)
    return {}
def label(t):
    m = re.match(r'(.*) Vol (\d+) (\S+)$', t)
    return (m.group(1) + ('' if m.group(2) == '1' else ' vol. ' + m.group(2)) + ' #' + m.group(3).lstrip('#')) if m else t
jobs = []
for site, f, pre in (('marvel', 'content/wiki.json', ''), ('dc', 'content/dc_wiki.json', 'dc_')):
    for i, w in json.loads((ROOT / f).read_text())['entries'].items():
        if not w.get('issue') and not w['title'].startswith('Glossary:'): jobs.append((site, pre + i, w['title']))
out = {}
for site in ('marvel', 'dc'):
    J = [j for j in jobs if j[0] == site]
    for k in range(0, len(J), 40):  # nombre d'apparitions, par lots
        b = J[k:k + 40]
        q = api(site, {'action': 'query', 'prop': 'categoryinfo', 'titles': '|'.join('Category:' + t + '/Appearances' for _, _, t in b)}).get('query', {})
        al = {n['from']: n['to'] for n in q.get('normalized', [])}
        P = {p['title']: p for p in q.get('pages', {}).values()}
        for _, i, t in b:
            c = 'Category:' + t + '/Appearances'; p = P.get(al.get(c, c), {})
            n = (p.get('categoryinfo') or {}).get('pages', 0)
            if n: out[i] = {'n': n, 'cat': c}
        time.sleep(.4)
    for _, i, t in J:  # premières et dernières parutions (triées par date sur le wiki Marvel seulement ; le wiki DC trie par ordre alphabétique)
        if i not in out: continue
        if site == 'dc': del out[i]['cat']; continue
        r = {}
        for d in ('ascending', 'descending'):
            q = api(site, {'action': 'query', 'list': 'categorymembers', 'cmtitle': out[i]['cat'], 'cmlimit': 6, 'cmtype': 'page', 'cmdir': d})
            r[d] = [label(m['title']) for m in q.get('query', {}).get('categorymembers', []) if ' Vol ' in m['title']][:4]
            time.sleep(.25)
        out[i].update(first=r['ascending'], last=r['descending']); del out[i]['cat']
(ROOT / 'content/appearances.json').write_text(json.dumps({'source': "Catégories « Appearances » de marvel.fandom.com et dc.fandom.com ; sur le wiki DC, ces catégories sont triées par ordre alphabétique : seul le nombre d'apparitions est repris", 'entries': out}, ensure_ascii=False, indent=1) + '\n')
print(len(out), 'fiches avec apparitions')

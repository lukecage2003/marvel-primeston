#!/usr/bin/env python3
"""Relève, pour chaque fiche, l'image principale actuelle et une fiche d'identité FACTUELLE (champs courts de
l'infobox : nom actuel, alias, origine, réalité, affiliations, famille, créateurs, première apparition…) sur le
wiki communautaire marvel.fandom.com (contenu CC BY-SA, attribué sur chaque page).
Aucun texte rédigé (historique, présentation, citations) n'est repris : seulement des faits courts.
Sortie : content/wiki.json   ·   Lancer : python3 tools/wiki_facts.py   (en-tête User-Agent obligatoire, sinon 403)"""
import json, re, time, urllib.parse, urllib.request, datetime, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'CosmologieMarvelAtlas/1.0 (fan reference project)'}
# Usage : python3 tools/wiki_facts.py                       (Marvel : fiches de content/atlas.json -> content/wiki.json)
#         python3 tools/wiki_facts.py dc                    (DC : content/dc_titles.json -> content/dc_wiki.json)
SITE = 'dc' if 'dc' in sys.argv[1:] else 'marvel'
A = json.loads((ROOT / 'content/atlas.json').read_text()) if SITE == 'marvel' else None

# champ de l'infobox -> libellé affiché, nombre maximal d'éléments gardés
FIELDS = [('ReleaseDate', 'Parution', 1), ('Year', 'Année', 1), ('MainAlias', 'Nom actuel', 1), ('Writer1_1', 'Scénario', 1), ('Penciler1_1', 'Dessin', 1), ('CurrentAlias', 'Nom actuel', 1), ('RealName', 'Nom réel', 1), ('Aliases', 'Autres noms', 4), ('Origin', 'Nature', 1),
          ('Reality', 'Réalité', 2), ('Universe', 'Univers', 1), ('Occupation', 'Fonction', 2), ('Affiliation', 'Affiliations', 4),
          ('Parents', 'Parents', 3), ('Siblings', 'Fratrie', 3), ('Children', 'Descendance', 3), ('BaseOfOperations', 'Base', 2),
          ('Galaxy', 'Galaxie', 1), ('Locale', 'Lieu', 2), ('Type', 'Type', 1), ('Material', 'Matériau', 1), ('CurrentOwner', 'Détenteur', 1),
          ('Leaders', 'Dirigeants', 3), ('Relatives', 'Proches', 8), ('Creators', 'Créateurs', 4), ('First', 'Première apparition', 1)]
KEYS = {k for k, _, _ in FIELDS}


def api(params):
    url = f'https://{SITE}.fandom.com/api.php?' + urllib.parse.urlencode({'format': 'json', 'redirects': 1, **params})
    for attempt in range(4):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))['query']
        except Exception:
            time.sleep(2 ** attempt)
    raise SystemExit('wiki injoignable')


def clean(v):
    v = re.sub(r'<!--.*?-->', '', v, flags=re.S)
    v = re.sub(r'<ref[^>]*?/>|<ref.*?</ref>', '', v, flags=re.S)
    v = re.sub(r'\{\{(?:r|cl|ref|citation)\|[^{}]*\}\}', '', v, flags=re.I)
    for _ in range(3):
        v = re.sub(r'\{\{(?:m|mc|Minor|link)\|([^{}|]*)[^{}]*\}\}', r'\1', v, flags=re.I)
        v = re.sub(r'\{\{[^{}]*\}\}', '', v)
    v = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', v)
    v = re.sub(r"'''?|\[\[|\]\]", '', v)
    v = re.sub(r'<br\s*/?>', '\n', v)
    v = re.sub(r'<[^>]+>', '', v)
    return v


def items(raw, n):
    parts = [p.strip(' ;,*#:') for p in re.split(r'\n|;|\*', clean(raw))]
    parts = [re.sub(r'\s+', ' ', p) for p in parts if p and len(p) > 1 and not p.lower().startswith(('formerly', 'currently', 'category', 'none', 'unknown')) and p.lower() not in ('formerly', 'currently')]
    out = []
    for p in parts:
        p = p[:70].rstrip() + ('…' if len(p) > 70 else '')
        if p not in out:
            out.append(p)
    return out[:n]


def first_label(v):
    v = clean(v).strip().split('\n')[0]
    m = re.match(r'(.*) Vol (\d+) (\S+)$', v)
    return (m.group(1) + ('' if m.group(2) == '1' else ' vol. ' + m.group(2)) + ' #' + m.group(3).lstrip('#')) if m else v


def infobox(text):
    m0 = re.search(r'\{\{(?:Marvel|DC) Database:', text)
    i = m0.start() if m0 else -1
    if i < 0:
        return {}
    depth, j = 0, i
    while j < len(text):  # fin du modèle (accolades équilibrées)
        if text.startswith('{{', j): depth += 1; j += 2; continue
        if text.startswith('}}', j):
            depth -= 1; j += 2
            if depth == 0: break
            continue
        j += 1
    body, out = text[i:j], {}
    for m in re.finditer(r'\n\s*\|\s*(\w+)\s*=([^\n]*(?:\n(?!\s*\|\s*\w+\s*=)[^\n]*)*)', body):
        if m.group(1) in KEYS and m.group(2).strip():
            out[m.group(1)] = m.group(2)
    return out


def main():
    if SITE == 'marvel':
        titles = {id_: t for id_, t in A['wiki'].items() if id_ in A['nodes'] and not re.fullmatch(r'e\d+', id_)}
    else:
        titles = json.loads((ROOT / 'content/dc_titles.json').read_text())
    inv, res = {}, {}
    for id_, t in titles.items():
        inv.setdefault(t, []).append(id_)
    tl = list(inv)
    for k in range(0, len(tl), 40):
        batch = tl[k:k + 40]
        q = api({'action': 'query', 'prop': 'revisions|pageimages', 'rvprop': 'content', 'rvslots': 'main', 'piprop': 'thumbnail', 'pithumbsize': 900, 'titles': '|'.join(batch)})
        alias = {n['from']: n['to'] for n in q.get('normalized', [])}
        red = {n['from']: n['to'] for n in q.get('redirects', [])}
        pages = {p['title']: p for p in q['pages'].values()}
        for t in batch:
            real = red.get(alias.get(t, t), alias.get(t, t))
            p = pages.get(real)
            if not p or 'missing' in p:
                continue
            text = p['revisions'][0]['slots']['main']['*']
            if re.search(r'\{\{\s*disambig', text, re.I):
                continue
            box, facts = infobox(text), []
            for key, label, n in FIELDS:
                if key in box:
                    val = [first_label(box[key])] if key == 'First' else items(box[key], n)
                    if val and val[0]:
                        facts.append([label, val])
            img = (p.get('thumbnail') or {}).get('source', '')
            if not img.startswith('https://static.wikia.nocookie.net/'):
                img = ''
            for id_ in inv[t]:
                res[id_] = {'title': real, 'img': img, 'facts': facts, 'issue': bool(re.search(r'Vol \d+ \S+$', real))}
        time.sleep(0.5)
    # année de parution de chaque première apparition (lue sur la page du numéro)
    firsts = {}
    for r in res.values():
        for f in r['facts']:
            if f[0] == 'Première apparition' and not re.search(r'\((19|20)\d\d\)$', f[1][0]):
                m = re.match(r'(.*?)(?: vol\. (\d+))? #(\S+)$', f[1][0])
                if m: firsts[f[1][0]] = f'{m.group(1)} Vol {m.group(2) or 1} {m.group(3)}'
    years, tl2 = {}, list(set(firsts.values()))
    for k in range(0, len(tl2), 40):
        q = api({'action': 'query', 'prop': 'revisions', 'rvprop': 'content', 'rvslots': 'main', 'titles': '|'.join(tl2[k:k + 40])})
        alias = {n['from']: n['to'] for n in q.get('normalized', [])}; red = {n['from']: n['to'] for n in q.get('redirects', [])}
        pages = {p['title']: p for p in q['pages'].values()}
        for t in tl2[k:k + 40]:
            p = pages.get(red.get(alias.get(t, t), alias.get(t, t)))
            if p and 'missing' not in p:
                txt = p['revisions'][0]['slots']['main']['*']
                y = re.search(r'^\s*\|\s*(?:Year|Pubyear|ReleaseDate)\s*=\s*[^\n]*?((?:19|20)\d\d)', txt, re.M)
                if y: years[t] = y.group(1)
        time.sleep(0.5)
    for r in res.values():
        for f in r['facts']:
            if f[0] == 'Première apparition' and f[1][0] in firsts and firsts[f[1][0]] in years:
                f[1][0] = f'{f[1][0]} ({years[firsts[f[1][0]]]})'
    # le wiki Marvel a fusionné Parents, Fratrie et Descendance dans « Relatives » (sans rôle) : on garde les rôles du relevé précédent
    old_p = ROOT / ('content/wiki.json' if SITE == 'marvel' else 'content/dc_wiki.json')
    old = json.loads(old_p.read_text())['entries'] if old_p.exists() else {}
    for id_, r in res.items():
        have = {f[0] for f in r['facts']}
        for f in (old.get(id_) or {}).get('facts', []):
            if f[0] in ('Parents', 'Fratrie', 'Descendance') and f[0] not in have:
                r['facts'].insert(-1 if r['facts'] and r['facts'][-1][0] == 'Première apparition' else len(r['facts']), f)
    missing = sorted(set(titles) - set(res))
    if missing: print('introuvables ou ambiguës :', ' '.join(missing))
    out = {'fetched': datetime.date.today().isoformat(), 'license': f'Faits relevés sur {SITE}.fandom.com (CC BY-SA)', 'entries': res}
    (ROOT / ('content/wiki.json' if SITE == 'marvel' else 'content/dc_wiki.json')).write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print(len(res), 'fiches ·', sum(1 for r in res.values() if r['img']), 'images ·', sum(len(r['facts']) for r in res.values()), 'faits')


if __name__ == '__main__':
    main()

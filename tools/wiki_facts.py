#!/usr/bin/env python3
"""Relève, pour chaque fiche, l'image principale actuelle et une fiche d'identité FACTUELLE (champs courts de
l'infobox : nom actuel, alias, origine, réalité, affiliations, famille, créateurs, première apparition…) sur le
wiki communautaire marvel.fandom.com (contenu CC BY-SA, attribué sur chaque page).
Aucun texte rédigé (historique, présentation, citations) n'est repris : seulement des faits courts.
Sortie : content/wiki.json   ·   Lancer : python3 tools/wiki_facts.py   (en-tête User-Agent obligatoire, sinon 403)"""
import json, re, time, urllib.parse, urllib.request, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'CosmologieMarvelAtlas/1.0 (fan reference project)'}
A = json.loads((ROOT / 'content/atlas.json').read_text())

# champ de l'infobox -> libellé affiché, nombre maximal d'éléments gardés
FIELDS = [('CurrentAlias', 'Nom actuel', 1), ('RealName', 'Nom réel', 1), ('Aliases', 'Autres noms', 4), ('Origin', 'Nature', 1),
          ('Reality', 'Réalité', 2), ('Universe', 'Univers', 1), ('Occupation', 'Fonction', 2), ('Affiliation', 'Affiliations', 4),
          ('Parents', 'Parents', 3), ('Siblings', 'Fratrie', 3), ('Children', 'Descendance', 3), ('BaseOfOperations', 'Base', 2),
          ('Galaxy', 'Galaxie', 1), ('Locale', 'Lieu', 2), ('Type', 'Type', 1), ('Material', 'Matériau', 1), ('CurrentOwner', 'Détenteur', 1),
          ('Leaders', 'Dirigeants', 3), ('Creators', 'Créateurs', 4), ('First', 'Première apparition', 1)]
KEYS = {k for k, _, _ in FIELDS}


def api(params):
    url = 'https://marvel.fandom.com/api.php?' + urllib.parse.urlencode({'format': 'json', 'redirects': 1, **params})
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
    return (m.group(1) + ('' if m.group(2) == '1' else ' vol. ' + m.group(2)) + ' #' + m.group(3)) if m else v


def infobox(text):
    i = text.find('{{Marvel Database:')
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
    titles = {id_: t for id_, t in A['wiki'].items() if id_ in A['nodes'] and A['nodes'][id_]['map'] != 7}
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
                res[id_] = {'title': real, 'img': img, 'facts': facts}
        time.sleep(0.5)
    out = {'fetched': datetime.date.today().isoformat(), 'license': 'Faits relevés sur marvel.fandom.com (CC BY-SA)', 'entries': res}
    (ROOT / 'content/wiki.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print(len(res), 'fiches ·', sum(1 for r in res.values() if r['img']), 'images ·', sum(len(r['facts']) for r in res.values()), 'faits')


if __name__ == '__main__':
    main()

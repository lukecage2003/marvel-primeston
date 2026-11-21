#!/usr/bin/env python3
"""Liens de parenté Marvel (parents → enfants, fratries) déduits des fiches d'identité relevées sur marvel.fandom.com
(content/wiki.json : champs Parents, Fratrie, Descendance), plus quelques liens vérifiés à la main (FAM_MANUAL).
Sortie : content/family.json  ·  Lancer : python3 tools/family.py"""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
W = json.loads((ROOT / 'content/wiki.json').read_text())['entries']
src = (ROOT / 'data.js').read_text()
EN = {m.group(1): m.group(2) for m in re.finditer(r"^(\w+):\['(?:[^'\\]|\\.)*','((?:[^'\\]|\\.)*)'", src, re.M)}
# entités de la carte des familles qui doublonnent une fiche d'une autre carte
ALIAS = {'eternity': 'h_eter', 'infinity': 'h_inf', 'oblivion': 'h_obl', 'chaos': 'h_chaos', 'order': 'h_order', 'tribunal': 'h_trib', 'god': 'h_oaa'}
HIER_EN = {'h_oaa': 'One Above All', 'h_trib': 'Living Tribunal', 'h_bey': 'Beyonders', 'h_eter': 'Eternity', 'h_inf': 'Infinity', 'h_death': 'Death', 'h_obl': 'Oblivion',
           'h_chaos': 'Lord Chaos', 'h_order': 'Master Order', 'h_phx': 'Phoenix Force', 'h_omega': 'Omega Force', 'h_enigma': 'Enigma Force', 'h_uni': 'Uni-Power',
           'h_cel': 'Celestials', 'h_asp': 'Aspirants', 'h_gal': 'Galactus', 'h_watch': 'Watchers', 'h_anti': 'Anti-All', 'h_knull': 'Knull', 'h_oba': 'One Below All'}
names = {}
def key(s): return re.sub(r'[^a-z0-9]', '', s.lower())
SKIP = lambda i: i.startswith('e_') or re.fullmatch(r'c\d|bw', i)
for i, n in [*HIER_EN.items(), *((i, n) for i, n in EN.items() if not SKIP(i))]:
    for v in {n, re.sub(r'\s*\(.*?\)', '', n), n.split(' (')[0]}:
        names.setdefault(key(v), i)
for i, w in W.items():  # titre du wiki sans la réalité : « Odin Borson (Earth-616) » → Odin Borson
    if not SKIP(i): names.setdefault(key(re.sub(r'\s*\(.*?\)', '', w['title'])), ALIAS.get(i, i))
def find(item):
    base = re.sub(r'\s*\(.*?\)', '', item).strip()
    for cand in (base, base.split(',')[0], ' '.join(base.split()[:2]), base.split()[0] if base else ''):
        i = names.get(key(cand))
        if i and len(key(cand)) > 3: return i, item
    return None, item
FAM, SIB, seen = [], [], set()
# homonymes ou liens trop indirects écartés après vérification
BAD = {('x_kang', 'x_reed'), ('x_loki', 'x_america'), ('h_phx', 'h_thor')}
FR = [(r'\bfoster\b|\badopted\b|\badoptive\b', 'adoptif'), (r'\bfather\b', 'père'), (r'\bmother\b', 'mère'), (r'\b(oldest |youngest )?son\b', 'fils'), (r'\bdaughter\b', 'fille'),
      (r'\bcreators?\b', 'créateur'), (r'\bcreations?\b', 'création'), (r'\bbrother\b', 'frère'), (r'\bsister\b', 'sœur'), (r'\btwin\b', 'jumeau'), (r'\bdeceased\b', 'décédé'),
      (r'\boffspring\b', 'descendance'), (r'\bprogenitor\b', 'géniteur'), (r'\bcounterpart\b', 'contrepartie'), (r'\bsibling\b', ''), (r'\bwith\b', 'avec')]
def fr(n):
    n = re.sub(r'\b(paternal|maternal)\b', '', n)
    for a, b in FR: n = re.sub(a, b, n)
    for a, b in [('adoptif sœur', 'sœur adoptive'), ('adoptif frère', 'frère adoptif'), ('adoptif fille', 'fille adoptive'), ('adoptif père', 'père adoptif'), ('adoptif mère', 'mère adoptive'), ('jumeau sœur', 'sœur jumelle')]: n = n.replace(a, b)
    return re.sub(r'\s+', ' ', n.replace('"', '')).strip(' ,/')
def addp(p, c, how, side='p'):
    if p == c or (p, c) in seen or (p, c) in BAD or SKIP(p) or SKIP(c): return
    seen.add((p, c)); FAM.append([p, c, fr(how), side])
for i, w in W.items():
    me = ALIAS.get(i, i)
    for lab, vals in w['facts']:
        for v in vals:
            for part in re.split(r'[,/]\s*(?![^()]*\))', v):
                j, raw = find(part)
                if not j or j == me: continue
                note = (re.search(r'\((.*?)\)', raw) or [None, ''])[1]
                if lab == 'Parents': addp(j, me, note)
                elif lab == 'Descendance': addp(me, j, note, 'c')
                elif lab == 'Fratrie' and not SKIP(j) and not SKIP(me) and (j, me) not in {tuple(x[:2]) for x in SIB}: SIB.append([me, j, fr(note)])
# liens vérifiés à la main (citations dans data.js ou les fiches du wiki)
FAM_MANUAL = [['h_eter', 'manif', 'manifestation (lecture de fans)'], ['x_love', 'manif', 'manifestation (lecture de fans)'], ['x_hate', 'manif', 'manifestation (lecture de fans)'], ['h_chaos', 'x_inbetween', 'création commune avec Master Order'], ['h_order', 'x_inbetween', 'création commune avec Lord Chaos'],
              ['x_kronos', 'x_mentor', ''], ['x_mentor', 'x_thanos', ''], ['x_mentor', 'x_starfox', ''], ['h_eter', 'x_entropy', '']]
for p, c, n in FAM_MANUAL: addp(p, c, n)
SIB = [s for s in SIB if not any({s[0], s[1]} == {a, b} for a, b, *_ in FAM)]
out = {'source': 'Champs Parents, Fratrie et Descendance des fiches de marvel.fandom.com (content/wiki.json)', 'parents': FAM, 'siblings': SIB}
(ROOT / 'content/family.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print(len(FAM), 'liens parent → enfant ·', len(SIB), 'fratries')
# bloc généré à la fin de data.js (l'export autonome de l'explorateur embarque window.DB en entier)
dp = ROOT / 'data.js'; d = dp.read_text(); MARK = '\n/* FAMILLE et IMAGES DU WIKI : bloc généré par tools/family.py, ne pas modifier à la main */\n'
IMGW = {ALIAS.get(i, i): w['img'] for i, w in W.items() if w.get('img', '').startswith('https://static.wikia.nocookie.net/')}
IMGW.update({i: w['img'] for i, w in W.items() if w.get('img', '').startswith('https://static.wikia.nocookie.net/')})
d = d.split(MARK)[0].rstrip('\n') + MARK + 'window.DB.FAM=' + json.dumps({'p': FAM, 's': SIB}, ensure_ascii=False, separators=(',', ':')) + ';\nwindow.DB.IMGW=' + json.dumps(IMGW, separators=(',', ':')) + ';\n'
dp.write_text(d)

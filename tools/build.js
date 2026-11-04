/* Générateur de Marvel Primestone : produit les pages statiques à partir des données.
   Sources : content/atlas.json (fiches et cartes, via tools/snapshot.js), comics.json (tools/comics.js), content/dossiers/*.md
   Sortie  : index.html, encyclopedie.html, cosmos.html, structures.html, chronologie.html, archive.html,
             dossiers.html, dossier/*.html, recherche.html, fiche/*.html, search.json
   Lancer  : node tools/build.js          (--check : vérifie que les pages publiées sont à jour, sans écrire)
   La génération s'arrête si les données sont incohérentes (voir validate()). Aucune dépendance. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), CHECK = process.argv.includes('--check');
const A = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/atlas.json'), 'utf8'));
const COMICS = JSON.parse(fs.readFileSync(path.join(ROOT, 'comics.json'), 'utf8'));
const WK = fs.existsSync(path.join(ROOT, 'content/wiki.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'content/wiki.json'), 'utf8')).entries : {};   // tools/wiki_facts.py
const N = A.nodes, IDS = Object.keys(N);
const SITE = 'https://lukecage2003.github.io/marvel-primeston/';
const WKDATE = fs.existsSync(path.join(ROOT, 'content/wiki.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'content/wiki.json'), 'utf8')).fetched : '';

/* ---------- utilitaires ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const catName = c => (A.cats[c] || { name: c }).name, catColor = c => (A.cats[c] || {}).color || '#c9c3b3';
const relName = c => (A.cert[c] || A.cert.u).name, relDesc = c => (A.cert[c] || A.cert.u).desc;
const mapName = m => A.maps[m] ? A.maps[m].name : '';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const initials = s => esc(String(s).replace(/^(L’|L'|La |Le |Les )/, '').slice(0, 2).toUpperCase());

/* ---------- validation des données ---------- */
function validate() {
  const err = [];
  for (const id of IDS) {
    const n = N[id];
    if (!n.name) err.push(id + ' : nom manquant');
    if (!A.cats[n.cat]) err.push(id + ' : catégorie inconnue ' + n.cat);
    if (!A.cert[n.cert]) err.push(id + ' : niveau de fiabilité inconnu ' + n.cert);
    if (n.cert === 'c' && !/#\d/.test(n.src || '')) err.push(id + ' : « canon » sans numéro de comic');
    for (const r of n.rel) if (!N[r]) err.push(id + ' : relation vers une fiche inconnue ' + r);
  }
  for (const c of COMICS) for (const id of c.citedBy) if (!N[id] && !/^e\d+$/.test(id)) err.push('comics.json : ' + c.label + ' cité par une fiche inconnue ' + id);
  return err;
}

/* ---------- gabarit commun ---------- */
const NAV = [['index.html', 'Accueil'], ['explorer.html', 'Explorer'], ['encyclopedie.html', 'Encyclopédie'], ['cosmos.html', 'Cosmos'], ['structures.html', 'Structures'], ['chronologie.html', 'Chronologie'], ['archive.html', 'Archive'], ['dossiers.html', 'Dossiers']];
const TAB = [['explorer.html', 'Explorer'], ['encyclopedie.html', 'Encyclopédie'], ['recherche.html', 'Recherche'], ['dossiers.html', 'Dossiers']];
function page({ file, title, desc, body, active }) {
  const base = file.includes('/') ? '../' : '';
  const cur = h => h === active ? ' aria-current="page"' : '';
  return `<!doctype html>
<html lang="fr" data-base="${base}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)} · Marvel Primestone</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} · Marvel Primestone"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}og.png"><meta property="og:url" content="${SITE}${esc(file)}"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0b0b"><meta name="referrer" content="no-referrer">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Big+Shoulders+Display:wght@700;800;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}assets/site.css">
</head>
<body>
<a class="skip" href="#main">Aller au contenu</a>
<header class="top"><div class="wrap">
 <a class="brand" href="${base}index.html"><img src="${base}img/brand-p.png" alt="" width="24" height="30">Marvel Primestone</a>
 <nav class="nav" aria-label="Navigation principale">${NAV.map(([h, l]) => `<a href="${base}${h}"${cur(h)}>${l}</a>`).join('')}</nav>
 <form class="qbox" action="${base}recherche.html" role="search"><label class="skip" for="q">Rechercher</label><input id="q" name="q" type="search" list="qlist" placeholder="Rechercher…" autocomplete="off"><datalist id="qlist"></datalist></form>
</div></header>
<main id="main"><div class="wrap">
${body}
</div></main>
<footer class="foot"><div class="wrap">
 <p><b>Marvel Primestone</b> · Au-delà des héros. Projet indépendant de fans, non commercial, consacré à l’analyse des comics Marvel. Personnages, noms et images © Marvel ; images hébergées par le wiki communautaire marvel.fandom.com, créditées sur chaque fiche. Les niveaux de fiabilité sont expliqués dans le <a href="${base}dossier/methode.html">dossier Méthode</a>.</p>
</div></footer>
<nav class="tabbar" aria-label="Navigation rapide">${TAB.map(([h, l]) => `<a href="${base}${h}"${cur(h)}>${l}</a>`).join('')}</nav>
<script src="${base}assets/site.js" defer></script>
</body>
</html>
`;
}

/* ---------- composants : cartes (DESIGN_SYSTEM.md) ---------- */
const wikiImg = id => (WK[id] && WK[id].img) || null;
const imgURL = id => wikiImg(id) || (A.img[id] ? '../' + A.img[id] : null);    // url() d'une variable CSS : relative à assets/site.css
const imgOf = id => A.img[id] || null;
/* image dans une vraie balise <img> : chargement différé et sans en-tête Referer (le wiki bloque l'affichage sur d'autres sites sinon) */
const srcFor = (id, base) => wikiImg(id) || (A.img[id] ? base + A.img[id] : null);
const IMGATTR = 'loading="lazy" decoding="async" referrerpolicy="no-referrer"';
const visual = (id, base, cls) => {
  const u = srcFor(id, base);
  if (u) return `<span class="${cls}"><img src="${esc(u)}" alt="" ${IMGATTR}></span>`;
  return `<span class="${cls} none" aria-hidden="true">${initials(N[id].name)}</span>`;
};
const relBadge = c => `<span class="rel ${esc(c)}" title="${esc(relDesc(c))}">${esc(relName(c))}</span>`;
const fiche = id => 'fiche/' + id + '.html';
function cardB(id, base) {   // B : entité
  const n = N[id];
  return `<a class="card cB" href="${base}${fiche(id)}" data-cat="${esc(n.cat)}" data-rel="${esc(n.cert)}" data-text="${esc(norm([n.name, n.en, n.sub].join(' ')))}">
 ${visual(id, base, 'pic')}
 <span class="body"><span class="cat" style="--c:${catColor(n.cat)}">${esc(catName(n.cat))}</span><h3>${esc(n.name)}</h3>${n.sub ? `<p>${esc(n.sub)}</p>` : ''}
 <span class="meta">${relBadge(n.cert)}${n.rel.length ? `<span class="muted">${n.rel.length} lien${n.rel.length > 1 ? 's' : ''}</span>` : ''}</span></span></a>`;
}
function cardBs(id, base) {  // B compacte
  const n = N[id];
  return `<a class="card cBs" href="${base}${fiche(id)}">${visual(id, base, 'av')}<span><h3>${esc(n.name)}</h3><p>${esc(catName(n.cat))}${n.sub ? ' · ' + esc(n.sub) : ''}</p></span></a>`;
}
function cardA(id, i, base) { // A : Cosmos
  const n = N[id], u = srcFor(id, base);
  return `<a class="card cA" href="${base}${fiche(id)}">${u ? `<img class="bg" src="${esc(u)}" alt="" ${IMGATTR}>` : ''}
 <span class="num" aria-hidden="true">${id === 'bw' ? '◆' : ROMAN[i] || ''}</span>
 <span class="kicker">${id === 'bw' ? 'Entre deux cosmos' : 'Cosmos ' + (ROMAN[i] || '')}</span><h3>${esc(n.name)}</h3>${n.sub ? `<p>${esc(n.sub)}</p>` : ''}
 <span class="life" aria-hidden="true"></span></a>`;
}
function cardE(c, base) {   // E : comic (cartel)
  const ref = c.type === 'issue' ? `${esc(c.series)}${c.volume > 1 ? ' vol. ' + c.volume : ''} #${esc(c.issue)}` : esc(c.label);
  const q = encodeURIComponent(c.type === 'issue' ? `${c.series}${c.volume > 1 ? ' Vol ' + c.volume : ' Vol 1'} ${c.issue}` : c.label.replace(/\s*\([^)]*\)/g, ''));
  const by = c.citedBy.filter(id => N[id]);
  return `<article class="card cE" id="${esc(cid(c))}" data-cat=""${c.year ? c.year.slice(0, 3) + '0' : 'nd'}" data-rel="${c.type}" data-text="${esc(norm(c.label + ' ' + by.map(id => N[id].name).join(' ')))}">
 <span class="ser">${ref}</span><span class="muted">${c.year || 'année non renseignée'} · ${c.type === 'issue' ? 'numéro' : 'arc ou série'}</span>
 <span class="cite">Cité par : ${by.map(id => `<a href="${base}${fiche(id)}">${esc(N[id].name)}</a>`).join(', ') || '—'}</span>
 </article>`;
}
/* identifiant stable d'une référence de comics (ancre dans archive.html) */
const cid = c => 'c-' + slug(c.type === 'issue' ? `${c.series} v${c.volume} ${c.issue}` : c.label);
const COMIC_BY_LABEL = {};
for (const c of COMICS) COMIC_BY_LABEL[c.type === 'issue' ? `${c.series}|${c.volume}|${c.issue}` : c.label] = c;
const comicOf = part => { const m = part.match(/^(.*?)(?: vol\. (\d+))? #([\w.-]+(?:-\d+)?)(?: \(([^)]*)\))?$/); return COMIC_BY_LABEL[m ? `${m[1].trim()}|${m[2] || 1}|${m[3]}` : part] || null; };
const srcList = (src, base) => String(src || '').split(' · ').filter(Boolean).map(x => {
  const part = x.replace(/\s*—.*$/, '').replace(/^1ʳᵉ apparition selon marvel\.fandom\.com :\s*/, '').trim(), c = comicOf(part);
  return `<li>${c ? `<a href="${base}archive.html#${esc(cid(c))}">${esc(x)}</a>` : esc(x)}</li>`;
}).join('');

/* ---------- pages ---------- */
const out = {};
const emit = (file, html) => { out[file] = html; };
const ENTRIES = IDS.filter(id => N[id].map !== 7);           // la carte 7 est la chronologie éditoriale (événements de publication)
const byName = (a, b) => N[a].name.localeCompare(N[b].name, 'fr');

function buildFiche(id) {
  const n = N[id], base = '../', w = WK[id], u = srcFor(id, base);
  const cited = COMICS.filter(c => c.citedBy.includes(id));
  const sameCat = ENTRIES.filter(x => N[x].cat === n.cat).sort(byName), k = sameCat.indexOf(id);
  const prev = k > 0 ? sameCat[k - 1] : null, next = k >= 0 && k < sameCat.length - 1 ? sameCat[k + 1] : null;
  const rels = n.rel.filter(r => N[r].map !== 7).sort(byName), evts = n.rel.filter(r => N[r].map === 7);
  const facts = (w && w.facts || []).filter(([l]) => l !== 'Première apparition');
  const first = w && (w.facts || []).find(([l]) => l === 'Première apparition');
  const body = `
<div class="fhero">${u ? `<img class="fbg" src="${esc(u)}" alt="" aria-hidden="true" ${IMGATTR}>` : ''}
 <p class="crumb"><a href="../encyclopedie.html">Encyclopédie</a> › ${esc(catName(n.cat))}</p>
 <div class="fhead">
  ${u ? `<img class="fport" src="${esc(u)}" alt="${esc(n.name)}" width="360" height="480" decoding="async" referrerpolicy="no-referrer">` : `<span class="fport none" aria-hidden="true">${initials(n.name)}</span>`}
  <div class="fid">
   <span class="cat" style="--c:${catColor(n.cat)}">${esc(catName(n.cat))}</span>
   <h1>${esc(n.name)}</h1>
   ${n.en ? `<p class="muted">${esc(n.en)}</p>` : ''}
   ${n.sub ? `<p class="lead">${esc(n.sub)}</p>` : ''}
   <p class="chipsline">${relBadge(n.cert)}${first ? `<span class="pill">1ʳᵉ apparition · ${esc(first[1][0])}</span>` : ''}${rels.length ? `<span class="pill">${rels.length} relation${rels.length > 1 ? 's' : ''}</span>` : ''}</p>
   <p><a class="btn ghost" href="../explorer.html#${esc(id)}">Voir sur la carte · ${esc(mapName(n.map))}</a></p>
  </div>
 </div>
</div>
<div class="fbody">
 <div class="prose">
  ${n.desc ? `<h2>Présentation</h2><p class="big">${esc(n.desc)}</p>` : ''}
  ${n.fact ? `<p class="fact">${esc(n.fact)}</p>` : ''}
  <h2>Où le lire</h2>
  ${n.src ? `<ul class="srcs">${srcList(n.src, base)}</ul>` : '<p class="note">Aucune source enregistrée pour cette fiche.</p>'}
  ${n.cert === 'u' ? '<p class="note">Fiche <b>à vérifier</b> : les comics de référence et la première apparition sont indiqués, mais la présentation n’a pas encore été confrontée aux comics eux-mêmes.</p>' : ''}
  ${n.cert === 't' ? '<p class="note">Cette fiche relève de la <b>théorie</b> : une construction de fans, cohérente mais non officielle.</p>' : ''}
 </div>
 <aside class="idcard" aria-label="Fiche d’identité">
  <h2>Fiche d’identité</h2>
  ${facts.length || first ? `<dl>${facts.concat(first ? [first] : []).map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${v.map(esc).join('<br>')}</dd></div>`).join('')}</dl>` : '<p class="muted">Pas de fiche d’identité disponible.</p>'}
  <p class="credit">${w ? `Fiche d’identité et image : page « ${esc(w.title)} » du wiki communautaire marvel.fandom.com (CC BY-SA), relevées le ${esc(WKDATE)}. Valeurs en anglais, telles que publiées.` : 'Image : collection Primestone.'} Personnages et illustrations © Marvel.</p>
 </aside>
</div>
${rels.length ? `<section><h2>Relations</h2><div class="grid three">${rels.map(r => cardBs(r, base)).join('')}</div></section>` : ''}
${evts.length ? `<section><h2>Dans la chronologie éditoriale</h2><ul>${evts.map(r => `<li><a href="../chronologie.html#${esc(r)}">${N[r].year ? N[r].year + ' · ' : ''}${esc(N[r].name)}</a></li>`).join('')}</ul></section>` : ''}
${cited.length ? `<section><h2>Comics qui la documentent</h2><div class="grid two">${cited.map(c => cardE(c, base)).join('')}</div></section>` : ''}
<nav class="pager" aria-label="Fiches voisines">${prev ? `<a href="${esc(prev)}.html">← ${esc(N[prev].name)}</a>` : '<span></span>'}${next ? `<a href="${esc(next)}.html">${esc(N[next].name)} →</a>` : ''}</nav>`;
  emit(fiche(id), page({ file: fiche(id), title: n.name, desc: (n.sub ? n.sub + '. ' : '') + (n.desc || '').slice(0, 150), body, active: 'encyclopedie.html' }));
}

function buildEncyclo() {
  const cats = Object.keys(A.cats).filter(c => ENTRIES.some(id => N[id].cat === c));
  const rels = Object.keys(A.cert).filter(c => ENTRIES.some(id => N[id].cert === c));
  const body = `<h1>Encyclopédie</h1>
<p class="lead">${ENTRIES.length} fiches : entités, cosmos, structures, objets, groupes et événements. Chaque fiche indique ses sources et son niveau de fiabilité.</p>
<label class="skip" for="fq">Filtrer</label><p><input id="fq" class="qbox-in" data-filter-q type="search" placeholder="Filtrer par nom…" style="width:100%;max-width:420px;background:var(--surface);border:1px solid var(--line);color:var(--text);font:17px var(--font-text);padding:10px 14px;border-radius:4px"></p>
<div class="chips" role="group" aria-label="Catégories">${cats.map(c => `<button class="chip" data-filter="cat" data-value="${c}" aria-pressed="false">${esc(catName(c))}</button>`).join('')}</div>
<div class="chips" role="group" aria-label="Fiabilité">${rels.map(c => `<button class="chip" data-filter="rel" data-value="${c}" aria-pressed="false">${esc(relName(c))}</button>`).join('')}</div>
<p class="muted" data-filter-count aria-live="polite"></p>
<div class="grid four" data-filter-list>${ENTRIES.slice().sort(byName).map(id => cardB(id, '')).join('')}</div>`;
  emit('encyclopedie.html', page({ file: 'encyclopedie.html', title: 'Encyclopédie', desc: 'Toutes les fiches de la cosmologie Marvel, sourcées et classées par niveau de fiabilité.', body, active: 'encyclopedie.html' }));
}

function buildCosmos() {
  const body = `<h1>Les Cosmos</h1>
<p class="lead">L’univers Marvel actuel est présenté dans les comics récents comme le dernier d’une succession de Cosmos, chacun né de la mort du précédent. Voici l’ordre tel que l’atlas le documente.</p>
<div class="grid four">${A.cosmos.map((id, i) => cardA(id, id === 'bw' ? 0 : A.cosmos.filter(x => x !== 'bw').indexOf(id), '')).join('')}</div>
<p class="note">Les sources de chaque Cosmos sont sur sa fiche. La succession des Cosmos vient surtout des séries <i>Ultimates²</i> (2016-2017) et <i>Defenders</i> (2021) ; elle reste « à vérifier » tant que les descriptions n’ont pas été confrontées aux comics.</p>`;
  emit('cosmos.html', page({ file: 'cosmos.html', title: 'Les Cosmos', desc: 'Du Premier au Huitième Cosmos : la succession des univers dans les comics Marvel.', body, active: 'cosmos.html' }));
}

function buildStructures() {
  const sys = [[4, 'Organisation de la réalité, de l’Omnivers aux univers.'], [1, 'Lecture de la réalité Marvel sur le modèle de l’Arbre de vie (Defenders: Beyond) et de son reflet, la Qlippoth (construction de fans).'], [3, 'Les neuf firmaments : une lecture des couches successives de la création.'], [2, 'Les axes qui structurent les entités abstraites (Ur-Diviseurs : construction de fans).']];
  const body = `<h1>Structures du multivers</h1>
<p class="lead">Il n’existe pas une hiérarchie unique et définitive de la réalité Marvel : selon les périodes et les auteurs, les comics en proposent plusieurs. Chaque système ci-dessous est présenté séparément, avec son niveau de fiabilité.</p>
${sys.map(([m, d]) => {
    const ids = IDS.filter(id => N[id].map === m);
    return `<section><h2>${esc(mapName(m))}</h2><p class="muted">${esc(d)} <a href="explorer.html">Voir la carte dans l’explorateur →</a></p>
<div class="grid three">${ids.map(id => `<a class="card cC" style="--c:${catColor(N[id].cat)}" href="${fiche(id)}"><span class="cat">${esc(catName(N[id].cat))}</span><h3>${esc(N[id].name)}</h3>${N[id].sub ? `<p>${esc(N[id].sub)}</p>` : ''}<span>${relBadge(N[id].cert)}</span></a>`).join('')}</div></section>`;
  }).join('')}`;
  emit('structures.html', page({ file: 'structures.html', title: 'Structures', desc: 'Multivers, univers, dimensions et plans d’existence : les systèmes qui organisent la réalité Marvel.', body, active: 'structures.html' }));
}

function buildChrono() {
  const yr = n => n.year || +((String(n.src || '').match(/\b(19|20)\d\d\b/) || [])[0] || 0);
  const edito = IDS.filter(id => N[id].map === 7 || N[id].cat === 'evt').map(id => [yr(N[id]), id]).filter(x => x[0]).sort((a, b) => a[0] - b[0]);
  const body = `<h1>Chronologies</h1>
<p class="lead">Trois temporalités distinctes, qu’il ne faut pas confondre : l’ordre des Cosmos dans l’histoire de la création, l’ordre de publication des comics, et l’ordre interne des événements dans le récit.</p>
<section><h2>1. Chronologie cosmologique</h2><p class="muted">L’ordre des Cosmos, du premier au huitième.</p>
<ol class="timeline">${A.cosmos.map(id => `<li><a href="${fiche(id)}"><b>${esc(N[id].name)}</b></a>${N[id].sub ? ' : ' + esc(N[id].sub) : ''}</li>`).join('')}</ol></section>
<section><h2>2. Chronologie éditoriale</h2><p class="muted">Les publications et événements éditoriaux, par année de parution.</p>
<ol class="timeline">${edito.map(([y, id]) => `<li id="${esc(id)}"><span class="kicker" style="color:var(--gold)">${y}</span>${N[id].map === 7 ? `<b>${esc(N[id].name)}</b>` : `<a href="${fiche(id)}"><b>${esc(N[id].name)}</b></a>`}${N[id].desc ? ' : ' + esc(N[id].desc) : ''}${N[id].src ? ` <span class="muted">(${esc(N[id].src)})</span>` : ''}</li>`).join('')}</ol></section>
<section><h2>3. Chronologie interne</h2><p class="note">Pas encore documentée. L’ordre des événements à l’intérieur du récit demande de croiser plusieurs séries numéro par numéro ; il sera ajouté seulement quand chaque position pourra être sourcée.</p></section>`;
  emit('chronologie.html', page({ file: 'chronologie.html', title: 'Chronologies', desc: 'Chronologie cosmologique, éditoriale et interne du cosmos Marvel.', body, active: 'chronologie.html' }));
}

function buildArchive() {
  const decs = [...new Set(COMICS.map(c => c.year ? c.year.slice(0, 3) + '0' : 'nd'))].sort();
  const body = `<h1>Archive des comics</h1>
<p class="lead">${COMICS.length} références citées par les fiches (${COMICS.filter(c => c.type === 'issue').length} numéros, ${COMICS.filter(c => c.type === 'arc').length} arcs ou séries). Chacune renvoie vers les fiches qui la citent.</p>
<p class="note">Les auteurs, les pages et le détail de ce que chaque numéro établit ne sont pas encore renseignés : ils seront ajoutés au fil de la vérification des fiches, sans rien inventer.</p>
<label class="skip" for="aq">Filtrer</label><p><input id="aq" data-filter-q type="search" placeholder="Filtrer par série ou fiche…" style="width:100%;max-width:420px;background:var(--surface);border:1px solid var(--line);color:var(--text);font:17px var(--font-text);padding:10px 14px;border-radius:4px"></p>
<div class="chips" role="group" aria-label="Décennies">${decs.map(d => `<button class="chip" data-filter="cat" data-value="${d}" aria-pressed="false">${d === 'nd' ? 'Sans année' : 'Années ' + d}</button>`).join('')}</div>
<p class="muted" data-filter-count aria-live="polite"></p>
<div class="grid three" data-filter-list>${COMICS.map(c => cardE(c, '')).join('')}</div>`;
  emit('archive.html', page({ file: 'archive.html', title: 'Archive des comics', desc: 'Les comics Marvel qui documentent chaque fiche de l’encyclopédie.', body, active: 'archive.html' }));
}

/* dossiers : markdown simple (# titre, ## intertitre, - liste, **gras**, [[id]] ou [[id|texte]] vers une fiche, {{cosmos}} insère la liste des Cosmos) */
function md(src, base, errs, name) {
  const link = s => s.replace(/\[\[([a-z0-9_]+)(?:\|([^\]]+))?\]\]/g, (m, id, t) => { if (!N[id]) { errs.push(name + ' : lien vers une fiche inconnue ' + id); return esc(t || id); } return `<a href="${base}${fiche(id)}">${esc(t || N[id].name)}</a>`; });
  const inline = s => link(esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/\[\[([^\]]+)\]\]/g, (m, x) => '[[' + x.replace(/&#39;/g, "'") + ']]'));
  const html = [];
  let list = false;
  for (const line of src.split('\n')) {
    if (/^- /.test(line)) { if (!list) { html.push('<ul>'); list = true; } html.push('<li>' + inline(line.slice(2)) + '</li>'); continue; }
    if (list) { html.push('</ul>'); list = false; }
    if (!line.trim()) continue;
    if (line.trim() === '{{cosmos}}') { html.push('<ol class="timeline">' + A.cosmos.map(id => `<li><a href="${base}${fiche(id)}"><b>${esc(N[id].name)}</b></a>${N[id].desc ? ' : ' + esc(N[id].desc) : ''} <span class="muted">(${esc(N[id].src || 'source non renseignée')})</span></li>`).join('') + '</ol>'); continue; }
    if (/^## /.test(line)) html.push('<h2>' + inline(line.slice(3)) + '</h2>');
    else html.push('<p>' + inline(line) + '</p>');
  }
  if (list) html.push('</ul>');
  return html.join('\n');
}
function buildDossiers(errs) {
  const dir = path.join(ROOT, 'content/dossiers'), D = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8'), [head, ...rest] = raw.split('\n---\n'), meta = {};
    head.split('\n').forEach(l => { const m = l.match(/^(\w+):\s*(.*)$/); if (m) meta[m[1]] = m[2]; });
    const body = rest.join('\n---\n'), words = body.split(/\s+/).length, s = f.replace(/\.md$/, '');
    if (!meta.title || !meta.category || !meta.summary || !meta.status) errs.push('dossier ' + f + ' : en-tête incomplet (title, category, summary, status)');
    const d = { slug: s, ...meta, minutes: Math.max(1, Math.round(words / 220)) };
    D.push(d);
    emit('dossier/' + s + '.html', page({ file: 'dossier/' + s + '.html', title: meta.title, desc: meta.summary, active: 'dossiers.html', body: `
<p class="crumb"><a href="../dossiers.html">Dossiers</a> › ${esc(meta.title)}</p>
<span class="kicker">${esc(meta.category)} · ${d.minutes} min de lecture</span><h1>${esc(meta.title)}</h1>
<p class="lead">${esc(meta.summary)}</p><p>${relBadge(meta.status)} <span class="muted">${esc(relDesc(meta.status))}</span></p>
<article class="prose">${md(body, '../', errs, f)}</article>` }));
  }
  const card = (d, base) => `<a class="card cF" href="${base}dossier/${d.slug}.html"><span class="kicker">${esc(d.category)} · ${d.minutes} min</span><h3>${esc(d.title)}</h3><p>${esc(d.summary)}</p></a>`;
  emit('dossiers.html', page({ file: 'dossiers.html', title: 'Dossiers', desc: 'Analyses et dossiers sur la cosmologie Marvel, reliés aux fiches et aux sources.', active: 'dossiers.html', body: `<h1>Dossiers</h1><p class="lead">Des analyses qui relient les fiches entre elles. Chaque dossier indique son niveau de fiabilité.</p><div class="grid two">${D.map(d => card(d, '')).join('')}</div>` }));
  return { D, card };
}

function buildSearch() {
  const idx = IDS.filter(id => N[id].map !== 7).map(id => ({ n: N[id].name, a: N[id].en || undefined, s: N[id].sub || undefined, k: catName(N[id].cat), t: N[id].cat, u: fiche(id) }));
  emit('search.json', JSON.stringify(idx));
  const types = Object.keys(A.cats).filter(c => idx.some(e => e.t === c));
  emit('recherche.html', page({ file: 'recherche.html', title: 'Recherche', desc: 'Rechercher une entité, un cosmos, une structure ou un événement.', active: 'recherche.html', body: `<h1>Recherche</h1>
<p><label class="skip" for="q2">Recherche</label><input id="q2" type="search" placeholder="Nom en français ou en anglais…" autocomplete="off" style="width:100%;max-width:560px;background:var(--surface);border:1px solid var(--line);color:var(--text);font:19px var(--font-text);padding:12px 16px;border-radius:4px"></p>
<div class="chips" role="group" aria-label="Type">${types.map(c => `<button class="chip" data-type="${c}" aria-pressed="false">${esc(catName(c))}</button>`).join('')}</div>
<p class="muted" id="rcount" aria-live="polite"></p><div class="grid two results" id="results"></div>` }));
}

function buildHome(dos) {
  const counts = Object.keys(A.cert).map(c => [c, ENTRIES.filter(id => N[id].cert === c).length]).filter(x => x[1]);
  const featured = ['eternity', 'infinity', 'tribunal', 'h_death', 'x_galan', 'h_phx', 'h_knull', 'x_arishem'].filter(id => N[id]);
  const body = `
<script>/* anciens liens partagés (…/marvel-primeston/#id) : ils ouvrent la fiche du site */if(/^#[a-z0-9_]+$/.test(location.hash))location.replace('fiche/'+location.hash.slice(1)+'.html')</script>
<section style="padding:24px 0 8px">
 <span class="kicker">Au-delà des héros</span>
 <h1>La cosmologie Marvel, cartographiée et sourcée</h1>
 <p class="lead">Marvel Primestone est un atlas et une encyclopédie consacrés au cosmos des comics Marvel : les huit Cosmos successifs, les entités abstraites, les structures du multivers, les événements cosmiques et les comics qui documentent chaque affirmation.</p>
 <p style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn primary" href="explorer.html">Explorer les cartes</a><a class="btn ghost" href="encyclopedie.html">Ouvrir l’encyclopédie</a></p>
</section>
<section><h2>Les huit Cosmos</h2><p class="muted">Chaque univers naît de la mort du précédent. <a href="cosmos.html">Tous les Cosmos →</a></p>
<div class="grid four">${A.cosmos.filter(id => id !== 'bw').slice(0, 8).map((id, i) => cardA(id, i, '')).join('')}</div></section>
<section><h2>Entités fondamentales</h2><div class="grid four">${featured.map(id => cardB(id, '')).join('')}</div></section>
<section><h2>Trois façons d’explorer</h2><div class="grid three">
 <a class="card cF" href="explorer.html"><span class="kicker">Explorer</span><h3>8 cartes interactives</h3><p>Les Cosmos, l’Arbre, les Axes, les Firmaments, l’Omnivers, la Hiérarchie, le Réseau et la Chronologie, avec visite guidée et export vidéo.</p></a>
 <a class="card cF" href="encyclopedie.html"><span class="kicker">Encyclopédie</span><h3>${ENTRIES.length} fiches</h3><p>Une page par entité, avec ses sources, ses relations et son niveau de fiabilité.</p></a>
 <a class="card cF" href="archive.html"><span class="kicker">Archive</span><h3>${COMICS.length} comics cités</h3><p>Les numéros et les arcs qui documentent l’encyclopédie, reliés aux fiches.</p></a>
</div></section>
<section><h2>Dossiers</h2><div class="grid two">${dos.D.map(d => dos.card(d, '')).join('')}</div></section>
<section><h2>Fiabilité, en toute transparence</h2>
<p class="prose">Chaque fiche porte un niveau de fiabilité : ${counts.map(([c, n]) => `${relBadge(c)} ${n}`).join(' · ')}. Aucune fiche n’est encore classée <b>Canon</b> : ce niveau sera attribué seulement après vérification dans les comics eux-mêmes. <a href="dossier/methode.html">Lire la méthode →</a></p></section>`;
  emit('index.html', page({ file: 'index.html', title: 'La cosmologie Marvel, cartographiée et sourcée', desc: 'Atlas et encyclopédie de la cosmologie Marvel : Cosmos, entités, structures, événements et sources.', body, active: 'index.html' }));
}

/* ---------- exécution ---------- */
const errs = validate();
ENTRIES.concat(IDS.filter(id => N[id].map === 7 && false)).forEach(buildFiche);
buildEncyclo(); buildCosmos(); buildStructures(); buildChrono(); buildArchive(); buildSearch();
const dos = buildDossiers(errs); buildHome(dos);
if (errs.length) { console.error('Données incohérentes :\n- ' + errs.join('\n- ')); process.exit(1); }
let stale = 0;
for (const [f, html] of Object.entries(out)) {
  const p = path.join(ROOT, f);
  if (CHECK) { if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== html) { stale++; if (stale < 4) console.error('périmé : ' + f); } continue; }
  fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, html);
}
if (!CHECK) for (const dir of ['fiche', 'dossier']) for (const f of fs.readdirSync(path.join(ROOT, dir))) if (!out[dir + '/' + f]) fs.unlinkSync(path.join(ROOT, dir, f));   // fiches supprimées
console.log(CHECK ? (stale ? stale + ' page(s) périmée(s) : node tools/build.js' : 'pages à jour (' + Object.keys(out).length + ')') : Object.keys(out).length + ' fichiers générés');
process.exit(CHECK && stale ? 1 : 0);

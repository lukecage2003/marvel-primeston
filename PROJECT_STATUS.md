# PROJECT_STATUS — dépôt `lukecage2003/marvel-primeston`

Dernière mise à jour : 2026-11-04 · Dépôt : `lukecage2003/marvel-primeston` · Branche de travail : `claude/marvel-cards-interactive-site-gkl3zb`

> Site : https://lukecage2003.github.io/marvel-primeston/ (racine du dépôt). Les modifications sont développées sur la branche de travail ; seule la branche publiée par Pages met le site en ligne.

## 0. Session du 2026-11-04 (audit « plateforme encyclopédique »)
- Audit complet dans `AUDIT.md`. Documents de référence : `ARCHITECTURE.md`, `DATA_MODEL.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`.
- Constat principal : sur 225 fiches, 224 portent l'étiquette « canon », alors que pour 137 d'entre elles seule la première apparition a été vérifiée, sur un wiki communautaire. **Fiabilité documentaire = priorité n° 1.**
- Mises à jour « pas reçues » : `data.js` et `images.js` ne sont pas versionnés (cache Pages de 10 min). Correctif prévu à l'étape 0 de la feuille de route.
- Aucun code modifié pendant cette session d'audit. Branche poussée, `main` inchangée (pas de mise en ligne).
- Étape 0 faite (sur la branche) : versions `?v=` (`tools/stamp.js`) et 137 fiches passées à « À vérifier » (niveau `u`). Fiabilité : 87 canon, 1 déduit, 137 à vérifier. Tests : 26 réussis, 0 échoué.
- Étape 1 faite et publiée (accord du propriétaire) : 5 niveaux et « À vérifier » ; plus aucune fiche « canon » sans vérification dans les comics (224 à vérifier, 1 interprétation, plus les théories des cartes). Sources cliquables, `comics.json` (211 références), portraits en fichiers séparés. Tests : 28 réussis, 0 échoué (29 avec --video).
- **Prochaine étape précise :** étape 2 (socle Astro et accueil), à commencer par le script de migration des données vers des fichiers de contenu validés.

## 1. Ce que contient le dépôt
`marvel-primeston` est une **copie propre, sans historique**, de l'atlas. L'ancien dépôt `matthias` n'existe plus sous ce nom. Il contenait aussi Tech Shield, avec des secrets et des CV de tiers, `site v3/` et un PDF de 56 Mo ; rien de tout cela n'est repris ici.
- Le site est à la racine : `index.html`, `data.js`, `images.js`, `og.png`.
- `tests/atlas/` contient la suite de tests ; `package.json` sert uniquement à l'outillage de test.
- `README.md`, `PROJECT_STATUS.md`.

## 2. Architecture actuelle de l'atlas
- `index.html` (environ 145 Ko) contient tout le site : CSS et un seul script (`const SRC…`) qui gère les 8 cartes SVG, le Codex, le panneau, la recherche, les exports PNG/SVG/HTML, la vidéo sur canvas, les miniatures, le quiz et l'i18n.
- `data.js` : `window.DB.E` (336 fiches indexées avec les cartes) et `DB.T` (chronologie).
- `images.js` (74 Ko) : chemins des portraits `img/*.webp` (chargés à la demande) et logo Primestone intégré. `img/credits.json` : crédits.
- `comics.json` : références citées, générées par `tools/comics.js`. `tools/stamp.js` : versions `?v=` (cache).
- Pas de build, pas de dépendance. Le site marche hors ligne et peut exporter un HTML autonome (inline `data.js` et `images.js`).
- Services externes : l'API `marvel.fandom.com` (images, CORS `origin=*`) et Google Fonts. Il n'y a ni backend, ni compte, ni donnée personnelle.
- Stockage local : `cm_img` (images importées par l'utilisateur), `cm_wiki2` (cache du wiki), `cm_won`, `cm_lang`.

## 3. Audit : problèmes classés par gravité

### Critiques
Aucun dans ce dépôt. Les problèmes de Tech Shield (secrets publics, CV de tiers, sécurité uniquement côté navigateur) appartenaient à l'ancien dépôt `matthias` et ne sont pas repris ici.

### Élevés (atlas) : corrigés cette session
4. Le Réseau tournait à **2,7 images/s** (23 700 éléments SVG, dont 70 par nœud pour un anneau invisible). L'anneau est maintenant créé à la demande : **18,7 images/s** sous rendu logiciel, et la Chronologie passe de 15 à 60.
5. 15 captures de test (environ 10 Mo) avaient été publiées par erreur avec le site. Elles sont supprimées, et `.gitignore` empêche que ça se reproduise.
6. Le titre renvoyé par l'API du wiki était inséré en HTML brut (risque XSS). Il est maintenant échappé (`escH`), et les adresses d'images sont limitées à `static.wikia.nocookie.net`, y compris dans le cache local.
7. Plantage latent de la carte des Axes après la régression n° 4. Il a été détecté par les tests et corrigé.
8. Les liens `#id` ne marchaient qu'au chargement. Un écouteur `hashchange` est ajouté.

### Moyens (atlas) : à faire
9. Un seul fichier de 145 Ko avec du JS très compact : difficile à maintenir et à relire.
10. `images.js` (611 Ko en base64) bloque le premier affichage : DOMContentLoaded à 1,06 s en local, plus sur mobile en 4G.
11. Accessibilité : les cartes SVG ne sont pas utilisables au clavier ni avec un lecteur d'écran (le Codex sert d'alternative). Le focus clavier n'est pas visible partout, et le contraste est à vérifier sur les sous-titres.
12. i18n partielle : interface en anglais, mais contenu des fiches et libellés SVG en français.
13. Le classement du quiz (`POW`) est une échelle éditoriale. Il est présenté comme « indicatif », mais rien ne le documente.

### Faibles
14. ~~`site v3/`, `package.json` de Tech Shield, `rapport-audit-securite.md`~~ : retirés.

## 4. Architecture proposée (atlas)
On garde **zéro build et zéro framework** : c'est une force pour GitHub Pages, le mode hors ligne et l'export HTML autonome. On découpe par responsabilité :
```
(racine)
  index.html            structure + <link>/<script type="module">
  css/atlas.css
  js/core.js            état, caméra, utilitaires (E, T, escH, rng)
  js/maps/*.js          une carte par fichier (cosmos, arbre, axes…)
  js/codex.js  js/panel.js  js/search.js
  js/export.js          PNG/SVG/HTML : inline des modules pour l'export autonome
  js/video.js  js/quiz.js  js/thumb.js  js/i18n.js
  data/entries.js  data/timeline.js  data/i18n-en.js
  img/*.webp            portraits chargés à la demande (fin du base64 de 611 Ko)
tests/atlas/run.js      suite de tests (hors du dossier publié)
```
Pourquoi : chaque fonctionnalité devient lisible et testable seule, le premier chargement passe sous les 200 Ko, et les données restent séparées du code. Ce découpage demande d'adapter l'export « HTML autonome », qui devra inliner les modules.

## 5. Direction UX/UI
- **Direction artistique Primestone** : fond noir #0b0b0b, jaune #FFE500 (titres, actions), #FFF503 (accents d'interface), rouge Kirby #e2493f en second. Polices : Anton (accroches), Big Shoulders Display (titres et interface), Newsreader (texte). Comics Kirby avec trame, krackle et encadrés, utilisés avec mesure.
- Règles : un seul accent fort par écran, halos discrets, contour noir sur le texte posé sur une image, cibles tactiles d'au moins 44 px, focus visible.
- À faire : navigation clavier dans les cartes (flèches et Entrée), `prefers-reduced-motion`, états de chargement des images du wiki, message d'erreur si le wiki ne répond pas (le toast existe déjà), contraste AA sur les sous-titres.

## 6. Feuille de route
| # | Tâche | Priorité | Effort | Accord requis |
|---|---|---|---|---|
| A | ~~Retirer Tech Shield et repartir sur un dépôt propre~~ : fait (`marvel-primeston`) | — | — | Fait |
| D | Images : `images.js` → `img/*.webp` à la demande | Élevé | Moyen | — |
| E | Découper `index.html` en modules (§4) | Moyen | Élevé | — |
| F | Accessibilité (clavier, mouvements réduits, contraste) | Moyen | Moyen | — |
| G | Documenter l'échelle du quiz et traduire les fiches en anglais | Faible | Moyen | — |

## 7. Tests
`node tests/atlas/run.js` (environ 1 min) ; ajoute `--video` pour tester l'enregistrement vidéo.
La suite couvre : intégrité des données (liens, sources, format, titres wiki), 8 cartes × 5 formats, budget SVG, recherche FR et EN, liens `#id`, exports SVG/HTML/PNG, règles et score du quiz, bascule FR/EN, échappement XSS, absence de défilement horizontal de 360 à 1920 px, vidéo 15 s + `.srt`.
**Dernier passage (2026-11-04) : 25 réussis, 0 échoué, avec `--video`.**

## 8. Décisions techniques
- On reste en statique pur : aucun secret ni backend n'est nécessaire pour l'atlas.
- Tout texte externe passe par `escH`, et les URL d'images sont mises en liste blanche.
- Les captures de test vont dans un dossier temporaire, jamais dans le site publié.
- Le développement se fait sur la branche de travail. La mise en ligne (fusion dans la branche publiée) se fait avec l'accord du propriétaire.

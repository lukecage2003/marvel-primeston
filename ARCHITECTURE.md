# ARCHITECTURE — Marvel Primestone

## Actuelle (2026-11-04)
Site statique publié par GitHub Pages depuis `main` (à la racine). **Aucune dépendance à l'exécution, aucun backend.**

| Fichier ou dossier | Rôle |
|---|---|
| `index.html`, `encyclopedie.html`, `cosmos.html`, `structures.html`, `chronologie.html`, `archive.html`, `dossiers.html`, `recherche.html`, `fiche/*.html` (301), `dossier/*.html`, `search.json` | Pages **générées** par `tools/build.js` (ne pas modifier à la main) |
| `assets/site.css`, `assets/site.js` | Design system (tokens, 6 familles de cartes) et comportements (images du wiki, filtres, recherche) |
| `explorer.html` | L'atlas interactif : 8 cartes SVG, Codex, vidéo, miniatures, quiz, i18n. Il lit `data.js` et `images.js` |
| `data.js` | Fiches Marvel (source de vérité, modifiée à la main) |
| `content/dc_entries.py` → `data-dc.js` | Fiches et cartes DC : textes Primestone et positions des nœuds (`content/dc_entries.py`), assemblés avec les sources vérifiées par `tools/dc_build.py`. L'explorateur affiche DC avec `explorer.html?u=dc` |
| `content/dc_titles.json`, `content/dc_wiki.json` | Titres exacts des pages du wiki DC, puis faits, première apparition (avec année) et image actuelle, relevés par `python3 tools/wiki_facts.py dc` |
| `content/atlas.json`, `content/atlas-dc.json` | Instantanés des fiches Marvel et DC, produits par `node tools/snapshot.js` et `node tools/snapshot.js dc` |
| `content/dossiers/*.md` | Dossiers éditoriaux (markdown simple, liens `[[id]]` vérifiés) |
| `content/wiki.json` | Image principale actuelle et fiche d'identité **factuelle** (champs courts de l'infobox) de chaque fiche, relevées sur marvel.fandom.com par `tools/wiki_facts.py`. Aucun texte rédigé n'est repris |
| `comics.json` | Index des comics cités (`tools/comics.js`) |
| `content/family.json` | Liens de parenté Marvel (parent → enfant, fratries) tirés des fiches du wiki, par `python3 tools/family.py`, qui écrit aussi le bloc généré `window.DB.FAM` et `window.DB.IMGW` (images du wiki) à la fin de `data.js` |
| `content/appearances.json` | Nombre d’apparitions, premières et dernières parutions de chaque fiche (catégories « Appearances » des wikis), par `python3 tools/appearances.py` |
| `bios.json` | Biographies générées par `tools/build.js` (origines, famille, rôle, apparitions), lues par le panneau de l’explorateur au clic sur un nœud |
| `img/` | Portraits webp (chargés à la demande), logo, `credits.json` |

### Chaîne de publication
1. Modifier `data.js` ou un dossier.
2. Lancer `python3 tools/wiki_facts.py` et `python3 tools/wiki_facts.py dc` (faits du wiki), `python3 tools/family.py`, `python3 tools/appearances.py`, puis `python3 tools/dc_build.py` (si DC a changé), `node tools/stamp.js`, `node tools/comics.js`, `node tools/snapshot.js`, `node tools/snapshot.js dc`, puis `node tools/build.js`. Pour rafraîchir les images et les fiches d'identité : `python3 tools/wiki_facts.py`, puis `node tools/build.js`.
3. Lancer `npm test` (38 contrôles).
4. Pousser. L'action `Tests` revérifie tout, puis GitHub Pages publie `main`.

`tools/build.js` **refuse de générer** si une donnée est incohérente : relation vers une fiche inconnue, niveau de fiabilité inconnu, fiche « canon » sans numéro de comic, lien de dossier cassé.

### Pourquoi un générateur maison plutôt qu'Astro (décision du 2026-11-04, révisant la proposition initiale)
- Il apporte les mêmes bénéfices pour le besoin actuel : une page par fiche, des données validées et des pages légères (36 Ko pour l'accueil).
- Il n'ajoute **aucune dépendance** et ne demande **aucun build côté GitHub**. Pages continue de publier les fichiers tels quels : aucun risque de casser la mise en ligne.
- Il tient en un seul fichier de 300 lignes lisibles. Il sera remplaçable par Astro le jour où le projet aura besoin de composants interactifs nombreux ou d'éditeurs multiples : les données (`content/`) sont déjà séparées du rendu.

## Décisions
- **Pas de base de données serveur.** Git est la base, avec historique, relecture et sauvegarde gratuites.
- **Pas d'authentification.** Rien à protéger en écriture ; l'édition passe par des pull requests.
- **Images du wiki :** affichées depuis leur hébergement d'origine, dans des balises `<img>` en chargement différé et sans en-tête Referer (le wiki remplace sinon l'image par un visuel gris). Elles sont créditées sur chaque fiche ; aucune nouvelle illustration Marvel n'est hébergée par le projet.
- **Aucun lien vers un site extérieur** dans les pages : les sources renvoient à l'archive interne (contrôlé par les tests).
- **Tout texte externe passe par `escH`**, et les URL d'images sont en liste blanche (déjà en place).

### Versions des cartes (« Mon plan » / « Officiel »)
Chaque carte déclare `off` dans `MAPS` (Marvel) ou `DCOFF` (DC) : la publication d'origine du schéma officiel, `null` si aucune version officielle n'existe (plan Primestone, par exemple les Axes des Ur-Diviseurs), ou `data` pour les cartes construites à partir des sources (Réseau, Chronologie, Crises). En version officielle, les nœuds de niveau « théorie » sont masqués.

### Cartes (2026-11-21)
- **Marvel (9)** : … et La Magie (dieux anciens, Vishanti, seigneurs des dimensions, démons).
- **Marvel (liste initiale)** : Cosmos, Arbre, Axes, Firmaments, Omnivers (coupe Macro/Micro), Familles (généalogie relevée sur le wiki), Royaumes (Yggdrasil et les Dix Royaumes, la galaxie, les dimensions), Chronologie (jalons éditoriaux et grands événements). La Hiérarchie et le Réseau ont été retirés.
- **DC (10)** : … plus Les Forces et Le Ciel et l’Enfer ; Les Endless et La Magie remplacent Les Éternels et Forces et magie. Familles DC : `content/dc_family.json` (champ Relatives du wiki).
- **DC (liste initiale)** : Orrerie des mondes (structure de « The Map of the Multiverse », 52 Terres), Création, Spectre émotionnel (9 lumières, entités, Corps, porteurs), Éternels, Quatrième Monde, Forces et magie, Crises, Réseau. Décrites dans `content/dc_entries.py` : `deco` (bandes, anneaux, disques, panneaux), `orbits`, `spokes`, `nodes` (`'x'` = propre au plan Primestone), `fam` (flèches de parenté).
- **Noms** : le libellé affiché est le nom anglais ; le nom français reste dans la fiche.
- **Version officielle** : masque les constructions de fans et les nœuds `'x'`, et affiche la planche officielle hébergée par le wiki quand elle existe (`off.img`, `off.cap`).

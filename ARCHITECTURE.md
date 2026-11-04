# ARCHITECTURE — Marvel Primestone

## Actuelle (2026-11-04)
Site statique publié par GitHub Pages depuis `main` (à la racine). **Aucune dépendance à l'exécution, aucun backend.**

| Fichier ou dossier | Rôle |
|---|---|
| `index.html`, `encyclopedie.html`, `cosmos.html`, `structures.html`, `chronologie.html`, `archive.html`, `dossiers.html`, `recherche.html`, `fiche/*.html` (301), `dossier/*.html`, `search.json` | Pages **générées** par `tools/build.js` (ne pas modifier à la main) |
| `assets/site.css`, `assets/site.js` | Design system (tokens, 6 familles de cartes) et comportements (images du wiki, filtres, recherche) |
| `explorer.html` | L'atlas interactif : 8 cartes SVG, Codex, vidéo, miniatures, quiz, i18n. Il lit `data.js` et `images.js` |
| `data.js` | Fiches de l'encyclopédie (source de vérité, modifiée à la main) |
| `content/atlas.json` | Instantané de toutes les fiches (data.js et nœuds des cartes), produit par `tools/snapshot.js` |
| `content/dossiers/*.md` | Dossiers éditoriaux (markdown simple, liens `[[id]]` vérifiés) |
| `comics.json` | Index des comics cités (`tools/comics.js`) |
| `img/` | Portraits webp (chargés à la demande), logo, `credits.json` |

### Chaîne de publication
1. Modifier `data.js` ou un dossier.
2. Lancer `node tools/stamp.js`, `node tools/comics.js`, `node tools/snapshot.js`, puis `node tools/build.js`.
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
- **Tout texte externe passe par `escH`**, et les URL d'images sont en liste blanche (déjà en place).

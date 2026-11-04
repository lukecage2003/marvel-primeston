# ROADMAP — Marvel Primestone

Légende : effort S, M ou L · ✋ = accord requis avant mise en ligne.

## Étape 0 — Correctifs immédiats (S)
- [x] Versionner `data.js` et `images.js` (`?v=` avec le hash, `node tools/stamp.js`, vérifié par les tests).
- [x] Requalifier les 137 fiches vérifiées uniquement sur le wiki communautaire : niveau `u` « À vérifier », avec la source du wiki indiquée en clair.

## Étape 1 — Fiabilité documentaire (M)
- [x] Contrôler les 87 fiches « canon » : 87 pages trouvées sur le wiki, 71 premières apparitions concordantes, 16 citant un arc de référence (1ʳᵉ apparition du wiki ajoutée). Toutes passent « À vérifier » : aucune description n'a été confrontée aux comics.
- [x] 5 niveaux et « À vérifier » dans l'interface (fiche, Codex, filtres, explication, anglais). Nœuds des cartes et chronologie : « canon » → « À vérifier » ; théories et interprétations conservées.
- [x] `comics.json` (tools/comics.js) : 211 références, dont 193 numéros et 18 arcs, avec les fiches qui les citent. Sources cliquables (recherche sur le wiki). Reste à faire : auteurs, pages et « ce que la source établit » (Evidence).
- [x] Portraits extraits dans `img/*.webp` chargés à la demande (`images.js` : 611 → 74 Ko) ; `img/credits.json` (origine à documenter, champ par champ). Exports SVG, PNG, HTML autonome et vidéo intègrent toujours les images.

## Étape 2 — Socle (M) ✅
- [x] Générateur `tools/build.js` (au lieu d'Astro, voir ARCHITECTURE.md) avec validation des données. Instantané `content/atlas.json`.
- [x] Accueil : ce qu'est Primestone, les 8 Cosmos, les entités fondamentales, trois portes d'entrée, la transparence sur la fiabilité.
- [x] Atlas déplacé vers `explorer.html`, sans régression. Les anciens liens `#id` sont redirigés vers l'explorateur.
- [x] Action GitHub `Tests` à chaque push (sans déploiement).

## Étape 3 — Système de cartes (M) ◐
- [x] Six familles en place dans `assets/site.css` : Cosmos (A), Entité (B et compacte), Structure (C), Événement (D, styles prêts), Comic (E), Dossier (F).
- [ ] Comparer 2 ou 3 variantes des cartes B et E sur de vrais utilisateurs : **pas fait**. Une seule version a été conçue, puis vérifiée à 390 et 1280 px.

## Étape 4 — Modules principaux (L) ✅
- [x] 301 pages de fiche : présentation, sources cliquables, relations, comics qui la documentent, lien vers l'explorateur, fiche précédente et suivante.
- [x] Page Structures : 4 systèmes présentés séparément, sans hiérarchie unique imposée.
- [x] Trois chronologies distinctes. **La chronologie interne n'est pas encore documentée** (la page le dit).
- [x] Recherche : autocomplétion dans l'en-tête, page de résultats, filtres par type, noms anglais. (Index maison `search.json` plutôt que Pagefind : 301 fiches, aucune dépendance.)

## Étape 5 — Fonctionnalités avancées (L) ◐
- [x] Explorateur relié aux pages : lien « Fiche complète » dans le panneau, lien « Voir dans l'explorateur » sur chaque fiche.
- [x] Archive des comics : 211 références, filtres par décennie, fiches qui les citent.
- [ ] Preuves détaillées (auteurs, pages, « ce que la source établit ») : **à faire au fil de la vérification**, rien n'est inventé.
- [x] Dossiers : moteur markdown et 2 dossiers (« Méthode », « Les huit Cosmos »). Il faudra en écrire davantage.

## Étape 6 — Qualité et finalisation (M) ◐
- [x] Accessibilité des pages : lien d'évitement, titres, textes alternatifs, focus visible, cibles d'au moins 40 px, `prefers-reduced-motion` (pages et explorateur, rotation automatique coupée).
- [x] Performance : accueil à 36 Ko (HTML, CSS et JS), portraits à la demande.
- [ ] Navigation clavier complète dans les cartes SVG de l'explorateur : partielle (flèches, raccourcis, Codex comme alternative).
- [ ] Pages éditoriales en anglais : non traduites (l'explorateur l'est).

## Prochaines étapes
1. **Vérification des fiches dans les comics**, numéro par numéro, pour attribuer « Canon » et remplir les preuves. C'est un travail éditorial humain.
2. D'autres dossiers éditoriaux.
3. La traduction anglaise des pages éditoriales.

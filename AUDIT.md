# Audit de Marvel Primestone — 2026-11-04

Périmètre : dépôt `lukecage2003/marvel-primeston`, branche `claude/marvel-cards-interactive-site-gkl3zb` (identique à `main`, commit `7e42fb1`).
**Limite :** le site en ligne n'a pas pu être chargé depuis l'environnement d'audit, car le réseau bloque `github.io`. L'audit repose sur le code source du dépôt, exécuté localement dans Chromium (Playwright), à 360, 390, 768, 1280 et 1920 px.

---

## 1. État des lieux technique

| Élément | Constat mesuré |
|---|---|
| Fichiers du site | `index.html` (168 Ko, 1 137 lignes, CSS et un seul script), `data.js` (51 Ko), `images.js` (611 Ko de base64), `og.png` (544 Ko, partage seulement) |
| Build et dépendances | Aucun. Statique pur, publié par GitHub Pages depuis `main` à la racine |
| Externe | API `marvel.fandom.com` (images, chargées au fil de l'eau), Google Fonts |
| Stockage | `localStorage` : images importées, cache du wiki, préférences |
| Chargement | DOMContentLoaded en 1,06 s en local. `images.js` (611 Ko) est **bloquant** |
| Rendu | 55 à 60 i/s sur 7 cartes. Réseau : 18,7 i/s (après correctif ; 2,7 avant) |
| Tests | `tests/atlas/run.js` : 25 contrôles (données, 8 cartes × 5 formats, recherche, exports, quiz, i18n, XSS, responsive, vidéo) : **tous réussis** |
| Cache | Pages sert les fichiers avec `max-age=600`. `data.js` et `images.js` n'ont **pas de numéro de version** : après une mise à jour, un navigateur peut mélanger d'anciens et de nouveaux fichiers pendant environ 10 minutes. C'est la cause probable de « je n'ai pas reçu la mise à jour ». |
| Maintenabilité | Tout le JS tient dans un seul fichier très compact (noms d'une lettre, lignes de plus de 500 caractères). Les données sont réparties entre `data.js` et 6 tableaux dans `index.html` (COS, TREE, UR, FIR, OM, HIER). L'i18n repose sur un observateur du DOM, ce qui est fragile. |

## 2. Fonctionnalités existantes

| Fonction | État réel | Limites |
|---|---|---|
| 8 cartes SVG (Cosmos, Arbre, Axes 3D, Firmaments, Omnivers, Hiérarchie, Réseau, Chronologie) | Fonctionnent dans les 5 formats | Pas de navigation au clavier ni de lecture d'écran. Les cartes Qlippoth et Ur-Diviseurs sont des **constructions de fans** (marquées « théorie », mais visuellement mises au même niveau que le canon) |
| Codex (filtres, impression PDF) | Fonctionne | Une seule famille de cartes pour tout. Aucune page propre par fiche (pas d'URL partageable indexable, seulement `#id`) |
| Recherche FR/EN | Fonctionne (datalist) | Pas d'alias, pas de tolérance aux fautes, pas de résultats groupés |
| Panneau de fiche | Fonctionne | Description **courte** (médiane de 64 caractères). 212 fiches sur 225 sans « fait marquant » |
| Exports PNG, SVG, HTML | Fonctionnent | — |
| Vidéo (TikTok/YouTube, transitions, .srt, musique) | Fonctionne (enregistrement en temps réel) | Bureau seulement (MediaRecorder) et lent : 1 s de vidéo = 1 s de calcul |
| Miniatures, Quiz | Fonctionnent | L'échelle de puissance du quiz (`POW`) est **éditoriale**, non sourcée |
| i18n EN | Interface seulement | Contenu des fiches et libellés SVG en français |

## 3. Fiabilité documentaire (point le plus faible)

- **225 fiches** dans `data.js`, plus 111 nœuds de cartes. Niveaux de certitude : **224 « canon », 1 « déduit »**.
- **Problème :** pour les 137 fiches ajoutées le 2026-11-04, seuls l'**existence de la page** et la **première apparition** (champ *First*) ont été vérifiés, sur un **wiki communautaire** (marvel.fandom.com), qui n'est pas une source officielle. Les descriptions et les relations n'ont pas été confrontées aux comics. Elles ne devraient donc pas porter l'étiquette « canon ».
- Les sources sont du **texte libre** (« Thor #225 (1974) ») : 207 chaînes uniques, sans auteurs, sans page, sans dire ce que la source prouve.
- Le système n'a que 3 niveaux (c, d, t). Le cahier des charges en demande 5 : canon, source officielle secondaire, interprétation, théorie, contesté.
- Les trois temporalités (cosmologique, éditoriale, interne) sont **mélangées** : la carte Chronologie est éditoriale, la carte Cosmos est cosmologique, sans distinction explicite.
- **Droits :** 37 portraits détourés sont intégrés en base64, d'origine non documentée. Les images du wiki sont chargées en hotlink, avec un lien vers la page mais sans crédit d'artiste.

## 4. Analyse UX/UI

**Forces :** identité forte (noir et jaune, Kirby), exploration visuelle originale, outils de création (vidéo, miniature) uniques pour un média.

**Faiblesses :**
1. Pas d'**accueil** : on arrive directement dans une carte, sans expliquer ce qu'est Primestone.
2. Tout se passe dans un seul écran plein, avec des surcouches : pas de pages, pas de profondeur éditoriale, pas d'URL par fiche.
3. Les outils de création (vidéo, miniature, quiz) et la consultation sont **mélangés** dans la même barre.
4. Sur téléphone, l'en-tête, deux barres de 8 onglets et la barre d'outils du bas laissent environ 60 % de l'écran au contenu.
5. Les textes des cartes sont petits en vue d'ensemble : lisibles depuis le correctif du 2026-11-04, mais à la limite.
6. Accessibilité : les cartes SVG ne sont pas utilisables au clavier, il n'y a pas de `prefers-reduced-motion`, et certaines animations sont permanentes (étoiles, rotation des Axes).

## 5. Inventaire des cartes existantes

| # | Carte | Où | Verdict | Pourquoi |
|---|---|---|---|---|
| 1 | **Nœud orbital** (cercle et image, anneau Kirby, libellé) | 8 cartes SVG | **Conserver** | Signature visuelle du projet, efficace en exploration |
| 2 | **Légende de visite** `#cap` (papier crème, titre, sous-titre, description, mini-portrait) | Tour, formats vidéo | **Faire évoluer** | Bonne hiérarchie. Le crème jure avec le noir premium ; le mini-portrait fait doublon avec le nœud |
| 3 | **Panneau de fiche** `#panel` | Clic sur un nœud | **Remplacer** par la page de fiche (§6, famille B) | Trop étroit pour une fiche approfondie. Mélange source, relations et outils d'image |
| 4 | **Carte-titre de carte** `#card` (lettres animées) | Intro de chaque carte | **Conserver** | Forte et discrète |
| 5 | **Carte du Codex** `.cxe` (rond, nom, sous-titre, pastille) | Codex | **Remplacer** | Une même carte générique pour les Cosmos, les entités et les événements. Aucune information de fonction ni de relation |
| 6 | **Info-bulle** `#tip` | Survol | **Faire évoluer** | Peut devenir l'« aperçu contextuel » des familles |
| 7 | **Duel du quiz** (canvas) | Quiz | **Conserver** | Bien adapté au format vertical. Il faut sourcer l'échelle |
| 8 | **Cartes vidéo** (accroche, légende, sortie) | Canvas vidéo | **Conserver** | Cohérentes avec la direction Primestone |
| 9 | **Liste de téléchargement** `#dl` | Menu | **Faire évoluer** | À séparer dans un espace « Studio » |

## 6. Références et inspirations (principes, pas des modèles à copier)

Ces références viennent de la connaissance de ces produits, pas d'une comparaison visuelle en direct : la navigation web est bloquée depuis cet environnement.

| Source d'idée | Principe retenu |
|---|---|
| Fiches d'œuvres des plateformes de streaming | Image plein cadre avec dégradé de lecture, titre posé sur l'image, métadonnées en ligne fine |
| Cartels de musée et catalogues d'exposition | Petit bloc factuel normé (date, support, provenance) : c'est le modèle des « preuves » |
| Encyclopédies de qualité (infobox) | Colonne factuelle séparée du récit, chaque champ sourcé |
| Bibliothèques numériques (notices) | Notice bibliographique normalisée pour les comics : série, n°, date, auteurs |
| Visualisation de données éditoriale | Légende toujours visible, une seule variable encodée par la couleur |
| Planétariums et atlas célestes | Hiérarchie par l'échelle et la distance, pas par la décoration |
| Comics de Kirby | Krackle et trame, réservés aux **moments d'énergie** (sélection, transition), jamais au texte |

## 7. Nouveau système de cartes (proposition)

Six familles, un seul système de tokens (`DESIGN_SYSTEM.md`) :

- **A. Cosmos** : format vertical 3:4. Grand chiffre romain en filigrane (I–VIII), période, une phrase, une barre « naissance → mort » qui montre la transition vers le Cosmos suivant. Lien vers le dossier et les sources.
- **B. Entité** : portrait détouré qui déborde du cadre en haut, nom, **nature** (pastille), **fonction cosmologique** en une ligne, 3 relations clés en avatars, badge de fiabilité. Version compacte pour les listes.
- **C. Structure** : schéma miniature (anneaux concentriques ou arbre) plutôt qu'une image ; le niveau dans la hiérarchie est indiqué par l'indentation.
- **D. Événement** : bandeau horizontal 16:9 avec année éditoriale **et** position cosmologique séparées, impact (une ligne), lien vers la chronologie.
- **E. Comic (preuve)** : cartel de musée avec couverture à gauche, notice normalisée, puis « ce que ce numéro établit » et le statut de la preuve.
- **F. Dossier** : format magazine, catégorie, titre éditorial, chapô, temps de lecture.

Ce qui reste commun : coins vifs ou de 4 px (esprit comics, pas de grands arrondis), bord fin, ombre portée nette décalée (signature Primestone), pas de flou ni de glassmorphism, focus visible, cible tactile d'au moins 44 px.
**Validation prévue :** pour les cartes B et E (les plus utilisées), 2 ou 3 prototypes chacune, comparés à 390 et 1280 px avant de les généraliser.

## 8. Architecture cible (synthèse ; détail dans `ARCHITECTURE.md`)

On garde le **statique sur GitHub Pages**, avec un générateur de site statique (Astro recommandé) qui lit des **fichiers de contenu validés par schéma**. L'atlas actuel est conservé comme module « Explorateur », il n'est pas réécrit. Il n'y a ni backend, ni base de données serveur, ni authentification tant qu'il n'y a pas d'édition à plusieurs.

## 9. Architecture documentaire (synthèse ; détail dans `DATA_MODEL.md`)

Le modèle est centré sur les **affirmations** (*claims*) : chaque affirmation importante porte un statut parmi les 5 niveaux et une liste de **preuves** (un numéro de comic avec sa page, et ce qu'il établit). Les fiches, les relations et les chronologies s'appuient sur ces affirmations.

## 10. Feuille de route priorisée

Voir `ROADMAP.md`. Les trois premières étapes :
1. **Fiabilité :** requalifier les 137 fiches dont la source est le wiki, et passer aux 5 niveaux.
2. **Socle :** versionner les fichiers (cache), extraire les données vers des fichiers de contenu, créer un accueil.
3. **Prototypes des cartes B et E**, puis les pages de fiche.

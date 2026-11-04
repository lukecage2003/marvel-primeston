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

## Étape 2 — Socle (M) ✋
- [ ] Projet Astro, schémas de contenu, script de migration depuis `data.js` et les cartes (sans perte, avec un test de comparaison).
- [ ] Accueil : ce qu'est Primestone et trois portes d'entrée (Explorer, Encyclopédie, Dossiers).
- [ ] Atlas actuel intégré sous `/explorer/` (aucune régression : les 25 tests doivent rester verts).
- [ ] Déploiement par action GitHub ; tests de validation obligatoires pour chaque PR.

## Étape 3 — Système de cartes (M)
- [ ] Prototypes des familles B (Entité) et E (Comic) : 2 ou 3 variantes chacune, comparées à 390 et 1280 px.
- [ ] Choix argumenté, puis généralisation aux familles A, C, D et F.

## Étape 4 — Modules principaux (L)
- [ ] Pages de fiche (Entité, Cosmos, Structure) avec infobox sourcée.
- [ ] Trois chronologies distinctes : cosmologique, éditoriale, interne.
- [ ] Recherche Pagefind : alias, filtres, autocomplétion.

## Étape 5 — Fonctionnalités avancées (L)
- [ ] Cosmic Explorer relié aux données (sélection d'une structure, puis des entités, des événements et des sources).
- [ ] Archive des preuves (Comic Evidence).
- [ ] Dossiers éditoriaux reliés aux affirmations.

## Étape 6 — Qualité et finalisation (M)
- [ ] Accessibilité (clavier dans l'Explorateur, mouvements réduits, contraste AA vérifié).
- [ ] Budget de performance : moins de 200 Ko au premier chargement, LCP sous 2,5 s en 4G.
- [ ] Audit final et mise à jour des documents.

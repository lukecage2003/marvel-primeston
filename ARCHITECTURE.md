# ARCHITECTURE — Marvel Primestone

## Actuelle
Site statique publié par GitHub Pages depuis `main` (à la racine). Il tient dans `index.html` (UI, 8 cartes SVG, Codex, vidéo, quiz, miniatures, i18n), `data.js` (fiches et chronologie) et `images.js` (portraits en base64). Aucun build ni dépendance. Tests : `tests/atlas/run.js` (Playwright).

## Cible

### Principe
On reste en **statique**. Il n'y a pas de backend tant qu'il n'y a ni comptes ni édition à plusieurs : l'encyclopédie se lit, elle ne s'écrit pas en ligne. GitHub Pages reste gratuit, rapide et sans surface d'attaque serveur.

### Choix recommandé : Astro (générateur de site statique)
| | Rester en HTML seul | **Astro** | Next.js |
|---|---|---|---|
| Une page par fiche (URL, SEO, partage) | Manuel | Natif (routes générées) | Natif |
| Données validées par schéma | À coder | Natif (collections de contenu et zod) | À coder |
| JS envoyé | Tout, toujours | Zéro par défaut ; « îlots » pour l'Explorateur | Beaucoup |
| Hébergement Pages | Oui | Oui (export statique) | Possible, avec contraintes |
| Coût de migration | — | Moyen | Élevé |

**Inconvénients d'Astro :** il faut une étape de build et une action GitHub de déploiement. Il y a aussi Node à maîtriser. Le risque est faible : le site actuel continue de vivre pendant la migration.

### Arborescence cible
```
src/
  content/                  # source de vérité, validée au build
    entities/*.json         cosmos/, structures/, events/, comics/, creators/, dossiers/*.md
    claims/*.json           affirmations et preuves (voir DATA_MODEL.md)
  content.config.ts         schémas zod (un par collection)
  pages/
    index.astro             accueil
    entites/[slug].astro    page de fiche (famille de carte B)
    cosmos/ structures/ chronologie/ archive/ dossiers/ recherche/
    explorer/               l'atlas actuel, intégré en îlot (cartes SVG, vidéo, quiz)
  components/cards/         CosmosCard, EntityCard, StructureCard, EventCard, ComicCard, DossierCard
  styles/tokens.css         design tokens (DESIGN_SYSTEM.md)
public/img/                 images sous licence ou crédit, avec manifeste credits.json
tests/                      unitaires (schémas, liens) et parcours (Playwright)
```

### Recherche
**Pagefind** : index statique généré au build, chargé à la demande, avec filtres par type et autocomplétion. Les alias sont indexés comme champs. Il tient des milliers de pages sans serveur.

### Images
Fichiers `img/*.webp` dimensionnés (320 et 800 px) chargés à la demande (`loading="lazy"`), au lieu du `images.js` de 611 Ko. Un `credits.json` par image indique la source, l'œuvre, l'artiste si connu et le cadre d'usage. Les images du wiki restent en lien, avec le crédit affiché.

### Qualité
Pour chaque pull request, une action GitHub lance la validation des schémas, vérifie les liens internes (aucune relation ni preuve orpheline) et exécute les tests Playwright. Le déploiement se fait seulement depuis `main`, après accord.

## Migration (par étapes, sans casser l'existant)
1. Versionner `data.js` et `images.js` (`?v=` avec le hash) pour régler le cache. *(Immédiat, sans migration)*
2. Script d'export de `DB.E` et des tableaux des cartes vers `src/content/**/*.json` avec un schéma, sans perte de données.
3. Squelette Astro avec l'accueil et les pages de fiche. L'atlas actuel est servi tel quel sous `/explorer/`.
4. Les cartes de l'atlas lisent le contenu généré (même source de vérité).
5. Recherche Pagefind, puis chronologies, archive des comics et dossiers.

## Décisions
- **Pas de base de données serveur.** Git est la base, avec historique, relecture et sauvegarde gratuites.
- **Pas d'authentification.** Rien à protéger en écriture ; l'édition passe par des pull requests.
- **Tout texte externe passe par `escH`**, et les URL d'images sont en liste blanche (déjà en place).

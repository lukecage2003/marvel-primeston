# DESIGN_SYSTEM — Marvel Primestone

## Direction
L'encyclopédie se lit sur des surfaces sobres. L'exploration cosmique a droit à l'énergie Kirby, mais **seulement en mouvement** (sélection, transition). Texte et données ne reçoivent jamais d'effet.

> **Point à arbitrer :** le cahier des charges du 2026-11-04 cite le « rouge cosmique » et des accents « doré ou argenté » ; la DA Primestone actuelle est noir et jaune. Proposition : le jaune Primestone sert d'**or** (marque, action principale), le rouge est l'accent secondaire, le gris argent porte les métadonnées.

## Tokens
```css
--bg:#0b0b0b; --surface:#141412; --surface-2:#1d1c19; --line:#2c2a25;
--text:#f2efe6; --text-2:#c9c3b3; --text-3:#8f897a;          /* contraste ≥ 4.5:1 sur --bg pour text et text-2 */
--gold:#FFE500; --gold-ui:#FFF503; --red:#e2493f; --silver:#b8b8b0;
--status-canon:#7fe0a0; --status-official:#7fb8e0; --status-interp:#e0c27f; --status-theory:#c79bff; --status-contested:#ff8a5c;
--font-display:'Big Shoulders Display'; --font-accent:Anton; --font-text:Newsreader;
--step--1:14px; --step-0:17px; --step-1:21px; --step-2:28px; --step-3:40px; --step-4:64px;  /* texte courant : 17 px minimum */
--space:4px 8px 12px 16px 24px 32px 48px 72px;
--radius:4px; --shadow-hard:6px 6px 0 #000; --focus:0 0 0 3px var(--gold);
```

## Cartes (familles)
| Famille | Ratio | Contenu obligatoire | Interaction |
|---|---|---|---|
| A Cosmos | 3:4 | n° romain, nom, période, une phrase, barre de transition | Survol : la barre s'anime une fois. Toucher : ouvre la page |
| B Entité | 4:5 (compacte : ligne de 72 px) | portrait, nom, nature, fonction, 3 relations, badge de statut | Survol : aperçu des relations. Appui long : aperçu |
| C Structure | 1:1 | schéma, nom, type, niveau | Sélection : met en surbrillance le parent et les enfants |
| D Événement | 16:9 | image, titre, année éditoriale et position cosmologique, impact | — |
| E Comic | cartel horizontal | couverture, série n°, date, auteurs, « établit… », statut | — |
| F Dossier | 3:2 | image, catégorie, titre, chapô, minutes | — |

**Règles communes :**
- Bordure de 1 px `--line` ; ombre `--shadow-hard` seulement sur la carte active ou survolée.
- Titre en `--font-display`, texte en `--font-text`, jamais sous 14 px.
- Image avec un dégradé de lecture du bas vers le haut, et le texte jamais posé directement sur une image sans ce dégradé.
- États : repos, survol (translateY de −2 px et ombre), sélectionné (bord gauche or de 3 px), focus (`--focus`), désactivé (opacité 0,5).
- `prefers-reduced-motion` : aucune translation, aucune animation.

## Responsive
- Grille de 4 colonnes en mobile, 8 en tablette, 12 en bureau. Marge latérale de 16, 24 ou 48 px.
- Cartes : 1 colonne sous 480 px, 2 jusqu'à 900 px, puis 3 à 4 colonnes.
- Navigation : barre basse à 4 entrées sur mobile (Explorer, Encyclopédie, Recherche, Dossiers), en-tête complet au-delà de 900 px.

## Composants déjà en place (atlas)
Nœud orbital, carte-titre, duel de quiz et cartes vidéo : **conservés** (voir `AUDIT.md` §5). La légende de visite et l'info-bulle **évolueront** vers les tokens ci-dessus.

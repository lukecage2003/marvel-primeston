# DATA_MODEL — Marvel Primestone

Principe : **toute affirmation importante est un objet `Claim`** relié à des preuves. Les fiches affichent des affirmations ; elles ne contiennent pas de vérités non sourcées.

## Niveaux de fiabilité (`status`)
| Code | Libellé | Règle |
|---|---|---|
| `canon` | Canon | Montré ou dit explicitement dans une publication Marvel. Il faut au moins une preuve `comic` avec numéro, et une page si elle est connue |
| `official` | Source officielle secondaire | Guide ou manuel officiel Marvel (ex. *Official Handbook of the Marvel Universe*) |
| `interpretation` | Interprétation | Conclusion argumentée à partir de plusieurs publications. Les publications citées sont obligatoires |
| `theory` | Théorie | Hypothèse non confirmée (ex. Qlippoth, Ur-Diviseurs). Son auteur ou son origine est obligatoire |
| `contested` | Contesté | Les sources se contredisent. Il faut au moins deux preuves opposées |
| `unverified` | À vérifier | État transitoire : affiché avec un avertissement, jamais présenté comme canon |

**Migration :** les fiches actuelles marquées `c` dont la seule vérification est le champ *First* d'un wiki communautaire passent à `unverified` pour leurs affirmations descriptives. Leur première apparition reste citée avec la source « wiki communautaire ».

## Entités et collections
```ts
Entity      { id, slug, name{fr,en}, aliases[], kind: 'abstract'|'cosmic'|'character'|'group'|'object'|'place'|'force',
              firstAppearance?: ComicRef, creators?: CreatorRef[], summary{fr,en}, roleClaims: ClaimId[],
              abilities: ClaimId[], affiliations: RelationId[], media: MediaId[], updatedAt }
Cosmos      { id, ordinal (1..8), name, cycleClaims: ClaimId[], predecessor?, successor?, survivors: EntityId[] }
Structure   { id, name, type: 'multiverse'|'universe'|'dimension'|'plane'|'metaphysical',
              contains?: StructureId[], containedBy?: StructureId[],   // jamais une hiérarchie unique : chaque lien est un Claim
              variants: { era, claimId }[] }                            // contradictions selon les périodes éditoriales
Event       { id, name, editorial: { start: date, end?: date, issues: ComicRef[] },   // chronologie éditoriale
              cosmological?: { cosmos: CosmosId, order?: number },                 // chronologie cosmologique
              internal?: { before?: EventId[], after?: EventId[] },                // chronologie interne
              impactClaims: ClaimId[] }
Comic       { id, series, volume, issue, coverDate?, releaseDate?, writers[], artists[], coverMedia? }
Creator     { id, name, roles[] }
Claim       { id, subject: Ref, predicate: string, object?: Ref|string, text{fr,en}, status, evidence: Evidence[],
              notes?, addedBy, verifiedAt? }
Evidence    { kind: 'comic'|'official'|'secondary'|'wiki', comic?: ComicId, page?: string, panel?: string,
              url?: string, establishes: string }     // ce que la source prouve précisément
Relation    { id, from: Ref, type: 'creates'|'opposes'|'serves'|'part_of'|'embodies'|'herald_of'|…, to: Ref, claim: ClaimId }
Dossier     { slug, title, category, summary, readingMinutes, body.md, cites: ClaimId[], entities: Ref[] }
Media       { id, file, kind, credit: { work, artist?, publisher: 'Marvel', sourceUrl }, usage: 'citation'|'licensed'|'own' }
```

## Règles de validation (au build)
- Toute référence (`Ref`, `ComicId`, `ClaimId`) doit exister. Le build échoue sinon.
- `status: canon` exige au moins une `Evidence` de type `comic`.
- `status: contested` exige au moins deux `Evidence`.
- Il n'y a pas de numéro de comic sans `series` et `issue`. Les dates sont au format ISO.
- Un `Media` sans `credit` est refusé.

## Correspondance avec l'existant
`DB.E[id] = [nom, en, cat, sous-titre, desc, sources, cert, liens, fait]` devient :
- `Entity` (nom, en, cat → kind) ;
- `summary` (desc) ;
- `Claim` par source ;
- `Relation` (liens, typés `related` jusqu'à leur requalification) ;
- `cert` → `status` (voir la migration ci-dessus).

`DB.T` devient `Event.editorial`. Les tableaux des cartes (COS, TREE, FIR, OM, HIER, UR) deviennent `Cosmos` et `Structure` ; les nœuds « théorie » passent en `status: theory`.

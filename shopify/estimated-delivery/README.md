# Livraison estimée — NT7East

Bloc de thème Shopify (`Online Store 2.0`, thème Horizon) qui affiche une **date
de livraison estimée dynamique** sur la fiche produit, dans le style AliExpress
(« Livraison estimée : 27 août - 2 sept. »), calculée automatiquement — sans
app tierce.

## Comment le délai est déterminé, produit par produit et pays par pays

Pour chaque produit, dans cet ordre de priorité :

1. **Surcharge manuelle sur le produit** (métachamps `custom.delai_min` /
   `custom.delai_max`, ou `custom.delai_pays` pour un pays précis) — réservé
   aux cas exceptionnels sur un produit donné.
2. **Mode d'expédition assigné au produit** (métachamp `custom.mode_expedition`,
   liste déroulante) — **c'est la méthode recommandée au quotidien.**
3. **Délai par défaut de la boutique** (métachamps `custom.delai_min_defaut` /
   `custom.delai_max_defaut`, réglés à 5-9 jours).
4. **Valeurs de repli** définies dans les réglages du bloc (dans le thème).

### Le système de "Mode d'expédition" (produit par produit, marché par marché)

C'est la réponse au besoin : *« un petit produit expédié aux USA va plus vite
arriver qu'un produit lourd qui va prendre du temps »*.

- Un type de métaobjet **« Mode d'expédition »** a été créé, avec 4 entrées de
  départ dans **Admin → Contenu → Entrées de métaobjets → Mode d'expédition** :
  - **Standard**
  - **Fret lourd**
  - **Express**
  - **Économique**

  Chacune porte un champ `delais_par_pays` (JSON) qui définit son délai pour
  chaque pays. Exemple, l'entrée **Fret lourd** a été pré-remplie avec vos
  vrais tarifs Congo-Brazzaville affichés dans votre page Réglages
  d'expédition :
  ```json
  { "CG": { "min": 10, "max": 30 } }
  ```
  Une clé `"default"` optionnelle peut servir de repli pour tout pays non
  listé dans ce mode (ex. `{"CG":{"min":10,"max":30},"default":{"min":15,"max":25}}`).

- Sur **chaque fiche produit**, le métachamp **« Mode d'expédition »**
  apparaît comme une liste déroulante (pas de JSON à taper) : vous choisissez
  simplement "Fret lourd" pour un produit lourd, "Express" pour un petit
  produit qui part vite, etc. Le délai affiché s'ajuste alors automatiquement
  selon le pays du client, sans rien ressaisir produit par produit.

- **Pour ajouter/modifier des pays** sur un mode : Admin → Contenu → Entrées
  de métaobjets → Mode d'expédition → ouvrir l'entrée → éditer le champ
  `delais_par_pays` (JSON). C'est le seul endroit à maintenir — tous les
  produits utilisant ce mode se mettent à jour automatiquement.

- **Rien n'est jamais inventé** : si un produit n'a ni surcharge manuelle ni
  mode assigné, et qu'aucun délai par défaut n'est configuré, le bloc utilise
  les valeurs de repli visibles et modifiables dans l'éditeur de thème (pas
  de nombre caché en dur dans le code).

### Transporteur affiché (informatif)

Métachamp produit `custom.transporteur_prevu` (texte libre, ex. "Colissimo",
"Chronopost", "Cainiao") : s'il est renseigné sur un produit, la fiche affiche
« Expédié via Colissimo ». **Ce n'est pas une connexion à l'API Colissimo** —
juste une information saisie par vous, affichée sur la fiche. Une vraie
requête temps réel à l'API d'un transporteur nécessiterait une app tierce ou
un développement backend avec abonnement à cette API (hors périmètre thème).

## Métachamps créés

**Produit** (`custom`) :
| Clé | Type | Usage |
|---|---|---|
| `mode_expedition` | référence de métaobjet | Sélection du mode (liste déroulante) — usage recommandé |
| `transporteur_prevu` | texte | Transporteur affiché à titre indicatif |
| `delai_min` / `delai_max` | nombre entier | Surcharge manuelle exceptionnelle |
| `delai_pays` | JSON | Surcharge manuelle par pays, exceptionnelle |

**Boutique** (`custom`) :
| Clé | Type | Usage |
|---|---|---|
| `delai_min_defaut` / `delai_max_defaut` | nombre entier | Délai par défaut (5-9 j) si rien d'autre n'est configuré |
| `jours_feries` | liste de dates | Dates à exclure du calcul, en plus des week-ends |

**Métaobjet `mode_expedition`** (Contenu → Entrées de métaobjets) :
| Champ | Type | Usage |
|---|---|---|
| `label` | texte | Nom du mode (ex. "Fret lourd") |
| `delais_par_pays` | JSON | `{"CG":{"min":10,"max":30}, "default":{...}}` |

## Bloc de thème

[`blocks/estimated-delivery.liquid`](./blocks/estimated-delivery.liquid) —
exclut les week-ends (et les jours fériés listés), détecte le pays via
`localization.country` (Shopify Markets), affiche le résultat en « ligne
simple » ou « encadré », entièrement personnalisable depuis l'éditeur de
thème (texte, icône, couleur d'accent, affichage du transporteur, lignes de
réassurance, espacement).

## Où c'est déployé

⚠️ Le premier thème brouillon a été **publié en live par vous** entre-temps.
Un **nouveau thème brouillon** a donc été créé pour ce second lot de
changements, sans jamais réécrire le thème en direct :

**« NT7East - Mode expedition (dev) »**

1. Admin Shopify → **Boutique en ligne → Thèmes**
2. Trouver **« NT7East - Mode expedition (dev) »** → **Aperçu**
3. Ouvrir une fiche produit, vérifier le rendu (assignez un mode d'expédition
   à ce produit au préalable pour voir le nouveau système en action —
   sinon le délai par défaut de la boutique s'affichera).
4. Quand c'est validé : **Actions → Publier**.

## Limites connues (plan Basic, sans Shopify Plus)

- La date affichée reste une **estimation pré-achat**, pas un suivi colis en
  temps réel — elle ne se connecte à aucune API de transporteur.
- Le **checkout natif** n'est pas personnalisable sur ce plan (Delivery
  Customization Function = Shopify Plus uniquement) : ce bloc s'affiche sur
  la fiche produit, pas au checkout.
- Une fois une commande **expédiée avec un numéro de suivi**, Shopify affiche
  nativement le suivi sur la page de statut de commande / compte client —
  aucun code supplémentaire n'est nécessaire, il suffit de renseigner le
  transporteur et le numéro de suivi lors de l'expédition.

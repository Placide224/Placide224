# Livraison estimée — NT7East

Bloc de thème Shopify (`Online Store 2.0`, thème Horizon) qui affiche une **date
de livraison estimée dynamique** sur la fiche produit, dans le style AliExpress
(« Livraison estimée : 25 - 30 août »), calculée automatiquement à partir de
délais configurables — sans app tierce.

## Ce qui a été mis en place

- **Métachamps produit** (`custom`) :
  - `delai_min` (nombre entier) — délai minimum en jours ouvrés
  - `delai_max` (nombre entier) — délai maximum en jours ouvrés
  - `delai_pays` (JSON) — surcharge par pays, ex :
    ```json
    { "FR": { "min": 3, "max": 6 }, "BE": { "min": 4, "max": 7 }, "CA": { "min": 7, "max": 14 }, "CG": { "min": 10, "max": 20 } }
    ```
    Les clés sont des codes pays ISO 3166-1 alpha-2. Cela permet un délai
    différent par produit **et** par marché (Congo-Brazzaville, Canada,
    Belgique, etc.), conformément à l'architecture demandée.

- **Métachamps boutique** (`custom`) :
  - `delai_min_defaut` / `delai_max_defaut` — délai par défaut appliqué à
    tous les produits qui n'ont pas de délai spécifique (actuellement réglés
    sur **5-9 jours ouvrés**).
  - `jours_feries` (liste de dates) — jours fériés / fermetures exceptionnelles
    à exclure du calcul, en plus des week-ends (toujours exclus).

- **Bloc de thème** [`blocks/estimated-delivery.liquid`](./blocks/estimated-delivery.liquid) :
  calcule la fourchette de dates en excluant les week-ends (et les jours
  fériés listés), détecte le pays de livraison via `localization.country`
  (Shopify Markets), et affiche le résultat avec une mise en page « ligne
  simple » ou « encadré », entièrement personnalisable depuis l'éditeur de
  thème (texte, icône, couleur d'accent, lignes de réassurance, espacement).

- **Intégration** : le bloc a été ajouté sur la fiche produit (`templates/product.json`),
  juste après le bouton d'ajout au panier.

## Où c'est déployé

Un thème brouillon dédié **« NT7East - Estimation livraison (dev) »** a été créé
par duplication du thème en ligne, pour pouvoir prévisualiser et ajuster sans
aucun risque sur la boutique live. Rien n'a été publié automatiquement :

1. Admin Shopify → **Boutique en ligne → Thèmes**
2. Trouver **« NT7East - Estimation livraison (dev) »** → **Aperçu** pour
   vérifier le rendu sur une fiche produit.
3. Ajuster si besoin dans l'éditeur (icône, couleur, texte de réassurance…).
4. Quand c'est validé : **Actions → Publier** pour le mettre en ligne
   (ou utiliser « Actions → Copier les réglages » vers un thème existant).

## Configurer les délais par produit

Sur chaque fiche produit → **Métachamps** :
- Remplir `delai_min` / `delai_max` pour ce produit uniquement, et/ou
- Remplir `delai_pays` (JSON) pour des délais différents par pays.

Si rien n'est renseigné sur le produit, le délai par défaut de la boutique
(`delai_min_defaut` / `delai_max_defaut`) s'applique. Si aucun des deux
n'est renseigné, le bloc utilise une valeur de repli réglable directement
dans l'éditeur de thème (5-9 jours par défaut) — l'affichage ne casse
jamais, même sans configuration.

## Limites connues (plan Basic, sans Shopify Plus)

- La date affichée est une **estimation pré-achat**, pas un suivi colis en
  temps réel : elle ne se connecte pas à l'API d'un transporteur.
- Le **checkout natif** n'est pas personnalisable sur ce plan (Delivery
  Customization Function = Shopify Plus uniquement) : ce bloc s'affiche sur
  la fiche produit / page panier via le thème, pas dans le checkout.
- Une fois une commande **expédiée avec un numéro de suivi**, Shopify affiche
  nativement le suivi sur la page de statut de commande / compte client —
  aucun code supplémentaire n'est nécessaire pour ça, il suffit de renseigner
  le transporteur et le numéro de suivi lors de l'expédition.

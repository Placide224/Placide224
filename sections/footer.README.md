# Footer NT7East — installation

Fichiers ajoutés :
- `sections/footer.liquid` — section Shopify (schema éditable dans le thème)
- `assets/section-footer.css` — styles associés

## 1. Créer les menus de navigation

Dans **Boutique en ligne > Navigation**, créez un menu par colonne avec les liens listés dans la demande :

- **Aide** : FAQ, Moyens de paiement, Nous contacter, Conditions de livraison, Retourner un produit, Conditions d'offres, Exclusion des promotions, Rappels produits
- **Mon NT7East** : Mon compte, Mes avantages, Préférence cookies
- **À propos de NT7East** : Qui sommes-nous ?, Carrières, Nos engagements, Découvrir NT7East, Nos magasins
- **Actualités** : Idées cadeaux, Cartes cadeaux, Gravure produits, Black Friday, Soldes, NT7East Beautiful Club, Clean at NT7East, Idées & Inspirations Beauté
- **Mentions légales** (menu du bas) : CGV, Données personnelles et cookies, Accessibilité, Sitemap

## 2. Ajouter la section au thème

Dans l'éditeur de thème (`Personnaliser`), si votre thème est en Sections Everywhere (OS 2.0), ajoutez la section **Footer NT7East** au groupe `footer`. Sinon, référencez-la directement dans `layout/theme.liquid` avec `{% section 'footer' %}`.

## 3. Configurer les blocs

- 4 blocs **Service** (icônes prédéfinies : magasin, livraison, paiement sécurisé, retours) — déjà présents dans le preset.
- 4 blocs **Colonne de liens** — associez à chacun le menu créé à l'étape 1.
- Blocs **Icône réseau social** — renseignez l'URL de chaque profil (YouTube, Facebook, Instagram, TikTok…).
- Blocs **Badge application** — uploadez les badges officiels App Store / Google Play téléchargés depuis les sites d'Apple et Google (non fournis ici pour respecter leurs conditions d'usage des logos), et le lien de téléchargement.
- Réglages de section : couleur de fond (#0057FF par défaut), couleur du texte, texte de copyright, libellé pays, notes légales complémentaires (richtext).

## Notes

- Les icônes de service et de réseaux sociaux sont des SVG génériques inline (aucune dépendance externe).
- Le fond bleu (#0057FF) et le texte blanc sont réglables sans toucher au code via les paramètres de section.
- Responsive : services et colonnes passent en grille 2 colonnes sur tablette puis empilées sur mobile, icônes et liens centrés.

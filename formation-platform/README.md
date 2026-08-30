# FormationStudio

Plateforme de formation en ligne : vitrine publique, espace apprenant et
back-office de production réservé aux créateurs, pour structurer des
formations (modules, leçons texte/vidéo/quiz), générer des quiz avec Claude
et suivre la progression des apprenants.

## Stack

- **Next.js 16** (App Router, Server Actions, TypeScript)
- **PostgreSQL** + **Prisma 6** (ORM, migrations)
- **NextAuth v5** (Credentials, sessions JWT, rôles `ADMIN` / `CREATOR` / `LEARNER`)
- **Tailwind CSS 4**
- **@anthropic-ai/sdk** pour la génération de quiz assistée par Claude

## Structure

```
src/
  app/
    page.tsx                     # Vitrine publique
    catalogue/                   # Catalogue + fiche formation publique
    connexion/, inscription/     # Auth
    mon-apprentissage/           # Espace apprenant (progression, leçons, quiz)
    admin/                       # Back-office de production (réservé créateurs/admin)
  lib/
    auth.ts, authz.ts            # NextAuth + garde-fous d'accès
    admin-actions.ts             # CRUD formations/modules/leçons (Server Actions)
    quiz-actions.ts              # CRUD questions/choix de quiz
    quiz-generator.ts            # Génération de quiz via Claude (Anthropic API)
    formations.ts, progress-actions.ts
  proxy.ts                       # Protection des routes /admin et /mon-apprentissage
prisma/
  schema.prisma                  # Modèle de données
  seed.ts                        # Jeu de données de démo
```

## Démarrage

### 1. Base de données

Avec Docker :

```bash
docker compose up -d
```

Ou pointez `DATABASE_URL` vers un Postgres hébergé (Supabase, Neon, Railway...).

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Renseignez :
- `DATABASE_URL` — déjà correct pour le Postgres local du `docker-compose.yml`.
- `AUTH_SECRET` — générez-en un avec `openssl rand -base64 32`.
- `ANTHROPIC_API_KEY` — nécessaire uniquement pour la génération de quiz par
  Claude dans le back-office (`https://console.anthropic.com/`).

### 3. Installation et migrations

```bash
npm install
npm run db:migrate   # applique le schéma Prisma
npm run db:seed       # crée un compte créateur/admin, un apprenant, et une formation de démo
npm run dev
```

Comptes créés par le seed :
- **Créateur / Admin** : `createur@formation.local` / `Formation2026!`
- **Apprenant** : `apprenant@formation.local` / `Apprenant2026!`

L'espace de production est accessible sur `/admin` une fois connecté avec le
compte créateur.

## Fonctionnement

### Vitrine et catalogue

`/` et `/catalogue` n'affichent que les formations au statut `PUBLISHED`.
Chaque formation présente son programme (modules/leçons) et un bouton
d'inscription pour les utilisateurs connectés.

### Espace apprenant (`/mon-apprentissage`)

Liste les formations suivies avec une barre de progression (% de leçons
complétées). Chaque leçon texte ou vidéo se marque comme terminée d'un clic ;
chaque quiz est noté automatiquement et la leçon est validée si le score
dépasse le seuil de réussite configuré par le créateur.

### Back-office de production (`/admin`)

Réservé aux rôles `CREATOR` et `ADMIN` (double protection : `proxy.ts` pour
la redirection et vérification dans chaque Server Action). Permet de :
- créer/publier/dépublier une formation ;
- structurer modules et leçons (ajout, réordonnancement, suppression) ;
- éditer le contenu texte, l'URL vidéo, ou les questions d'un quiz ;
- **générer un brouillon de quiz avec Claude** à partir d'un texte source
  collé par le créateur, puis **relire et corriger** chaque question/réponse
  avant de l'enregistrer dans le quiz.

Un `ADMIN` voit toutes les formations ; un `CREATOR` ne voit et ne peut
modifier que les siennes.

## Déploiement

- **App** : Vercel (ou tout hébergeur Next.js) — connectez le dépôt GitHub,
  renseignez les variables d'environnement ci-dessus.
- **Base de données** : Supabase, Neon ou Railway pour un Postgres managé.
- Après le premier déploiement, exécutez les migrations en production :
  `npx prisma migrate deploy`.

## Pistes d'évolution

- Paiement / accès payant aux formations (Stripe).
- Upload direct de vidéos (S3, Mux) plutôt que des URLs externes.
- Certificats de complétion générés en PDF.
- Rôles supplémentaires (relecteur/correcteur avant publication).

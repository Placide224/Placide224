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

### Transcription musicale (`/admin/transcription`)

Fait écouter une mélodie (fichier importé ou enregistrement micro) et en
extrait une représentation exploitable : notes, tempo, tonalité — puis génère
le code prêt à coller dans [Strudel](https://strudel.cc) ou
[Sonic Pi](https://sonic-pi.net) pour la rejouer à l'identique.

Parcours en 3 étapes :
1. **Choisir un instrument** (`src/lib/music/instruments.ts`) — purement
   une préférence d'export (quel synthé Sonic Pi / son Strudel / clé de
   portée MusicXML utiliser), la détection elle-même ne change pas.
2. **Importer/enregistrer, puis découper l'audio** — après décodage, un
   champ début/fin (bornés à la durée réelle) permet de ne transcrire
   qu'un passage précis d'un fichier plus long, avant de lancer l'analyse.
3. **Résultat** — tempo, tonalité, notes/batterie détectées, code
   Strudel/Sonic Pi, exports. Le tempo détecté est modifiable sur place :
   la correction se répercute immédiatement sur tous les exports (et sur
   ce qui sera enregistré).

La détection des notes utilise [Basic Pitch](https://github.com/spotify/basic-pitch-ts)
(Spotify, Apache-2.0) : un vrai modèle de deep learning pour la transcription
polyphonique (il reconnaît les accords, pas seulement une mélodie note à
note), qui tourne **dans le navigateur** via TensorFlow.js
(`src/lib/music/ai-pitch.ts`). Les poids du modèle (~900 Ko) sont servis
depuis `public/basic-pitch-model/` et téléchargés par le navigateur au
premier usage. Tempo et tonalité restent estimés par du code maison
(`src/lib/music/tempo.ts`, `key.ts`) à partir des notes obtenues.

La batterie est détectée séparément (`src/lib/music/drums.ts`) : Basic Pitch
est fait pour des instruments à hauteur définie, pas des percussions, donc
un onset detector maison (flux spectral + FFT écrite à la main, aucune
dépendance) repère les attaques puis classe chacune en kick/snare/charleston
fermé/charleston ouvert à partir de sa forme spectrale (grave/aigu, décroît
vite ou sonne longtemps). C'est une heuristique de traitement du signal, pas
un modèle entraîné — elle peut confondre les types entre eux, et sur un
enregistrement purement mélodique (piano, voix...) elle peut aussi
interpréter l'attaque de certaines notes comme une percussion. À valider à
l'oreille sur de vrais enregistrements ; les seuils dans `drums.ts` sont le
point de départ pour ajuster si besoin.

Aucun fichier audio n'est envoyé au serveur — seul le résultat (JSON de
notes et de coups de batterie) est persisté quand le créateur clique sur
"Enregistrer". Ce choix évite d'avoir besoin d'un service Python séparé
pour l'inférence, ce qui reste compatible avec un déploiement Vercel
classique (voir `CLAUDE.md`, "modular monolith").

Formats exportés : audio de prévisualisation (WAV synthétisé à partir des
notes détectées, `src/lib/music/render-audio.ts`), MIDI, MusicXML, JSON,
code Strudel (mélodie + une couche par type de percussion, jouées ensemble
via plusieurs blocs `$:`), code Sonic Pi (`live_loop :melodie` +
`live_loop :batterie` en parallèle). Le MusicXML (`src/lib/music/musicxml.ts`,
mélodie uniquement) gère aussi les accords et les notes qui se chevauchent
sans partager le même départ (voix multiples avec `<backup>`), avec
liaisons (`<tie>`) quand une durée déborde d'une mesure.

Limites actuelles :
- fonctionne mieux sur un instrument/une source à la fois (les modèles sont
  polyvalents mais rien ne sépare les sources : chant + piano simultanés,
  ou mélodie + batterie d'un même mix, se retrouveront analysés ensemble
  plutôt qu'isolés) ;
- la détection de batterie est une heuristique DSP, pas un modèle entraîné
  (voir ci-dessus) — moins fiable que Basic Pitch pour les notes ;
- 5 minutes max par extrait ; au-delà l'analyse (qui tourne entièrement
  dans le navigateur) devient trop lente pour rester utilisable ;
- import direct depuis YouTube/Instagram/TikTok pas encore disponible : il
  faudrait un petit service dédié à l'extraction audio (yt-dlp + ffmpeg),
  que Vercel ne peut pas héberger tel quel.

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
- Transcription musicale : import YouTube/Instagram/TikTok (service
  d'extraction audio dédié), affichage de la partition dans l'appli (VexFlow
  ou équivalent — le MusicXML s'exporte déjà, mais ne s'affiche pas encore
  en ligne), séparation de sources (isoler la voix d'un accompagnement).

# Jouer un fichier MIDI dans Sonic Pi (LoopMIDI)

Ce guide répond à une question récurrente des utilisateurs de l'atelier de
transcription : *« comment j'entends ma transcription dans Sonic Pi ? »*.

## Option A — le plus simple : le code Sonic Pi est déjà généré

L'atelier de transcription (`transcription-studio.tsx`) affiche un bloc de
code Sonic Pi prêt à l'emploi (bouton **Copier**), généré directement depuis
les notes détectées (`lib/music/sonicpi.ts`). Aucune installation
supplémentaire n'est nécessaire :

1. Ouvrir la transcription dans l'atelier.
2. Cliquer sur **Copier** sous le bloc « Sonic Pi ».
3. Coller dans un buffer Sonic Pi, puis **Run** (Alt+R sur Windows/Linux,
   Cmd+R sur Mac).

C'est la méthode recommandée : le rendu est identique à la transcription
(mêmes notes, mêmes durées), sans dépendre d'un pilote MIDI externe.

## Option B — rejouer un fichier `.mid` externe en temps réel via LoopMIDI

Utile si vous avez un fichier `.mid` qui ne vient pas de l'atelier (ou pas
son JSON d'origine), et que vous voulez l'envoyer note par note à Sonic Pi
en direct, comme si vous jouiez sur un clavier MIDI.

### 1. Installer et configurer LoopMIDI (Windows)

1. Télécharger **loopMIDI** (Tobias Erichsen) :
   https://www.tobias-erichsen.de/software/loopmidi.html
2. Lancer loopMIDI, cliquer **+** en bas à gauche pour créer un port virtuel
   (nom par défaut `loopMIDI Port` — le laisser tel quel ou le renommer,
   p. ex. `SonicPiIn`).
3. Le port apparaît dans la liste et reste actif tant que loopMIDI tourne.

Sur Mac, l'équivalent gratuit est le bus IAC intégré : **Applications >
Utilitaires > Configuration audio et MIDI > Fenêtre MIDI > IAC Driver**,
cocher *Device is online* et ajouter un port (`Bus 1`).

### 2. Configurer Sonic Pi pour écouter ce port

1. Dans Sonic Pi : **Préférences (icône outils) > I/O**.
2. Repérer le port créé (`loopMIDI Port` ou `IAC Driver Bus 1`) dans la liste
   des entrées MIDI et l'activer/cocher.
3. Dans un buffer Sonic Pi, coller :

   ```ruby
   live_loop :midi_in do
     use_real_time
     note, velocity = sync "/midi:loopmidi_port:1/note_on"
     play note, amp: velocity / 127.0
   end
   ```

   Remplacer `loopmidi_port` par le nom réel du port tel qu'affiché par
   `midi_in_ports` (à taper puis exécuter dans un buffer pour voir la liste
   exacte des chemins OSC disponibles — le nom est normalisé en minuscules
   avec underscores).

4. **Run** ce buffer (Alt+R). Sonic Pi attend maintenant des événements
   MIDI entrants.

### 3. Envoyer le fichier `.mid` vers le port virtuel

Un lecteur MIDI classique ne "joue" un fichier que vers une sortie audio,
pas vers un port MIDI — il faut un lecteur qui envoie les événements MIDI
bruts vers loopMIDI :

- **Windows** : [MIDI Player X](https://synthfont.com/) ou tout lecteur
  proposant un choix explicite de "MIDI Output Device". Sélectionner le
  port loopMIDI comme sortie, puis lire le fichier `.mid`.
- **Mac** : SimpleSynth n'envoie pas de MIDI (c'est un récepteur) ; utiliser
  un lecteur comme **Logic**, **GarageBand** (piste externe) ou
  `sendmidi`/`aplaymidi`-like en ligne de commande pour router vers le bus
  IAC.

Une fois la lecture lancée, les notes arrivent en direct dans Sonic Pi via
le `live_loop :midi_in` et sont rejouées avec le synthé choisi.

### Limites de cette méthode

- Dépend du tempo/de la latence du lecteur MIDI tiers — moins fidèle que le
  code Sonic Pi généré directement (Option A).
- Windows/Mac uniquement (pas disponible tel quel en conteneur Linux/CI).
- Nécessite que Sonic Pi et le lecteur MIDI tournent en même temps, avec le
  bon port sélectionné des deux côtés.

Pour une reproduction exacte d'une transcription faite dans l'atelier,
préférer systématiquement l'Option A.

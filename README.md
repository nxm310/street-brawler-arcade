# Street Brawler Arcade

Jeu de combat 2D **16-bit Néo-Arcade** jouable directement dans le navigateur (Canvas 1280×720), avec musiques chiptune **8-bit** synthétisées via Web Audio API, sprites et décors pixel-art 16-bit, mode **Solo vs Bot IA tactique** et mode **2 Joueurs en local**.

---

## Écrans & Parcours Arcade

1. **Écran Titre (`menu`)** : visuel d’arcade 16-bit réunissant les 6 combattants, logo **STREET BRAWLER ARCADE**, `APPUIE SUR START`.
2. **Sélection des combattants (`CHOISIS TON COMBATTANT`)** : portraits, ville et région française d’origine, choix d’arène et passage direct en mode `1J vs BOT` ou `2J LOCAL`.
3. **Carte de France animée (`map`)** : itinéraire entre la ville du J1 et celle de son adversaire avec pointillés jaunes animés en direct.
4. **Écran `VS` (`vs`)** : face-à-face en grand format avant le début du combat.

---

## Combattants (6), Origines Françaises & Coups Spéciaux

| Combattant | Origine France | Rôle | Coup Spécial | Effet |
| --- | --- | --- | --- | --- |
| **GOLDOHRACK** | Château-Thierry (Picardie) | Le Mazinger | ⚡ Fulguro-Poing Rocket | Éclairs Cornofulgure + poing-fusée supersonique |
| **M3G4TRONCH3** | Laon (Picardie) | Le Robot | ⚡ Rayon Orbital Mégatron | Anneaux d’énergie + laser thoracique & frappe orbitale |
| **MADCHAT** | Reims (Pays du Champagne) | Le Warrior | ⚡ Épée Infernale & Furie Féline | Grand croissant d’épée en feu pixel-art + gerbe de braises |
| **DarkMada & Golden** | Paris (Île-de-France) | Motard & Golden Retriever | 💖 Bisous Golden & Jouet Pouic | Attaque toute gentille : pluie de cœurs, balle de tennis & os jouet |
| **LURCK** | Chartres (Eure-et-Loir) | Le Hibou Nocturne | ⚡ Éclipse & Griffes Nocturnes | Pluie de croissants dorés lunaires + serres spectrales |
| **KOLL** | Toulouse (Occitanie) | Homme Électrique Nucléaire | ⚡ Supernova Tesla-Atomique | Halo radioactif vert + arcs électriques Tesla bleus |

---

## Arènes / Environnements (6)

- **Call of Duty** — *Warzone Tactique* : ruines urbaines au crépuscule, hélicoptère avec projecteur et caisses militaires.
- **Star Citizen** — *Hangar Orbital 2954* : baie vitrée spatiale sur nébuleuse, vaisseaux en approche et néons cyan.
- **Classe Techno** — *Salle du Prof de Technologie* : tableau `U = R × I`, établis, imprimante 3D en action et oscilloscope.
- **Viking WoW** — *Fjord d’Azeroth* : aurore boréale, drakkar viking, torches et menhirs à runes bleues.
- **Motos Motard** — *Garage & Route 66* : enseigne néon Moto Club 66, choppers chromés et bidons enflammés.
- **Centrale Nucléaire** — *Zone Post-Apocalyptique* : tours de refroidissement en ruine, bassins fluorescents verts et fûts toxiques.

---

## Modes de jeu, Jauge Spéciale & Contrôles

- **Jauge Spéciale & Barre de Vie** : la barre `⚡ RECHARGE SPÉCIALE` est affichée **au-dessus** de la barre de vie (`VIE`). Elle démarre à `0%` et se recharge progressivement à chaque coup porté jusqu’à `100%` pour libérer un nouveau Coup Spécial.
- **Mode Solo (`1J vs BOT`)** : combat contre une IA tactique à 3 niveaux (`Facile`, `Normal`, `Difficile`) gérant l’espacement, l’observation, la garde et les ripostes.
- **Mode 2 Joueurs (`2J LOCAL`)** : deux joueurs sur le même clavier, avec changement d’arène en direct pendant la partie.

### Clavier

| Action | Joueur 1 | Joueur 2 (Mode 2J Local) |
| --- | --- | --- |
| Déplacer | `Q` / `A` et `D` (ou `←`/`→` en Solo) | `←` et `→` |
| **Sauter** | `Espace` (ou `Z`/`W`) | `↑` |
| Garde | `S` | `↓` |
| **Frapper (léger / lourd)** | `F` / `G` | `K` / `L` |
| **Coup Spécial** | `Entrée` | `Maj Droite`, `O` ou `Entrée Num.` |

---

## Lancement local

Servez simplement la racine du projet avec un serveur HTTP statique (requis pour les modules ES) :

```bash
python3 -m http.server 8124
```

Puis ouvrez `http://localhost:8124` dans votre navigateur.

---

## Déploiement Docker / OrbStack

Un `Dockerfile` (`nginx:alpine` sur le port `80`), un `docker-compose.yml` (port `8089:80`, labels Homepage) et un script `deploy_remote.sh` sont inclus :

```bash
docker compose up -d --build
```

Ou pour synchroniser et déployer sur le serveur distant OrbStack (`mac-m1`) avec icône Homepage :

```bash
./deploy_remote.sh
```

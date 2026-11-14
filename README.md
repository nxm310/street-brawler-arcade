# Street Brawler Arcade

Jeu de combat 2D **16-bit Néo-Arcade** jouable directement dans le navigateur (Canvas 1280×720), avec audio synthétisé Web Audio API, sprites et décors pixel-art CPS2, mode **Solo vs Bot IA tactique** et mode **2 Joueurs en local**.

---

## Combattants (6) & Coups Spéciaux

| Combattant | Rôle | Coup Spécial | Effet |
| --- | --- | --- | --- |
| **M3G4TRONCH3** | Le Robot | ⚡ Rayon Orbital Mégatron | Laser thoracique haute énergie + frappe orbitale verticale |
| **MADCHAT** | Le Warrior | ⚡ Furie Féline | Ruée berserker + tourbillon géant de griffes et d’épée |
| **DarkMada & Golden** | Motard & Golden Retriever Blond | ⚡ Rush Golden & Burnout | Vague de flammes d’échappement + charge du Golden Retriever blond |
| **GOLDOHRACK** | Le Mazinger | ⚡ Fulguro-Poing Rocket | Éclairs Cornofulgure + poing-fusée supersonique traversant l’arène |
| **KOLL** | Homme Électrique Nucléaire | ⚡ Supernova Tesla-Atomique | Onde de choc radioactive verte + arcs électriques Tesla bleus |
| **LURCK** | Le Hibou qui voit la nuit | ⚡ Éclipse Nocturne | Obscurité totale, yeux dorés géants + pluie de serres spectrales |

---

## Arènes / Environnements (5)

- **Call of Duty** — *Warzone Tactique* : ruines urbaines au crépuscule, hélicoptère avec projecteur et caisses militaires.
- **Star Citizen** — *Hangar Orbital 2954* : baie vitrée spatiale sur nébuleuse, vaisseaux en approche et néons cyan.
- **Classe Techno** — *Salle du Prof de Technologie* : tableau `U = R × I`, établis, imprimante 3D en action et oscilloscope.
- **Viking WoW** — *Fjord d’Azeroth* : aurore boréale, drakkar viking, torches et menhirs à runes bleues.
- **Motos Motard** — *Garage & Route 66* : enseigne néon Moto Club 66, choppers chromés et bidons enflammés.

---

## Modes de jeu & Contrôles

- **Mode Solo (`1J vs BOT`)** : combat contre une IA tactique à 3 niveaux de difficulté (`Facile`, `Normal`, `Difficile`) gérant l’espacement, l’observation, la garde et les fenêtres de riposte.
- **Mode 2 Joueurs (`2J LOCAL`)** : deux joueurs sur le même clavier, avec changement d’arène en direct possible pendant la partie.

### Clavier

| Action | Joueur 1 (AZERTY / QWERTY) | Joueur 2 (Mode 2J Local) |
| --- | --- | --- |
| Déplacer | `Q` / `A` et `D` | `←` et `→` |
| Sauter | `Z` / `W` | `↑` |
| Garde | `S` | `↓` |
| Coup léger | `F` | `K` |
| Coup lourd | `G` | `L` |
| **Coup Spécial** | `R` ou `Espace` | `O` ou `Entrée` |

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

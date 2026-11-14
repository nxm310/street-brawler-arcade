export const FIGHTER_ORDER = ['goldohrack', 'm3g4', 'madchat', 'darkmada', 'lurck', 'koll'];

export const FIGHTERS = {
  goldohrack: {
    id: 'goldohrack',
    name: 'GOLDOHRACK',
    subtitle: 'Le Mazinger',
    city: 'CHÂTEAU-THIERRY',
    region: 'Picardie · Région Château-Thierry',
    landmark: 'Donjon & Centrale Nucléaire',
    shortDesc: 'Blindé, puissant, cornes dorées légendaires de Picardie',
    mapPos: { x: 690, y: 243 },
    labelOffset: { dx: 16, dy: 24, align: 'left' },
    color: '#ef4444',
    accent: '#fbbf24',
    speed: 5.6,
    jumpForce: -16.2,
    lightDmg: 9,
    heavyDmg: 17,
    kickDmg: 14,
    sweepDmg: 16,
    specialDmg: 34,
    specialName: 'Fulguro-Poing Missile',
    specialDesc: 'L’avant-bras se détache et file comme une fusée-missile à travers toute l’arène !',
    moves: [
      'POING (F) / PIED (G) : Uppercut blindé ou High Kick',
      'BALAYETTE (S + G) · PARADE (C) · SAUT (ESPACE)',
      'SPÉCIAL (ENTRÉE) : Fulguro-Poing Missile (Bras-Fusée)'
    ],
    stats: { power: 5, speed: 3, range: 5 }
  },
  m3g4: {
    id: 'm3g4',
    name: 'M3G4TRONCH3',
    subtitle: 'Le Robot',
    city: 'LAON',
    region: 'Picardie · Région Laon',
    landmark: 'Citadelle Cyber-Radar',
    shortDesc: 'Colosse cybernétique de Laon équipé d’un canon à plasma orbital',
    mapPos: { x: 707, y: 153 },
    labelOffset: { dx: 0, dy: -22, align: 'center' },
    color: '#38bdf8',
    accent: '#e2e8f0',
    speed: 6.0,
    jumpForce: -16.8,
    lightDmg: 8,
    heavyDmg: 15,
    kickDmg: 12,
    sweepDmg: 14,
    specialDmg: 30,
    specialName: 'Rayon Orbital Mégatron',
    specialDesc: 'Anneaux de charge cyber + maxi-rayon plasma haute énergie',
    moves: [
      'POING (F) / PIED (G) : Canon laser ou Kick blindé',
      'BALAYETTE (S + G) · PARADE (C) · SAUT (ESPACE)',
      'SPÉCIAL (ENTRÉE) : Rayon Orbital Mégatron'
    ],
    stats: { power: 4, speed: 3, range: 5 }
  },
  madchat: {
    id: 'madchat',
    name: 'MADCHAT',
    subtitle: 'Le Warrior',
    city: 'REIMS',
    region: 'Pays du Champagne · Reims',
    landmark: 'Vignes du Champagne',
    shortDesc: 'Félin berserker de Reims armé d’une grande épée enflammée',
    mapPos: { x: 787, y: 203 },
    labelOffset: { dx: 18, dy: -6, align: 'left' },
    color: '#f97316',
    accent: '#ef4444',
    speed: 7.2,
    jumpForce: -17.5,
    lightDmg: 8,
    heavyDmg: 15,
    kickDmg: 13,
    sweepDmg: 15,
    specialDmg: 32,
    specialName: 'Furie Féline',
    specialDesc: 'Ruée berserker + grand croissant d’épée en feu',
    moves: [
      'POING (F) / PIED (G) : Taille d’épée vive ou Kick agile',
      'BALAYETTE (S + G) · PARADE (C) · SAUT (ESPACE)',
      'SPÉCIAL (ENTRÉE) : Furie Féline — Lame Enflammée'
    ],
    stats: { power: 4, speed: 5, range: 4 }
  },
  darkmada: {
    id: 'darkmada',
    name: 'DarkMada',
    hudName: 'DARKMADA & SUSHI',
    subtitle: 'Motard & Son Chien Sushi',
    city: 'PARIS',
    region: 'Île-de-France · Paris',
    landmark: 'Tour Eiffel & Route 66',
    shortDesc: 'Le motard parisien et son adorable Golden Retriever Sushi très gentil',
    mapPos: { x: 600, y: 207 },
    labelOffset: { dx: -16, dy: -18, align: 'right' },
    color: '#facc15',
    accent: '#f472b6',
    speed: 6.8,
    jumpForce: -17.0,
    lightDmg: 8,
    heavyDmg: 14,
    kickDmg: 12,
    sweepDmg: 14,
    specialDmg: 30,
    specialName: 'Sushi Solo : Bisous & Peluche',
    specialDesc: 'Sushi fonce tout seul attaquer l’ennemi en mêlant Bisous ❤️ et lancer de Peluches !',
    moves: [
      'POING (F) / PIED (G) : Poing flambé ou Kick motard',
      'BALAYETTE (S + G) · PARADE (C) · SAUT (ESPACE)',
      'SPÉCIAL (ENTRÉE) : Sushi Solo (Bisous & Peluche !)'
    ],
    stats: { power: 4, speed: 4, range: 4 }
  },
  lurck: {
    id: 'lurck',
    name: 'LURCK',
    subtitle: 'Le Hibou qui voit la nuit',
    city: 'CHARTRES',
    region: 'Eure-et-Loir · Chartres',
    landmark: 'Cathédrale & Lune Hibou',
    shortDesc: 'Gardien nocturne de Chartres aux serres dorées fendant la nuit',
    mapPos: { x: 493, y: 253 },
    labelOffset: { dx: -16, dy: 22, align: 'right' },
    color: '#eab308',
    accent: '#818cf8',
    speed: 7.4,
    jumpForce: -18.2,
    lightDmg: 8,
    heavyDmg: 14,
    kickDmg: 12,
    sweepDmg: 14,
    specialDmg: 31,
    specialName: 'Éclipse Nocturne',
    specialDesc: 'Obscurité complète + triple croissant de serres dorées lumineuses',
    moves: [
      'POING (F) / PIED (G) : Serres rapides ou Coup de patte',
      'BALAYETTE (S + G) · PARADE (C) · SAUT (ESPACE)',
      'SPÉCIAL (ENTRÉE) : Éclipse Nocturne — Serres Dorées'
    ],
    stats: { power: 4, speed: 5, range: 4 }
  },
  koll: {
    id: 'koll',
    name: 'KOLL',
    subtitle: 'Homme Électrique Nucléaire',
    city: 'TOULOUSE',
    region: 'Occitanie · Toulouse',
    landmark: 'Capitole Rose & Bobine Tesla',
    shortDesc: 'Combattant atomique de Toulouse — se déguise en lapin pour attirer les méchants !',
    mapPos: { x: 587, y: 507 },
    labelOffset: { dx: 18, dy: 8, align: 'left' },
    color: '#22c55e',
    accent: '#38bdf8',
    speed: 6.5,
    jumpForce: -17.2,
    lightDmg: 8,
    heavyDmg: 15,
    kickDmg: 13,
    sweepDmg: 15,
    specialDmg: 32,
    specialName: 'Lapin-Aimant Tesla (Attraction)',
    specialDesc: 'Koll met ses oreilles de lapin pendant le super-pouvoir pour attirer les méchants puis foudroyer !',
    moves: [
      'POING (F) / PIED (G) : Poing électrique ou Kick magnétique',
      'BALAYETTE (S + G) · PARADE (C) · SAUT (ESPACE)',
      'SPÉCIAL (ENTRÉE) : Déguisement Lapin-Aimant & Foudre'
    ],
    stats: { power: 5, speed: 4, range: 4 }
  }
};

export const ARENA_ORDER = ['cod', 'starcitizen', 'techno', 'viking', 'biker', 'nuclear'];

export const ARENAS = {
  cod: {
    id: 'cod',
    name: 'Call of Duty',
    subtitle: 'Warzone Tactique',
    badge: 'WARZONE',
    color: '#ea580c',
    desc: 'Ruines urbaines au crépuscule, hélicoptère avec projecteur et caisses militaires'
  },
  starcitizen: {
    id: 'starcitizen',
    name: 'Star Citizen',
    subtitle: 'Hangar Orbital 2954',
    badge: 'SCI-FI',
    color: '#06b6d4',
    desc: 'Baie vitrée spatiale sur nébuleuse, vaisseaux en approche et néons cyan'
  },
  techno: {
    id: 'techno',
    name: 'Classe Techno',
    subtitle: 'Salle du Prof de Technologie',
    badge: 'TECHNO LAB',
    color: '#22c55e',
    desc: 'Tableau U = R × I, établis, imprimante 3D en action et oscilloscope'
  },
  viking: {
    id: 'viking',
    name: 'Viking WoW',
    subtitle: 'Fjord d’Azeroth',
    badge: 'VIKING',
    color: '#38bdf8',
    desc: 'Aurore boréale, drakkar viking, torches et menhirs à runes bleues'
  },
  biker: {
    id: 'biker',
    name: 'Motos Motard',
    subtitle: 'Garage & Route 66',
    badge: 'ROUTE 66',
    color: '#f43f5e',
    desc: 'Enseigne néon Moto Club 66, choppers chromés et bidons enflammés'
  },
  nuclear: {
    id: 'nuclear',
    name: 'Centrale Nucléaire',
    subtitle: 'Zone Post-Apocalyptique',
    badge: 'NUCLÉAIRE',
    color: '#4ade80',
    desc: 'Tours de refroidissement en ruines, bassin radioactif vert et ciel post-apocalyptique'
  }
};

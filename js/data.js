export const FIGHTER_ORDER = ['goldohrack', 'm3g4', 'madchat', 'darkmada', 'lurck', 'koll'];

export const FIGHTERS = {
  goldohrack: {
    id: 'goldohrack',
    name: 'GOLDOHRACK',
    subtitle: 'Le Mazinger',
    city: 'CHÂTEAU-THIERRY',
    region: 'Picardie · Région Château-Thierry',
    shortDesc: 'Blindé, puissant, cornes dorées légendaires de Picardie',
    mapPos: { x: 677, y: 223 },
    labelOffset: { dx: 16, dy: 20, align: 'left' },
    color: '#ef4444',
    accent: '#fbbf24',
    speed: 5.6,
    jumpForce: -16.2,
    lightDmg: 9,
    heavyDmg: 17,
    specialDmg: 34,
    specialName: 'Fulguro-Poing Rocket',
    specialDesc: 'Éclairs Cornofulgure + poing-fusée supersonique traversant l’arène',
    moves: [
      'FRAPPE (F) : Coup de poing blindé / Combo lourd (G)',
      'SAUT (ESPACE) : Impact aérien sismique',
      'SPÉCIAL (ENTRÉE) : Fulguro-Poing Rocket & Cornofulgure'
    ],
    stats: { power: 5, speed: 3, range: 5 }
  },
  m3g4: {
    id: 'm3g4',
    name: 'M3G4TRONCH3',
    subtitle: 'Le Robot',
    city: 'LAON',
    region: 'Picardie · Région Laon',
    shortDesc: 'Colosse cybernétique de Laon équipé d’un canon à plasma orbital',
    mapPos: { x: 683, y: 197 },
    labelOffset: { dx: 0, dy: -18, align: 'center' },
    color: '#38bdf8',
    accent: '#e2e8f0',
    speed: 6.0,
    jumpForce: -16.8,
    lightDmg: 8,
    heavyDmg: 15,
    specialDmg: 30,
    specialName: 'Rayon Orbital Mégatron',
    specialDesc: 'Anneaux de charge cyber + maxi-rayon plasma haute énergie',
    moves: [
      'FRAPPE (F) : Canon laser rapproché / Charge lourde (G)',
      'SAUT (ESPACE) : Propulseurs cybernétiques',
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
    shortDesc: 'Félin berserker de Reims armé d’une grande épée enflammée',
    mapPos: { x: 697, y: 213 },
    labelOffset: { dx: 18, dy: -2, align: 'left' },
    color: '#f97316',
    accent: '#ef4444',
    speed: 7.2,
    jumpForce: -17.5,
    lightDmg: 8,
    heavyDmg: 15,
    specialDmg: 32,
    specialName: 'Furie Féline',
    specialDesc: 'Ruée berserker + grand croissant d’épée en feu',
    moves: [
      'FRAPPE (F) : Taille d’épée vive / Estoc berserker (G)',
      'SAUT (ESPACE) : Bond félin acrobatique',
      'SPÉCIAL (ENTRÉE) : Furie Féline — Lame Enflammée'
    ],
    stats: { power: 4, speed: 5, range: 4 }
  },
  darkmada: {
    id: 'darkmada',
    name: 'DarkMada',
    hudName: 'DARKMADA & GOLDEN',
    subtitle: 'Motard & Golden Retriever Blond',
    city: 'PARIS',
    region: 'Île-de-France · Paris',
    shortDesc: 'Le motard parisien et son adorable Golden Retriever très gentil',
    mapPos: { x: 637, y: 233 },
    labelOffset: { dx: -16, dy: -10, align: 'right' },
    color: '#facc15',
    accent: '#f472b6',
    speed: 6.8,
    jumpForce: -17.0,
    lightDmg: 8,
    heavyDmg: 14,
    specialDmg: 30,
    specialName: 'Bisous Golden & Jouet Pouic',
    specialDesc: 'Attaque toute douce : pluie de cœurs ❤️, os jouet et balle Pouic du Golden !',
    moves: [
      'FRAPPE (F) : Poing flambé / Uppercut turbo (G)',
      'SAUT (ESPACE) : Saut du motard',
      'SPÉCIAL (ENTRÉE) : Bisous Golden & Jouet Pouic (Tout gentil !)'
    ],
    stats: { power: 4, speed: 4, range: 4 }
  },
  lurck: {
    id: 'lurck',
    name: 'LURCK',
    subtitle: 'Le Hibou qui voit la nuit',
    city: 'CHARTRES',
    region: 'Eure-et-Loir · Chartres',
    shortDesc: 'Gardien nocturne de Chartres aux serres dorées fendant la nuit',
    mapPos: { x: 607, y: 257 },
    labelOffset: { dx: -16, dy: 18, align: 'right' },
    color: '#eab308',
    accent: '#818cf8',
    speed: 7.4,
    jumpForce: -18.2,
    lightDmg: 8,
    heavyDmg: 14,
    specialDmg: 31,
    specialName: 'Éclipse Nocturne',
    specialDesc: 'Obscurité complète + triple croissant de serres dorées lumineuses',
    moves: [
      'FRAPPE (F) : Serres rapides / Coup d’aile nocturne (G)',
      'SAUT (ESPACE) : Envol silencieux du hibou',
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
    shortDesc: 'Combattant atomique de Toulouse chargé à la foudre radioactive',
    mapPos: { x: 607, y: 507 },
    labelOffset: { dx: 16, dy: 4, align: 'left' },
    color: '#22c55e',
    accent: '#38bdf8',
    speed: 6.5,
    jumpForce: -17.2,
    lightDmg: 8,
    heavyDmg: 15,
    specialDmg: 32,
    specialName: 'Supernova Tesla-Atomique',
    specialDesc: 'Déflagration plasma verte + arcs électriques Tesla bleus',
    moves: [
      'FRAPPE (F) : Poing électrique / Décharge atomique (G)',
      'SAUT (ESPACE) : Propulsion magnétique',
      'SPÉCIAL (ENTRÉE) : Supernova Tesla-Atomique'
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

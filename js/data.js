export const FIGHTER_ORDER = ['m3g4', 'madchat', 'darkmada', 'goldohrack', 'koll', 'lurck'];

export const FIGHTERS = {
  m3g4: {
    id: 'm3g4',
    name: 'M3G4TRONCH3',
    subtitle: 'Le Robot',
    color: '#38bdf8',
    accent: '#e2e8f0',
    speed: 6.0,
    jumpForce: -16.8,
    lightDmg: 7,
    heavyDmg: 14,
    specialDmg: 30,
    specialName: 'Rayon Orbital Mégatron',
    specialDesc: 'Laser thoracique haute énergie + frappe orbitale verticale',
    stats: { power: 4, speed: 3, range: 5 }
  },
  madchat: {
    id: 'madchat',
    name: 'MADCHAT',
    subtitle: 'Le Warrior',
    color: '#f97316',
    accent: '#ef4444',
    speed: 7.2,
    jumpForce: -17.5,
    lightDmg: 8,
    heavyDmg: 15,
    specialDmg: 32,
    specialName: 'Furie Féline',
    specialDesc: 'Ruée berserker + tourbillon géant de griffes et d’épée',
    stats: { power: 4, speed: 5, range: 3 }
  },
  darkmada: {
    id: 'darkmada',
    name: 'DarkMada',
    hudName: 'DARKMADA & GOLDEN',
    subtitle: 'Motard & Golden Retriever Blond',
    color: '#facc15',
    accent: '#f59e0b',
    speed: 6.8,
    jumpForce: -17.0,
    lightDmg: 7,
    heavyDmg: 14,
    specialDmg: 31,
    specialName: 'Rush Golden & Burnout',
    specialDesc: 'Vague de flammes d’échappement + charge du Golden Retriever blond',
    stats: { power: 4, speed: 4, range: 4 }
  },
  goldohrack: {
    id: 'goldohrack',
    name: 'GOLDOHRACK',
    subtitle: 'Le Mazinger',
    color: '#ef4444',
    accent: '#fbbf24',
    speed: 5.6,
    jumpForce: -16.2,
    lightDmg: 9,
    heavyDmg: 17,
    specialDmg: 34,
    specialName: 'Fulguro-Poing Rocket',
    specialDesc: 'Éclairs Cornofulgure + poing-fusée supersonique traversant l’arène',
    stats: { power: 5, speed: 3, range: 5 }
  },
  koll: {
    id: 'koll',
    name: 'KOLL',
    subtitle: 'Homme Électrique Nucléaire',
    color: '#22c55e',
    accent: '#38bdf8',
    speed: 6.5,
    jumpForce: -17.2,
    lightDmg: 8,
    heavyDmg: 15,
    specialDmg: 32,
    specialName: 'Supernova Tesla-Atomique',
    specialDesc: 'Onde de choc radioactive verte + arcs électriques Tesla bleus',
    stats: { power: 5, speed: 4, range: 4 }
  },
  lurck: {
    id: 'lurck',
    name: 'LURCK',
    subtitle: 'Le Hibou qui voit la nuit',
    color: '#eab308',
    accent: '#818cf8',
    speed: 7.4,
    jumpForce: -18.2,
    lightDmg: 7,
    heavyDmg: 14,
    specialDmg: 31,
    specialName: 'Éclipse Nocturne',
    specialDesc: 'Obscurité totale, yeux dorés géants + pluie de serres spectrales',
    stats: { power: 4, speed: 5, range: 4 }
  }
};

export const ARENA_ORDER = ['cod', 'starcitizen', 'techno', 'viking', 'biker'];

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
  }
};

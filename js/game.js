import { FIGHTER_ORDER, FIGHTERS, ARENA_ORDER, ARENAS } from './data.js';
import { SoundEngine } from './audio.js';
import { TouchController } from './touch.js';
import {
  STAGE_W,
  STAGE_H,
  FLOOR_Y,
  getSelectLayout,
  drawArena,
  drawFighter,
  drawSpecialFX,
  drawEffects,
  drawHUD,
  drawTitleScreen,
  drawSelectScreen,
  drawFranceMapScreen,
  drawVsScreen,
  drawAttractOverlay
} from './renderer.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sound = new SoundEngine();

// Éléments DOM
const stageContainer = document.getElementById('stageContainer');
const matchOverOverlay = document.getElementById('matchOverOverlay');

const modeBotHeaderBtn = document.getElementById('modeBotHeaderBtn');
const modeLocalHeaderBtn = document.getElementById('modeLocalHeaderBtn');
const botDiffSelect = document.getElementById('botDiffSelect');
const openSelectHeaderBtn = document.getElementById('openSelectHeaderBtn');
const attractToggleBtn = document.getElementById('attractToggleBtn');
const touchToggleBtn = document.getElementById('touchToggleBtn');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const exitPseudoFullscreenBtn = document.getElementById('exitPseudoFullscreenBtn');

const touchControlsLayer = document.getElementById('touchControlsLayer');
const touchLeftZone = document.getElementById('touchLeftZone');
const touchStickBase = document.getElementById('touchStickBase');
const touchStickKnob = document.getElementById('touchStickKnob');
const touchRightZone = document.getElementById('touchRightZone');
const touchBtnSpecial = document.getElementById('touchBtnSpecial');

const matchWinnerTitle = document.getElementById('matchWinnerTitle');
const matchWinnerSubtitle = document.getElementById('matchWinnerSubtitle');
const rematchBtn = document.getElementById('rematchBtn');
const changeSetupBtn = document.getElementById('changeSetupBtn');
const matchToMenuBtn = document.getElementById('matchToMenuBtn');

const quickArenaBar = document.getElementById('quickArenaBar');
const triggerSpecialP1Btn = document.getElementById('triggerSpecialP1Btn');
const triggerSpecialP2Btn = document.getElementById('triggerSpecialP2Btn');
const refillSuperBtn = document.getElementById('refillSuperBtn');
const controlsP2Text = document.getElementById('controlsP2Text');

// Vitesse du jeu réduite de 30% (0.70x) et normalisée à 60 FPS (même sur écran 120Hz)
const GAME_SPEED = 0.70;
const GRAVITY_SCALE = GAME_SPEED * GAME_SPEED;
const sDur = frames => Math.max(1, Math.round(frames / GAME_SPEED));

// État global du jeu
const game = {
  screen: 'menu', // 'menu' | 'select' | 'map' | 'vs' | 'intro' | 'fight' | 'roundOver' | 'matchOver'
  mode: 'bot', // 'bot' | 'local'
  botDiff: 'normal', // 'easy' | 'normal' | 'hard'
  isAttract: false,
  idleFrames: 0,
  arena: 'cod',
  p1Choice: 'goldohrack',
  p2Choice: 'darkmada',
  selectTarget: 1,
  roundNumber: 1,
  timer: 99,
  announcement: '',
  announcementTimer: 0,
  phaseTimer: 0,
  phaseDuration: 0,
  tick: 0,
  animTick: 0,
  shake: 0,
  specialFx: null,
  particles: [],
  floatingTexts: [],
  fighters: []
};

const keys = new Set();

const touchCtrl = new TouchController({
  stageContainer,
  layerEl: touchControlsLayer,
  leftZoneEl: touchLeftZone,
  stickBaseEl: touchStickBase,
  stickKnobEl: touchStickKnob,
  rightZoneEl: touchRightZone,
  specialBtnEl: touchBtnSpecial,
  onAction: action => {
    game.idleFrames = 0;
    triggerAttack(0, action);
  },
  onUnlockAudio: () => sound.unlock()
});

function createFighter(id, x, facing) {
  const def = FIGHTERS[id];
  return {
    id,
    x,
    y: FLOOR_Y,
    vx: 0,
    vy: 0,
    facing,
    hp: 100,
    trailHp: 100,
    superMeter: 0, // Démarre à 0% et se recharge avec les coups portés !
    rounds: 0,
    state: 'idle', // 'idle' | 'walk' | 'jump' | 'crouch' | 'crouch_punch' | 'block' | 'parry' | 'light' | 'heavy' | 'kick' | 'sweep' | 'headbutt' | 'shoryuken' | 'spinkick' | 'jump_punch' | 'jump_kick' | 'special' | 'hit' | 'down' | 'ko'
    stateTimer: 0,
    stateDuration: 1,
    parryWindow: 0,
    parryCooldown: 0,
    crouchGuard: false,
    lastAttackType: '',
    repeatCount: 0,
    secondHitApplied: false,
    attackDidHit: false,
    comboCount: 0,
    comboTimer: 0,
    botTactic: 'observe',
    botTacticTimer: sDur(45),
    botAttackCooldown: sDur(55),
    botSpecialCooldown: sDur(210),
    botMoveDir: 0,
    def
  };
}

function resetRoundFighters(keepRounds) {
  const r1 = keepRounds && game.fighters[0] ? game.fighters[0].rounds : 0;
  const r2 = keepRounds && game.fighters[1] ? game.fighters[1].rounds : 0;
  const s1 = keepRounds && game.fighters[0] ? game.fighters[0].superMeter : 0;
  const s2 = keepRounds && game.fighters[1] ? game.fighters[1].superMeter : 0;

  game.fighters = [
    createFighter(game.p1Choice, 310, 1),
    createFighter(game.p2Choice, STAGE_W - 310, -1)
  ];
  game.fighters[0].rounds = r1;
  game.fighters[1].rounds = r2;
  game.fighters[0].superMeter = s1;
  game.fighters[1].superMeter = s2;
  game.specialFx = null;
  game.particles = [];
  game.floatingTexts = [];
  game.timer = 99;
}

resetRoundFighters(false);

function setScreen(nextScreen) {
  game.screen = nextScreen;
  matchOverOverlay.hidden = nextScreen !== 'matchOver';

  if (nextScreen === 'menu') {
    sound.setMusicMode('title');
  } else if (nextScreen === 'select') {
    sound.setMusicMode('select');
  } else if (nextScreen === 'map' || nextScreen === 'vs') {
    sound.setMusicMode(game.isAttract ? 'attract' : 'none');
  } else if (nextScreen === 'intro' || nextScreen === 'fight') {
    sound.setMusicMode(game.isAttract ? 'attract' : 'fight');
  } else if (nextScreen === 'matchOver') {
    sound.setMusicMode('victory');
  }

  updateHeaderAndBars();
}

function startAttractCycle() {
  game.isAttract = true;
  game.idleFrames = 0;
  game.specialFx = null;
  const f1 = FIGHTER_ORDER[Math.floor(Math.random() * FIGHTER_ORDER.length)];
  const others = FIGHTER_ORDER.filter(id => id !== f1);
  const f2 = others[Math.floor(Math.random() * others.length)];
  game.p1Choice = f1;
  game.p2Choice = f2;
  game.arena = ARENA_ORDER[Math.floor(Math.random() * ARENA_ORDER.length)];
  game.roundNumber = 1;
  resetRoundFighters(false);
  game.fighters[0].superMeter = 65;
  game.fighters[1].superMeter = 65;
  game.phaseDuration = sDur(140);
  game.phaseTimer = game.phaseDuration;
  setScreen('map');
}

function stopAttractToMenu() {
  game.isAttract = false;
  game.idleFrames = 0;
  game.specialFx = null;
  setScreen('menu');
}

function startTourAndFight() {
  game.isAttract = false;
  game.idleFrames = 0;
  if (document.activeElement instanceof HTMLElement && document.activeElement !== canvas) {
    document.activeElement.blur();
  }
  sound.unlock();
  sound.playConfirm();
  game.roundNumber = 1;
  resetRoundFighters(false);

  // Lance d'abord la Carte de France animée (pointillés d'une ville à l'autre)
  game.phaseDuration = sDur(155);
  game.phaseTimer = game.phaseDuration;
  setScreen('map');
}

function enterVsScreen() {
  game.phaseDuration = sDur(110);
  game.phaseTimer = game.phaseDuration;
  setScreen('vs');
  sound.playVsFanfare();
}

function enterIntroRound() {
  sound.playRoundStart();
  setScreen('intro');
  game.announcement = `ROUND ${game.roundNumber}`;
  game.announcementTimer = sDur(75);
  game.phaseDuration = sDur(90);
  game.phaseTimer = game.phaseDuration;
}

function startNextRound() {
  game.roundNumber++;
  resetRoundFighters(true);
  enterIntroRound();
}

function spawnParticles(x, y, color, count, speed = 7) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = (0.35 + Math.random()) * speed * GAME_SPEED;
    const life = sDur(24 + Math.random() * 24);
    game.particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 2 * GAME_SPEED,
      life,
      maxLife: sDur(48),
      color,
      size: 4 + Math.random() * 6
    });
  }
}

function addFloatingText(x, y, text, color = '#fde047', size = 24) {
  const life = sDur(44);
  game.floatingTexts.push({
    x,
    y,
    vy: -1.4 * GAME_SPEED,
    text,
    color,
    size,
    life,
    maxLife: life
  });
}

function updateHeaderAndBars() {
  modeBotHeaderBtn.classList.toggle('is-active', game.mode === 'bot' && !game.isAttract);
  modeLocalHeaderBtn.classList.toggle('is-active', game.mode === 'local' && !game.isAttract);
  if (attractToggleBtn) {
    attractToggleBtn.classList.toggle('is-active', game.isAttract);
    attractToggleBtn.textContent = game.isAttract ? '⏹ Quitter Veille' : '🎬 Mode Veille';
  }
  if (touchToggleBtn) {
    touchToggleBtn.textContent = touchCtrl.getModeLabel();
    touchToggleBtn.classList.toggle('is-active', touchCtrl.isEnabled());
  }
  botDiffSelect.disabled = game.mode !== 'bot';
  controlsP2Text.textContent =
    game.isAttract
      ? 'MODE VEILLE : Simulation automatique IA vs IA (appuyez sur une touche pour jouer)'
      : game.mode === 'bot'
        ? 'BOT IA : contrôle automatique (difficulté réglable en haut)'
        : 'J2 Local : ←/→ bouger · ↑ sauter · ↓ baisser · K poing · I uppercut · L pied (↓+L balayette) · P spin · U boule · M parade · O spécial';

  const inFight = game.screen === 'fight';
  triggerSpecialP1Btn.disabled = !inFight || game.isAttract;
  triggerSpecialP2Btn.disabled = !inFight || game.mode === 'bot' || game.isAttract;
  refillSuperBtn.disabled = !(game.screen === 'fight' || game.screen === 'intro') || game.isAttract;

  const arenaButtons = quickArenaBar.querySelectorAll('button[data-arena]');
  arenaButtons.forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.arena === game.arena);
  });
}

function buildQuickArenaBar() {
  quickArenaBar.innerHTML = '';
  ARENA_ORDER.forEach(id => {
    const a = ARENAS[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.arena = id;
    btn.className = 'arena-pill';
    btn.textContent = a.name;
    btn.addEventListener('click', () => {
      sound.unlock();
      game.arena = id;
      sound.playMenu();
      updateHeaderAndBars();
      btn.blur();
    });
    quickArenaBar.appendChild(btn);
  });
}

// --- LOGIQUE DE COMBAT & COUPS SPÉCIAUX ---
const BUSY_STATES = new Set([
  'hit', 'ko', 'down', 'light', 'heavy', 'crouch_punch', 'kick', 'sweep',
  'headbutt', 'shoryuken', 'spinkick', 'jump_punch', 'jump_kick', 'parry', 'special'
]);

function triggerAttack(attackerIdx, type) {
  const f = game.fighters[attackerIdx];
  if (!f || game.screen !== 'fight') return;
  if (BUSY_STATES.has(f.state)) {
    return;
  }

  if (type === 'special') {
    if (f.superMeter < 100 || game.specialFx) {
      if (f.superMeter < 100 && !game.isAttract) {
        addFloatingText(f.x, f.y - 230, `SPÉCIAL ${Math.round(f.superMeter)}%`, '#38bdf8', 18);
      }
      return;
    }
    const sd = sDur(80);
    f.superMeter = 0;
    f.state = 'special';
    f.stateTimer = sd;
    f.stateDuration = sd;
    f.attackDidHit = false;
    f.secondHitApplied = false;
    f.vx = 0;
    f.lastAttackType = 'special';
    f.repeatCount = 0;
    game.specialFx = {
      attackerIdx,
      timer: 0,
      duration: sd,
      hitApplied: false
    };
    game.shake = 10;
    spawnParticles(f.x, f.y - 120, f.def.color, 26, 8);
    sound.playSpecial(f.id);
    return;
  }

  if (type === 'parry') {
    if (f.y < FLOOR_Y || f.parryCooldown > 0) return;
    const sd = sDur(16);
    f.state = 'parry';
    f.stateTimer = sd;
    f.stateDuration = sd;
    f.parryWindow = sDur(10);
    f.parryCooldown = sDur(28);
    f.vx = 0;
    f.lastAttackType = '';
    f.repeatCount = 0;
    sound.playParry();
    return;
  }

  // Suivi anti-spam réaliste (punit la répétition aveugle d'un même coup)
  if (f.lastAttackType === type) {
    f.repeatCount++;
  } else {
    f.lastAttackType = type;
    f.repeatCount = 1;
  }
  f.attackDidHit = false;
  f.secondHitApplied = false;

  if (type === 'headbutt') {
    const sd = sDur(26);
    f.state = 'headbutt';
    f.stateTimer = sd;
    f.stateDuration = sd;
    f.vx = f.facing * 5.8 * GAME_SPEED;
    sound.playHeadbutt();
    return;
  }

  if (type === 'shoryuken') {
    const sd = sDur(28);
    f.state = 'shoryuken';
    f.stateTimer = sd;
    f.stateDuration = sd;
    f.vy = -14.2 * GAME_SPEED;
    f.y = Math.min(f.y, FLOOR_Y - 4);
    f.vx = f.facing * 3.8 * GAME_SPEED;
    sound.playShoryuken();
    spawnParticles(f.x, f.y - 90, f.def.accent || '#fde047', 12, 5);
    return;
  }

  if (type === 'spinkick') {
    const sd = sDur(32);
    f.state = 'spinkick';
    f.stateTimer = sd;
    f.stateDuration = sd;
    f.vy = -5.8 * GAME_SPEED;
    f.y = Math.min(f.y, FLOOR_Y - 6);
    f.vx = f.facing * 5.4 * GAME_SPEED;
    sound.playSpinKick();
    return;
  }

  const isCrouching =
    f.state === 'crouch' ||
    (attackerIdx === 0 && (keys.has('KeyS') || touchCtrl.getMovement().down)) ||
    (attackerIdx === 1 && keys.has('ArrowDown'));

  if (type === 'kick') {
    if (f.y < FLOOR_Y - 2) {
      const sd = sDur(20);
      f.state = 'jump_kick';
      f.stateTimer = sd;
      f.stateDuration = sd;
      sound.playKick();
    } else if (isCrouching) {
      const sd = sDur(25);
      f.state = 'sweep';
      f.stateTimer = sd;
      f.stateDuration = sd;
      f.vx = f.facing * 1.8 * GAME_SPEED; // Pas réaliste bref, sans téléportation !
      sound.playSweep();
    } else {
      const sd = sDur(24);
      f.state = 'kick';
      f.stateTimer = sd;
      f.stateDuration = sd;
      f.vx = f.facing * 1.2 * GAME_SPEED; // Coup de pied sur place réaliste avec vraie phase de récupération
      sound.playKick();
    }
    return;
  }

  if (f.y < FLOOR_Y - 2) {
    const sd = sDur(18);
    f.state = 'jump_punch';
    f.stateTimer = sd;
    f.stateDuration = sd;
    sound.playPunch(type === 'heavy');
    return;
  }

  if (isCrouching && type === 'light') {
    const sd = sDur(16);
    f.state = 'crouch_punch';
    f.stateTimer = sd;
    f.stateDuration = sd;
    f.vx = f.facing * 0.8 * GAME_SPEED;
    sound.playLight();
    return;
  }

  const sd = sDur(type === 'light' ? 15 : 25);
  f.state = type;
  f.stateTimer = sd;
  f.stateDuration = sd;
  if (f.y >= FLOOR_Y) {
    f.vx = f.facing * (type === 'light' ? 1.0 : 2.2) * GAME_SPEED;
  }
  if (type === 'light') sound.playLight();
  else sound.playHeavy();
}

function applyHit(attackerIdx, dmg, knockback, isSpecial = false, attackKind = 'light') {
  const attacker = game.fighters[attackerIdx];
  const defender = game.fighters[1 - attackerIdx];
  if (defender.state === 'ko') return;

  // Esquive accroupie : un jab haut rapide ('light') passe au-dessus d'un combattant baissé !
  if (
    !isSpecial &&
    attackKind === 'light' &&
    (defender.state === 'crouch' || defender.state === 'crouch_punch' || defender.state === 'sweep')
  ) {
    addFloatingText(defender.x, defender.y - 165, 'ESQUIVE BASSE !', '#94a3b8', 17);
    return;
  }

  // Invincibilité anti-air au démarrage du Shoryuken
  if (!isSpecial && defender.state === 'shoryuken' && defender.stateTimer >= Math.round(defender.stateDuration * 0.7)) {
    addFloatingText(defender.x, defender.y - 195, 'SHORYUKEN INVINCIBLE !', '#fde047', 17);
    return;
  }

  // Parade Parfaite (Perfect Parry SF3) : 0 dégât + contre-charge Super !
  if (defender.state === 'parry' && defender.parryWindow > 0 && !isSpecial) {
    defender.superMeter = Math.min(100, defender.superMeter + 22);
    attacker.vx = -attacker.facing * 8.0 * GAME_SPEED;
    attacker.stateTimer = Math.max(attacker.stateTimer, sDur(12));
    sound.playPerfectParry();
    spawnParticles(defender.x, defender.y - 115, '#fde047', 22, 7);
    addFloatingText(defender.x, defender.y - 190, '⚡ PARADE PARFAITE ! +22%', '#fde047', 23);
    return;
  }

  // Règles réalistes Haut / Bas / Brise-garde :
  // - La balayette ('sweep') touche bas : il faut se baisser ('crouchGuard') ou sauter, pas juste bloquer debout !
  // - Les coups sautés / boule écrasent la garde basse.
  const canBlock =
    defender.state === 'block' ||
    defender.state === 'parry' ||
    (attackKind === 'sweep' && defender.state === 'crouch');
  let isBlocking = canBlock;
  if (attackKind === 'sweep' && defender.state === 'block' && !defender.crouchGuard) {
    isBlocking = false;
  }
  if (isSpecial) {
    isBlocking = defender.state === 'block' || defender.state === 'parry';
  }

  // Coup de boule ('headbutt') : BRISE LA GARDE si simplement bloqué debout !
  const isGuardCrush = !isSpecial && attackKind === 'headbutt' && defender.state === 'block';
  if (isGuardCrush) {
    isBlocking = false;
  }

  // Réduction progressive en cas de spam répété d'un même coup (anti-spam !)
  let spamScale = 1.0;
  if (!isSpecial && attacker.repeatCount >= 3) {
    spamScale = attacker.repeatCount === 3 ? 0.65 : 0.45;
  }

  const scaledDmg = Math.max(2, Math.round(dmg * spamScale));
  const finalDmg = isBlocking
    ? Math.max(1, Math.round(scaledDmg * 0.22))
    : isGuardCrush
      ? Math.max(4, Math.round(scaledDmg * 0.65))
      : scaledDmg;

  defender.hp = Math.max(0, defender.hp - finalDmg);
  const pushDir = attacker.x < defender.x ? 1 : -1;
  defender.vx = pushDir * (isBlocking ? knockback * 0.72 : knockback) * GAME_SPEED;
  if (isBlocking && !isSpecial) {
    // Recul mutuel au contact de garde pour éviter de coller indéfiniment en spammant
    attacker.vx = -pushDir * 5.2 * GAME_SPEED;
  }

  // Recharge progressive du Coup Spécial (diminuée en cas de spam)
  const meterBase = isSpecial
    ? 0
    : isBlocking
      ? 6
      : attackKind === 'heavy' || attackKind === 'shoryuken' || attackKind === 'headbutt'
        ? 24
        : attackKind === 'kick' || attackKind === 'sweep'
          ? 16
          : 15;
  attacker.superMeter = Math.min(100, attacker.superMeter + Math.round(meterBase * spamScale));
  defender.superMeter = Math.min(100, defender.superMeter + 7);

  if (isBlocking) {
    sound.playBlock();
    spawnParticles(defender.x, defender.y - 95, '#38bdf8', 14, 5);
    addFloatingText(defender.x, defender.y - 175, `GARDE -${finalDmg}%`, '#38bdf8', 20);
  } else {
    if (attackKind === 'sweep') {
      defender.state = 'down';
      defender.stateTimer = sDur(28);
      defender.stateDuration = defender.stateTimer;
      defender.vy = -5.5 * GAME_SPEED;
    } else if (attackKind === 'shoryuken') {
      defender.state = 'hit';
      defender.stateTimer = sDur(24);
      defender.stateDuration = defender.stateTimer;
      defender.vy = -9.5 * GAME_SPEED;
    } else {
      defender.state = 'hit';
      defender.stateTimer = sDur(isSpecial ? 26 : isGuardCrush ? 22 : 16);
      defender.stateDuration = defender.stateTimer;
    }
    defender.comboCount++;
    defender.comboTimer = sDur(85);
    game.shake = isSpecial ? 16 : isGuardCrush || attackKind === 'shoryuken' ? 11 : 7;
    const hitCol = attacker.id === 'darkmada' && isSpecial ? '#f472b6' : attacker.def.color;
    spawnParticles(defender.x, defender.y - 110, hitCol, isSpecial ? 36 : 16, isSpecial ? 10 : 6);

    let floatLabel = `-${finalDmg}%`;
    if (isGuardCrush) {
      sound.playGuardCrush();
      floatLabel = `BRISE-GARDE ! -${finalDmg}%`;
    } else if (attackKind === 'sweep') {
      floatLabel = `BALAYETTE ! -${finalDmg}%`;
    } else if (attackKind === 'shoryuken') {
      floatLabel = `SHORYUKEN ! -${finalDmg}%`;
    } else if (attackKind === 'spinkick') {
      floatLabel = `SPIN KICK ! -${finalDmg}%`;
    } else if (attackKind === 'headbutt') {
      floatLabel = `COUP DE BOULE ! -${finalDmg}%`;
    } else if (isSpecial) {
      if (attacker.id === 'darkmada') floatLabel = `SUSHI ♥ -${finalDmg}%`;
      else if (attacker.id === 'koll') floatLabel = `LAPIN-AIMANT 🐰 -${finalDmg}%`;
      else if (attacker.id === 'goldohrack') floatLabel = `FULGURO-POING 🚀 -${finalDmg}%`;
      else floatLabel = `SUPER -${finalDmg}%!`;
    }

    addFloatingText(
      defender.x,
      defender.y - 185,
      floatLabel,
      isSpecial || attackKind === 'shoryuken' ? '#fde047' : isGuardCrush ? '#fb923c' : attackKind === 'sweep' || attackKind === 'spinkick' ? '#38bdf8' : '#ffffff',
      isSpecial ? 30 : 23
    );
  }

  if (defender.hp <= 0) {
    defender.state = 'ko';
    defender.vy = -8 * GAME_SPEED;
    endRound(attackerIdx, 'K.O.!');
  }
}

function endRound(winnerIdx, reasonText) {
  if (game.screen !== 'fight') return;
  sound.playKO();
  game.screen = 'roundOver';
  game.announcement = reasonText;
  game.announcementTimer = sDur(110);
  game.phaseTimer = sDur(115);

  if (winnerIdx === 0 || winnerIdx === 1) {
    game.fighters[winnerIdx].rounds++;
  }
}

function showMatchOver() {
  const [p1, p2] = game.fighters;
  let title = 'MATCH NUL !';
  if (p1.rounds > p2.rounds) {
    title = `VICTOIRE J1 · ${p1.def.name} !`;
  } else if (p2.rounds > p1.rounds) {
    title = `${game.mode === 'bot' ? 'VICTOIRE BOT IA' : 'VICTOIRE J2'} · ${p2.def.name} !`;
  }
  matchWinnerTitle.textContent = title;
  matchWinnerSubtitle.textContent = `Score final : ${p1.rounds} - ${p2.rounds} · Arène : ${ARENAS[game.arena].name} (${p2.def.city})`;
  setScreen('matchOver');
}

// --- CONTRÔLES CLAVIER & TACTILES VIRTUEL (SAUTER = ESPACE / STICK ↑, FRAPPER = F / POING, SPÉCIAL = ENTRÉE / ⚡) ---
function readPlayerInput(idx) {
  if (idx === 0) {
    const touch = touchCtrl.getMovement();
    const left = keys.has('KeyA') || keys.has('KeyQ') || touch.left || (game.mode === 'bot' && keys.has('ArrowLeft'));
    const right = keys.has('KeyD') || touch.right || (game.mode === 'bot' && keys.has('ArrowRight'));
    const up = keys.has('Space') || keys.has('KeyW') || keys.has('KeyZ') || touch.up;
    const down = keys.has('KeyS') || touch.down;
    return { left, right, up, down };
  }
  const left = keys.has('ArrowLeft');
  const right = keys.has('ArrowRight');
  const up = keys.has('ArrowUp');
  const down = keys.has('ArrowDown');
  return { left, right, up, down };
}

function updateHumanFighter(idx) {
  const f = game.fighters[idx];
  const opp = game.fighters[1 - idx];
  if (BUSY_STATES.has(f.state)) {
    return;
  }

  const input = readPlayerInput(idx);
  const onGround = f.y >= FLOOR_Y;
  f.crouchGuard = Boolean(onGround && input.down);

  if (onGround) {
    f.facing = f.x <= opp.x ? 1 : -1;
  }

  const holdingBack = (f.facing === 1 && input.left) || (f.facing === -1 && input.right);
  const oppAttacking =
    opp.state === 'light' || opp.state === 'heavy' || opp.state === 'crouch_punch' ||
    opp.state === 'kick' || opp.state === 'sweep' || opp.state === 'headbutt' ||
    opp.state === 'shoryuken' || opp.state === 'spinkick' ||
    opp.state === 'jump_punch' || opp.state === 'jump_kick' || opp.state === 'special';

  if (onGround && (input.down || (holdingBack && oppAttacking))) {
    f.vx = 0;
    const nextState = holdingBack && oppAttacking ? 'block' : 'crouch';
    if (nextState === 'crouch' && f.state !== 'crouch') {
      sound.playCrouch();
    }
    f.state = nextState;
    return;
  }

  if (onGround && input.up) {
    f.vy = f.def.jumpForce * GAME_SPEED;
    f.y -= 2;
    f.state = 'jump';
    sound.playJump();
  }

  if (input.left && !input.right) {
    f.vx = -f.def.speed * GAME_SPEED;
    if (onGround) f.state = 'walk';
  } else if (input.right && !input.left) {
    f.vx = f.def.speed * GAME_SPEED;
    if (onGround) f.state = 'walk';
  } else {
    f.vx *= 0.6;
    if (Math.abs(f.vx) < 0.2) f.vx = 0;
    if (onGround) f.state = 'idle';
  }
}

// --- IA DU BOT RÉALISTE (1J vs BOT & MODE VEILLE IA vs IA) ---
function pickBotTactic(bot, dist) {
  const r = Math.random();
  if (dist > 420) {
    if (r < 0.45) return { tactic: 'approach', dur: sDur(28 + Math.floor(Math.random() * 22)) };
    if (r < 0.80) return { tactic: 'footsies', dur: sDur(32 + Math.floor(Math.random() * 24)) };
    return { tactic: 'observe', dur: sDur(30 + Math.floor(Math.random() * 22)) };
  }
  if (dist >= 195) {
    if (r < 0.32) return { tactic: 'observe', dur: sDur(28 + Math.floor(Math.random() * 24)) };
    if (r < 0.65) return { tactic: 'footsies', dur: sDur(34 + Math.floor(Math.random() * 26)) };
    if (r < 0.85) return { tactic: 'approach', dur: sDur(24 + Math.floor(Math.random() * 18)) };
    return { tactic: 'retreat', dur: sDur(22 + Math.floor(Math.random() * 18)) };
  }
  if (r < 0.35) return { tactic: 'retreat', dur: sDur(26 + Math.floor(Math.random() * 18)) };
  if (r < 0.60) return { tactic: 'observe', dur: sDur(24 + Math.floor(Math.random() * 20)) };
  if (r < 0.85) return { tactic: 'approach', dur: sDur(20 + Math.floor(Math.random() * 14)) };
  return { tactic: 'footsies', dur: sDur(24 + Math.floor(Math.random() * 16)) };
}

function updateBotFighter(botIdx = 1) {
  const bot = game.fighters[botIdx];
  const opp = game.fighters[1 - botIdx];
  if (BUSY_STATES.has(bot.state)) {
    return;
  }

  const onGround = bot.y >= FLOOR_Y;
  const dirToOpp = bot.x <= opp.x ? 1 : -1;
  if (onGround) bot.facing = dirToOpp;

  if (bot.botAttackCooldown > 0) bot.botAttackCooldown--;
  if (bot.botSpecialCooldown > 0) bot.botSpecialCooldown--;
  if (bot.botTacticTimer > 0) bot.botTacticTimer--;

  const dist = Math.abs(bot.x - opp.x);
  const oppAttacking =
    opp.state === 'light' || opp.state === 'heavy' || opp.state === 'crouch_punch' ||
    opp.state === 'kick' || opp.state === 'sweep' || opp.state === 'headbutt' ||
    opp.state === 'spinkick' || opp.state === 'shoryuken' || opp.state === 'special';
  const oppRecovery =
    BUSY_STATES.has(opp.state) && opp.state !== 'hit' && opp.state !== 'down' && opp.state !== 'ko' &&
    opp.stateTimer > 0 && opp.stateTimer <= sDur(10);
  const oppSpamming = opp.repeatCount >= 2;

  const diff = game.isAttract ? 'normal' : game.botDiff;
  const blockChance = diff === 'easy' ? 0.32 : diff === 'normal' ? 0.56 : 0.78;
  const parryChance = diff === 'easy' ? 0.14 : diff === 'normal' ? 0.34 : 0.55;
  const atkRecovery = sDur(diff === 'easy' ? 68 : diff === 'normal' ? 42 : 28);
  const specialRate = game.isAttract ? 0.035 : diff === 'easy' ? 0.007 : diff === 'normal' ? 0.018 : 0.032;

  // Attaque aérienne si le bot est déjà en l'air proche de l'adversaire
  if (!onGround && dist < 245 && bot.botAttackCooldown <= 0 && bot.vy > -4 * GAME_SPEED) {
    bot.botAttackCooldown = atkRecovery;
    triggerAttack(botIdx, Math.random() < 0.6 ? 'kick' : 'light');
    return;
  }

  // Anti-air Shoryuken si l'adversaire saute sur le bot !
  if (onGround && opp.y < FLOOR_Y - 45 && dist < 245 && bot.botAttackCooldown <= 0 && Math.random() < (diff === 'easy' ? 0.06 : 0.18)) {
    bot.botAttackCooldown = atkRecovery;
    triggerAttack(botIdx, 'shoryuken');
    return;
  }

  // Réaction défensive + punition anti-spam (bloque/pare les kicks répétés puis balaye/contre !)
  if (onGround && oppAttacking && dist < 250 && bot.botTactic !== 'defend') {
    const reactiveBlock = oppSpamming ? Math.min(0.95, blockChance + 0.28) : blockChance;
    const reactiveParry = oppSpamming ? Math.min(0.75, parryChance + 0.22) : parryChance;
    if (bot.parryCooldown <= 0 && Math.random() < reactiveParry) {
      triggerAttack(botIdx, 'parry');
      return;
    }
    if (Math.random() < reactiveBlock) {
      bot.crouchGuard = opp.state === 'sweep';
      bot.botTactic = 'defend';
      bot.botTacticTimer = sDur(15);
    }
  }

  // Punition immédiate si l'adversaire vient de rater / bloquer un coup de pied devant le bot
  if (onGround && oppRecovery && dist < 245 && bot.botAttackCooldown <= 0) {
    bot.botAttackCooldown = atkRecovery;
    const rc = Math.random();
    if (rc < 0.32) {
      bot.state = 'crouch';
      triggerAttack(botIdx, 'kick');
    } else if (rc < 0.62) {
      triggerAttack(botIdx, 'headbutt');
    } else {
      bot.state = 'crouch';
      triggerAttack(botIdx, 'light');
    }
    return;
  }

  if (bot.botTactic === 'defend') {
    bot.vx = 0;
    bot.state = 'block';
    if (bot.botTacticTimer <= 0) {
      bot.crouchGuard = false;
      bot.botTactic = oppSpamming ? 'approach' : (Math.random() < 0.5 ? 'retreat' : 'observe');
      bot.botTacticTimer = sDur(22);
    }
    return;
  }

  if (bot.superMeter >= 100 && !game.specialFx && bot.botSpecialCooldown <= 0 && dist < 780 && Math.random() < specialRate) {
    bot.botSpecialCooldown = sDur(220);
    bot.botAttackCooldown = atkRecovery + sDur(20);
    triggerAttack(botIdx, 'special');
    return;
  }

  if (bot.botTacticTimer <= 0) {
    const picked = pickBotTactic(bot, dist);
    bot.botTactic = picked.tactic;
    bot.botTacticTimer = picked.dur;
    if (bot.botTactic === 'footsies') {
      if (dist > 320) bot.botMoveDir = dirToOpp;
      else if (dist < 220) bot.botMoveDir = -dirToOpp;
      else bot.botMoveDir = Math.random() < 0.5 ? dirToOpp : -dirToOpp;
    }
  }

  const speedScale = (diff === 'easy' ? 0.75 : diff === 'normal' ? 0.88 : 0.98) * GAME_SPEED;
  if (bot.botTactic === 'observe') {
    bot.vx = 0;
  } else if (bot.botTactic === 'retreat') {
    bot.vx = -dirToOpp * bot.def.speed * 0.72 * speedScale;
  } else if (bot.botTactic === 'footsies') {
    bot.vx = bot.botMoveDir * bot.def.speed * 0.62 * speedScale;
  } else if (bot.botTactic === 'approach') {
    bot.vx = dist > 175 ? dirToOpp * bot.def.speed * 0.88 * speedScale : 0;
    if (onGround && dist > 235 && dist < 430 && Math.random() < 0.018) {
      bot.vy = bot.def.jumpForce * GAME_SPEED;
      bot.y -= 2;
      bot.vx = dirToOpp * bot.def.speed * 0.9 * GAME_SPEED;
      bot.state = 'jump';
    }
  }

  // Spinning Kick à mi-distance ou contre un adversaire passif
  if (onGround && dist >= 200 && dist < 320 && bot.botAttackCooldown <= 0 && Math.random() < 0.022) {
    bot.botAttackCooldown = atkRecovery + sDur(12);
    triggerAttack(botIdx, 'spinkick');
    return;
  }

  // Mixup riche au corps à corps : jab, poing baissé, coup de pied, balayette, coup de boule, Shoryuken
  if (onGround && dist < 230 && bot.botAttackCooldown <= 0 && (bot.botTactic === 'approach' || (bot.botTactic === 'footsies' && Math.random() < 0.07))) {
    bot.botAttackCooldown = atkRecovery;
    bot.botTactic = Math.random() < 0.50 ? 'retreat' : 'observe';
    bot.botTacticTimer = sDur(24 + Math.floor(Math.random() * 20));
    const rAtk = Math.random();
    if (opp.state === 'block' && rAtk < 0.48) {
      triggerAttack(botIdx, 'headbutt');
    } else if (rAtk < 0.20) {
      bot.state = 'crouch';
      triggerAttack(botIdx, 'light');
    } else if (rAtk < 0.38) {
      bot.state = 'crouch';
      triggerAttack(botIdx, 'kick');
    } else if (rAtk < 0.56) {
      triggerAttack(botIdx, 'light');
    } else if (rAtk < 0.74) {
      triggerAttack(botIdx, 'kick');
    } else if (rAtk < 0.88) {
      triggerAttack(botIdx, 'headbutt');
    } else {
      triggerAttack(botIdx, 'shoryuken');
    }
    return;
  }

  if (onGround) {
    bot.state = Math.abs(bot.vx) > 0.4 ? 'walk' : 'idle';
  }
}

// --- BOUCLE PRINCIPALE 60 FPS ---
function stepPhysics() {
  game.tick++;
  game.animTick += GAME_SPEED;

  if (game.shake > 0) {
    game.shake *= 0.86;
    if (game.shake < 0.5) game.shake = 0;
  }

  if (game.announcementTimer > 0) game.announcementTimer--;

  // Écran de veille automatique (Attract Mode) après 10s d'inactivité sur le menu titre
  if (game.screen === 'menu' && !game.isAttract) {
    game.idleFrames++;
    if (game.idleFrames >= 600) {
      startAttractCycle();
      return;
    }
  }

  // Animations des écrans Carte de France -> Écran VS -> Intro Combat
  if (game.screen === 'map') {
    game.phaseTimer--;
    if (game.phaseTimer > 35 && game.tick % 12 === 0) {
      sound.playMapStep();
    }
    if (game.phaseTimer <= 0) {
      enterVsScreen();
    }
    return;
  }

  if (game.screen === 'vs') {
    game.phaseTimer--;
    if (game.phaseTimer <= 0) {
      enterIntroRound();
    }
    return;
  }

  // Particules & textes flottants
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.25 * GRAVITY_SCALE;
    p.life--;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
  for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
    const ft = game.floatingTexts[i];
    ft.y += ft.vy;
    ft.life--;
    if (ft.life <= 0) game.floatingTexts.splice(i, 1);
  }

  if (game.screen === 'intro') {
    game.phaseTimer--;
    if (game.phaseTimer === sDur(32)) {
      game.announcement = 'FIGHT!';
      game.announcementTimer = sDur(32);
    }
    if (game.phaseTimer <= 0) {
      setScreen('fight');
    }
    return;
  }

  if (game.screen === 'roundOver') {
    game.phaseTimer--;
    game.fighters.forEach(f => {
      f.vy += 0.85 * GRAVITY_SCALE;
      f.y = Math.min(FLOOR_Y, f.y + f.vy);
      if (f.y >= FLOOR_Y) f.vy = 0;
      f.vx *= 0.89;
      f.x = Math.max(95, Math.min(STAGE_W - 95, f.x + f.vx));
      if (f.trailHp > f.hp) f.trailHp = Math.max(f.hp, f.trailHp - 0.6 * GAME_SPEED);
    });

    if (game.phaseTimer <= 0) {
      if (game.isAttract) {
        startAttractCycle();
        return;
      }
      const [p1, p2] = game.fighters;
      if (p1.rounds >= 2 || p2.rounds >= 2 || game.roundNumber >= 3) {
        showMatchOver();
      } else {
        startNextRound();
      }
    }
    return;
  }

  if (game.screen !== 'fight') return;

  // Timer de manche
  game.timer = Math.max(0, game.timer - GAME_SPEED / 60);
  if (game.timer <= 0) {
    const [p1, p2] = game.fighters;
    const winner = p1.hp === p2.hp ? -1 : p1.hp > p2.hp ? 0 : 1;
    endRound(winner, 'TIME OVER!');
    return;
  }

  // Effet spécial en cours (dont attraction physique du Lapin-Aimant de Koll)
  if (game.specialFx) {
    const sp = game.specialFx;
    sp.timer++;
    const attacker = game.fighters[sp.attackerIdx];
    const defender = game.fighters[1 - sp.attackerIdx];
    const spProg = sp.timer / Math.max(1, sp.duration);

    // KOLL — Le déguisement lapin attire irrésistiblement l'adversaire vers lui avant la décharge !
    if (attacker && defender && attacker.id === 'koll' && spProg >= 0.06 && spProg <= 0.36) {
      const targetX = Math.max(135, Math.min(STAGE_W - 135, attacker.x + attacker.facing * 125));
      const dx = targetX - defender.x;
      defender.x += Math.sign(dx) * Math.min(6.5 * GAME_SPEED, Math.abs(dx));
      if (sp.timer % 4 === 0) {
        spawnParticles(defender.x, defender.y - 130, sp.timer % 8 === 0 ? '#f472b6' : '#38bdf8', 4, 4);
      }
    }

    if (sp.timer === Math.round(sp.duration * 0.375) && !sp.hitApplied) {
      sp.hitApplied = true;
      if (Math.abs(attacker.x - defender.x) < 1100) {
        applyHit(sp.attackerIdx, attacker.def.specialDmg, 14, true, 'special');
      }
    }
    if (sp.timer >= sp.duration) {
      game.specialFx = null;
    }
  }

  const freezeActive = game.specialFx && game.specialFx.timer < Math.round(game.specialFx.duration * 0.225);
  if (!freezeActive) {
    if (game.isAttract) {
      updateBotFighter(0);
      updateBotFighter(1);
    } else {
      updateHumanFighter(0);
      if (game.mode === 'local') updateHumanFighter(1);
      else updateBotFighter(1);
    }
  }

  // Physique & Collisions d'attaques avec portée et fenêtres normalisées par ratio 0..1
  game.fighters.forEach((f, idx) => {
    if (f.trailHp > f.hp) f.trailHp = Math.max(f.hp, f.trailHp - 0.55 * GAME_SPEED);
    if (f.comboTimer > 0) f.comboTimer--;
    else f.comboCount = 0;
    if (f.parryWindow > 0) f.parryWindow--;
    if (f.parryCooldown > 0) f.parryCooldown--;

    if (f.stateTimer > 0) {
      f.stateTimer--;
      const atkProg = f.stateDuration > 0 ? 1 - f.stateTimer / f.stateDuration : 0;

      // Freine la glissade sur place des attaques debout/accroupies (fini l'avance automatique de 90px!)
      if (f.y >= FLOOR_Y && (f.state === 'light' || f.state === 'heavy' || f.state === 'crouch_punch' || f.state === 'kick' || f.state === 'sweep' || f.state === 'hit' || f.state === 'down')) {
        f.vx *= 0.82;
      } else if (f.state === 'headbutt') {
        f.vx *= 0.91;
      }

      const isMelee =
        f.state === 'light' || f.state === 'heavy' || f.state === 'crouch_punch' ||
        f.state === 'kick' || f.state === 'sweep' || f.state === 'headbutt' ||
        f.state === 'shoryuken' || f.state === 'spinkick' ||
        f.state === 'jump_punch' || f.state === 'jump_kick';
      if (isMelee) {
        const opp = game.fighters[1 - idx];
        const reach =
          f.state === 'heavy' ? 255
          : f.state === 'kick' || f.state === 'spinkick' ? 235
          : f.state === 'sweep' || f.state === 'shoryuken' || f.state === 'jump_kick' ? 230
          : f.state === 'headbutt' ? 225
          : 215;

        let active = false;
        let spinSecondWave = false;
        if (f.state === 'spinkick') {
          if (atkProg >= 0.15 && atkProg <= 0.38 && !f.attackDidHit) active = true;
          else if (atkProg >= 0.53 && atkProg <= 0.76 && !f.secondHitApplied) {
            active = true;
            spinSecondWave = true;
          }
        } else if (f.state === 'shoryuken') {
          active = atkProg >= 0.08 && atkProg <= 0.44;
        } else if (f.state === 'headbutt') {
          active = atkProg >= 0.25 && atkProg <= 0.62;
        } else if (f.state === 'sweep') {
          active = atkProg >= 0.26 && atkProg <= 0.56;
        } else if (f.state === 'kick') {
          active = atkProg >= 0.26 && atkProg <= 0.55; // Startup + fenetre serree + vraie recup
        } else if (f.state === 'light' || f.state === 'crouch_punch') {
          active = atkProg >= 0.20 && atkProg <= 0.55; // Jab rapide interrompt les kicks !
        } else if (f.state === 'heavy') {
          active = atkProg >= 0.26 && atkProg <= 0.60;
        } else {
          active = atkProg >= 0.12 && atkProg <= 0.72;
        }

        const facingTarget = (f.facing === 1 && opp.x >= f.x - 45) || (f.facing === -1 && opp.x <= f.x + 45);
        const canHit = spinSecondWave ? !f.secondHitApplied : !f.attackDidHit;
        const yTol = f.state === 'shoryuken' ? 245 : 195;
        if (active && canHit && facingTarget && Math.abs(f.x - opp.x) <= reach && Math.abs(f.y - opp.y) <= yTol) {
          if (spinSecondWave) f.secondHitApplied = true;
          else f.attackDidHit = true;

          const dmg =
            f.state === 'heavy' || f.state === 'shoryuken' ? (f.def.heavyDmg || 14)
            : f.state === 'headbutt' ? (f.def.headbuttDmg || 13)
            : f.state === 'spinkick' ? (f.def.spinDmg || 6)
            : f.state === 'sweep' ? (f.def.sweepDmg || 12)
            : f.state === 'kick' || f.state === 'jump_kick' ? (f.def.kickDmg || 10)
            : f.def.lightDmg;
          const kb =
            f.state === 'heavy' || f.state === 'shoryuken' || f.state === 'headbutt' ? 12
            : f.state === 'sweep' || f.state === 'kick' ? 10
            : f.state === 'spinkick' ? 5
            : 6;
          applyHit(idx, dmg, kb, false, f.state);
        }
      }
      if (f.stateTimer === 0 && f.state !== 'ko') {
        f.state = f.y < FLOOR_Y ? 'jump' : 'idle';
      }
    }

    if (!freezeActive) {
      // Flottaison légère style Chun-Li/Tatsumaki sur Spinning Kick + gravité ajustée à 0.70^2
      const grav = (f.state === 'spinkick' ? 0.34 : 0.85) * GRAVITY_SCALE;
      f.vy += grav;
      f.x += f.vx;
      f.y += f.vy;

      if (f.y >= FLOOR_Y) {
        f.y = FLOOR_Y;
        f.vy = 0;
        if (f.state === 'jump' || f.state === 'jump_punch' || f.state === 'jump_kick') {
          f.state = 'idle';
        }
      }
      f.x = Math.max(135, Math.min(STAGE_W - 135, f.x));
    }
  });

  // Répulsion mutuelle
  const [f1, f2] = game.fighters;
  if (Math.abs(f1.x - f2.x) < 115 && Math.abs(f1.y - f2.y) < 145) {
    const push = (115 - Math.abs(f1.x - f2.x)) * 0.5;
    if (f1.x <= f2.x) {
      f1.x = Math.max(135, f1.x - push);
      f2.x = Math.min(STAGE_W - 135, f2.x + push);
    } else {
      f1.x = Math.min(STAGE_W - 135, f1.x + push);
      f2.x = Math.max(135, f2.x - push);
    }
  }
}

function render() {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }

  if (game.screen === 'menu') {
    drawTitleScreen(ctx, game);
  } else if (game.screen === 'select') {
    drawSelectScreen(ctx, game);
  } else if (game.screen === 'map') {
    drawFranceMapScreen(ctx, game);
  } else if (game.screen === 'vs') {
    drawVsScreen(ctx, game);
  } else {
    drawArena(ctx, game.arena, game.animTick);
    drawFighter(ctx, game.fighters[0], game.animTick);
    drawFighter(ctx, game.fighters[1], game.animTick + 15);
    drawSpecialFX(ctx, game.specialFx, game.fighters);
    drawEffects(ctx, game.particles, game.floatingTexts);

    if (game.screen === 'intro' || game.screen === 'fight' || game.screen === 'roundOver') {
      drawHUD(ctx, game);
    }
  }

  if (game.isAttract) {
    drawAttractOverlay(ctx, game);
  }

  touchCtrl.syncState({
    visible: (game.screen === 'fight' || game.screen === 'intro') && !game.isAttract,
    superMeter: game.fighters[0]?.superMeter ?? 0
  });

  ctx.restore();
}

let lastLoopTs = 0;
let frameAccMs = 0;
function gameLoop(now = 0) {
  if (!lastLoopTs) {
    lastLoopTs = now;
    stepPhysics();
  } else {
    const dt = Math.min(45, Math.max(0, now - lastLoopTs));
    lastLoopTs = now;
    if (dt >= 13 && dt <= 24) {
      // Écran 60 Hz standard : 1 pas fluide sans dérive ni saut d'image
      stepPhysics();
      frameAccMs = 0;
    } else {
      // Écran ProMotion 120 Hz+ ou perte de focus : plafonné strictement à 60 ticks/sec !
      frameAccMs += dt;
      let steps = 0;
      while (frameAccMs >= 16.6667 && steps < 2) {
        stepPhysics();
        frameAccMs -= 16.6667;
        steps++;
      }
      if (steps >= 2) frameAccMs = 0;
    }
  }
  render();
  requestAnimationFrame(gameLoop);
}

// --- INTERACTIONS SOURIS & TACTILES SUR LE CANVAS ---
function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * STAGE_W,
    y: ((e.clientY - rect.top) / rect.height) * STAGE_H
  };
}

function hitRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

canvas.addEventListener('contextmenu', e => {
  if (game.screen === 'select') e.preventDefault();
});

canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') {
    e.preventDefault();
  }
  game.idleFrames = 0;
  sound.unlock();
  if (!sound.muted && sound.musicMode !== 'none') {
    // Relance le séquenceur dès la première interaction utilisateur
    const mode = sound.musicMode;
    sound.setMusicMode('none');
    sound.setMusicMode(mode);
  }
  canvas.focus();

  if (game.isAttract) {
    stopAttractToMenu();
    return;
  }

  const { x, y } = getCanvasCoords(e);

  if (game.screen === 'menu') {
    sound.playConfirm();
    setScreen('select');
    return;
  }

  if (game.screen === 'select') {
    const layout = getSelectLayout();

    if (hitRect(x, y, layout.modeBadgeRect)) {
      game.mode = game.mode === 'bot' ? 'local' : 'bot';
      game.selectTarget = game.mode === 'local' ? 2 : 1;
      sound.playMenu();
      updateHeaderAndBars();
      return;
    }

    if (hitRect(x, y, layout.p2PanelRect)) {
      if (game.mode === 'bot' && y >= layout.p2PanelRect.y + 135) {
        game.selectTarget = 2;
      } else {
        game.mode = game.mode === 'bot' ? 'local' : 'bot';
        game.selectTarget = game.mode === 'local' ? 2 : 1;
      }
      sound.playMenu();
      updateHeaderAndBars();
      return;
    }

    for (const ar of layout.arenaRects) {
      if (hitRect(x, y, ar)) {
        game.arena = ar.id;
        sound.playMenu();
        updateHeaderAndBars();
        return;
      }
    }

    for (const fr of layout.fighterRects) {
      if (hitRect(x, y, fr)) {
        sound.playMenu();
        if (e.button === 2 || game.selectTarget === 2) {
          game.p2Choice = fr.id;
          game.selectTarget = 1;
        } else {
          game.p1Choice = fr.id;
          if (game.mode === 'local') game.selectTarget = 2;
        }
        resetRoundFighters(false);
        return;
      }
    }

    if (hitRect(x, y, layout.launchBtnRect)) {
      startTourAndFight();
      return;
    }
    return;
  }

  if (game.screen === 'map') {
    enterVsScreen();
    return;
  }

  if (game.screen === 'vs') {
    enterIntroRound();
  }
});

// --- ÉVÉNEMENTS CLAVIER ---
function stepFighterChoice(playerIdx, dir) {
  const curId = playerIdx === 1 ? game.p1Choice : game.p2Choice;
  const idx = FIGHTER_ORDER.indexOf(curId);
  const next = FIGHTER_ORDER[(idx + dir + FIGHTER_ORDER.length) % FIGHTER_ORDER.length];
  if (playerIdx === 1) game.p1Choice = next;
  else game.p2Choice = next;
  sound.playMenu();
  resetRoundFighters(false);
}

window.addEventListener('keydown', e => {
  game.idleFrames = 0;
  sound.unlock();

  const activeTag = document.activeElement?.tagName;
  const isFormFocus = activeTag === 'BUTTON' || activeTag === 'SELECT';

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && !isFormFocus) {
    e.preventDefault();
  }

  if (e.repeat) return;

  if (game.isAttract) {
    e.preventDefault();
    stopAttractToMenu();
    return;
  }

  keys.add(e.code);

  // Navigation Écran Titre
  if (game.screen === 'menu') {
    if (!isFormFocus && e.code === 'KeyV') {
      e.preventDefault();
      sound.playConfirm();
      startAttractCycle();
      return;
    }
    if (!isFormFocus && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space' || e.code === 'KeyF')) {
      e.preventDefault();
      sound.playConfirm();
      setScreen('select');
    }
    return;
  }

  // Navigation Écran Sélection
  if (game.screen === 'select') {
    if (!isFormFocus && e.code === 'KeyV') {
      e.preventDefault();
      sound.playConfirm();
      startAttractCycle();
      return;
    }
    if (e.code === 'Tab') {
      e.preventDefault();
      game.selectTarget = game.selectTarget === 1 ? 2 : 1;
      sound.playMenu();
      return;
    }
    if (e.code === 'Digit2' || e.code === 'ShiftRight') {
      game.mode = game.mode === 'bot' ? 'local' : 'bot';
      sound.playMenu();
      updateHeaderAndBars();
      return;
    }
    if (e.code === 'KeyA' || e.code === 'KeyQ') {
      stepFighterChoice(1, -1);
      return;
    }
    if (e.code === 'KeyD') {
      stepFighterChoice(1, 1);
      return;
    }
    if (e.code === 'ArrowLeft') {
      stepFighterChoice(game.mode === 'local' ? 2 : game.selectTarget, -1);
      return;
    }
    if (e.code === 'ArrowRight') {
      stepFighterChoice(game.mode === 'local' ? 2 : game.selectTarget, 1);
      return;
    }
    if (!isFormFocus && (e.code === 'Enter' || e.code === 'NumpadEnter')) {
      e.preventDefault();
      startTourAndFight();
    }
    return;
  }

  // Skip rapide Carte de France / Écran VS
  if (game.screen === 'map' && !isFormFocus && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')) {
    e.preventDefault();
    enterVsScreen();
    return;
  }
  if (game.screen === 'vs' && !isFormFocus && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')) {
    e.preventDefault();
    enterIntroRound();
    return;
  }

  if (game.screen !== 'fight') return;

  // Touches de Combat SF2 : Poing (F / S+F bas) · Shoryuken (R) · Pied (G / S+G balayette) · Spin Kick (H) · Boule (E) · Parade (C) · Spécial (Entrée)
  if (e.code === 'KeyF') {
    triggerAttack(0, 'light');
  } else if (e.code === 'KeyR') {
    triggerAttack(0, 'shoryuken');
  } else if (e.code === 'KeyG') {
    triggerAttack(0, 'kick');
  } else if (e.code === 'KeyH') {
    triggerAttack(0, 'spinkick');
  } else if (e.code === 'KeyE') {
    triggerAttack(0, 'headbutt');
  } else if (e.code === 'KeyC' || e.code === 'ShiftLeft') {
    triggerAttack(0, 'parry');
  } else if (e.code === 'Enter' || (game.mode === 'bot' && e.code === 'NumpadEnter')) {
    e.preventDefault();
    triggerAttack(0, 'special');
  }

  if (game.mode === 'local') {
    if (e.code === 'KeyK') triggerAttack(1, 'light');
    else if (e.code === 'KeyI') triggerAttack(1, 'shoryuken');
    else if (e.code === 'KeyL') triggerAttack(1, 'kick');
    else if (e.code === 'KeyP') triggerAttack(1, 'spinkick');
    else if (e.code === 'KeyU') triggerAttack(1, 'headbutt');
    else if (e.code === 'KeyM' || e.code === 'KeyJ') triggerAttack(1, 'parry');
    else if (e.code === 'KeyO' || e.code === 'ShiftRight' || e.code === 'NumpadEnter') {
      e.preventDefault();
      triggerAttack(1, 'special');
    }
  }
});

window.addEventListener('keyup', e => {
  keys.delete(e.code);
});

window.addEventListener('blur', () => {
  keys.clear();
});

// Événements Barre Supérieure & Overlay Fin de Match
modeBotHeaderBtn.addEventListener('click', () => {
  sound.unlock();
  game.isAttract = false;
  game.idleFrames = 0;
  game.mode = 'bot';
  game.selectTarget = 1;
  sound.playMenu();
  updateHeaderAndBars();
  modeBotHeaderBtn.blur();
});

modeLocalHeaderBtn.addEventListener('click', () => {
  sound.unlock();
  game.isAttract = false;
  game.idleFrames = 0;
  game.mode = 'local';
  game.selectTarget = 2;
  sound.playMenu();
  updateHeaderAndBars();
  modeLocalHeaderBtn.blur();
});

botDiffSelect.addEventListener('change', e => {
  game.idleFrames = 0;
  game.botDiff = e.target.value;
  botDiffSelect.blur();
});

openSelectHeaderBtn.addEventListener('click', () => {
  sound.unlock();
  game.isAttract = false;
  game.idleFrames = 0;
  sound.playMenu();
  setScreen('select');
  openSelectHeaderBtn.blur();
});

if (attractToggleBtn) {
  attractToggleBtn.addEventListener('click', () => {
    sound.unlock();
    if (game.isAttract) {
      sound.playMenu();
      stopAttractToMenu();
    } else {
      sound.playConfirm();
      startAttractCycle();
    }
    attractToggleBtn.blur();
  });
}

if (touchToggleBtn) {
  touchToggleBtn.addEventListener('click', () => {
    sound.unlock();
    touchCtrl.cycleMode();
    sound.playMenu();
    updateHeaderAndBars();
    touchToggleBtn.blur();
  });
}

audioToggleBtn.addEventListener('click', () => {
  sound.unlock();
  game.idleFrames = 0;
  const muted = sound.toggleMute();
  audioToggleBtn.textContent = muted ? 'Musique 16-bit : OFF' : 'Musique 16-bit : ON';
  if (!muted) sound.playMenu();
  audioToggleBtn.blur();
});

function isAnyFullscreen() {
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    stageContainer.classList.contains('is-viewport-fullscreen')
  );
}

function syncFullscreenUI() {
  const active = isAnyFullscreen();
  if (fullscreenBtn) {
    fullscreenBtn.textContent = active ? 'Quitter Plein Écran' : 'Plein Écran';
    fullscreenBtn.classList.toggle('is-active', active);
  }
  if (exitPseudoFullscreenBtn) {
    exitPseudoFullscreenBtn.hidden = !stageContainer.classList.contains('is-viewport-fullscreen');
  }
}

function exitFullscreenSafe() {
  stageContainer.classList.remove('is-viewport-fullscreen');
  document.body.classList.remove('has-viewport-fullscreen');
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
  syncFullscreenUI();
}

function toggleFullscreenSafe() {
  if (isAnyFullscreen()) {
    exitFullscreenSafe();
    return;
  }
  const req = stageContainer.requestFullscreen || stageContainer.webkitRequestFullscreen;
  if (typeof req === 'function') {
    Promise.resolve(req.call(stageContainer))
      .then(() => syncFullscreenUI())
      .catch(() => {
        // Fallback fluide pour iPadOS / iOS Safari lorsque requestFullscreen est bloqué
        stageContainer.classList.add('is-viewport-fullscreen');
        document.body.classList.add('has-viewport-fullscreen');
        syncFullscreenUI();
      });
  } else {
    stageContainer.classList.add('is-viewport-fullscreen');
    document.body.classList.add('has-viewport-fullscreen');
    syncFullscreenUI();
  }
}

fullscreenBtn.addEventListener('click', () => {
  sound.unlock();
  toggleFullscreenSafe();
  fullscreenBtn.blur();
});

if (exitPseudoFullscreenBtn) {
  exitPseudoFullscreenBtn.addEventListener('click', () => {
    exitFullscreenSafe();
  });
}

document.addEventListener('fullscreenchange', syncFullscreenUI);
document.addEventListener('webkitfullscreenchange', syncFullscreenUI);
window.addEventListener('keydown', e => {
  if (e.code === 'Escape' && stageContainer.classList.contains('is-viewport-fullscreen')) {
    exitFullscreenSafe();
  }
});

rematchBtn.addEventListener('click', () => {
  sound.unlock();
  game.roundNumber = 1;
  resetRoundFighters(false);
  enterIntroRound();
});

changeSetupBtn.addEventListener('click', () => {
  sound.unlock();
  sound.playMenu();
  setScreen('select');
});

matchToMenuBtn.addEventListener('click', () => {
  sound.unlock();
  sound.playMenu();
  setScreen('menu');
});

triggerSpecialP1Btn.addEventListener('click', () => {
  sound.unlock();
  if (game.fighters[0] && game.fighters[0].superMeter < 100) {
    game.fighters[0].superMeter = 100;
  }
  triggerAttack(0, 'special');
  triggerSpecialP1Btn.blur();
});

triggerSpecialP2Btn.addEventListener('click', () => {
  sound.unlock();
  if (game.fighters[1] && game.fighters[1].superMeter < 100) {
    game.fighters[1].superMeter = 100;
  }
  triggerAttack(1, 'special');
  triggerSpecialP2Btn.blur();
});

refillSuperBtn.addEventListener('click', () => {
  sound.unlock();
  game.fighters.forEach(f => {
    f.superMeter = 100;
  });
  sound.playConfirm();
  refillSuperBtn.blur();
});

// Démarrage sur l'Écran Titre
buildQuickArenaBar();
setScreen('menu');
gameLoop();

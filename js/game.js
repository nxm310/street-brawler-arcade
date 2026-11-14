import { FIGHTER_ORDER, FIGHTERS, ARENA_ORDER, ARENAS } from './data.js';
import { SoundEngine } from './audio.js';
import { STAGE_W, FLOOR_Y, drawArena, drawFighter, drawSpecialFX, drawEffects, drawHUD } from './renderer.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sound = new SoundEngine();

// Éléments DOM
const stageContainer = document.getElementById('stageContainer');
const menuOverlay = document.getElementById('menuOverlay');
const selectOverlay = document.getElementById('selectOverlay');
const matchOverOverlay = document.getElementById('matchOverOverlay');

const modeBotHeaderBtn = document.getElementById('modeBotHeaderBtn');
const modeLocalHeaderBtn = document.getElementById('modeLocalHeaderBtn');
const botDiffSelect = document.getElementById('botDiffSelect');
const openSelectHeaderBtn = document.getElementById('openSelectHeaderBtn');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const startSoloBtn = document.getElementById('startSoloBtn');
const startLocalBtn = document.getElementById('startLocalBtn');
const menuToSelectBtn = document.getElementById('menuToSelectBtn');

const selectTargetP1Btn = document.getElementById('selectTargetP1Btn');
const selectTargetP2Btn = document.getElementById('selectTargetP2Btn');
const p1SelectedSummary = document.getElementById('p1SelectedSummary');
const p2SelectedSummary = document.getElementById('p2SelectedSummary');
const fighterGrid = document.getElementById('fighterGrid');
const arenaGrid = document.getElementById('arenaGrid');
const launchFightBtn = document.getElementById('launchFightBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

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

// État global du jeu
const game = {
  screen: 'menu', // 'menu' | 'select' | 'intro' | 'fight' | 'roundOver' | 'matchOver'
  mode: 'bot', // 'bot' | 'local'
  botDiff: 'normal', // 'easy' | 'normal' | 'hard'
  arena: 'cod',
  p1Choice: 'darkmada',
  p2Choice: 'goldohrack',
  selectTarget: 1, // 1 ou 2 dans l'écran de sélection
  roundNumber: 1,
  timer: 99,
  announcement: '',
  announcementTimer: 0,
  phaseTimer: 0,
  tick: 0,
  shake: 0,
  specialFx: null,
  particles: [],
  floatingTexts: [],
  fighters: []
};

const keys = new Set();

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
    superMeter: 100,
    rounds: 0,
    state: 'idle', // 'idle' | 'walk' | 'jump' | 'crouch' | 'block' | 'light' | 'heavy' | 'special' | 'hit' | 'ko'
    stateTimer: 0,
    attackDidHit: false,
    comboCount: 0,
    comboTimer: 0,
    botTactic: 'observe',
    botTacticTimer: 45,
    botAttackCooldown: 55,
    botSpecialCooldown: 210,
    botMoveDir: 0,
    def
  };
}

function resetRoundFighters(keepRounds) {
  const r1 = keepRounds && game.fighters[0] ? game.fighters[0].rounds : 0;
  const r2 = keepRounds && game.fighters[1] ? game.fighters[1].rounds : 0;
  const s1 = keepRounds && game.fighters[0] ? Math.max(60, game.fighters[0].superMeter) : 100;
  const s2 = keepRounds && game.fighters[1] ? Math.max(60, game.fighters[1].superMeter) : 100;

  game.fighters = [
    createFighter(game.p1Choice, 290, 1),
    createFighter(game.p2Choice, STAGE_W - 290, -1)
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

// Initialisation initiale des combattants d'arrière-plan pour le menu
resetRoundFighters(false);

function setScreen(nextScreen) {
  game.screen = nextScreen;
  menuOverlay.hidden = nextScreen !== 'menu';
  selectOverlay.hidden = nextScreen !== 'select';
  matchOverOverlay.hidden = nextScreen !== 'matchOver';

  if (nextScreen === 'select') {
    renderSelectionUI();
  }
  updateHeaderAndBars();
}

function startMatch() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  sound.unlock();
  sound.playRoundStart();
  game.roundNumber = 1;
  resetRoundFighters(false);
  setScreen('intro');
  game.announcement = 'ROUND 1';
  game.announcementTimer = 75;
  game.phaseTimer = 90;
}

function startNextRound() {
  game.roundNumber++;
  resetRoundFighters(true);
  setScreen('intro');
  game.announcement = `ROUND ${game.roundNumber}`;
  game.announcementTimer = 75;
  game.phaseTimer = 90;
  sound.playRoundStart();
}

function spawnParticles(x, y, color, count, speed = 7) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = (0.35 + Math.random()) * speed;
    game.particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 2,
      life: 24 + Math.random() * 24,
      maxLife: 48,
      color,
      size: 4 + Math.random() * 6
    });
  }
}

function addFloatingText(x, y, text, color = '#fde047', size = 24) {
  game.floatingTexts.push({
    x,
    y,
    vy: -1.4,
    text,
    color,
    size,
    life: 44,
    maxLife: 44
  });
}

function updateHeaderAndBars() {
  modeBotHeaderBtn.classList.toggle('is-active', game.mode === 'bot');
  modeLocalHeaderBtn.classList.toggle('is-active', game.mode === 'local');
  botDiffSelect.disabled = game.mode !== 'bot';
  controlsP2Text.textContent =
    game.mode === 'bot'
      ? 'BOT IA : contrôle automatique (difficulté réglable en haut)'
      : 'J2 Local : ←/→ déplacer · ↑ sauter · ↓ garde · K léger · L lourd · O ou Entrée Spécial';

  const inFight = game.screen === 'fight';
  triggerSpecialP1Btn.disabled = !inFight;
  triggerSpecialP2Btn.disabled = !inFight || game.mode === 'bot';
  refillSuperBtn.disabled = !(game.screen === 'fight' || game.screen === 'intro');

  // Met à jour la barre rapide des arènes
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
      game.arena = id;
      sound.playMenu();
      updateHeaderAndBars();
      renderSelectionUI();
      btn.blur();
    });
    quickArenaBar.appendChild(btn);
  });
}

function renderSelectionUI() {
  const f1 = FIGHTERS[game.p1Choice];
  const f2 = FIGHTERS[game.p2Choice];
  selectTargetP1Btn.classList.toggle('is-active', game.selectTarget === 1);
  selectTargetP2Btn.classList.toggle('is-active', game.selectTarget === 2);
  selectTargetP2Btn.textContent = game.mode === 'bot' ? 'Choisir BOT' : 'Choisir J2';

  p1SelectedSummary.innerHTML = `<strong>J1 : ${f1.name}</strong> — ⚡ ${f1.specialName}`;
  p2SelectedSummary.innerHTML = `<strong>${game.mode === 'bot' ? 'BOT' : 'J2'} : ${f2.name}</strong> — ⚡ ${f2.specialName}`;

  fighterGrid.innerHTML = '';
  FIGHTER_ORDER.forEach(id => {
    const f = FIGHTERS[id];
    const isP1 = game.p1Choice === id;
    const isP2 = game.p2Choice === id;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'select-card';
    if (isP1) card.classList.add('is-p1');
    if (isP2) card.classList.add('is-p2');

    const badges = [
      isP1 ? '<span class="tag tag-p1">J1</span>' : '',
      isP2 ? `<span class="tag tag-p2">${game.mode === 'bot' ? 'BOT' : 'J2'}</span>` : ''
    ].join('');

    card.innerHTML = `
      <div class="select-card-row">
        <img src="assets/fighters/${id}_portrait.png" alt="${f.name}" class="select-portrait" width="46" height="46" />
        <div class="select-card-body">
          <div class="select-card-head">
            <span class="select-card-title">${f.name}</span>
            <span class="select-card-tags">${badges}</span>
          </div>
          <div class="select-card-sub">${f.subtitle}</div>
          <div class="select-card-special">⚡ ${f.specialName}</div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      sound.playMenu();
      if (game.selectTarget === 1) {
        game.p1Choice = id;
        game.selectTarget = 2;
      } else {
        game.p2Choice = id;
        game.selectTarget = 1;
      }
      resetRoundFighters(false);
      renderSelectionUI();
    });
    fighterGrid.appendChild(card);
  });

  arenaGrid.innerHTML = '';
  ARENA_ORDER.forEach(id => {
    const a = ARENAS[id];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'arena-card';
    if (game.arena === id) card.classList.add('is-selected');
    card.innerHTML = `
      <img src="assets/arenas/${id}.png" alt="${a.name}" class="arena-thumb" width="160" height="90" />
      <div class="arena-card-title">${a.name}</div>
      <div class="arena-card-sub">${a.subtitle}</div>
    `;
    card.addEventListener('click', () => {
      sound.playMenu();
      game.arena = id;
      renderSelectionUI();
      updateHeaderAndBars();
    });
    arenaGrid.appendChild(card);
  });
}

// --- LOGIQUE DE COMBAT & COUPS SPÉCIAUX ---
function triggerAttack(attackerIdx, type) {
  const f = game.fighters[attackerIdx];
  if (!f || game.screen !== 'fight') return;
  if (f.state === 'hit' || f.state === 'ko' || f.state === 'light' || f.state === 'heavy' || f.state === 'special') {
    return;
  }

  if (type === 'special') {
    if (f.superMeter < 100 || game.specialFx) return;
    f.superMeter = 0;
    f.state = 'special';
    f.stateTimer = 55;
    f.attackDidHit = false;
    f.vx = 0;
    game.specialFx = {
      attackerIdx,
      timer: 0,
      duration: 75,
      hitApplied: false
    };
    game.shake = 10;
    spawnParticles(f.x, f.y - 100, f.def.color, 26, 8);
    sound.playSpecial(f.id);
    return;
  }

  f.state = type;
  f.stateTimer = type === 'light' ? 18 : 28;
  f.attackDidHit = false;
  if (f.y >= FLOOR_Y) {
    f.vx = f.facing * (type === 'light' ? 2.5 : 4.2);
  }
  if (type === 'light') sound.playLight();
  else sound.playHeavy();
}

function applyHit(attackerIdx, dmg, knockback, isSpecial = false) {
  const attacker = game.fighters[attackerIdx];
  const defender = game.fighters[1 - attackerIdx];
  if (defender.state === 'ko') return;

  const isBlocking = defender.state === 'block';
  const finalDmg = isBlocking ? Math.max(2, Math.round(dmg * 0.22)) : dmg;

  defender.hp = Math.max(0, defender.hp - finalDmg);
  defender.vx = (attacker.x < defender.x ? 1 : -1) * (isBlocking ? knockback * 0.45 : knockback);

  if (isBlocking) {
    sound.playBlock();
    defender.superMeter = Math.min(100, defender.superMeter + 10);
    spawnParticles(defender.x, defender.y - 95, '#38bdf8', 14, 5);
    addFloatingText(defender.x, defender.y - 170, `GARDE -${finalDmg}`, '#38bdf8', 22);
  } else {
    defender.state = 'hit';
    defender.stateTimer = isSpecial ? 28 : 16;
    defender.comboCount++;
    defender.comboTimer = 85;
    attacker.superMeter = Math.min(100, attacker.superMeter + (isSpecial ? 0 : 18));
    defender.superMeter = Math.min(100, defender.superMeter + 12);
    game.shake = isSpecial ? 18 : 8;
    spawnParticles(defender.x, defender.y - 100, attacker.def.color, isSpecial ? 36 : 16, isSpecial ? 10 : 6);
    addFloatingText(
      defender.x,
      defender.y - 175,
      isSpecial ? `SUPER HIT -${finalDmg}!` : `-${finalDmg}`,
      isSpecial ? '#fde047' : '#ffffff',
      isSpecial ? 30 : 22
    );
  }

  if (defender.hp <= 0) {
    defender.state = 'ko';
    defender.vy = -8;
    endRound(attackerIdx, 'K.O.!');
  }
}

function endRound(winnerIdx, reasonText) {
  if (game.screen !== 'fight') return;
  sound.playKO();
  game.screen = 'roundOver';
  game.announcement = reasonText;
  game.announcementTimer = 110;
  game.phaseTimer = 115;

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
  matchWinnerSubtitle.textContent = `Score final : ${p1.rounds} - ${p2.rounds} · Arène : ${ARENAS[game.arena].name}`;
  setScreen('matchOver');
}

// --- CONTRÔLES CLAVIER (AZERTY + QWERTY) ---
function readPlayerInput(idx) {
  if (idx === 0) {
    const left = keys.has('KeyA') || keys.has('KeyQ');
    const right = keys.has('KeyD');
    const up = keys.has('KeyW') || keys.has('KeyZ');
    const down = keys.has('KeyS');
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
  if (f.state === 'hit' || f.state === 'ko' || f.state === 'light' || f.state === 'heavy' || f.state === 'special') {
    return;
  }

  const input = readPlayerInput(idx);
  const onGround = f.y >= FLOOR_Y;

  if (onGround) {
    f.facing = f.x <= opp.x ? 1 : -1;
  }

  const holdingBack = (f.facing === 1 && input.left) || (f.facing === -1 && input.right);
  const oppAttacking = opp.state === 'light' || opp.state === 'heavy' || opp.state === 'special';

  if (onGround && (input.down || (holdingBack && oppAttacking))) {
    f.vx = 0;
    f.state = holdingBack && oppAttacking ? 'block' : input.down && oppAttacking ? 'block' : 'crouch';
    return;
  }

  if (onGround && input.up) {
    f.vy = f.def.jumpForce;
    f.y -= 2;
    f.state = 'jump';
    sound.playJump();
  }

  if (input.left && !input.right) {
    f.vx = -f.def.speed;
    if (onGround) f.state = 'walk';
  } else if (input.right && !input.left) {
    f.vx = f.def.speed;
    if (onGround) f.state = 'walk';
  } else {
    f.vx *= 0.6;
    if (Math.abs(f.vx) < 0.2) f.vx = 0;
    if (onGround) f.state = 'idle';
  }
}

// --- IA DU BOT RÉALISTE (1J vs BOT) ---
function pickBotTactic(bot, dist) {
  const r = Math.random();
  if (dist > 420) {
    if (r < 0.45) return { tactic: 'approach', dur: 28 + Math.floor(Math.random() * 22) };
    if (r < 0.80) return { tactic: 'footsies', dur: 32 + Math.floor(Math.random() * 24) };
    return { tactic: 'observe', dur: 30 + Math.floor(Math.random() * 22) };
  }
  if (dist >= 175) {
    if (r < 0.32) return { tactic: 'observe', dur: 28 + Math.floor(Math.random() * 24) };
    if (r < 0.65) return { tactic: 'footsies', dur: 34 + Math.floor(Math.random() * 26) };
    if (r < 0.85) return { tactic: 'approach', dur: 24 + Math.floor(Math.random() * 18) };
    return { tactic: 'retreat', dur: 22 + Math.floor(Math.random() * 18) };
  }
  // Courte portée : laisse respirer l'échange après un coup
  if (r < 0.35) return { tactic: 'retreat', dur: 26 + Math.floor(Math.random() * 18) };
  if (r < 0.60) return { tactic: 'observe', dur: 24 + Math.floor(Math.random() * 20) };
  if (r < 0.85) return { tactic: 'approach', dur: 20 + Math.floor(Math.random() * 14) };
  return { tactic: 'footsies', dur: 24 + Math.floor(Math.random() * 16) };
}

function updateBotFighter() {
  const bot = game.fighters[1];
  const player = game.fighters[0];
  if (bot.state === 'hit' || bot.state === 'ko' || bot.state === 'light' || bot.state === 'heavy' || bot.state === 'special') {
    return;
  }

  const onGround = bot.y >= FLOOR_Y;
  const dirToPlayer = bot.x <= player.x ? 1 : -1;
  if (onGround) bot.facing = dirToPlayer;

  if (bot.botAttackCooldown > 0) bot.botAttackCooldown--;
  if (bot.botSpecialCooldown > 0) bot.botSpecialCooldown--;
  if (bot.botTacticTimer > 0) bot.botTacticTimer--;

  const dist = Math.abs(bot.x - player.x);
  const playerAttacking = player.state === 'light' || player.state === 'heavy' || player.state === 'special';

  const diff = game.botDiff;
  const blockChance = diff === 'easy' ? 0.22 : diff === 'normal' ? 0.45 : 0.65;
  const atkRecovery = diff === 'easy' ? 80 : diff === 'normal' ? 55 : 38;
  const specialRate = diff === 'easy' ? 0.008 : diff === 'normal' ? 0.022 : 0.04;

  // Réaction défensive réaliste quand le joueur attaque tout près
  if (onGround && playerAttacking && dist < 220 && bot.botTactic !== 'defend') {
    if (Math.random() < blockChance) {
      bot.botTactic = 'defend';
      bot.botTacticTimer = 18;
    }
  }

  if (bot.botTactic === 'defend') {
    bot.vx = 0;
    bot.state = 'block';
    if (bot.botTacticTimer <= 0) {
      bot.botTactic = Math.random() < 0.5 ? 'retreat' : 'observe';
      bot.botTacticTimer = 26;
    }
    return;
  }

  // Coup spécial modéré avec délai de récupération (jamais dès la 1ère seconde)
  if (bot.superMeter >= 100 && !game.specialFx && bot.botSpecialCooldown <= 0 && dist < 760 && Math.random() < specialRate) {
    bot.botSpecialCooldown = 260;
    bot.botAttackCooldown = atkRecovery + 20;
    triggerAttack(1, 'special');
    return;
  }

  if (bot.botTacticTimer <= 0) {
    const picked = pickBotTactic(bot, dist);
    bot.botTactic = picked.tactic;
    bot.botTacticTimer = picked.dur;
    if (bot.botTactic === 'footsies') {
      if (dist > 310) bot.botMoveDir = dirToPlayer;
      else if (dist < 210) bot.botMoveDir = -dirToPlayer;
      else bot.botMoveDir = Math.random() < 0.5 ? dirToPlayer : -dirToPlayer;
    }
  }

  // Déplacement tactique selon la phase actuelle
  const speedScale = diff === 'easy' ? 0.72 : diff === 'normal' ? 0.85 : 0.95;
  if (bot.botTactic === 'observe') {
    bot.vx = 0;
  } else if (bot.botTactic === 'retreat') {
    bot.vx = -dirToPlayer * bot.def.speed * 0.72 * speedScale;
  } else if (bot.botTactic === 'footsies') {
    bot.vx = bot.botMoveDir * bot.def.speed * 0.58 * speedScale;
  } else if (bot.botTactic === 'approach') {
    bot.vx = dist > 155 ? dirToPlayer * bot.def.speed * 0.85 * speedScale : 0;
    // Petit saut d'approche occasionnel
    if (onGround && dist > 230 && dist < 380 && Math.random() < 0.015) {
      bot.vy = bot.def.jumpForce;
      bot.y -= 2;
      bot.state = 'jump';
    }
  }

  // Attaque uniquement si à portée et cooldown terminé, puis reprise de distance
  if (dist < 180 && bot.botAttackCooldown <= 0 && (bot.botTactic === 'approach' || (bot.botTactic === 'footsies' && Math.random() < 0.06))) {
    bot.botAttackCooldown = atkRecovery;
    bot.botTactic = Math.random() < 0.55 ? 'retreat' : 'observe';
    bot.botTacticTimer = 28 + Math.floor(Math.random() * 24);
    triggerAttack(1, Math.random() < 0.65 ? 'light' : 'heavy');
    return;
  }

  if (onGround) {
    bot.state = Math.abs(bot.vx) > 0.4 ? 'walk' : 'idle';
  }
}

// --- BOUCLE PRINCIPALE 60 FPS ---
function stepPhysics() {
  game.tick++;

  if (game.shake > 0) {
    game.shake *= 0.86;
    if (game.shake < 0.5) game.shake = 0;
  }

  if (game.announcementTimer > 0) game.announcementTimer--;

  // Particules & textes flottants
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.25;
    p.life--;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
  for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
    const ft = game.floatingTexts[i];
    ft.y += ft.vy;
    ft.life--;
    if (ft.life <= 0) game.floatingTexts.splice(i, 1);
  }

  // Gestion des transitions d'états
  if (game.screen === 'intro') {
    game.phaseTimer--;
    if (game.phaseTimer === 32) {
      game.announcement = 'FIGHT!';
      game.announcementTimer = 32;
    }
    if (game.phaseTimer <= 0) {
      setScreen('fight');
    }
    return;
  }

  if (game.screen === 'roundOver') {
    game.phaseTimer--;
    // Gravité pour le combattant KO
    game.fighters.forEach(f => {
      f.vy += 0.85;
      f.y = Math.min(FLOOR_Y, f.y + f.vy);
      if (f.y >= FLOOR_Y) f.vy = 0;
      f.vx *= 0.85;
      f.x = Math.max(95, Math.min(STAGE_W - 95, f.x + f.vx));
      if (f.trailHp > f.hp) f.trailHp = Math.max(f.hp, f.trailHp - 0.6);
    });

    if (game.phaseTimer <= 0) {
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

  // Timer de manche (~60 ticks = 1 seconde)
  game.timer = Math.max(0, game.timer - 1 / 60);
  if (game.timer <= 0) {
    const [p1, p2] = game.fighters;
    const winner = p1.hp === p2.hp ? -1 : p1.hp > p2.hp ? 0 : 1;
    endRound(winner, 'TIME OVER!');
    return;
  }

  // Effet spécial en cours
  if (game.specialFx) {
    const sp = game.specialFx;
    sp.timer++;
    if (sp.timer === 30 && !sp.hitApplied) {
      sp.hitApplied = true;
      const attacker = game.fighters[sp.attackerIdx];
      const defender = game.fighters[1 - sp.attackerIdx];
      if (Math.abs(attacker.x - defender.x) < 1050) {
        applyHit(sp.attackerIdx, attacker.def.specialDmg, 14, true);
      }
    }
    if (sp.timer >= sp.duration) {
      game.specialFx = null;
    }
  }

  // Entrées joueurs / Bot (suspendues durant les 20 premières frames de Super Freeze)
  const freezeActive = game.specialFx && game.specialFx.timer < 20;
  if (!freezeActive) {
    updateHumanFighter(0);
    if (game.mode === 'local') updateHumanFighter(1);
    else updateBotFighter();
  }

  // Physique & Collisions d'attaques
  game.fighters.forEach((f, idx) => {
    if (f.trailHp > f.hp) f.trailHp = Math.max(f.hp, f.trailHp - 0.5);
    if (f.comboTimer > 0) f.comboTimer--;
    else f.comboCount = 0;

    if (f.stateTimer > 0) {
      f.stateTimer--;
      if (f.state === 'light' || f.state === 'heavy') {
        const opp = game.fighters[1 - idx];
        const reach = f.state === 'light' ? 168 : 198;
        const active = f.state === 'light' ? f.stateTimer >= 7 && f.stateTimer <= 13 : f.stateTimer >= 10 && f.stateTimer <= 18;
        const facingTarget = (f.facing === 1 && opp.x >= f.x - 25) || (f.facing === -1 && opp.x <= f.x + 25);
        if (active && !f.attackDidHit && facingTarget && Math.abs(f.x - opp.x) <= reach && Math.abs(f.y - opp.y) <= 155) {
          f.attackDidHit = true;
          const dmg = f.state === 'light' ? f.def.lightDmg : f.def.heavyDmg;
          applyHit(idx, dmg, f.state === 'light' ? 6 : 11, false);
        }
      }
      if (f.stateTimer === 0 && f.state !== 'ko') {
        f.state = f.y < FLOOR_Y ? 'jump' : 'idle';
      }
    }

    if (!freezeActive) {
      f.vy += 0.85;
      f.x += f.vx;
      f.y += f.vy;

      if (f.y >= FLOOR_Y) {
        f.y = FLOOR_Y;
        f.vy = 0;
        if (f.state === 'jump') f.state = 'idle';
      }
      f.x = Math.max(135, Math.min(STAGE_W - 135, f.x));
    }
  });

  // Répulsion mutuelle pour éviter la superposition totale
  const [f1, f2] = game.fighters;
  if (Math.abs(f1.x - f2.x) < 112 && Math.abs(f1.y - f2.y) < 130) {
    const push = (112 - Math.abs(f1.x - f2.x)) * 0.5;
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

  drawArena(ctx, game.arena, game.tick);
  drawFighter(ctx, game.fighters[0], game.tick);
  drawFighter(ctx, game.fighters[1], game.tick + 15);
  drawSpecialFX(ctx, game.specialFx, game.fighters);
  drawEffects(ctx, game.particles, game.floatingTexts);

  if (game.screen === 'intro' || game.screen === 'fight' || game.screen === 'roundOver') {
    drawHUD(ctx, game);
  }
  ctx.restore();
}

function gameLoop() {
  stepPhysics();
  render();
  requestAnimationFrame(gameLoop);
}

// --- ÉVÉNEMENTS CLAVIER & BOUTONS ---
window.addEventListener('keydown', e => {
  if (game.screen === 'fight' || game.screen === 'intro') {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }
  if (e.repeat) return;
  keys.add(e.code);

  if (game.screen !== 'fight') return;

  if (e.code === 'KeyF') triggerAttack(0, 'light');
  else if (e.code === 'KeyG') triggerAttack(0, 'heavy');
  else if (e.code === 'KeyR' || e.code === 'Space') triggerAttack(0, 'special');

  if (game.mode === 'local') {
    if (e.code === 'KeyK') triggerAttack(1, 'light');
    else if (e.code === 'KeyL') triggerAttack(1, 'heavy');
    else if (e.code === 'KeyO' || e.code === 'Enter') triggerAttack(1, 'special');
  }
});

window.addEventListener('keyup', e => {
  keys.delete(e.code);
});

window.addEventListener('blur', () => {
  keys.clear();
});

// Événements Interface
modeBotHeaderBtn.addEventListener('click', () => {
  game.mode = 'bot';
  sound.playMenu();
  updateHeaderAndBars();
  if (game.screen === 'select') renderSelectionUI();
  modeBotHeaderBtn.blur();
});

modeLocalHeaderBtn.addEventListener('click', () => {
  game.mode = 'local';
  sound.playMenu();
  updateHeaderAndBars();
  if (game.screen === 'select') renderSelectionUI();
  modeLocalHeaderBtn.blur();
});

botDiffSelect.addEventListener('change', e => {
  game.botDiff = e.target.value;
  botDiffSelect.blur();
});

openSelectHeaderBtn.addEventListener('click', () => {
  sound.playMenu();
  setScreen('select');
  openSelectHeaderBtn.blur();
});

audioToggleBtn.addEventListener('click', () => {
  const muted = sound.toggleMute();
  audioToggleBtn.textContent = muted ? 'Audio : OFF' : 'Audio : ON';
  if (!muted) sound.playMenu();
  audioToggleBtn.blur();
});

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    stageContainer.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
  fullscreenBtn.blur();
});

startSoloBtn.addEventListener('click', () => {
  game.mode = 'bot';
  startMatch();
});

startLocalBtn.addEventListener('click', () => {
  game.mode = 'local';
  startMatch();
});

menuToSelectBtn.addEventListener('click', () => {
  sound.playMenu();
  setScreen('select');
});

selectTargetP1Btn.addEventListener('click', () => {
  game.selectTarget = 1;
  renderSelectionUI();
});

selectTargetP2Btn.addEventListener('click', () => {
  game.selectTarget = 2;
  renderSelectionUI();
});

launchFightBtn.addEventListener('click', startMatch);
backToMenuBtn.addEventListener('click', () => {
  sound.playMenu();
  setScreen('menu');
});

rematchBtn.addEventListener('click', startMatch);
changeSetupBtn.addEventListener('click', () => {
  sound.playMenu();
  setScreen('select');
});
matchToMenuBtn.addEventListener('click', () => {
  sound.playMenu();
  setScreen('menu');
});

triggerSpecialP1Btn.addEventListener('click', () => {
  if (game.fighters[0] && game.fighters[0].superMeter < 100) {
    game.fighters[0].superMeter = 100;
  }
  triggerAttack(0, 'special');
  triggerSpecialP1Btn.blur();
});

triggerSpecialP2Btn.addEventListener('click', () => {
  if (game.fighters[1] && game.fighters[1].superMeter < 100) {
    game.fighters[1].superMeter = 100;
  }
  triggerAttack(1, 'special');
  triggerSpecialP2Btn.blur();
});

refillSuperBtn.addEventListener('click', () => {
  game.fighters.forEach(f => {
    f.superMeter = 100;
  });
  sound.playMenu();
  refillSuperBtn.blur();
});

// Démarrage
buildQuickArenaBar();
setScreen('menu');
gameLoop();

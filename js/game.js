import { FIGHTER_ORDER, FIGHTERS, ARENA_ORDER, ARENAS } from './data.js';
import { SoundEngine } from './audio.js';
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
  drawVsScreen
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
const audioToggleBtn = document.getElementById('audioToggleBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

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
  screen: 'menu', // 'menu' | 'select' | 'map' | 'vs' | 'intro' | 'fight' | 'roundOver' | 'matchOver'
  mode: 'bot', // 'bot' | 'local'
  botDiff: 'normal', // 'easy' | 'normal' | 'hard'
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
    superMeter: 0, // Démarre à 0% et se recharge avec les coups portés !
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
    sound.setMusicMode('none');
  } else if (nextScreen === 'intro' || nextScreen === 'fight') {
    sound.setMusicMode('fight');
  } else if (nextScreen === 'matchOver') {
    sound.setMusicMode('victory');
  }

  updateHeaderAndBars();
}

function startTourAndFight() {
  if (document.activeElement instanceof HTMLElement && document.activeElement !== canvas) {
    document.activeElement.blur();
  }
  sound.unlock();
  sound.playConfirm();
  game.roundNumber = 1;
  resetRoundFighters(false);

  // Lance d'abord la Carte de France animée (pointillés d'une ville à l'autre)
  game.phaseDuration = 155;
  game.phaseTimer = 155;
  setScreen('map');
}

function enterVsScreen() {
  game.phaseDuration = 110;
  game.phaseTimer = 110;
  setScreen('vs');
  sound.playVsFanfare();
}

function enterIntroRound() {
  sound.playRoundStart();
  setScreen('intro');
  game.announcement = `ROUND ${game.roundNumber}`;
  game.announcementTimer = 75;
  game.phaseDuration = 90;
  game.phaseTimer = 90;
}

function startNextRound() {
  game.roundNumber++;
  resetRoundFighters(true);
  enterIntroRound();
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
      : 'J2 Local : ←/→ bouger · ↑ sauter · ↓ garde · K/L frapper · Maj Droite ou O Spécial';

  const inFight = game.screen === 'fight';
  triggerSpecialP1Btn.disabled = !inFight;
  triggerSpecialP2Btn.disabled = !inFight || game.mode === 'bot';
  refillSuperBtn.disabled = !(game.screen === 'fight' || game.screen === 'intro');

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
function triggerAttack(attackerIdx, type) {
  const f = game.fighters[attackerIdx];
  if (!f || game.screen !== 'fight') return;
  if (f.state === 'hit' || f.state === 'ko' || f.state === 'light' || f.state === 'heavy' || f.state === 'special') {
    return;
  }

  if (type === 'special') {
    if (f.superMeter < 100 || game.specialFx) {
      if (f.superMeter < 100) {
        addFloatingText(f.x, f.y - 230, `SPÉCIAL ${Math.round(f.superMeter)}%`, '#38bdf8', 18);
      }
      return;
    }
    f.superMeter = 0;
    f.state = 'special';
    f.stateTimer = 55;
    f.attackDidHit = false;
    f.vx = 0;
    game.specialFx = {
      attackerIdx,
      timer: 0,
      duration: 78,
      hitApplied: false
    };
    game.shake = 10;
    spawnParticles(f.x, f.y - 120, f.def.color, 26, 8);
    sound.playSpecial(f.id);
    return;
  }

  f.state = type;
  f.stateTimer = type === 'light' ? 18 : 28;
  f.attackDidHit = false;
  if (f.y >= FLOOR_Y) {
    f.vx = f.facing * (type === 'light' ? 3.2 : 4.8);
  }
  if (type === 'light') sound.playLight();
  else sound.playHeavy();
}

function applyHit(attackerIdx, dmg, knockback, isSpecial = false, attackKind = 'light') {
  const attacker = game.fighters[attackerIdx];
  const defender = game.fighters[1 - attackerIdx];
  if (defender.state === 'ko') return;

  const isBlocking = defender.state === 'block';
  const finalDmg = isBlocking ? Math.max(2, Math.round(dmg * 0.25)) : dmg;

  defender.hp = Math.max(0, defender.hp - finalDmg);
  defender.vx = (attacker.x < defender.x ? 1 : -1) * (isBlocking ? knockback * 0.45 : knockback);

  // Recharge progressive du Coup Spécial en fonction des coups donnés
  const meterGain = isSpecial
    ? 0
    : isBlocking
      ? 8
      : attackKind === 'heavy'
        ? 26
        : 18;
  attacker.superMeter = Math.min(100, attacker.superMeter + meterGain);
  defender.superMeter = Math.min(100, defender.superMeter + 6);

  if (isBlocking) {
    sound.playBlock();
    spawnParticles(defender.x, defender.y - 95, '#38bdf8', 14, 5);
    addFloatingText(defender.x, defender.y - 175, `GARDE -${finalDmg}%`, '#38bdf8', 22);
  } else {
    defender.state = 'hit';
    defender.stateTimer = isSpecial ? 26 : 14;
    defender.comboCount++;
    defender.comboTimer = 85;
    game.shake = isSpecial ? 16 : 8;
    const hitCol = attacker.id === 'darkmada' && isSpecial ? '#f472b6' : attacker.def.color;
    spawnParticles(defender.x, defender.y - 110, hitCol, isSpecial ? 36 : 16, isSpecial ? 10 : 6);
    addFloatingText(
      defender.x,
      defender.y - 185,
      isSpecial
        ? attacker.id === 'darkmada'
          ? `BISOUS ♥ -${finalDmg}%`
          : `SUPER -${finalDmg}%!`
        : `-${finalDmg}%`,
      isSpecial ? '#fde047' : '#ffffff',
      isSpecial ? 30 : 24
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
  matchWinnerSubtitle.textContent = `Score final : ${p1.rounds} - ${p2.rounds} · Arène : ${ARENAS[game.arena].name} (${p2.def.city})`;
  setScreen('matchOver');
}

// --- CONTRÔLES CLAVIER (SAUTER = ESPACE, FRAPPER = F, SPÉCIAL = ENTRÉE) ---
function readPlayerInput(idx) {
  if (idx === 0) {
    const left = keys.has('KeyA') || keys.has('KeyQ') || (game.mode === 'bot' && keys.has('ArrowLeft'));
    const right = keys.has('KeyD') || (game.mode === 'bot' && keys.has('ArrowRight'));
    const up = keys.has('Space') || keys.has('KeyW') || keys.has('KeyZ');
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
    f.state = oppAttacking ? 'block' : 'crouch';
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
  if (dist >= 195) {
    if (r < 0.32) return { tactic: 'observe', dur: 28 + Math.floor(Math.random() * 24) };
    if (r < 0.65) return { tactic: 'footsies', dur: 34 + Math.floor(Math.random() * 26) };
    if (r < 0.85) return { tactic: 'approach', dur: 24 + Math.floor(Math.random() * 18) };
    return { tactic: 'retreat', dur: 22 + Math.floor(Math.random() * 18) };
  }
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
  const blockChance = diff === 'easy' ? 0.22 : diff === 'normal' ? 0.42 : 0.62;
  const atkRecovery = diff === 'easy' ? 82 : diff === 'normal' ? 56 : 38;
  const specialRate = diff === 'easy' ? 0.008 : diff === 'normal' ? 0.022 : 0.04;

  if (onGround && playerAttacking && dist < 245 && bot.botTactic !== 'defend') {
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

  if (bot.superMeter >= 100 && !game.specialFx && bot.botSpecialCooldown <= 0 && dist < 780 && Math.random() < specialRate) {
    bot.botSpecialCooldown = 240;
    bot.botAttackCooldown = atkRecovery + 20;
    triggerAttack(1, 'special');
    return;
  }

  if (bot.botTacticTimer <= 0) {
    const picked = pickBotTactic(bot, dist);
    bot.botTactic = picked.tactic;
    bot.botTacticTimer = picked.dur;
    if (bot.botTactic === 'footsies') {
      if (dist > 320) bot.botMoveDir = dirToPlayer;
      else if (dist < 220) bot.botMoveDir = -dirToPlayer;
      else bot.botMoveDir = Math.random() < 0.5 ? dirToPlayer : -dirToPlayer;
    }
  }

  const speedScale = diff === 'easy' ? 0.72 : diff === 'normal' ? 0.85 : 0.95;
  if (bot.botTactic === 'observe') {
    bot.vx = 0;
  } else if (bot.botTactic === 'retreat') {
    bot.vx = -dirToPlayer * bot.def.speed * 0.72 * speedScale;
  } else if (bot.botTactic === 'footsies') {
    bot.vx = bot.botMoveDir * bot.def.speed * 0.58 * speedScale;
  } else if (bot.botTactic === 'approach') {
    bot.vx = dist > 180 ? dirToPlayer * bot.def.speed * 0.85 * speedScale : 0;
    if (onGround && dist > 250 && dist < 400 && Math.random() < 0.015) {
      bot.vy = bot.def.jumpForce;
      bot.y -= 2;
      bot.state = 'jump';
    }
  }

  if (dist < 225 && bot.botAttackCooldown <= 0 && (bot.botTactic === 'approach' || (bot.botTactic === 'footsies' && Math.random() < 0.06))) {
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

  // Timer de manche
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
      if (Math.abs(attacker.x - defender.x) < 1100) {
        applyHit(sp.attackerIdx, attacker.def.specialDmg, 14, true, 'special');
      }
    }
    if (sp.timer >= sp.duration) {
      game.specialFx = null;
    }
  }

  const freezeActive = game.specialFx && game.specialFx.timer < 18;
  if (!freezeActive) {
    updateHumanFighter(0);
    if (game.mode === 'local') updateHumanFighter(1);
    else updateBotFighter();
  }

  // Physique & Collisions d'attaques avec portée alignée sur les sprites pixel-art
  game.fighters.forEach((f, idx) => {
    if (f.trailHp > f.hp) f.trailHp = Math.max(f.hp, f.trailHp - 0.55);
    if (f.comboTimer > 0) f.comboTimer--;
    else f.comboCount = 0;

    if (f.stateTimer > 0) {
      f.stateTimer--;
      if (f.state === 'light' || f.state === 'heavy') {
        const opp = game.fighters[1 - idx];
        const reach = f.state === 'light' ? 250 : 285;
        const active = f.state === 'light' ? f.stateTimer >= 5 && f.stateTimer <= 15 : f.stateTimer >= 8 && f.stateTimer <= 22;
        const facingTarget = (f.facing === 1 && opp.x >= f.x - 45) || (f.facing === -1 && opp.x <= f.x + 45);
        if (active && !f.attackDidHit && facingTarget && Math.abs(f.x - opp.x) <= reach && Math.abs(f.y - opp.y) <= 185) {
          f.attackDidHit = true;
          const dmg = f.state === 'light' ? f.def.lightDmg : f.def.heavyDmg;
          applyHit(idx, dmg, f.state === 'light' ? 7 : 12, false, f.state);
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
    drawArena(ctx, game.arena, game.tick);
    drawFighter(ctx, game.fighters[0], game.tick);
    drawFighter(ctx, game.fighters[1], game.tick + 15);
    drawSpecialFX(ctx, game.specialFx, game.fighters);
    drawEffects(ctx, game.particles, game.floatingTexts);

    if (game.screen === 'intro' || game.screen === 'fight' || game.screen === 'roundOver') {
      drawHUD(ctx, game);
    }
  }

  ctx.restore();
}

function gameLoop() {
  stepPhysics();
  render();
  requestAnimationFrame(gameLoop);
}

// --- INTERACTIONS SOURIS SUR LE CANVAS ---
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

canvas.addEventListener('mousedown', e => {
  sound.unlock();
  if (!sound.muted && sound.musicMode !== 'none') {
    // Relance le séquenceur dès la première interaction utilisateur
    const mode = sound.musicMode;
    sound.setMusicMode('none');
    sound.setMusicMode(mode);
  }
  canvas.focus();

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
  sound.unlock();

  const activeTag = document.activeElement?.tagName;
  const isFormFocus = activeTag === 'BUTTON' || activeTag === 'SELECT';

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && !isFormFocus) {
    e.preventDefault();
  }

  if (e.repeat) return;
  keys.add(e.code);

  // Navigation Écran Titre
  if (game.screen === 'menu') {
    if (!isFormFocus && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space' || e.code === 'KeyF')) {
      e.preventDefault();
      sound.playConfirm();
      setScreen('select');
    }
    return;
  }

  // Navigation Écran Sélection
  if (game.screen === 'select') {
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

  // Touches de Combat : Frapper = F (G lourd), Sauter = ESPACE, Coup Spécial = ENTRÉE
  if (e.code === 'KeyF') {
    triggerAttack(0, 'light');
  } else if (e.code === 'KeyG') {
    triggerAttack(0, 'heavy');
  } else if (e.code === 'Enter' || (game.mode === 'bot' && e.code === 'NumpadEnter')) {
    e.preventDefault();
    triggerAttack(0, 'special');
  }

  if (game.mode === 'local') {
    if (e.code === 'KeyK') triggerAttack(1, 'light');
    else if (e.code === 'KeyL') triggerAttack(1, 'heavy');
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
  game.mode = 'bot';
  game.selectTarget = 1;
  sound.playMenu();
  updateHeaderAndBars();
  modeBotHeaderBtn.blur();
});

modeLocalHeaderBtn.addEventListener('click', () => {
  sound.unlock();
  game.mode = 'local';
  game.selectTarget = 2;
  sound.playMenu();
  updateHeaderAndBars();
  modeLocalHeaderBtn.blur();
});

botDiffSelect.addEventListener('change', e => {
  game.botDiff = e.target.value;
  botDiffSelect.blur();
});

openSelectHeaderBtn.addEventListener('click', () => {
  sound.unlock();
  sound.playMenu();
  setScreen('select');
  openSelectHeaderBtn.blur();
});

audioToggleBtn.addEventListener('click', () => {
  sound.unlock();
  const muted = sound.toggleMute();
  audioToggleBtn.textContent = muted ? 'Musique 8-bit : OFF' : 'Musique 8-bit : ON';
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

import { FIGHTERS, FIGHTER_ORDER, ARENAS, ARENA_ORDER } from './data.js';

export const STAGE_W = 1280;
export const STAGE_H = 720;
export const FLOOR_Y = 640;

const ASSETS = {
  arenas: {},
  fighters: {},
  ui: {}
};

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

ARENA_ORDER.forEach(id => {
  ASSETS.arenas[id] = loadImage(`assets/arenas/${id}.png`);
});

FIGHTER_ORDER.forEach(id => {
  ASSETS.fighters[id] = {
    idle: loadImage(`assets/fighters/${id}_idle.png`),
    idle2: loadImage(`assets/fighters/${id}_idle2.png`),
    walk: loadImage(`assets/fighters/${id}_walk.png`),
    walk2: loadImage(`assets/fighters/${id}_walk2.png`),
    crouch: loadImage(`assets/fighters/${id}_crouch.png`),
    crouch_punch: loadImage(`assets/fighters/${id}_crouch_punch.png`),
    jump: loadImage(`assets/fighters/${id}_jump.png`),
    punch1: loadImage(`assets/fighters/${id}_punch1.png`),
    punch: loadImage(`assets/fighters/${id}_punch.png`),
    kick1: loadImage(`assets/fighters/${id}_kick1.png`),
    kick: loadImage(`assets/fighters/${id}_kick.png`),
    sweep: loadImage(`assets/fighters/${id}_sweep.png`),
    headbutt: loadImage(`assets/fighters/${id}_headbutt.png`),
    shoryuken: loadImage(`assets/fighters/${id}_shoryuken.png`),
    spinkick: loadImage(`assets/fighters/${id}_spinkick.png`),
    parry: loadImage(`assets/fighters/${id}_parry.png`),
    hit: loadImage(`assets/fighters/${id}_hit.png`),
    attack: loadImage(`assets/fighters/${id}_attack.png`),
    portrait: loadImage(`assets/fighters/${id}_portrait.png`)
  };
});
ASSETS.fighters.koll.special = loadImage('assets/fighters/koll_special.png');
ASSETS.fighters.goldohrack.special = loadImage('assets/fighters/goldohrack_special.png');
ASSETS.fighters.darkmada.special = loadImage('assets/fighters/darkmada_special.png');
ASSETS.extras = {
  goldohrackFist: loadImage('assets/fighters/goldohrack_fist.png'),
  sushiSolo: loadImage('assets/fighters/sushi_solo.png'),
  sushiIdle: loadImage('assets/fighters/sushi_idle.png')
};

ASSETS.ui.titleScreen = loadImage('assets/ui/title_screen.png');
ASSETS.ui.franceMap = loadImage('assets/ui/france_map.png');

/**
 * Zones cliquables exactes de l'écran de sélection Canvas (coordonnées 1280x720).
 */
export function getSelectLayout() {
  const cardW = 136;
  const cardH = 136;
  const gap = 28;
  const totalW = FIGHTER_ORDER.length * cardW + (FIGHTER_ORDER.length - 1) * gap;
  const startX = Math.round((STAGE_W - totalW) / 2);
  const portraitRowY = 472;

  const fighterRects = FIGHTER_ORDER.map((id, idx) => ({
    id,
    x: startX + idx * (cardW + gap),
    y: portraitRowY,
    w: cardW,
    h: cardH
  }));

  const arenaPillW = 174;
  const arenaPillH = 34;
  const arenaCols = 3;
  const arenaStartX = 354;
  const arenaStartY = 330;
  const arenaRects = ARENA_ORDER.map((id, idx) => {
    const col = idx % arenaCols;
    const row = Math.floor(idx / arenaCols);
    return {
      id,
      x: arenaStartX + col * (arenaPillW + 14),
      y: arenaStartY + row * (arenaPillH + 10),
      w: arenaPillW,
      h: arenaPillH
    };
  });

  return {
    fighterRects,
    arenaRects,
    p2PanelRect: { x: 938, y: 88, w: 302, h: 332 },
    modeBadgeRect: { x: 470, y: 92, w: 300, h: 46 },
    launchBtnRect: { x: 370, y: 658, w: 540, h: 44 }
  };
}

function pxText(ctx, text, x, y, color = '#ffffff', shadow = '#000000', offset = 3) {
  ctx.fillStyle = shadow;
  ctx.fillText(text, Math.round(x) + offset, Math.round(y) + offset);
  ctx.fillStyle = color;
  ctx.fillText(text, Math.round(x), Math.round(y));
}

function drawPixelHeart(ctx, cx, cy, size = 4, outerCol = '#e11d48', innerCol = '#fda4af') {
  const shape = [
    '..XX..XX..',
    '.XXXXXXXX.',
    'XXXXXXXXXX',
    'XXXXXXXXXX',
    '.XXXXXXXX.',
    '..XXXXXX..',
    '...XXXX...',
    '....XX....'
  ];
  const sx = Math.round(cx - 5 * size);
  const sy = Math.round(cy - 4 * size);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 'X') {
        const isInner = r >= 1 && r <= 4 && c >= 2 && c <= 7 && !(r === 1 && (c === 4 || c === 5));
        ctx.fillStyle = isInner ? innerCol : outerCol;
        ctx.fillRect(sx + c * size, sy + r * size, size, size);
      }
    }
  }
}

function drawPixelBone(ctx, cx, cy, s = 5) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 5 * s - 2, cy - 2 * s - 2, 10 * s + 4, 4 * s + 4);
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(cx - 3 * s, cy - s, 6 * s, 2 * s);
  // Extrémités de l'os
  ctx.fillRect(cx - 5 * s, cy - 2 * s, 2 * s, 2 * s);
  ctx.fillRect(cx - 5 * s, cy, 2 * s, 2 * s);
  ctx.fillRect(cx + 3 * s, cy - 2 * s, 2 * s, 2 * s);
  ctx.fillRect(cx + 3 * s, cy, 2 * s, 2 * s);
}

function drawPixelTennisBall(ctx, cx, cy, s = 4) {
  const bx = Math.round(cx - 3 * s);
  const by = Math.round(cy - 3 * s);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(bx - s, by, 8 * s, 6 * s);
  ctx.fillRect(bx, by - s, 6 * s, 8 * s);
  ctx.fillStyle = '#a3e635';
  ctx.fillRect(bx, by, 6 * s, 6 * s);
  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(bx + s, by + s, s, 4 * s);
  ctx.fillRect(bx + 4 * s, by + s, s, 4 * s);
}

function drawStepLightning(ctx, x1, y1, x2, y2, colorCore, colorOuter, stepPx = 6, seed = 1) {
  const segments = 12;
  let px = x1;
  let py = y1;
  for (let i = 1; i <= segments; i++) {
    const k = i / segments;
    const jitter = i === segments ? 0 : Math.round(Math.sin(i * 3.7 + seed) * 26);
    const nx = Math.round(x1 + (x2 - x1) * k);
    const ny = Math.round(y1 + (y2 - y1) * k + jitter);

    // Segment en escalier 100% pixelisé (horizontal puis vertical)
    const minX = Math.min(px, nx);
    const w = Math.max(stepPx, Math.abs(nx - px));
    ctx.fillStyle = colorOuter;
    ctx.fillRect(minX, py - stepPx, w, stepPx * 2);
    ctx.fillStyle = colorCore;
    ctx.fillRect(minX, py - Math.floor(stepPx / 2), w, stepPx);

    const minY = Math.min(py, ny);
    const h = Math.max(stepPx, Math.abs(ny - py));
    ctx.fillStyle = colorOuter;
    ctx.fillRect(nx - stepPx, minY, stepPx * 2, h);
    ctx.fillStyle = colorCore;
    ctx.fillRect(nx - Math.floor(stepPx / 2), minY, stepPx, h);

    px = nx;
    py = ny;
  }
}

/**
 * Dessine l'arène 16-bit pixelisée + effets d'ambiance animés + scanlines arcade.
 */
export function drawArena(ctx, arenaId, t) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const bg = ASSETS.arenas[arenaId];
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, STAGE_W, STAGE_H);
  } else {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  if (arenaId === 'biker' || arenaId === 'cod') {
    for (let i = 0; i < 14; i++) {
      const px = ((i * 97 + t * 0.6) % STAGE_W) | 0;
      const py = (FLOOR_Y - 20 - ((t * 1.4 + i * 47) % 260)) | 0;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(251, 146, 60, 0.7)' : 'rgba(253, 224, 71, 0.65)';
      ctx.fillRect(px, py, 4, 4);
    }
  } else if (arenaId === 'viking') {
    for (let i = 0; i < 20; i++) {
      const sx = ((i * 131 + Math.sin(t * 0.02 + i) * 35 + STAGE_W) % STAGE_W) | 0;
      const sy = ((t * 1.1 + i * 67) % FLOOR_Y) | 0;
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.fillRect(sx, sy, 4, 4);
    }
  } else if (arenaId === 'starcitizen') {
    const pulse = 0.08 + 0.06 * Math.sin(t * 0.08);
    ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.fillRect(0, FLOOR_Y - 4, STAGE_W, 8);
  } else if (arenaId === 'nuclear') {
    for (let i = 0; i < 18; i++) {
      const nx = (80 + ((i * 68 + Math.sin(t * 0.03 + i) * 20) % (STAGE_W - 160))) | 0;
      const ny = (FLOOR_Y - 24 - ((t * 1.2 + i * 53) % 320)) | 0;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(250, 204, 21, 0.68)' : 'rgba(74, 222, 128, 0.78)';
      ctx.fillRect(nx, ny, 4, 4);
    }
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 0; y < STAGE_H; y += 4) {
    ctx.fillRect(0, y, STAGE_W, 1);
  }

  ctx.restore();
}

/**
 * Dessine un combattant entier à l'échelle exacte 1:1 (multiples de 3px),
 * sans aucun découpage horizontal aux genoux ni au torse.
 */
function readyImg(im) {
  return im && im.complete && im.naturalWidth > 0 ? im : null;
}

export function drawFighter(ctx, f, t) {
  const def = FIGHTERS[f.id];
  const pack = ASSETS.fighters[f.id];
  if (!pack || !readyImg(pack.idle)) return;

  const isJumping = f.y < FLOOR_Y - 2 || f.state === 'jump' || f.state === 'jump_punch' || f.state === 'jump_kick' || f.state === 'spinkick' || f.state === 'shoryuken';

  // Sélection cinématique multi-images façon Street Fighter II (windup -> peak -> retour par ratio 0..1)
  const p = f.stateDuration > 0 ? Math.max(0, Math.min(1, 1 - f.stateTimer / f.stateDuration)) : 0;
  let sprite = pack.idle;
  let spinFlip = 1;

  if (f.state === 'special') {
    sprite = readyImg(pack.special) || readyImg(pack.attack) || pack.idle;
  } else if (f.state === 'shoryuken') {
    sprite = readyImg(pack.shoryuken) || readyImg(pack.attack) || pack.idle;
  } else if (f.state === 'spinkick') {
    sprite = readyImg(pack.spinkick) || readyImg(pack.kick) || pack.idle;
    spinFlip = Math.floor(p * 8) % 2 === 0 ? 1 : -1;
  } else if (f.state === 'headbutt') {
    sprite = p < 0.28 ? (readyImg(pack.crouch) || pack.idle) : (readyImg(pack.headbutt) || pack.idle);
  } else if (f.state === 'crouch_punch') {
    sprite = (p >= 0.16 && p <= 0.78)
      ? (readyImg(pack.crouch_punch) || readyImg(pack.crouch) || pack.idle)
      : (readyImg(pack.crouch) || pack.idle);
  } else if (f.state === 'sweep') {
    sprite = (p >= 0.22 && p <= 0.78)
      ? (readyImg(pack.sweep) || readyImg(pack.kick) || pack.idle)
      : (readyImg(pack.crouch) || pack.idle);
  } else if (f.state === 'kick' || f.state === 'jump_kick') {
    // 3 temps SF2 : appel du genou (kick1) -> coup de pied haut (kick) -> retour (kick1)
    const activePhase = f.state === 'jump_kick' ? (p >= 0.12 && p <= 0.82) : (p >= 0.24 && p <= 0.68);
    sprite = activePhase ? (readyImg(pack.kick) || pack.idle) : (readyImg(pack.kick1) || readyImg(pack.kick) || pack.idle);
  } else if (f.state === 'light' || f.state === 'jump_punch') {
    const activePhase = f.state === 'jump_punch' ? (p >= 0.14 && p <= 0.80) : (p >= 0.18 && p <= 0.68);
    sprite = activePhase ? (readyImg(pack.punch) || readyImg(pack.attack) || pack.idle) : (readyImg(pack.punch1) || readyImg(pack.punch) || pack.idle);
  } else if (f.state === 'heavy') {
    sprite = p < 0.25 ? (readyImg(pack.punch1) || pack.idle) : (readyImg(pack.punch) || readyImg(pack.attack) || pack.idle);
  } else if (f.state === 'hit' || f.state === 'down' || f.state === 'ko') {
    sprite = readyImg(pack.hit) || pack.idle;
  } else if (f.state === 'block' || f.state === 'parry') {
    sprite = readyImg(pack.parry) || pack.idle;
  } else if (f.state === 'crouch') {
    sprite = readyImg(pack.crouch) || pack.idle;
  } else if (isJumping) {
    sprite = readyImg(pack.jump) || pack.idle;
  } else if (f.state === 'walk') {
    // Vraie boucle 4 temps : pas avant -> passage -> pas opposé -> passage
    const step = Math.floor(t / 6) % 4;
    const baseIdle = f.id === 'darkmada' ? (readyImg(pack.special) || pack.idle) : pack.idle;
    sprite = step === 0 ? (readyImg(pack.walk) || baseIdle) : step === 2 ? (readyImg(pack.walk2) || baseIdle) : baseIdle;
  } else {
    const baseIdle = f.id === 'darkmada' && readyImg(ASSETS.extras?.sushiIdle) ? (readyImg(pack.special) || pack.idle) : pack.idle;
    const step = Math.floor(t / 14) % 2;
    sprite = step === 0 ? baseIdle : (readyImg(pack.idle2) || baseIdle);
  }

  // Référence largeur stable pour centrage (dog-free pour DarkMada afin qu'il reste parfaitement ancré)
  const refSprite = (f.id === 'darkmada' && readyImg(pack.special)) ? pack.special : pack.idle;
  const idleW = refSprite.width;
  const drawW = sprite.width;
  const drawH = sprite.height;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Compagnon SUSHI animé indépendamment au sol aux côtés de DarkMada (sauf quand il part seul en Spécial)
  const sushiImg = f.id === 'darkmada' && f.state !== 'special' && readyImg(ASSETS.extras?.sushiIdle);
  if (sushiImg) {
    ctx.save();
    ctx.translate(Math.round(f.x + f.facing * 62), FLOOR_Y);
    ctx.scale(f.facing, 1);
    let sy = 0;
    let sxScale = 1;
    let syScale = 1;
    if (f.state === 'walk') sy = -Math.round(Math.abs(Math.sin(t * 0.36)) * 4) * 2;
    else if (f.state === 'crouch' || f.state === 'crouch_punch' || f.state === 'sweep') syScale = 0.78;
    else if (f.state === 'light' || f.state === 'heavy' || f.state === 'headbutt' || f.state === 'kick') sy = -Math.round(Math.abs(Math.sin(t * 0.45)) * 6);
    else sy = -Math.round(Math.max(0, Math.sin(t * 0.14)) * 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    ctx.fillRect(-Math.round(sushiImg.width * 0.44), -5, Math.round(sushiImg.width * 0.88), 8);
    const swDog = Math.round(sushiImg.width * sxScale);
    const shDog = Math.round(sushiImg.height * syScale);
    ctx.drawImage(sushiImg, -Math.round(swDog * 0.5), -shDog + sy, swDog, shDog);
    ctx.restore();
  }

  ctx.translate(Math.round(f.x), Math.round(f.y));

  // Ombre pixelisée ancrée au sol
  const groundOffset = FLOOR_Y - f.y;
  const shadowScale = Math.max(0.45, 1 - groundOffset / 450);
  const sw = Math.round(idleW * 0.82 * shadowScale);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
  ctx.fillRect(-Math.round(sw / 2), groundOffset - 6, sw, 9);
  ctx.fillRect(-Math.round(sw * 0.36), groundOffset - 12, Math.round(sw * 0.72), 15);

  ctx.scale(f.facing * spinFlip, 1);

  if (f.state === 'ko' || f.state === 'down') {
    ctx.translate(0, -24);
    ctx.rotate(-Math.PI / 2);
  } else if (isJumping && Math.abs(f.vx) > 2 && f.state === 'jump') {
    ctx.translate(0, -drawH * 0.45);
    ctx.rotate((f.vx * f.facing > 0 ? 1 : -1) * 0.12);
    ctx.translate(0, drawH * 0.45);
  }

  let bobY = 0;
  if (f.state === 'walk') {
    bobY = -Math.round(Math.abs(Math.sin(t * 0.28)) * 2) * 3;
  } else if (f.state === 'idle' && sprite === pack.idle) {
    bobY = Math.round(Math.sin(t * 0.14)) * 3;
  }

  const anchorX = Math.round(-idleW * 0.44);
  const drawY = -drawH + bobY;

  // Traînée fantôme arcade sur Shoryuken, Spinning Kick, Coup de boule et Spécial
  if (f.state === 'special' || f.state === 'shoryuken' || f.state === 'spinkick' || f.state === 'headbutt') {
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.drawImage(sprite, anchorX - 18, drawY + (f.state === 'shoryuken' ? 18 : 0), drawW, drawH);
    ctx.globalAlpha = 0.15;
    ctx.drawImage(sprite, anchorX - 36, drawY + (f.state === 'shoryuken' ? 36 : 0), drawW, drawH);
    ctx.restore();
  }

  if (f.state === 'hit' && Math.floor(t / 2) % 2 === 0) {
    ctx.globalAlpha = 0.68;
  }
  ctx.drawImage(sprite, anchorX, drawY, drawW, drawH);
  ctx.globalAlpha = 1;

  // Effets visuels d'arts martiaux (Shoryuken, Spinning Kick, Coup de boule, Balayette, Parade)
  if (f.state === 'shoryuken') {
    ctx.fillStyle = def ? def.accent : '#fde047';
    ctx.fillRect(Math.round(drawW * 0.25), -drawH - 18, 22, 34);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(drawW * 0.28), -drawH - 12, 12, 22);
  } else if (f.state === 'spinkick') {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -Math.round(drawH * 0.45), Math.round(drawW * 0.56), 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -Math.round(drawH * 0.55), Math.round(drawW * 0.46), 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  } else if (f.state === 'headbutt' && p >= 0.30 && p <= 0.80) {
    ctx.fillStyle = 'rgba(249, 115, 22, 0.72)';
    ctx.fillRect(Math.round(drawW * 0.36), -Math.round(drawH * 0.80), 22, 32);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(drawW * 0.40), -Math.round(drawH * 0.76), 12, 22);
  } else if (f.state === 'sweep' && p >= 0.22 && p <= 0.78) {
    ctx.fillStyle = '#fde047';
    ctx.fillRect(Math.round(idleW * 0.25), -24, 96, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(Math.round(idleW * 0.35), -14, 72, 6);
  } else if ((f.state === 'kick' || f.state === 'jump_kick') && p >= 0.24 && p <= 0.68) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.72)';
    ctx.fillRect(Math.round(drawW * 0.42), -Math.round(drawH * 0.56), 24, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(drawW * 0.46), -Math.round(drawH * 0.54), 14, 8);
  } else if (f.state === 'parry') {
    const px = Math.round(idleW * 0.34);
    const py = -Math.round(drawH * 0.54);
    const pulse = 36 + (Math.floor(t) % 6) * 4;
    ctx.strokeStyle = f.parryWindow > 0 ? '#fde047' : '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px, py, pulse, -Math.PI * 0.48, Math.PI * 0.48);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(253, 224, 71, 0.26)';
    ctx.fillRect(px - 10, py - 70, 26, 140);
  } else if (f.state === 'block') {
    const bx = Math.round(idleW * 0.32);
    const by = -Math.round(drawH * 0.86);
    const bh = Math.round(drawH * 0.78);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.fillRect(bx, by, 21, bh);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(bx, by, 21, 4);
    ctx.fillRect(bx, by + bh - 4, 21, 4);
    ctx.fillRect(bx, by, 4, bh);
    ctx.fillRect(bx + 17, by, 4, bh);
  }

  ctx.restore();
}

function drawPixelPlushBear(ctx, cx, cy, scale = 4) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  // Oreilles rondes
  ctx.fillStyle = '#92400e';
  ctx.fillRect(-5, -8, 3, 3);
  ctx.fillRect(2, -8, 3, 3);
  // Tête et corps ourson en peluche
  ctx.fillStyle = '#b45309';
  ctx.fillRect(-4, -7, 8, 6);
  ctx.fillRect(-4, -1, 8, 6);
  // Museau & ventre crème
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(-2, -4, 4, 2);
  ctx.fillRect(-2, 0, 4, 4);
  // Petit nœud papillon rouge
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-2, -1, 4, 1);
  // Yeux noirs brillants
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-3, -5, 1, 1);
  ctx.fillRect(2, -5, 1, 1);
  ctx.fillRect(-1, -4, 2, 1);
  ctx.restore();
}

function drawPixelDucky(ctx, cx, cy, scale = 4) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  // Petit canard jaune pouic
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-4, -5, 5, 5);
  ctx.fillRect(-3, -1, 8, 4);
  // Bec orange
  ctx.fillStyle = '#f97316';
  ctx.fillRect(1, -3, 3, 2);
  // Oeil
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-1, -4, 1, 1);
  ctx.restore();
}

/**
 * Effets pixel-art esthétiques des 6 Coups Spéciaux inspirés des dessins.
 */
export function drawSpecialFX(ctx, specialFx, fighters) {
  if (!specialFx) return;
  const attacker = fighters[specialFx.attackerIdx];
  const target = fighters[1 - specialFx.attackerIdx];
  const def = FIGHTERS[attacker.id];
  const p = Math.min(1, specialFx.timer / specialFx.duration);
  const sx = Math.round(attacker.x);
  const tx = Math.round(target.x);
  const dir = sx <= tx ? 1 : -1;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (specialFx.timer < 18) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  if (attacker.id === 'm3g4') {
    // Anneaux concentriques cyan devant le canon + faisceau plasma géant + frappe orbitale
    const muzzleX = sx + dir * 110;
    const beamY = FLOOR_Y - 196;
    const beamLen = Math.max(80, Math.abs(tx - muzzleX) + 40);
    const startX = dir === 1 ? muzzleX : muzzleX - beamLen;

    for (let r = 0; r < 3; r++) {
      const rx = muzzleX + dir * (r * 36 + (specialFx.timer % 8) * 3);
      const rh = 38 + r * 18;
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(rx - 6, beamY - rh, 12, rh * 2);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(rx - 3, beamY - rh + 6, 6, (rh - 6) * 2);
    }

    const pulse = (Math.sin(specialFx.timer * 0.7) * 8) | 0;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.55)';
    ctx.fillRect(startX, beamY - 40 - pulse, beamLen, 80 + pulse * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(startX, beamY - 22, beamLen, 44);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(startX, beamY - 10, beamLen, 20);

    // Colonne orbitale verticale sur la cible
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.fillRect(tx - 56, 0, 112, FLOOR_Y);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(tx - 20, 0, 40, FLOOR_Y);
  } else if (attacker.id === 'madchat') {
    // Grand croissant d'épée en feu pixel-art (jaune/orange/rouge vif) + braises
    const arcX = Math.round(sx + (tx - sx) * Math.min(1, p * 1.25));
    const arcY = FLOOR_Y - 165;
    for (let a = -12; a <= 12; a++) {
      const ang = a * 0.11;
      const rad = 115 + Math.sin(p * Math.PI) * 35;
      const fx = Math.round(arcX + dir * Math.cos(ang) * rad * 0.85);
      const fy = Math.round(arcY + Math.sin(ang) * rad);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(fx - 18, fy - 18, 36, 36);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(fx - 12, fy - 12, 24, 24);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(fx - 6, fy - 6, 12, 12);
    }
    // Gerbe de braises
    for (let i = 0; i < 14; i++) {
      const ex = arcX + dir * (40 + ((i * 29 + specialFx.timer * 7) % 160));
      const ey = FLOOR_Y - 60 - ((i * 41 + specialFx.timer * 5) % 240);
      ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#fb923c';
      ctx.fillRect(ex, ey, 8, 8);
    }
  } else if (attacker.id === 'darkmada') {
    // SUSHI SOLO : Sushi le Golden Retriever attaque tout seul — mélange de Bisous ♥ & Peluches (Ourson, Canard, Os, Balle) !
    const rushP = p < 0.58 ? p / 0.58 : 1 - ((p - 0.58) / 0.42);
    const sushiX = Math.round(sx + dir * 72 + (tx - sx - dir * 56) * rushP);
    const sushiHop = Math.round(Math.abs(Math.sin(p * Math.PI * 3.5)) * 105);
    const sushiY = FLOOR_Y - sushiHop;

    // Ombre de Sushi au sol
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(sushiX - 52, FLOOR_Y - 10, 104, 12);

    // Dessin de Sushi seul en train de bondir
    const sushiImg = ASSETS.extras && ASSETS.extras.sushiSolo;
    if (sushiImg && sushiImg.complete && sushiImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(sushiX, sushiY);
      ctx.scale(dir, 1);
      ctx.drawImage(sushiImg, -Math.round(sushiImg.width * 0.5), -sushiImg.height, sushiImg.width, sushiImg.height);
      ctx.restore();
    }

    // Mélange Bisous (pluie de coeurs roses & rouges) + Peluches volantes (Ourson, Canard Pouic, Os, Balle) !
    const joyX = Math.round(sx + dir * 65 + (tx - sx - dir * 30) * Math.min(1, p * 1.25));
    drawPixelPlushBear(ctx, joyX - dir * 24, Math.round(FLOOR_Y - 125 - Math.abs(Math.sin(p * Math.PI * 3)) * 130), 4.5);
    drawPixelDucky(ctx, Math.round(sx + dir * 40 + (tx - sx) * Math.min(1, p * 1.4)), Math.round(FLOOR_Y - 95 - Math.abs(Math.cos(p * Math.PI * 4)) * 95), 4);
    drawPixelTennisBall(ctx, joyX, Math.round(FLOOR_Y - 75 - Math.abs(Math.sin(p * Math.PI * 3.5)) * 130), 5);
    drawPixelBone(ctx, Math.round(sx + (tx - sx) * Math.max(0, p - 0.15)), FLOOR_Y - 140 - Math.round(Math.sin(p * 8) * 36), 4);

    // Pluie de bisous ♥♥ autour de la cible et de Sushi
    for (let i = 0; i < 10; i++) {
      const k = (p * 1.45 - i * 0.08 + 1) % 1;
      const hx = Math.round(sushiX + (tx - sushiX) * (i / 10) + Math.sin(i * 2.1 + specialFx.timer * 0.16) * 48);
      const hy = Math.round(FLOOR_Y - 65 - k * 215);
      drawPixelHeart(ctx, hx, hy, i % 2 === 0 ? 4 : 3, i % 2 === 0 ? '#ec4899' : '#e11d48', '#fbcfe8');
    }

    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    pxText(ctx, 'SUSHI SOLO ! BISOUS ♥ & PELUCHES !', Math.round((sushiX + tx) * 0.5), FLOOR_Y - 260 - Math.round(p * 24), '#fbcfe8', '#831843', 3);
  } else if (attacker.id === 'goldohrack') {
    // GOLDOHRACK — FULGURO-POING MISSILE : l'avant-bras se détache et file comme une fusée vers l'adversaire puis revient !
    drawStepLightning(ctx, sx + dir * 18, FLOOR_Y - 285, tx, FLOOR_Y - 175, '#fef08a', '#f59e0b', 5, specialFx.timer);
    drawStepLightning(ctx, sx - dir * 8, FLOOR_Y - 285, tx, FLOOR_Y - 215, '#e0f2fe', '#38bdf8', 4, specialFx.timer + 4);

    const launchX = sx + dir * 68;
    const targetX = tx - dir * 24;
    const flyP = p < 0.62 ? (p / 0.62) : 1 - ((p - 0.62) / 0.38);
    const fistX = Math.round(launchX + (targetX - launchX) * Math.min(1, flyP));
    const fy = FLOOR_Y - 196;

    // Traînée de propulseur fusée + panaches de fumée
    const trailStart = dir === 1 ? Math.min(launchX, fistX) : Math.max(launchX, fistX);
    const trailW = Math.max(24, Math.abs(fistX - launchX));
    const tx0 = dir === 1 ? trailStart : fistX;
    ctx.fillStyle = 'rgba(251, 146, 60, 0.32)';
    ctx.fillRect(tx0, fy - 22, trailW, 44);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(tx0, fy - 12, trailW, 24);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(tx0, fy - 5, trailW, 10);

    for (let s = 0; s < 5; s++) {
      const smokeP = (s / 5 + p * 2.4) % 1;
      const smX = Math.round(launchX + (fistX - launchX) * smokeP);
      const smY = fy + Math.round(Math.sin(s * 2.2 + specialFx.timer * 0.3) * 14);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.fillRect(smX - 10, smY - 10, 20, 20);
    }

    // Flamme de tuyère arrière du poing-fusée
    const flameLen = 42 + ((specialFx.timer * 9) % 24);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(fistX - dir * 64 - (dir === 1 ? flameLen : 0), fy - 18, flameLen, 36);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(fistX - dir * 56 - (dir === 1 ? Math.round(flameLen * 0.65) : 0), fy - 9, Math.round(flameLen * 0.65), 18);

    // Véritable sprite avant-bras rouge détaché de Goldohrack !
    const fistImg = ASSETS.extras && ASSETS.extras.goldohrackFist;
    if (fistImg && fistImg.complete && fistImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(fistX, fy);
      ctx.scale(dir, 1);
      const fw = Math.round(fistImg.width * 1.15);
      const fh = Math.round(fistImg.height * 1.15);
      ctx.drawImage(fistImg, -Math.round(fw * 0.5), -Math.round(fh * 0.5), fw, fh);
      ctx.restore();
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(fistX - 36, fy - 24, 72, 48);
    }

    // Éclat d'impact à l'arrivée sur l'adversaire
    if (p >= 0.48 && p <= 0.78) {
      const boomR = Math.round(32 + Math.sin(((p - 0.48) / 0.30) * Math.PI) * 58);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.fillRect(targetX - boomR, fy - boomR, boomR * 2, boomR * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(targetX - Math.round(boomR * 0.4), fy - Math.round(boomR * 0.4), Math.round(boomR * 0.8), Math.round(boomR * 0.8));
    }
  } else if (attacker.id === 'koll') {
    // KOLL — Déguisement Lapin-Aimant Tesla : oreilles de lapin + ondes roses d'attraction + décharge atomique !
    const dirAttr = -dir; // onde magnétique tirant l'adversaire VERS Koll !
    const wavePulse = (specialFx.timer * 0.14) % 1;

    // Halo rose/cyan mignon autour de Koll déguisé en lapin
    ctx.fillStyle = 'rgba(244, 114, 182, 0.22)';
    ctx.fillRect(sx - 92, FLOOR_Y - 340, 184, 340);

    // Anneaux d'attraction magnétique + cœurs & carottes aspirés vers Koll
    for (let ring = 0; ring < 4; ring++) {
      const rp = (ring * 0.25 + (1 - wavePulse)) % 1;
      const rx = Math.round(sx + (tx - sx) * rp);
      const ry = FLOOR_Y - 175 + Math.round(Math.sin(ring * 1.7 + specialFx.timer * 0.2) * 32);
      ctx.strokeStyle = ring % 2 === 0 ? '#f472b6' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry, 28 + ring * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Petit cœur d'attraction pixelisé
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(rx - 8, ry - 4, 7, 7);
      ctx.fillRect(rx + 1, ry - 4, 7, 7);
      ctx.fillRect(rx - 6, ry + 2, 12, 7);
      ctx.fillRect(rx - 3, ry + 8, 6, 4);
    }

    // Nuage carotte & aura lapin quand l'ennemi est attiré près de Koll
    if (specialFx.timer >= 20) {
      const rad = Math.round(48 + Math.max(0, p - 0.35) * 420);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.26)';
      ctx.fillRect(sx - rad, FLOOR_Y - 180 - Math.round(rad * 0.45), rad * 2, Math.round(rad * 0.9));
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(sx - rad, FLOOR_Y - 180 - 12, rad * 2, 24);
      ctx.fillStyle = '#dcfce7';
      ctx.fillRect(sx - Math.round(rad * 0.6), FLOOR_Y - 180 - 6, Math.round(rad * 1.2), 12);

      for (let i = 0; i < 4; i++) {
        drawStepLightning(
          ctx,
          sx + dir * 40,
          FLOOR_Y - 190,
          tx,
          FLOOR_Y - 220 + i * 44,
          '#e0f2fe',
          '#38bdf8',
          6,
          Math.floor(specialFx.timer / 2) + i * 3
        );
      }
    }
    void dirAttr;
  } else {
    // LURCK — Éclipse Nocturne + yeux dorés géants + 3 grandes lames de serres dorées
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    // Grands yeux du hibou pixelisés
    ctx.fillStyle = '#facc15';
    ctx.fillRect(STAGE_W / 2 - 96, 175, 44, 44);
    ctx.fillRect(STAGE_W / 2 + 52, 175, 44, 44);
    ctx.fillStyle = '#020617';
    ctx.fillRect(STAGE_W / 2 - 78, 181, 10, 32);
    ctx.fillRect(STAGE_W / 2 + 68, 181, 10, 32);

    // 3 grands croissants de serres dorées comme sur son sprite d'attaque
    for (let i = -1; i <= 1; i++) {
      for (let s = 0; s < 16; s++) {
        const bx = Math.round(tx - dir * 80 + dir * s * 14);
        const by = Math.round(FLOOR_Y - 290 + i * 44 + s * 14 + Math.sin(s * 0.25) * 16);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(bx - 10, by - 6, 20, 12);
        ctx.fillStyle = '#fef9c3';
        ctx.fillRect(bx - 5, by - 3, 10, 6);
      }
    }
  }

  // Bannière cinématique arcade
  ctx.fillStyle = 'rgba(9, 9, 11, 0.90)';
  ctx.fillRect(STAGE_W / 2 - 380, 134, 760, 44);
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 4;
  ctx.strokeRect(STAGE_W / 2 - 380, 134, 760, 44);
  ctx.lineWidth = 1;
  ctx.font = 'bold 21px monospace';
  ctx.textAlign = 'center';
  const bannerIcon = attacker.id === 'darkmada' ? '🐕'
    : attacker.id === 'koll' ? '🐰'
    : attacker.id === 'goldohrack' ? '🚀'
    : '⚡';
  pxText(ctx, `${bannerIcon} ${(def.hudName || def.name).toUpperCase()} : ${def.specialName.toUpperCase()} !`, STAGE_W / 2, 163, '#ffffff', '#000000', 2);
  ctx.textAlign = 'left';
  ctx.restore();
}

export function drawEffects(ctx, particles, floatingTexts) {
  ctx.save();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    const sz = Math.max(4, Math.round(p.size));
    ctx.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  for (let i = 0; i < floatingTexts.length; i++) {
    const ft = floatingTexts[i];
    ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
    ctx.font = `bold ${ft.size}px monospace`;
    pxText(ctx, ft.text, ft.x, ft.y, ft.color, '#000000', 3);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawHudPortrait(ctx, fighterId, x, y, size) {
  const pack = ASSETS.fighters[fighterId];
  ctx.fillStyle = '#0b1630';
  ctx.fillRect(x, y, size, size);

  if (pack && pack.portrait.complete && pack.portrait.naturalWidth > 0) {
    ctx.drawImage(pack.portrait, x + 2, y + 2, size - 4, size - 4);
  }

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, size, size);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
  ctx.lineWidth = 1;
}

/**
 * Nouveau HUD Arcade :
 * - En haut : Barre de Recharge du Coup Spécial AU-DESSUS de la Barre de Vie.
 * - Juste dessous : Grande Barre de Vie (rouge -> orange -> jaune) qui réagit à chaque coup.
 */
export function drawHUD(ctx, state) {
  const [p1, p2] = state.fighters;
  const f1 = FIGHTERS[p1.id];
  const f2 = FIGHTERS[p2.id];

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Bandeau HUD supérieur légèrement assombri pour une lisibilité parfaite sur toutes les arènes
  ctx.fillStyle = 'rgba(5, 8, 22, 0.36)';
  ctx.fillRect(0, 0, STAGE_W, 114);

  // Portraits dans les coins supérieurs
  drawHudPortrait(ctx, p1.id, 20, 18, 92);
  drawHudPortrait(ctx, p2.id, STAGE_W - 112, 18, 92);

  const barW = 452;
  const p1X = 126;
  const p2X = STAGE_W - 126 - barW;

  // 1) BARRE DE RECHARGE SPÉCIALE AU-DESSUS DE LA VIE (y = 20, h = 20)
  const spY = 20;
  const spH = 20;
  const sp1Pct = Math.min(100, Math.max(0, Math.round(p1.superMeter)));
  const sp2Pct = Math.min(100, Math.max(0, Math.round(p2.superMeter)));
  const sp1Ready = sp1Pct >= 100;
  const sp2Ready = sp2Pct >= 100;
  const blink = Math.floor(state.tick / 10) % 2 === 0;

  // Fond sombre
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(p1X, spY, barW, spH);
  ctx.fillRect(p2X, spY, barW, spH);

  // Remplissage cyan -> doré clignotant quand prêt
  const sp1W = Math.round((barW * sp1Pct) / 100);
  const sp2W = Math.round((barW * sp2Pct) / 100);
  ctx.fillStyle = sp1Ready ? (blink ? '#fde047' : '#f59e0b') : '#38bdf8';
  ctx.fillRect(p1X + (barW - sp1W), spY + 2, sp1W, spH - 4);
  ctx.fillStyle = sp2Ready ? (blink ? '#fde047' : '#f59e0b') : '#38bdf8';
  ctx.fillRect(p2X, spY + 2, sp2W, spH - 4);

  // Bordures & étiquettes SPÉCIAL
  ctx.strokeStyle = sp1Ready ? '#fde047' : '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(p1X, spY, barW, spH);
  ctx.strokeStyle = sp2Ready ? '#fde047' : '#94a3b8';
  ctx.strokeRect(p2X, spY, barW, spH);
  ctx.lineWidth = 1;

  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  pxText(
    ctx,
    sp1Ready ? '⚡ SPÉCIAL PRÊT (ENTRÉE)' : `⚡ RECHARGE SPÉCIALE : ${sp1Pct}%`,
    p1X + 8,
    spY + 14,
    sp1Ready ? '#fef08a' : '#e0f2fe',
    '#000000',
    1
  );
  ctx.textAlign = 'right';
  const sp2ReadyKey = state.mode === 'local' ? ' (MAJ D / O)' : '';
  pxText(
    ctx,
    sp2Ready ? `⚡ SPÉCIAL PRÊT${sp2ReadyKey}` : `SPÉCIALE : ${sp2Pct}% ⚡`,
    p2X + barW - 8,
    spY + 14,
    sp2Ready ? '#fef08a' : '#e0f2fe',
    '#000000',
    1
  );

  // 2) BARRE DE VIE JUSTE EN DESSOUS (y = 46, h = 26)
  const barY = 46;
  const barH = 26;

  ctx.fillStyle = '#dc2626';
  ctx.fillRect(p1X, barY, barW, barH);
  ctx.fillRect(p2X, barY, barW, barH);

  ctx.fillStyle = '#f97316';
  const p1TrailW = Math.round((barW * Math.max(0, p1.trailHp)) / 100);
  ctx.fillRect(p1X + (barW - p1TrailW), barY, p1TrailW, barH);
  const p2TrailW = Math.round((barW * Math.max(0, p2.trailHp)) / 100);
  ctx.fillRect(p2X, barY, p2TrailW, barH);

  const p1W = Math.round((barW * Math.max(0, p1.hp)) / 100);
  const p2W = Math.round((barW * Math.max(0, p2.hp)) / 100);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(p1X + (barW - p1W), barY, p1W, barH);
  ctx.fillRect(p2X, barY, p2W, barH);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(p1X + (barW - p1W), barY + 2, p1W, 5);
  ctx.fillRect(p2X, barY + 2, p2W, 5);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(p1X, barY, barW, barH);
  ctx.strokeRect(p2X, barY, barW, barH);
  ctx.lineWidth = 1;

  // Affichage % VIE directement lisible
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  pxText(ctx, `VIE ${Math.max(0, Math.round(p1.hp))}%`, p1X + 10, barY + 18, '#ffffff', '#000000', 2);
  ctx.textAlign = 'right';
  pxText(ctx, `VIE ${Math.max(0, Math.round(p2.hp))}%`, p2X + barW - 10, barY + 18, '#ffffff', '#000000', 2);

  // Boîtier central VS + Timer 99
  ctx.fillStyle = '#0b1e3d';
  ctx.fillRect(STAGE_W / 2 - 48, 30, 96, 58);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(STAGE_W / 2 - 48, 30, 96, 58);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(STAGE_W / 2 - 44, 34, 88, 50);
  ctx.lineWidth = 1;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0b1e3d';
  ctx.fillRect(STAGE_W / 2 - 22, 12, 44, 20);
  ctx.font = 'bold 15px monospace';
  pxText(ctx, 'VS', STAGE_W / 2, 27, '#fde047', '#000000', 2);

  ctx.fillStyle = state.timer <= 15 ? '#f87171' : '#e0f2fe';
  ctx.font = 'bold 38px monospace';
  ctx.fillText(String(Math.max(0, Math.ceil(state.timer))).padStart(2, '0'), STAGE_W / 2, 73);

  // Noms + villes & étoiles de rounds (y = 98)
  const name1 = `J1 · ${(f1.hudName || f1.name).toUpperCase()} (${f1.city})`;
  const name2 = `${state.mode === 'bot' ? 'BOT' : 'J2'} · ${(f2.hudName || f2.name).toUpperCase()} (${f2.city})`;

  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  pxText(ctx, name1, p1X + 2, 98, '#ffffff', '#000000', 2);
  ctx.textAlign = 'right';
  pxText(ctx, name2, p2X + barW - 2, 98, '#ffffff', '#000000', 2);

  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = i < p1.rounds ? '#facc15' : '#334155';
    ctx.fillRect(p1X + barW - 22 - i * 22, 80, 14, 14);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(p1X + barW - 22 - i * 22, 80, 14, 14);

    ctx.fillStyle = i < p2.rounds ? '#facc15' : '#334155';
    ctx.fillRect(p2X + 8 + i * 22, 80, 14, 14);
    ctx.strokeRect(p2X + 8 + i * 22, 80, 14, 14);
  }

  // Compteur de combos
  ctx.textAlign = 'left';
  if (p2.comboCount >= 2 && p2.comboTimer > 0) {
    ctx.font = 'bold 28px monospace';
    pxText(ctx, `${p2.comboCount} HITS!`, 32, 166, '#facc15', '#000000', 3);
  }
  ctx.textAlign = 'right';
  if (p1.comboCount >= 2 && p1.comboTimer > 0) {
    ctx.font = 'bold 28px monospace';
    pxText(ctx, `${p1.comboCount} HITS!`, STAGE_W - 32, 166, '#facc15', '#000000', 3);
  }

  // Bandeau bas discret (arène en cours)
  const arena = ARENAS[state.arena];
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillRect(STAGE_W / 2 - 240, STAGE_H - 36, 480, 26);
  ctx.strokeStyle = '#3f3f46';
  ctx.strokeRect(STAGE_W / 2 - 240, STAGE_H - 36, 480, 26);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `ROUND ${state.roundNumber} · ${arena.name.toUpperCase()} · ${state.mode === 'bot' ? 'SOLO vs BOT' : '2J LOCAL'}`,
    STAGE_W / 2,
    STAGE_H - 18
  );

  // Annonce centrale (ROUND 1 / FIGHT! / K.O.!)
  if (state.announcement && state.announcementTimer > 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, STAGE_H / 2 - 64, STAGE_W, 128);
    ctx.font = 'bold 68px monospace';
    pxText(ctx, state.announcement, STAGE_W / 2, STAGE_H / 2 + 24, '#fde047', '#000000', 5);
  }

  ctx.textAlign = 'left';
  ctx.restore();
}

/**
 * 1) ÉCRAN DE DÉMARRAGE (style Sue Fighter II)
 */
export function drawTitleScreen(ctx, state) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const bg = ASSETS.ui.titleScreen;
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, STAGE_W, STAGE_H);
  } else {
    ctx.fillStyle = '#14102c';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  // Étoiles/braises animées
  for (let i = 0; i < 18; i++) {
    const x = ((i * 79 + state.tick * 0.9) % STAGE_W) | 0;
    const y = (120 + ((i * 53 + state.tick * 0.7) % 450)) | 0;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(250, 204, 21, 0.75)' : 'rgba(56, 189, 248, 0.7)';
    ctx.fillRect(x, y, 4, 4);
  }

  // Logo principal STREET BRAWLER II style arcade
  ctx.textAlign = 'center';
  const pulseY = Math.round(Math.sin(state.tick * 0.08) * 3);

  // Ruban rouge "LA TOURNÉE DES LÉGENDES"
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(STAGE_W / 2 - 235, 148 + pulseY, 470, 34);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  ctx.strokeRect(STAGE_W / 2 - 235, 148 + pulseY, 470, 34);
  ctx.lineWidth = 1;

  // Grand titre avec dégradé feu/métal & épaisse bordure noire
  ctx.font = 'bold 66px monospace';
  const grad = ctx.createLinearGradient(0, 48 + pulseY, 0, 128 + pulseY);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.38, '#fde047');
  grad.addColorStop(0.75, '#f97316');
  grad.addColorStop(1, '#dc2626');

  ctx.lineWidth = 10;
  ctx.strokeStyle = '#09090b';
  ctx.strokeText('STREET BRAWLER', STAGE_W / 2, 108 + pulseY);
  ctx.fillStyle = grad;
  ctx.fillText('STREET BRAWLER', STAGE_W / 2, 108 + pulseY);

  // Numéro II doré façon SF2/Sue Fighter II
  ctx.font = 'bold 34px monospace';
  ctx.lineWidth = 6;
  ctx.strokeText('ARCADE EDITION', STAGE_W / 2, 140 + pulseY);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('ARCADE EDITION', STAGE_W / 2, 140 + pulseY);
  ctx.lineWidth = 1;

  ctx.font = 'bold 19px monospace';
  pxText(ctx, '★ LA TOURNÉE DES LÉGENDES ★', STAGE_W / 2, 171 + pulseY, '#fef08a', '#000000', 2);

  // Zone APPUIE SUR START clignotante en bas
  ctx.fillStyle = 'rgba(9, 9, 11, 0.80)';
  ctx.fillRect(STAGE_W / 2 - 295, 558, 590, 96);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  ctx.strokeRect(STAGE_W / 2 - 295, 558, 590, 96);
  ctx.lineWidth = 1;

  if (Math.floor(state.tick / 18) % 2 === 0) {
    ctx.font = 'bold 34px monospace';
    pxText(ctx, 'APPUIE SUR START', STAGE_W / 2, 602, '#fde047', '#000000', 3);
  }
  ctx.font = 'bold 15px monospace';
  pxText(ctx, 'ENTRÉE · CLIQUEZ OU TOUCHEZ L\'ÉCRAN POUR JOUER', STAGE_W / 2, 636, '#e2e8f0', '#000000', 2);

  // Bandeau bas Tournée de France
  ctx.fillStyle = 'rgba(0, 0, 0, 0.90)';
  ctx.fillRect(0, STAGE_H - 38, STAGE_W, 38);
  ctx.font = 'bold 13px monospace';
  pxText(
    ctx,
    'LA TOURNÉE DE FRANCE : CHÂTEAU-THIERRY > LAON > REIMS > PARIS > CHARTRES > TOULOUSE',
    STAGE_W / 2,
    STAGE_H - 14,
    '#cbd5e1',
    '#000000',
    1
  );

  ctx.textAlign = 'left';
  ctx.restore();
}

/**
 * 2) ÉCRAN CHOIX DES PERSONNAGES (style capture 2 : CHOISIS TON COMBATTANT)
 */
export function drawSelectScreen(ctx, state) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Arène sélectionnée en fond assombri
  drawArena(ctx, state.arena, state.tick);
  ctx.fillStyle = 'rgba(8, 12, 28, 0.78)';
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);

  const layout = getSelectLayout();
  const f1 = FIGHTERS[state.p1Choice];
  const f2 = FIGHTERS[state.p2Choice];

  // Titre haut
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px monospace';
  pxText(ctx, 'CHOISIS TON COMBATTANT', STAGE_W / 2, 52, '#fde047', '#000000', 4);

  // --- COLONNE GAUCHE : GRAND PORTRAIT J1 ---
  const p1Box = { x: 42, y: 88, w: 244, h: 244 };
  ctx.fillStyle = '#0b1630';
  ctx.fillRect(p1Box.x, p1Box.y, p1Box.w, p1Box.h);
  const p1Img = ASSETS.fighters[f1.id]?.portrait;
  if (p1Img && p1Img.complete && p1Img.naturalWidth > 0) {
    ctx.drawImage(p1Img, p1Box.x + 6, p1Box.y + 6, p1Box.w - 12, p1Box.h - 12);
  }
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.strokeRect(p1Box.x, p1Box.y, p1Box.w, p1Box.h);
  ctx.lineWidth = 1;

  ctx.textAlign = 'left';
  ctx.font = 'bold 23px monospace';
  pxText(ctx, (f1.hudName || f1.name).toUpperCase(), p1Box.x, 364, '#ffffff', '#000000', 3);
  ctx.font = 'bold 12px monospace';
  pxText(ctx, `📍 ${f1.region.toUpperCase()}`, p1Box.x, 388, '#fde047', '#000000', 2);
  ctx.font = '12px monospace';
  ctx.fillStyle = '#cbd5e1';
  const words = f1.shortDesc.split(' ');
  let line1 = '';
  let line2 = '';
  for (const w of words) {
    if (!line2 && (line1 ? `${line1} ${w}` : w).length <= 36) {
      line1 = line1 ? `${line1} ${w}` : w;
    } else {
      line2 = line2 ? `${line2} ${w}` : w;
    }
  }
  ctx.fillText(line1, p1Box.x, 412);
  if (line2) {
    ctx.fillText(line2, p1Box.x, 430);
  }

  // --- COLONNE CENTRALE : ARCADE / COUPS / ARÈNES ---
  const cx = STAGE_W / 2 - 12;
  ctx.textAlign = 'center';
  const mb = layout.modeBadgeRect;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(mb.x, mb.y, mb.w, mb.h);
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.strokeRect(mb.x, mb.y, mb.w, mb.h);
  ctx.lineWidth = 1;
  ctx.font = 'bold 28px monospace';
  pxText(ctx, state.mode === 'bot' ? 'ARCADE (1J vs BOT)' : 'VERSUS (2J LOCAL)', mb.x + mb.w / 2, mb.y + 33, '#86efac', '#000000', 3);

  // Liste des coups du combattant J1 sélectionné
  ctx.font = 'bold 14px monospace';
  pxText(ctx, `SPÉCIAL : ${f1.specialName.toUpperCase()}`, cx, 178, '#fde047', '#000000', 2);
  pxText(ctx, 'SAUTER : ESPACE   ·   FRAPPER : F / G', cx, 206, '#e0f2fe', '#000000', 2);
  pxText(ctx, 'COUP SPÉCIAL : ENTRÉE   ·   GARDE : S', cx, 232, '#f97316', '#000000', 2);

  // Sélecteur des 6 arènes
  ctx.font = 'bold 14px monospace';
  pxText(ctx, 'ARÈNE DU COMBAT (6 MONDES DISPONIBLES) :', cx, 314, '#cbd5e1', '#000000', 2);
  layout.arenaRects.forEach(ar => {
    const a = ARENAS[ar.id];
    const active = state.arena === ar.id;
    ctx.fillStyle = active ? '#facc15' : 'rgba(24, 24, 27, 0.9)';
    ctx.fillRect(ar.x, ar.y, ar.w, ar.h);
    ctx.strokeStyle = active ? '#ffffff' : a.color;
    ctx.lineWidth = active ? 3 : 2;
    ctx.strokeRect(ar.x, ar.y, ar.w, ar.h);
    ctx.lineWidth = 1;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = active ? '#09090b' : '#f8fafc';
    ctx.fillText(a.name.toUpperCase(), ar.x + ar.w / 2, ar.y + 21);
  });

  // --- COLONNE DROITE : JOUEUR 2 (APPUIE SUR START ou Portrait J2) ---
  const p2R = layout.p2PanelRect;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(p2R.x, p2R.y, p2R.w, p2R.h);
  ctx.strokeStyle = state.mode === 'local' ? '#f43f5e' : '#3f3f46';
  ctx.lineWidth = 3;
  ctx.strokeRect(p2R.x, p2R.y, p2R.w, p2R.h);
  ctx.lineWidth = 1;

  const p2Mid = p2R.x + p2R.w / 2;
  if (state.mode === 'bot') {
    ctx.font = 'bold 24px monospace';
    pxText(ctx, 'JOUEUR 2 / BOT', p2Mid, p2R.y + 42, '#f87171', '#000000', 2);

    if (Math.floor(state.tick / 20) % 2 === 0) {
      ctx.font = 'bold 18px monospace';
      pxText(ctx, 'APPUIE SUR [2] / START', p2Mid, p2R.y + 78, '#fde047', '#000000', 2);
    }
    ctx.font = '12px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('CLIQUEZ ICI POUR ACTIVER', p2Mid, p2R.y + 106);
    ctx.fillText('LE MODE 2 JOUEURS LOCAL', p2Mid, p2R.y + 124);

    // Aperçu mini du BOT sélectionné
    const p2Img = ASSETS.fighters[f2.id]?.portrait;
    if (p2Img && p2Img.complete && p2Img.naturalWidth > 0) {
      ctx.drawImage(p2Img, p2Mid - 46, p2R.y + 144, 92, 92);
    }
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.strokeRect(p2Mid - 46, p2R.y + 144, 92, 92);
    ctx.lineWidth = 1;

    ctx.font = 'bold 15px monospace';
    pxText(ctx, `BOT : ${f2.name}`, p2Mid, p2R.y + 262, '#86efac', '#000000', 2);
    ctx.font = 'bold 12px monospace';
    pxText(ctx, `ORIGINE : ${f2.city}`, p2Mid, p2R.y + 284, '#fde047', '#000000', 1);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('(Clic droit sur une carte pour changer)', p2Mid, p2R.y + 310);
  } else {
    const p2Img = ASSETS.fighters[f2.id]?.portrait;
    if (p2Img && p2Img.complete && p2Img.naturalWidth > 0) {
      ctx.drawImage(p2Img, p2Mid - 86, p2R.y + 18, 172, 172);
    }
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.strokeRect(p2Mid - 86, p2R.y + 18, 172, 172);
    ctx.lineWidth = 1;

    ctx.font = 'bold 20px monospace';
    pxText(ctx, `J2 : ${(f2.hudName || f2.name).toUpperCase()}`, p2Mid, p2R.y + 220, '#ffffff', '#000000', 2);
    ctx.font = 'bold 13px monospace';
    pxText(ctx, `📍 ${f2.region.toUpperCase()}`, p2Mid, p2R.y + 244, '#fde047', '#000000', 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px monospace';
    ctx.fillText('←/→ BOUGER · ↑ SAUT · K/L FRAPPER', p2Mid, p2R.y + 276);
    ctx.fillText('MAJ DROITE / O : SPÉCIAL', p2Mid, p2R.y + 296);
    ctx.fillStyle = '#86efac';
    ctx.fillText('(Cliquez ici pour repasser en SOLO)', p2Mid, p2R.y + 318);
  }

  // --- RANGÉE DU BAS : LES 6 PORTRAITS + VILLES FRANÇAISES ---
  layout.fighterRects.forEach(r => {
    const f = FIGHTERS[r.id];
    const isP1 = state.p1Choice === r.id;
    const isP2 = state.p2Choice === r.id;

    // Curseurs 1P / 2P au-dessus du portrait
    ctx.font = 'bold 16px monospace';
    if (isP1 && isP2) {
      pxText(ctx, state.mode === 'bot' ? '1P / BOT' : '1P / 2P', r.x + r.w / 2, r.y - 10, '#fde047', '#000000', 2);
    } else if (isP1) {
      pxText(ctx, '▼ 1P ▼', r.x + r.w / 2, r.y - 10, '#38bdf8', '#000000', 2);
    } else if (isP2) {
      pxText(ctx, state.mode === 'bot' ? '▼ BOT ▼' : '▼ 2P ▼', r.x + r.w / 2, r.y - 10, '#f43f5e', '#000000', 2);
    }

    ctx.fillStyle = '#0b1630';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    const pImg = ASSETS.fighters[r.id]?.portrait;
    if (pImg && pImg.complete && pImg.naturalWidth > 0) {
      ctx.drawImage(pImg, r.x + 3, r.y + 3, r.w - 6, r.h - 6);
    }

    ctx.strokeStyle = isP1 ? '#38bdf8' : isP2 ? '#f43f5e' : '#1d4ed8';
    ctx.lineWidth = isP1 || isP2 ? 5 : 3;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.lineWidth = 1;

    // Nom & Ville d'origine française sous chaque portrait
    ctx.font = 'bold 13px monospace';
    pxText(ctx, f.name, r.x + r.w / 2, r.y + r.h + 18, '#ffffff', '#000000', 2);
    ctx.font = 'bold 11px monospace';
    pxText(ctx, f.city, r.x + r.w / 2, r.y + r.h + 34, '#fde047', '#000000', 1);
  });

  // Bouton bas LANCER LA TOURNÉE
  const lb = layout.launchBtnRect;
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(lb.x, lb.y, lb.w, lb.h);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  ctx.strokeRect(lb.x, lb.y, lb.w, lb.h);
  ctx.lineWidth = 1;
  ctx.font = 'bold 18px monospace';
  pxText(ctx, '▶ ENTRÉE : EN ROUTE POUR LE COMBAT ! (CLIQUEZ)', lb.x + lb.w / 2, lb.y + 29, '#ffffff', '#000000', 2);

  ctx.textAlign = 'left';
  ctx.restore();
}

/**
 * 3) ANIMATION DE LA CARTE DE FRANCE (petits pointillés animés d'une ville à l'autre)
 */
export function drawFranceMapScreen(ctx, state) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const mapImg = ASSETS.ui.franceMap;
  if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
    ctx.drawImage(mapImg, 0, 0, STAGE_W, STAGE_H);
  } else {
    ctx.fillStyle = '#0a2c88';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  const f1 = FIGHTERS[state.p1Choice];
  const f2 = FIGHTERS[state.p2Choice];
  const arena = ARENAS[state.arena];

  // Bandeau titre supérieur
  ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
  ctx.fillRect(0, 0, STAGE_W, 56);
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px monospace';
  pxText(ctx, `LA TOURNÉE DE FRANCE · ${f1.city} ➔ ${f2.city}`, STAGE_W / 2, 38, '#fde047', '#000000', 3);

  // Courbe parabolique entre la ville du J1 et la ville de l'adversaire
  const p1 = f1.mapPos;
  const p2 = f2.mapPos;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const ctrlX = (p1.x + p2.x) / 2 - Math.min(85, dist * 0.25);
  const ctrlY = (p1.y + p2.y) / 2 - Math.max(45, dist * 0.28);

  const progress = Math.min(1, state.phaseTimer <= 0 ? 1 : (state.phaseDuration - state.phaseTimer) / (state.phaseDuration * 0.72));
  const dotCount = Math.max(10, Math.min(28, Math.round(dist / 16)));
  const visibleDots = Math.floor(dotCount * progress);

  // Trace les petits pointillés carrés animés un par un façon SF2 !
  for (let i = 0; i <= visibleDots; i++) {
    const t = dotCount === 0 ? 1 : i / dotCount;
    const inv = 1 - t;
    const bx = Math.round(inv * inv * p1.x + 2 * inv * t * ctrlX + t * t * p2.x);
    const by = Math.round(inv * inv * p1.y + 2 * inv * t * ctrlY + t * t * p2.y);

    // Ombre noire + carré jaune vif
    ctx.fillStyle = '#09090b';
    ctx.fillRect(bx - 5, by - 5, 10, 10);
    ctx.fillStyle = i === visibleDots && progress < 1 ? '#ffffff' : '#fde047';
    ctx.fillRect(bx - 3, by - 3, 6, 6);
  }

  // Dessin des 6 villes de France
  FIGHTER_ORDER.forEach(id => {
    const f = FIGHTERS[id];
    const isStart = id === f1.id;
    const isDest = id === f2.id;
    const { x, y } = f.mapPos;

    const r = isStart || isDest ? 7 : 5;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x - r - 2, y - r - 2, (r + 2) * 2, (r + 2) * 2);

    if (isDest) {
      ctx.fillStyle = Math.floor(state.tick / 8) % 2 === 0 ? '#ef4444' : '#fde047';
    } else if (isStart) {
      ctx.fillStyle = '#38bdf8';
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    // Label positionné intelligemment pour éviter toute collision en Picardie
    const off = f.labelOffset || { dx: 12, dy: 4, align: 'left' };
    ctx.textAlign = off.align;
    ctx.font = isStart || isDest ? 'bold 16px monospace' : 'bold 13px monospace';
    const col = isDest ? '#fde047' : isStart ? '#38bdf8' : '#e2e8f0';
    pxText(ctx, f.city, x + off.dx, y + off.dy, col, '#000000', 2);

    // Scintillement animé sur les décors emblématiques de chaque ville
    if ((state.tick + x) % 48 < 18) {
      ctx.fillStyle = isDest ? '#fde047' : 'rgba(255, 255, 255, 0.72)';
      ctx.fillRect(x - 14 + ((state.tick >> 2) % 24), y - 22, 3, 3);
    }
  });

  // Bandeau inférieur (style capture 3)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.90)';
  ctx.fillRect(0, STAGE_H - 122, STAGE_W, 122);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(0, STAGE_H - 122, STAGE_W, 3);

  const oppImg = ASSETS.fighters[f2.id]?.portrait;
  if (oppImg && oppImg.complete && oppImg.naturalWidth > 0) {
    ctx.drawImage(oppImg, 54, STAGE_H - 108, 96, 96);
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(54, STAGE_H - 108, 96, 96);
  ctx.lineWidth = 1;

  ctx.textAlign = 'left';
  ctx.font = 'bold 16px monospace';
  pxText(ctx, `COMBAT · ${f1.name} vs ${f2.name}`, 172, STAGE_H - 84, '#94a3b8', '#000000', 2);
  ctx.font = 'bold 34px monospace';
  pxText(ctx, (f2.hudName || f2.name).toUpperCase(), 172, STAGE_H - 46, '#f97316', '#000000', 3);
  ctx.font = 'bold 15px monospace';
  pxText(ctx, `${arena.name.toUpperCase()} · ${f2.region.toUpperCase()}`, 172, STAGE_H - 22, '#e2e8f0', '#000000', 2);

  ctx.textAlign = 'right';
  ctx.font = 'bold 40px monospace';
  pxText(ctx, `${f2.city} !`, STAGE_W - 56, STAGE_H - 48, '#ffffff', '#000000', 4);
  ctx.font = '12px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('ENTRÉE / CLIC POUR CONTINUER', STAGE_W - 56, STAGE_H - 20);

  ctx.textAlign = 'left';
  ctx.restore();
}

/**
 * 4) ÉCRAN VS AVANT LE COMBAT (style capture 4)
 */
export function drawVsScreen(ctx, state) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const f1 = FIGHTERS[state.p1Choice];
  const f2 = FIGHTERS[state.p2Choice];
  const arena = ARENAS[state.arena];

  // Fond diagonal bicolore arcade
  ctx.fillStyle = '#d4ad56';
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);

  ctx.fillStyle = '#b460a2';
  ctx.beginPath();
  ctx.moveTo(STAGE_W / 2 + 70, 0);
  ctx.lineTo(STAGE_W, 0);
  ctx.lineTo(STAGE_W, STAGE_H);
  ctx.lineTo(STAGE_W / 2 - 70, STAGE_H);
  ctx.closePath();
  ctx.fill();

  // Séparation diagonale noire nette
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(STAGE_W / 2 + 70, 0);
  ctx.lineTo(STAGE_W / 2 - 70, STAGE_H);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Grands portraits encadrés façon SF2
  const size = 270;
  const p1X = 110;
  const p2X = STAGE_W - 110 - size;
  const py = 140;

  drawHudPortrait(ctx, f1.id, p1X, py, size);

  // Portrait J2 inversé vers la gauche pour se faire face !
  ctx.save();
  ctx.fillStyle = '#0b1630';
  ctx.fillRect(p2X, py, size, size);
  const p2Img = ASSETS.fighters[f2.id]?.portrait;
  if (p2Img && p2Img.complete && p2Img.naturalWidth > 0) {
    ctx.translate(p2X + size, py);
    ctx.scale(-1, 1);
    ctx.drawImage(p2Img, 2, 2, size - 4, size - 4);
  }
  ctx.restore();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.strokeRect(p2X, py, size, size);
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 2;
  ctx.strokeRect(p2X + 3, py + 3, size - 6, size - 6);
  ctx.lineWidth = 1;

  // Noms et villes d'origine sous les portraits
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px monospace';
  pxText(ctx, (f1.hudName || f1.name).toUpperCase(), p1X + size / 2, py + size + 54, '#ffffff', '#000000', 4);
  ctx.font = 'bold 18px monospace';
  pxText(ctx, f1.city, p1X + size / 2, py + size + 84, '#09090b', '#fef08a', 1);

  ctx.font = 'bold 34px monospace';
  pxText(ctx, (f2.hudName || f2.name).toUpperCase(), p2X + size / 2, py + size + 54, '#ffffff', '#000000', 4);
  ctx.font = 'bold 18px monospace';
  pxText(ctx, f2.city, p2X + size / 2, py + size + 84, '#09090b', '#fef08a', 1);

  // Grand VS central 16-bit
  const vsScale = 1 + Math.sin(state.tick * 0.16) * 0.04;
  ctx.save();
  ctx.translate(STAGE_W / 2, STAGE_H / 2 - 20);
  ctx.scale(vsScale, vsScale);
  ctx.font = 'bold 124px monospace';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#09090b';
  ctx.strokeText('VS', 0, 36);
  const vsGrad = ctx.createLinearGradient(0, -60, 0, 40);
  vsGrad.addColorStop(0, '#fef08a');
  vsGrad.addColorStop(0.5, '#f59e0b');
  vsGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = vsGrad;
  ctx.fillText('VS', 0, 36);
  ctx.restore();

  // Arène en bas au centre
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(STAGE_W / 2 - 280, STAGE_H - 68, 560, 42);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 2;
  ctx.strokeRect(STAGE_W / 2 - 280, STAGE_H - 68, 560, 42);
  ctx.lineWidth = 1;
  ctx.font = 'bold 18px monospace';
  pxText(ctx, `${arena.name.toUpperCase()} · ${f2.city}`, STAGE_W / 2, STAGE_H - 41, '#ffffff', '#000000', 2);

  ctx.textAlign = 'left';
  ctx.restore();
}

/**
 * 5) BANDEAU MODE VEILLE / ÉCRAN DE VEILLE (ATTRACT MODE)
 */
export function drawAttractOverlay(ctx, state) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const blink = Math.floor(state.tick / 22) % 2 === 0;
  const topMode = state.screen === 'map' || state.screen === 'vs';
  const boxW = 810;
  const boxH = 38;
  const boxX = Math.round(STAGE_W / 2 - boxW / 2);
  const boxY = topMode ? 52 : STAGE_H - 52;

  ctx.fillStyle = 'rgba(9, 9, 11, 0.86)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = blink ? '#facc15' : '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.lineWidth = 1;

  ctx.textAlign = 'center';
  ctx.font = 'bold 17px monospace';
  pxText(
    ctx,
    '🎬 DÉMO VEILLE EN DIRECT · APPUYEZ SUR UNE TOUCHE OU CLIQUEZ POUR JOUER',
    STAGE_W / 2,
    boxY + 25,
    blink ? '#fef08a' : '#e2e8f0',
    '#000000',
    2
  );
  ctx.textAlign = 'left';
  ctx.restore();
}

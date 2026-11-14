import { FIGHTERS, FIGHTER_ORDER, ARENAS, ARENA_ORDER } from './data.js';

export const STAGE_W = 1280;
export const STAGE_H = 720;
export const FLOOR_Y = 640;

const ASSETS = {
  arenas: {},
  fighters: {}
};

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// Préchargement de tous les décors et sprites pixel-art 16-bit
ARENA_ORDER.forEach(id => {
  ASSETS.arenas[id] = loadImage(`assets/arenas/${id}.png`);
});

FIGHTER_ORDER.forEach(id => {
  ASSETS.fighters[id] = {
    idle: loadImage(`assets/fighters/${id}_idle.png`),
    attack: loadImage(`assets/fighters/${id}_attack.png`),
    portrait: loadImage(`assets/fighters/${id}_portrait.png`)
  };
});

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

  // Effets pixelisés légers pour rendre le décor vivant sans masquer le pixel-art
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
  }

  // Scanlines CRT rétro discrètes
  ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
  for (let y = 0; y < STAGE_H; y += 4) {
    ctx.fillRect(0, y, STAGE_W, 1);
  }

  ctx.restore();
}

/**
 * Dessine un sprite en 3 bandes horizontales pour animer la respiration et la marche
 * tout en gardant des pixels carrés nets (16-bit).
 */
function drawAnimatedSprite(ctx, sprite, drawX, drawY, drawW, drawH, f, t) {
  const sw = sprite.width;
  const sh = sprite.height;
  const isWalking = f.state === 'walk';
  const isIdle = f.state === 'idle' || f.state === 'block';

  if (!isWalking && !isIdle) {
    ctx.drawImage(sprite, 0, 0, sw, sh, drawX, drawY, drawW, drawH);
    return;
  }

  const b1 = Math.floor(sh * 0.34);
  const b2 = Math.floor(sh * 0.68);
  const d1 = Math.round(drawH * 0.34);
  const d2 = Math.round(drawH * 0.68);

  const headBob = isIdle ? Math.round(Math.sin(t * 0.13) * 3) : Math.round(Math.abs(Math.sin(t * 0.28)) * -4);
  const torsoBob = isIdle ? Math.round(Math.sin(t * 0.13 + 0.5) * 2) : Math.round(Math.abs(Math.sin(t * 0.28)) * -2);
  const torsoShift = isWalking ? Math.round(Math.sin(t * 0.28) * 3) : 0;
  const legShift = isWalking ? Math.round(Math.sin(t * 0.28 + Math.PI) * 6) : 0;

  // Bande 1 : Tête / Épaules
  ctx.drawImage(sprite, 0, 0, sw, b1, drawX + torsoShift, drawY + headBob, drawW, d1);
  // Bande 2 : Torse / Bras
  ctx.drawImage(sprite, 0, b1, sw, b2 - b1, drawX + torsoShift, drawY + d1 + torsoBob, drawW, d2 - d1);
  // Bande 3 : Jambes / Pieds (ancrés au sol)
  ctx.drawImage(sprite, 0, b2, sw, sh - b2, drawX + legShift, drawY + d2, drawW, drawH - d2);
}

/**
 * Dessine un combattant à partir de ses sprites PNG pixel-art détourés.
 */
export function drawFighter(ctx, f, t) {
  const pack = ASSETS.fighters[f.id];
  if (!pack || !pack.idle.complete || pack.idle.naturalWidth === 0) return;

  const isAttacking = f.state === 'light' || f.state === 'heavy' || f.state === 'special';
  const sprite = isAttacking && pack.attack.complete && pack.attack.naturalWidth > 0 ? pack.attack : pack.idle;

  const scale = 1.06;
  const idleW = pack.idle.width * scale;
  const drawW = Math.round(sprite.width * scale);
  const drawH = Math.round(sprite.height * scale);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(f.x), Math.round(f.y));

  // Ombre pixelisée ancrée au sol
  const groundOffset = FLOOR_Y - f.y;
  const shadowScale = Math.max(0.45, 1 - groundOffset / 450);
  const sw = Math.round(idleW * 0.85 * shadowScale);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
  ctx.fillRect(-Math.round(sw / 2), groundOffset - 6, sw, 10);
  ctx.fillRect(-Math.round(sw * 0.38), groundOffset - 10, Math.round(sw * 0.76), 16);

  ctx.scale(f.facing, 1);

  if (f.state === 'hit' && Math.floor(t / 2) % 2 === 0) {
    ctx.filter = 'brightness(1.9) contrast(1.2)';
  }

  if (f.state === 'ko') {
    ctx.translate(0, -28);
    ctx.rotate(-Math.PI / 2);
  }

  const crouchScaleY = f.state === 'crouch' ? 0.78 : 1;
  const crouchScaleX = f.state === 'crouch' ? 1.05 : 1;
  ctx.scale(crouchScaleX, crouchScaleY);

  // Aligne le bord arrière sur le sprite idle pour que l'attaque se projette vers l'avant
  const anchorX = Math.round(-idleW * 0.44);
  const drawY = -drawH;

  // Images rémanentes (afterimages) pendant les coups spéciaux
  if (f.state === 'special') {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.drawImage(sprite, anchorX - 24, drawY - 4, drawW, drawH);
    ctx.globalAlpha = 0.2;
    ctx.drawImage(sprite, anchorX - 46, drawY - 8, drawW, drawH);
    ctx.restore();
  }

  drawAnimatedSprite(ctx, sprite, anchorX, drawY, drawW, drawH, f, t);

  // Bouclier de garde pixelisé
  if (f.state === 'block') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.26)';
    ctx.fillRect(Math.round(idleW * 0.28), -Math.round(drawH * 0.88), 22, Math.round(drawH * 0.8));
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(Math.round(idleW * 0.28), -Math.round(drawH * 0.88), 22, Math.round(drawH * 0.8));
    ctx.lineWidth = 1;
  }

  ctx.restore();
}

/**
 * Effets pixelisés des 6 coups spéciaux + bannière cinématique.
 */
export function drawSpecialFX(ctx, specialFx, fighters) {
  if (!specialFx) return;
  const attacker = fighters[specialFx.attackerIdx];
  const target = fighters[1 - specialFx.attackerIdx];
  const def = FIGHTERS[attacker.id];
  const p = specialFx.timer / specialFx.duration;
  const sx = attacker.x;
  const tx = target.x;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (specialFx.timer < 20) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  if (attacker.id === 'm3g4') {
    const beamH = (28 + Math.sin(specialFx.timer * 0.6) * 10) | 0;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.fillRect(Math.min(sx, tx), FLOOR_Y - 190 - beamH, Math.abs(tx - sx), beamH * 2);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(Math.min(sx, tx), FLOOR_Y - 190 - 8, Math.abs(tx - sx), 16);
    ctx.fillStyle = 'rgba(14, 165, 233, 0.55)';
    ctx.fillRect(tx - 48, 0, 96, FLOOR_Y);
  } else if (attacker.id === 'madchat') {
    ctx.fillStyle = '#fb923c';
    for (let i = -2; i <= 2; i++) {
      for (let s = 0; s < 16; s++) {
        ctx.fillRect(tx - 90 + s * 12, FLOOR_Y - 260 + i * 34 + s * 8, 18, 10);
      }
    }
  } else if (attacker.id === 'darkmada') {
    const dir = sx < tx ? 1 : -1;
    for (let i = 0; i < 8; i++) {
      const fx = Math.round(sx + dir * (48 + i * 85 * p));
      const fy = FLOOR_Y - 70 - (i % 3) * 28;
      ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#fde047';
      ctx.fillRect(fx - 20, fy - 20, 40, 40);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx - 8, fy - 8, 16, 16);
    }
  } else if (attacker.id === 'goldohrack') {
    const dir = sx < tx ? 1 : -1;
    const fistX = Math.round(sx + (tx - sx) * Math.min(1, p * 1.45));
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(Math.min(sx, fistX), FLOOR_Y - 210, Math.abs(fistX - sx), 12);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(fistX - dir * 36 - 18, FLOOR_Y - 224, 36, 36);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(fistX - 28, FLOOR_Y - 228, 56, 44);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.strokeRect(fistX - 28, FLOOR_Y - 228, 56, 44);
    ctx.lineWidth = 1;
  } else if (attacker.id === 'koll') {
    const rad = Math.round(60 + p * 420);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 8;
    ctx.strokeRect(sx - rad, FLOOR_Y - 190 - rad * 0.45, rad * 2, rad * 0.9);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(sx, FLOOR_Y - 190);
      ctx.lineTo((sx + tx) / 2, FLOOR_Y - 290 + i * 55);
      ctx.lineTo(tx, FLOOR_Y - 160 + (i - 1) * 30);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  } else {
    // LURCK — Éclipse Nocturne
    ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(STAGE_W / 2 - 96, 170, 44, 44);
    ctx.fillRect(STAGE_W / 2 + 52, 170, 44, 44);
    ctx.fillStyle = '#020617';
    ctx.fillRect(STAGE_W / 2 - 78, 176, 10, 32);
    ctx.fillRect(STAGE_W / 2 + 68, 176, 10, 32);
    ctx.fillStyle = '#fde047';
    for (let i = -1; i <= 1; i++) {
      for (let s = 0; s < 14; s++) {
        ctx.fillRect(tx + i * 32 - 36 + s * 6, FLOOR_Y - 270 + s * 14, 14, 10);
      }
    }
  }

  // Bannière cinématique arcade
  ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
  ctx.fillRect(STAGE_W / 2 - 350, 134, 700, 48);
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 4;
  ctx.strokeRect(STAGE_W / 2 - 350, 134, 700, 48);
  ctx.lineWidth = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`⚡ ${def.name.toUpperCase()} : ${def.specialName.toUpperCase()} !`, STAGE_W / 2, 166);
  ctx.textAlign = 'left';
  ctx.restore();
}

/**
 * Dessine les particules pixelisées et les textes de dégâts / combos.
 */
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
    ctx.fillStyle = '#000000';
    ctx.fillText(ft.text, Math.round(ft.x) + 3, Math.round(ft.y) + 3);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
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
 * HUD Arcade fidèle au concept art Street Fighter (portraits illustrés,
 * barres jaunes/rouges avec L:/R: %, boîtier VS 99, jauges SUPER en bas).
 */
export function drawHUD(ctx, state) {
  const [p1, p2] = state.fighters;
  const f1 = FIGHTERS[p1.id];
  const f2 = FIGHTERS[p2.id];

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Portraits dans les coins supérieurs
  drawHudPortrait(ctx, p1.id, 20, 16, 94);
  drawHudPortrait(ctx, p2.id, STAGE_W - 114, 16, 94);

  const barW = 456;
  const barH = 30;
  const barY = 40;
  const p1X = 126;
  const p2X = STAGE_W - 126 - barW;

  // Fond rouge vif des dégâts subis (fidèle à la photo)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(p1X, barY, barW, barH);
  ctx.fillRect(p2X, barY, barW, barH);

  // Traînée orange/rouge différée
  ctx.fillStyle = '#f97316';
  const p1TrailW = Math.round((barW * Math.max(0, p1.trailHp)) / 100);
  ctx.fillRect(p1X + (barW - p1TrailW), barY, p1TrailW, barH);
  const p2TrailW = Math.round((barW * Math.max(0, p2.trailHp)) / 100);
  ctx.fillRect(p2X, barY, p2TrailW, barH);

  // Vie actuelle en jaune arcade lumineux (se vide depuis les bords vers le centre)
  const p1W = Math.round((barW * Math.max(0, p1.hp)) / 100);
  const p2W = Math.round((barW * Math.max(0, p2.hp)) / 100);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(p1X + (barW - p1W), barY, p1W, barH);
  ctx.fillRect(p2X, barY, p2W, barH);
  // Reflet clair en haut de la barre
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(p1X + (barW - p1W), barY + 2, p1W, 7);
  ctx.fillRect(p2X, barY + 2, p2W, 7);

  // Bordures blanches épaisses
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(p1X, barY, barW, barH);
  ctx.strokeRect(p2X, barY, barW, barH);
  ctx.lineWidth = 1;

  // Pourcentages L: XX% et R: XX% au-dessus des barres
  ctx.font = 'bold 17px monospace';
  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'right';
  ctx.fillText(`L: ${Math.max(0, Math.round(p1.hp))}%`, p1X + barW - 8, 30);
  ctx.textAlign = 'left';
  ctx.fillText(`R: ${Math.max(0, Math.round(p2.hp))}%`, p2X + 8, 30);

  // Boîtier central VS + Timer 99 bleu arcade
  ctx.fillStyle = '#0b1e3d';
  ctx.fillRect(STAGE_W / 2 - 48, 26, 96, 60);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(STAGE_W / 2 - 48, 26, 96, 60);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(STAGE_W / 2 - 44, 30, 88, 52);
  ctx.lineWidth = 1;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0b1e3d';
  ctx.fillRect(STAGE_W / 2 - 22, 8, 44, 22);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('VS', STAGE_W / 2, 24);

  ctx.fillStyle = state.timer <= 15 ? '#f87171' : '#e0f2fe';
  ctx.font = 'bold 40px monospace';
  ctx.fillText(String(Math.max(0, Math.ceil(state.timer))).padStart(2, '0'), STAGE_W / 2, 70);

  // Noms en lettres arcade ombrées sous les barres
  const name1 = `J1 · ${(f1.hudName || f1.name).toUpperCase()}`;
  const name2 = `${state.mode === 'bot' ? 'BOT IA' : 'J2'} · ${(f2.hudName || f2.name).toUpperCase()}`;

  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.fillText(name1, p1X + 4, 96);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name1, p1X + 2, 94);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#000000';
  ctx.fillText(name2, p2X + barW - 2, 96);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name2, p2X + barW - 4, 94);

  // Étoiles de rounds gagnés (BO3)
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = i < p1.rounds ? '#facc15' : '#334155';
    ctx.fillRect(p1X + barW - 24 - i * 24, 80, 14, 14);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(p1X + barW - 24 - i * 24, 80, 14, 14);

    ctx.fillStyle = i < p2.rounds ? '#facc15' : '#334155';
    ctx.fillRect(p2X + 10 + i * 24, 80, 14, 14);
    ctx.strokeRect(p2X + 10 + i * 24, 80, 14, 14);
  }

  // Compteur de combos
  ctx.textAlign = 'left';
  if (p2.comboCount >= 2 && p2.comboTimer > 0) {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`${p2.comboCount} HITS!`, 34, 168);
    ctx.fillStyle = '#facc15';
    ctx.fillText(`${p2.comboCount} HITS!`, 32, 166);
  }
  ctx.textAlign = 'right';
  if (p1.comboCount >= 2 && p1.comboTimer > 0) {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`${p1.comboCount} HITS!`, STAGE_W - 30, 168);
    ctx.fillStyle = '#facc15';
    ctx.fillText(`${p1.comboCount} HITS!`, STAGE_W - 32, 166);
  }

  // Jauges SUPER en bas gauche et droite (style concept art)
  const p1Level = Math.floor((p1.superMeter / 100) * 3);
  const p2Level = Math.floor((p2.superMeter / 100) * 3);

  // Gauche : L: X/3 [BARRE] SUPER
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#fde047';
  ctx.fillText(`L: ${p1Level}/3`, 24, STAGE_H - 22);

  const g1X = 102;
  const gY = STAGE_H - 38;
  const gW = 210;
  const gH = 22;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(g1X, gY, gW, gH);
  ctx.fillStyle = p1.superMeter >= 100 ? '#38bdf8' : '#0284c7';
  ctx.fillRect(g1X + 2, gY + 2, Math.round((gW - 4) * Math.min(100, p1.superMeter) / 100), gH - 4);
  ctx.strokeStyle = p1.superMeter >= 100 ? '#fde047' : '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(g1X, gY, gW, gH);
  ctx.lineWidth = 1;

  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = p1.superMeter >= 100 ? '#fde047' : '#38bdf8';
  ctx.fillText('SUPER', g1X + gW + 10, STAGE_H - 20);

  // Droite : SUPER [BARRE] R: X/3
  const g2X = STAGE_W - 102 - gW;
  ctx.textAlign = 'right';
  ctx.fillStyle = p2.superMeter >= 100 ? '#fde047' : '#38bdf8';
  ctx.fillText('SUPER', g2X - 10, STAGE_H - 20);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(g2X, gY, gW, gH);
  ctx.fillStyle = p2.superMeter >= 100 ? '#38bdf8' : '#0284c7';
  const fill2W = Math.round((gW - 4) * Math.min(100, p2.superMeter) / 100);
  ctx.fillRect(g2X + gW - 2 - fill2W, gY + 2, fill2W, gH - 4);
  ctx.strokeStyle = p2.superMeter >= 100 ? '#fde047' : '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(g2X, gY, gW, gH);
  ctx.lineWidth = 1;

  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fde047';
  ctx.fillText(`R: ${p2Level}/3`, g2X + gW + 10, STAGE_H - 22);

  // Badge central bas
  const arena = ARENAS[state.arena];
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(STAGE_W / 2 - 200, STAGE_H - 40, 400, 26);
  ctx.strokeStyle = '#3f3f46';
  ctx.strokeRect(STAGE_W / 2 - 200, STAGE_H - 40, 400, 26);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `ROUND ${state.roundNumber} · ${arena.name.toUpperCase()} · ${state.mode === 'bot' ? 'SOLO vs BOT' : '2J LOCAL'}`,
    STAGE_W / 2,
    STAGE_H - 22
  );

  // Annonce centrale
  if (state.announcement && state.announcementTimer > 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.76)';
    ctx.fillRect(0, STAGE_H / 2 - 64, STAGE_W, 128);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 64px monospace';
    ctx.fillText(state.announcement, STAGE_W / 2 + 4, STAGE_H / 2 + 26);
    ctx.fillStyle = '#fde047';
    ctx.fillText(state.announcement, STAGE_W / 2, STAGE_H / 2 + 22);
  }

  ctx.textAlign = 'left';
  ctx.restore();
}

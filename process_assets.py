import os
import math
import random
from collections import deque
from PIL import Image, ImageDraw, ImageEnhance

BASE_DIR = "/Users/brunoperrin/Antigravity/jeux"
RAW_DIR = os.path.join(BASE_DIR, "raw_assets")
ARENA_OUT_DIR = os.path.join(BASE_DIR, "assets", "arenas")
FIGHTER_OUT_DIR = os.path.join(BASE_DIR, "assets", "fighters")
UI_OUT_DIR = os.path.join(BASE_DIR, "assets", "ui")

ARENA_IDS = ["biker", "cod", "starcitizen", "techno", "viking", "nuclear"]
FIGHTER_IDS = ["darkmada", "goldohrack", "m3g4", "madchat", "koll", "lurck"]


def find_raw_file(prefix):
    for ext in [".jpg", ".jpeg", ".png", ".webp"]:
        p = os.path.join(RAW_DIR, prefix + ext)
        if os.path.exists(p):
            return p
    return None


def process_arena(arena_id):
    src = find_raw_file(f"arena_{arena_id}")
    if not src:
        print(f"[WARN] Missing arena raw asset for {arena_id}")
        return False

    img = Image.open(src).convert("RGB")
    img = ImageEnhance.Contrast(img).enhance(1.12)
    img = ImageEnhance.Color(img).enhance(1.15)

    small = img.resize((384, 216), Image.Resampling.BILINEAR)
    quant = small.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    pixel_rgb = quant.convert("RGB")

    final_img = pixel_rgb.resize((1280, 720), Image.Resampling.NEAREST)
    os.makedirs(ARENA_OUT_DIR, exist_ok=True)
    out_path = os.path.join(ARENA_OUT_DIR, f"{arena_id}.png")
    final_img.save(out_path, "PNG")
    print(f"[OK] Arena {arena_id} -> {out_path}")
    return True


def is_bg_pixel(r, g, b, bg_samples):
    if r > g + 42 and b > g + 42 and r > 115 and b > 115:
        return True
    for br, bg_c, bb in bg_samples:
        if abs(r - br) + abs(g - bg_c) + abs(b - bb) < 72:
            return True
    return False


def remove_magenta_bg(img):
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()

    corners = [px[2, 2][:3], px[w - 3, 2][:3], px[2, h - 3][:3], px[w - 3, h - 3][:3]]
    visited = bytearray(w * h)
    q = deque()

    def try_push(x, y):
        idx = y * w + x
        if visited[idx]:
            return
        r, g, b, a = px[x, y]
        if is_bg_pixel(r, g, b, corners):
            visited[idx] = 1
            q.append((x, y))

    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        cx, cy = q.popleft()
        px[cx, cy] = (0, 0, 0, 0)
        if cx > 0:
            try_push(cx - 1, cy)
        if cx + 1 < w:
            try_push(cx + 1, cy)
        if cy > 0:
            try_push(cx, cy - 1)
        if cy + 1 < h:
            try_push(cx, cy + 1)

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and r > g + 58 and b > g + 58 and r > 140 and b > 140:
                px[x, y] = (0, 0, 0, 0)

    for _ in range(2):
        to_clear = []
        to_outline = []
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                r, g, b, a = px[x, y]
                if a == 0:
                    continue
                touches_transp = (
                    px[x - 1, y][3] == 0
                    or px[x + 1, y][3] == 0
                    or px[x, y - 1][3] == 0
                    or px[x, y + 1][3] == 0
                )
                if touches_transp and r > g + 22 and b > g + 22:
                    if (r + g + b) > 310:
                        to_clear.append((x, y))
                    else:
                        to_outline.append((x, y))
        for x, y in to_clear:
            px[x, y] = (0, 0, 0, 0)
        for x, y in to_outline:
            px[x, y] = (18, 18, 26, 255)

    return rgba


def find_split_x(rgba):
    w, h = rgba.size
    px = rgba.load()
    col_counts = []
    start_x = int(w * 0.30)
    end_x = int(w * 0.64)
    for x in range(start_x, end_x):
        cnt = 0
        for y in range(0, h, 2):
            if px[x, y][3] > 0:
                cnt += 1
        col_counts.append((x, cnt))

    best_run = []
    cur_run = []
    for x, cnt in col_counts:
        if cnt <= 2:
            cur_run.append(x)
        else:
            if len(cur_run) > len(best_run):
                best_run = cur_run
            cur_run = []
    if len(cur_run) > len(best_run):
        best_run = cur_run

    if len(best_run) >= 8:
        return best_run[len(best_run) // 2]

    min_x, min_cnt = min(col_counts, key=lambda item: item[1])
    if min_cnt < h * 0.05:
        return min_x
    return None


def quantize_and_upscale(small_rgba, scale_factor=3):
    rw, rh = small_rgba.size
    rgb = small_rgba.convert("RGB")
    alpha = small_rgba.split()[3]
    quant_rgb = rgb.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = quant_rgb.convert("RGBA")
    out.putalpha(alpha)

    px = out.load()
    for y in range(rh):
        for x in range(rw):
            r, g, b, a = px[x, y]
            if a < 128:
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (r, g, b, 255)

    return out.resize((rw * scale_factor, rh * scale_factor), Image.Resampling.NEAREST)


def pixelize_sprite(crop_img, target_retro_h=110, scale_factor=3):
    bbox = crop_img.getbbox()
    if not bbox:
        return None
    trimmed = crop_img.crop(bbox)
    tw, th = trimmed.size
    if th <= 0 or tw <= 0:
        return None

    retro_h = target_retro_h
    retro_w = max(16, round(tw * (retro_h / th)))

    rgb_small = trimmed.convert("RGB").resize((retro_w, retro_h), Image.Resampling.BILINEAR)
    alpha_small = trimmed.split()[3].resize((retro_w, retro_h), Image.Resampling.NEAREST)
    small_rgba = rgb_small.convert("RGBA")
    small_rgba.putalpha(alpha_small)
    return quantize_and_upscale(small_rgba, scale_factor=scale_factor)


# Proportions anatomiques (coordonnées normalisées sur la base 1x rétro h=110px)
# Permet d'extraire tête, buste, bras avant/arrière, cuisses et tibias sans découper l'arme ou la cape
FIGHTER_RIGS = {
    "darkmada":   {"neck": 0.25, "waist": 0.53, "knee": 0.76, "hx": 0.48, "hip_x": 0.52, "sh_x": 0.54, "sh_y": 0.28, "arm_y1": 0.20, "arm_y2": 0.48, "leg_max_x": 0.98},
    "goldohrack": {"neck": 0.26, "waist": 0.52, "knee": 0.73, "hx": 0.49, "hip_x": 0.50, "sh_x": 0.61, "sh_y": 0.30, "arm_y1": 0.22, "arm_y2": 0.52, "leg_max_x": 0.98},
    "m3g4":       {"neck": 0.25, "waist": 0.52, "knee": 0.75, "hx": 0.47, "hip_x": 0.47, "sh_x": 0.58, "sh_y": 0.32, "arm_y1": 0.25, "arm_y2": 0.60, "leg_max_x": 0.98},
    "koll":       {"neck": 0.26, "waist": 0.52, "knee": 0.75, "hx": 0.50, "hip_x": 0.51, "sh_x": 0.57, "sh_y": 0.30, "arm_y1": 0.22, "arm_y2": 0.52, "leg_max_x": 0.98},
    "madchat":    {"neck": 0.26, "waist": 0.56, "knee": 0.78, "hx": 0.36, "hip_x": 0.34, "sh_x": 0.42, "sh_y": 0.36, "arm_y1": 0.00, "arm_y2": 0.70, "leg_max_x": 0.68, "head_max_x": 0.50},
    "lurck":      {"neck": 0.27, "waist": 0.60, "knee": 0.79, "hx": 0.52, "hip_x": 0.51, "sh_x": 0.65, "sh_y": 0.34, "arm_y1": 0.24, "arm_y2": 0.60, "leg_max_x": 0.86, "leg_min_x": 0.14},
}


def _to_retro_base(sprite_3x_or_crop, target_retro_h=110):
    bbox = sprite_3x_or_crop.getbbox()
    if not bbox:
        return None
    tr = sprite_3x_or_crop.crop(bbox).convert("RGBA")
    sw, sh = tr.size
    if sw <= 0 or sh <= 0:
        return None
    rw = max(16, round(sw * (target_retro_h / sh)))
    rgb = tr.convert("RGB").resize((rw, target_retro_h), Image.Resampling.BILINEAR)
    alp = tr.split()[3].resize((rw, target_retro_h), Image.Resampling.NEAREST)
    base = rgb.convert("RGBA")
    base.putalpha(alp)
    px = base.load()
    for y in range(target_retro_h):
        for x in range(rw):
            px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 255 if px[x, y][3] >= 128 else 0)
    return base


def _paint_joint_disk(img, cx, cy, r, sample_img=None):
    """Comble un petit disque d'articulation avec la couleur moyenne locale pour éviter tout trou aux pliures."""
    w, h = img.size
    px = img.load()
    src_px = (sample_img or img).load()
    cols = []
    for sy in range(max(0, cy - r - 2), min(h, cy + r + 3)):
        for sx in range(max(0, cx - r - 2), min(w, cx + r + 3)):
            if src_px[sx, sy][3] > 0:
                cols.append(src_px[sx, sy][:3])
    if not cols:
        return
    avg = (
        sum(c[0] for c in cols) // len(cols),
        sum(c[1] for c in cols) // len(cols),
        sum(c[2] for c in cols) // len(cols),
        255,
    )
    for yy in range(max(0, cy - r), min(h, cy + r + 1)):
        for xx in range(max(0, cx - r), min(w, cx + r + 1)):
            if (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r and px[xx, yy][3] == 0:
                px[xx, yy] = avg


def _segment_fighter(base, fighter_id):
    """Découpe un sprite rétro (rw x 110) en 8 segments articulés avec chevauchement propre aux joints."""
    rw, rh = base.size
    cfg = FIGHTER_RIGS.get(fighter_id, FIGHTER_RIGS["koll"])
    bpx = base.load()

    neck_y = round(rh * cfg["neck"])
    waist_y = round(rh * cfg["waist"])
    knee_y = round(rh * cfg["knee"])
    hip_x = round(rw * cfg["hip_x"])
    sh_x = round(rw * cfg["sh_x"])
    sh_y = round(rh * cfg["sh_y"])
    hx = round(rw * cfg["hx"])
    leg_min_x = round(rw * cfg.get("leg_min_x", 0.0))
    leg_max_x = round(rw * cfg.get("leg_max_x", 0.98))
    head_max_x = round(rw * cfg.get("head_max_x", 0.98))
    arm_y1 = round(rh * cfg["arm_y1"])
    arm_y2 = round(rh * cfg["arm_y2"])

    def blank():
        return Image.new("RGBA", (rw, rh), (0, 0, 0, 0))

    head = blank()
    torso = blank()
    arm_f = blank()
    arm_b = blank()
    thigh_f = blank()
    shin_f = blank()
    thigh_b = blank()
    shin_b = blank()

    hp, tp, afp, abp = head.load(), torso.load(), arm_f.load(), arm_b.load()
    tfp, sfp, tbp, sbp = thigh_f.load(), shin_f.load(), thigh_b.load(), shin_b.load()

    # Tête (inclut recouvrement du cou de +5px)
    for y in range(0, min(rh, neck_y + 5)):
        for x in range(0, min(rw, head_max_x)):
            c = bpx[x, y]
            if c[3] > 0:
                if fighter_id == "madchat" and x > rw * 0.42 and abs(c[0] - c[1]) < 16 and c[0] > 95:
                    continue
                hp[x, y] = c

    # Bras avant (côté droit >= sh_x - 5 pour overlap solide d'épaule ; exclut crinière pour Madchat)
    arm_f_x0 = max(0, sh_x - 5)
    for y in range(arm_y1, min(rh, arm_y2 + 3)):
        for x in range(arm_f_x0, rw):
            if bpx[x, y][3] > 0:
                if fighter_id == "madchat" and y < rh * 0.30 and x < rw * 0.58:
                    continue
                afp[x, y] = bpx[x, y]

    # Bras arrière (côté gauche < hx - 6)
    back_arm_lim = max(4, round(rw * 0.34))
    for y in range(max(neck_y, sh_y - 6), waist_y + 6):
        for x in range(0, min(rw, back_arm_lim)):
            if bpx[x, y][3] > 0:
                abp[x, y] = bpx[x, y]

    # Buste central (exclut proprement le bras avant / l'épée de Madchat pour éviter tout doublon)
    for y in range(max(0, neck_y - 3), min(rh, waist_y + 5)):
        for x in range(0, rw):
            c = bpx[x, y]
            if c[3] == 0:
                continue
            if x >= sh_x - 1 and y >= arm_y1 and y <= arm_y2 and not (fighter_id == "lurck" and x < rw * 0.64):
                continue
            if fighter_id == "madchat" and x > rw * 0.36 and abs(c[0] - c[1]) < 18 and abs(c[1] - c[2]) < 18 and c[0] > 85:
                continue
            if x < back_arm_lim - 5 and fighter_id not in ("madchat", "lurck"):
                continue
            tp[x, y] = c

    # Comble les disques d'articulation (cou, épaule, pectoral, bassin) pour zéro fente sous tous les angles
    _paint_joint_disk(torso, hx, neck_y + 1, 5, base)
    _paint_joint_disk(head, hx, neck_y + 1, 4, base)
    _paint_joint_disk(torso, sh_x - 2, sh_y + 3, 7, base)
    _paint_joint_disk(torso, sh_x + 2, sh_y + 5, 5, base)
    _paint_joint_disk(torso, hip_x, waist_y, 7, base)
    _paint_joint_disk(arm_f, sh_x, sh_y + 2, 4, base)

    # Cuisses & Tibias avant/arrière avec rotule arrondie au genou
    front_kx, front_ky_sum, front_kc = 0, 0, 0
    back_kx, back_ky_sum, back_kc = 0, 0, 0
    for y in range(max(0, waist_y - 3), rh):
        split_col = int(hip_x + (y - waist_y) * 0.08)
        for x in range(leg_min_x, leg_max_x):
            c = bpx[x, y]
            if c[3] == 0:
                continue
            is_front = x >= split_col
            in_thigh = y <= knee_y + 3
            in_shin = y >= knee_y - 3
            if is_front:
                if in_thigh:
                    tfp[x, y] = c
                if in_shin:
                    sfp[x, y] = c
                if abs(y - knee_y) <= 2:
                    front_kx += x
                    front_ky_sum += y
                    front_kc += 1
            else:
                if in_thigh:
                    tbp[x, y] = c
                if in_shin:
                    sbp[x, y] = c
                if abs(y - knee_y) <= 2:
                    back_kx += x
                    back_ky_sum += y
                    back_kc += 1

    fk = (front_kx // front_kc if front_kc else min(rw - 4, hip_x + 12), knee_y)
    bk = (back_kx // back_kc if back_kc else max(4, hip_x - 14), knee_y)
    _paint_joint_disk(thigh_f, fk[0], fk[1], 3, base)
    _paint_joint_disk(shin_f, fk[0], fk[1], 3, base)
    _paint_joint_disk(thigh_b, bk[0], bk[1], 3, base)
    _paint_joint_disk(shin_b, bk[0], bk[1], 3, base)

    return {
        "rw": rw, "rh": rh,
        "neck_pt": (hx, neck_y),
        "waist_pt": (hip_x - 2, waist_y),
        "sh_f_pt": (sh_x, sh_y + 2),
        "sh_b_pt": (max(8, back_arm_lim - 4), sh_y + 4),
        "hip_f_pt": (min(rw - 4, hip_x + 5), waist_y + 2),
        "hip_b_pt": (max(4, hip_x - 7), waist_y + 2),
        "knee_f_pt": fk,
        "knee_b_pt": bk,
        "head": head, "torso": torso, "arm_f": arm_f, "arm_b": arm_b,
        "thigh_f": thigh_f, "shin_f": shin_f, "thigh_b": thigh_b, "shin_b": shin_b,
    }


def _place_part(cw, ch, part_img, src_pivot, dst_pivot, angle_deg):
    """Place et pivote proprement un segment autour de son articulation sur le canevas (cw x ch)."""
    if not part_img or not part_img.getbbox():
        return Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    pw, ph = part_img.size
    margin = max(pw, ph) + 40
    tmp = Image.new("RGBA", (pw + margin * 2, ph + margin * 2), (0, 0, 0, 0))
    tmp.paste(part_img, (margin, margin), part_img)
    piv = (margin + src_pivot[0], margin + src_pivot[1])
    rot = tmp.rotate(angle_deg, resample=Image.Resampling.BICUBIC, center=piv)
    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    dx = round(dst_pivot[0] - piv[0])
    dy = round(dst_pivot[1] - piv[1])
    out.paste(rot, (dx, dy), rot)
    # Binarise l'alpha pour zéro halo gris en pixel-art
    opx = out.load()
    for yy in range(ch):
        for xx in range(cw):
            r, g, b, a = opx[xx, yy]
            opx[xx, yy] = (r, g, b, 255) if a >= 128 else (0, 0, 0, 0)
    return out


def _rot_pt(vx, vy, angle_deg):
    rad = math.radians(-angle_deg)  # PIL CCW +deg = horaire négatif en coordonnées Y bas
    c, s = math.cos(rad), math.sin(rad)
    return vx * c - vy * s, vx * s + vy * c


def generate_articulated_pose(rig, pose, fighter_id="", scale_factor=3):
    """
    Assemble le pantin articulé SF2 pour chaque coup/posture :
    idle2, walk, walk2, crouch, crouch_punch, jump, punch1, punch,
    kick1, kick, sweep, headbutt, shoryuken, spinkick, parry, hit.
    """
    rw, rh = rig["rw"], rig["rh"]
    cw = rw + 130
    ch = rh + 90
    ox = 55
    oy = 48

    # Paramètres cinématiques par défaut (0 = neutre, angles en degrés PIL: + torso/bras = haut/arrière, + jambes = avant/haut)
    p = {
        "body_dx": 0, "body_dy": 0,
        "torso_a": 0,
        "head_a": 0, "head_dx": 0, "head_dy": 0,
        "arm_f_a": 0, "arm_f_dx": 0, "arm_f_dy": 0,
        "arm_b_a": 0, "arm_b_dx": 0, "arm_b_dy": 0,
        "thigh_f_a": 0, "shin_f_a": 0,
        "thigh_b_a": 0, "shin_b_a": 0,
        "ground_snap": True,
        "fx": None,
    }

    if pose == "idle2":
        p.update(body_dy=3, torso_a=-4, head_a=-2, arm_f_a=5, arm_f_dy=-2, arm_b_a=-4, thigh_f_a=8, shin_f_a=-10, thigh_b_a=-7, shin_b_a=6)
    elif pose == "walk":
        p.update(body_dy=-1, torso_a=-8, head_a=-5, arm_f_a=-18, arm_f_dx=3, arm_b_a=18, thigh_f_a=26, shin_f_a=-12, thigh_b_a=-22, shin_b_a=-14)
    elif pose == "walk2":
        p.update(body_dy=1, torso_a=-6, head_a=-3, arm_f_a=14, arm_f_dx=-2, arm_b_a=-14, thigh_f_a=-18, shin_f_a=-14, thigh_b_a=24, shin_b_a=-8)
    elif pose == "crouch":
        # Vraie flexion des genoux : cuisses écartées + tibias droits verticaux au sol (thigh + shin == 0) !
        p.update(body_dy=24, torso_a=-12, head_a=-4, arm_f_a=-8, arm_f_dx=2, arm_b_a=-10, thigh_f_a=50, shin_f_a=-50, thigh_b_a=-36, shin_b_a=36)
    elif pose == "crouch_punch":
        p.update(body_dy=24, torso_a=-18, head_a=-6, arm_f_a=-18, arm_f_dx=6, arm_f_dy=2, arm_b_a=-24, thigh_f_a=52, shin_f_a=-52, thigh_b_a=-38, shin_b_a=38, fx="punch")
    elif pose == "jump":
        # Vrai saut SF2 genoux repliés à la poitrine + bras ouverts
        p.update(body_dy=-8, torso_a=-10, head_a=-6, arm_f_a=26, arm_f_dy=-2, arm_b_a=24, thigh_f_a=52, shin_f_a=-62, thigh_b_a=28, shin_b_a=-64, ground_snap=False)
    elif pose == "punch1":
        # Armement / début de coup de poing
        p.update(body_dy=2, torso_a=8, head_a=-4, arm_f_a=18, arm_f_dx=-4, arm_f_dy=1, arm_b_a=-12, thigh_f_a=12, shin_f_a=-8, thigh_b_a=-14, shin_b_a=4)
    elif pose == "punch":
        # Extension complète du coup de poing avant avec épaule bien soudée au torse !
        swing_ang = -36 if fighter_id == "madchat" else -16
        p.update(body_dy=2, torso_a=-15, head_a=-4, arm_f_a=swing_ang, arm_f_dx=5, arm_f_dy=1, arm_b_a=-22, thigh_f_a=18, shin_f_a=-12, thigh_b_a=-18, shin_b_a=-4, fx="punch")
    elif pose == "kick1":
        # Appel du genou haut avant extension (style karaté / Chun-Li)
        p.update(body_dy=0, torso_a=6, head_a=-6, arm_f_a=18, arm_b_a=-14, thigh_f_a=64, shin_f_a=-64, thigh_b_a=-4, shin_b_a=2)
    elif pose == "kick":
        # High kick complet jambe tendue + contrepoids du buste
        p.update(body_dy=-2, torso_a=16, head_a=-10, arm_f_a=22, arm_b_a=-24, thigh_f_a=72, shin_f_a=4, thigh_b_a=-16, shin_b_a=8, fx="kick")
    elif pose == "sweep":
        # Balayette basse SF2 : buste incliné bas + jambe avant tendue au ras du sol
        p.update(body_dy=26, torso_a=24, head_a=-12, arm_f_a=16, arm_b_a=-22, thigh_f_a=82, shin_f_a=2, thigh_b_a=-36, shin_b_a=38, fx="sweep")
    elif pose == "headbutt":
        # COUP DE BOULE : plongeon explosif tête la première + bras ramenés à la garde haute/arrière !
        p.update(body_dy=7, torso_a=-26, head_a=-20, head_dx=5, head_dy=1, arm_f_a=-8, arm_f_dx=-12, arm_f_dy=4, arm_b_a=-36, thigh_f_a=28, shin_f_a=-28, thigh_b_a=-32, shin_b_a=8, fx="headbutt")
    elif pose == "shoryuken":
        # SHORYUKEN (Ryu) : genou avant haut levé + uppercut tendu droit vers le ciel !
        up_ang = 36 if fighter_id == "madchat" else 52
        p.update(body_dy=-10, torso_a=8, head_a=8, arm_f_a=up_ang, arm_f_dx=1, arm_f_dy=-5, arm_b_a=-16, thigh_f_a=62, shin_f_a=-68, thigh_b_a=-10, shin_b_a=-12, ground_snap=False, fx="shoryuken")
    elif pose == "spinkick":
        # SPINNING BIRD / TATSUMAKI KICK (Chun-Li / Ryu) : vrille horizontale en l'air jambes déployées !
        p.update(body_dy=-8, torso_a=22, head_a=-12, arm_f_a=34, arm_b_a=-36, thigh_f_a=84, shin_f_a=0, thigh_b_a=-68, shin_b_a=6, ground_snap=False, fx="spinkick")
    elif pose == "parry":
        # Garde / Parade active SF3 : avant-bras relevé en bouclier
        p.update(body_dy=2, torso_a=10, head_a=-4, arm_f_a=30, arm_f_dx=-4, arm_f_dy=-5, arm_b_a=16, thigh_f_a=10, shin_f_a=-8, thigh_b_a=-12, shin_b_a=4)
    elif pose == "hit":
        # Réaction aux coups : tête & torse projetés en arrière !
        p.update(body_dy=2, torso_a=18, head_a=24, head_dx=-3, arm_f_a=36, arm_f_dx=-6, arm_b_a=-26, thigh_f_a=6, shin_f_a=-4, thigh_b_a=-14, shin_b_a=4)

    waist_src = rig["waist_pt"]
    waist_dst = (ox + waist_src[0] + p["body_dx"], oy + waist_src[1] + p["body_dy"])

    def on_torso(src_pt, extra_dx=0, extra_dy=0):
        vx = src_pt[0] - waist_src[0]
        vy = src_pt[1] - waist_src[1]
        rx, ry = _rot_pt(vx, vy, p["torso_a"])
        return (waist_dst[0] + rx + extra_dx, waist_dst[1] + ry + extra_dy)

    neck_dst = on_torso(rig["neck_pt"], p["head_dx"], p["head_dy"])
    sh_f_dst = on_torso(rig["sh_f_pt"], p["arm_f_dx"], p["arm_f_dy"])
    sh_b_dst = on_torso(rig["sh_b_pt"], p["arm_b_dx"], p["arm_b_dy"])

    # Chaînes cinématiques hanche -> genou -> tibia
    hip_f_dst = (waist_dst[0] + (rig["hip_f_pt"][0] - waist_src[0]), waist_dst[1] + (rig["hip_f_pt"][1] - waist_src[1]))
    hip_b_dst = (waist_dst[0] + (rig["hip_b_pt"][0] - waist_src[0]), waist_dst[1] + (rig["hip_b_pt"][1] - waist_src[1]))

    fk_vx = rig["knee_f_pt"][0] - rig["hip_f_pt"][0]
    fk_vy = rig["knee_f_pt"][1] - rig["hip_f_pt"][1]
    fk_rx, fk_ry = _rot_pt(fk_vx, fk_vy, p["thigh_f_a"])
    knee_f_dst = (hip_f_dst[0] + fk_rx, hip_f_dst[1] + fk_ry)

    bk_vx = rig["knee_b_pt"][0] - rig["hip_b_pt"][0]
    bk_vy = rig["knee_b_pt"][1] - rig["hip_b_pt"][1]
    bk_rx, bk_ry = _rot_pt(bk_vx, bk_vy, p["thigh_b_a"])
    knee_b_dst = (hip_b_dst[0] + bk_rx, hip_b_dst[1] + bk_ry)

    # Rendu par ordre de profondeur (arrière-plan -> premier plan)
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    layers = [
        _place_part(cw, ch, rig["arm_b"], rig["sh_b_pt"], sh_b_dst, p["torso_a"] + p["arm_b_a"]),
        _place_part(cw, ch, rig["thigh_b"], rig["hip_b_pt"], hip_b_dst, p["thigh_b_a"]),
        _place_part(cw, ch, rig["shin_b"], rig["knee_b_pt"], knee_b_dst, p["thigh_b_a"] + p["shin_b_a"]),
        _place_part(cw, ch, rig["torso"], waist_src, waist_dst, p["torso_a"]),
        _place_part(cw, ch, rig["thigh_f"], rig["hip_f_pt"], hip_f_dst, p["thigh_f_a"]),
        _place_part(cw, ch, rig["shin_f"], rig["knee_f_pt"], knee_f_dst, p["thigh_f_a"] + p["shin_f_a"]),
        _place_part(cw, ch, rig["head"], rig["neck_pt"], neck_dst, p["torso_a"] + p["head_a"]),
        _place_part(cw, ch, rig["arm_f"], rig["sh_f_pt"], sh_f_dst, p["torso_a"] + p["arm_f_a"]),
    ]
    for lay in layers:
        canvas = Image.alpha_composite(canvas, lay)

    # Supprime uniquement les poussières isolées (< 12 px) avant d'ajouter les éclairs d'impact
    w_c, h_c = canvas.size
    cpx = canvas.load()
    vis_c = bytearray(w_c * h_c)
    for yy in range(h_c):
        for xx in range(w_c):
            idx_c = yy * w_c + xx
            if not vis_c[idx_c] and cpx[xx, yy][3] > 0:
                q_c = deque([(xx, yy)])
                vis_c[idx_c] = 1
                comp = []
                while q_c:
                    qx, qy = q_c.popleft()
                    comp.append((qx, qy))
                    for nx, ny in ((qx - 1, qy), (qx + 1, qy), (qx, qy - 1), (qx, qy + 1)):
                        if 0 <= nx < w_c and 0 <= ny < h_c:
                            nidx = ny * w_c + nx
                            if not vis_c[nidx] and cpx[nx, ny][3] > 0:
                                vis_c[nidx] = 1
                                q_c.append((nx, ny))
                if len(comp) < 12:
                    for qx, qy in comp:
                        cpx[qx, qy] = (0, 0, 0, 0)

    # Petits effets graphiques d'impact 16-bit directement sur les poses d'action
    draw = ImageDraw.Draw(canvas)
    if p["fx"] == "punch":
        # Traînée cinétique blanche/jaune au bout du poing avant
        bx = layers[7].getbbox()
        if bx:
            fx_x, fx_y = bx[2] - 1, (bx[1] + bx[3]) // 2
            draw.line([(fx_x - 10, fx_y), (fx_x + 7, fx_y)], fill=(254, 240, 138, 240), width=2)
            draw.arc((fx_x - 3, fx_y - 7, fx_x + 8, fx_y + 7), -75, 75, fill=(255, 255, 255, 235), width=2)
    elif p["fx"] == "kick":
        bx = layers[5].getbbox()
        if bx:
            fx_x, fx_y = bx[2] - 1, (bx[1] + bx[3]) // 2
            draw.arc((fx_x - 12, fx_y - 11, fx_x + 7, fx_y + 11), -70, 60, fill=(254, 240, 138, 235), width=2)
    elif p["fx"] == "sweep":
        bx = layers[5].getbbox()
        if bx:
            fx_x, fx_y = bx[2] - 1, bx[3] - 3
            draw.line([(fx_x - 18, fx_y), (fx_x + 8, fx_y)], fill=(56, 189, 248, 235), width=2)
            draw.line([(fx_x - 14, fx_y - 2), (fx_x + 6, fx_y - 2)], fill=(254, 240, 138, 235), width=2)
    elif p["fx"] == "headbutt":
        bx = layers[6].getbbox()
        if bx:
            fx_x, fx_y = bx[2] + 1, bx[1] + max(4, (bx[3] - bx[1]) // 3)
            draw.arc((fx_x - 6, fx_y - 9, fx_x + 7, fx_y + 9), -70, 70, fill=(251, 146, 60, 245), width=2)
            draw.arc((fx_x - 2, fx_y - 6, fx_x + 11, fx_y + 6), -60, 60, fill=(255, 255, 255, 245), width=2)
    elif p["fx"] == "shoryuken":
        bx = layers[7].getbbox()
        if bx:
            fx_x, fx_y = (bx[0] + bx[2]) // 2, bx[1]
            draw.polygon([(fx_x, max(0, fx_y - 12)), (fx_x - 5, fx_y + 2), (fx_x + 5, fx_y + 2)], fill=(250, 204, 21, 220))
            draw.line([(fx_x, max(0, fx_y - 10)), (fx_x, fx_y + 10)], fill=(255, 255, 255, 240), width=2)
    elif p["fx"] == "spinkick":
        bx = layers[5].getbbox()
        if bx:
            cy_s = (bx[1] + bx[3]) // 2
            draw.arc((bx[0] - 8, cy_s - 6, bx[2] + 8, cy_s + 6), -25, 205, fill=(56, 189, 248, 225), width=2)

    if pose == "parry":
        pb = layers[7].getbbox()
        if pb:
            gx = pb[2] + 2
            draw.line([(gx, pb[1] - 4), (gx, pb[3] + 6)], fill=(14, 165, 233, 255), width=3)
            draw.line([(gx, pb[1] - 2), (gx, pb[3] + 4)], fill=(224, 242, 254, 255), width=1)

    bbox = canvas.getbbox()
    if not bbox:
        return None
    return quantize_and_upscale(canvas.crop(bbox), scale_factor=scale_factor)


def add_block(px, w, h, gx, gy, col, bs=3):
    for dy in range(bs):
        for dx in range(bs):
            x, y = gx + dx, gy + dy
            if 0 <= x < w and 0 <= y < h:
                px[x, y] = col


def soften_golden_dog(attack_sprite):
    """Adoucit la gueule de Sushi le Golden Retriever sur le sprite d'attaque (langue rose joyeuse)."""
    img = attack_sprite.copy().convert("RGBA")
    px = img.load()
    w, h = img.size

    for y in range(int(h * 0.58), int(h * 0.72)):
        for x in range(int(w * 0.84), w):
            r, g, b, a = px[x, y]
            if a > 0 and r > 195 and g > 195 and b > 180:
                px[x, y] = (244, 114, 160, 255)

    for bx, by, col in [
        (303, 210, (236, 72, 153, 255)),
        (306, 210, (249, 168, 212, 255)),
        (303, 213, (236, 72, 153, 255)),
        (306, 213, (244, 114, 182, 255)),
        (303, 216, (219, 39, 119, 255)),
    ]:
        add_block(px, w, h, bx, by, col, 3)
    return img


def build_koll_bunny_special(koll_idle):
    """Crée koll_special.png : Koll déguisé avec de jolies oreilles de lapin soudées à ses cheveux (Super-Pouvoir)."""
    kw, kh = koll_idle.size  # 201 x 330
    pad_top = 75
    out = Image.new("RGBA", (kw + 24, kh + pad_top), (0, 0, 0, 0))
    out.paste(koll_idle, (18, pad_top), koll_idle)
    w, h = out.size
    px = out.load()

    dark = (22, 22, 34, 255)
    white = (248, 250, 252, 255)
    shade = (203, 213, 225, 255)
    pink = (244, 114, 182, 255)
    pink_lt = (251, 207, 232, 255)

    # Oreille gauche bien ancrée directement dans ses cheveux noirs (y = 24..96)
    for y in range(24, 96, 3):
        cx = 93
        is_top = y <= 27
        half = 6 if 30 <= y <= 84 else 3
        for dx in range(-half - 3, half + 6, 3):
            gx = cx + dx
            if is_top or abs(dx) == half + 3:
                add_block(px, w, h, gx, y, dark)
            elif abs(dx) <= 3 and 36 <= y <= 84:
                add_block(px, w, h, gx, y, pink if (y < 60) else pink_lt)
            else:
                add_block(px, w, h, gx, y, white if dx <= 0 else shade)

    # Oreille droite souplement recourbée au sommet (y = 27..96)
    for y in range(27, 96, 3):
        cx = 129 if y >= 45 else 135 if y >= 33 else 141
        is_top = y <= 30
        half = 6 if 33 <= y <= 84 else 3
        for dx in range(-half - 3, half + 6, 3):
            gx = cx + dx
            if is_top or abs(dx) == half + 3:
                add_block(px, w, h, gx, y, dark)
            elif abs(dx) <= 3 and 39 <= y <= 84:
                add_block(px, w, h, gx, y, pink if (y < 63) else pink_lt)
            else:
                add_block(px, w, h, gx, y, white if dx <= 0 else shade)

    # Remet la pointe des cheveux noirs par-dessus la base des oreilles pour un fondu naturel
    for y in range(81, 96, 3):
        for x in range(60, 160, 3):
            if koll_idle.getpixel((x - 18, y - pad_top))[3] > 0:
                add_block(px, w, h, x, y, koll_idle.getpixel((x - 18, y - pad_top)))

    # Petit nez rose mignon & moustaches blanches sur la joue de Koll
    add_block(px, w, h, 141, 117, pink)
    add_block(px, w, h, 147, 114, white)
    add_block(px, w, h, 150, 120, white)

    # Petit pompon blanc de queue collé à sa hanche (x = 45..54)
    for bx, by, col in [
        (45, 222, white), (48, 222, white), (45, 225, white), (48, 225, shade),
        (42, 222, dark), (51, 222, dark), (42, 225, dark), (51, 225, dark),
        (45, 219, dark), (48, 219, dark), (45, 228, dark), (48, 228, dark),
    ]:
        add_block(px, w, h, bx, by, col)

    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def keep_largest_component(img):
    """Ne conserve que le plus gros bloc connecté de pixels opaques (supprime les poussières flottantes)."""
    w, h = img.size
    px = img.load()
    vis = bytearray(w * h)
    comps = []
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if not vis[idx] and px[x, y][3] > 0:
                q = deque([(x, y)])
                vis[idx] = 1
                cells = []
                while q:
                    cx, cy = q.popleft()
                    cells.append((cx, cy))
                    for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                        if 0 <= nx < w and 0 <= ny < h:
                            nidx = ny * w + nx
                            if not vis[nidx] and px[nx, ny][3] > 0:
                                vis[nidx] = 1
                                q.append((nx, ny))
                comps.append(cells)
    if len(comps) <= 1:
        return img
    largest = max(comps, key=len)
    keep = set(largest)
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 0 and (x, y) not in keep:
                px[x, y] = (0, 0, 0, 0)
    b = img.getbbox()
    return img.crop(b) if b else img


def build_goldohrack_rocket_pack(gold_attack):
    """
    À partir de goldohrack_attack (avec avant-bras détaché x >= 231, y <= 145) :
    - goldohrack_fist.png : uniquement le bout de bras / poing fusée autonome propre
    - goldohrack_special.png : Goldohrack sans son avant-bras (tuyère bleue au coude)
    - goldohrack_attack.png : coup de poing normal avec avant-bras rattaché au bras
    """
    w, h = gold_attack.size

    # 1) Extraction propre du poing-fusée
    fist_crop = gold_attack.crop((231, 66, w, 138)).copy()
    fw, fh = fist_crop.size
    fpx = fist_crop.load()
    for y in range(fh):
        for x in range(fw):
            r, g, b, a = fpx[x, y]
            # Supprime les petits éclats bleus/cyans isolés autour du poing
            if a > 0 and b > r + 18:
                fpx[x, y] = (0, 0, 0, 0)
    fist_clean = keep_largest_component(fist_crop)
    fcw, fch = fist_clean.size
    padded_fist = Image.new("RGBA", (fcw + 9, fch), (0, 0, 0, 0))
    padded_fist.paste(fist_clean, (9, 0), fist_clean)
    pfpx = padded_fist.load()
    # Ajoute une petite tuyère sombre propre au culot arrière du poing-fusée
    for y in range(6, fch - 6, 3):
        if pfpx[12, y][3] > 0 or pfpx[15, y][3] > 0:
            add_block(pfpx, fcw + 9, fch, 6, y, (30, 41, 59, 255))
            add_block(pfpx, fcw + 9, fch, 3, y, (56, 189, 248, 255))
    fb = padded_fist.getbbox()
    fist_img = padded_fist.crop(fb) if fb else padded_fist

    # 2) Goldohrack special (corps sans le poing détaché)
    special_body = gold_attack.copy()
    spx = special_body.load()
    for y in range(0, 148):
        for x in range(225, w):
            spx[x, y] = (0, 0, 0, 0)
    sb = special_body.getbbox()
    special_body = special_body.crop(sb) if sb else special_body

    # 3) Goldohrack attack normal (avant-bras rapproché et connecté à l'épaule !)
    attached_atk = special_body.copy()
    aw, ah = attached_atk.size
    attached_atk_canvas = Image.new("RGBA", (max(aw, 186 + fist_img.width + 6), ah), (0, 0, 0, 0))
    attached_atk_canvas.paste(attached_atk, (0, 0), attached_atk)
    attached_atk_canvas.paste(fist_img, (186, 69), fist_img)
    apx = attached_atk_canvas.load()
    for gy in range(78, 108, 3):
        add_block(apx, attached_atk_canvas.width, attached_atk_canvas.height, 180, gy, (148, 163, 184, 255))
        add_block(apx, attached_atk_canvas.width, attached_atk_canvas.height, 183, gy, (51, 65, 85, 255))
    ab = attached_atk_canvas.getbbox()
    attached_atk_final = attached_atk_canvas.crop(ab) if ab else attached_atk_canvas

    return attached_atk_final, special_body, fist_img


def build_sushi_and_darkmada_special(dark_idle, dark_attack):
    """
    Extrait Sushi le chien tout seul et gentil (sushi_solo.png) pour son attaque autonome
    et génère darkmada_special.png (DarkMada propre sans le chien ni ses contours).
    """
    # 1) Sushi Solo à partir du bond joyeux dans darkmada_attack.png
    dw, dh = dark_attack.size
    sushi_canvas = Image.new("RGBA", (dw, dh), (0, 0, 0, 0))
    spx = sushi_canvas.load()
    dpx = dark_attack.load()

    def is_warm_dog(r, g, b):
        if r > 125 and g > 80 and b < 130 and (r - b) > 35:
            return True
        if r > 190 and g < 185 and b > 120:
            return True
        return False

    dog_mask = [[False] * dw for _ in range(dh)]
    for y in range(165, dh):
        for x in range(72, dw):
            r, g, b, a = dpx[x, y]
            if a > 0 and is_warm_dog(r, g, b):
                dog_mask[y][x] = True

    for y in range(166, dh - 1):
        for x in range(72, dw - 1):
            r, g, b, a = dpx[x, y]
            if a > 0 and not dog_mask[y][x] and (r + g + b) < 160:
                if (
                    dog_mask[y - 1][x] or dog_mask[y + 1][x]
                    or dog_mask[y][x - 1] or dog_mask[y][x + 1]
                ):
                    spx[x, y] = (r, g, b, 255)
            if dog_mask[y][x]:
                spx[x, y] = (r, g, b, 255)

    # Comble proprement le ventre arrondi de Sushi sans barre noire plate
    for y in range(219, 255, 3):
        for x in range(156, 201, 3):
            if spx[x, y][3] == 0:
                tone = (242, 192, 102, 255) if y < 237 else (216, 158, 72, 255)
                add_block(spx, dw, dh, x, y, tone)

    # Adoucit l'expression de Sushi (museau souriant, joue rosée, œil amical & petite langue rose)
    for bx, by, col in [
        (300, 186, (28, 25, 23, 255)), (303, 186, (242, 192, 102, 255)),
        (300, 195, (232, 178, 92, 255)), (303, 195, (232, 178, 92, 255)),
        (306, 195, (232, 178, 92, 255)), (309, 195, (216, 158, 72, 255)),
        (297, 198, (244, 114, 182, 255)), (300, 198, (232, 178, 92, 255)),
        (303, 198, (244, 114, 182, 255)), (306, 198, (249, 168, 212, 255)),
        # Petit collier rouge cœur de Sushi
        (237, 204, (220, 38, 38, 255)), (240, 207, (220, 38, 38, 255)),
        (243, 210, (220, 38, 38, 255)), (246, 213, (250, 204, 21, 255)),
    ]:
        add_block(spx, dw, dh, bx, by, col)

    sushi_clean = keep_largest_component(sushi_canvas)
    sb = sushi_clean.getbbox()
    sushi_solo = sushi_clean.crop(sb) if sb else sushi_clean

    # 2) DarkMada seul : préserve uniquement son corps & ses 2 jambes en jean bleu-gris (supprime 100% des contours du chien !)
    dm = dark_idle.copy()
    dmw, dmh = dm.size
    dmpx = dm.load()
    # Marque les pixels chauds du chien + dilate dans les contours chauds/sombres situés hors des 2 jambes de DarkMada
    vis = [[False] * dmw for _ in range(dmh)]
    q = deque()
    for y in range(174, dmh):
        for x in range(45, dmw):
            r, g, b, a = dmpx[x, y]
            # N'amorce que sur les vrais pixels dorés du pelage (évite les genoux troués à x ~ 55,148 en y<220)
            is_jean_knee_patch = (y < 235 and x < 155 and dmpx[max(0, x - 9), y][2] > dmpx[max(0, x - 9), y][0])
            if a > 0 and not is_jean_knee_patch and r > 135 and (r - b) > 38:
                vis[y][x] = True
                q.append((x, y))
    while q:
        cx, cy = q.popleft()
        dmpx[cx, cy] = (0, 0, 0, 0)
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 42 <= nx < dmw and 172 <= ny < dmh and not vis[ny][nx]:
                nr, ng, nb, na = dmpx[nx, ny]
                if na > 0:
                    # Efface pelage doré + contours sombres/bruns qui ne sont PAS les pantalons bleu-nuit (nb > nr + 6)
                    if (nr - nb) > 12 or (nx > 168) or ((nr + ng + nb) < 95 and nr >= nb):
                        vis[ny][nx] = True
                        q.append((nx, ny))

    dm_clean = keep_largest_component(dm)

    # 3) Sushi compagnon (sushi_idle.png) dérivé directement du corps complet de Sushi (4 pattes + queue touffue !)
    sw_s, sh_s = sushi_solo.size
    pad_s = Image.new("RGBA", (sw_s + 24, sh_s + 24), (0, 0, 0, 0))
    pad_s.paste(sushi_solo, (12, 12), sushi_solo)
    # Incline légèrement vers le sol (posture calme prête à accompagner DarkMada) et redimensionne à taille compagnon
    rot_s = pad_s.rotate(-10, resample=Image.Resampling.NEAREST)
    rsb = rot_s.getbbox()
    cropped_s = rot_s.crop(rsb) if rsb else sushi_solo
    cw_s, ch_s = cropped_s.size
    target_h = 132  # hauteur rétro ~44px (proportion parfaite aux pieds du motard 330px)
    target_w = max(48, round(cw_s * (target_h / ch_s)) // 3 * 3)
    sushi_idle = cropped_s.resize((target_w, target_h), Image.Resampling.NEAREST)

    return dm_clean, sushi_solo, sushi_idle


def make_portrait(idle_sprite):
    w, h = idle_sprite.size
    head_band = idle_sprite.crop((0, 0, w, max(24, int(h * 0.44))))
    bbox = head_band.getbbox()
    if bbox:
        head_band = head_band.crop(bbox)

    size = 120
    bg = Image.new("RGBA", (size, size), (12, 22, 46, 255))
    hw, hh = head_band.size
    if hw > 0 and hh > 0:
        scale = min((size - 12) / hw, (size - 12) / hh)
        nw, nh = max(1, int(hw * scale)), max(1, int(hh * scale))
        resized = head_band.resize((nw, nh), Image.Resampling.NEAREST)
        bg.paste(resized, ((size - nw) // 2, (size - nh) // 2 + 2), resized)
    return bg


def process_fighter(fighter_id):
    src = find_raw_file(f"fighter_{fighter_id}")
    if not src:
        print(f"[WARN] Missing fighter raw asset for {fighter_id}")
        return False

    raw = Image.open(src)
    cleaned = remove_magenta_bg(raw)
    w, h = cleaned.size
    split_x = find_split_x(cleaned)

    if split_x is not None:
        left_crop = cleaned.crop((0, 0, split_x, h))
        right_crop = cleaned.crop((split_x, 0, w, h))
    else:
        left_crop = cleaned
        right_crop = cleaned.transform(
            cleaned.size,
            Image.Transform.AFFINE,
            (1, -0.14, 0, 0, 1, 0),
            resample=Image.Resampling.NEAREST,
        )

    idle_sprite = pixelize_sprite(left_crop)
    attack_sprite = pixelize_sprite(right_crop)

    if idle_sprite is None:
        print(f"[WARN] Empty idle sprite for {fighter_id}")
        return False
    if attack_sprite is None:
        attack_sprite = idle_sprite.copy()

    if fighter_id == "darkmada":
        attack_sprite = soften_golden_dog(attack_sprite)

    os.makedirs(FIGHTER_OUT_DIR, exist_ok=True)

    pose_sprites = {
        "idle": idle_sprite,
        "attack": attack_sprite,
    }

    rig_source = idle_sprite
    if fighter_id == "goldohrack":
        attached_atk, gold_special, gold_fist = build_goldohrack_rocket_pack(attack_sprite)
        pose_sprites["attack"] = attached_atk
        pose_sprites["special"] = gold_special
        gold_fist.save(os.path.join(FIGHTER_OUT_DIR, "goldohrack_fist.png"), "PNG")
    elif fighter_id == "koll":
        pose_sprites["special"] = build_koll_bunny_special(idle_sprite)
    elif fighter_id == "darkmada":
        dark_special, sushi_solo, sushi_idle = build_sushi_and_darkmada_special(idle_sprite, attack_sprite)
        pose_sprites["special"] = dark_special
        # DarkMada articulé depuis son corps sans Sushi (Sushi est animé séparément à côté de lui !)
        rig_source = dark_special
        sushi_solo.save(os.path.join(FIGHTER_OUT_DIR, "sushi_solo.png"), "PNG")
        sushi_idle.save(os.path.join(FIGHTER_OUT_DIR, "sushi_idle.png"), "PNG")

    # Découpe squelettique 1x rétro & génération des 16 poses articulées SF2 !
    retro_base = _to_retro_base(rig_source, target_retro_h=110)
    if retro_base is not None:
        rig = _segment_fighter(retro_base, fighter_id)
        articulated_names = [
            "idle2", "walk", "walk2", "crouch", "crouch_punch", "jump",
            "punch1", "punch", "kick1", "kick", "sweep",
            "headbutt", "shoryuken", "spinkick", "parry", "hit",
        ]
        for pname in articulated_names:
            pose_sprites[pname] = generate_articulated_pose(rig, pname, fighter_id=fighter_id) or idle_sprite

    for suffix, sp in pose_sprites.items():
        sp.save(os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_{suffix}.png"), "PNG")

    make_portrait(idle_sprite).save(os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_portrait.png"), "PNG")
    print(f"[OK] Fighter {fighter_id} -> {len(pose_sprites)} articulated poses ({idle_sprite.size})")
    return True


def build_title_screen():
    """Compose un écran de démarrage 16-bit style Sue Fighter II avec nos 6 personnages."""
    W, H = 384, 216
    sky = Image.new("RGB", (W, H), (18, 12, 42))
    draw = ImageDraw.Draw(sky)

    for y in range(H):
        t = y / H
        if t < 0.25:
            k = t / 0.25
            r = int(28 + 70 * k)
            g = int(18 + 30 * k)
            b = int(68 + 25 * k)
        elif t < 0.65:
            k = (t - 0.25) / 0.40
            r = int(98 + 142 * k)
            g = int(48 + 75 * k)
            b = int(93 - 45 * k)
        else:
            k = (t - 0.65) / 0.35
            r = int(240 - 205 * k)
            g = int(123 - 103 * k)
            b = int(48 - 18 * k)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    cx, cy = 192, 118
    for rad, col in [(62, (251, 146, 60)), (48, (250, 204, 21)), (34, (254, 240, 138))]:
        draw.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), fill=col)

    rng = random.Random(42)
    for _ in range(18):
        cl_x = rng.randint(-20, W - 40)
        cl_y = rng.randint(14, 112)
        cl_w = rng.randint(36, 92)
        cl_col = (249, 115, 22) if cl_y > 68 else (124, 58, 137)
        draw.rectangle((cl_x, cl_y, cl_x + cl_w, cl_y + 4), fill=cl_col)
        draw.rectangle((cl_x + 8, cl_y - 3, cl_x + cl_w - 10, cl_y), fill=cl_col)

    sil_col = (34, 22, 54)
    draw.polygon([(20, 170), (28, 108), (52, 108), (60, 170)], fill=sil_col)
    draw.polygon([(64, 170), (70, 116), (90, 116), (96, 170)], fill=sil_col)
    draw.polygon([(126, 170), (138, 98), (144, 72), (146, 98), (158, 170)], fill=sil_col)
    for bx, bw, bh in [(225, 20, 62), (250, 16, 80), (272, 24, 54), (305, 18, 72), (332, 28, 48)]:
        draw.rectangle((bx, 170 - bh, bx + bw, 170), fill=sil_col)
    draw.rectangle((0, 166, W, H), fill=(18, 14, 30))

    canvas = sky.convert("RGBA")

    def paste_fighter(fid, target_h, center_x, bottom_y, flip=False):
        p = os.path.join(FIGHTER_OUT_DIR, f"{fid}_idle.png")
        if not os.path.exists(p):
            return
        sp = Image.open(p).convert("RGBA")
        if flip:
            sp = sp.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        sw, sh = sp.size
        nw = max(1, round(sw * (target_h / sh)))
        rs = sp.resize((nw, target_h), Image.Resampling.NEAREST)
        canvas.paste(rs, (center_x - nw // 2, bottom_y - target_h), rs)

    paste_fighter("m3g4", 108, 42, 198, flip=False)
    paste_fighter("lurck", 112, 336, 198, flip=True)
    paste_fighter("madchat", 116, 92, 206, flip=False)
    paste_fighter("koll", 116, 282, 206, flip=True)
    paste_fighter("goldohrack", 148, 200, 213, flip=False)
    paste_fighter("darkmada", 120, 134, 214, flip=False)

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(158, H):
        alpha = int(((y - 158) / (H - 158)) * 175)
        od.line([(0, y), (W, y)], fill=(8, 10, 22, alpha))
    for _ in range(28):
        sx = rng.randint(10, W - 10)
        sy = rng.randint(52, H - 24)
        sc = rng.choice([(250, 204, 21, 220), (251, 146, 60, 220), (56, 189, 248, 200)])
        od.rectangle((sx, sy, sx + 2, sy + 2), fill=sc)

    composed = Image.alpha_composite(canvas, overlay).convert("RGB")
    quant = composed.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).convert("RGB")
    final_img = quant.resize((1280, 720), Image.Resampling.NEAREST)

    os.makedirs(UI_OUT_DIR, exist_ok=True)
    out_path = os.path.join(UI_OUT_DIR, "title_screen.png")
    final_img.save(out_path, "PNG")
    print(f"[OK] Title Screen -> {out_path}")


def build_france_map():
    """
    Génère une GRANDE carte de France UNIQUE (zéro pays voisin) style Néo-Arcade 16-bit,
    avec reliefs, fleuves, mer rétro et 6 décors pixel-art régionaux en rapport avec le jeu !
    """
    W, H = 384, 216
    CENTER_LON = 2.4
    CENTER_LAT = 46.6
    # Grand facteur d'échelle pour que l'Hexagone occupe généreusement tout le centre (y=18..180)
    PX_PER_LAT = 17.6
    PX_PER_LON = PX_PER_LAT * 0.72  # ~12.67 px/deg -> largeur Hexagone ~205px rétro (~683px canvas!)

    def geo(lon, lat):
        x = round(W * 0.495 + (lon - CENTER_LON) * PX_PER_LON)
        y = round(H * 0.465 - (lat - CENTER_LAT) * PX_PER_LAT)
        return (x, y)

    land_mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(land_mask)

    france = [
        geo(2.55, 51.08), geo(1.85, 50.95), geo(1.58, 50.72), geo(1.52, 50.22),
        geo(0.85, 49.92), geo(0.10, 49.48), geo(-1.15, 49.40), geo(-1.92, 49.72),
        geo(-1.60, 48.66), geo(-2.85, 48.82), geo(-4.78, 48.40), geo(-4.40, 47.76),
        geo(-3.00, 47.55), geo(-2.15, 47.20), geo(-1.90, 46.75), geo(-1.20, 46.15),
        geo(-1.15, 45.55), geo(-1.25, 44.65), geo(-1.78, 43.38), geo(-0.35, 42.80),
        geo(1.42, 42.55), geo(3.15, 42.44), geo(3.05, 43.10), geo(3.55, 43.32),
        geo(4.75, 43.35), geo(5.40, 43.24), geo(6.65, 43.25), geo(7.55, 43.78),
        geo(6.72, 44.92), geo(6.95, 45.85), geo(6.05, 46.22), geo(7.12, 47.46),
        geo(7.58, 47.62), geo(8.22, 48.96), geo(6.35, 49.48), geo(4.85, 50.14),
        geo(3.62, 50.36)
    ]
    corsica = [geo(9.35, 43.00), geo(8.62, 42.35), geo(8.85, 41.40), geo(9.45, 41.55), geo(9.55, 42.55)]
    md.polygon(france, fill=2)
    md.polygon(corsica, fill=2)

    # Distance à la terre pour obtenir de jolis halos marins côtiers façon SNES !
    px_mask = land_mask.load()
    img = Image.new("RGB", (W, H), (8, 22, 72))
    px = img.load()
    rng = random.Random(1993)

    mc_x, mc_y = geo(2.9, 45.2)
    alps_x, alps_y = geo(6.4, 45.0)
    pyr_x, pyr_y = geo(0.6, 42.8)
    vos_x, vos_y = geo(7.0, 48.2)
    par_x, par_y = geo(2.35, 48.86)

    def elev_noise(x, y):
        return (
            0.46 * math.sin(x * 0.13 + y * 0.08)
            + 0.30 * math.cos(x * 0.25 - y * 0.19)
            + 0.24 * math.sin(x * 0.48 + y * 0.41)
        )

    # Pré-calcule la proximité marine autour des côtes (halo 1..5 px)
    coast_dist = [[9] * W for _ in range(H)]
    q = deque()
    for y in range(H):
        for x in range(W):
            if px_mask[x, y] == 2:
                coast_dist[y][x] = 0
                q.append((x, y))
    while q:
        cx, cy = q.popleft()
        cd = coast_dist[cy][cx]
        if cd >= 6:
            continue
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < W and 0 <= ny < H and coast_dist[ny][nx] > cd + 1:
                coast_dist[ny][nx] = cd + 1
                q.append((nx, ny))

    for y in range(H):
        for x in range(W):
            m = px_mask[x, y]
            n = elev_noise(x, y)
            if m == 0:
                cd = coast_dist[y][x]
                is_grid = (x % 24 == 0) or (y % 24 == 0)
                if cd == 1:
                    px[x, y] = (14, 24, 58)  # contour extérieur sombre
                elif cd == 2:
                    px[x, y] = (56, 189, 248) if (x + y) % 2 == 0 else (30, 144, 224)  # écume néo-arcade
                elif cd <= 4:
                    px[x, y] = (20, 78, 178)
                elif is_grid:
                    px[x, y] = (22, 68, 148)
                else:
                    # Dégradé profond océan nocturne -> bleu nuit arcade
                    rad = math.hypot((x - W * 0.5) / 220, (y - H * 0.48) / 140)
                    deep = int(max(36, min(116, 108 - rad * 44 + n * 5)))
                    px[x, y] = (8, int(deep * 0.34), deep)
            else:
                is_edge = (
                    x <= 1 or y <= 1 or x >= W - 2 or y >= H - 2
                    or px_mask[x - 1, y] != 2 or px_mask[x + 1, y] != 2
                    or px_mask[x, y - 1] != 2 or px_mask[x, y + 1] != 2
                )
                if is_edge:
                    px[x, y] = (24, 38, 22)
                    continue

                d_mc = math.exp(-(((x - mc_x) ** 2) / 420 + ((y - mc_y) ** 2) / 260))
                d_alps = math.exp(-(((x - alps_x) ** 2) / 300 + ((y - alps_y) ** 2) / 480))
                d_pyr = math.exp(-(((x - pyr_x) ** 2) / 760 + ((y - pyr_y) ** 2) / 70))
                d_vos = math.exp(-(((x - vos_x) ** 2) / 160 + ((y - vos_y) ** 2) / 210))
                d_par = math.exp(-(((x - par_x) ** 2) / 220 + ((y - par_y) ** 2) / 180))
                alt = d_mc * 0.8 + d_alps * 1.15 + d_pyr * 1.05 + d_vos * 0.6 + n * 0.24 + rng.uniform(-0.07, 0.07)

                if alt > 0.88:
                    px[x, y] = (236, 244, 255)  # sommets enneigés Alpes/Pyrénées
                elif alt > 0.66:
                    px[x, y] = (196, 152, 82)   # hauts plateaux rocheux
                elif alt > 0.42:
                    px[x, y] = (162, 138, 62)   # collines ocres
                elif d_par > 0.55:
                    px[x, y] = (118, 168, 72)   # bassin parisien verdoyant
                elif alt > 0.14:
                    px[x, y] = (96, 154, 58)    # campagnes claires
                elif alt > -0.10:
                    px[x, y] = (68, 128, 50)    # plaines riches
                else:
                    px[x, y] = (50, 102, 42)    # forêts profondes

    draw = ImageDraw.Draw(img)

    # Grands fleuves stylisés en pixel-art (Seine/Marne par Paris & Château-Thierry, Loire, Garonne, Rhône)
    rivers = [
        [geo(0.10, 49.48), geo(1.1, 49.4), geo(2.35, 48.86), geo(3.40, 49.05), geo(4.03, 49.05)],
        [geo(-2.15, 47.20), geo(-0.5, 47.45), geo(1.4, 47.9), geo(2.9, 47.2), geo(4.1, 45.6)],
        [geo(-1.15, 45.55), geo(-0.4, 44.8), geo(1.44, 43.60), geo(1.1, 42.9)],
        [geo(4.75, 43.35), geo(4.8, 44.5), geo(4.85, 45.75), geo(5.9, 46.1)],
    ]
    for rv in rivers:
        draw.line(rv, fill=(44, 156, 232), width=2)

    # --- 6 DÉCORS RÉGIONAUX AUX VRAIES COORDONNÉES GPS SUR LA CARTE DE FRANCE ---
    # 1) PARIS (DarkMada & Sushi) : 48.8566° N, 2.3522° E -> Tour Eiffel à gauche du point
    pe_x, pe_y = geo(2.3522, 48.8566)
    draw.polygon([(pe_x - 6, pe_y - 16), (pe_x - 10, pe_y), (pe_x - 2, pe_y)], fill=(250, 204, 21), outline=(24, 24, 27))
    draw.line([(pe_x - 9, pe_y - 6), (pe_x - 3, pe_y - 6)], fill=(244, 63, 94), width=1)
    draw.rectangle((pe_x - 16, pe_y - 8, pe_x - 11, pe_y - 3), fill=(24, 24, 27), outline=(244, 63, 94))

    # 2) CHÂTEAU-THIERRY (GOLDOHRACK) : 49.0464° N, 3.4030° E -> Donjon + centrale décalés légèrement SE
    ct_x, ct_y = geo(3.4030, 49.0464)
    draw.polygon([(ct_x + 7, ct_y + 7), (ct_x + 9, ct_y - 2), (ct_x + 13, ct_y - 2), (ct_x + 15, ct_y + 7)], fill=(71, 85, 105), outline=(24, 24, 27))
    draw.rectangle((ct_x + 10, ct_y - 5, ct_x + 12, ct_y - 3), fill=(74, 222, 128))
    draw.rectangle((ct_x, ct_y + 2, ct_x + 5, ct_y + 8), fill=(220, 38, 38), outline=(250, 204, 21))

    # Petits bosquets forestiers (Landes & Vosges) pour enrichir le décor naturel
    for fx, fy in [(142, 134), (138, 144), (242, 74), (250, 82), (168, 92)]:
        draw.ellipse((fx - 4, fy - 4, fx + 4, fy + 4), fill=(34, 84, 34))
        draw.point((fx - 1, fy - 1), fill=(74, 154, 62))

    # 3) LAON (M3G4TRONCH3) : 49.5641° N, 3.6240° E -> Dôme radar Star Citizen cyan juste au-dessus
    ln_x, ln_y = geo(3.6240, 49.5641)
    draw.rectangle((ln_x - 3, ln_y - 9, ln_x + 3, ln_y - 3), fill=(100, 116, 139), outline=(15, 23, 42))
    draw.arc((ln_x - 4, ln_y - 13, ln_x + 4, ln_y - 5), 180, 360, fill=(56, 189, 248))
    draw.point((ln_x, ln_y - 13), fill=(224, 242, 254))

    # 4) REIMS (MADCHAT) : 49.2583° N, 4.0317° E -> Vignes de Champagne & épée de feu à l'est du point
    rm_x, rm_y = geo(4.0317, 49.2583)
    for vx in range(rm_x + 3, rm_x + 15, 4):
        draw.rectangle((vx, rm_y - 2, vx + 2, rm_y), fill=(163, 230, 53))
    draw.line([(rm_x + 8, rm_y - 13), (rm_x + 8, rm_y)], fill=(226, 232, 240), width=2)
    draw.line([(rm_x + 4, rm_y - 9), (rm_x + 12, rm_y - 9)], fill=(249, 115, 22), width=2)
    draw.point((rm_x + 8, rm_y - 14), fill=(253, 224, 71))

    # 5) CHARTRES (LURCK) : 48.4439° N, 1.4890° E -> Flèches gothiques & lune dorée à gauche du point
    ch_x, ch_y = geo(1.4890, 48.4439)
    draw.polygon([(ch_x - 9, ch_y + 2), (ch_x - 7, ch_y - 9), (ch_x - 5, ch_y + 2)], fill=(109, 40, 217), outline=(24, 24, 27))
    draw.polygon([(ch_x - 5, ch_y + 2), (ch_x - 3, ch_y - 11), (ch_x - 1, ch_y + 2)], fill=(126, 34, 206), outline=(24, 24, 27))
    draw.ellipse((ch_x - 14, ch_y - 12, ch_x - 9, ch_y - 7), fill=(250, 204, 21))

    # 6) TOULOUSE (KOLL) : 43.6047° N, 1.4442° E -> Capitole rose & bobine Tesla cyan
    tl_x, tl_y = geo(1.4442, 43.6047)
    draw.rectangle((tl_x - 6, tl_y - 8, tl_x + 6, tl_y), fill=(225, 29, 72), outline=(24, 24, 27))
    draw.polygon([(tl_x - 4, tl_y - 8), (tl_x, tl_y - 13), (tl_x + 4, tl_y - 8)], fill=(251, 146, 60))
    draw.line([(tl_x + 8, tl_y), (tl_x + 8, tl_y - 11)], fill=(56, 189, 248), width=1)
    draw.point((tl_x + 8, tl_y - 12), fill=(224, 242, 254))

    # Petits sommets stylisés sur les Alpes et Pyrénées + forêt de Landes/Bourgogne
    for px_s, py_s in [(248, 128), (258, 114), (254, 142)]:
        draw.polygon([(px_s - 6, py_s), (px_s, py_s - 8), (px_s + 6, py_s)], fill=(148, 163, 184), outline=(51, 65, 85))
        draw.polygon([(px_s - 2, py_s - 5), (px_s, py_s - 8), (px_s + 2, py_s - 5)], fill=(248, 250, 252))
    for px_s, py_s in [(152, 169), (168, 171), (184, 173)]:
        draw.polygon([(px_s - 6, py_s), (px_s, py_s - 7), (px_s + 6, py_s)], fill=(161, 98, 7), outline=(66, 32, 6))
        draw.polygon([(px_s - 2, py_s - 4), (px_s, py_s - 7), (px_s + 2, py_s - 4)], fill=(254, 249, 195))

    # Rose des vents rétro dans l'Atlantique bas-gauche & cadre boussole
    rcx, rcy = 52, 152
    draw.line([(rcx - 12, rcy), (rcx + 12, rcy)], fill=(56, 189, 248), width=1)
    draw.line([(rcx, rcy - 12), (rcx, rcy + 12)], fill=(56, 189, 248), width=1)
    draw.polygon([(rcx, rcy - 10), (rcx - 3, rcy), (rcx, rcy + 10), (rcx + 3, rcy)], fill=(250, 204, 21))
    draw.ellipse((rcx - 13, rcy - 13, rcx + 13, rcy + 13), outline=(147, 197, 253))

    # Nuages doux & navire/reflets pixel en mer
    for cx, cy in [(38, 44), (318, 52), (324, 156), (92, 118)]:
        draw.rectangle((cx, cy, cx + 22, cy + 3), fill=(186, 230, 253))
        draw.rectangle((cx + 5, cy - 2, cx + 17, cy), fill=(240, 249, 255))

    quant = img.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).convert("RGB")
    final_img = quant.resize((1280, 720), Image.Resampling.NEAREST)
    os.makedirs(UI_OUT_DIR, exist_ok=True)
    out_path = os.path.join(UI_OUT_DIR, "france_map.png")
    final_img.save(out_path, "PNG")
    print(f"[OK] France Map (Unique Large) -> {out_path}")

    # Coordonnées bien espacées sur la grande carte (en conservant la géographie relative)
    cities_retro = {
        "m3g4 (Laon)": (ln_x, ln_y),
        "goldohrack (Château-Thierry)": (ct_x, ct_y),
        "madchat (Reims)": (rm_x, rm_y),
        "darkmada (Paris)": (pe_x, pe_y),
        "lurck (Chartres)": (ch_x, ch_y),
        "koll (Toulouse)": (tl_x, tl_y),
    }
    for name, (rx, ry) in cities_retro.items():
        print(f"  City {name}: canvas=({round(rx * 1280 / W)}, {round(ry * 720 / H)})")


if __name__ == "__main__":
    print("=== Processing Arenas ===")
    for aid in ARENA_IDS:
        process_arena(aid)
    print("=== Processing Fighters (8 SF2 poses + Special sprites) ===")
    for fid in FIGHTER_IDS:
        process_fighter(fid)
    print("=== Building UI Artwork ===")
    build_title_screen()
    build_france_map()

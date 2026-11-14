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


def _sigmoid(val):
    return 0.5 * (1.0 + math.tanh(val))


def generate_deformed_pose(crop_img, pose, target_retro_h=110, scale_factor=3, fighter_id=""):
    """
    Génère les poses SF2 propres et lisibles sans aucune duplication de membre :
    - idle2, walk, crouch, jump, parry : déformation C-infini bijective
    - kick : inclinaison arrière du buste + rotation propre de la jambe avant (2 jambes exactes !)
    """
    bbox = crop_img.getbbox()
    if not bbox:
        return None
    trimmed = crop_img.crop(bbox).convert("RGBA")
    sw, sh = trimmed.size
    if sw <= 0 or sh <= 0:
        return None

    # Mode KICK : séparation propre jambe d'appui / jambe qui frappe -> zéro 3e jambe !
    if pose == "kick":
        rw0 = max(16, round(sw * (target_retro_h / sh)))
        rgb_s = trimmed.convert("RGB").resize((rw0, target_retro_h), Image.Resampling.BILINEAR)
        alp_s = trimmed.split()[3].resize((rw0, target_retro_h), Image.Resampling.NEAREST)
        base = rgb_s.convert("RGBA")
        base.putalpha(alp_s)
        bpx = base.load()
        for yy in range(target_retro_h):
            for xx in range(rw0):
                if bpx[xx, yy][3] < 128:
                    bpx[xx, yy] = (0, 0, 0, 0)
                else:
                    bpx[xx, yy] = (bpx[xx, yy][0], bpx[xx, yy][1], bpx[xx, yy][2], 255)

        # Pour Madchat (épée) / Lurck (aile), restreint strictement la zone jambe avant aux jambes
        hip_x = int(rw0 * (0.48 if fighter_id != "madchat" else 0.40))
        hip_y = int(target_retro_h * 0.56)
        max_leg_x = int(rw0 * (0.68 if fighter_id in ("madchat", "lurck") else 0.96))

        body = base.copy()
        leg = Image.new("RGBA", (rw0, target_retro_h), (0, 0, 0, 0))
        body_px = body.load()
        leg_px = leg.load()

        for yy in range(hip_y + 2, target_retro_h):
            # Pente douce pour séparer la jambe avant sans couper la jambe d'appui arrière
            split_col = int(hip_x + (yy - hip_y) * 0.08)
            for xx in range(split_col, max_leg_x):
                c = body_px[xx, yy]
                if c[3] > 0:
                    # Ignore pixels dorés du chien si jamais présents
                    if fighter_id == "darkmada" and c[0] > 125 and c[0] - c[2] > 32:
                        continue
                    leg_px[xx, yy] = c
                    body_px[xx, yy] = (0, 0, 0, 0)

        # Incline le corps en arrière (-14 deg) et fait pivoter la jambe avant (+66 deg) vers l'avant !
        cw = rw0 + 96
        ch = target_retro_h + 44
        ox, oy = 42, 26
        pivot = (ox + hip_x, oy + hip_y)

        body_pad = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        body_pad.paste(body, (ox, oy), body)
        body_rot = body_pad.rotate(-14, resample=Image.Resampling.BICUBIC, center=pivot)

        leg_pad = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        leg_pad.paste(leg, (ox, oy), leg)
        # Remonte la jambe avant horizontalement/en coup de pied haut
        leg_rot = leg_pad.rotate(66, resample=Image.Resampling.BICUBIC, center=pivot)

        # Légère translation du pied vers l'avant (+5px) pour bien allonger l'extension
        leg_shift = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        leg_shift.paste(leg_rot, (5, -4), leg_rot)

        combined = Image.alpha_composite(body_rot, leg_shift)
        # Ajoute une petite traînée d'impact blanche/dorée au bout du pied
        cdraw = ImageDraw.Draw(combined)
        lb = leg_shift.getbbox()
        if lb:
            fx = lb[2] - 2
            fy = (lb[1] + lb[3]) // 2
            cdraw.arc((fx - 14, fy - 12, fx + 6, fy + 10), -70, 55, fill=(254, 240, 138, 220), width=2)

        cb = combined.getbbox()
        if not cb:
            return None
        return quantize_and_upscale(combined.crop(cb), scale_factor=scale_factor)

    base_rw = max(16, round(sw * (target_retro_h / sh)))
    pad_x = int(base_rw * 0.36)
    pad_top = int(target_retro_h * 0.12)
    pad_bot = int(target_retro_h * 0.08)

    if pose == "crouch":
        out_rh = round(target_retro_h * 0.70) + pad_top
    elif pose == "jump":
        out_rh = round(target_retro_h * 0.85) + pad_top
    else:
        out_rh = target_retro_h + pad_top + pad_bot
    out_rw = base_rw + pad_x * 2

    src_px = trimmed.load()
    dst = Image.new("RGBA", (out_rw, out_rh), (0, 0, 0, 0))
    dpx = dst.load()

    def sample_src(u, v):
        if u < 0.0 or u >= 1.0 or v < 0.0 or v >= 1.0:
            return (0, 0, 0, 0)
        fx = u * (sw - 1)
        fy = v * (sh - 1)
        x0 = int(fx)
        y0 = int(fy)
        x1 = min(sw - 1, x0 + 1)
        y1 = min(sh - 1, y0 + 1)
        tx = fx - x0
        ty = fy - y0

        c00 = src_px[x0, y0]
        c10 = src_px[x1, y0]
        c01 = src_px[x0, y1]
        c11 = src_px[x1, y1]

        a0 = c00[3] * (1 - tx) + c10[3] * tx
        a1 = c01[3] * (1 - tx) + c11[3] * tx
        a = a0 * (1 - ty) + a1 * ty
        if a < 110:
            return (0, 0, 0, 0)

        res = [0, 0, 0, 255]
        w_sum = 0.0
        for cx, cy, w in ((x0, y0, (1 - tx) * (1 - ty)), (x1, y0, tx * (1 - ty)), (x0, y1, (1 - tx) * ty), (x1, y1, tx * ty)):
            p = src_px[cx, cy]
            if p[3] > 20:
                res[0] += p[0] * w
                res[1] += p[1] * w
                res[2] += p[2] * w
                w_sum += w
        if w_sum <= 1e-5:
            return (0, 0, 0, 0)
        return (int(res[0] / w_sum), int(res[1] / w_sum), int(res[2] / w_sum), 255)

    y_base = out_rh - (2 if pose in ("crouch", "jump") else pad_bot)
    char_h = round(target_retro_h * (0.70 if pose == "crouch" else 0.85 if pose == "jump" else 1.0))

    for py in range(out_rh):
        v_dst = 1.0 - (y_base - py) / float(char_h)
        for px in range(out_rw):
            u_dst = (px - pad_x) / float(base_rw)

            u_src, v_src = u_dst, v_dst

            if pose == "idle2":
                breath = math.sin(max(0.0, min(1.0, v_dst)) * math.pi)
                v_src = v_dst - 0.032 * breath
                u_src = 0.50 + (u_dst - 0.50) / (1.0 + 0.045 * breath)

            elif pose == "walk":
                lean = 0.055 * (1.0 - max(0.0, min(1.0, v_dst)))
                leg_mask = _sigmoid((v_dst - 0.52) / 0.08)
                stride = 0.095 * math.tanh((u_dst - 0.48) / 0.16)
                u_src = u_dst - lean - leg_mask * stride
                v_src = v_dst + 0.025 * leg_mask * abs(u_dst - 0.48)

            elif pose == "crouch":
                if v_dst < 0.0 or v_dst > 1.04:
                    continue
                if v_dst < 0.45:
                    v_src = (v_dst / 0.45) * 0.36
                else:
                    v_src = 0.36 + ((v_dst - 0.45) / 0.55) * 0.64
                knee_bulge = math.exp(-((v_dst - 0.58) ** 2) / 0.06)
                u_src = 0.48 + (u_dst - 0.48) / (1.0 + 0.14 * knee_bulge) - 0.04 * (1.0 - v_dst)

            elif pose == "jump":
                if v_dst < 0.0 or v_dst > 1.04:
                    continue
                tuck = _sigmoid((v_dst - 0.54) / 0.10)
                v_src = v_dst * 0.90 + tuck * 0.14
                u_src = u_dst + 0.075 * (1.0 - v_dst)

            elif pose == "parry":
                # Posture défensive ferme, léger recul vers l'arrière
                lean_back = 0.065 * (1.0 - max(0.0, min(1.0, v_dst)))
                bracing = math.exp(-((v_dst - 0.60) ** 2) / 0.08)
                u_src = 0.48 + (u_dst - 0.48) / (1.0 + 0.10 * bracing) + lean_back
                v_src = v_dst * 0.96

            col = sample_src(u_src, v_src)
            if col[3] > 0:
                dpx[px, py] = col

    bbox2 = dst.getbbox()
    if not bbox2:
        return None
    cropped = dst.crop(bbox2)
    out = quantize_and_upscale(cropped, scale_factor=scale_factor)

    # Sur la pose PARRY : ajoute un bouclier/reflet défensif pixel-art sur le bras avant
    if pose == "parry" and out is not None:
        ow, oh = out.size
        opx = out.load()
        gx = int(ow * 0.72) // 3 * 3
        for gy in range(int(oh * 0.16) // 3 * 3, int(oh * 0.44) // 3 * 3, 3):
            add_block(opx, ow, oh, gx - 3, gy, (14, 165, 233, 255))
            add_block(opx, ow, oh, gx, gy, (224, 242, 254, 255))
            add_block(opx, ow, oh, gx + 3, gy, (56, 189, 248, 255))
    return out


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
    return dm_clean, sushi_solo


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

    # Poses continues SF2 générées depuis la source HD sans aucun déchirement
    pose_sprites = {
        "idle": idle_sprite,
        "idle2": generate_deformed_pose(left_crop, "idle2", fighter_id=fighter_id) or idle_sprite,
        "walk": generate_deformed_pose(left_crop, "walk", fighter_id=fighter_id) or idle_sprite,
        "crouch": generate_deformed_pose(left_crop, "crouch", fighter_id=fighter_id) or idle_sprite,
        "jump": generate_deformed_pose(left_crop, "jump", fighter_id=fighter_id) or idle_sprite,
        "kick": generate_deformed_pose(left_crop, "kick", fighter_id=fighter_id) or attack_sprite,
        "parry": generate_deformed_pose(left_crop, "parry", fighter_id=fighter_id) or idle_sprite,
        "attack": attack_sprite,
    }

    if fighter_id == "goldohrack":
        attached_atk, gold_special, gold_fist = build_goldohrack_rocket_pack(attack_sprite)
        pose_sprites["attack"] = attached_atk
        pose_sprites["special"] = gold_special
        gold_fist.save(os.path.join(FIGHTER_OUT_DIR, "goldohrack_fist.png"), "PNG")
    elif fighter_id == "koll":
        pose_sprites["special"] = build_koll_bunny_special(idle_sprite)
    elif fighter_id == "darkmada":
        dark_special, sushi_solo = build_sushi_and_darkmada_special(idle_sprite, attack_sprite)
        pose_sprites["special"] = dark_special
        # Utilise DarkMada seul (sans Sushi collé aux chevilles) pour saut et coup de pied propres
        pose_sprites["jump"] = generate_deformed_pose(dark_special, "jump", fighter_id=fighter_id) or pose_sprites["jump"]
        pose_sprites["kick"] = generate_deformed_pose(dark_special, "kick", fighter_id=fighter_id) or pose_sprites["kick"]
        sushi_solo.save(os.path.join(FIGHTER_OUT_DIR, "sushi_solo.png"), "PNG")

    for suffix, sp in pose_sprites.items():
        sp.save(os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_{suffix}.png"), "PNG")

    make_portrait(idle_sprite).save(os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_portrait.png"), "PNG")
    print(f"[OK] Fighter {fighter_id} -> {len(pose_sprites)} poses ({idle_sprite.size})")
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

    # Grands fleuves stylisés en pixel-art (Seine, Loire, Garonne, Rhône)
    rivers = [
        [geo(0.10, 49.48), geo(1.1, 49.4), geo(2.35, 48.86), geo(3.4, 48.4), geo(4.2, 47.9)],
        [geo(-2.15, 47.20), geo(-0.5, 47.45), geo(1.4, 47.9), geo(2.9, 47.2), geo(4.1, 45.6)],
        [geo(-1.15, 45.55), geo(-0.4, 44.8), geo(1.44, 43.60), geo(1.1, 42.9)],
        [geo(4.75, 43.35), geo(4.8, 44.5), geo(4.85, 45.75), geo(5.9, 46.1)],
    ]
    for rv in rivers:
        draw.line(rv, fill=(44, 156, 232), width=2)

    # --- 6 DÉCORS RÉGIONAUX EN RAPPORT AVEC LE JEU (sur la carte de France) ---
    # 1) PARIS (DarkMada & Sushi) : Petite Tour Eiffel + Arche Néon Route 66 + Niche dorée
    pe_x, pe_y = 180, 62  # près de Paris élargi
    draw.polygon([(pe_x, pe_y - 16), (pe_x - 5, pe_y), (pe_x + 5, pe_y)], fill=(250, 204, 21), outline=(24, 24, 27))
    draw.line([(pe_x - 3, pe_y - 6), (pe_x + 3, pe_y - 6)], fill=(244, 63, 94), width=1)
    # Symbole route 66 à gauche de la Tour Eiffel
    draw.rectangle((pe_x - 14, pe_y - 8, pe_x - 7, pe_y - 2), fill=(24, 24, 27), outline=(244, 63, 94))
    draw.point((pe_x - 11, pe_y - 5), fill=(250, 204, 21))

    # 2) CHÂTEAU-THIERRY (GOLDOHRACK) : Château fort + Tours nucléaires vertes bien détachées
    ct_x, ct_y = 207, 73
    draw.polygon([(ct_x + 7, ct_y), (ct_x + 9, ct_y - 11), (ct_x + 14, ct_y - 11), (ct_x + 16, ct_y)], fill=(71, 85, 105), outline=(24, 24, 27))
    draw.rectangle((ct_x + 10, ct_y - 15, ct_x + 13, ct_y - 12), fill=(74, 222, 128))  # panache vert nucléaire
    draw.rectangle((ct_x - 3, ct_y - 8, ct_x + 4, ct_y), fill=(220, 38, 38), outline=(250, 204, 21))  # donjon rouge Goldohrack

    # Petits bosquets forestiers (Landes & Vosges) pour enrichir le décor naturel
    for fx, fy in [(142, 134), (138, 144), (242, 74), (250, 82), (168, 92)]:
        draw.ellipse((fx - 4, fy - 4, fx + 4, fy + 4), fill=(34, 84, 34))
        draw.point((fx - 1, fy - 1), fill=(74, 154, 62))

    # 3) LAON (M3G4TRONCH3) : Dôme radar Star Citizen cyan sur sa butte
    ln_x, ln_y = 212, 46
    draw.rectangle((ln_x - 4, ln_y - 9, ln_x + 4, ln_y), fill=(100, 116, 139), outline=(15, 23, 42))
    draw.arc((ln_x - 5, ln_y - 14, ln_x + 5, ln_y - 4), 180, 360, fill=(56, 189, 248))
    draw.point((ln_x, ln_y - 14), fill=(224, 242, 254))

    # 4) REIMS (MADCHAT) : Épée de feu géante plantée dans les vignes de Champagne
    rm_x, rm_y = 236, 61
    for vx in range(rm_x - 8, rm_x + 8, 4):
        draw.rectangle((vx, rm_y - 2, vx + 2, rm_y), fill=(163, 230, 53))
    draw.line([(rm_x, rm_y - 14), (rm_x, rm_y)], fill=(226, 232, 240), width=2)
    draw.line([(rm_x - 4, rm_y - 10), (rm_x + 4, rm_y - 10)], fill=(249, 115, 22), width=2)
    draw.point((rm_x, rm_y - 15), fill=(253, 224, 71))

    # 5) CHARTRES (LURCK) : Flèches gothiques & lune dorée du hibou
    ch_x, ch_y = 148, 76
    draw.polygon([(ch_x - 3, ch_y), (ch_x - 1, ch_y - 12), (ch_x + 1, ch_y)], fill=(109, 40, 217), outline=(24, 24, 27))
    draw.polygon([(ch_x + 2, ch_y), (ch_x + 4, ch_y - 14), (ch_x + 6, ch_y)], fill=(126, 34, 206), outline=(24, 24, 27))
    draw.ellipse((ch_x - 9, ch_y - 15, ch_x - 3, ch_y - 9), fill=(250, 204, 21))

    # 6) TOULOUSE (KOLL) : Capitole rose & bobine Tesla cyan/lapin
    tl_x, tl_y = 176, 152
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

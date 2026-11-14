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

    quant_rgb = rgb_small.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    small_rgba = quant_rgb.convert("RGBA")
    small_rgba.putalpha(alpha_small)

    spx = small_rgba.load()
    for y in range(retro_h):
        for x in range(retro_w):
            r, g, b, a = spx[x, y]
            if a < 128:
                spx[x, y] = (0, 0, 0, 0)
            else:
                spx[x, y] = (r, g, b, 255)

    out_w = retro_w * scale_factor
    out_h = retro_h * scale_factor
    return small_rgba.resize((out_w, out_h), Image.Resampling.NEAREST)


def soften_golden_dog(attack_sprite):
    """Adoucit la gueule du Golden Retriever sur le sprite d'attaque (remplace les crocs par une joyeuse langue rose)."""
    img = attack_sprite.copy().convert("RGBA")
    px = img.load()
    w, h = img.size

    # Remplace les petits pixels blancs de crocs dans la zone gueule du chien par rose joyeux / doré doux
    for y in range(int(h * 0.58), int(h * 0.72)):
        for x in range(int(w * 0.84), w):
            r, g, b, a = px[x, y]
            if a > 0 and r > 195 and g > 195 and b > 180:
                px[x, y] = (244, 114, 160, 255)

    # Ajoute une petite langue rose joyeuse en blocs pixel 3x3 sous le museau
    tongue_blocks = [
        (303, 210, (236, 72, 153, 255)),
        (306, 210, (249, 168, 212, 255)),
        (303, 213, (236, 72, 153, 255)),
        (306, 213, (244, 114, 182, 255)),
        (303, 216, (219, 39, 119, 255)),
    ]
    for bx, by, col in tongue_blocks:
        for dy in range(3):
            for dx in range(3):
                if 0 <= bx + dx < w and 0 <= by + dy < h:
                    px[bx + dx, by + dy] = col
    return img


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
    idle_path = os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_idle.png")
    atk_path = os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_attack.png")
    port_path = os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_portrait.png")

    idle_sprite.save(idle_path, "PNG")
    attack_sprite.save(atk_path, "PNG")
    make_portrait(idle_sprite).save(port_path, "PNG")

    print(f"[OK] Fighter {fighter_id} -> {idle_sprite.size}, {attack_sprite.size}")
    return True


def build_title_screen():
    """Compose un écran de démarrage 16-bit style Sue Fighter II avec nos 6 personnages."""
    W, H = 384, 216
    sky = Image.new("RGB", (W, H), (18, 12, 42))
    draw = ImageDraw.Draw(sky)

    # Ciel crépusculaire 16-bit en bandes de couleurs chaudes -> violet nocturne
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

    # Grand soleil couchant pixelisé derrière le héros central
    cx, cy = 192, 118
    for rad, col in [(62, (251, 146, 60)), (48, (250, 204, 21)), (34, (254, 240, 138))]:
        draw.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), fill=col)

    # Nuages horizontaux pixel-art
    rng = random.Random(42)
    for i in range(18):
        cl_x = rng.randint(-20, W - 40)
        cl_y = rng.randint(14, 112)
        cl_w = rng.randint(36, 92)
        cl_col = (249, 115, 22) if cl_y > 68 else (124, 58, 137)
        draw.rectangle((cl_x, cl_y, cl_x + cl_w, cl_y + 4), fill=cl_col)
        draw.rectangle((cl_x + 8, cl_y - 3, cl_x + cl_w - 10, cl_y), fill=cl_col)

    # Silhouettes des arènes en arrière-plan (tours de refroidissement, Tour Eiffel, buildings, fjord)
    sil_col = (34, 22, 54)
    # Gauche : tours nucléaires post-apo
    draw.polygon([(20, 170), (28, 108), (52, 108), (60, 170)], fill=sil_col)
    draw.polygon([(64, 170), (70, 116), (90, 116), (96, 170)], fill=sil_col)
    # Gauche-centre : Tour Eiffel stylisée
    draw.polygon([(126, 170), (138, 98), (144, 72), (146, 98), (158, 170)], fill=sil_col)
    # Droite-centre : Gratte-ciels cyber / hangars
    for bx, bw, bh in [(225, 20, 62), (250, 16, 80), (272, 24, 54), (305, 18, 72), (332, 28, 48)]:
        draw.rectangle((bx, 170 - bh, bx + bw, 170), fill=sil_col)
    # Horizon sombre
    draw.rectangle((0, 166, W, H), fill=(18, 14, 30))

    canvas = sky.convert("RGBA")

    def paste_fighter(fid, target_h, center_x, bottom_y, flip=False, use_attack=False):
        suffix = "attack" if use_attack else "idle"
        p = os.path.join(FIGHTER_OUT_DIR, f"{fid}_{suffix}.png")
        if not os.path.exists(p):
            return
        sp = Image.open(p).convert("RGBA")
        if flip:
            sp = sp.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        sw, sh = sp.size
        nw = max(1, round(sw * (target_h / sh)))
        rs = sp.resize((nw, target_h), Image.Resampling.NEAREST)
        canvas.paste(rs, (center_x - nw // 2, bottom_y - target_h), rs)

    # Plan arrière gauche & droite (M3G4TRONCH3 & LURCK)
    paste_fighter("m3g4", 108, 42, 198, flip=False)
    paste_fighter("lurck", 112, 336, 198, flip=True)
    # Plan intermédiaire (MADCHAT & KOLL)
    paste_fighter("madchat", 116, 92, 206, flip=False)
    paste_fighter("koll", 116, 282, 206, flip=True)
    # Héros central dominant : GOLDOHRACK !
    paste_fighter("goldohrack", 148, 200, 213, flip=False)
    # Premier plan gauche : DarkMada & Golden Retriever gentil bien visible
    paste_fighter("darkmada", 120, 134, 214, flip=False)

    # Bandeau dégradé sombre en bas pour que "APPUIE SUR START" ressorte nettement
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(158, H):
        alpha = int(((y - 158) / (H - 158)) * 175)
        od.line([(0, y), (W, y)], fill=(8, 10, 22, alpha))
    # Étincelles & billets/braises façon arcade
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
    """Génère une carte de France 16-bit organique style Street Fighter II World Map (384x216 -> 1280x720)."""
    W, H = 384, 216
    # Projection réaliste centrée sur la France métropolitaine (46.6°N, 2.3°E) avec correction cos(lat)
    CENTER_LON = 2.4
    CENTER_LAT = 46.7
    PX_PER_LAT = 15.6
    PX_PER_LON = PX_PER_LAT * math.cos(math.radians(CENTER_LAT))  # ~10.7 px/deg

    def geo(lon, lat):
        x = round(W * 0.50 + (lon - CENTER_LON) * PX_PER_LON)
        y = round(H * 0.48 - (lat - CENTER_LAT) * PX_PER_LAT)
        return (x, y)

    # Masques vectoriels de base
    land_mask = Image.new("L", (W, H), 0)  # 0=Mer, 1=Voisins, 2=France/Corse
    md = ImageDraw.Draw(land_mask)

    # Pays voisins (prolongés proprement jusqu'aux bords de l'écran sans croisement)
    uk = [
        geo(-5.4, 50.05), geo(-3.6, 50.35), geo(-2.2, 50.62), geo(-0.8, 50.80),
        geo(1.38, 51.12), geo(1.42, 51.45), geo(1.75, 52.45), geo(0.35, 52.95),
        geo(-0.1, 53.6), geo(-1.1, 54.6), (-10, 0), (0, 0)
    ]
    ireland = [
        geo(-10.2, 51.45), geo(-8.5, 51.65), geo(-6.1, 52.15), geo(-6.0, 53.8),
        geo(-6.3, 55.2), (-20, 0), (-20, 90)
    ]
    spain_portugal = [
        geo(-9.5, 38.0), geo(-9.3, 41.2), geo(-9.1, 42.9), geo(-7.5, 43.6),
        geo(-5.2, 43.55), geo(-3.3, 43.42), geo(-1.80, 43.38), geo(-0.35, 42.80),
        geo(1.42, 42.55), geo(3.15, 42.44), geo(3.35, 41.8), geo(1.9, 41.15),
        geo(0.8, 40.3), geo(0.2, 38.5), (210, 216), (0, 216)
    ]
    neighbors_east = [
        geo(3.3, 51.35), geo(4.3, 51.95), geo(4.8, 53.0), geo(6.2, 53.6), (384, 0), (384, 216),
        geo(14.5, 40.2), geo(12.2, 41.9), geo(10.5, 43.2), geo(9.5, 44.35), geo(8.2, 44.15),
        geo(7.55, 43.78), geo(6.72, 44.92), geo(6.95, 45.85), geo(6.05, 46.22), geo(7.12, 47.46),
        geo(7.58, 47.62), geo(8.22, 48.96), geo(6.35, 49.48), geo(4.85, 50.14), geo(3.62, 50.36),
        geo(2.55, 51.08)
    ]
    for poly in (uk, ireland, spain_portugal, neighbors_east):
        md.polygon(poly, fill=1)

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

    # Relief synthétique multi-octaves + massifs montagneux pour un rendu pixel-art 16-bit riche
    px_mask = land_mask.load()
    img = Image.new("RGB", (W, H), (10, 44, 136))
    px = img.load()
    rng = random.Random(1992)

    # Centres de massifs (x, y, rayon, altitude)
    mc_x, mc_y = geo(2.9, 45.2)
    alps_x, alps_y = geo(6.4, 45.0)
    pyr_x, pyr_y = geo(0.8, 42.8)
    vos_x, vos_y = geo(7.0, 48.1)

    def elev_noise(x, y):
        return (
            0.48 * math.sin(x * 0.14 + y * 0.09)
            + 0.30 * math.cos(x * 0.27 - y * 0.21)
            + 0.22 * math.sin(x * 0.51 + y * 0.43)
        )

    for y in range(H):
        for x in range(W):
            m = px_mask[x, y]
            # Côtes déchiquetées légèrement avec bruit
            n = elev_noise(x, y)
            if m == 0:
                # Océan bleu arcade avec quadrillage rétro 18px et léger gradient
                is_grid = (x % 18 == 0) or (y % 18 == 0)
                if (x >= 2 and px_mask[x - 2, y] == 2) or (y >= 2 and px_mask[x, y - 2] == 2):
                    px[x, y] = (8, 22, 68)  # ombre côtière
                elif is_grid:
                    px[x, y] = (24, 76, 174)
                else:
                    blue = int(112 + 34 * math.sin((y / H) * math.pi) + n * 6)
                    px[x, y] = (10, 42, max(90, min(168, blue)))
            elif m == 1:
                # Pays voisins (ocre/olive sobre avec grain rétro)
                jit = rng.choice([-6, 0, 6])
                base = int(n * 14 + jit)
                px[x, y] = (
                    max(40, min(200, 128 + base)),
                    max(40, min(200, 120 + base)),
                    max(24, min(120, 68 + base // 2)),
                )
            else:
                # Frontière / côte sombre nette
                is_edge = (
                    x <= 1 or y <= 1 or x >= W - 2 or y >= H - 2
                    or px_mask[x - 1, y] != 2 or px_mask[x + 1, y] != 2
                    or px_mask[x, y - 1] != 2 or px_mask[x, y + 1] != 2
                )
                if is_edge:
                    px[x, y] = (36, 52, 22)
                    continue

                # Calcul de l'altitude (plaines vertes -> collines -> massifs ocre/dorés)
                d_mc = math.exp(-(((x - mc_x) ** 2) / 360 + ((y - mc_y) ** 2) / 220))
                d_alps = math.exp(-(((x - alps_x) ** 2) / 260 + ((y - alps_y) ** 2) / 420))
                d_pyr = math.exp(-(((x - pyr_x) ** 2) / 680 + ((y - pyr_y) ** 2) / 60))
                d_vos = math.exp(-(((x - vos_x) ** 2) / 140 + ((y - vos_y) ** 2) / 180))
                alt = d_mc * 0.75 + d_alps * 1.05 + d_pyr * 0.95 + d_vos * 0.55 + n * 0.25 + rng.uniform(-0.08, 0.08)

                if alt > 0.68:
                    px[x, y] = (206, 166, 92)  # hauts reliefs dorés
                elif alt > 0.42:
                    px[x, y] = (168, 148, 70)  # plateaux ocre
                elif alt > 0.14:
                    px[x, y] = (122, 160, 64)  # collines vert clair
                elif alt > -0.10:
                    px[x, y] = (92, 142, 56)   # plaines vertes
                else:
                    px[x, y] = (74, 122, 48)   # vallées

    draw = ImageDraw.Draw(img)
    # Petits nuages pixel-art sur l'Atlantique et la Méditerranée
    for cx, cy in [(26, 62), (48, 134), (82, 92), (318, 162), (222, 186)]:
        draw.rectangle((cx, cy, cx + 22, cy + 3), fill=(190, 222, 255))
        draw.rectangle((cx + 5, cy - 2, cx + 17, cy), fill=(226, 244, 255))

    quant = img.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).convert("RGB")
    final_img = quant.resize((1280, 720), Image.Resampling.NEAREST)
    os.makedirs(UI_OUT_DIR, exist_ok=True)
    out_path = os.path.join(UI_OUT_DIR, "france_map.png")
    final_img.save(out_path, "PNG")
    print(f"[OK] France Map -> {out_path}")

    cities = {
        "m3g4 (Laon)": (3.62, 49.56),
        "goldohrack (Château-Thierry)": (3.40, 49.04),
        "madchat (Reims)": (4.03, 49.26),
        "darkmada (Paris)": (2.35, 48.86),
        "lurck (Chartres)": (1.49, 48.44),
        "koll (Toulouse)": (1.44, 43.60),
    }
    for name, (lon, lat) in cities.items():
        gx, gy = geo(lon, lat)
        print(f"  City {name}: canvas=({round(gx * 1280 / W)}, {round(gy * 720 / H)})")


if __name__ == "__main__":
    print("=== Processing Arenas ===")
    for aid in ARENA_IDS:
        process_arena(aid)
    print("=== Processing Fighters ===")
    for fid in FIGHTER_IDS:
        process_fighter(fid)
    print("=== Building UI Artwork ===")
    build_title_screen()
    build_france_map()

import os
from collections import deque
from PIL import Image, ImageEnhance

BASE_DIR = "/Users/brunoperrin/Antigravity/jeux"
RAW_DIR = os.path.join(BASE_DIR, "raw_assets")
ARENA_OUT_DIR = os.path.join(BASE_DIR, "assets", "arenas")
FIGHTER_OUT_DIR = os.path.join(BASE_DIR, "assets", "fighters")

ARENA_IDS = ["biker", "cod", "starcitizen", "techno", "viking"]
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
    # Boost léger du contraste et des couleurs néo-arcade
    img = ImageEnhance.Contrast(img).enhance(1.12)
    img = ImageEnhance.Color(img).enhance(1.15)

    # Pixelisation 16-bit authentique (grille 384x216, 64 couleurs avec dithering léger)
    small = img.resize((384, 216), Image.Resampling.BILINEAR)
    quant = small.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    pixel_rgb = quant.convert("RGB")

    # Upscale EXACT en pixels carrés 1280x720
    final_img = pixel_rgb.resize((1280, 720), Image.Resampling.NEAREST)
    os.makedirs(ARENA_OUT_DIR, exist_ok=True)
    out_path = os.path.join(ARENA_OUT_DIR, f"{arena_id}.png")
    final_img.save(out_path, "PNG")
    print(f"[OK] Arena {arena_id} -> {out_path}")
    return True


def is_bg_pixel(r, g, b, bg_samples):
    # Magenta chromatique fort
    if r > g + 42 and b > g + 42 and r > 115 and b > 115:
        return True
    # Proximité avec les coins détectés
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

    # Supprime aussi les poches fermées de magenta pur entre les jambes/bras
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and r > g + 58 and b > g + 58 and r > 140 and b > 140:
                px[x, y] = (0, 0, 0, 0)

    # Nettoyage des franges rosées sur 2 passes autour des pixels transparents
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

    # Trouve la plus large bande quasiment vide au centre
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

    # Fallback: colonne de densité minimale au centre
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

    # Réduction douce pour RGB, NEAREST pour alpha net
    rgb_small = trimmed.convert("RGB").resize((retro_w, retro_h), Image.Resampling.BILINEAR)
    alpha_small = trimmed.split()[3].resize((retro_w, retro_h), Image.Resampling.NEAREST)

    # Quantification 48 couleurs 16-bit propre (sans dithering sur les sprites)
    quant_rgb = rgb_small.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    small_rgba = quant_rgb.convert("RGBA")
    small_rgba.putalpha(alpha_small)

    # Seuillage alpha net 1-bit pour zéro bavure
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

    os.makedirs(FIGHTER_OUT_DIR, exist_ok=True)
    idle_path = os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_idle.png")
    atk_path = os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_attack.png")
    port_path = os.path.join(FIGHTER_OUT_DIR, f"{fighter_id}_portrait.png")

    idle_sprite.save(idle_path, "PNG")
    attack_sprite.save(atk_path, "PNG")
    make_portrait(idle_sprite).save(port_path, "PNG")

    print(f"[OK] Fighter {fighter_id} -> {idle_sprite.size}, {attack_sprite.size}")
    return True


if __name__ == "__main__":
    print("=== Processing Arenas ===")
    for aid in ARENA_IDS:
        process_arena(aid)
    print("=== Processing Fighters ===")
    for fid in FIGHTER_IDS:
        process_fighter(fid)

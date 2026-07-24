#!/usr/bin/env python3
"""
Generate original, on-brand cover images for Jeff's blog.
Outputs JPGs to assets/img/ with consistent color palette and aspect ratios.
"""
import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(ROOT, 'assets', 'img')
os.makedirs(OUT_DIR, exist_ok=True)

# Site palette
BLUE = (91, 124, 153)        # #5B7C99
BLUE_LIGHT = (143, 163, 184) # #8FA3B8
BLUE_DARK = (61, 90, 115)    # #3D5A73
AMBER = (201, 166, 107)      # #C9A66B
AMBER_LIGHT = (232, 218, 192)
BG_LIGHT = (232, 238, 244)   # #E8EEF4
WHITE = (255, 255, 255)


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def linear_gradient(size, c1, c2, direction='vertical'):
    """Return a gradient image."""
    w, h = size
    base = Image.new('RGB', size, c1)
    draw = ImageDraw.Draw(base)
    if direction == 'vertical':
        for y in range(h):
            ratio = y / (h - 1) if h > 1 else 0
            r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
            g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
            b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
            draw.line([(0, y), (w, y)], fill=(r, g, b))
    else:
        for x in range(w):
            ratio = x / (w - 1) if w > 1 else 0
            r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
            g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
            b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
            draw.line([(x, 0), (x, h)], fill=(r, g, b))
    return base


def add_soft_noise(img, intensity=8):
    """Add subtle grain for texture."""
    w, h = img.size
    noise = Image.effect_noise((w // 4, h // 4), intensity).convert('RGB').resize((w, h), Image.Resampling.BILINEAR)
    return Image.blend(img, noise, 0.04)


def save(img, name, quality=90):
    path = os.path.join(OUT_DIR, name)
    img.save(path, 'JPEG', quality=quality, optimize=True)
    print(f'Saved {path} ({img.size[0]}x{img.size[1]})')


# ---------------------------------------------------------------------------
# 1. Avatar
# ---------------------------------------------------------------------------
def draw_avatar():
    size = (800, 800)
    img = linear_gradient(size, (210, 220, 230), (232, 238, 244), 'vertical')
    draw = ImageDraw.Draw(img)

    # Circular backdrop with subtle gradient
    cx, cy = size[0] // 2, size[1] // 2
    radius = 280
    for r in range(radius, 0, -1):
        ratio = r / radius
        c = tuple(int(BLUE[i] * (0.35 + 0.25 * ratio)) for i in range(3))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)

    # Shoulders silhouette
    draw.ellipse([cx - 180, cy + 60, cx + 180, cy + 340], fill=(250, 252, 255))

    # Head silhouette
    draw.ellipse([cx - 90, cy - 130, cx + 90, cy + 50], fill=(250, 252, 255))

    # J monogram
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 180)
    except Exception:
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 180)
        except Exception:
            font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), "J", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2 - 20), "J", font=font, fill=WHITE)

    img = add_soft_noise(img)
    save(img, 'avatar.jpg')


# ---------------------------------------------------------------------------
# 2. Zendesk cover
# ---------------------------------------------------------------------------
def draw_zendesk():
    size = (1600, 900)
    img = linear_gradient(size, (240, 244, 248), (225, 232, 240), 'vertical')
    draw = ImageDraw.Draw(img)

    # Abstract ticket cards
    random.seed(42)
    for i in range(8):
        x = random.randint(120, 1300)
        y = random.randint(120, 650)
        w, h = random.randint(160, 280), random.randint(90, 150)
        color = (*BLUE_LIGHT, 35) if i % 2 == 0 else (*BLUE, 25)
        draw.rounded_rectangle([x, y, x + w, y + h], radius=16, fill=(color[0], color[1], color[2]))
        # lines inside ticket
        draw.rounded_rectangle([x + 20, y + 30, x + w - 20, y + 46], radius=4, fill=(255, 255, 255, 180))
        draw.rounded_rectangle([x + 20, y + 58, x + w - 60, y + 72], radius=4, fill=(255, 255, 255, 120))

    # Flow lines / connections
    pts = [(200, 750), (500, 500), (800, 680), (1100, 420), (1400, 600)]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=BLUE_LIGHT, width=3)
        r = 8
        draw.ellipse([pts[i][0]-r, pts[i][1]-r, pts[i][0]+r, pts[i][1]+r], fill=BLUE)
    draw.ellipse([pts[-1][0]-r, pts[-1][1]-r, pts[-1][0]+r, pts[-1][1]+r], fill=BLUE)

    img = add_soft_noise(img)
    save(img, 'zendesk.jpg')


# ---------------------------------------------------------------------------
# 3. Amazon Connect cover
# ---------------------------------------------------------------------------
def draw_amazon_connect():
    size = (1600, 900)
    img = linear_gradient(size, (235, 241, 247), (218, 228, 238), 'vertical')
    draw = ImageDraw.Draw(img)

    # Cloud shape
    cx, cy = size[0] // 2, size[1] // 2 - 40
    for r in range(220, 0, -4):
        alpha = 0.15 + 0.25 * (r / 220)
        c = tuple(int(WHITE[i] * (1 - alpha) + BLUE[i] * alpha) for i in range(3))
        draw.ellipse([cx - r - 80, cy - r//2, cx + r + 80, cy + r//2], fill=c)

    # Network nodes
    random.seed(7)
    nodes = [(random.randint(150, 1450), random.randint(150, 750)) for _ in range(12)]
    for a, b in zip(nodes, nodes[1:]):
        draw.line([a, b], fill=(*BLUE_LIGHT, 80), width=2)
    for x, y in nodes:
        r = 6
        draw.ellipse([x-r, y-r, x+r, y+r], fill=BLUE)

    # Voice waveforms
    y_base = 720
    for x in range(150, 1450, 6):
        amp = 18 * math.sin((x - 150) / 60) + 8 * math.sin((x - 150) / 20)
        draw.line([(x, y_base - amp), (x, y_base + amp)], fill=AMBER, width=2)

    img = add_soft_noise(img)
    save(img, 'amazon-connect.jpg')


# ---------------------------------------------------------------------------
# 4. Musings cover
# ---------------------------------------------------------------------------
def draw_musings():
    size = (1600, 900)
    # Warm sunrise gradient
    img = linear_gradient(size, (250, 244, 235), (232, 218, 196), 'vertical')
    draw = ImageDraw.Draw(img)

    # Horizon line
    draw.rectangle([0, 560, size[0], size[1]], fill=(245, 238, 228))

    # Sun
    cx, cy = 1100, 360
    for r in range(120, 0, -3):
        ratio = r / 120
        c = tuple(int(AMBER_LIGHT[i] * (1 - ratio) + AMBER[i] * ratio) for i in range(3))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)

    # Flowing ink line
    points = []
    for x in range(100, 1500, 8):
        y = 620 + 60 * math.sin(x / 180) + 25 * math.sin(x / 60)
        points.append((x, int(y)))
    for i in range(len(points) - 1):
        width = 2 + int(3 * (1 - i / len(points)))
        draw.line([points[i], points[i+1]], fill=BLUE_DARK, width=width)

    img = add_soft_noise(img)
    save(img, 'musings.jpg')


# ---------------------------------------------------------------------------
# 5. Engineering / data pipeline cover
# ---------------------------------------------------------------------------
def draw_engineering():
    size = (1600, 900)
    img = linear_gradient(size, (238, 242, 246), (222, 230, 238), 'vertical')
    draw = ImageDraw.Draw(img)

    # Pipeline layers
    layers = [
        (220, 280, BLUE_LIGHT),
        (420, 480, BLUE),
        (620, 680, BLUE_DARK),
    ]
    for y1, y2, color in layers:
        draw.rounded_rectangle([200, y1, 1400, y2], radius=24, fill=(*color, 40))
        # Arrow inside
        mid_y = (y1 + y2) // 2
        draw.polygon([(1100, mid_y-14), (1130, mid_y), (1100, mid_y+14)], fill=color)
        draw.line([(320, mid_y), (1115, mid_y)], fill=color, width=4)

    # Connecting vertical lines
    draw.line([(500, 280), (500, 420)], fill=BLUE_LIGHT, width=3)
    draw.line([(900, 480), (900, 620)], fill=BLUE, width=3)

    # Data dots
    for x in range(260, 1340, 80):
        draw.ellipse([x - 4, 730 - 4, x + 4, 730 + 4], fill=AMBER)

    # Grid hint
    for x in range(0, size[0], 80):
        draw.line([(x, 0), (x, size[1])], fill=(*BLUE, 8), width=1)
    for y in range(0, size[1], 80):
        draw.line([(0, y), (size[0], y)], fill=(*BLUE, 8), width=1)

    img = add_soft_noise(img)
    save(img, 'engineering.jpg')


if __name__ == '__main__':
    draw_avatar()
    draw_zendesk()
    draw_amazon_connect()
    draw_musings()
    draw_engineering()
    print('Done.')

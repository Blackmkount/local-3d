#!/usr/bin/env python3
"""Tira de la brújula del recorrido (hud_brujula.png): 360° en 2880 px, rayas cada 5° y rótulos cada 15°."""
from PIL import Image, ImageDraw, ImageFont
PX = 8; W, H = 360 * PX, 96
c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
f = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Medium.otf', 26)
fb = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 30)
nombres = {0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO'}
for g in range(0, 360, 5):
    x = g * PX
    if g % 15 == 0:
        alto = 30 if g % 90 == 0 else 22
        for xx in (x, x + W):
            d.rectangle([xx - 1, 4, xx + 1, 4 + alto], fill=(255, 255, 255, 235))
        t = nombres.get(g, str(g)); fo = fb if g in nombres else f
        bw = d.textlength(t, font=fo)
        for xx in (x, x + W, x - W):
            d.text((xx - bw / 2, 44), t, font=fo, fill=(255, 255, 255, 255 if g in nombres else 200))
    else:
        for xx in (x, x + W):
            d.rectangle([xx, 8, xx + 1, 18], fill=(255, 255, 255, 140))
c.save('hud_brujula.png')

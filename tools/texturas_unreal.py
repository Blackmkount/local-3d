#!/usr/bin/env python3
"""
Texturas de alta resolución para la Galería en Unreal (propias, sin licencias de terceros).

Todas son repetibles sin costura (ruido periódico por FFT) y salen en tres mapas:
  <nombre>_C.png   color (sRGB)
  <nombre>_N.png   normal en espacio tangente, convención DirectX (la de Unreal)
  <nombre>_R.png   rugosidad (lineal)
Uso:  python3 tools/texturas_unreal.py [carpeta] [--n 2048] [--solo roble_piso,laca]
El tamaño real de cada textura (en cm) va en TAM y lo usa el material de Unreal para la proyección.
"""
import argparse, json, os
import numpy as np
from PIL import Image

TAM = {                      # cm que cubre una repetición
    "roble_piso": 200.0,     # 10 tablas de 20 cm de ancho
    "roble_enchape": 100.0,
    "pintura": 100.0,
    "laca": 60.0,
    "concreto": 120.0,
    "metal_cepillado": 40.0,
    "pintura_negra": 30.0,
    "porcelanato": 240.0,    # 4 × 4 baldosas de 60 cm
    "tela": 20.0,
    "melamina": 60.0,
}


# ---------------------------------------------------------------- ruido periódico
def campo(n, rng, beta=2.0, kmin=1.0, kmax=None, ax=1.0, ay=1.0):
    """Ruido fractal periódico n×n: espectro 1/k^beta entre kmin y kmax (ciclos por repetición).
    ay > 1 hace que el ruido cambie despacio en vertical (vetas largas verticales); ax > 1, en horizontal."""
    f = np.fft.fftfreq(n) * n
    kx, ky = np.meshgrid(f, f)
    k = np.sqrt((kx * ax) ** 2 + (ky * ay) ** 2)
    filtro = np.where(k > 0, 1.0 / np.maximum(k, 1e-6) ** (beta / 2.0), 0.0)
    filtro[k < kmin] = 0.0
    if kmax:
        filtro *= np.exp(-(k / kmax) ** 4)
    w = np.fft.fft2(rng.standard_normal((n, n)))
    c = np.real(np.fft.ifft2(w * filtro))
    c -= c.mean()
    return c / (c.std() + 1e-9)


def suave(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def normal_de(h, fuerza):
    """Altura (en px) → normal DirectX en 0..255."""
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    nx, ny_dx, nz = -dx * fuerza, -dy * fuerza, np.ones_like(h)
    # convención DirectX: verde positivo hacia abajo en la imagen → G = -dh/dfila con signo invertido respecto a OpenGL
    l = np.sqrt(nx ** 2 + ny_dx ** 2 + nz ** 2)
    n = np.stack([nx / l, ny_dx / l, nz / l], -1)
    return np.clip((n * 0.5 + 0.5) * 255 + 0.5, 0, 255).astype(np.uint8)


def srgb(lin):
    lin = np.clip(lin, 0, 1)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)


def lin_de(rgb255):
    c = np.array(rgb255, float) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def guardar(carpeta, nombre, color_lin, normal, rug):
    Image.fromarray(np.clip(srgb(color_lin) * 255 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(carpeta, nombre + "_C.png"), optimize=True)
    Image.fromarray(normal).save(os.path.join(carpeta, nombre + "_N.png"), optimize=True)
    Image.fromarray(np.clip(rug * 255 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(carpeta, nombre + "_R.png"), optimize=True)


# ---------------------------------------------------------------- madera
def tabla(alto, ancho, rng, g, base, anillos_cm, px_mm, catedral, ond=1.0):
    """Una tabla (o una hoja de enchape) de roble cortado en plano: anillos con arcos «de catedral».
    alto = largo en px (a lo largo de la veta), ancho en px. g = campos globales (periódicos) para el ruido."""
    v = np.arange(alto)[:, None].astype(float)
    u = np.arange(ancho)[None, :].astype(float)
    paso = anillos_cm * 10 * px_mm                      # px entre anillos
    u0 = rng.uniform(-0.3, 1.3) * ancho                 # centro del tronco (fuera de la tabla = veta recta)
    hh = rng.uniform(0.2, 1.5) * ancho
    B = rng.integers(2, 7) if catedral else rng.integers(0, 2)   # anillos que «suben» a lo largo de la tabla (entero: repetible)
    du, dv = rng.integers(0, g["n"]), rng.integers(0, g["n"])
    fil = (np.arange(alto)[:, None] + dv) % g["n"]
    col_ = (np.arange(ancho)[None, :] + du) % g["n"]
    w1, w2, ma, po, st = (g[k][fil, col_] for k in ("onda", "onda2", "mancha", "poros", "raya"))
    r = np.sqrt((u - u0) ** 2 + hh ** 2) / paso + B * v / alto + (w1 * 1.6 + w2 * 0.35) * ond
    p = r - np.floor(r)
    tardio = suave(p, 0.55, 0.88) * (1 - suave(p, 0.93, 1.0))            # madera de verano: banda oscura
    temprano = suave(p, 0.0, 0.05) * (1 - suave(p, 0.08, 0.22))           # inicio del anillo: poros grandes
    banda = 0.5 + 0.5 * np.sin(2 * np.pi * r / rng.uniform(5, 9))          # vetas anchas de color
    poro = np.clip(suave(po, 1.0, 2.4) * (0.25 + 1.2 * temprano), 0, 1)
    k = (1 - 0.26 * tardio) * (1 - 0.10 * banda) * (1 - 0.32 * poro) * (1 + 0.05 * ma) * (1 - 0.07 * suave(st, 0.8, 2.0))
    tono = 1 + rng.normal(0, 0.10)
    c = base * tono * np.array([1 + rng.normal(0, 0.03), 1.0, 1 - rng.normal(0, 0.03)])
    color = c[None, None, :] * k[..., None]
    alt = -0.5 * tardio - 0.9 * poro
    rug = 0.0 + 0.05 * ma + 0.14 * poro + 0.05 * tardio
    return color, alt, rug


def campos_madera(n, rng):
    return {"n": n,
            "onda": campo(n, rng, beta=3.6, kmin=1, kmax=12, ax=1.0, ay=3.0),
            "onda2": campo(n, rng, beta=2.6, kmin=3, kmax=80, ax=1.0, ay=5.0),
            "mancha": campo(n, rng, beta=3.0, kmin=1, kmax=16, ay=2.0),
            "poros": campo(n, rng, beta=0.4, kmin=n / 10, kmax=n / 1.6, ax=1.0, ay=7.0),
            "raya": campo(n, rng, beta=2.0, kmin=2, kmax=n / 6, ax=1.0, ay=25.0)}


def madera(n, rng, base, tablas, largo_min, largo_max, anillos_cm, px_mm, rug0, junta_visible=True, catedral=0.6, ond=1.0):
    from scipy.ndimage import gaussian_filter
    g = campos_madera(n, rng)
    base = lin_de(base)
    col = np.zeros((n, n, 3)); alt = np.zeros((n, n)); rug = np.zeros((n, n)); junta = np.zeros((n, n))
    bordes = [int(round(i * n / tablas)) for i in range(tablas + 1)]
    for t in range(tablas):
        x0, x1 = bordes[t], bordes[t + 1]
        if largo_min <= 0:
            cortes = [rng.uniform(0, n)]
        else:
            v0, total, cortes = rng.uniform(0, n), 0.0, []
            while True:
                l = rng.uniform(largo_min, largo_max) * n
                cortes.append(v0 + total)
                total += l
                if n - total < largo_min * n:
                    break
        lim = cortes + [cortes[0] + n]
        for a, b in zip(lim, lim[1:]):
            filas = np.arange(int(round(a)), int(round(b))) % n
            c, h, r = tabla(len(filas), x1 - x0, rng, g, base, anillos_cm, px_mm, rng.random() < catedral, ond)
            col[filas, x0:x1] = c; alt[filas, x0:x1] = h; rug[filas, x0:x1] = r
            if largo_min > 0:
                fa = int(round(a)) % n
                junta[fa, x0:x1] = 1
        junta[:, x0 % n] = 1
    rug += rug0
    if junta_visible:
        jj = gaussian_filter(junta, 1.1, mode="wrap"); jj /= jj.max()
        alt -= jj * 2.5
        col *= (1 - 0.40 * jj)[..., None]
        rug += 0.2 * jj
    else:
        jj = gaussian_filter(junta, 0.7, mode="wrap"); jj /= jj.max()
        col *= (1 - 0.06 * jj)[..., None]
    alt = gaussian_filter(alt, 0.6, mode="wrap")
    return col, normal_de(alt, 1.6), np.clip(rug, 0.05, 1)


# ---------------------------------------------------------------- superficies
def pintura(n, rng):
    from scipy.ndimage import gaussian_filter
    rodillo = campo(n, rng, beta=1.2, kmin=n / 40, kmax=n / 3)            # piel de naranja del rodillo (~1-3 mm)
    grande = campo(n, rng, beta=3.0, kmin=1, kmax=8)
    h = gaussian_filter(rodillo, 0.8, mode="wrap") * 0.5
    col = np.ones((n, n, 3)) * (1 + 0.012 * grande[..., None])
    rug = 0.88 + 0.03 * rodillo + 0.02 * grande
    return col, normal_de(h, 0.6), np.clip(rug, 0, 1)


def laca(n, rng):
    piel = campo(n, rng, beta=2.2, kmin=n / 60, kmax=n / 8)
    grande = campo(n, rng, beta=3.0, kmin=1, kmax=6)
    col = np.ones((n, n, 3)) * (1 + 0.006 * grande[..., None])
    rug = 0.30 + 0.025 * grande + 0.015 * piel
    return col, normal_de(piel * 0.6, 0.35), np.clip(rug, 0, 1)


def melamina(n, rng):
    fino = campo(n, rng, beta=0.8, kmin=n / 30, kmax=n / 2)
    grande = campo(n, rng, beta=3.0, kmin=1, kmax=6)
    col = np.ones((n, n, 3)) * (1 + 0.008 * grande[..., None])
    rug = 0.55 + 0.04 * fino + 0.03 * grande
    return col, normal_de(fino * 0.3, 0.5), np.clip(rug, 0, 1)


def concreto(n, rng):
    from scipy.ndimage import gaussian_filter
    g = campo(n, rng, beta=2.8, kmin=1, kmax=n / 4)
    m = campo(n, rng, beta=1.6, kmin=n / 64, kmax=n / 3)
    poros = suave(campo(n, rng, beta=0.3, kmin=n / 30, kmax=n / 2.5), 2.2, 3.0)
    base = lin_de((150, 148, 143))
    k = (1 + 0.10 * g + 0.04 * m) * (1 - 0.5 * poros)
    col = base[None, None, :] * k[..., None]
    h = gaussian_filter(m, 1.0, mode="wrap") * 0.4 - poros * 1.2
    rug = 0.78 + 0.06 * g + 0.15 * poros
    return col, normal_de(h, 1.0), np.clip(rug, 0, 1)


def metal_cepillado(n, rng):
    rayas = campo(n, rng, beta=1.0, kmin=4, kmax=n / 1.5, ax=40.0, ay=1.0)   # rayas a lo largo de las filas
    grande = campo(n, rng, beta=3.0, kmin=1, kmax=6)
    col = np.ones((n, n, 3)) * (1 + 0.03 * rayas[..., None] + 0.02 * grande[..., None])
    rug = 0.28 + 0.06 * rayas + 0.03 * grande
    return col, normal_de(rayas * 0.25, 0.6), np.clip(rug, 0, 1)


def pintura_negra(n, rng):
    piel = campo(n, rng, beta=1.4, kmin=n / 40, kmax=n / 3)
    grande = campo(n, rng, beta=3.0, kmin=1, kmax=6)
    col = np.ones((n, n, 3)) * (1 + 0.02 * grande[..., None])
    rug = 0.52 + 0.05 * piel + 0.03 * grande
    return col, normal_de(piel * 0.5, 0.5), np.clip(rug, 0, 1)


def porcelanato(n, rng):
    from scipy.ndimage import gaussian_filter
    filas = 4
    lado = n / filas
    col = np.zeros((n, n, 3)); h = np.zeros((n, n)); rug = np.zeros((n, n))
    vetas = campo(n, rng, beta=2.4, kmin=2, kmax=60)
    vetas = np.exp(-(np.abs(vetas) / 0.08) ** 2) * suave(campo(n, rng, beta=3, kmin=1, kmax=6), -0.3, 1.0)
    nube = campo(n, rng, beta=3.0, kmin=1, kmax=20)
    base = lin_de((214, 211, 205))
    yy, xx = np.mgrid[0:n, 0:n]
    junta = np.zeros((n, n))
    for i in range(filas + 1):
        e = int(round(i * lado)) % n
        for d in range(-2, 3):
            junta[(e + d) % n, :] = 1; junta[:, (e + d) % n] = 1
    tono = np.zeros((n, n))
    for i in range(filas):
        for j in range(filas):
            tono[int(i * lado):int((i + 1) * lado), int(j * lado):int((j + 1) * lado)] = rng.normal(0, 0.02)
    from scipy.ndimage import gaussian_filter as _g
    vetas = _g(vetas, 3.0, mode="wrap")
    k = (1 + tono + 0.03 * nube) * (1 - 0.05 * vetas)
    col = base[None, None, :] * k[..., None]
    jj = gaussian_filter(junta, 1.0, mode="wrap")
    col = col * (1 - 0.35 * jj)[..., None] + lin_de((150, 148, 142))[None, None, :] * (0.35 * jj)[..., None]
    h = -jj * 2.0 + nube * 0.02
    rug = 0.14 + 0.03 * nube + 0.5 * jj
    return col, normal_de(h, 1.0), np.clip(rug, 0, 1)


def tela(n, rng):
    hilos = 64   # hilos por repetición en cada sentido
    yy, xx = np.mgrid[0:n, 0:n] / n
    u = np.sin(2 * np.pi * xx * hilos); v = np.sin(2 * np.pi * yy * hilos)
    cruce = np.sign(np.sin(np.pi * xx * hilos) * np.sin(np.pi * yy * hilos))
    h = np.where(cruce > 0, np.abs(u), np.abs(v)) * 0.8
    pelo = campo(n, rng, beta=0.5, kmin=n / 20, kmax=n / 2)
    h += pelo * 0.15
    col = np.ones((n, n, 3)) * (0.85 + 0.15 * h[..., None] / h.max())
    rug = 0.9 + 0.05 * pelo
    return col, normal_de(h, 1.2), np.clip(rug, 0, 1)


def generar(nombre, n, rng):
    px_mm = n / (TAM[nombre] * 10.0)
    if nombre == "roble_piso":
        return madera(n, rng, (178, 154, 124), 10, 0.40, 0.95, 0.55, px_mm, 0.36)
    if nombre == "roble_enchape":
        return madera(n, rng, (188, 158, 118), 6, 0, 0, 0.35, px_mm, 0.50, junta_visible=False, catedral=0.5, ond=0.45)
    return {"pintura": pintura, "laca": laca, "concreto": concreto, "metal_cepillado": metal_cepillado,
            "pintura_negra": pintura_negra, "porcelanato": porcelanato, "tela": tela, "melamina": melamina}[nombre](n, rng)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("carpeta", nargs="?", default="unreal/texturas")
    ap.add_argument("--n", type=int, default=2048)
    ap.add_argument("--solo", default="")
    a = ap.parse_args()
    os.makedirs(a.carpeta, exist_ok=True)
    nombres = [x for x in TAM if not a.solo or x in a.solo.split(",")]
    for i, nom in enumerate(nombres):
        rng = np.random.default_rng(1000 + list(TAM).index(nom))
        c, nn, r = generar(nom, a.n, rng)
        guardar(a.carpeta, nom, c, nn, r)
        print(nom, "listo")
    json.dump({k: TAM[k] for k in TAM}, open(os.path.join(a.carpeta, "tamanos.json"), "w"), indent=1)

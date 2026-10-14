#!/usr/bin/env python3
"""Empaqueta el sitio en un solo archivo HTML (CSS y JS propios en línea).

Uso:  npm run build:single            (o python3 tools/build-artifact.py [salida.html])

El sitio normal (index.html + css/ + js/ + vendor/) se publica tal cual en GitHub Pages.
Este archivo único sirve para compartir la página como un solo documento:
no lleva <html>, <head> ni <body>, porque el visor que lo aloja los añade.

- Las hojas de estilo propias (<link rel="stylesheet" href="css/…">) entran en línea, en el
  mismo orden de index.html y sin el ?v= de versión.
- Los <script src="…"></script> propios entran en línea, también en orden (con o sin otros
  atributos en la etiqueta).
- three.js no se copia: el archivo copiado en vendor/three-<versión>.min.js se cambia por su
  dirección en jsDelivr, que es la misma versión.
- La letra Inter llega de Google Fonts: dentro del archivo único las rutas relativas a
  assets/fonts/ no existen, así que esas reglas @font-face se quitan.
"""
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist" / "local-impresion-3d.html"
html = (root / "index.html").read_text(encoding="utf-8")

FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">'
CDN_THREE = "https://cdn.jsdelivr.net/npm/three@{}/build/three.min.js"

title = re.search(r"<title>.*?</title>", html, re.S).group(0)
head = re.search(r"<head>(.*)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
fonts = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', html)
fonts = fonts.group(0) if fonts else FONTS


def local(url):
    return not re.match(r"^(https?:)?//|^data:", url)


def read(url):
    return (root / url.split("?")[0].split("#")[0]).read_text(encoding="utf-8")   # sin el ?v= de versión


# hojas de estilo propias, en orden; sin las @font-face que apuntan a archivos del sitio
css = []
for tag in re.finditer(r"<link\b[^>]*>", head):
    t = tag.group(0)
    if not re.search(r'\brel="stylesheet"', t):
        continue
    href = re.search(r'\bhref="([^"]+)"', t).group(1)
    if not local(href):
        continue
    code = read(href)
    code = re.sub(r"@font-face\s*\{[^}]*url\((?!['\"]?(?:https?:|data:))[^}]*\}\s*", "", code)
    assert "</style" not in code, href
    css.append("/* " + href.split("?")[0] + " */\n" + code)


def inline(match):
    src = match.group(1)
    v = re.match(r"^vendor/three-(\d+\.\d+\.\d+)\.min\.js", src)
    if v:
        return '<script src="' + CDN_THREE.format(v.group(1)) + '"></script>'
    if not local(src):
        return match.group(0)
    code = read(src)
    assert "</script" not in code, src
    return "<script>\n" + code + "\n</script>"


body = re.sub(r'<script\b[^>]*?\bsrc="([^"]+)"[^>]*>\s*</script>', inline, body)

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(title + "\n" + fonts + "\n<style>\n" + "\n".join(css) + "</style>\n" + body.strip() + "\n", encoding="utf-8")
print(out, round(out.stat().st_size / 1024), "KB")

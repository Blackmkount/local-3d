#!/usr/bin/env python3
"""Empaqueta el sitio en un solo archivo HTML (CSS y JS propios en línea).

Uso:  python3 tools/build-artifact.py [salida.html]

El sitio normal (index.html + css/ + js/) se publica tal cual en GitHub Pages.
Este archivo único sirve para compartir la página como un solo documento:
no lleva <html>, <head> ni <body>, porque el visor que lo aloja los añade.
"""
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist" / "local-impresion-3d.html"
html = (root / "index.html").read_text(encoding="utf-8")

title = re.search(r"<title>.*?</title>", html, re.S).group(0)
fonts = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', html).group(0)
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
css = (root / "css" / "styles.css").read_text(encoding="utf-8")


def inline(match):
    src = match.group(1)
    if src.startswith("http"):
        return match.group(0)
    code = (root / src.split("?")[0]).read_text(encoding="utf-8")   # sin el ?v= de versión
    assert "</script" not in code, src
    return "<script>\n" + code + "\n</script>"


body = re.sub(r'<script src="([^"]+)"></script>', inline, body)

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(title + "\n" + fonts + "\n<style>\n" + css + "</style>\n" + body.strip() + "\n", encoding="utf-8")
print(out, round(out.stat().st_size / 1024), "KB")

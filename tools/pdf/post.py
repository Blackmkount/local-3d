#!/usr/bin/env python3
"""Pospruceso de los PDF de la entrega (lo llama build.js).

  post.py dests  contenido.pdf                 → JSON {ids: {id: página}, sizes: [[w, h], …]}  (páginas desde 1)
  post.py merge  contenido.pdf capa.pdf salida.pdf meta.json
      meta.json: {title, author, subject, outline: [[título, página, nivel], …]}
      superpone la capa (cabeceras y pies, una página por página) y añade marcadores y metadatos
"""
import json
import os
import shutil
import subprocess
import sys

from pypdf import PdfReader, PdfWriter


def dests(path):
    r = PdfReader(path)
    idx = {id(p.indirect_reference): i for i, p in enumerate(r.pages)}
    byref = {}
    for i, p in enumerate(r.pages):
        byref[p.indirect_reference.idnum] = i
    ids = {}
    for name, d in r.named_destinations.items():
        pg = d.get('/Page')
        try:
            n = byref.get(pg.idnum)
        except AttributeError:
            n = None
        if n is None:
            try:
                n = r.get_destination_page_number(d)
            except Exception:
                n = None
        if n is not None:
            ids[name.lstrip('/')] = n + 1
    sizes = [[float(p.mediabox.width) * 25.4 / 72, float(p.mediabox.height) * 25.4 / 72] for p in r.pages]
    print(json.dumps({'ids': ids, 'sizes': sizes}))


def merge(content, overlay, out, metapath):
    meta = json.load(open(metapath))
    r = PdfReader(content)
    o = PdfReader(overlay)
    w = PdfWriter()
    for i, p in enumerate(r.pages):
        if i < len(o.pages):
            p.merge_page(o.pages[i])
        w.add_page(p)
    # los enlaces internos (índice) se conservan al copiar las páginas; los destinos con nombre se vuelven a registrar
    try:
        for name, d in r.named_destinations.items():
            n = r.get_destination_page_number(d)
            if n is not None:
                w.add_named_destination(name.lstrip('/'), n)
    except Exception:
        pass
    parents = {}
    for title, page, level in meta.get('outline', []):
        parent = parents.get(level - 1) if level > 0 else None
        try:
            it = w.add_outline_item(title, page - 1, parent=parent)
            parents[level] = it
        except Exception:
            pass
    w.add_metadata({'/Title': meta.get('title', ''), '/Author': meta.get('author', ''), '/Subject': meta.get('subject', ''), '/Creator': 'BlackForge 3D · visor del proyecto (three.js) + Chromium', '/Producer': 'pypdf'})
    w.page_mode = '/UseOutlines'
    tmp = out + '.raw.pdf'
    with open(tmp, 'wb') as f:
        w.write(f)
    # pypdf deja los flujos sin comprimir: qpdf los vuelve a comprimir (pesa la tercera parte)
    if shutil.which('qpdf'):
        subprocess.run(['qpdf', '--object-streams=generate', '--recompress-flate', '--compression-level=9', tmp, out], check=True)
        os.remove(tmp)
    else:
        os.replace(tmp, out)
    print(json.dumps({'pages': len(w.pages)}))


if __name__ == '__main__':
    if sys.argv[1] == 'dests':
        dests(sys.argv[2])
    elif sys.argv[1] == 'merge':
        merge(*sys.argv[2:6])

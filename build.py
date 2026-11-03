#!/usr/bin/env python3
"""Assemble the site from src/.
   index.html    the full page for Vercel (doctype, head, body)
   artifact.html the same page without the outer skeleton, for the claude.ai preview
   Torn-paper edges are generated once here and inlined into the CSS."""
import pathlib, random, urllib.parse
root = pathlib.Path(__file__).resolve().parent
src = root / 'src'

def tear(seed, w=1440, h=44):
    rnd = random.Random(seed); x = 0; pts = []
    while x < w:
        big = rnd.random() < .12
        y = rnd.uniform(4, 16) if big else rnd.uniform(14, 30)
        pts.append((round(x, 1), round(y, 1)))
        x += rnd.uniform(6, 26) if not big else rnd.uniform(18, 40)
    pts.append((w, rnd.uniform(14, 28)))
    d = 'M0 ' + str(pts[0][1]) + ' ' + ' '.join(f'L{a} {b}' for a, b in pts) + f' L{w} {h} L0 {h} Z'
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' preserveAspectRatio='none'><path d='{d}'/></svg>"
    return 'url("data:image/svg+xml,' + urllib.parse.quote(svg, safe=":/='() ") + '")'

head = (src / 'head.html').read_text()
head = head.replace('__TEAR_A__', tear(11)).replace('__TEAR_B__', tear(29))
body = (src / 'body.html').read_text()
body = body.replace('<!--CUPJS-->', '<script>\n' + (src / 'cup.js').read_text() + '\n</script>')

(root / 'index.html').write_text(
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + head + '</head>\n<body>\n' + body + '</body>\n</html>\n')
(root / 'artifact.html').write_text(head + body)
print('built', len(head + body), 'bytes')

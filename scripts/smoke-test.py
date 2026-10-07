#!/usr/bin/env python3
"""Smoke test of a built site folder (default: _site). Usage: python scripts/smoke-test.py [site-dir]"""
import pathlib
import re
import sys

site = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
errors = []


def fail(msg):
    errors.append(msg)
    print("ERROR:", msg)


for rel in ("index.html", "sitemap.xml", "robots.txt", "404.html"):
    if not (site / rel).is_file():
        fail(f"missing {rel}")

for slug in ("idlings", "catbox", "forestfellers"):
    for rel in (f"{slug}/index.html", f"{slug}/privacy/index.html"):
        page = site / rel
        if not page.is_file():
            fail(f"missing standalone page {rel}")
        elif re.search(r"petshark\.ca|<link[^>]+stylesheet|<script", page.read_text(errors="replace"), re.I):
            fail(f"{rel} links to the site or loads a stylesheet or script")

for page in list(site.glob("*.html")) + list(site.glob("projects/**/*.html")) + [site / "sitemap.xml"]:
    if page.is_file() and re.search(r"\{\{|\{%", page.read_text(errors="replace")):
        fail(f"unresolved Liquid in {page.relative_to(site)}")

print(f"{len(errors)} error(s)")
sys.exit(1 if errors else 0)

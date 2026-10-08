#!/usr/bin/env python3
"""Checks this repo against the rules in AGENTS.md. Run it before every commit:

    python scripts/check-site.py [--base REF]

With --base REF (used on pull requests, e.g. --base origin/main), files that are not in REF count as new
for the size and file-type rules, even when committed.

Standard library only. Exit code 0 = no errors (warnings are advice), 1 = errors.
It cannot build the site; it checks the things a build would not catch.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors, warnings = [], []
BASE = sys.argv[sys.argv.index("--base") + 1] if "--base" in sys.argv else None


def err(path, msg):
    errors.append(f"ERROR  {path}: {msg}")


def warn(path, msg):
    warnings.append(f"warn   {path}: {msg}")


# ---- minimal front matter reader --------------------------------------------------------------
# Supports what AGENTS.md allows: `key: value`, `key: [a, b]`, and one level of nested keys.
# No PyYAML on purpose, so the check runs anywhere Python does.

def scalar(v):
    v = v.strip()
    if v[:1] in ("\"", "'"):  # quoted: the value ends at the closing quote; anything after is a comment
        end = v.find(v[0], 1)
        if end != -1:
            return v[1:end]
    else:
        v = re.sub(r"\s+#.*$", "", v)  # trailing YAML comment
    if v.startswith("[") and v.endswith("]"):
        inner = v[1:-1].strip()
        return [scalar(x) for x in inner.split(",")] if inner else []
    if v.lower() in ("true", "false"):
        return v.lower() == "true"
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    return v


def read_flat_map(path):
    """_data files that are a flat `key: Label` map."""
    out = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.lstrip().startswith("#") and ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip()
    return out


def front_matter(path):
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    if not text.startswith("---\n"):
        return None, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return None, text
    data, parent = {}, None
    for n, line in enumerate(text[4:end].split("\n"), start=2):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^(\s*)([A-Za-z_][\w-]*):\s*(.*)$", line)
        if not m:
            err(path.relative_to(ROOT), f"front matter line {n} is not `key: value`: {line!r}")
            continue
        indent, key, val = len(m.group(1)), m.group(2), m.group(3)
        if indent == 0:
            if val == "":
                data[key] = {}
                parent = key
            else:
                data[key] = scalar(val)
                parent = None
        elif parent is not None and isinstance(data.get(parent), dict):
            data[parent][key] = scalar(val)
        else:
            err(path.relative_to(ROOT), f"front matter line {n}: unexpected indentation")
    return data, text[end + 5:]


# ---- colour contrast ---------------------------------------------------------------------------

def luminance(hex_color):
    h = hex_color.lstrip("#")
    chans = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    chans = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in chans]
    return 0.2126 * chans[0] + 0.7152 * chans[1] + 0.0722 * chans[2]


def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
PATH_OK = re.compile(r"^(/[A-Za-z0-9._\-/]+|https://\S+)$")

STATUSES = read_flat_map(ROOT / "_data" / "project_statuses.yml")
KINDS = read_flat_map(ROOT / "_data" / "project_kinds.yml")
LINK_KEYS = read_flat_map(ROOT / "_data" / "project_links.yml")
THEME_KEYS = {"bar", "background", "surface", "text", "accent", "accent_ink", "pattern", "hero", "hero_alt"}
LOGO_NAVY = "#2a3945"
FEATURED = []
PLACEHOLDER = re.compile(r"<<[^>]*>>|<!--\s*TEMPLATE|\bTODO\b|\bTBD\b|lorem ipsum", re.I)


def site_path_exists(url):
    """Does a root-relative URL point at something that will exist on the site?"""
    url = url.split("#")[0].split("?")[0]
    if url in ("", "/"):
        return True
    rel = url.lstrip("/")
    for slug_page in (ROOT / "_projects").glob("*.md"):
        if url.rstrip("/") == f"/projects/{slug_page.stem}":
            return True
    target = ROOT / rel
    if target.is_file() or (target.is_dir() and (target / "index.html").exists()):
        return True
    for cand in (target / "index.md", target / "index.html", Path(str(target).rstrip("/") + ".md")):
        if cand.exists():
            return True
    # pages with an explicit permalink
    for md in ROOT.rglob("*.md"):
        if any(part.startswith((".", "_")) for part in md.relative_to(ROOT).parts[:-1]) or "node_modules" in md.parts:
            continue
        fm, _ = front_matter(md)
        if fm and str(fm.get("permalink", "")).rstrip("/") == url.rstrip("/"):
            return True
    return False


# ---- project pages -----------------------------------------------------------------------------

def check_project(path):
    rel = path.relative_to(ROOT)
    fm, body = front_matter(path)
    if fm is None:
        err(rel, "no front matter")
        return
    for key in ("title", "description", "kind", "status", "year"):
        if key not in fm or fm[key] in ("", [], None):
            err(rel, f"missing required front matter `{key}`")
    if fm.get("layout") != "project":
        err(rel, "`layout:` must be `project`")
    if "date" in fm:
        err(rel, "remove `date:` - use `year:`. A date in the future makes Jekyll skip the page")
    if fm.get("status") and fm["status"] not in STATUSES:
        err(rel, f"status {fm['status']!r} is not one of {', '.join(STATUSES)}")
    if fm.get("kind") and fm["kind"] not in KINDS:
        err(rel, f"kind {fm['kind']!r} is not one of {', '.join(KINDS)}; adding a kind is the owner's decision")
    if "featured" in fm:
        if not isinstance(fm["featured"], bool):
            err(rel, "`featured:` must be true or false")
        elif fm["featured"]:
            FEATURED.append(str(rel))
    if "year" in fm and not (isinstance(fm["year"], int) and 1990 <= fm["year"] <= 2100):
        err(rel, "`year:` must be a four-digit number")
    if "platforms" in fm and not isinstance(fm["platforms"], list):
        err(rel, "`platforms:` must be a list, e.g. [iPhone, iPad]")
    desc = fm.get("description")
    if isinstance(desc, str):
        if len(desc) > 160:
            warn(rel, f"description is {len(desc)} characters; keep it to 160 or fewer (it is the search/share snippet)")
        if PLACEHOLDER.search(desc):
            err(rel, "description still has placeholder text")

    links = fm.get("links", {})
    if not isinstance(links, dict):
        err(rel, "`links:` must be a block of `key: url` lines")
    else:
        for k, v in links.items():
            if k not in LINK_KEYS:
                err(rel, f"unknown links key {k!r}; allowed: {', '.join(LINK_KEYS)}")
            elif not isinstance(v, str) or not PATH_OK.match(v):
                err(rel, f"links.{k} must be a site path starting with / or an https:// URL")
            elif v.startswith("/") and not site_path_exists(v):
                err(rel, f"links.{k} points at {v}, which does not exist in the repo")

    if "image" in fm:
        image = str(fm["image"])
        if not PATH_OK.match(image):
            err(rel, "`image:` must be a site path starting with / or an https:// URL")
        elif image.startswith("/") and not (ROOT / image.lstrip("/")).is_file():
            err(rel, f"image {image} does not exist")
        if not fm.get("image_alt"):
            warn(rel, "`image:` without `image_alt:`; describe the picture, or the featured block shows it with empty alt text")
    elif fm.get("featured") is True:
        warn(rel, "featured without an `image:`; the featured block will be text only")

    theme = fm.get("theme", {})
    if theme:
        if not isinstance(theme, dict):
            err(rel, "`theme:` must be a block of `key: value` lines")
            theme = {}
        for k in theme:
            if k not in THEME_KEYS:
                err(rel, f"unknown theme key {k!r}; allowed: {', '.join(sorted(THEME_KEYS))}")
        for k in ("bar", "background", "surface", "text", "accent", "accent_ink"):
            if k in theme and not HEX.match(str(theme[k])):
                err(rel, f"theme.{k} must be a quoted six-digit hex colour like \"#336699\"")
        if "bar" in theme and HEX.match(str(theme["bar"])):
            ratio = contrast(LOGO_NAVY, str(theme["bar"]))
            if ratio < 7.0:
                err(rel, f"theme.bar is too dark: the logo's navy outline and the menu text are only {ratio:.1f}:1 against it, "
                         "needs 7:1. The top bar may only be a light colour")
        for k in ("pattern", "hero"):
            if k in theme:
                v = str(theme[k])
                if not PATH_OK.match(v):
                    err(rel, f"theme.{k} must be a site path starting with / or an https:// URL")
                elif v.startswith("/") and not (ROOT / v.lstrip("/")).is_file():
                    err(rel, f"theme.{k} {v} does not exist")
        if "hero" in theme and not theme.get("hero_alt"):
            err(rel, "theme.hero needs theme.hero_alt (alt text describing the image)")
        surface = theme.get("surface", "#ffffff")
        text_c = theme.get("text", "#2a3945")
        accent = theme.get("accent", "#0069ad")
        ink = theme.get("accent_ink", "#ffffff")
        if all(HEX.match(str(c)) for c in (surface, text_c, accent, ink)):
            for label, a, b, need in (
                ("text on surface", text_c, surface, 7.0),
                ("accent (links) on surface", accent, surface, 4.5),
                ("accent_ink on accent (buttons)", ink, accent, 4.5),
            ):
                ratio = contrast(a, b)
                if ratio < need:
                    err(rel, f"theme contrast too low: {label} is {ratio:.1f}:1, needs {need}:1")

    # body rules
    if re.search(r"(?m)^# ", body):
        err(rel, "the body has an H1 (`# ...`); the layout already shows the title. Start at `##`")
    if re.search(r"(?m)^#{1,6} .*\*\*", body):
        warn(rel, "bold (`**`) inside a heading; headings are already bold")
    if re.search(r"<\s*(script|style|iframe)\b", body, re.I):
        err(rel, "no <script>, <style> or <iframe> in project pages; ask the owner if you need one")
    if PLACEHOLDER.search(body):
        err(rel, "placeholder text left in the page (<<...>>, TODO, TBD)")
    for m in re.finditer(r"!\[([^\]]*)\]\(([^)\s]+)", body):
        alt, src = m.group(1), m.group(2)
        if not alt.strip():
            err(rel, f"image {src} has no alt text")
        if src.startswith("/") and "{{" not in src and not (ROOT / src.lstrip("/")).is_file():
            err(rel, f"image {src} does not exist")
    for m in re.finditer(r"(?<!!)\[[^\]]*\]\((/[^)\s]*)\)", body):
        if "{{" not in m.group(1) and not site_path_exists(m.group(1)):
            err(rel, f"link {m.group(1)} does not point at anything in the repo")


# ---- standalone pages (privacy policies, support pages) ----------------------------------------

def check_standalone(path):
    rel = path.relative_to(ROOT)
    fm, body = front_matter(path)
    if not fm or fm.get("layout") != "standalone":
        return
    for key in ("title", "description", "permalink"):
        if not fm.get(key):
            err(rel, f"missing front matter `{key}`")
    own = "/" + rel.parts[0] + "/" if len(rel.parts) > 1 else None
    text = path.read_text(encoding="utf-8")
    if re.search(r"petshark\.ca", text, re.I):
        err(rel, "mentions petshark.ca; standalone pages must not point back at the portfolio")
    targets = [t.strip() for t in re.findall(r"\]\(([^)]+)\)", text)] + re.findall(r"href=[\"']([^\"']+)", text)
    for t in targets:
        m = re.fullmatch(r"\{\{\s*[\"'](/[^\"']*)[\"']\s*\|\s*relative_url\s*\}\}", t)
        url = m.group(1) if m else t
        if url.startswith(("mailto:", "https://", "http://", "#")):
            continue
        if url.startswith("/") and own and url.startswith(own):
            continue
        err(rel, f"link {t!r} leaves this game's pages; standalone pages may only link within their own folder or to outside sites")
    if PLACEHOLDER.search(text):
        err(rel, "placeholder text left in the page (<<...>>, TODO, TBD)")
    if not re.search(r"(?mi)^\*?Last updated:", text) and rel.name.startswith("privacy"):
        warn(rel, "privacy policy without a `Last updated:` line")


# ---- Liquid that GitHub Pages cannot build -----------------------------------------------------
# GitHub Pages runs Liquid 4, and a template error fails the whole build. Two things bit us:
# Liquid 4 still parses the tags inside {% comment %}, and the newer tags (liquid, render, echo) do not exist.

LIQUID_COMMENT = re.compile(r"\{%-?\s*comment\s*-?%\}(.*?)\{%-?\s*endcomment\s*-?%\}", re.S)
LIQUID_TAG = re.compile(r"\{%-?\s*(liquid|render|echo)\b")
LIQUID_SKIP = {"AGENTS.md", "CLAUDE.md", "README.md"}
CONFLICT_MARKER = re.compile(r"^(<<<<<<< |>>>>>>> )", re.M)


def check_liquid():
    for path in sorted(ROOT.rglob("*")):
        rel = path.relative_to(ROOT)
        if path.suffix not in (".html", ".md", ".xml") or rel.name in LIQUID_SKIP:
            continue
        if any(x in ("node_modules", "vendor", "scripts", "geopets-world", "_site") or x.startswith(".")
               for x in rel.parts[:-1]):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for m in CONFLICT_MARKER.finditer(text):
            line = text.count("\n", 0, m.start()) + 1
            err(f"{rel}:{line}", "git conflict marker left in the file; resolve the merge")
        for m in LIQUID_COMMENT.finditer(text):
            if "{%" in m.group(1) or "{{" in m.group(1):
                line = text.count("\n", 0, m.start()) + 1
                err(f"{rel}:{line}", "Liquid tag inside a {% comment %}; Liquid 4 still parses it and a malformed tag "
                                     "breaks the GitHub Pages build. Describe it in words instead")
        for m in LIQUID_TAG.finditer(text):
            line = text.count("\n", 0, m.start()) + 1
            err(f"{rel}:{line}", f"`{{% {m.group(1)} %}}` does not exist in the Liquid version GitHub Pages uses")


# ---- file size and type guard ------------------------------------------------------------------

GRANDFATHERED = ("geopets-world/archive/", "geopets-world/devlog/")
BANNED_EXT = {".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v", ".zip", ".7z", ".rar", ".apk", ".aab", ".ipa",
              ".unitypackage", ".exe", ".dmg", ".psd", ".blend", ".fbx", ".wav", ".aiff"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"}


def git_files():
    out = subprocess.run(["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
                         cwd=ROOT, capture_output=True, check=True).stdout.decode("utf-8")
    return [p for p in out.split("\0") if p]


def check_sizes():
    try:
        files = git_files()
    except (OSError, subprocess.CalledProcessError):
        warn(".", "could not run git; skipped the file size check")
        return
    try:
        tracked = set(subprocess.run(["git", "ls-tree", "-r", "-z", "--name-only", BASE] if BASE else ["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True)
                      .stdout.decode("utf-8").split("\0"))
    except (OSError, subprocess.CalledProcessError):
        tracked = set()
    new_total = 0
    for f in files:
        p = ROOT / f
        if not p.is_file() or f.startswith(GRANDFATHERED):
            continue
        size, ext = p.stat().st_size, p.suffix.lower()
        is_new = f not in tracked
        if ext in BANNED_EXT and is_new:
            err(f, f"{ext} files do not belong in this repo (video, installers, archives, source art); "
                   "see AGENTS.md, 'Large files'")
        if is_new:
            new_total += size
        limit = 300 * 1024 if ext in IMAGE_EXT else 1024 * 1024
        if is_new and size > limit:
            err(f, f"{size / 1024:.0f} KB is over the {limit // 1024} KB limit for new files; "
                   "shrink it, or host it outside this repo (AGENTS.md, 'Large files')")
        elif size > 1024 * 1024 and not is_new:
            warn(f, f"{size / 1048576:.1f} MB tracked file outside the grandfathered Geo Pets World folders")
    if new_total > 5 * 1024 * 1024:
        err(".", f"new files add up to {new_total / 1048576:.1f} MB; the budget per change is 5 MB. "
                 "Git history keeps everything forever")


def main():
    for p in sorted((ROOT / "_projects").glob("*.md")):
        check_project(p)
    for p in sorted(ROOT.rglob("*.md")):
        parts = p.relative_to(ROOT).parts
        if any(x.startswith((".", "_")) or x in ("node_modules", "vendor", "scripts") for x in parts[:-1]):
            continue
        if parts[0] in ("geopets-world",):
            continue
        check_standalone(p)
    check_liquid()
    check_sizes()
    if len(FEATURED) > 1:
        warn("_projects", f"{len(FEATURED)} projects are featured ({', '.join(FEATURED)}); the home page shows only the newest")

    for line in warnings + errors:
        print(line)
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())

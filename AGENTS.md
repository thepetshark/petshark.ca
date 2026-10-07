# Working on petshark.ca

This repo is the public website of Pet Shark Productions Inc., published at https://petshark.ca by GitHub Pages.
Read this file in full before you change anything. If you are an agent working on one of the studio's projects, the usual
reason you are here is to add or update that project's pages. Section 3 is your checklist.

Where this file and your instructions from the owner disagree, the owner wins. Where something here is unclear or does not
cover your case, **ask the owner instead of improvising**.

## 1. Rules

Rules the owner has stated:

1. **Standalone pages stay standalone.** A published game's support page and privacy policy (layout `standalone`) never link
   back to petshark.ca, the home page, a project page or any other part of this site. They load no site stylesheet, script,
   menu or logo. The only links allowed on them are `mailto:`, links to outside sites, and links between that same game's own
   pages. A project page may link *to* them; they never link back.
2. **Published URLs never move.** `/catbox/`, `/forestfellers/`, `/idlings/` and their `/privacy/` pages are registered with
   Apple. Never rename, move or delete a standalone page. The same applies to any page of a released game.
3. **The repo has a size budget, and history counts.** GitHub Pages sites are limited to 1 GB published, and the repo should
   stay under 1 GB including all history. Anything committed is kept forever; deleting a file later does not shrink the
   repo. Follow section 6. Never rewrite history or force-push to shrink the repo; that needs the owner's explicit approval.
4. **Dev logs: indexing is decided per project.** The Geo Pets World Dev Log is deliberately hidden from search engines.
   Other dev logs may or may not be. Ask the owner which it is before you publish one (section 5).

Rules added to keep a site edited by several agents consistent. The owner may change them:

5. **Use the system, do not work around it.** Project pages use `layout: project` and the `theme:` block. Do not add
   per-page CSS, `<style>`, `<script>` or `<iframe>` to a project page. If you need something the layouts cannot do, say so
   to the owner and propose a change.
6. **Do not edit shared files unprompted:** `_config.yml`, `_layouts/`, `_includes/`, `_data/`, `assets/css/site.css`,
   `scripts/`, this file, or any other project's pages. Adding files for your own project is fine.
7. **No trackers, analytics, third-party scripts, extra web fonts or embeds** (YouTube, social widgets) without the owner's
   approval. The site's one font is Archivo, self-hosted in `assets/fonts/` under its open licence; do not add another. Link to
   a video instead of embedding it.
8. **Do not invent facts.** Store links, release dates, platforms, features, awards, download numbers and quotes must come from
   the owner or from the project itself. If you do not know, leave it out and tell the owner.
9. **Privacy policies say only what the shipped build does.** List every third-party library that sends data anywhere. The
   owner approves the final wording of any policy.
10. **Commits:** one logical change per commit, with a message that says what changed
    (`Mushi Poi: add screenshots to the project page`). Never `git push --force`. Push to `main` only when whoever asked you
    to update the site has told you to publish; otherwise commit and say that you have not pushed.

## 2. How the site works

- GitHub Pages builds the site with Jekyll 3.10 on every push to `main`; it is live a minute or two later. If the build fails,
  the old site stays up and the owner gets an email. The Actions tab shows "pages build and deployment".
- Only plugins on GitHub's allowlist can run. Right now that is `jekyll-seo-tag`. Do not add a plugin to `_config.yml`
  unless it is on https://pages.github.com/versions/ and the owner agrees.
- A file **with** front matter (`---` lines at the top) is rendered through a layout. A file **without** it is copied as is.
  That is how the Geo Pets World Dev Log works: plain HTML files, copied untouched.
- Folders that start with `_` or `.` are not published. `_config.yml` has an `include:` list for the rare exception.
- GitHub Pages is **case-sensitive**; Windows is not. `Card.JPG` and `card.jpg` are different files online. Use lowercase file
  names with hyphens.

| Kind of page | Where it lives | Layout |
|---|---|---|
| Home page | `index.md` | `home` |
| A project page (a game, app, tool or other project) | `_projects/<slug>.md`, published at `/projects/<slug>/` | `project` |
| A game's support page and privacy policy | `<slug>/index.md`, `<slug>/privacy.md`, at `/<slug>/` and `/<slug>/privacy/` | `standalone` |
| A dev log | `<slug>/devlog/`, static files | its own |
| Not-found page | `404.html` | `default` |

The page frame is fixed: a slim Pet Shark top bar, a content area ("stage"), a footer. A theme re-colours the stage, and may
tint the top bar with a light colour (`bar`); the footer never changes.

The home page is built from `_projects/`; you never edit a list. It shows an optional featured project (`featured: true`),
then an index of every project ordered by `status` (the order in `_data/project_statuses.yml`) and then newest `year` first,
with columns for type, platforms, status and year. The site is not only games: a project's `kind` says what sort of thing it
is (`_data/project_kinds.yml`). The owner decides which projects are shown at all; do not add one on your own initiative.

## 3. Adding a project: the checklist

1. **Choose the slug.** If the project already has a standalone folder (`catbox`, `forestfellers`, `idlings`), reuse that name.
   Otherwise use lowercase words joined by hyphens (`geopets-world`). Check with the owner that the project is meant to appear
   on the site (rule: the owner decides) and what `status` it should have. A game that is submitted but not yet live in a store
   is `in-development`. Leave out `app_store` or `google_play` until the owner gives you the real store URL; when the game goes
   live the owner will ask for `status: released` and the link. Its `support` and `privacy` links are fine as soon as those pages
   are published (section 4).
2. **Create the page.** Copy `_templates/project.md` to `_projects/<slug>.md` and fill it in (front matter below).
3. **Write the body.** Start at `##`; the layout already shows the title, subtitle, description, the facts (status, type,
   platforms, year) and the link buttons, so do not repeat them. No `**bold**` inside headings. Write in the owner's voice, first person and plain, as the
   existing pages do, unless told otherwise.
4. **Add images** (section 6). Put them in `assets/img/projects/<slug>/`. Every image needs alt text:
   `![A level with a spring pad and three Mushi](/assets/img/projects/mushipoi/level-3.jpg)`.
5. **Theme it, if the project has a look of its own** (below). If it has no palette yet, leave `theme` out; the page then uses
   the default Pet Shark look.
6. **Link to the right places** with `links:`: store pages, a download, the dev log, and, once published, the game's support
   page and privacy policy.
7. **Run `python scripts/check-site.py`** and fix every error. It checks the rules in this file. It cannot build the site.
8. **Commit** (rule 10). After it is published, open https://petshark.ca/projects/<slug>/ and the home page and look.

If the game is being published on the App Store, also do section 4. It is a separate job from the project page.

### Front matter of a project page

| Key | Required | Meaning |
|---|---|---|
| `layout` | yes | `project` |
| `title` | yes | The project's name |
| `subtitle` | no | An alternate or full name, shown under the title |
| `description` | yes | One sentence, 160 characters or fewer. It is the line in the home page index, the search snippet and the share text, so do not repeat the platform or status in it |
| `kind` | yes | What the project is: `game`, `app`, `tool`, `library` or `experiment` (`_data/project_kinds.yml`) |
| `status` | yes | `released`, `prototype`, `in-development` or `archived` (`_data/project_statuses.yml`) |
| `year` | yes | Year released, or started if not out yet. A four-digit number |
| `platforms` | no | A list, e.g. `[iPhone, iPad]` or `[Windows, Mac]`. Leave it out when it does not apply (a web tool, a library) |
| `image` | no | Thumbnail in the index and picture in the featured block and when shared: 8:5 (like 640 × 400) and under 300 KB |
| `image_alt` | with `image` | Alt text for `image`; it is read out on the featured block |
| `featured` | no | `true` puts the project in the featured block on the home page. The owner picks; if several are set, the newest `year` wins |
| `links` | no | Keys from `_data/project_links.yml`: `app_store`, `google_play`, `download`, `demo`, `devlog`, `docs`, `support`, `privacy`, `source`, `website`. Values are `/site/paths` or `https://` URLs. `source` must be a **public** repository: a private one shows visitors a 404 |
| `theme` | no | See below |
| `noindex` | no | `true` asks search engines to skip the page, and leaves it out of `sitemap.xml` |

Do **not** use `date:`. Jekyll silently skips a page dated in the future. Keep front matter simple: `key: value`, lists as
`[a, b]`, and the one-level `links:` and `theme:` blocks. Quote every hex colour (`"#336699"`; an unquoted `#` starts a YAML comment).

### Themes

A theme re-colours the stage of one project page. The footer never changes, and the top bar stays white unless you give it a
light tint with `bar`, so a visitor always knows they are on Pet Shark. All text on a themed page sits on a **surface panel**,
so a background colour or pattern is decoration and cannot make text hard to read. Without a theme, a project page is plain
white and reads like an article.

| Key | Default | What it does | Rule |
|---|---|---|---|
| `bar` | `#ffffff` | Colour of the top bar | a light colour only: the logo's navy outline and the menu text need 7:1 against it |
| `background` | `#ffffff` | Colour behind the panel | none |
| `surface` | `#ffffff` | The content panel | |
| `text` | `#2a3945` | Text on the panel | contrast with `surface` at least 7:1 |
| `accent` | `#0069ad` | Links and buttons | contrast with `surface` at least 4.5:1 |
| `accent_ink` | `#ffffff` | Text on buttons | contrast with `accent` at least 4.5:1 |
| `pattern` | none | A small tiling image behind the panel | under 100 KB |
| `hero` | none | A banner above the panel | needs `hero_alt`; 1600 px wide, under 300 KB |
| `hero_alt` | none | Alt text for the banner | describe the picture |

Take the colours from the project's own palette (its UI or logo), not from a guess. Use all five of `background`, `surface`,
`text`, `accent` and `accent_ink`, or none of them: a theme that sets only some is almost always unreadable. `bar` is
optional and independent. The check script measures the contrast and fails below the limits.
Geo Pets World (`_projects/geopets-world.md`) is the reference example.

## 4. Support and privacy pages for a published game

Do this when a game is on, or about to go on, the App Store or Google Play. These pages are what the store links to.

1. Copy `_templates/support.md` to `<slug>/index.md` and `_templates/privacy.md` to `<slug>/privacy.md`. The permalinks must be
   exactly `/<slug>/` and `/<slug>/privacy/`.
2. Fill them in from the shipped build, not from another game's page. List every library in the build that sends data
   (purchases, ads, analytics, crash reports, game services). Keep only the sections that apply. Set `Last updated`.
3. Remove every `<<...>>` and every `TEMPLATE` comment. The check script fails while any is left.
4. Rule 1 applies: no links to the portfolio, home page or any other project. The layout is `standalone`; leave it so.
5. Get the owner's approval of the wording before pushing (rule 9).
6. Add `support:` and `privacy:` under `links:` on the game's project page.

## 5. Dev logs

A dev log is a set of static pages under `/<slug>/devlog/`, with its own look. The Geo Pets World Dev Log
(`geopets-world/devlog/`, with its source material in `geopets-world/archive/`) is the one example. It is produced by tooling
outside this repo, so do not hand-edit its pages.

Before publishing a new dev log, ask the owner whether it is **public** or **hidden from search**.

- Hidden: put `<meta name="robots" content="noindex">` in every page of it, and add a `Disallow: /<slug>/<archive path>/` line
  to `robots.txt` for any folder of raw material. Leave the dev log's own pages crawlable, otherwise search engines never see
  the `noindex`.
- Public: say so in the project page's description or body, and link it with `links.devlog`.

Either way it needs a way back to the project page, the size rules in section 6 apply, and large source material (full-size
screenshots, recordings) does not belong in this repo.

## 6. Large files and media

| What | Rule |
|---|---|
| Images in pages | JPEG, PNG, WebP or SVG. Under **300 KB** each, resized to about twice the size they display at (card 800 px wide, hero 1600 px, inline 1000 px). JPEG or WebP at about quality 80 unless it needs transparency |
| Video, installers, archives, source art | **Not in this repo**: `.mp4 .mov .webm .zip .apk .ipa .unitypackage .psd .blend .fbx .wav` and similar. The check script fails on them |
| One change | Under **5 MB** of new files in total |
| Existing Dev Log material | Under `geopets-world/archive/` and `geopets-world/devlog/`; already in history, exempt from the limits above, not a model to copy |

Why: the repo is 160 MB today, nearly all of it Geo Pets World material, and history never shrinks. Re-committing a changed
2 MB image adds another 2 MB, so get an image right before you commit it, and do not commit the same file over and over.

Where large things go: the owner is setting up a separate public assets repository for downloadable builds and large media.
Until it exists, and until the owner tells you how to reference it, ask. Do not put the files here as a stopgap.

To shrink an image with Pillow:

```python
from PIL import Image
im = Image.open("shot.png").convert("RGB")
im.thumbnail((1000, 1000))                      # longest side, in pixels
im.save("shot.jpg", quality=80, optimize=True)  # check the size afterwards
```

## 7. Before every commit

- [ ] `python scripts/check-site.py` reports 0 errors
- [ ] If Docker is available, `scripts/build-check.sh` ends with "Build OK" (section 8)
- [ ] The slug is lowercase with hyphens; file names are lowercase
- [ ] No published URL moved (rule 2); no standalone page links out to the site (rule 1)
- [ ] Every image has alt text and is under 300 KB; no video or installers
- [ ] No placeholder text; no invented facts (rule 8)
- [ ] Only your own project's files changed, apart from the pointers in section 3 (rule 6)
- [ ] The commit message says what changed

## 8. Known pitfalls

- `{{` and `{%` in a Markdown page are read as Liquid. To show them literally, wrap the text in `{% raw %}...{% endraw %}`.
- GitHub Pages runs Liquid 4, which is stricter than newer versions. It still parses tags inside `{% comment %}`, and it has no
  `{% liquid %}`, `{% render %}` or `{% echo %}`. A template error fails the whole build (the old site stays up). The check
  script looks for both mistakes.
- A root-relative link such as `/geopets-world/devlog/` is fine on a project page. Links inside a `standalone` page are written
  `{{ "/slug/privacy/" | relative_url }}`, exactly as the existing pages and templates do.
- A new top-level folder with an `index.md` becomes a public page at once. Check that it is meant to be public.
- A change to `_config.yml` needs a restart of `jekyll serve` to take effect locally; on GitHub it takes effect on the next build.
- With Docker available, use the real build: `scripts/build-check.sh` builds the site in GitHub's own Pages image, then runs
  `check-site.py` and `scripts/smoke-test.py`. It catches Liquid and Jekyll errors that `check-site.py` cannot. It needs a
  logged-in `gh` (or `GITHUB_TOKEN`).
- `scripts/preview.sh` serves the site with auto-reload on port 4000, bound to the whole LAN (anyone on the network can open
  it; never expose the port beyond the LAN). Without Docker, `bundle install` and `bundle exec jekyll serve` also work (see
  `Gemfile`). If you can run neither, rely on `scripts/check-site.py` and look at the live page after it is published.

## 9. The studio's brand

- **Logo:** `assets/img/petshark-logo.png` (transparent, 630 × 326). Use the file as it is: do not recolour, stretch, crop or
  add effects to it. It reads on white, on the light blue and on the brand blue. On navy its outline disappears, so put it on a
  light plate there. The site's top bar and home page already show it; project pages do not need it.
- **Colours:** blue `#00aeff`, navy `#2a3945`, light blue `#d1f1fe` (the colour the logo usually sits on). The blue is too pale
  for text on white (2.6:1); use `#0069ad` for links and text in that hue.
- **Typeface:** Archivo, self-hosted from `assets/fonts/` (open licence, file included). The design is an editorial index:
  hairline rules, small corners, no hard shadows, and the light blue used as one field rather than everywhere.
- The design system lives in `assets/css/site.css`; use its variables rather than copying hex values into a page.

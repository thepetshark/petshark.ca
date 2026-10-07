# petshark.ca

The public website of Pet Shark Productions Inc.: a home page, a page for each game, and the support and privacy pages
the app stores link to. Published at https://petshark.ca by GitHub Pages from the `main` branch.

**If you are an agent (or a person) about to change this repo, read [AGENTS.md](AGENTS.md) first.** It has the rules, the
checklist for adding a project, and the limits on file size. Before every commit, run:

```
python scripts/check-site.py
```

## Layout of the repo

| Path | What it is |
|---|---|
| `index.md` | Home page text (the project list is built from `_projects/`) |
| `_projects/` | One Markdown file per project page |
| `_templates/` | Starting points to copy: a project page, a support page, a privacy policy |
| `_layouts/`, `_includes/`, `_data/`, `assets/css/site.css` | The design: top bar, home page, project page, themes |
| `catbox/`, `forestfellers/`, `idlings/` | Standalone support and privacy pages for published games. Never move these |
| `geopets-world/` | The Geo Pets World Dev Log and its archived material |
| `scripts/check-site.py` | Checks the repo against the rules in `AGENTS.md` |
| `_config.yml`, `robots.txt`, `sitemap.xml`, `404.html` | Site configuration |

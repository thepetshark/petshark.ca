#!/usr/bin/env bash
# Serves the site with auto-reload on http://<this machine's LAN address>:4000 (Ruby container, github-pages gem set).
# WARNING: this binds to all interfaces, so anyone on the LAN can open it. Do not expose port 4000 beyond the LAN.
# Usage: scripts/preview.sh        Stop with Ctrl-C. Needs Docker. A change to _config.yml needs a restart.
set -euo pipefail

repo=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo"
mkdir -p .bundle-cache
tty=(); [ -t 0 ] && tty=(-it)

exec docker run --rm "${tty[@]}" \
  --user "$(id -u):$(id -g)" -e HOME=/tmp -e BUNDLE_PATH=/srv/jekyll/.bundle-cache \
  -v "$repo:/srv/jekyll" -w /srv/jekyll -p 4000:4000 -p 35729:35729 \
  ruby:3.3 \
  bash -c 'bundle install --quiet && bundle exec jekyll serve --livereload --host 0.0.0.0 --port 4000 --force_polling'

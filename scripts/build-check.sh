#!/usr/bin/env bash
# Builds the site exactly as GitHub Pages does (same Docker image), then runs the repo checks.
# Usage: scripts/build-check.sh        Needs Docker and a logged-in `gh` (or GITHUB_TOKEN): the Pages build reads repo metadata. Leaves the result in a temp folder, whose path is printed.
set -euo pipefail

IMAGE=ghcr.io/actions/jekyll-build-pages:v1.0.13
repo=$(cd "$(dirname "$0")/.." && pwd)
work=$(mktemp -d)
trap 'docker run --rm -v "$work:/w" --entrypoint chown "$IMAGE" -R "$(id -u):$(id -g)" /w >/dev/null 2>&1 || true' EXIT

cd "$repo"
python scripts/check-site.py

# Copy tracked and untracked-but-not-ignored files, so uncommitted work is built too.
git ls-files -z --cached --others --exclude-standard | xargs -0 -I{} cp --parents {} "$work/" 2>/dev/null || true
git ls-files -z --deleted | xargs -0 -r -I{} rm -f "$work/{}"

INPUT_TOKEN=${GITHUB_TOKEN:-$(gh auth token)}
export INPUT_TOKEN

docker run --rm \
  -v "$work:/github/workspace" -w /github/workspace \
  -e INPUT_SOURCE=. -e INPUT_DESTINATION=./_site -e INPUT_FUTURE=false -e INPUT_VERBOSE=false \
  -e INPUT_BUILD_REVISION="$(git rev-parse HEAD)" -e GITHUB_REPOSITORY=thepetshark/petshark.ca \
  -e GITHUB_WORKSPACE=/github/workspace -e INPUT_TOKEN \
  "$IMAGE"

python scripts/smoke-test.py "$work/_site"
echo "Build OK. Output: $work/_site"
trap - EXIT
docker run --rm -v "$work:/w" --entrypoint chown "$IMAGE" -R "$(id -u):$(id -g)" /w >/dev/null

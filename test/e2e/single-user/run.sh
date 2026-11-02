#!/usr/bin/env bash
# Packs this checkout and runs the single-account scenario in a clean Docker container.
# Usage: npm run test:e2e   (CLAUDE_CODE_VERSION=2.1.0 npm run test:e2e to pin Claude Code)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../../.." && pwd)"
context="$(mktemp -d)"
trap 'rm -rf "$context"' EXIT

cp "$here/Dockerfile" "$here/scenario.sh" "$here/drive.py" "$context/"
tarball="$(cd "$root" && npm pack --silent --pack-destination "$context")"
mv "$context/$tarball" "$context/ai-profile-switch.tgz"

docker build -q -t ai-profile-switch-e2e \
  --build-arg "CLAUDE_CODE_VERSION=${CLAUDE_CODE_VERSION:-latest}" "$context" >/dev/null
docker run --rm ai-profile-switch-e2e

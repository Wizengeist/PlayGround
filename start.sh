#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
BUILD_DIR="$PROJECT_DIR/dist"
PORT="${PORT:-3000}"
: "${OPENCODE_WEB_DIR:?OPENCODE_WEB_DIR must point to worker metadata storage}"

cd "$PROJECT_DIR"

# Install dependencies only for package-based projects. This game is static and has none.
if [[ -f "$PROJECT_DIR/package.json" ]]; then
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  if /usr/bin/time -p node -e "process.exit(require('./package.json').scripts?.build ? 0 : 1)"; then
    /usr/bin/time -p npm run build
  fi
else
  /usr/bin/time -p mkdir -p "$BUILD_DIR"
  if [[ ! -f "$PROJECT_DIR/public/index.html" ]]; then
    echo "Missing static game entry point: $PROJECT_DIR/public/index.html" >&2
    exit 1
  fi
  /usr/bin/time -p cp "$PROJECT_DIR/public/index.html" "$BUILD_DIR/index.html"
fi

/usr/bin/time -p mkdir -p "$OPENCODE_WEB_DIR"
PROJECT_DIR="$PROJECT_DIR" /usr/bin/time -p node -e 'const fs=require("node:fs"); const path=require("node:path"); const project=path.resolve(process.env.PROJECT_DIR); const directory=path.resolve(project,"dist"); fs.writeFileSync(path.join(process.env.OPENCODE_WEB_DIR,"deployment-output.json"), JSON.stringify({project,directory}));'
/usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$BUILD_DIR"

#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory}"
: "${RUNTIME_DIR:?RUNTIME_DIR must point to the worker runtime}"

cd "$PROJECT_DIR"
/usr/bin/time -p bash -n "$PROJECT_DIR/capture.sh"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
CAPTURE_STRICT=1 CAPTURE_READY_SELECTOR="canvas" CAPTURE_START_SELECTOR="#start" \
  /usr/bin/time -p node "$RUNTIME_DIR/scripts/default-capture.mjs"

#!/usr/bin/env bash
set -euo pipefail

# Ensure you are in main
git checkout main

# Ensure you are doing a pull
git pull

# Deploy changes (guarded: skips when the production build hash matches the deployed marker)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/deploy-guard.sh"
deploy_guard_main

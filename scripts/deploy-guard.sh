#!/usr/bin/env bash
# deploy-guard.sh — deployment guard for stary.
#
# Compares the production build's webpack compilation hash (the `Hash: <16
# hex>` value Angular prints, e.g. `Hash: 8eb53848611e44c5`) against the hash
# recorded in build-hash.txt on the gh-pages branch. Deploys only when they
# differ or when the deployed state is unknown; skips redeploying an identical
# build.
#
# Both sourceable (defines functions) and directly runnable (runs
# deploy_guard_main when executed as a script).
#
# Extraction note: Angular 21 prints the hash on a single line such as
#   Build at: ... - Hash: 8eb53848611e44c5 - Time: 1234ms
# so the hash is taken from the FIRST `Hash:` token in the build output, not a
# line-anchored `^Hash: ` match (which would never fire on modern output).
# The extracted value is strictly validated as ^[0-9a-f]{16}$ on both sides.
#
# Test seams (used by scripts/test-deploy-guard.sh, never in production):
#   GUARD_LOCAL_HASH        bypass the production build with a literal hash
#   GUARD_DEPLOYED_HASH_URL override the marker URL (file:// or http(s))
#   GUARD_SKIP_DEPLOY=1     print the would-run deploy command and stop before
#                           `npm run deploy:nobuild` (no-build deploy; its
#                           --cname flag must keep rewriting the CNAME file —
#                           gh-pages force-pushes the whole tree, so any deploy
#                           without it deletes CNAME and GitHub Pages drops the
#                           custom domain, 404ing the site)
#
# Decisions never err toward a skip:
#   - marker absent (HTTP 404)              -> DEPLOY (bootstraps the marker)
#   - marker unreadable (curl/network/HTTP) -> DEPLOY
#   - marker malformed body                 -> DEPLOY
#   - local build failure / bad Hash line   -> ABORT non-zero, no deploy
#   - SKIP only when a valid deployed hash equals the validated local hash.

set -euo pipefail

GSD_LIB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GSD_REPO_ROOT="$(cd "$GSD_LIB_ROOT/.." && pwd)"

dg_error() {
  printf 'deploy-guard: error: %s\n' "$*" >&2
}

dg_valid_hash() {
  [[ "$1" =~ ^[0-9a-f]{16}$ ]]
}

# Sets DG_LOCAL_HASH to a validated 16-hex build hash; returns 1 (no deploy)
# when the build fails or the Hash line is missing/malformed.
dg_compute_local_hash() {
  local out
  DG_LOCAL_HASH="${GUARD_LOCAL_HASH:-}"
  if [ -n "$DG_LOCAL_HASH" ]; then
    if dg_valid_hash "$DG_LOCAL_HASH"; then
      return 0
    fi
    dg_error "GUARD_LOCAL_HASH is not a valid 16-hex hash: '$DG_LOCAL_HASH'"
    return 1
  fi
  if ! out="$(npm run build -- --configuration production --base-href=https://star.vpv.io/ 2>&1)"; then
    dg_error "production build failed — not deploying"
    return 1
  fi
  DG_LOCAL_HASH="$(printf '%s\n' "$out" | awk '{ for (i = 1; i <= NF; i++) if ($i == "Hash:") { print $(i + 1); exit } }')"
  if ! dg_valid_hash "$DG_LOCAL_HASH"; then
    dg_error "missing or malformed 'Hash:' line in production build output — not deploying"
    return 1
  fi
  return 0
}

# Prints the raw.githubusercontent.com URL for the gh-pages build-hash.txt
# marker, derived from `git remote get-url origin`. Returns 1 when the remote
# shape cannot be parsed.
dg_marker_url() {
  local remote owner repo
  if ! remote="$(git remote get-url origin 2>/dev/null)"; then
    return 1
  fi
  case "$remote" in
    *github.com:*)
      remote="${remote##*github.com:}"
      ;;
    *github.com/*)
      remote="${remote##*github.com/}"
      ;;
  esac
  remote="${remote%.git}"
  owner="${remote%%/*}"
  repo="${remote#*/}"
  if [ -z "$owner" ] || [ -z "$repo" ] || [ "$owner" = "$repo" ]; then
    return 1
  fi
  printf 'https://raw.githubusercontent.com/%s/%s/gh-pages/build-hash.txt\n' "$owner" "$repo"
}

# Classifies the deployed side of the comparison into one of:
#   DG_DEPLOYED_KIND  = valid | missing | malformed | unreadable
#   DG_DEPLOYED_VALUE = validated 16-hex hash when kind=valid, else ''
#   DG_DEPLOYED_DETAIL= diagnostic string for reason lines
dg_fetch_deployed_state() {
  local marker_url scheme body status
  DG_DEPLOYED_KIND="unreadable"
  DG_DEPLOYED_VALUE=""
  DG_DEPLOYED_DETAIL=""
  DG_TMPDIR=""
  if [ -n "${GUARD_DEPLOYED_HASH_URL:-}" ]; then
    marker_url="$GUARD_DEPLOYED_HASH_URL"
  else
    if ! marker_url="$(dg_marker_url)"; then
      DG_DEPLOYED_KIND="unreadable"
      DG_DEPLOYED_DETAIL="could not derive gh-pages marker URL from git origin remote"
      return 0
    fi
  fi
  case "$marker_url" in
    file://*) scheme="file" ;;
    *) scheme="http" ;;
  esac
  DG_TMPDIR="$(mktemp -d)"
  trap 'rm -rf "$DG_TMPDIR"' RETURN
  body="$DG_TMPDIR/marker"
  if [ "$scheme" = "file" ]; then
    if curl --max-time 15 -sS -o "$body" "$marker_url" 2>/dev/null; then
      status="200"
    else
      DG_DEPLOYED_KIND="unreadable"
      DG_DEPLOYED_DETAIL="curl failure reading file:// marker"
      return 0
    fi
  else
    if ! status="$(curl --max-time 15 -sS -o "$body" -w '%{http_code}' "$marker_url" 2>/dev/null)"; then
      DG_DEPLOYED_KIND="unreadable"
      DG_DEPLOYED_DETAIL="curl failure fetching marker"
      return 0
    fi
  fi
  case "$status" in
    404)
      DG_DEPLOYED_KIND="missing"
      DG_DEPLOYED_DETAIL="HTTP 404 (no build-hash.txt on gh-pages)"
      return 0
      ;;
    200) ;;
    *)
      DG_DEPLOYED_KIND="unreadable"
      DG_DEPLOYED_DETAIL="unexpected HTTP status '$status'"
      return 0
      ;;
  esac
  DG_DEPLOYED_VALUE="$(tr -d '\r\n' < "$body")"
  if dg_valid_hash "$DG_DEPLOYED_VALUE"; then
    DG_DEPLOYED_KIND="valid"
    DG_DEPLOYED_DETAIL="valid marker hash"
  else
    DG_DEPLOYED_VALUE=""
    DG_DEPLOYED_KIND="malformed"
    DG_DEPLOYED_DETAIL="marker body fails 16-hex format check"
  fi
  return 0
}

# Pure decision: prints SKIP only when the deployed side is a valid hash that
# string-equals the local hash; prints DEPLOY in every other case.
dg_decide() {
  local local_hash="$1" deployed_kind="$2" deployed_value="${3:-}"
  if [ "$deployed_kind" = "valid" ] && [ "$deployed_value" = "$local_hash" ]; then
    printf 'SKIP\n'
  else
    printf 'DEPLOY\n'
  fi
}

dg_deploy_reason() {
  case "$DG_DEPLOYED_KIND" in
    missing)
      printf 'marker absent (first run?)\n'
      ;;
    unreadable)
      printf 'deployed hash unreadable (%s)\n' "$DG_DEPLOYED_DETAIL"
      ;;
    malformed)
      printf 'deployed hash malformed (%s)\n' "$DG_DEPLOYED_DETAIL"
      ;;
    valid)
      printf 'hash differs (local %s vs deployed %s)\n' "$DG_LOCAL_HASH" "$DG_DEPLOYED_VALUE"
      ;;
    *)
      printf 'deployed state unknown (%s)\n' "$DG_DEPLOYED_KIND"
      ;;
  esac
}

deploy_guard_main() {
  local decision
  if ! dg_compute_local_hash; then
    return 1
  fi
  dg_fetch_deployed_state
  decision="$(dg_decide "$DG_LOCAL_HASH" "$DG_DEPLOYED_KIND" "$DG_DEPLOYED_VALUE")"
  if [ "$decision" = "SKIP" ]; then
    printf 'Already deployed (build hash %s matches deployed) — skipping deploy.\n' "$DG_LOCAL_HASH"
    return 0
  fi
  printf 'DEPLOY: %s\n' "$(dg_deploy_reason)"
  if [ "${GUARD_SKIP_DEPLOY:-0}" = "1" ]; then
    printf '(GUARD_SKIP_DEPLOY=1) would run: npm run deploy:nobuild\n'
    return 0
  fi
  printf '%s' "$DG_LOCAL_HASH" > "$GSD_REPO_ROOT/dist/stary/build-hash.txt"
  npm run deploy:nobuild
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  deploy_guard_main
fi
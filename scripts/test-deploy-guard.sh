#!/usr/bin/env bash
# test-deploy-guard.sh — decision-matrix runner for scripts/deploy-guard.sh.
#
# Sources the guard library (never executes its main on load) and asserts the
# full decision matrix. Every main-entry case sets GUARD_SKIP_DEPLOY=1 so no
# case can ever build or publish. Fast: no npm build, no network.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/deploy-guard.sh"

PASS=0
FAIL=0
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

record() {
  local ok="$1" name="$2" detail="${3:-}"
  if [ "$ok" -eq 0 ]; then
    PASS=$((PASS + 1))
    printf 'PASS: %s\n' "$name"
  else
    FAIL=$((FAIL + 1))
    printf 'FAIL: %s%s\n' "$name" "${detail:+ [$detail]}"
  fi
}

# Run a command with errexit temporarily off, capturing its output and exit
# code into GLOBAL_OUT / GLOBAL_RC. Runs in the current shell: a `( )`
# subshell would inherit the EXIT trap and fire it early, deleting TMP_ROOT
# while the run is still in progress.
run_raw() {
  GLOBAL_RC=0
  GLOBAL_OUT=""
  local tmp
  tmp="$TMP_ROOT/out.$$"
  set +e
  "$@" > "$tmp" 2>&1
  GLOBAL_RC=$?
  set -e
  GLOBAL_OUT="$(cat "$tmp")"
  rm -f "$tmp"
}

case_1_skip_on_equal_hashes() {
  local res
  res="$(dg_decide 'aaaaaaaaaaaaaaaa' valid 'aaaaaaaaaaaaaaaa')"
  if [ "$res" = "SKIP" ]; then
    record 0 "1 skip on equal valid hashes"
  else
    record 1 "1 skip on equal valid hashes" "dg_decide returned '$res'"
  fi
}

case_2_deploy_on_differing_hashes() {
  local res
  res="$(dg_decide 'aaaaaaaaaaaaaaaa' valid 'bbbbbbbbbbbbbbbb')"
  if [ "$res" = "DEPLOY" ]; then
    record 0 "2 deploy on differing valid hashes"
  else
    record 1 "2 deploy on differing valid hashes" "dg_decide returned '$res'"
  fi
}

case_3_deploy_on_empty_deployed_side() {
  local res
  res="$(dg_decide 'aaaaaaaaaaaaaaaa' missing '')"
  if [ "$res" = "DEPLOY" ]; then
    record 0 "3 deploy when deployed side absent"
  else
    record 1 "3 deploy when deployed side absent" "dg_decide returned '$res'"
  fi
}

case_4_deploy_on_malformed_deployed_side() {
  local res
  res="$(dg_decide 'aaaaaaaaaaaaaaaa' malformed 'zz-not-a-hash')"
  if [ "$res" = "DEPLOY" ]; then
    record 0 "4 deploy on malformed deployed side"
  else
    record 1 "4 deploy on malformed deployed side" "dg_decide returned '$res'"
  fi
}

case_5_abort_on_malformed_local_hash() {
  GUARD_LOCAL_HASH='not-a-valid-hash'
  GUARD_DEPLOYED_HASH_URL='http://127.0.0.1:9/build-hash.txt'
  GUARD_SKIP_DEPLOY=1
  run_raw deploy_guard_main
  if [ "$GLOBAL_RC" -ne 0 ] && ! printf '%s' "$GLOBAL_OUT" | grep -qE '^(SKIP|DEPLOY):'; then
    record 0 "5 malformed local hash aborts without a decision"
  else
    record 1 "5 malformed local hash aborts without a decision" \
      "rc=$GLOBAL_RC out=$(printf '%s' "$GLOBAL_OUT" | head -n 1)"
  fi
}

case_6_skip_when_deployed_marker_matches() {
  local marker
  marker="$TMP_ROOT/marker-same.txt"
  printf 'aaaaaaaaaaaaaaaa' > "$marker"
  GUARD_LOCAL_HASH='aaaaaaaaaaaaaaaa'
  GUARD_DEPLOYED_HASH_URL="file://$marker"
  GUARD_SKIP_DEPLOY=1
  run_raw deploy_guard_main
  if [ "$GLOBAL_RC" -eq 0 ] \
     && printf '%s' "$GLOBAL_OUT" | grep -q 'skipping deploy' \
     && printf '%s' "$GLOBAL_OUT" | grep -q 'aaaaaaaaaaaaaaaa'; then
    record 0 "6 equal marker hash skips deploy"
  else
    record 1 "6 equal marker hash skips deploy" "rc=$GLOBAL_RC out=$GLOBAL_OUT"
  fi
}

case_7_network_failure_deploys() {
  GUARD_LOCAL_HASH='bbbbbbbbbbbbbbbb'
  GUARD_DEPLOYED_HASH_URL='http://127.0.0.1:9/build-hash.txt'
  GUARD_SKIP_DEPLOY=1
  run_raw deploy_guard_main
  if [ "$GLOBAL_RC" -eq 0 ] \
     && printf '%s' "$GLOBAL_OUT" | grep -q 'DEPLOY:' \
     && printf '%s' "$GLOBAL_OUT" | grep -q 'unreadable'; then
    record 0 "7 marker fetch failure deploys (never a match)"
  else
    record 1 "7 marker fetch failure deploys (never a match)" "rc=$GLOBAL_RC out=$GLOBAL_OUT"
  fi
}

case_8_differing_marker_deploys() {
  local marker
  marker="$TMP_ROOT/marker-diff.txt"
  printf 'cccccccccccccccc' > "$marker"
  GUARD_LOCAL_HASH='bbbbbbbbbbbbbbbb'
  GUARD_DEPLOYED_HASH_URL="file://$marker"
  GUARD_SKIP_DEPLOY=1
  run_raw deploy_guard_main
  if [ "$GLOBAL_RC" -eq 0 ] \
     && printf '%s' "$GLOBAL_OUT" | grep -q 'DEPLOY:' \
     && printf '%s' "$GLOBAL_OUT" | grep -q 'hash differs'; then
    record 0 "8 differing marker hash deploys"
  else
    record 1 "8 differing marker hash deploys" "rc=$GLOBAL_RC out=$GLOBAL_OUT"
  fi
}

case_9_no_build_deploy_omits_cname() {
  local marker cmd_line
  marker="$TMP_ROOT/marker-cname.txt"
  printf 'dddddddddddddddd' > "$marker"
  GUARD_LOCAL_HASH='eeeeeeeeeeeeeeee'
  GUARD_DEPLOYED_HASH_URL="file://$marker"
  GUARD_SKIP_DEPLOY=1
  run_raw deploy_guard_main
  cmd_line="$(printf '%s' "$GLOBAL_OUT" | grep 'would run:')"
  if [ "$GLOBAL_RC" -eq 0 ] \
     && printf '%s' "$GLOBAL_OUT" | grep -q 'DEPLOY:' \
     && printf '%s' "$cmd_line" | grep -q 'npm run deploy:nobuild' \
     && ! printf '%s' "$cmd_line" | grep -qi 'cname'; then
    record 0 "9 no-build deploy command omits --cname"
  else
    record 1 "9 no-build deploy command omits --cname" "rc=$GLOBAL_RC out=$GLOBAL_OUT cmd=$cmd_line"
  fi
}

case_1_skip_on_equal_hashes
case_2_deploy_on_differing_hashes
case_3_deploy_on_empty_deployed_side
case_4_deploy_on_malformed_deployed_side
case_5_abort_on_malformed_local_hash
case_6_skip_when_deployed_marker_matches
case_7_network_failure_deploys
case_8_differing_marker_deploys
case_9_no_build_deploy_omits_cname

printf '\nsummary: %d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
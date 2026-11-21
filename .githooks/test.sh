#!/bin/sh
# Self-test for the git hooks. Run: sh .githooks/test.sh
cd "$(dirname "$0")" || exit 1
tmp=$(mktemp)
fails=0

# expect <pass|fail> <commit-msg|check-branch|pre-push> <input>
expect() {
  case "$2" in
    commit-msg) printf '%s\n' "$3" >"$tmp" && sh ./commit-msg "$tmp" 2>/dev/null ;;
    check-branch) sh ./check-branch "$3" 2>/dev/null ;;
    pre-push) printf '%s\n' "$3" | sh ./pre-push 2>/dev/null ;;
  esac
  if [ $? -eq 0 ]; then got=pass; else got=fail; fi
  [ "$got" = "$1" ] || {
    echo "FAIL: $2 '$3' -> expected $1, got $got"
    fails=1
  }
}

expect pass commit-msg 'feat(engine): add generic HexBoard with axial coordinates'
expect pass commit-msg 'fix(hexa-merge): correct slide direction on north-west axis'
expect pass commit-msg 'docs: add extensibility guide'
expect pass commit-msg 'feat(api)!: rename progress endpoint'
expect pass commit-msg 'Merge pull request #4 from team/develop'
expect fail commit-msg 'added the board'
expect fail commit-msg 'feature(engine): add board'
expect fail commit-msg 'feat(Engine): add board'
expect fail commit-msg 'feat(engine): Add board'
expect fail commit-msg 'feat(engine): add board.'
expect fail commit-msg 'feat(engine):add board'
expect fail commit-msg 'feat(engine): agrega validación del tablero'
expect fail commit-msg "feat(engine): $(printf 'a%.0s' $(seq 1 100))"

expect pass check-branch 'feature/hex-board-geometry'
expect pass check-branch 'fix/12-leaderboard-order'
expect fail check-branch 'main'
expect fail check-branch 'develop'
expect fail check-branch 'hex-board'
expect fail check-branch 'feature/Hex_Board'
expect fail check-branch 'feat/hex-board'

expect pass pre-push 'refs/heads/feature/x 1111 refs/heads/feature/x 0000'
expect pass pre-push 'refs/tags/v1.0.0 1111 refs/tags/v1.0.0 0000'
expect pass pre-push '(delete) 0000 refs/heads/Bad_Name 1111'
expect fail pre-push 'refs/heads/feature/x 1111 refs/heads/main 0000'
expect fail pre-push 'refs/heads/develop 1111 refs/heads/develop 0000'

rm -f "$tmp"
[ "$fails" -eq 0 ] && echo "git hooks: ok"
exit "$fails"

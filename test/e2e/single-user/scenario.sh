#!/usr/bin/env bash
# Runs inside the container as `solo`, who has used Claude Code with one account and no profiles.
set -u
HOME_DIR="$HOME"
OLD="$HOME_DIR/.claude"
PROFILE="$HOME_DIR/.claude-profiles/me"
failures=0

pass() { printf '  \033[32mPASS\033[0m %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; failures=$((failures + 1)); }
check() { local name="$1"; shift; if "$@" >/dev/null 2>&1; then pass "$name"; else fail "$name"; fi; }
fingerprint() { (cd "$1" && find . -type f -o -type l | sort | while read -r f; do sha256sum "$f" 2>/dev/null || readlink "$f"; done) | sha256sum; }

echo "== 1. A single-account user's existing setup"
mkdir -p "$OLD/commands" "$OLD/skills/notes" "$OLD/hooks" "$OLD/agents" \
  "$OLD/projects/-home-solo-app" "$OLD/plugins/cache/market/lsp/1.0.0" "$OLD/plugins/marketplaces/market" \
  "$HOME_DIR/.config/fish"
touch "$HOME_DIR/.zshrc"
cat > "$OLD/settings.json" <<'JSON'
{ "theme": "dark", "statusLine": { "type": "command", "command": "~/.claude/statusline.sh" } }
JSON
echo '# My rules' > "$OLD/CLAUDE.md"
echo 'Say hello' > "$OLD/commands/hello.md"
printf -- '---\nname: notes\ndescription: fixture\n---\nTake notes.\n' > "$OLD/skills/notes/SKILL.md"
printf -- '---\nname: helper\ndescription: fixture\n---\nHelp.\n' > "$OLD/agents/helper.md"
echo 'echo hook' > "$OLD/hooks/pre.sh"
echo 'echo status' > "$OLD/statusline.sh"
echo '{"type":"user","message":"hi"}' > "$OLD/projects/-home-solo-app/session.jsonl"
echo '{"display":"earlier prompt"}' > "$OLD/history.jsonl"
echo '{}' > "$OLD/plugins/cache/market/lsp/1.0.0/plugin.json"
cat > "$OLD/plugins/installed_plugins.json" <<JSON
{ "version": 2, "plugins": { "lsp@market": [ { "scope": "user", "installPath": "$OLD/plugins/cache/market/lsp/1.0.0" } ] } }
JSON
cat > "$OLD/plugins/known_marketplaces.json" <<JSON
{ "market": { "source": { "source": "github", "repo": "owner/market" }, "installLocation": "$OLD/plugins/marketplaces/market" } }
JSON
cat > "$HOME_DIR/.claude.json" <<'JSON'
{ "hasCompletedOnboarding": true, "mcpServers": { "fixture-mcp": { "type": "stdio", "command": "true", "args": [] } } }
JSON
check "real Claude Code is installed" bash -c 'claude --version | grep -q "Claude Code"'
check "plain claude sees the user's MCP server before setup" bash -c 'timeout 60 claude mcp get fixture-mcp'

echo "== 2. First setup in a real terminal"
# Claude Code itself writes to ~/.claude while it runs, so take the fingerprint right before setup.
before_dir=$(fingerprint "$OLD")
before_json=$(sha256sum "$HOME_DIR/.claude.json")
if python3 /e2e/drive.py > /tmp/init.log 2>&1; then pass "init finished"; else fail "init finished"; cat /tmp/init.log; fi

echo "== 3. Nothing original changed"
[ "$(fingerprint "$OLD")" = "$before_dir" ] && pass "~/.claude unchanged" || fail "~/.claude unchanged"
[ "$(sha256sum "$HOME_DIR/.claude.json")" = "$before_json" ] && pass "~/.claude.json unchanged" || fail "~/.claude.json unchanged"

echo "== 4. Everything came along into the profile"
for entry in settings.json CLAUDE.md commands/hello.md skills/notes/SKILL.md agents/helper.md hooks/pre.sh \
  projects/-home-solo-app/session.jsonl history.jsonl plugins/cache/market/lsp/1.0.0/plugin.json; do
  check "profile has $entry" cmp -s "$OLD/$entry" "$PROFILE/$entry"
done
check "profile has the MCP server" grep -q fixture-mcp "$PROFILE/.claude.json"
check "plugin indexes point at the profile" grep -q "$PROFILE/plugins/cache" "$PROFILE/plugins/installed_plugins.json"
check "no plugin index points back at ~/.claude" bash -c "! grep -rqs '$OLD/' '$PROFILE/plugins/installed_plugins.json' '$PROFILE/plugins/known_marketplaces.json'"

echo "== 5. Daily use in each shell"
for sh in bash zsh fish; do
  case "$sh" in
    fish) run=(fish -c) ;;
    *) run=("$sh" -ic) ;;
  esac
  check "$sh: claude starts without a picker" bash -c "${run[*]@Q} 'claude --version' </dev/null 2>/dev/null | grep -q 'Claude Code'"
  check "$sh: claude uses the profile" bash -c "${run[*]@Q} 'timeout 60 claude mcp get fixture-mcp' </dev/null"
  check "$sh: cpf lists the profile" bash -c "${run[*]@Q} 'cpf --list' </dev/null 2>&1 | grep -q me"
done
check "bash: command claude still runs the original" bash -ic 'command claude --version | grep -q "Claude Code"' </dev/null
check "IDE-style launch (no shell function) still sees ~/.claude" bash -c 'timeout 60 claude mcp get fixture-mcp'

echo "== 6. A second account later"
check "cpf add work" bash -ic 'cpf add work' </dev/null
check "work starts empty (no MCP from me)" bash -c "! grep -qs fixture-mcp '$HOME_DIR/.claude-profiles/work/.claude.json'"
check "settings are shared with work" cmp -s "$PROFILE/settings.json" "$HOME_DIR/.claude-profiles/work/settings.json"

echo
if [ "$failures" -eq 0 ]; then echo "ALL PASSED"; else echo "$failures FAILED"; fi
exit "$failures"

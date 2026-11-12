#!/bin/bash
# PreToolUse guard: Claude must never read .env files (Shopify credentials,
# SESSION_SECRET). Blocks Read/Grep aimed at a .env path, and any Bash command
# that names one. .env.example / .env.sample / .env.template stay readable.
#
# ".env" only counts as a path token: process.env, context.env, env.d.ts and
# .envrc don't trip it.
set -u

input=$(cat)
tool=$(jq -r '.tool_name // empty' <<<"$input")

is_env_name() { # $1 = a file name (no directories)
  [[ "$1" =~ ^\.env(\..*)?$ ]] && ! [[ "$1" =~ ^\.env\.(example|sample|template)$ ]]
}

# Every ".env..." token in $1 that is not glued to an identifier on its left.
env_tokens() {
  grep -oE '(^|[^A-Za-z0-9_.-])\.env[A-Za-z0-9_.-]*' <<<"$1" | sed -E 's/^[^.]//'
}

block() {
  echo "Blocked by .claude/hooks/block-env-read.sh: '$1' holds secrets and must not be read. Ask the user for the specific non-secret value you need instead." >&2
  exit 2
}

check_text() { # $1 = free text (a command or glob)
  local tok
  while IFS= read -r tok; do
    [[ -n "$tok" ]] && is_env_name "$tok" && block "$tok"
  done < <(env_tokens "$1")
}

case "$tool" in
  Read)
    f=$(jq -r '.tool_input.file_path // empty' <<<"$input")
    [[ -n "$f" ]] && is_env_name "$(basename -- "$f")" && block "$f"
    ;;
  Grep)
    p=$(jq -r '.tool_input.path // empty' <<<"$input")
    [[ -n "$p" ]] && is_env_name "$(basename -- "$p")" && block "$p"
    check_text "$(jq -r '.tool_input.glob // empty' <<<"$input")"
    ;;
  Bash)
    check_text "$(jq -r '.tool_input.command // empty' <<<"$input")"
    ;;
esac
exit 0

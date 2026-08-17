#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
message="${1:-Update site}"
if [[ $# -gt 0 ]]; then
  shift
fi
paths=("$@")

git_cmd=(git -C "$repo")
if [[ -d "$repo/.gitrepo" ]]; then
  git_cmd=(git --git-dir="$repo/.gitrepo" --work-tree="$repo")
fi

cd "$repo"

if [[ -x "$repo/.tools/hugo/hugo" ]]; then
  hugo_bin="$repo/.tools/hugo/hugo"
elif command -v hugo >/dev/null 2>&1; then
  hugo_bin="$(command -v hugo)"
else
  echo "Hugo was not found. Install Hugo or restore .tools/hugo/hugo." >&2
  exit 1
fi

echo "Building Hugo site..."
"$hugo_bin" --gc --minify

echo "Current changes:"
"${git_cmd[@]}" status --short

if [[ ${#paths[@]} -gt 0 ]]; then
  "${git_cmd[@]}" add -- "${paths[@]}"
else
  "${git_cmd[@]}" add -A
fi

"${git_cmd[@]}" reset -q -- \
  public \
  resources/_gen \
  .hugo_build.lock \
  .tools/hugo/cache || true

if "${git_cmd[@]}" diff --cached --quiet; then
  echo "No staged changes to publish."
  exit 0
fi

echo "Staged changes:"
"${git_cmd[@]}" diff --cached --name-status

echo "Committing..."
"${git_cmd[@]}" commit -m "$message"

branch="$("${git_cmd[@]}" branch --show-current)"
if [[ -z "$branch" ]]; then
  echo "Could not detect current branch." >&2
  exit 1
fi

echo "Pushing origin $branch..."
"${git_cmd[@]}" push origin "$branch"

remote="$("${git_cmd[@]}" remote get-url origin || true)"
if [[ "$remote" == git@github.com:*/*.git ]]; then
  path="${remote#git@github.com:}"
  path="${path%.git}"
  echo "Deployment workflow: https://github.com/$path/actions/workflows/hugo.yaml"
elif [[ "$remote" == https://github.com/*/*.git ]]; then
  path="${remote#https://github.com/}"
  path="${path%.git}"
  echo "Deployment workflow: https://github.com/$path/actions/workflows/hugo.yaml"
fi

echo "Push complete. GitHub Pages deployment will run from the workflow."

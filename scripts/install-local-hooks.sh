#!/bin/sh
# Install (or remove) the local commit and pull triggers for this repository.
#
#   sh scripts/install-local-hooks.sh            install
#   sh scripts/install-local-hooks.sh --remove   remove
#
# What the triggers do: after every commit and every pull, they run
# ../folder-inventory.py (the private inventory of the folder that holds this
# repo) in the background, if that script exists. If it does not, they do
# nothing at all. They never block or fail a commit or a pull.
#
# They live in .git/hooks, which git never pushes, so each workstation runs this
# once. Works on macOS, Linux and Windows (GitHub Desktop runs hooks with its
# own shell on Windows).
#
# Run this yourself in a terminal. A Claude session working through the link to
# your computer cannot: git there leaves a .git/index.lock behind, and it is not
# allowed to write inside .git (see project/workstation-setup.md).

set -e
MARK="invisible-ships-local-hook"

HOOKS="$(git rev-parse --git-path hooks)" || {
  echo "Run this from inside the v0-invisibleships repository." >&2; exit 1; }
mkdir -p "$HOOKS"

for name in post-commit post-merge; do
  target="$HOOKS/$name"
  # A hook counts as ours if it carries the marker or calls the inventory
  # script (hooks written by hand before this installer existed).
  if [ -f "$target" ] && ! grep -qE "$MARK|folder-inventory\.py" "$target"; then
    echo "Skipped $name: a different $name hook already exists at $target." >&2
    echo "Merge it by hand, or move it aside and run this again." >&2
    continue
  fi
  if [ "$1" = "--remove" ]; then
    rm -f "$target" && echo "Removed $name"
    continue
  fi
  cat > "$target" <<HOOK
#!/bin/sh
# $MARK — installed by scripts/install-local-hooks.sh
# Refreshes ../folder-inventory.py after every $name. Local only; never pushed.
# Never blocks or fails anything. Remove: sh scripts/install-local-hooks.sh --remove
# Git runs hooks from the repo top level, so the script is one folder up.
SCRIPT="\$PWD/../folder-inventory.py"
[ -f "\$SCRIPT" ] || exit 0
PY="\$(command -v python3 || command -v python || true)"
[ -n "\$PY" ] || exit 0
( "\$PY" "\$SCRIPT" >/dev/null 2>&1 & ) || true
exit 0
HOOK
  chmod +x "$target"
  echo "Installed $name"
done

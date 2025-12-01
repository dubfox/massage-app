#!/bin/bash

# Simple Git update script for massageApp
# Usage:
#   ./git-update.sh "Your commit message"
# If no message is provided, it defaults to "Update project".

set -e

# Change to the directory where this script lives (project root)
cd "$(dirname "$0")"

# Commit message (default if none provided)
MESSAGE=${1:-"Update project"}

echo "Using commit message: \"$MESSAGE\""
echo

# Show current status
git status
echo

# Stage all changes
git add .

# Commit only if there are staged changes
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "$MESSAGE"
fi

echo
echo "Pushing to origin main..."
git push origin main

echo "Done."



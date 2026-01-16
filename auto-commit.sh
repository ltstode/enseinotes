#!/bin/bash

BRANCH=$(git branch --show-current)

git add .

if git diff --cached --quiet; then
  exit 0
fi

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

git commit -m "chore(auto): update @ $TIMESTAMP"
git push origin "$BRANCH"

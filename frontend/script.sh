#!/bin/bash

set -e

REPORT_FILE="knip-report.json"

echo "🔍 Running knip and generating JSON report..."
npx knip --reporter json > "$REPORT_FILE"

# Check for jq
if ! command -v jq &> /dev/null; then
  echo "❌ 'jq' is required but not installed. Install it with 'brew install jq' or 'sudo apt install jq'."
  exit 1
fi

# Delete unused files
echo "🧹 Deleting unused files..."
jq -r '.issues.files[].source' "$REPORT_FILE" | while read -r file; do
  if [ -f "$file" ]; then
    echo "🗑️ $file"
    rm "$file"
  fi
done

# Remove unused dependencies
echo "📦 Removing unused dependencies..."
deps=$(jq -r '.issues.dependencies[].name' "$REPORT_FILE" | xargs)
if [ -n "$deps" ]; then
  npm uninstall $deps
else
  echo "✅ No unused dependencies found."
fi

# Remove unused devDependencies
echo "🧪 Removing unused devDependencies..."
devDeps=$(jq -r '.issues.unlisted[] | select(.dev == true) | .name' "$REPORT_FILE" | xargs)
if [ -n "$devDeps" ]; then
  npm uninstall --save-dev $devDeps
else
  echo "✅ No unused devDependencies found."
fi

echo "✅ Cleanup complete. Run 'git status' and test your app!"

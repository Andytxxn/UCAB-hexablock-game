#!/bin/sh
# One-time GitHub setup. Must be run by a repository ADMIN with the GitHub CLI (gh) logged in:
#   sh scripts/setup-github.sh
# Creates develop (from main), makes it the default branch, and protects main and develop:
# pull request and the "conventions" check required (no approval needed, authors may merge their own
# pull requests), no force pushes, admins included.
set -eu

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)

if ! gh api "repos/$repo/git/ref/heads/develop" >/dev/null 2>&1; then
  sha=$(gh api "repos/$repo/git/ref/heads/main" -q .object.sha)
  gh api "repos/$repo/git/refs" -f ref=refs/heads/develop -f sha="$sha" >/dev/null
  echo "created develop"
fi

gh api -X PATCH "repos/$repo" -f default_branch=develop >/dev/null
echo "default branch: develop"

for branch in main develop; do
  gh api -X PUT "repos/$repo/branches/$branch/protection" --input - >/dev/null <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": ["conventions"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
  echo "protected $branch"
done

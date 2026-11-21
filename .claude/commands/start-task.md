---
description: Start a task on a correctly named branch created from an up-to-date develop
argument-hint: <type> <short description>  (e.g. feature hex board geometry)
---

Start a new task: $ARGUMENTS

1. Run `git status --short`. If there are uncommitted changes other than `docs/ai-usage/prompts/`, stop and ask what to do with them.
2. Build the branch name `<type>/<kebab-case-description>`: type is one of `feature|fix|docs|chore|refactor|test|ci`, the description is short, lowercase English. If the arguments are missing or ambiguous, ask.
3. `git fetch origin`, then `git switch develop` and `git pull --ff-only origin develop`.
4. `git switch -c <branch>`.
5. Report the branch name and stop. Do not start coding until the user says what to build.

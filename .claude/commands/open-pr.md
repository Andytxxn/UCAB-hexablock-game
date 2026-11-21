---
description: Document the AI usage of this branch and open a pull request into develop
---

Open a pull request for the current branch.

1. **Check the branch.** It must not be `main` or `develop`. Run `git status --short`; commit pending work first, in small Conventional Commits.
2. **Run the project checks** listed under "Commands" in `CLAUDE.md` (lint, tests). If they fail, stop and report. If they are still `TBD`, say so in the PR body.
3. **Document AI usage.** Read the entries of `docs/ai-usage/prompts/*.md` whose branch is the current branch. For each significant use (design decisions, generated code, debugging — not trivia), add a numbered entry to `AI_USAGE.md` using its template:
   - Task, tool, prompt (literal, from the log) and result: draft them from the log and the branch diff.
   - **Team modifications** and **Lessons learned**: ask the user. Never invent them.
   - If a tool is missing from the "Tools Used" table, add it.
   Commit as `docs(ai-usage): log <topic>`, including the prompt log files.
4. **Push** with `git push -u origin <branch>`.
5. **Create the PR** with `gh pr create --base develop`. The title is a Conventional Commit subject (CI validates it); the body follows `.github/pull_request_template.md`, filled in.
6. Print the PR URL and stop. Merging is the user's call.

---
description: Document the AI usage of this branch and open a pull request into develop
---

Open a pull request for the current branch.

1. **Check the branch.** It must not be `main` or `develop`. Run `git status --short`; commit pending work first, in small Conventional Commits.
2. **Run the project checks** listed under "Commands" in `CLAUDE.md` (lint, tests). If they fail, stop and report. If they are still `TBD`, say so in the PR body.
3. **Document AI usage.** Read the entries of `docs/ai-usage/prompts/*.md` whose branch is the current branch.
   `AI_USAGE.md` keeps **one entry per main use** (theme), not one per session or PR, so it stays short:
   - If the work continues the theme of an existing entry, **update that entry**: extend its dates and
     branches, and add one line to "Prompts" and one to "Result obtained". Do not add a new entry.
   - Only for a new theme, add a numbered entry using the template in the file.
   - Skip trivia (questions, small fixes): the raw log already records them.
   - Prompt summaries are one faithful line each; the literal text stays in the raw log.
   - **Team modifications**: ask the user. Never invent them.
   - If a tool or model is missing from the "Tools Used" table, add it.
   Commit as `docs(ai-usage): log <topic>`, including the prompt log files.
4. **Push** with `git push -u origin <branch>`.
5. **Create the PR** with `gh pr create --base develop`. The title is a Conventional Commit subject (CI validates it); the body follows `.github/pull_request_template.md`, filled in.
6. Print the PR URL and stop. Merging is the user's call.

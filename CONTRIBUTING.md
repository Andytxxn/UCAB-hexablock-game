# Contributing

How the team works in this repository. The rules below are enforced three times: by local git hooks
(`.githooks/`), by Claude Code hooks (`.claude/`) and by CI (`.github/workflows/conventions.yml`).

## One-time setup

1. Install [Node.js](https://nodejs.org) 18 or newer (the AI prompt log needs it) and the
   [GitHub CLI](https://cli.github.com) (`gh auth login`).
2. Activate the git hooks. Opening Claude Code in the repository does it for you; otherwise run:

   ```sh
   git config core.hooksPath .githooks
   ```

## Branches

```
main  ←  develop  ←  <type>/<kebab-case-description>
```

- `main` holds released versions; `develop` is the integration branch. Both are protected: no direct
  commits or pushes, changes arrive only through pull requests.
- Working branches start from `develop`. Types: `feature`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`.
  Example: `feature/hex-board-geometry`. In Claude Code: `/start-task feature hex board geometry`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org), in English:

```
<type>(<scope>): <description>
```

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- The scope is optional, lowercase kebab-case. The description starts in lowercase, has no final period,
  and the whole subject is at most 100 characters.
- Commit small and often: one logical change per commit.

```
feat(engine): add generic HexBoard with axial coordinates
fix(hexa-merge): correct slide direction on north-west axis
test(engine): add unit tests for GameEngine with fake cell type
```

## Pull requests

1. Push your branch and open a pull request into `develop` (in Claude Code: `/open-pr`).
2. The title is a Conventional Commit subject. Fill in the template checklist.
3. The `conventions` check must pass before merging.
4. `develop` is merged into `main` through a pull request titled `chore(release): <version>`.

## AI usage

All AI usage must be documented.

- **Automatic:** every prompt sent to Claude Code inside this repository is appended, with date, branch and
  session, to `docs/ai-usage/prompts/<your-git-name>.md`. Commit that file together with your work. Obvious
  credentials are masked, but the repository is public: never paste secrets into a prompt.
- **By hand:** prompts sent to any other tool (ChatGPT, Cursor, Copilot…) or from outside the repository
  must be added to your log file yourself.
- **Curated:** before opening a pull request, add an entry to `AI_USAGE.md` for each significant use,
  including what the team changed in the AI output. `/open-pr` drafts it with you.

## Changing the rules

The conventions live in `.githooks/commit-msg` and `.githooks/check-branch`; CI reuses those same files.
After editing them or the Claude Code hooks, run:

```sh
sh .githooks/test.sh && node .claude/hooks/test.mjs
```

A repository admin applies branch protection once with `sh scripts/setup-github.sh`.

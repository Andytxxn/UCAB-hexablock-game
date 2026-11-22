# AI Usage Documentation

**Repository:** UCAB-hexablock-game — HexaBlock Suite mobile client (generic engine + four variants)
**Last updated:** 2026-11-22

This file is the curated record of how AI tools are used in this project.
The raw, automatic prompt logs (one file per team member) live in [`docs/ai-usage/prompts/`](docs/ai-usage/prompts/).

## Tools Used

| Tool | Version / Model | Role in the team workflow |
| --- | --- | --- |
| Claude Code (Anthropic) | Claude Fable 5.2 (`claude-fable-5-2`), Claude Opus 5.5 (`claude-opus-5-5`) | Repository harness setup: git hooks, conventions check in CI, automatic AI prompt logging; first-approach design document; testing rules |

## Usage Log

<!-- One entry per MAIN use of AI (a theme of work such as "agentic harness", "generic engine",
"auth"), not one per session or pull request. When new work continues an existing theme, update that
entry instead of adding a new one: extend the dates and branches, add one line to Prompts and to Result.
Add a new entry only for a new theme. Keep each field short; the raw prompts are in the logs.

### Entry NNN — <theme>

- **Dates:** YYYY-MM-DD → YYYY-MM-DD · **Authors:** <members> · **Branches / PRs:** `<branch>` (#PR), …
- **Task:** <what this use of AI was for>
- **Tool:** <tool and model>
- **Prompts:** <one line per main prompt: date and a faithful one-line summary; literal text in the raw log>
- **Result obtained:** <what the AI produced, one line per prompt above>
- **Team modifications:** <what the team changed in the AI output, and why>
-->

### Entry 001 — Agentic harness and project setup

- **Dates:** 2026-11-21 → 2026-11-22 · **Authors:** Matias Leon · **Branches / PRs:** `chore/project-harness` (#1), `docs/solution-first-approach` (#3), `docs/testing-guidelines` (#4), `chore/condense-ai-usage`
- **Task:** Prepare both repositories so the team can work with Claude Code under shared rules (git conventions, pull requests, testing, AI usage documentation) before any stack is chosen, plus a first design proposal to discuss.
- **Tool:** Claude Code — Claude Fable 5.2, Claude Opus 5.5
- **Prompts** (literal text in [`docs/ai-usage/prompts/matias-leon.md`](docs/ai-usage/prompts/matias-leon.md)):
  - 2026-11-21: review the project statement and two reference repositories, then set up a harness that validates commit, branch and PR names, prevents direct pushes and logs every prompt per member.
  - 2026-11-21: from the team's design notes, write one non-binding "solution first approach" document per repository, clearly labelled as AI-generated.
  - 2026-11-22: add the TDD and testing rules of statement section 3.6 to `CLAUDE.md`, and keep `AI_USAGE.md` short by grouping entries by main use instead of by session.
- **Result obtained:**
  - `.githooks/` (commit-msg, pre-commit, pre-push), `.claude/` (prompt-logging and git guard hooks, `/start-task`, `/open-pr`), `.github/workflows/conventions.yml`, the PR template, `CLAUDE.md`, `CONTRIBUTING.md`, `scripts/setup-github.sh` and this file.
  - [`docs/SOLUTION_FIRST_APPROACH.md`](docs/SOLUTION_FIRST_APPROACH.md): proposed layers, ports, patterns, how to add a fifth variant, open questions. Nothing in it is decided.
  - "Testing (TDD)" section in `CLAUDE.md`; this grouped entry format and the matching `/open-pr` instructions.
- **Team modifications:** _Pending — to be completed by the author after reviewing the generated files._

## Critical Evaluation

_To be completed before the final release._

- **Approximate percentage of code written with AI assistance:**
- **Cases where the AI produced incorrect or suboptimal results, and how they were detected and fixed:**
  - 2026-11-21: the first version of the `commit-msg` hook let an invalid commit through on Windows when the output of git was piped (`git commit ... | head`). The verification run exposed it; fixed in `fix(git): keep hooks failing when their output pipe is closed`.
- **Team reflection on the impact of AI on productivity and code quality:**

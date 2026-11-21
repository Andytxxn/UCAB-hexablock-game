# AI Usage Documentation

**Repository:** UCAB-hexablock-game — HexaBlock Suite mobile client (generic engine + four variants)
**Last updated:** 2026-11-21

This file is the curated record of how AI tools are used in this project.
The raw, automatic prompt logs (one file per team member) live in [`docs/ai-usage/prompts/`](docs/ai-usage/prompts/).

## Tools Used

| Tool | Version / Model | Role in the team workflow |
| --- | --- | --- |
| Claude Code (Anthropic) | Claude Fable 5.2 (`claude-fable-5-2`) | Repository harness setup: git hooks, conventions check in CI, automatic AI prompt logging |

## Usage Log

<!-- Entry template: copy it, number consecutively, newest last.

### Entry NNN — <short title>

- **Date:** YYYY-MM-DD · **Author:** <member> · **Branch / PR:** `<branch>` (#PR)
- **Task:** <task or problem addressed>
- **Tool:** <tool and model>
- **Prompt:** <literal transcription or faithful paraphrase, with a link to the raw log>
- **Result obtained:** <code, design or explanation produced>
- **Team modifications:** <what the team changed in the AI output, and why>
- **Lessons learned / limitations:** <what worked, what did not>
-->

### Entry 001 — Agentic harness and team workflow setup

- **Date:** 2026-11-21 · **Author:** Matias Leon · **Branch / PR:** `chore/project-harness`
- **Task:** Configure both repositories so the team can work with Claude Code under shared rules for git conventions, branches, pull requests and AI usage documentation, before any stack is chosen.
- **Tool:** Claude Code — Claude Fable 5.2
- **Prompt:** Literal transcription in [`docs/ai-usage/prompts/matias-leon.md`](docs/ai-usage/prompts/matias-leon.md) (first entry). In short: review the project requirements and two reference repositories, then set up an agentic harness in each repo that validates commit names, branches and pull requests, prevents direct pushes, and logs every prompt with its date in one file per member.
- **Result obtained:** `.githooks/` (commit-msg, pre-commit, pre-push), `.claude/` (shared settings, prompt-logging hook, git guard hook, `/start-task` and `/open-pr` commands), `.github/workflows/conventions.yml`, the PR template, `CLAUDE.md`, `CONTRIBUTING.md`, `scripts/setup-github.sh` and this file's skeleton.
- **Team modifications:** _Pending — to be completed by the author after reviewing the generated files._
- **Lessons learned / limitations:** _Pending — to be completed by the author._ Known limitations so far: the automatic log only captures Claude Code sessions opened inside the repository; other tools and sessions must be logged by hand. AI error caught during setup: the first version of the `commit-msg` hook let an invalid commit through on Windows when git's output was piped (`git commit ... | head`); the verification run exposed it and it was fixed in `fix(git): keep hooks failing when their output pipe is closed`.

## Critical Evaluation

_To be completed before the final release._

- **Approximate percentage of code written with AI assistance:**
- **Cases where the AI produced incorrect or suboptimal results, and how they were detected and fixed:**
- **Team reflection on the impact of AI on productivity and code quality:**

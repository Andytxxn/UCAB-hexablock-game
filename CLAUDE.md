# HexaBlock Suite — Game (mobile client)

Mobile app of HexaBlock Suite: four hexagonal puzzle
variants (Hexa Lines, Hexa Fit, Hexa Sort, Hexa Merge) built on **one generic game engine**.
The backend lives in the sibling repository `UCAB-hexablock-api`.

## Status

- **Stack: not decided yet.** Do not scaffold a project, add dependencies or pick a language or framework
  until the team records the decision here. If a task needs it, stop and ask.
- Commands (fill in once the stack exists): install `TBD` · lint `TBD` · test `TBD` · run `TBD`

## Engineering rules

- **One engine, not four games.** Board, rendering, persistence and game flow are written once. Each variant
  is an instantiation of the generic engine (`HexBoard<TCell>`, `IGameRules<TCell, TMove, TState>`,
  `GameEngine<TCell, TMove, TState>`, `IPieceSource<TPiece>`, `IScoringPolicy<TState>`), never a copy.
- **No conditionals on the variant type** inside the engine, the use cases or the shared screens. A fifth
  variant must be addable with new classes or configuration only (`docs/EXTENSIBILITY.md`).
- **Clean Architecture**, four layers, dependencies point inward only. The engine and the variant rules live
  in the domain and import nothing from the UI framework, storage or network. Use cases are generic or
  parameterized by variant: never one per game.
- **SOLID and GoF patterns** (Strategy and Abstract Factory are mandatory): each one used must be
  documentable in the README with a real code reference. Bounded generics must be justified there too.
- **AOP without AOP libraries**: decorators or proxies over the generic use cases. No logger calls inside
  business code.
- **Tests**: unit (each variant's rules, plus the engine with a fake cell type), integration, and widget / UI
  tests. AAA structure. Names: `should_[expected_result]_when_[condition]`. Use fakes and a fixed random
  seed. Test behaviour, not implementation details.
- Levels of Hexa Fit (15+) and Hexa Sort (10+) are loaded from configuration files, not hard-coded.
- Code, comments, commits, pull requests and the README are written **in English**. The app itself
  supports Spanish and English.

## Git workflow (enforced by `.githooks/`, CI and branch protection)

- `main` ← `develop` ← working branches. Never commit or push to `main` or `develop`. Never use
  `--no-verify` or `--force`.
- Branches: `<type>/<kebab-case>`, type in `feature|fix|docs|chore|refactor|test|ci`. Start with `/start-task`.
- Commits: Conventional Commits, `type(scope): description` — English, lowercase start, no final period,
  at most 100 characters. Typical scopes: `engine`, `hexa-lines`, `hexa-fit`, `hexa-sort`, `hexa-merge`,
  `ui`, `ci`, `readme`.
- **Small, frequent commits**: one logical change each. Never bundle
  unrelated work and never commit on behalf of another member.
- Finish with `/open-pr`: pull request into `develop`.

## AI usage (must always be documented)

- Every prompt is appended automatically to `docs/ai-usage/prompts/<member>.md`. Never edit or delete
  entries there, and stage that file with every commit.
- Significant uses get a curated entry in `AI_USAGE.md` (`/open-pr` drafts them). "Team modifications" and
  "Lessons learned" come from the human: ask, never invent.
- Architecture, generics, patterns and principles are **team decisions**: lay out options and trade-offs,
  do not decide silently. Every team member must be able to explain any line of the codebase, especially the
  generic types and the split of responsibilities between the engine and the variants.
- Generated code ships with tests. Cite non-trivial algorithms or external sources in a comment.
- Never put credentials, API keys or user data in prompts, code or logs.

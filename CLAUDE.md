# HexaBlock Suite — Game (mobile client)

Mobile app of HexaBlock Suite: four hexagonal puzzle
variants (Hexa Lines, Hexa Fit, Hexa Sort, Hexa Merge) built on **one generic game engine**.
The backend lives in the sibling repository `UCAB-hexablock-api`.

## Status

- **Stack (decided 2026-11-22):** TypeScript (strict), React Native + Expo SDK 58, expo-sqlite + Drizzle ORM,
  expo-router, react-native-svg, gesture-handler + reanimated, i18next, expo-audio, zod, Jest. Node.js 24.20, npm only.
- The engine and the use cases stay framework-free: no imports from React Native, Expo or Drizzle there.
- Commands: install `npm ci` · lint `TBD` · test `TBD` · run `TBD`

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
- **Tests**: TDD, see "Testing" below.
- Levels of Hexa Fit (15+) and Hexa Sort (10+) are loaded from configuration files, not hard-coded.
- Code, comments, commits, pull requests and the README are written **in English**. The app itself
  supports Spanish and English.

## Testing (TDD, statement section 3.6)

- **TDD is mandatory.** Red → green → refactor: write a failing test that states the expected behaviour, run
  it and see it fail for the right reason, write the minimum code to pass, then refactor with the suite green.
  No production code without a test that required it. Bug fixes start with a test that reproduces the bug.
- **AAA** in every test: `// Arrange`, `// Act`, `// Assert` blocks, one action per test.
- **Names**: `should_[expected_result]_when_[condition]`, e.g.
  `should_clear_three_lines_when_piece_completes_all_axes`.
- **Behaviour, not implementation.** Assert on outputs, returned state, persisted data, HTTP responses or what
  the user sees, through the public API of the unit. Do not assert on private methods, internal fields, call
  order or how many times a collaborator was called, unless that interaction *is* the behaviour (e.g. a
  cache decorator must not hit the repository twice). A refactor that keeps behaviour must not break tests.
- **Test doubles only at the boundaries** (ports: repositories, network, clock, random generator with a fixed
  seed). Prefer hand-written fakes over mocking libraries; never mock the unit under test or value objects.
- Tests are deterministic and independent: no real network, no shared mutable state, no order dependence.
- All suites run in CI on every pull request; a red suite blocks the merge.

Required suites:

- **Unit**: each variant's rules on their own (line clearing on the 3 axes, exact figure coverage, transfer
  cascade, merge on collision), every use case and service, and the **generic engine with a fake cell type**
  (test double), proving the engine depends on no concrete variant.
- **Integration**: use cases with real repositories on in-memory storage; save and restore progress end to end
  for each variant.
- **Widget / UI**: components render and respond to user interaction; navigation between screens (home,
  game selection, level selection, match, victory, defeat). Find widgets by key, text or semantics, not by
  widget-tree structure.
- **Contract**: consumer tests (Pact or equivalent, https://docs.pact.io/) for every API call the app makes;
  the generated contract is what `UCAB-hexablock-api` verifies.

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
- `AI_USAGE.md` holds **one entry per main use** (a theme such as "agentic harness" or "generic engine"),
  not one per session or PR. Continuing a theme updates its entry (dates, branches, one line in Prompts and
  Result); only a new theme adds an entry. `/open-pr` drafts it. "Team modifications" come from the human:
  ask, never invent.
- Architecture, generics, patterns and principles are **team decisions**: lay out options and trade-offs,
  do not decide silently. Every team member must be able to explain any line of the codebase, especially the
  generic types and the split of responsibilities between the engine and the variants.
- Generated code ships with tests. Cite non-trivial algorithms or external sources in a comment.
- Never put credentials, API keys or user data in prompts, code or logs.

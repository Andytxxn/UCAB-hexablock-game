# Solution first approach — game (mobile client)

> **Read this first.**
>
> - **This is not the architecture of the project.** It is not even a first version of it. It is a first
>   approach: one possible way to lay out a solution, written down so the team has something concrete to
>   look at, discuss and take apart.
> - **It was generated with AI** (Claude Code, Claude Fable 5.2, on 2026-11-21) from the project requirements
>   and the team's early design notes. Its purpose is to visualise ideas, not to make decisions.
> - **Nothing here is decided.** Architecture, generics, patterns and principles are team decisions. Every
>   choice below is a proposal, and section 13 lists the ones that most need a human answer.
> - **It has not been validated with code.** No stack is chosen yet, so nothing was compiled. Expect contracts
>   to change as soon as they are implemented.
> - The pseudocode is language-neutral. Names are suggestions.
>
> The sibling document for the backend is `docs/SOLUTION_FIRST_APPROACH.md` in `UCAB-hexablock-api`.

## 1. Ideas the approach rests on

- **Rules know the game and keep nothing.** They receive a state and a move, and return a new state plus
  what happened.
- **The engine keeps the match and does not know which game it is.** Current state, score, lifecycle and
  notifications.
- **The domain does not draw.** It hands out state and events; the presentation turns them into something
  drawable.
- **Generics are closed in one place.** Each variant is registered as an already-typed module; nobody
  outside it casts.
- **A piece exists only if something uses it.** Every interface has at least one consumer in the design.

The short version of the two central pieces:

| Piece | Answers | Holds state? | Knows the variant? |
|---|---|---|---|
| `IGameRules` | "What is this game?" Is a move valid, what does it do, is the match over | No | Yes, it *is* the variant |
| `GameEngine` | "What is happening in this match?" Current state, score, paused or not, who to notify | Yes | No |

## 2. Layers

```
4. Frameworks    screens, BoardRenderer, local database, HTTP client, audio, CompositionRoot
        │ depends on
3. Adapters      VariantModule, ViewModel, presenters, gesture mappers, repositories, level parsers, API client
        │ depends on
2. Application   GameSession, use cases, ports, AOP decorators
        │ depends on
1. Domain        engine, rules, states, moves, events, geometry, board, pieces, variant factories, levels, progress
```

Dependencies point inward only. The domain imports nothing from the UI framework, storage or network.

A possible folder layout, to be adapted to the stack:

```
src/
  domain/
    engine/        GameEngine, IGameRules, BaseGameRules, GameState, TurnResult, lifecycle, undo, events
    hex/           HexCoord, HexGeometry, HexBoard, IBoardShape, Piece
    variants/      lines/  fit/  sort/  merge/     (rules, state, move, scoring, factory, domain service)
    levels/        LevelDefinition, FitLevel, SortLevel, builders
    progress/      PlayerProgress, LevelRecord, IProgressModel
  application/     GameSession, use-cases/, ports/, aspects/
  adapters/        variants/ (module, presenter, gesture mapper, state mapper), viewmodel/, repositories/, api/
  framework/       screens/, rendering/, storage/, audio/, composition-root
```

## 3. Layer 1: domain

### 3.1 Engine contracts

```
interface IMove { }                       // marker: bounds TMove

abstract class GameState<TCell> {
  board: HexBoard<TCell>
  turn: int                               // accepted moves so far
  copy(): GameState<TCell>                // Prototype: basis for undo and for "apply on a copy"
}

interface IGameRules<TCell, TMove extends IMove, TState extends GameState<TCell>> {
  isValid(s: TState, m: TMove): bool
  validMoves(s: TState): Iterable<TMove>
  playTurn(s: TState, m: TMove): TurnResult<TState>
  status(s: TState): GameStatus           // playing | won | lost
}

class TurnResult<TState> {
  accepted: bool                          // false = move rejected, state unchanged
  newState: TState
  events: List<GameEvent>                 // in the order they happened
  status: GameStatus
}

interface IScoringPolicy<TState> {
  points(before: TState, after: TState, events: List<GameEvent>): int
  finalScore(end: TState, points: int, elapsed: Duration): FinalScore   // score + stars?
}

interface IPieceSource<TPiece> {
  next(): TPiece
  peek(n: int): List<TPiece>
  hasNext(): bool
}

interface IRandom { nextInt(max: int): int }
```

How they are meant to be used:

- Rules never modify the state they receive: they work on `copy()`.
- The score is not part of the rules' state. The engine holds it, so a scoring policy can be swapped
  without touching rules or states.
- `finalScore` exists because Hexa Fit scores at the end (stars by moves and time). The other three
  variants would use a base class that returns the accumulated points with no stars.
- `IRandom` is declared in the domain because rules and piece sources need it; the seeded implementation
  lives outside.

### 3.2 GameEngine

```
class GameEngine<TCell, TMove extends IMove, TState extends GameState<TCell>> {
  - state: TState
  - score: int
  - lifecycle: ILifecycleState<TCell, TMove, TState>
  - rules: IGameRules<TCell, TMove, TState>
  - scoring: IScoringPolicy<TState>
  - bus: GameEventBus

  + start(): void
  + submitMove(m: TMove): TurnResult<TState>
  + pause(): void
  + resume(): void
  + snapshot(): Snapshot<TState>          // state + score
  + restore(s: Snapshot<TState>): void    // recomputes the lifecycle from rules.status()
  + finalScore(elapsed: Duration): FinalScore
  + state, score, status                  // read-only
}
```

The engine has no conditional on the variant and does not know `IPieceSource`.

### 3.3 One full turn

`BaseGameRules.playTurn()` is a Template Method. It is final and fixes the order:

1. **Validate.** If `isValid` is false, return a rejected `TurnResult`.
2. **Apply.** Write the move on a copy of the state.
3. **Resolve.** Run the variant's own rule: clear lines, cascade, merge, or nothing in Fit.
4. **Replenish.** Ask the piece source if needed (new tray in Lines, new tile in Merge). Does nothing by default.
5. **Evaluate.** Compute `status` of the final state.

Each subclass fills in only those steps:

```
abstract class BaseGameRules<TCell, TMove, TState> implements IGameRules<TCell, TMove, TState> {
  + playTurn(s, m): TurnResult<TState>                       // final
  # apply(s: TState, m: TMove, events: List<GameEvent>): TState
  # resolve(s: TState, events: List<GameEvent>): TState
  # replenish(s: TState, events: List<GameEvent>): TState    // returns s by default
}
```

`GameEngine.submitMove()` does what surrounds the turn:

1. Delegate to the lifecycle state. If it is not `PlayingState`, return rejected.
2. Call `rules.playTurn(state, move)`.
3. If accepted, add `scoring.points(...)` to the score and keep the new state.
4. Publish the events on the bus.
5. If `status` is no longer `playing`, change the lifecycle and publish `GameOver` or `Victory`.

### 3.4 Lifecycle (State)

Four states: `PlayingState`, `PausedState`, `GameOverState` and `VictoryState`.

```
interface ILifecycleState<TCell, TMove extends IMove, TState extends GameState<TCell>> {
  onMove(e: GameEngine<TCell, TMove, TState>, m: TMove): TurnResult<TState>
  pause(e): void
  resume(e): void
}
```

Menus are navigation between screens, and "resolving" is animation time. Neither is a domain state here:
the domain resolves instantly, and blocking input while animating is the ViewModel's job (section 5.3).

### 3.5 Undo (Command)

```
class MoveCommand<TCell, TMove extends IMove, TState extends GameState<TCell>> {
  - move: TMove
  - engine: GameEngine<TCell, TMove, TState>
  - before: Snapshot<TState>
  - after: Snapshot<TState>
  + execute(): TurnResult<TState>     // stores before, calls submitMove, stores after
  + undo(): void                      // engine.restore(before)
  + redo(): void                      // engine.restore(after)
}

class CommandHistory<TCell, TMove, TState> implements IUndoable {
  - done, undone: Stack<MoveCommand<...>>
  - limit: int
  + run(c: MoveCommand<...>): TurnResult<TState>
}

interface IUndoable {                 // non-generic view for the use case and the button
  undo(): void
  redo(): void
  canUndo(): bool
  canRedo(): bool
}
```

- Redo restores the "after" snapshot instead of running the move again, so it does not depend on the
  random generator.
- Each factory declares its `undoLimit`: unlimited in Fit, 1 in Merge, 0 in Lines and Sort. With 0 the
  session has no history and the screen shows no button.

### 3.6 Events (Observer)

`GameEventBus` and `IGameEventListener`. The bus is a single instance injected into the engine, so audio
and analytics subscribe once at startup.

Every event carries the coordinates needed to animate it:

| Event | Data |
|---|---|
| `PiecePlaced` | `cells` |
| `LinesCleared` | `cells`, `lines`, `combo` |
| `StackPlaced` | `at` |
| `StackTransferred` | `from`, `to`, `color`, `count` |
| `StackCompleted` | `at`, `color` |
| `TileMoved` | `from`, `to` |
| `TilesMerged` | `from`, `into`, `value` |
| `TileSpawned` | `at`, `value` |
| `GameOver`, `Victory` | none |

### 3.7 Geometry, board and pieces

- **`HexCoord(q, r)`**: value object. Data, equality and addition only.
- **`HexGeometry`**: all hexagonal maths as pure functions: `neighbor`, `neighbors`, `rotate`, `distance`,
  `line`, `ring`.
- **`HexDirection`** (6 directions) and **`Axis`** (3 axes).
- **`IBoardShape`**: `contains(c)` and `allCoords()`. Implementations: `HexagonShape(radius)` and
  `FigureShape(cells)`.
- **`HexBoard<TCell>`**: map from `HexCoord` to `TCell`. Uses `HexGeometry` and filters by its shape.

```
class HexBoard<TCell> {
  + get(c): TCell?
  + set(c, v: TCell?): void
  + isEmpty(c): bool
  + coords(): Iterable<HexCoord>
  + neighbors(c): Iterable<HexCoord>
  + lines(axis: Axis): Iterable<List<HexCoord>>
  + copy(): HexBoard<TCell>
}
```

- **Iterator**: traversals return the language's own iterable. No custom iterator classes.
- **`Piece<TCell>`**: list of offsets from an anchor, plus the content written into each cell (`Color` in
  Lines, `PieceId` in Fit). Immutable; `rotated(steps)` returns another piece.
- **`PlacementValidator`**: shared by Lines and Fit.

### 3.8 Variant factory (Abstract Factory)

```
interface IGameVariantFactory<TCell, TMove extends IMove, TState extends GameState<TCell>> {
  gameId: GameId
  undoLimit: int
  createShape(level: LevelDefinition?): IBoardShape
  createRules(level: LevelDefinition?, random: IRandom): IGameRules<TCell, TMove, TState>
  createScoring(level: LevelDefinition?): IScoringPolicy<TState>
  createInitialState(level: LevelDefinition?, random: IRandom): TState
  createProgressModel(): IProgressModel
}

abstract class BaseVariantFactory<...> implements IGameVariantFactory<...> {
  + createEngine(level, random, bus): GameEngine<TCell, TMove, TState>   // Factory Method
}
```

The piece source is created by each concrete factory and handed to its rules. It is not in the interface
because its piece type differs per variant and the engine never uses it.

### 3.9 The four variants

| | Hexa Lines | Hexa Fit | Hexa Sort | Hexa Merge |
|---|---|---|---|---|
| `TCell` | `Color` | `PieceId` | `ColorStack` | `NumberTile` |
| `TMove` | `PlacePieceMove` | `FitMove` (place, remove, rotate) | `PlaceStackMove` | `SlideMove` |
| `TState` | `LinesState` | `FitState` | `SortState` | `MergeState` |
| Rules | `HexaLinesRules` | `HexaFitRules` | `HexaSortRules` | `HexaMergeRules<T>` |
| Domain service | `LineDetector` | `CoverageValidator` | `CascadeResolver` | `SlideResolver` |
| Piece source | Seeded random | Fixed list from the level | Seeded random | Random (2 or 4) |
| "Replenish" step | New tray once the 3 are used | Nothing | Next stack | New tile |
| Scoring | `LinesScoring` | `StarsScoring` | `SortScoring` | `MergeScoring` |
| Progress | `HighScoreProgress` | `LevelStarsProgress` | `LevelProgress` | `HighScoreProgress` |
| Shape | `HexagonShape(4)` | `FigureShape` from the level | `HexagonShape(2)` | `HexagonShape(2)` |
| `undoLimit` | 0 | Unlimited | 0 | 1 |

No state stores `status` or `score`. `FitState` stores neither elapsed time nor a move counter: moves are
`turn`, and time arrives in `finalScore`.

### 3.10 Levels (Builder)

- `LevelDefinition` (abstract): `id`, `gameId`, `number`, `difficulty`.
- `FitLevel`: `figure` (set of cells), `pieces`, `starThresholds`.
- `SortLevel`: `goalTarget`, `colors`, `seed`.

Each type has its own builder with its own steps. No common interface and no director, because nothing
treats them polymorphically:

```
FitLevelBuilder:  figure(cells) · addPiece(p) · stars(thresholds) · build()
SortLevelBuilder: goals(n) · colors(list) · seed(s) · build()
```

`build()` checks the invariant before returning. In Fit: the area of the pieces equals the area of the figure.

### 3.11 Progress

- `PlayerProgress` (aggregate root) and `LevelRecord`. Invariants: levels unlock in order and stars never
  go down.
- `merge(other: PlayerProgress): PlayerProgress` takes the maximum of each field. It is the conflict rule
  for syncing, and the backend applies the same one.
- `IProgressModel.record(progress, result: GameResult): void`, with three implementations: high score,
  levels, and levels with stars.

## 4. Layer 2: application

### 4.1 GameSession

```
class GameSession<TCell, TMove extends IMove, TState extends GameState<TCell>> {
  gameId: GameId
  level: LevelDefinition?
  engine: GameEngine<TCell, TMove, TState>
  history: CommandHistory<TCell, TMove, TState>?     // null when undoLimit is 0
  progressModel: IProgressModel
}
```

Everything that lives exactly one match. Use cases keep nothing between calls.

### 4.2 Use cases

All implement `IUseCase<TIn, TOut>` with a single `execute()`. None is duplicated per game.

| Use case | Input | Output | Generic |
|---|---|---|---|
| `StartGameUseCase` | optional level, optional seed | `GameSession` | Yes |
| `ApplyMoveUseCase` | session, move | `TurnResult` | Yes |
| `UndoMoveUseCase`, `RedoMoveUseCase` | `IUndoable` | nothing | No |
| `SaveProgressUseCase` | session, duration | `GameResult` | Yes |
| `GetLevelsUseCase` | `gameId` | levels with their unlock state | No |
| `SyncProgressUseCase` | `gameId` | nothing | No |
| `GetLeaderboardUseCase` | `gameId`, optional level | ranking entries | No |
| `LoginUseCase`, `RegisterUseCase` | credentials | user session | No |

- `ApplyMoveUseCase` uses the session's history if there is one; otherwise it calls the engine directly.
- `SaveProgressUseCase` asks for `engine.finalScore(elapsed)`, applies the `IProgressModel` and saves through
  `IProgressRepository`.
- `SyncProgressUseCase` loads local and remote, joins them with `PlayerProgress.merge()` and saves to both.

### 4.3 Ports

`IProgressRepository`, `ILevelRepository`, `ILeaderboardGateway`, `IAuthGateway`, `IAuthSession`,
`IAudioService`, `IClock` and `ILogger`.

### 4.4 AOP

`UseCaseDecorator` implements `IUseCase` and wraps another `IUseCase`. No AOP library; no logger calls
inside business code.

- **`LoggingDecorator`**: input, output and duration of any use case.
- **`AuthorizationDecorator`**: requires a user session for `SyncProgress` and `GetLeaderboard`.

Others (profiling, retries, cache) are one new class and one line in the `CompositionRoot` if they turn
out to be needed.

## 5. Layer 3: adapters

### 5.1 VariantModule: where generics are closed

The registry keeps variants with different types in one map, so what it stores has to be a non-generic
interface:

```
interface IVariantModule {
  gameId: GameId
  levelParser: ILevelParser?                           // null when the variant has no levels
  createViewModel(level: LevelDefinition?): IGameViewModel
}

class VariantModule<TCell, TMove extends IMove, TState extends GameState<TCell>>
    implements IVariantModule {
  factory:   IGameVariantFactory<TCell, TMove, TState>
  presenter: IStatePresenter<TState>
  gestures:  IGestureMapper<TMove, TState>
  mapper:    IStateMapper<TState>
}

class VariantRegistry {
  register(m: IVariantModule): void
  get(id: GameId): IVariantModule
}
```

`createViewModel()` runs inside the generic class, where the three types are known. Use cases and the
ViewModel are instantiated there, already typed. The caller receives a non-generic `IGameViewModel`, and
nobody casts.

### 5.2 What the screen receives

The screen does not know `TCell`. It receives an already-translated description:

```
class GameView {
  cells: Map<HexCoord, CellVisual?>     // every coordinate of the board; null = empty
  tray: List<TrayItemView>              // pieces or stacks on offer
  score: int
  status: GameStatus
  hud: Map<String, String>              // goals, target tile, etc.
}

class CellVisual {
  layers: List<ColorToken>              // 1 layer = plain cell; N layers = stack
  label: String?                        // number in Merge
}

class TrayItemView { cells: Map<HexCoord, CellVisual> }   // a piece is a mini-board
```

And it sends back gestures, not moves:

```
Gesture = Tap(coord) | Drop(trayIndex, coord) | Swipe(direction) | RotateTray(trayIndex)
```

Each variant contributes two translators:

```
interface IStatePresenter<TState> {
  toView(s: TState, score: int, status: GameStatus): GameView
}

interface IGestureMapper<TMove extends IMove, TState> {
  toMove(g: Gesture, s: TState): TMove?            // null = the gesture means nothing here
  footprint(g: Gesture, s: TState): List<HexCoord> // cells it would occupy, for the ghost preview
}
```

| Variant | Presenter: `TCell` to `CellVisual` | Gestures it understands |
|---|---|---|
| Lines | 1 layer with the color | `Drop` |
| Fit | 1 layer with the piece's color | `Drop`, `Tap` (remove), `RotateTray` |
| Sort | 1 layer per token in the stack | `Drop` or `Tap` |
| Merge | 1 layer by value, plus a label | `Swipe` |

`HexLayout` holds the conversion between `HexCoord` and pixels in both directions. Pure maths, no
framework, testable on its own.

### 5.3 GameViewModel

```
interface IGameViewModel {
  view: GameView                        // observable
  pendingEvents: List<GameEvent>        // what the screen must animate
  canUndo: bool
  onGesture(g: Gesture): void
  preview(g: Gesture): Preview          // cells + valid or not
  animationsDone(): void
  undo(): void
  redo(): void
  pause(): void
  resume(): void
}

class GameViewModel<TCell, TMove extends IMove, TState extends GameState<TCell>>
    implements IGameViewModel
```

- One class for the four variants.
- Holds the `GameSession` and the timer.
- `onGesture` translates with `IGestureMapper`, calls `ApplyMoveUseCase` and leaves the events of the
  `TurnResult` in `pendingEvents`.
- While `pendingEvents` is not empty, it ignores gestures.
- `preview` uses `footprint` and `rules.isValid`, without modifying anything.
- When the match ends it calls `SaveProgressUseCase` with the duration.

### 5.4 Other adapters

- `LocalProgressRepository` and `RemoteProgressRepository`: implement `IProgressRepository`.
- `LevelRepositoryImpl`: reads the common part of a level and delegates the specific section to the
  `ILevelParser` of that `gameId`'s module.
- `FitLevelParser` and `SortLevelParser`: JSON to level, through their builder.
- `IStateMapper<TState>` and its four implementations: state to DTO and back.
- `ApiClient`, `LeaderboardGateway`, `AuthGateway`.
- `AudioListener`: bus listener that uses `IAudioService`.
- `SeededRandom` and `SystemClock`.

## 6. Layer 4: frameworks

- `GameScreen` and `BoardRenderer`: one game screen. It draws a `GameView`, emits `Gesture` and animates
  `pendingEvents`. An event it does not know is skipped without animation.
- Home, game selection, level selection, victory and defeat screens.
- Local database, HTTP client and audio plugin (`AudioManager`, single instance by injection).
- `CompositionRoot`: creates the bus, the repositories and the aspects, and registers one `VariantModule`
  per variant. It is the only place that knows all four.

## 7. What the app expects from the API

The app works offline; the API adds accounts, sync and rankings. The contract is described in the backend's
own first-approach document.

| Adapter here | Port | Backend endpoint |
|---|---|---|
| `AuthGateway` | `IAuthGateway` | `POST /auth/register`, `POST /auth/login` |
| `RemoteProgressRepository` | `IProgressRepository` | `GET` and `PUT /games/{gameId}/progress` |
| `LeaderboardGateway` | `ILeaderboardGateway` | `GET /games/{gameId}/leaderboard` |
| `LevelRepositoryImpl` | `ILevelRepository` | `GET /games/{gameId}/levels` (on top of the bundled level files) |

Three things have to match on both sides: the `gameId` values, the level JSON schema, and the progress
merge rule.

## 8. Patterns

Candidates, each with the code that would actually use it:

| Pattern | Category | Where | Used by |
|---|---|---|---|
| Strategy | Behavioural | `IGameRules`, `IScoringPolicy`, `IPieceSource`, `IProgressModel`, `IStatePresenter`, `IGestureMapper` | Engine, rules, session and ViewModel |
| Abstract Factory | Creational | `IGameVariantFactory` and the four factories | `StartGameUseCase` |
| Factory Method | Creational | `BaseVariantFactory.createEngine()` | `StartGameUseCase` |
| Builder | Creational | `FitLevelBuilder`, `SortLevelBuilder` | Level parsers |
| Prototype | Creational | `GameState.copy()`, `HexBoard.copy()` | Rules and `snapshot()` |
| Singleton by injection | Creational | `AudioManager`, `GameEventBus` | `CompositionRoot` |
| Decorator | Structural | `UseCaseDecorator` and the aspects | `CompositionRoot` |
| Adapter | Structural | Repositories, `ApiClient`, audio adapter | Use cases |
| Template Method | Behavioural | `BaseGameRules.playTurn()` | Engine |
| Observer | Behavioural | `GameEventBus`, `IGameEventListener` | Audio and analytics |
| Command | Behavioural | `MoveCommand`, `CommandHistory` | `ApplyMove`, `UndoMove`, `RedoMove` |
| State | Behavioural | `ILifecycleState` and its four states | Engine |
| Iterator | Behavioural | `HexBoard` traversals | Rules and domain services |

That is 13: 5 creational, 2 structural, 6 behavioural.

Considered and left out of this approach, because no code would need them:

| Piece | Why it was left out |
|---|---|
| Visitor over shapes (area, cell collection) | Computing an area is counting cells |
| Composite for pieces and regions | A piece and a figure are sets of cells |
| A facade over audio, persistence and network | The use cases already are the simple entry point |
| Decorators over the rules (timer, bonus multiplier) | Time does not live in the rules, and a rules decorator cannot reach the score |
| A level director and a common builder interface | Each parser calls its own builder directly |
| `MenuState`, `ResolvingState` | Navigation and animation, not domain |

If more patterns are wanted, the cheapest honest additions would be, in order: a Decorator over
`IScoringPolicy` (a bonus multiplier that wraps another policy), a Composite where `Piece` is made of leaf
cells, and a Facade over the audio subsystem.

## 9. SOLID

| Principle | Example |
|---|---|
| SRP | `HexGeometry` has the maths, `HexBoard` the content, `CascadeResolver` the algorithm and `HexaSortRules` the order of the turn |
| OCP | A new variant is new classes and one `register()`. `GameEngine`, `GameViewModel` and `GameScreen` are not modified |
| LSP | The engine takes any `IGameRules` and the ViewModel any `IStatePresenter`, without asking which one |
| ISP | `UndoMoveUseCase` depends on `IUndoable`, not on `CommandHistory`. Ports are split by use |
| DIP | `SaveProgressUseCase` depends on `IProgressRepository`. Rules depend on `IRandom`, not on a concrete generator |

## 10. Type constraints

| Constraint | Why |
|---|---|
| `TMove extends IMove` | Stops the engine from being instantiated with something that is not a move, and lets `MoveCommand` hold any of them |
| `TState extends GameState<TCell>` | The engine and `snapshot()` need `copy()` and `board` |
| `HexaMergeRules<T extends IMergeable<T>>` | Merging needs `canMergeWith`, `mergeWith` and `value`. `NumberTile` wraps the integer because a primitive cannot implement the interface |

## 11. Adding a fifth variant

Worked example with a hypothetical "Hexa Fill". This is the seed for `docs/EXTENSIBILITY.md`.

**Layer 1, new classes:** `FillCell`, `PaintMove`, `FillState`; `HexaFillRules` (extends `BaseGameRules`);
`FillScoring`; `HexaFillFactory`; a domain service and its own events if needed.

**Layer 3, new classes:** `FillPresenter`, `FillGestureMapper`, `FillStateMapper`; and, if it has levels,
`FillLevel`, `FillLevelBuilder` and `FillLevelParser`.

**Changes to existing code:** one `registry.register(VariantModule(...))` call in the `CompositionRoot`,
the variant's texts in the language files, and one row in the backend's `games` table.

**Not touched:** `GameEngine`, `BaseGameRules`, `HexBoard`, `HexGeometry`, the use cases, the aspects,
`GameViewModel`, `GameScreen`, `BoardRenderer`, the repositories and the database schema.

**Known limit:** if the new cell cannot be expressed as color layers plus a label, `CellVisual` and
`BoardRenderer` have to grow. If it needs a gesture that does not exist, `Gesture` has to grow.

Small changes and where they would land:

| Change | Where |
|---|---|
| Another board size | `HexagonShape(radius)` in the factory |
| Another scoring policy | New `IScoringPolicy` class, returned by the factory |
| Another piece shape | Another list of offsets in the piece catalogue |

## 12. Testing

- **Engine with a fake cell type:** `GameEngine<String, FakeMove, FakeState>` with `FakeRules`. Shows the
  engine depends on no variant.
- **Rules:** input state, move, expected state and events. With a fixed-value `IRandom`.
- **Presenters and gesture mappers:** state to `GameView` and gesture to move, without the UI framework.
- **Use cases:** with in-memory repositories.
- **Widget / UI:** `GameScreen` fed with a hand-built `GameView`.

## 13. Open questions for the team

These are the places where this approach took a side. Each one needs a team decision.

| Question | What this approach assumes | Alternative and its cost |
|---|---|---|
| Where does the score live? | In the engine, outside the rules' state | Inside `GameState`: simpler snapshots, but changing scoring touches states |
| Is the screen generic? | No: one `GameScreen` fed by a non-generic `GameView` | One screen per variant: no `CellVisual` limit, but four screens to maintain |
| How does a factory get its concrete level type? | It narrows `LevelDefinition` to `FitLevel` / `SortLevel` inside the variant's own factory | A fourth type parameter `TLevel` on the factory and the module: no narrowing, more generics everywhere |
| How does redo work? | Restores a stored snapshot | Re-executes the move: less memory, but breaks when the variant uses randomness |
| How many patterns? | Only the 13 that have a consumer | Add the three in section 8 if a higher count is wanted |
| Is a match in progress saved? | Not decided. If not, `IStateMapper` is only used by logging | Saving it needs the mapper for all four states and a storage port |
| Which stack? | None. Nothing here depends on it, but the language must support bounded generics | — |

Still to do once the team has reviewed this: choose the stack, redo the class and layer diagrams, and
replace this file with the real architecture documentation.

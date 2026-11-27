/**
 * @jest-environment node
 */
import { findDependencyViolations, readSourceFiles, SRC_DIR } from './dependency-rule';
import { join } from 'node:path';

const file = (path: string, source: string) => ({ path: join(SRC_DIR, path), source });

describe('dependency rule (Clean Architecture)', () => {
  it('should_report_violation_when_domain_imports_application', () => {
    // Arrange
    const files = [
      file(
        'domain/engine/game-engine.ts',
        "import { StartMatch } from '@/application/use-cases/start-match';",
      ),
    ];

    // Act
    const violations = findDependencyViolations(files);

    // Assert
    expect(violations).toHaveLength(1);
  });

  it('should_report_violation_when_application_imports_infrastructure_relatively', () => {
    // Arrange
    const files = [
      file(
        'application/use-cases/save-progress.ts',
        "import {\n  SqliteRepo,\n} from '../../infrastructure/persistence/sqlite-repo';",
      ),
    ];

    // Act
    const violations = findDependencyViolations(files);

    // Assert
    expect(violations).toHaveLength(1);
  });

  it('should_report_violation_when_domain_imports_a_framework', () => {
    // Arrange
    const files = [file('domain/engine/hex-board.ts', "import { View } from 'react-native';")];

    // Act
    const violations = findDependencyViolations(files);

    // Assert
    expect(violations).toHaveLength(1);
  });

  it('should_report_violation_when_application_requires_drizzle', () => {
    // Arrange
    const files = [
      file('application/ports/out/progress-repository.ts', "const orm = require('drizzle-orm');"),
    ];

    // Act
    const violations = findDependencyViolations(files);

    // Assert
    expect(violations).toHaveLength(1);
  });

  it('should_accept_imports_when_they_point_inward', () => {
    // Arrange
    const files = [
      file(
        'application/use-cases/play-move.ts',
        "import type { GameEngine } from '@/domain/engine/game-engine';",
      ),
      file(
        'presentation/screens/match.tsx',
        "import { View } from 'react-native';\nimport { PlayMove } from '@/application/use-cases/play-move';",
      ),
      file(
        'infrastructure/persistence/sqlite-repo.ts',
        "import { drizzle } from 'drizzle-orm/expo-sqlite';\nimport '../../domain/engine/hex-board';",
      ),
      file(
        'main/container.ts',
        "export { SqliteRepo } from '@/infrastructure/persistence/sqlite-repo';",
      ),
      file('app/index.tsx', "import { container } from '@/main/container';"),
    ];

    // Act
    const violations = findDependencyViolations(files);

    // Assert
    expect(violations).toEqual([]);
  });

  it('should_find_no_violations_when_scanning_the_real_src_directory', () => {
    // Arrange
    const files = readSourceFiles(SRC_DIR);

    // Act
    const violations = findDependencyViolations(files);

    // Assert
    expect(violations).toEqual([]);
  });
});

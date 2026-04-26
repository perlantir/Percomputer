# Test Coverage Configuration

## Overview

This project uses **Vitest** with the **v8 coverage provider** for unit/integration test coverage and **nyc** for optional Playwright E2E coverage collection.

---

## Coverage Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `test:unit:coverage` | `vitest run tests/ --coverage` | Run unit tests with coverage report |
| `test:unit:coverage:watch` | `vitest tests/ --coverage` | Watch mode with live coverage updates |
| `test:unit:coverage:html` | `vitest run tests/ --coverage && open coverage/index.html` | Generate and open HTML report |
| `test:unit:ci` | `vitest run tests/ --coverage --reporter=default --reporter=junit` | CI pipeline with JUnit XML output |
| `test:coverage:verify` | `vitest run tests/ --coverage` (filtered output) | Quick threshold verification |

---

## Coverage Thresholds (Unit Tests)

Configured in `vitest.config.ts`:

| Metric | Minimum | Description |
|--------|---------|-------------|
| Statements | 60% | Lines of code executed |
| Branches | 50% | Conditional paths taken |
| Functions | 60% | Functions called |
| Lines | 60% | Individual lines hit |

CI will **fail the build** if any threshold is not met. The `--coverage` flag enforces this automatically.

---

## Coverage Reports

After running `npm run test:unit:coverage`, reports are generated in the `coverage/` directory:

| Format | File | Use Case |
|--------|------|----------|
| Terminal (text) | stdout | Quick review |
| HTML | `coverage/index.html` | Visual drill-down |
| JSON | `coverage/coverage-final.json` | Programmatic access |
| LCOV | `coverage/lcov.info` | Codecov, SonarQube, Coveralls |

To view the HTML report locally:
```bash
npm run test:unit:coverage:html
```

---

## Playwright E2E Coverage

Playwright E2E tests do **not** collect code coverage by default. To enable it:

1. **Instrument the application build** with nyc/babel-plugin-istanbul:
   ```bash
   npm install -D @babel/plugin-istanbul nyc
   ```

2. **Configure Next.js** to use the Babel plugin in `next.config.ts`:
   ```ts
   // Only for test builds — do NOT enable in production
   experimental: {
     swcPlugins: process.env.ENABLE_E2E_COVERAGE
       ? [['swc-plugin-coverage-instrument', {}]]
       : [],
   },
   ```

3. **Collect coverage** during Playwright tests by reading `window.__coverage__`.

4. **Merge** E2E coverage with unit test coverage:
   ```bash
   npm run test:coverage:merge
   ```

---

## Files Excluded from Coverage

The following are intentionally excluded:

- **Config files** (`**/*.config.*`, `**/*.d.ts`)
- **Test files** (`tests/`, `e2e/`)
- **Mock data** (`src/mock/**`)
- **Type definitions** (`src/types/**`)
- **Static data** (`src/data/**`)
- **Styles** (`src/styles/**`)
- **Storybook stories** (`src/**/*.stories.{ts,tsx}`)
- **Infrastructure** (`prisma/`, `terraform/`, `k8s/`)
- **Build outputs** (`.next/`, `node_modules/`)

---

## CI Integration

The GitHub Actions workflow (`ci.yml`):

1. Runs `npm run test:unit:coverage` on every PR/push
2. Uploads `coverage/lcov.info` to Codecov via `codecov/codecov-action@v4`
3. Fails the CI pipeline if thresholds are not met or Codecov upload fails

---

## Auto-Updating Thresholds

To update coverage thresholds to match current values:

1. Uncomment `autoUpdate: true` in `vitest.config.ts` coverage thresholds
2. Run `npm run test:unit:coverage`
3. Re-comment `autoUpdate: true` to lock in new thresholds

---

## Troubleshooting

### Coverage shows 0% for files I know are tested
- Check that the file is under `src/` (the `include` pattern is `src/**/*.{ts,tsx}`)
- Verify the test file imports the source file directly (not via a re-export barrel)

### Coverage report is empty or missing files
- Ensure `all: true` is set in the coverage config (includes untested files at 0%)
- Check the `exclude` patterns aren't too broad

### Threshold failures in CI but pass locally
- Run with the same flags: `npm run test:unit:ci`
- Check for environment-specific code paths (`process.env.CI` conditionals)

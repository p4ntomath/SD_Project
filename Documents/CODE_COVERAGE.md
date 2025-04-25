# Viewing Code Coverage

## Overview
This project uses Vitest with the v8 coverage provider to generate test coverage reports. Coverage reports help identify which parts of the codebase are tested and which need more testing attention.

## Running Coverage Reports

1. Run the following command in your terminal to generate coverage reports:
   ```bash
   npm run coverage
   ```

2. This will create a `/coverage` directory in your project root with multiple report formats:
   - HTML report (`/coverage/index.html`)
   - JSON report (`/coverage/coverage-final.json`)
   - LCOV report (`/coverage/lcov.info`)
   - Console text output

## Viewing Coverage Reports

### HTML Report
1. Navigate to the `/coverage` directory
2. Open `index.html` in your web browser
3. This interactive report shows:
   - Overall coverage percentage
   - File-by-file breakdown
   - Line-by-line coverage details
   - Branch coverage
   - Function coverage

### Console Output
The text report in your terminal shows:
- Summary of coverage metrics
- Coverage percentages by category
- List of files with coverage statistics

### Using VS Code Extension
1. Install the "Coverage Gutters" extension for VS Code
2. After running coverage tests, click the "Watch" button in the VS Code status bar
3. Coverage will be displayed inline in your code:
   - Green: Covered lines
   - Red: Uncovered lines
   - Gray: Not tracked

## Understanding Coverage Metrics

- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of code branches (if/else, switch cases) executed
- **Functions**: Percentage of functions called
- **Lines**: Percentage of executable lines of code run

## Excluded Files
The following are excluded from coverage reports:
- `node_modules/`
- `src/tests/setup.js`

## Continuous Integration
Coverage reports are automatically generated during CI runs and can be viewed in the pipeline artifacts.
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Vite with HMR)
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Lint:** `npm run lint` (ESLint)
- **Preview build:** `npm run preview`

No test framework is configured.

## Architecture

React + TypeScript single-page app built with Vite. Deployed to GitHub Pages at `/retirementPlanner/` base path. Uses CSS Modules for styling and Recharts for charting. All inputs are persisted to localStorage.

### Data flow

`App` owns all state via `useLocalStorage` hook (key: `retirement-planner-inputs`). The `Inputs` type (defined in `src/types.ts`) flows down to `InputPanel` and `ExpensePhaseEditor` for editing, and to `useProjection` which memoizes calls to the projection engine. The engine returns `ProjectionResult` (rows + depletion info) consumed by `Summary`, `BalanceChart`, and `ProjectionTable`.

### Projection engine (`src/engine/`)

Pure functions, no React dependencies. `runProjection()` in `projection.ts` is the core: it iterates year-by-year from current year to 2076 (or until portfolio depletion), computing growth, contributions, income streams (pension/SS), expense phases, and withdrawals. All values are in real (inflation-adjusted) dollars. Withdrawals draw from taxable accounts first, then tax-deferred. `helpers.ts` has `grossUp` (post-tax to pre-tax conversion) and `realReturn` (nominal to real rate).

### Key concepts

- **Filing status:** Single/Married toggle controls whether Person 2 inputs and columns are shown
- **Expense phases:** User-defined spending periods (e.g., "retired", "no mortgage") with start years; the active phase is the one with the largest startYear <= current projection year
- **Rates are stored as decimals** (0.06 = 6%) internally but displayed/edited as percentages in the UI via conversion in `InputPanel`

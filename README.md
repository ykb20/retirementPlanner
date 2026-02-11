# Retirement Planner

A year-by-year retirement projection calculator that helps you visualize portfolio growth, income streams, and spending through retirement. Deployed at [ykb20.github.io/retirementPlanner](https://ykb20.github.io/retirementPlanner/).

## Features

- **Single or married filing** — model one or two people with independent ages, retirement years, contributions, pensions, and Social Security
- **Portfolio tracking** — separate tax-deferred (401k/IRA) and taxable account balances with distinct pre- and post-retirement growth rates
- **Expense phases** — define multiple spending periods (e.g., "retired", "no mortgage", "reduced expenses") with different annual amounts and start years
- **Income streams** — pension and Social Security for each person, with configurable start years/ages
- **Inflation-adjusted or nominal projections** — toggle between real (today's dollars) and nominal (future dollars) views
- **Withdrawal ordering** — draws from taxable accounts first, then tax-deferred, with tax gross-up calculations
- **Interactive chart** — stacked area chart showing portfolio balance over time with a retirement year marker
- **Year-by-year table** — detailed projection of expenses, income, withdrawals, and balances for each year
- **Summary cards** — retirement nest egg, peak portfolio, depletion year (or final balance), and growth rates at a glance
- **Persistent inputs** — all settings saved to localStorage so they survive page refreshes

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173/retirementPlanner/](http://localhost:5173/retirementPlanner/) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run test` | Run tests (single run) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Tech Stack

- **React 19** + **TypeScript** — UI and type safety
- **Vite** — build tooling and dev server
- **Recharts** — charting library for portfolio visualization
- **Vitest** — unit testing
- **CSS Modules** — scoped component styling
- **GitHub Pages** — deployment

## Project Structure

```
src/
  engine/          # Pure projection logic (no React dependencies)
    projection.ts  # Core year-by-year projection engine
    helpers.ts     # grossUp and realReturn utilities
    defaults.ts    # Default input values
  hooks/           # React hooks
    useProjection  # Memoized projection engine wrapper
    useLocalStorage# Persistent state management
  components/      # UI components
    InputPanel     # All financial inputs and toggles
    ExpensePhaseEditor # Expense phase management
    BalanceChart   # Stacked area chart
    ProjectionTable# Year-by-year data table
    Summary        # Key metrics cards
  types.ts         # Shared TypeScript interfaces
  utils/           # Formatting utilities
```

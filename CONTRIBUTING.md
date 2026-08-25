# Contributing to Arkyn

Thanks for your interest in contributing! This repository is a monorepo containing the `@arkyn/cli`, `@arkyn/components`, `@arkyn/server`, `@arkyn/shared`, and `@arkyn/templates` packages, plus an internal preview app.

## Prerequisites

- [Bun](https://bun.sh/) `>=1.0.0` — package manager, workspace runner, and build tool
- Node.js `>=18.0.0`

## Setup

```bash
git clone https://github.com/Lucas-Eduardo-Goncalves/arkyn-library.git
cd arkyn-library
bun install
```

## Running things

```bash
# Build all publishable packages (templates → shared → components → ui → server → cli)
bun run all:build

# Run tests across all packages
bun run all:test

# Type check every package
bun run all:typecheck

# Lint / format with Biome
bun run biome:check
bun run biome:format

# Start the internal preview app used to test components locally
bun run development:dev
```

Each package also has its own scoped scripts, e.g. `bun run components:test`, `bun run server:typecheck`, `bun run cli:build`. See the root `package.json` for the full list.

## Making a change

1. Fork the repository and create a branch off `develop` (pull requests are opened against `develop`, not `main`).
2. Make your change in the relevant `packages/*` directory.
3. Run `bun run biome:check`, `bun run all:typecheck`, and `bun run all:test` locally before opening a PR — the same checks run in CI on every pull request.
4. Open a pull request against `develop` describing what changed and why.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/` when opening an issue.

## Code of Conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to abide by it.

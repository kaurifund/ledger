# Ledger

A modern git interface for macOS - view branches, worktrees, and pull requests at a glance.

![Electron](https://img.shields.io/badge/Electron-37-blue)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- **Branch Viewer** - See all local and remote branches with metadata (commit dates, counts)
- **Worktree Support** - View and navigate to git worktrees
- **Pull Request Integration** - View open PRs from GitHub (via `gh` CLI)
- **Smart Filtering** - Filter branches by: All, Local Only, Unmerged
- **Flexible Sorting** - Sort by: Name, Last Commit, First Commit, Most Commits
- **Quick Actions** - Double-click to switch branches, open worktrees, or view PRs
- **Context Menus** - Right-click for additional options
- **Auto-Stash** - Automatically stashes uncommitted changes before switching branches

## Requirements

- macOS
- Node.js 18+
- [GitHub CLI](https://cli.github.com/) (`gh`) - for PR integration

## Installation

```bash
# Clone the repository
git clone https://github.com/peterjthomson/ledger
cd ledger

# Install dependencies
npm install
```

## Development

```bash
npm run dev
```

## Building

```bash
# For macOS
npm run build:mac
```

## Tech Stack

- **[Electron](https://www.electronjs.org)** - Cross-platform desktop application framework
- **[React](https://react.dev)** - UI library
- **[TypeScript](https://www.typescriptlang.org)** - Type-safe JavaScript
- **[simple-git](https://github.com/steveukx/git-js)** - Git operations
- **[GitHub CLI](https://cli.github.com/)** - Pull request data

## License

MIT

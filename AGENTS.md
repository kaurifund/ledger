# AGENTS.md

This file helps AI assistants understand and work with the Ledger codebase.

## Project Overview

Ledger is a macOS desktop app for viewing git branches, worktrees, and pull requests. Built with Electron + React + TypeScript.

## Quick Facts

| Aspect | Details |
|--------|---------|
| Type | Electron desktop app |
| Platform | macOS (Apple Silicon) |
| Language | TypeScript (strict mode) |
| UI | React 19 + custom CSS |
| Git | `simple-git` library |
| PRs | GitHub CLI (`gh`) |
| Tests | Playwright E2E |
| Build | electron-vite + electron-builder |

## Key Files to Know

```
lib/main/main.ts         # IPC handlers, app lifecycle
lib/main/git-service.ts  # All git operations (~2600 lines)
lib/preload/preload.ts   # API exposed to renderer
app/app.tsx              # Main React component (~4000 lines)
app/styles/app.css       # All styling
app/types/electron.d.ts  # TypeScript types for IPC
```

## Common Tasks

### Adding a new git operation

1. Add function to `lib/main/git-service.ts`
2. Add IPC handler in `lib/main/main.ts`
3. Expose in `lib/preload/preload.ts`
4. Add types to `app/types/electron.d.ts`
5. Call from `app/app.tsx`

### Adding UI elements

All UI is in `app/app.tsx`. Styling in `app/styles/app.css` uses CSS variables for theming.

### Running the app

```bash
npm run dev      # Development with hot reload
npm test         # Run E2E tests
npm run lint     # Check for linting issues
npm run build:mac:arm64  # Build for Apple Silicon
```

## Architecture Summary

```
Main Process (Node.js)
├── main.ts - IPC handlers
├── git-service.ts - git commands via simple-git
└── settings-service.ts - persistent storage

    ↕ IPC (ipcMain.handle / ipcRenderer.invoke)

Preload Script
└── preload.ts - exposes window.electronAPI

    ↕ contextBridge

Renderer Process (Browser)
└── app.tsx - React UI, state management
```

## State Management

Uses React hooks only (no Redux/Zustand):
- `useState` for data (branches, worktrees, prs, loading states)
- `useMemo` for derived data (filtered/sorted branches)
- `useCallback` for handlers
- `useEffect` for side effects

## Styling Approach

- Custom CSS (not Tailwind, despite it being installed)
- CSS variables for colors (`--accent`, `--bg-primary`, etc.)
- Mac native light theme aesthetic
- Responsive multi-column layout

## Testing

Playwright E2E tests in `tests/app.spec.ts`:
- Tests welcome screen (no repo)
- Tests main view (with repo via `--repo=` CLI arg)

Run with `npm test` (builds first) or `npm run test:headed`.

## Git Operations Available

| Operation | Function | Notes |
|-----------|----------|-------|
| List branches | `getBranchesWithMetadata()` | Includes commit counts, dates |
| List worktrees | `getEnhancedWorktrees()` | With agent detection |
| List PRs | `getPullRequests()` | Via `gh pr list` |
| Switch branch | `checkoutBranch()` | Auto-stashes first |
| Checkout remote | `checkoutRemoteBranch()` | Creates tracking branch |
| Checkout PR | `checkoutPRBranch()` | Fetches and checkouts |
| Open in browser | `openBranchInGitHub()` | GitHub URL |
| Fetch | `pullBranch()` | git fetch remote branch |
| Stage/Unstage | `stageFile()`, `unstageFile()` | Individual files |
| Commit | `commitChanges()` | With message and description |
| View diff | `getCommitDiff()`, `getFileDiff()` | Full diff parsing |
| Stash ops | `applyStash()`, `popStash()`, etc. | Full stash management |
| PR details | `getPRDetail()` | Full PR info with comments |

## Error Handling

- Git errors shown in error banner
- PR errors shown in PR column
- Operation results shown as dismissible toasts
- All IPC returns `{ success, message }` or `{ error }` pattern
- Unused catch variables prefixed with `_` (e.g., `_error`)

## Settings Storage

JSON file at `~/Library/Application Support/ledger/ledger-settings.json`:
```json
{
  "lastRepoPath": "/path/to/repo"
}
```

## Build & Distribution

- Built DMG at `dist/Ledger-{version}-arm64.dmg`
- Published to GitHub Releases
- Currently unsigned (users must right-click → Open)

## Code Style

- Prettier for formatting
- ESLint for linting (see `eslint.config.mjs`)
- TypeScript strict mode
- Functional React components
- No class components
- Unused variables prefixed with `_`

## Areas for Improvement

1. The `app.tsx` file is large (~4000 lines) - could be split into components
2. The `git-service.ts` file is large (~2600 lines) - could be modularized
3. No loading skeletons - just "Loading..." text
4. No keyboard shortcuts yet
5. PR integration requires `gh` CLI - could add fallback
6. Only macOS supported currently
7. React hooks exhaustive-deps warnings (intentional to prevent infinite loops)

## IPC Naming Convention

- Channels use kebab-case: `get-branches`, `checkout-branch`
- Functions use camelCase: `getBranches()`, `checkoutBranch()`

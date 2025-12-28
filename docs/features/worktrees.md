# 🌲 Worktrees

> First-class support for git worktrees with AI agent workspace detection.

## Overview

Git worktrees allow you to have multiple working directories from a single repository. Ledger enhances worktrees with automatic detection of AI agent workspaces (Cursor, Claude, Gemini), diff statistics, and smart display names.

## Philosophy: Worktrees vs Branches

### The Industry Problem

AI coding tools like Cursor use worktrees as **the unit of work** — each agent IS a worktree. This creates several UX problems:

| Cursor's Approach | Problem |
|-------------------|---------|
| **Auto-generated branch names** (`feat-1-98Zlw`) | Branches are disposable, not traceable |
| **"Apply" button merges to main** | Bypasses PR review, drives toward unsafe patterns |
| **Worktree = Agent lifetime** | When agent done, worktree gone — no durable artifact |
| **Up to 20 ephemeral worktrees** | Cleanup by "oldest access time" loses work context |
| **No LSP in worktrees** | Agents work without linting, catch errors late |

The confusing "Apply" vs "Create PR" UX pushes users toward immediately applying changes to main rather than creating reviewable PRs. This works for trivial changes but breaks down for anything requiring review.

### Conductor/Ledger's Philosophy

**The branch is the unit of work. The worktree is temporary housing.**

| Our Approach | Benefit |
|--------------|---------|
| **Meaningful branch names** (`peterjthomson/auth-fix`) | Work is traceable, searchable, reviewable |
| **Aggressive branch creation** | Every agent task gets a named branch immediately |
| **Standard git workflow** | Branch → PR → Review → Merge |
| **Worktrees are disposable** | Branch survives worktree cleanup |
| **"Convert to Branch" action** | Rescue orphaned worktree changes into proper branches |

This means Ledger can serve as the **review layer** for work started in Cursor or other tools — taking their ephemeral worktrees and promoting them to proper, reviewable branches.

### Workflow: Cursor → Ledger

```
Cursor creates worktree          Ledger promotes to branch
        │                                │
        ▼                                ▼
┌───────────────────┐           ┌───────────────────┐
│ ~/.cursor/worktrees/abc123 │   │ feature/auth-fix   │
│ Branch: feat-1-98Zlw        │ → │ Meaningful name    │
│ Changes: +42 -17            │   │ Ready for PR       │
│ Status: orphaned            │   │ Full git history   │
└───────────────────┘           └───────────────────┘
```

**Result**: Work that Cursor started can flow into proper code review without the "Apply to main" shortcut.

## Features

### Agent Detection

Ledger automatically detects which AI agent created a worktree:

| Agent | Detection Path | Display |
|-------|---------------|---------|
| **Cursor** | `~/.cursor/worktrees/` | "Cursor 1: context" |
| **Claude** | `~/.claude/worktrees/` | "Claude 1: context" |
| **Gemini** | `~/.gemini/worktrees/` | "Gemini 1: context" |
| **Unknown** | Other paths | Folder name |

### Smart Display Names

```
Format: "{Agent} {Index}: {Context}"

Examples:
  • Cursor 1: AuthController
  • Claude 2: login-fix
  • Gemini 1: workspace
```

**Context Hint Priority:**
1. Primary modified file name (if changes exist)
2. Branch name (if checked out)
3. Last commit message (truncated)
4. Generic "workspace"

### Diff Statistics

Each worktree shows:
- **Changed file count**: Number of modified files
- **Additions**: Lines added (`+42`)
- **Deletions**: Lines removed (`-17`)
- **Clean indicator**: "clean" if no changes

## Data Model

```typescript
interface EnhancedWorktree {
  path: string;              // "/Users/me/.cursor/worktrees/abc123"
  head: string;              // Commit hash
  branch: string | null;     // "feature/auth" or null if detached
  bare: boolean;             // Bare repo flag
  
  // Agent metadata
  agent: 'cursor' | 'claude' | 'gemini' | 'junie' | 'unknown';
  agentIndex: number;        // 1, 2, 3... per agent type
  contextHint: string;       // "AuthController"
  displayName: string;       // "Cursor 1: AuthController"
  
  // Diff statistics
  changedFileCount: number;  // 3
  additions: number;         // 42
  deletions: number;         // 17
  
  // Ordering
  lastModified: string;      // ISO timestamp
}
```

## Actions

### Checkout Worktree (Double-click)

Switches to the branch associated with the worktree:

```
User double-clicks "Cursor 1: AuthController"
    │
    ├─► Get worktree branch: "feature/auth"
    │
    ├─► Auto-stash current changes (if any)
    │
    ├─► git checkout feature/auth
    │
    └─► Show success toast
```

### Open in Finder (Right-click)

Opens the worktree directory in macOS Finder.

### Convert to Branch (Right-click)

**Powerful feature**: Takes changes from a worktree and creates a proper branch.

```
Convert "Cursor 1: AuthController" to branch
    │
    ├─► Detect base branch (main/master)
    │
    ├─► Create new branch from base
    │       Name: worktree folder name
    │
    ├─► Create patch from worktree changes
    │       git diff > /tmp/changes.patch
    │
    ├─► Apply patch to new branch
    │       git apply /tmp/changes.patch
    │
    ├─► Stage all changes
    │       git add -A
    │
    └─► Return branch name for commit
```

**Use case**: AI agents often work in worktrees. This lets you easily promote their work to a proper branch for review and commit.

## Filtering

```
┌─────────────────────────────────────┐
│ Parent:  [All ▾]                    │
│          • All                      │
│          • .cursor                  │
│          • .claude                  │
│          • main                     │
└─────────────────────────────────────┘
```

Filter worktrees by their parent directory to see only specific agent workspaces.

## Git Commands Used

| Feature | Command |
|---------|---------|
| List worktrees | `git worktree list --porcelain` |
| Get status | `git status --porcelain` (in worktree) |
| Get diff stats | `git diff --shortstat` (in worktree) |
| Get commit msg | `git log -1 --format=%s` (in worktree) |
| Convert to branch | `git diff`, `git checkout -b`, `git apply` |

## UI Locations

### Column Mode
- **Worktrees** column (2nd column)
- Shows all worktrees with diff stats

### Work Mode
- **Worktrees** section in sidebar (collapsible)
- Single-click → Shows worktree info in detail panel
- Double-click → Checks out worktree branch

## Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| `●` dot | Currently checked out |
| `+42 -17` | Additions/deletions |
| `3 files` | Changed file count |
| `clean` | No uncommitted changes |

## Example Display

```
┌─────────────────────────────────────────────────────┐
│ ⧉ Worktrees                                    [4] │
├─────────────────────────────────────────────────────┤
│ Cursor 1: AuthController                        ●  │
│ ~/.cursor/worktrees/abc123                         │
│ abc123 · +42 -17 · 3 files                         │
│                                                    │
│ Cursor 2: DocsUpdate                               │
│ ~/.cursor/worktrees/def456                         │
│ def456 · clean                                     │
│                                                    │
│ Claude 1: login-fix                                │
│ ~/.claude/worktrees/ghi789                         │
│ ghi789 · +8 -2 · 1 file                            │
└────────────────────────────────────────────────────┘
```

## Work Mode Detail Panel

When a worktree is selected:

```
┌─────────────────────────────────────────────────────┐
│ [Worktree]                                          │
│                                                     │
│ Cursor 1: AuthController                            │
│                                                     │
│ PATH                                                │
│ /Users/me/.cursor/worktrees/abc123                  │
│                                                     │
│ BRANCH           STATUS                             │
│ feature/auth     Current                            │
│                                                     │
│ CHANGES                                             │
│ 3 files · +42 -17                                   │
│                                                     │
│ ─────────────────────────────────────────────────── │
│ Double-click to checkout this worktree              │
└─────────────────────────────────────────────────────┘
```

## Performance Notes

- Worktree metadata is fetched in parallel
- Diff stats require executing git in each worktree directory
- Many worktrees (10+) may cause slight delay
- Directory mtime used for sorting by recency

---

## Planned: Better Worktree Management

Ledger aims to be the **review and promotion layer** for AI-generated work. These features will help bridge Cursor's ephemeral worktrees with proper git workflow:

### 🔜 Worktree → Branch Promotion (Enhanced)

Current "Convert to Branch" creates a patch and applies it. Enhanced version:

```
┌─────────────────────────────────────────────────────────────┐
│ Promote Worktree to Branch                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Source: Cursor 1: AuthController                            │
│ Path: ~/.cursor/worktrees/abc123                            │
│ Changes: +42 -17 across 3 files                             │
│                                                             │
│ Branch Name: [auth-controller-fix____________]              │
│              (auto-suggested from context)                  │
│                                                             │
│ Base Branch: [main ▾]                                       │
│                                                             │
│ Options:                                                    │
│   ☑ Create commit with AI-generated message                 │
│   ☑ Open PR draft after creation                            │
│   ☐ Delete worktree after promotion                         │
│                                                             │
│                        [Cancel]  [Promote to Branch]        │
└─────────────────────────────────────────────────────────────┘
```

### 🔜 Worktree Watcher

Monitor AI tool worktree directories for changes:

- **Auto-detect new worktrees**: When Cursor/Claude creates a worktree, show notification
- **Stale worktree alerts**: Flag worktrees with changes >24h old that haven't been promoted
- **Orphan detection**: Find worktrees whose branches were deleted or merged

### 🔜 Batch Operations

For users running multiple parallel agents:

- **Promote all with changes**: Batch convert multiple worktrees to branches
- **Compare worktrees**: Side-by-side diff of two worktrees solving same problem
- **Best-of-N picker**: Choose best solution from parallel agent runs, promote to branch

### 🔜 Cursor Integration

Smooth handoff from Cursor to Ledger:

- **"Open in Ledger" context menu** in Cursor worktree panel
- **Worktree sync**: Show Ledger's branch name in Cursor's UI
- **Bi-directional status**: See PR status for promoted worktrees

### 🔜 Review Flow

Turn Cursor's "Apply to main" impulse into proper review:

```
User clicks "Apply" in Cursor
        │
        ▼ (Ledger intercept - optional)
┌─────────────────────────────────────────────────────────────┐
│ This worktree has 127 lines of changes.                     │
│                                                             │
│ Would you like to:                                          │
│                                                             │
│   [Apply to main]     ← Cursor's default (risky)            │
│   [Create PR]         ← Ledger's recommended flow           │
│   [Review in Ledger]  ← Open diff viewer first              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Why This Matters

Cursor optimizes for **speed** — get code written fast, apply it fast.

Ledger optimizes for **durability** — make sure work is reviewable, traceable, and recoverable.

By serving as the bridge, Ledger lets teams benefit from AI coding speed while maintaining proper git hygiene:

| Without Ledger | With Ledger |
|----------------|-------------|
| Agent work → Apply → main | Agent work → Branch → PR → Review → main |
| Disposable worktrees | Promoted, named branches |
| "What did the AI change?" | Full commit history |
| Lost parallel attempts | Compare & pick best solution |


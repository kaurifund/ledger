# Canvas Architecture

This document describes the canvas system and the plan to fully adopt it.

## What's Built ✓

The canvas infrastructure is **complete** and living in `app/components/canvas/`:

### Types (`app/types/app-types.ts`)

```typescript
// Slot types define column purpose
type SlotType = 'list' | 'editor' | 'viz'

// Panel types - what can render in each slot
type ListPanelType = 'pr-list' | 'branch-list' | 'remote-list' | 'worktree-list' | 'commit-list' | 'unified-list'
type EditorPanelType = 'pr-detail' | 'branch-detail' | 'remote-detail' | 'worktree-detail' | 'commit-detail' | 'stash-detail' | 'create-branch' | 'create-worktree' | 'staging' | 'settings' | 'empty'
type VizPanelType = 'git-graph' | 'timeline'

// Column definition
interface Column {
  id: string
  slotType: SlotType
  panel: PanelType
  width: number | 'flex'
  minWidth?: number
  config?: Record<string, unknown>
}

// Canvas definition
interface Canvas {
  id: string
  name: string
  columns: Column[]
  isPreset?: boolean
}
```

### Components

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `CanvasProvider` | `CanvasContext.tsx` | Global state, reducer, actions | ✓ Complete |
| `Canvas` | `Canvas.tsx` | Renders columns, delegates to slot renderers | ✓ Complete |
| `Column` | `Column.tsx` | Width handling, resize, data attributes | ✓ Complete |
| `EditorSlot` | `EditorSlot.tsx` | Editor with back/forward navigation | ✓ Complete |
| `ResizeHandle` | `ResizeHandle.tsx` | Drag-to-resize columns | ✓ Complete |
| `CanvasSwitcher` | `CanvasSwitcher.tsx` | Tab UI to switch canvases | ✓ Complete |

### Hooks

| Hook | File | Purpose | Status |
|------|------|---------|--------|
| `useCanvas` | `CanvasContext.tsx` | Access canvas state and actions | ✓ Used in app.tsx |
| `useCanvasNavigation` | `useCanvasNavigation.ts` | openInEditor, goBack/goForward, keyboard shortcuts | ✓ Used in app.tsx |
| `useCanvasPersistence` | `useCanvasPersistence.ts` | Auto-save/load canvas state | ✓ Complete, not wired up |

### Canvas Presets

```typescript
// CanvasContext.tsx

export const RADAR_CANVAS: Canvas = {
  id: 'radar',
  name: 'Radar',
  isPreset: true,
  columns: [
    { id: 'radar-prs', slotType: 'list', panel: 'pr-list', width: 'flex', minWidth: 200 },
    { id: 'radar-worktrees', slotType: 'list', panel: 'worktree-list', width: 'flex', minWidth: 200 },
    { id: 'radar-commits', slotType: 'list', panel: 'commit-list', width: 'flex', minWidth: 200 },
    { id: 'radar-branches', slotType: 'list', panel: 'branch-list', width: 'flex', minWidth: 200 },
    { id: 'radar-remotes', slotType: 'list', panel: 'remote-list', width: 'flex', minWidth: 200 },
  ],
}

export const FOCUS_CANVAS: Canvas = {
  id: 'focus',
  name: 'Focus',
  isPreset: true,
  columns: [
    { id: 'focus-list', slotType: 'list', panel: 'unified-list', width: 220, minWidth: 180 },
    { id: 'focus-viz', slotType: 'viz', panel: 'git-graph', width: 'flex', minWidth: 300 },
    { id: 'focus-editor', slotType: 'editor', panel: 'empty', width: 400, minWidth: 300 },
  ],
}

export const GRAPH_CANVAS: Canvas = {
  id: 'graph',
  name: 'Graph',
  isPreset: true,
  columns: [
    { id: 'graph-viz', slotType: 'viz', panel: 'git-graph', width: 'flex', minWidth: 400 },
  ],
}
```

### State Management

The `CanvasContext` provides:

**Canvas Operations:**
- `setActiveCanvas(canvasId)` - Switch canvas
- `addCanvas(canvas)` - Add custom canvas
- `removeCanvas(canvasId)` - Remove (non-preset only)
- `loadCanvases(canvases, activeId)` - Load from persistence

**Column Operations:**
- `updateColumn(canvasId, columnId, updates)` - Update column props
- `reorderColumns(canvasId, fromIndex, toIndex)` - Reorder
- `addColumn(canvasId, column, index)` - Add column
- `removeColumn(canvasId, columnId)` - Remove column
- `resizeColumn(canvasId, columnId, width)` - Resize
- `setColumnPanel(canvasId, columnId, panel)` - Change panel

**Editor Navigation:**
- `navigateToEditor(panel, data)` - Push to editor history
- `goBack()` / `goForward()` - Navigate history
- `clearEditor()` - Reset editor state
- `currentEditorEntry` - Current editor content
- `canGoBack` / `canGoForward` - Navigation state

**Helpers:**
- `hasEditorSlot(canvasId?)` - Does canvas have editor?
- `findCanvasWithEditor()` - Find a canvas with editor slot

---

## What's NOT Done ✗

### 1. Rendering Uses Inline JSX

`app.tsx` does NOT use the `<Canvas>` component. Instead:

```tsx
// Current: ~700 lines of hardcoded Radar JSX
{viewMode === 'radar' && (
  <main className="ledger-content five-columns">
    <section className="column stashes-column">...</section>
    <section className="column prs-column">...</section>
    {/* etc */}
  </main>
)}

// Current: ~650 lines of hardcoded Focus JSX
{viewMode === 'focus' && (
  <main className="focus-mode-layout">
    <aside className="focus-sidebar">...</aside>
    <div className="focus-main">...</div>
    <aside className="focus-detail">...</aside>
  </main>
)}

// Target: Use <Canvas> component
{activeCanvas && (
  <Canvas
    canvas={activeCanvas}
    renderListSlot={(col) => <ListPanel column={col} {...data} />}
    renderVizSlot={(col) => <VizPanel column={col} {...data} />}
    renderEditorSlot={(col) => <EditorSlot column={col} renderPanel={renderEditorPanel} />}
    onResizeColumn={(id, w) => resizeColumn(activeCanvas.id, id, w)}
  />
)}
```

### 2. Missing Column Features

The `Column` type needs:

```typescript
interface Column {
  // ... existing ...
  
  // NEW: Visibility
  visible?: boolean         // Is column shown? (default true)
  collapsible?: boolean     // Can user toggle visibility?
  
  // NEW: Display
  label?: string            // Header label ("Pull Requests")
  icon?: string             // Header icon ("⊕")
}
```

### 3. Missing Canvas Features

The `Canvas` type could use:

```typescript
interface Canvas {
  // ... existing ...
  
  // NEW: Behaviors
  allowReorder?: boolean    // Can columns be dragged? (default true)
}
```

### 4. No Panel Components

Panel content is embedded in `app.tsx`. Need to extract to:

```
app/components/panels/
├── list/
│   ├── PRList.tsx          # PR list with filters
│   ├── BranchList.tsx      # Branch list with filters
│   ├── WorktreeList.tsx    # Worktree list
│   ├── StashList.tsx       # Stash list
│   ├── RemoteList.tsx      # Remote branch list
│   └── UnifiedList.tsx     # Focus sidebar (all sections)
├── viz/
│   └── GitGraph.tsx        # ✓ Already exists
└── editor/
    ├── PRReviewPanel.tsx   # ✓ Already exists
    ├── StagingPanel.tsx    # ✓ Already exists
    ├── DiffPanel.tsx       # ✓ Already exists
    └── ...                 # ✓ Most already exist
```

### 5. No Drag Handles in Canvas

The `Canvas` component comment says "Drag-and-drop reordering (future)". The current Radar mode has drag handles via inline JSX, but the `Column` component doesn't render them.

### 6. CSS Duplication

Two parallel class systems:
- `.column`, `.column-header`, `.column-drag-handle` (Radar inline)
- `.canvas-column`, `.canvas-column-content` (Canvas component)
- `.focus-sidebar`, `.focus-main`, `.focus-detail` (Focus inline)

---

## Migration Path

### Phase 1: Type Updates

Add `visible`, `collapsible`, `label`, `icon` to `Column` type:

```typescript
// app/types/app-types.ts
interface Column {
  id: string
  slotType: SlotType
  panel: PanelType
  width: number | 'flex'
  minWidth?: number
  config?: Record<string, unknown>
  
  // Visibility
  visible?: boolean
  collapsible?: boolean
  
  // Display  
  label?: string
  icon?: string
}
```

Update presets with new fields:

```typescript
export const RADAR_CANVAS: Canvas = {
  id: 'radar',
  name: 'Radar',
  isPreset: true,
  columns: [
    { id: 'radar-stashes', slotType: 'list', panel: 'stash-list', width: 'flex', minWidth: 200, label: 'Stashes', icon: '⊡', collapsible: true },
    { id: 'radar-prs', slotType: 'list', panel: 'pr-list', width: 'flex', minWidth: 200, label: 'PRs', icon: '⊕', collapsible: true },
    // ... etc
    { id: 'radar-editor', slotType: 'editor', panel: 'empty', width: 400, minWidth: 300, label: 'Editor', icon: '◇', collapsible: true, visible: false },
  ],
}
```

### Phase 2: Add Toggle Action

Add `TOGGLE_COLUMN_VISIBILITY` action to reducer:

```typescript
// CanvasContext.tsx
type CanvasAction =
  | // ... existing ...
  | { type: 'TOGGLE_COLUMN_VISIBILITY'; canvasId: string; columnId: string }

case 'TOGGLE_COLUMN_VISIBILITY': {
  return {
    ...state,
    canvases: state.canvases.map((canvas) =>
      canvas.id === action.canvasId
        ? {
            ...canvas,
            columns: canvas.columns.map((col) =>
              col.id === action.columnId
                ? { ...col, visible: col.visible === false ? true : false }
                : col
            ),
          }
        : canvas
    ),
  }
}
```

### Phase 3: Extract List Panels

Create self-contained list panel components. Each should:
- Accept data props (items, selected, handlers)
- Render its own header with label, icon, count
- Include filter/sort controls
- Handle empty/loading states

Example:

```tsx
// app/components/panels/list/PRList.tsx
interface PRListProps {
  prs: PullRequest[]
  selectedPR?: PullRequest
  onSelect: (pr: PullRequest) => void
  onDoubleClick: (pr: PullRequest) => void
  onContextMenu: (e: React.MouseEvent, pr: PullRequest) => void
  // Column config
  label?: string
  icon?: string
  collapsible?: boolean
  onToggle?: () => void
}

export function PRList({ prs, selectedPR, onSelect, ... }: PRListProps) {
  const [filter, setFilter] = useState<PRFilter>('all')
  const [sort, setSort] = useState<PRSort>('updated')
  const [filterOpen, setFilterOpen] = useState(false)
  
  const filtered = useMemo(() => /* filter/sort logic */, [prs, filter, sort])
  
  return (
    <div className="list-panel">
      <div className="list-panel-header" onClick={() => setFilterOpen(!filterOpen)}>
        <span className="list-panel-icon">{icon}</span>
        <span className="list-panel-label">{label}</span>
        <span className="list-panel-count">{filtered.length}</span>
        {collapsible && <button onClick={onToggle}>×</button>}
      </div>
      {filterOpen && <FilterControls ... />}
      <ul className="list-panel-items">
        {filtered.map(pr => (
          <PRListItem key={pr.number} pr={pr} ... />
        ))}
      </ul>
    </div>
  )
}
```

### Phase 4: Add Column Header Component

Create unified column header:

```tsx
// app/components/canvas/ColumnHeader.tsx
interface ColumnHeaderProps {
  column: Column
  count?: number
  onToggle?: () => void
  children?: ReactNode  // Filter controls slot
}

export function ColumnHeader({ column, count, onToggle, children }: ColumnHeaderProps) {
  return (
    <div className="canvas-column-header">
      <div className="canvas-column-drag-handle">⋮⋮</div>
      <span className="canvas-column-icon">{column.icon}</span>
      <span className="canvas-column-label">{column.label}</span>
      {count !== undefined && <span className="canvas-column-count">{count}</span>}
      {column.collapsible && (
        <button className="canvas-column-toggle" onClick={onToggle}>×</button>
      )}
      {children}
    </div>
  )
}
```

### Phase 5: Wire Up Canvas Rendering

Replace inline JSX with `<Canvas>`:

```tsx
// app.tsx
function App() {
  const { activeCanvas, resizeColumn, toggleColumnVisibility } = useCanvas()
  
  // ... data fetching, handlers ...
  
  const renderListSlot = useCallback((column: Column) => {
    switch (column.panel) {
      case 'pr-list':
        return <PRList prs={prs} selectedPR={selectedPR} onSelect={setSelectedPR} ... />
      case 'branch-list':
        return <BranchList branches={branches} ... />
      // etc
    }
  }, [prs, branches, /* deps */])
  
  const renderVizSlot = useCallback((column: Column) => {
    return <GitGraph commits={commits} ... />
  }, [commits])
  
  const renderEditorSlot = useCallback((column: Column) => {
    return <EditorSlot column={column} renderPanel={renderEditorPanel} />
  }, [])
  
  return (
    <div className="ledger">
      <Titlebar ... />
      {activeCanvas && (
        <Canvas
          canvas={activeCanvas}
          renderListSlot={renderListSlot}
          renderVizSlot={renderVizSlot}
          renderEditorSlot={renderEditorSlot}
          onResizeColumn={(id, w) => resizeColumn(activeCanvas.id, id, w)}
        />
      )}
    </div>
  )
}
```

### Phase 6: Cleanup

- Remove `viewMode` state
- Remove inline Radar/Focus JSX (~1300 lines)
- Consolidate CSS to `.canvas-*` classes
- Remove duplicate `.column`, `.focus-*` styles
- Update tests

---

## Canvas Design Principles

### 1. Canvas = Layout, Not Behavior

A canvas defines WHERE things go, not WHAT they do. All canvases share:
- Same data (branches, PRs, etc.)
- Same handlers (checkout, delete, etc.)
- Same editor navigation state

### 2. Columns Can Be Toggled

Any column with `collapsible: true` can be shown/hidden. This replaces:
- Radar's "show editor" toggle
- Focus's sidebar/detail visibility toggles

### 3. Editor State Is Global

The editor history lives in `CanvasContext`, not per-canvas. When you:
- Double-click a PR in Radar → editor shows PR detail
- Switch to Focus → same PR detail is shown
- Switch to Graph → no editor slot, but state preserved

### 4. Presets Are Starting Points

RADAR, FOCUS, GRAPH are presets that can't be deleted. But users could:
- Create custom canvases
- Reorder columns within presets
- Toggle columns on/off
- Resize columns

---

## Success Metrics

- [ ] `app.tsx` reduced from ~3300 lines to <1000 lines
- [ ] Single `<Canvas>` component renders all layouts
- [ ] `viewMode` state eliminated
- [ ] Column visibility toggle works on all canvases
- [ ] Column reorder works on all canvases
- [ ] CSS consolidated (no duplicate class systems)
- [ ] Graph canvas shows just the visualization
- [ ] All existing functionality preserved
- [ ] Tests pass

---

## Timeline Estimate

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Type updates (visible, label, icon) | 1 hour |
| 2 | Toggle action in reducer | 30 min |
| 3 | Extract list panels (5 components) | 4-5 hours |
| 4 | Column header component | 1 hour |
| 5 | Wire up Canvas rendering | 3-4 hours |
| 6 | Cleanup (remove old code, CSS) | 2-3 hours |

**Total: ~12-15 hours**

Can be done incrementally. Each phase leaves the app working.

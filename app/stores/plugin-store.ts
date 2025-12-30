/**
 * Plugin Store
 *
 * Manages plugin UI state: active app, open panels, widget visibility.
 */

import { createAppStore } from './create-store'
import type { AppPlugin, PanelPlugin, PluginRegistration } from '@/lib/plugins/plugin-types'

export interface OpenPanel {
  pluginId: string
  instanceId: string
  data?: unknown
}

export interface PluginState {
  // Navigation
  activeAppId: string | null  // null = base Ledger view

  // Open panels
  openPanels: OpenPanel[]

  // Plugin registry (synced from pluginManager)
  registrations: PluginRegistration[]

  // Settings panel
  settingsOpen: boolean
  settingsPluginId: string | null
}

export interface PluginActions {
  // Navigation
  setActiveApp: (pluginId: string | null) => void
  navigateToLedger: () => void

  // Panels
  openPanel: (pluginId: string, data?: unknown) => void
  closePanel: (instanceId: string) => void
  closeAllPanels: () => void

  // Registry
  setRegistrations: (registrations: PluginRegistration[]) => void

  // Settings
  openSettings: (pluginId?: string) => void
  closeSettings: () => void
}

const initialState: PluginState = {
  activeAppId: null,
  openPanels: [],
  registrations: [],
  settingsOpen: false,
  settingsPluginId: null,
}

let panelInstanceCounter = 0

export const usePluginStore = createAppStore<PluginState & PluginActions>(
  'plugins',
  (set, get) => ({
    ...initialState,

    // Navigation
    setActiveApp: (pluginId) => set({ activeAppId: pluginId }),
    navigateToLedger: () => set({ activeAppId: null }),

    // Panels
    openPanel: (pluginId, data) => {
      const instanceId = `${pluginId}-${++panelInstanceCounter}`
      set((state) => ({
        openPanels: [...state.openPanels, { pluginId, instanceId, data }],
      }))
    },
    closePanel: (instanceId) => {
      set((state) => ({
        openPanels: state.openPanels.filter((p) => p.instanceId !== instanceId),
      }))
    },
    closeAllPanels: () => set({ openPanels: [] }),

    // Registry
    setRegistrations: (registrations) => set({ registrations }),

    // Settings
    openSettings: (pluginId) =>
      set({ settingsOpen: true, settingsPluginId: pluginId ?? null }),
    closeSettings: () =>
      set({ settingsOpen: false, settingsPluginId: null }),
  }),
  {
    persist: true,
    partialize: (state) => ({
      // Only persist the active app preference
      activeAppId: state.activeAppId,
    }),
  }
)

// Selectors
export const selectActiveApp = (state: PluginState): AppPlugin | null => {
  if (!state.activeAppId) return null
  const reg = state.registrations.find(
    (r) => r.plugin.id === state.activeAppId && r.plugin.type === 'app'
  )
  return reg?.plugin as AppPlugin | null
}

export const selectAppPlugins = (state: PluginState): AppPlugin[] => {
  return state.registrations
    .filter((r) => r.enabled && r.plugin.type === 'app')
    .map((r) => r.plugin as AppPlugin)
    .sort((a, b) => (a.iconOrder ?? 100) - (b.iconOrder ?? 100))
}

export const selectOpenPanels = (state: PluginState): Array<OpenPanel & { plugin: PanelPlugin }> => {
  return state.openPanels
    .map((panel) => {
      const reg = state.registrations.find((r) => r.plugin.id === panel.pluginId)
      if (!reg || reg.plugin.type !== 'panel') return null
      return { ...panel, plugin: reg.plugin as PanelPlugin }
    })
    .filter((p): p is OpenPanel & { plugin: PanelPlugin } => p !== null)
}

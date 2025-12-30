/**
 * Plugin IPC Handlers
 *
 * Exposes plugin management operations to the renderer process.
 */

import { handle } from '@/lib/main/shared'
import {
  listInstalledPlugins,
  getPluginManifest,
  installPlugin,
  uninstallPlugin,
  setPluginEnabled,
  getPluginsDirectory,
  pathExists,
  readPluginFile,
  cloneRepository,
  downloadFile,
  type PluginSource,
} from '@/lib/main/plugin-service'

export const registerPluginHandlers = () => {
  // List installed plugins
  handle('plugin-list-installed', async () => {
    try {
      return listInstalledPlugins()
    } catch (error) {
      console.error('Failed to list installed plugins:', error)
      return []
    }
  })

  // Get plugin manifest from path
  handle('plugin-get-manifest', async (pluginPath: string) => {
    try {
      return getPluginManifest(pluginPath)
    } catch (error) {
      console.error('Failed to get plugin manifest:', error)
      return null
    }
  })

  // Install plugin from source
  handle('plugin-install', async (source: PluginSource) => {
    try {
      return await installPlugin(source)
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  })

  // Uninstall plugin
  handle('plugin-uninstall', async (pluginId: string) => {
    try {
      return await uninstallPlugin(pluginId)
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  })

  // Enable/disable plugin
  handle('plugin-set-enabled', async (pluginId: string, enabled: boolean) => {
    try {
      return setPluginEnabled(pluginId, enabled)
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  })

  // Get plugins directory
  handle('plugin-get-directory', async () => {
    return getPluginsDirectory()
  })

  // Check if path exists
  handle('plugin-path-exists', async (checkPath: string) => {
    return pathExists(checkPath)
  })

  // Read plugin file
  handle('plugin-read-file', async (pluginId: string, relativePath: string) => {
    try {
      return readPluginFile(pluginId, relativePath)
    } catch (error) {
      console.error('Failed to read plugin file:', error)
      return null
    }
  })

  // Clone git repository
  handle('plugin-clone-repo', async (gitUrl: string, targetDir: string) => {
    try {
      return await cloneRepository(gitUrl, targetDir)
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  })

  // Download file from URL
  handle('plugin-download', async (url: string, targetPath: string) => {
    try {
      return await downloadFile(url, targetPath)
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  })
}

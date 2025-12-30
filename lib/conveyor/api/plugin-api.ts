import { ConveyorApi } from '@/lib/preload/shared'

export interface PluginSource {
  type: 'builtin' | 'local' | 'git' | 'url' | 'npm'
  location: string
}

export class PluginApi extends ConveyorApi {
  /**
   * List all installed plugins
   */
  listInstalled = () => this.invoke('plugin-list-installed')

  /**
   * Get plugin manifest from a path
   */
  getManifest = (pluginPath: string) => this.invoke('plugin-get-manifest', pluginPath)

  /**
   * Install a plugin from a source
   */
  install = (source: PluginSource) => this.invoke('plugin-install', source)

  /**
   * Uninstall a plugin
   */
  uninstall = (pluginId: string) => this.invoke('plugin-uninstall', pluginId)

  /**
   * Enable or disable a plugin
   */
  setEnabled = (pluginId: string, enabled: boolean) =>
    this.invoke('plugin-set-enabled', pluginId, enabled)

  /**
   * Get the plugins directory path
   */
  getDirectory = () => this.invoke('plugin-get-directory')

  /**
   * Check if a path exists
   */
  pathExists = (checkPath: string) => this.invoke('plugin-path-exists', checkPath)

  /**
   * Read a file from a plugin directory
   */
  readFile = (pluginId: string, relativePath: string) =>
    this.invoke('plugin-read-file', pluginId, relativePath)

  /**
   * Clone a git repository
   */
  cloneRepo = (gitUrl: string, targetDir: string) =>
    this.invoke('plugin-clone-repo', gitUrl, targetDir)

  /**
   * Download a file from URL
   */
  download = (url: string, targetPath: string) =>
    this.invoke('plugin-download', url, targetPath)
}

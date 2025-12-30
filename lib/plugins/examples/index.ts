/**
 * Example Plugins
 *
 * These example plugins demonstrate the four plugin types:
 * - App: Full-screen applications (AI Code Review)
 * - Panel: Floating modals/sidebars (AI Chat Assistant)
 * - Widget: Embedded UI components (Commit Message Suggester)
 * - Service: Background services (Auto Fetch)
 */

export { aiReviewAppPlugin } from './ai-review-app'
export { aiChatPanelPlugin } from './ai-chat-panel'
export { commitSuggesterWidgetPlugin } from './commit-suggester-widget'
export { autoFetchServicePlugin } from './auto-fetch-service'

// Legacy example
export { commitAnalyzerPlugin } from './commit-analyzer-plugin'

import { aiReviewAppPlugin } from './ai-review-app'
import { aiChatPanelPlugin } from './ai-chat-panel'
import { commitSuggesterWidgetPlugin } from './commit-suggester-widget'
import { autoFetchServicePlugin } from './auto-fetch-service'

/**
 * All example plugins for easy registration
 */
export const examplePlugins = [
  aiReviewAppPlugin,
  aiChatPanelPlugin,
  commitSuggesterWidgetPlugin,
  autoFetchServicePlugin,
]

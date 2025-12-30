import { simpleGit, SimpleGit } from 'simple-git'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import { RepositoryContext, getRepositoryManager } from '@/lib/repositories'
import * as BranchService from '@/lib/services/branch'
import * as CommitService from '@/lib/services/commit'
import * as PRService from '@/lib/services/pr'
import * as WorktreeService from '@/lib/services/worktree'
import * as StashService from '@/lib/services/stash'
import * as StagingService from '@/lib/services/staging'

const execAsync = promisify(exec)
const statAsync = promisify(fs.stat)

// Legacy global state - maintained for backward compatibility
// New code should use RepositoryManager instead
// SAFETY: This state is kept in sync by RepositoryManager via setLegacySyncCallback
let git: SimpleGit | null = null
let repoPath: string | null = null

/**
 * Initialize the legacy sync callback
 * This ensures legacy state stays in sync with RepositoryManager
 * Call this once at application startup
 */
export function initializeLegacySync(): void {
  const manager = getRepositoryManager()
  manager.setLegacySyncCallback((newPath: string | null) => {
    if (newPath) {
      repoPath = newPath
      git = simpleGit(newPath)
    } else {
      repoPath = null
      git = null
    }
  })
}

/**
 * @deprecated Use RepositoryManager.open() instead
 * SAFETY: This function should only be called during the transition period.
 * Once all handlers use RepositoryManager, this will be removed.
 */
export function setRepoPath(newPath: string) {
  repoPath = newPath
  git = simpleGit(newPath)
}

/**
 * @deprecated Use RepositoryManager.getActive()?.path instead
 */
export function getRepoPath(): string | null {
  return repoPath
}

/**
 * Clear all legacy global state
 * Use this when you need to ensure no stale state exists
 */
export function clearLegacyState(): void {
  git = null
  repoPath = null
}

/**
 * Helper to get the active repository context
 * Throws if no repository is selected
 *
 * SAFETY: This function ONLY returns the RepositoryManager's active context.
 * It no longer falls back to legacy state to prevent state confusion.
 * If you need legacy compatibility during migration, use the legacy functions directly.
 */
function requireContext(): RepositoryContext {
  const manager = getRepositoryManager()
  const ctx = manager.getActive()
  if (ctx) return ctx

  // SAFETY: No longer falling back to legacy state
  // This prevents the scenario where operations act on the wrong repo
  // If there's no active context in RepositoryManager, we fail fast
  throw new Error('No repository selected. Use RepositoryManager.open() to select a repository.')
}

// Re-export BranchInfo from branch service for backward compatibility
export type { BranchInfo } from '@/lib/services/branch'

/**
 * Pure function: Get branches for a specific repository context
 * @deprecated Use BranchService.getBranches directly
 */
export const getBranchesForContext = BranchService.getBranches

/**
 * Get branches for the active repository
 */
export async function getBranches() {
  return BranchService.getBranches(requireContext())
}

/**
 * Pure function: Get branch metadata for a specific context
 * @deprecated Use BranchService.getBranchMetadata directly
 */
export const getBranchMetadataForContext = BranchService.getBranchMetadata

/**
 * Wrapper for backward compatibility
 */
export async function getBranchMetadata(branchName: string) {
  return BranchService.getBranchMetadata(requireContext(), branchName)
}

/**
 * Pure function: Get unmerged branches for a specific context
 * @deprecated Use BranchService.getUnmergedBranches directly
 */
export const getUnmergedBranchesForContext = BranchService.getUnmergedBranches

/**
 * Wrapper for backward compatibility
 */
export async function getUnmergedBranches(baseBranch: string = 'origin/master'): Promise<string[]> {
  return BranchService.getUnmergedBranches(requireContext(), baseBranch)
}

/**
 * Pure function: Fast branch loading for a specific context
 * Only gets basic info, no per-branch metadata
 * @deprecated Use BranchService.getBranchesBasic directly
 */
export const getBranchesBasicForContext = BranchService.getBranchesBasic

/**
 * Wrapper for backward compatibility
 * Fast branch loading - only gets basic info, no per-branch metadata
 * This is much faster for large repos (single git command vs 3*N commands)
 */
export async function getBranchesBasic() {
  return BranchService.getBranchesBasic(requireContext())
}

/**
 * Pure function: Full metadata loading for a specific context
 * Expensive - should be called in background after initial load
 * @deprecated Use BranchService.getBranchesWithMetadata directly
 */
export const getBranchesWithMetadataForContext = BranchService.getBranchesWithMetadata

/**
 * Wrapper for backward compatibility
 * Full metadata loading - expensive, should be called in background after initial load
 */
export async function getBranchesWithMetadata() {
  return BranchService.getBranchesWithMetadata(requireContext())
}

// Re-export worktree types from worktree service for backward compatibility
export type { WorktreeAgent, WorktreeActivityStatus, BasicWorktree, EnhancedWorktree } from '@/lib/services/worktree'

/**
 * Pure function: Get worktrees for a specific context
 * @deprecated Use WorktreeService.getWorktrees directly
 */
export const getWorktreesForContext = WorktreeService.getWorktrees

/**
 * Wrapper for backward compatibility
 */
export async function getWorktrees() {
  return WorktreeService.getWorktrees(requireContext())
}

/**
 * Pure function: Get enhanced worktrees with agent detection and metadata for a specific context
 * @deprecated Use WorktreeService.getEnhancedWorktrees directly
 */
export const getEnhancedWorktreesForContext = WorktreeService.getEnhancedWorktrees

/**
 * Wrapper for backward compatibility
 */
export async function getEnhancedWorktrees() {
  return WorktreeService.getEnhancedWorktrees(requireContext())
}

/**
 * Pure function: Check if there are uncommitted changes
 * @deprecated Use BranchService.hasUncommittedChanges directly
 */
export const hasUncommittedChangesForContext = BranchService.hasUncommittedChanges

/**
 * Wrapper for backward compatibility
 */
export async function hasUncommittedChanges(): Promise<boolean> {
  return BranchService.hasUncommittedChanges(requireContext())
}

/**
 * Pure function: Stash uncommitted changes for a specific context
 * @deprecated Use BranchService.stashChanges directly
 */
export const stashChangesForContext = BranchService.stashChanges

/**
 * Wrapper for backward compatibility
 */
export async function stashChanges(): Promise<{ stashed: boolean; message: string }> {
  return BranchService.stashChanges(requireContext())
}

/**
 * Pure function: Switch to a local branch for a specific context
 * @deprecated Use BranchService.checkoutBranch directly
 */
export const checkoutBranchForContext = BranchService.checkoutBranch

/**
 * Wrapper for backward compatibility
 */
export async function checkoutBranch(
  branchName: string
): Promise<{ success: boolean; message: string; stashed?: string }> {
  return BranchService.checkoutBranch(requireContext(), branchName)
}

/**
 * Pure function: Push a branch to origin for a specific context
 * @deprecated Use BranchService.pushBranch directly
 */
export const pushBranchForContext = BranchService.pushBranch

/**
 * Wrapper for backward compatibility
 */
export async function pushBranch(
  branchName?: string,
  setUpstream: boolean = true
): Promise<{ success: boolean; message: string }> {
  return BranchService.pushBranch(requireContext(), branchName, setUpstream)
}

/**
 * Pure function: Create a new branch for a specific context
 * @deprecated Use BranchService.createBranch directly
 */
export const createBranchForContext = BranchService.createBranch

/**
 * Wrapper for backward compatibility
 */
export async function createBranch(
  branchName: string,
  checkout: boolean = true
): Promise<{ success: boolean; message: string }> {
  return BranchService.createBranch(requireContext(), branchName, checkout)
}

/**
 * Pure function: Checkout a remote branch for a specific context
 * @deprecated Use BranchService.checkoutRemoteBranch directly
 */
export const checkoutRemoteBranchForContext = BranchService.checkoutRemoteBranch

/**
 * Wrapper for backward compatibility
 */
export async function checkoutRemoteBranch(
  remoteBranch: string
): Promise<{ success: boolean; message: string; stashed?: string }> {
  return BranchService.checkoutRemoteBranch(requireContext(), remoteBranch)
}

/**
 * Get the path of a worktree to open (identity function for compatibility)
 * @deprecated Use WorktreeService.getWorktreePath directly
 */
export const getWorktreePath = WorktreeService.getWorktreePath

// Re-export PR types from PR service for backward compatibility
export type { PullRequest, MergeMethod } from '@/lib/services/pr'

/**
 * Pure function: Get pull requests for a specific context
 * @deprecated Use PRService.getPullRequests directly
 */
export const getPullRequestsForContext = PRService.getPullRequests

/**
 * Fetch open pull requests using GitHub CLI
 */
export async function getPullRequests() {
  return PRService.getPullRequests(requireContext())
}

/**
 * Open a PR in the browser
 * Note: This function doesn't need context as it just opens a URL
 */
export const openPullRequest = PRService.openPullRequest

// Re-export CreatePROptions type
export type { CreatePROptions, MergePROptions } from '@/lib/services/pr'

/**
 * Pure function: Create a pull request for a specific context
 * @deprecated Use PRService.createPullRequest directly
 */
export const createPullRequestForContext = PRService.createPullRequest

/**
 * Create a new pull request
 */
export async function createPullRequest(options: {
  title: string
  body?: string
  headBranch?: string
  baseBranch?: string
  draft?: boolean
  web?: boolean
}) {
  return PRService.createPullRequest(requireContext(), options)
}

/**
 * Pure function: Merge a pull request for a specific context
 * @deprecated Use PRService.mergePullRequest directly
 */
export const mergePullRequestForContext = PRService.mergePullRequest

/**
 * Merge a pull request (full options)
 */
export async function mergePullRequest(
  prNumber: number,
  options?: {
    method?: 'merge' | 'squash' | 'rebase'
    deleteAfterMerge?: boolean
  }
) {
  return PRService.mergePullRequest(requireContext(), prNumber, options)
}

// ========================================
// PR Review Types and Functions
// ========================================

// Re-export PR detail types from PR service
export type { PRComment, PRReview, PRFile, PRCommit, PRReviewComment, PRDetail } from '@/lib/services/pr'

/**
 * Pure function: Get PR detail for a specific context
 * @deprecated Use PRService.getPRDetail directly
 */
export const getPRDetailForContext = PRService.getPRDetail

/**
 * Get detailed PR information including comments, reviews, files
 */
export async function getPRDetail(prNumber: number) {
  return PRService.getPRDetail(requireContext(), prNumber)
}

/**
 * Pure function: Get PR review comments for a specific context
 * @deprecated Use PRService.getPRReviewComments directly
 */
export const getPRReviewCommentsForContext = PRService.getPRReviewComments

/**
 * Get line-specific review comments for a PR
 */
export async function getPRReviewComments(prNumber: number) {
  return PRService.getPRReviewComments(requireContext(), prNumber)
}

/**
 * Pure function: Get PR file diff for a specific context
 * @deprecated Use PRService.getPRFileDiff directly
 */
export const getPRFileDiffForContext = PRService.getPRFileDiff

/**
 * Get the diff for a specific file in a PR
 */
export async function getPRFileDiff(prNumber: number, filePath: string) {
  return PRService.getPRFileDiff(requireContext(), prNumber, filePath)
}

/**
 * Pure function: Comment on a PR for a specific context
 * @deprecated Use PRService.commentOnPR directly
 */
export const commentOnPRForContext = PRService.commentOnPR

/**
 * Add a comment to a PR
 */
export async function commentOnPR(prNumber: number, body: string): Promise<{ success: boolean; message: string }> {
  return PRService.commentOnPR(requireContext(), prNumber, body)
}

/**
 * Pure function: Merge a PR for a specific context
 * @deprecated Use PRService.mergePR directly
 */
export const mergePRForContext = PRService.mergePR

/**
 * Merge a PR
 */
export async function mergePR(prNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase' = 'merge'): Promise<{ success: boolean; message: string }> {
  return PRService.mergePR(requireContext(), prNumber, mergeMethod)
}

/**
 * Pure function: Get GitHub URL for a specific context
 * @deprecated Use PRService.getGitHubUrl directly
 */
export const getGitHubUrlForContext = PRService.getGitHubUrl

/**
 * Get the GitHub remote URL for the repository
 */
export async function getGitHubUrl(): Promise<string | null> {
  return PRService.getGitHubUrl(requireContext())
}

/**
 * Pure function: Open a branch in GitHub for a specific context
 * @deprecated Use PRService.openBranchInGitHub directly
 */
export const openBranchInGitHubForContext = PRService.openBranchInGitHub

/**
 * Open a branch in GitHub
 */
export async function openBranchInGitHub(branchName: string): Promise<{ success: boolean; message: string }> {
  return PRService.openBranchInGitHub(requireContext(), branchName)
}

// Pull/fetch a remote branch
export async function pullBranch(remoteBranch: string): Promise<{ success: boolean; message: string }> {
  if (!git) throw new Error('No repository selected')

  try {
    // Extract remote and branch name
    const cleanBranch = remoteBranch.replace(/^remotes\//, '')
    const parts = cleanBranch.split('/')
    const remote = parts[0] // e.g., "origin"
    const branch = parts.slice(1).join('/') // e.g., "feature/something"

    // Fetch the specific branch
    await git.fetch(remote, branch)

    return { success: true, message: `Fetched ${branch} from ${remote}` }
  } catch (error) {
    return { success: false, message: (error as Error).message }
  }
}

// Re-export CommitInfo from commit service for backward compatibility
export type { CommitInfo } from '@/lib/services/commit'

/**
 * Pure function: Get commit history for a specific context
 * @deprecated Use CommitService.getCommitHistory directly
 */
export const getCommitHistoryForContext = CommitService.getCommitHistory

/**
 * Get recent commit history for the current branch
 */
export async function getCommitHistory(limit: number = 20) {
  return CommitService.getCommitHistory(requireContext(), limit)
}

// Re-export UncommittedFile from commit service for backward compatibility
export type { UncommittedFile } from '@/lib/services/commit'

/**
 * Pure function: Get uncommitted files for a specific context
 * @deprecated Use CommitService.getUncommittedFiles directly
 */
export const getUncommittedFilesForContext = CommitService.getUncommittedFiles

/**
 * Get list of uncommitted files (staged + unstaged + untracked)
 */
export async function getUncommittedFiles() {
  return CommitService.getUncommittedFiles(requireContext())
}

// Get working directory status summary
export interface WorkingStatus {
  hasChanges: boolean
  files: UncommittedFile[]
  stagedCount: number
  unstagedCount: number
  additions: number
  deletions: number
}

export async function getWorkingStatus(): Promise<WorkingStatus> {
  if (!git) throw new Error('No repository selected')

  const files = await getUncommittedFiles()
  const stagedCount = files.filter((f) => f.staged).length
  const unstagedCount = files.filter((f) => !f.staged).length

  // Get line change stats (both staged and unstaged)
  let additions = 0
  let deletions = 0
  try {
    // Get unstaged changes
    const unstagedDiff = await git.diff(['--stat'])
    if (unstagedDiff.trim()) {
      const lines = unstagedDiff.trim().split('\n')
      const summaryLine = lines[lines.length - 1]
      const addMatch = summaryLine.match(/(\d+) insertions?\(\+\)/)
      const delMatch = summaryLine.match(/(\d+) deletions?\(-\)/)
      additions += addMatch ? parseInt(addMatch[1]) : 0
      deletions += delMatch ? parseInt(delMatch[1]) : 0
    }

    // Get staged changes
    const stagedDiff = await git.diff(['--cached', '--stat'])
    if (stagedDiff.trim()) {
      const lines = stagedDiff.trim().split('\n')
      const summaryLine = lines[lines.length - 1]
      const addMatch = summaryLine.match(/(\d+) insertions?\(\+\)/)
      const delMatch = summaryLine.match(/(\d+) deletions?\(-\)/)
      additions += addMatch ? parseInt(addMatch[1]) : 0
      deletions += delMatch ? parseInt(delMatch[1]) : 0
    }
  } catch {
    // Ignore diff errors
  }

  return {
    hasChanges: files.length > 0,
    files,
    stagedCount,
    unstagedCount,
    additions,
    deletions,
  }
}

// Re-export ResetResult from commit service for backward compatibility
export type { ResetResult } from '@/lib/services/commit'

/**
 * Pure function: Reset to a specific commit for a specific context
 * @deprecated Use CommitService.resetToCommit directly
 */
export const resetToCommitForContext = CommitService.resetToCommit

/**
 * Reset to a specific commit
 */
export async function resetToCommit(
  commitHash: string,
  mode: 'soft' | 'mixed' | 'hard' = 'hard'
) {
  return CommitService.resetToCommit(requireContext(), commitHash, mode)
}

// Re-export commit detail types from commit service for backward compatibility
export type { CommitFileChange, CommitDetails } from '@/lib/services/commit'

/**
 * Pure function: Get commit details for a specific context
 * @deprecated Use CommitService.getCommitDetails directly
 */
export const getCommitDetailsForContext = CommitService.getCommitDetails

/**
 * Get detailed information about a specific commit
 */
export async function getCommitDetails(commitHash: string) {
  return CommitService.getCommitDetails(requireContext(), commitHash)
}

/**
 * Pure function: Get commit history for a specific ref and context
 * @deprecated Use CommitService.getCommitHistoryForRef directly
 */
export const getCommitHistoryForRefForContext = CommitService.getCommitHistoryForRef

/**
 * Get commit history for a specific branch/ref
 */
export async function getCommitHistoryForRef(ref: string, limit: number = 50) {
  return CommitService.getCommitHistoryForRef(requireContext(), ref, limit)
}

/**
 * Pure function: Convert a worktree to a branch for a specific context
 * @deprecated Use WorktreeService.convertWorktreeToBranch directly
 */
export const convertWorktreeToBranchForContext = WorktreeService.convertWorktreeToBranch

/**
 * Wrapper for backward compatibility
 */
export async function convertWorktreeToBranch(
  worktreePath: string
): Promise<{ success: boolean; message: string; branchName?: string }> {
  return WorktreeService.convertWorktreeToBranch(requireContext(), worktreePath)
}

/**
 * Pure function: Apply changes from a worktree to the main repo for a specific context
 * @deprecated Use WorktreeService.applyWorktreeChanges directly
 */
export const applyWorktreeChangesForContext = WorktreeService.applyWorktreeChanges

/**
 * Wrapper for backward compatibility
 */
export async function applyWorktreeChanges(worktreePath: string): Promise<{ success: boolean; message: string }> {
  return WorktreeService.applyWorktreeChanges(requireContext(), worktreePath)
}

/**
 * Pure function: Remove a worktree for a specific context
 * @deprecated Use WorktreeService.removeWorktree directly
 */
export const removeWorktreeForContext = WorktreeService.removeWorktree

/**
 * Wrapper for backward compatibility
 */
export async function removeWorktree(
  worktreePath: string,
  force: boolean = false
): Promise<{ success: boolean; message: string }> {
  return WorktreeService.removeWorktree(requireContext(), worktreePath, force)
}

// Re-export CreateWorktreeOptions from worktree service for backward compatibility
export type { CreateWorktreeOptions } from '@/lib/services/worktree'

/**
 * Pure function: Create a new worktree for a specific context
 * @deprecated Use WorktreeService.createWorktree directly
 */
export const createWorktreeForContext = WorktreeService.createWorktree

/**
 * Wrapper for backward compatibility
 */
export async function createWorktree(
  options: { branchName: string; isNewBranch: boolean; folderPath: string }
): Promise<{ success: boolean; message: string; path?: string }> {
  return WorktreeService.createWorktree(requireContext(), options)
}

/**
 * Pure function: Checkout a PR branch for a specific context
 * @deprecated Use PRService.checkoutPRBranch directly
 */
export const checkoutPRBranchForContext = PRService.checkoutPRBranch

/**
 * Checkout a PR branch (by branch name)
 */
export async function checkoutPRBranch(
  branchName: string
): Promise<{ success: boolean; message: string; stashed?: string }> {
  return PRService.checkoutPRBranch(requireContext(), branchName)
}

// ========================================
// Focus Mode APIs
// ========================================

// Re-export GraphCommit from commit service for backward compatibility
export type { GraphCommit } from '@/lib/services/commit'

/**
 * Pure function: Get commit graph history for a specific context
 * @deprecated Use CommitService.getCommitGraphHistory directly
 */
export const getCommitGraphHistoryForContext = CommitService.getCommitGraphHistory

/**
 * Get commit history with parent info for git graph
 * skipStats=true makes this much faster for initial load (100x fewer git commands)
 * showCheckpoints=false hides Conductor checkpoint commits (checkpoint:... messages)
 */
export async function getCommitGraphHistory(
  limit: number = 100,
  skipStats: boolean = false,
  showCheckpoints: boolean = false
) {
  return CommitService.getCommitGraphHistory(requireContext(), limit, skipStats, showCheckpoints)
}

// Re-export diff types from commit service for backward compatibility
export type { DiffFile, DiffHunk, DiffLine, FileDiff, CommitDiff } from '@/lib/services/commit'

/**
 * Pure function: Get commit diff for a specific context
 * @deprecated Use CommitService.getCommitDiff directly
 */
export const getCommitDiffForContext = CommitService.getCommitDiff

/**
 * Get diff for a specific commit
 */
export async function getCommitDiff(commitHash: string) {
  return CommitService.getCommitDiff(requireContext(), commitHash)
}

// Branch diff interface - shows diff between a branch and master/main
export interface BranchDiff {
  branchName: string
  baseBranch: string
  files: FileDiff[]
  totalAdditions: number
  totalDeletions: number
  commitCount: number
}

// Get diff for a branch compared to master/main
export async function getBranchDiff(branchName: string): Promise<BranchDiff | null> {
  if (!git) throw new Error('No repository selected')

  try {
    // Find the base branch (master or main)
    let baseBranch = 'origin/master'
    try {
      await git.raw(['rev-parse', '--verify', 'origin/master'])
    } catch {
      try {
        await git.raw(['rev-parse', '--verify', 'origin/main'])
        baseBranch = 'origin/main'
      } catch {
        // Try local master/main
        const branches = await git.branchLocal()
        if (branches.all.includes('main')) {
          baseBranch = 'main'
        } else if (branches.all.includes('master')) {
          baseBranch = 'master'
        } else {
          return null // No base branch found
        }
      }
    }

    // Count commits between base and branch
    let commitCount = 0
    try {
      const countOutput = await git.raw(['rev-list', '--count', `${baseBranch}..${branchName}`])
      commitCount = parseInt(countOutput.trim()) || 0
    } catch {
      // Ignore count errors
    }

    // Get diff between base and branch (three-dot syntax shows changes since branches diverged)
    const diffOutput = await git.raw(['diff', `${baseBranch}...${branchName}`, '--patch', '--stat'])

    if (!diffOutput.trim()) {
      return {
        branchName,
        baseBranch: baseBranch.replace('origin/', ''),
        files: [],
        totalAdditions: 0,
        totalDeletions: 0,
        commitCount,
      }
    }

    // Parse the diff output (same logic as getCommitDiff)
    const files: FileDiff[] = []
    let totalAdditions = 0
    let totalDeletions = 0

    // Split by file diffs
    const diffParts = diffOutput.split(/^diff --git /m).filter(Boolean)

    for (const part of diffParts) {
      const lines = part.split('\n')

      // Parse file header
      const headerMatch = lines[0].match(/a\/(.+) b\/(.+)/)
      if (!headerMatch) continue

      const oldPath = headerMatch[1]
      const newPath = headerMatch[2]

      // Determine status
      let status: 'added' | 'modified' | 'deleted' | 'renamed' = 'modified'
      if (part.includes('new file mode')) status = 'added'
      else if (part.includes('deleted file mode')) status = 'deleted'
      else if (oldPath !== newPath) status = 'renamed'

      // Check for binary
      const isBinary = part.includes('Binary files')

      // Parse hunks
      const hunks: DiffHunk[] = []
      let fileAdditions = 0
      let fileDeletions = 0

      if (!isBinary) {
        const hunkMatches = part.matchAll(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/g)

        for (const match of hunkMatches) {
          const oldStart = parseInt(match[1])
          const oldLinesCount = match[2] ? parseInt(match[2]) : 1
          const newStart = parseInt(match[3])
          const newLinesCount = match[4] ? parseInt(match[4]) : 1

          // Find the lines after this hunk header
          const hunkStartIndex = part.indexOf(match[0])
          const hunkContent = part.slice(hunkStartIndex + match[0].length)
          const hunkLines: DiffLine[] = []

          let oldLine = oldStart
          let newLine = newStart

          for (const line of hunkContent.split('\n')) {
            if (line.startsWith('@@') || line.startsWith('diff --git')) break

            if (line.startsWith('+') && !line.startsWith('+++')) {
              hunkLines.push({ type: 'add', content: line.slice(1), newLineNumber: newLine })
              newLine++
              fileAdditions++
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              hunkLines.push({ type: 'delete', content: line.slice(1), oldLineNumber: oldLine })
              oldLine++
              fileDeletions++
            } else if (line.startsWith(' ')) {
              hunkLines.push({
                type: 'context',
                content: line.slice(1),
                oldLineNumber: oldLine,
                newLineNumber: newLine,
              })
              oldLine++
              newLine++
            }
          }

          hunks.push({
            oldStart,
            oldLines: oldLinesCount,
            newStart,
            newLines: newLinesCount,
            lines: hunkLines,
          })
        }
      }

      totalAdditions += fileAdditions
      totalDeletions += fileDeletions

      files.push({
        file: {
          path: newPath,
          status,
          additions: fileAdditions,
          deletions: fileDeletions,
          oldPath: status === 'renamed' ? oldPath : undefined,
        },
        hunks,
        isBinary,
      })
    }

    return {
      branchName,
      baseBranch: baseBranch.replace('origin/', ''),
      files,
      totalAdditions,
      totalDeletions,
      commitCount,
    }
  } catch (error) {
    console.error('Error getting branch diff:', error)
    return null
  }
}

// Re-export stash types from stash service for backward compatibility
export type { StashEntry, StashFile } from '@/lib/services/stash'

/**
 * Pure function: Get stashes for a specific context
 * @deprecated Use StashService.getStashes directly
 */
export const getStashesForContext = StashService.getStashes

/**
 * Get list of stashes
 */
export async function getStashes() {
  return StashService.getStashes(requireContext())
}

/**
 * Pure function: Get stash files for a specific context
 * @deprecated Use StashService.getStashFiles directly
 */
export const getStashFilesForContext = StashService.getStashFiles

/**
 * Get files changed in a stash
 */
export async function getStashFiles(stashIndex: number) {
  return StashService.getStashFiles(requireContext(), stashIndex)
}

/**
 * Pure function: Get stash file diff for a specific context
 * @deprecated Use StashService.getStashFileDiff directly
 */
export const getStashFileDiffForContext = StashService.getStashFileDiff

/**
 * Get diff for a specific file in a stash
 */
export async function getStashFileDiff(stashIndex: number, filePath: string): Promise<string | null> {
  return StashService.getStashFileDiff(requireContext(), stashIndex, filePath)
}

/**
 * Pure function: Get stash diff for a specific context
 * @deprecated Use StashService.getStashDiff directly
 */
export const getStashDiffForContext = StashService.getStashDiff

/**
 * Get full diff for a stash
 */
export async function getStashDiff(stashIndex: number): Promise<string | null> {
  return StashService.getStashDiff(requireContext(), stashIndex)
}

/**
 * Pure function: Apply stash for a specific context
 * @deprecated Use StashService.applyStash directly
 */
export const applyStashForContext = StashService.applyStash

/**
 * Apply a stash (keeps stash in list)
 */
export async function applyStash(stashIndex: number): Promise<{ success: boolean; message: string }> {
  return StashService.applyStash(requireContext(), stashIndex)
}

/**
 * Pure function: Pop stash for a specific context
 * @deprecated Use StashService.popStash directly
 */
export const popStashForContext = StashService.popStash

/**
 * Pop a stash (applies and removes from list)
 */
export async function popStash(stashIndex: number): Promise<{ success: boolean; message: string }> {
  return StashService.popStash(requireContext(), stashIndex)
}

/**
 * Pure function: Drop stash for a specific context
 * @deprecated Use StashService.dropStash directly
 */
export const dropStashForContext = StashService.dropStash

/**
 * Drop a stash (removes without applying)
 */
export async function dropStash(stashIndex: number): Promise<{ success: boolean; message: string }> {
  return StashService.dropStash(requireContext(), stashIndex)
}

/**
 * Pure function: Create branch from stash for a specific context
 * @deprecated Use StashService.stashToBranch directly
 */
export const stashToBranchForContext = StashService.stashToBranch

/**
 * Create a branch from a stash
 */
export async function stashToBranch(
  stashIndex: number,
  branchName: string
): Promise<{ success: boolean; message: string }> {
  return StashService.stashToBranch(requireContext(), stashIndex, branchName)
}

// ========================================
// Staging & Commit Functions
// ========================================

// Re-export staging types from staging service for backward compatibility
export type { StagingDiffHunk, StagingDiffLine, StagingFileDiff } from '@/lib/services/staging'

/**
 * Pure function: Stage file for a specific context
 * @deprecated Use StagingService.stageFile directly
 */
export const stageFileForContext = StagingService.stageFile

/**
 * Stage a single file
 */
export async function stageFile(filePath: string): Promise<{ success: boolean; message: string }> {
  return StagingService.stageFile(requireContext(), filePath)
}

/**
 * Pure function: Unstage file for a specific context
 * @deprecated Use StagingService.unstageFile directly
 */
export const unstageFileForContext = StagingService.unstageFile

/**
 * Unstage a single file
 */
export async function unstageFile(filePath: string): Promise<{ success: boolean; message: string }> {
  return StagingService.unstageFile(requireContext(), filePath)
}

/**
 * Pure function: Stage all for a specific context
 * @deprecated Use StagingService.stageAll directly
 */
export const stageAllForContext = StagingService.stageAll

/**
 * Stage all changes
 */
export async function stageAll(): Promise<{ success: boolean; message: string }> {
  return StagingService.stageAll(requireContext())
}

/**
 * Pure function: Unstage all for a specific context
 * @deprecated Use StagingService.unstageAll directly
 */
export const unstageAllForContext = StagingService.unstageAll

/**
 * Unstage all changes
 */
export async function unstageAll(): Promise<{ success: boolean; message: string }> {
  return StagingService.unstageAll(requireContext())
}

/**
 * Pure function: Discard file changes for a specific context
 * @deprecated Use StagingService.discardFileChanges directly
 */
export const discardFileChangesForContext = StagingService.discardFileChanges

/**
 * Discard changes in a file (revert to last commit)
 */
export async function discardFileChanges(filePath: string): Promise<{ success: boolean; message: string }> {
  return StagingService.discardFileChanges(requireContext(), filePath)
}

/**
 * Pure function: Get file diff for a specific context
 * @deprecated Use StagingService.getFileDiff directly
 */
export const getFileDiffForContext = StagingService.getFileDiff

/**
 * Get diff for a specific file
 */
export async function getFileDiff(filePath: string, staged: boolean) {
  return StagingService.getFileDiff(requireContext(), filePath, staged)
}

// Pull current branch from origin (with rebase to avoid merge commits)
// Pull current branch from origin (with rebase to avoid merge commits)
// Ledger Opinion: Auto-stashes uncommitted changes, pulls, then restores them
// Git is overly cautious - it refuses to pull with ANY uncommitted changes.
// We're smarter: stash, pull, unstash. Only fail on real conflicts.
export async function pullCurrentBranch(): Promise<{
  success: boolean
  message: string
  hadConflicts?: boolean
  autoStashed?: boolean
}> {
  if (!git) throw new Error('No repository selected')

  let didStash = false

  try {
    const currentBranch = (await git.branchLocal()).current
    if (!currentBranch) {
      return { success: false, message: 'Not on a branch (detached HEAD state)' }
    }

    // Fetch first to get the latest refs
    await git.fetch('origin', currentBranch)

    // Check if there are remote changes to pull
    const statusBefore = await git.status()
    if (statusBefore.behind === 0) {
      return { success: true, message: 'Already up to date' }
    }

    // Check if we have uncommitted changes
    const hasUncommittedChanges =
      statusBefore.modified.length > 0 ||
      statusBefore.not_added.length > 0 ||
      statusBefore.created.length > 0 ||
      statusBefore.deleted.length > 0 ||
      statusBefore.staged.length > 0

    // Auto-stash if we have uncommitted changes
    if (hasUncommittedChanges) {
      await git.raw(['stash', 'push', '--include-untracked', '-m', 'ledger-auto-stash-for-pull'])
      didStash = true
    }

    // Pull with rebase
    await git.pull('origin', currentBranch, ['--rebase'])

    // Restore stashed changes
    if (didStash) {
      try {
        await git.raw(['stash', 'pop'])
        return {
          success: true,
          message: `Pulled ${statusBefore.behind} commit${statusBefore.behind > 1 ? 's' : ''} and restored your uncommitted changes`,
          autoStashed: true,
        }
      } catch (stashError) {
        const stashMsg = (stashError as Error).message
        if (stashMsg.includes('conflict') || stashMsg.includes('CONFLICT')) {
          return {
            success: true,
            message: 'Pulled successfully, but restoring your changes caused conflicts. Please resolve them.',
            hadConflicts: true,
            autoStashed: true,
          }
        }
        // Stash pop failed for other reason - leave it in stash list
        return {
          success: true,
          message: 'Pulled successfully. Your changes are in the stash (run git stash pop to restore).',
          autoStashed: true,
        }
      }
    }

    return {
      success: true,
      message: `Pulled ${statusBefore.behind} commit${statusBefore.behind > 1 ? 's' : ''} from origin`,
    }
  } catch (error) {
    const errorMessage = (error as Error).message

    // If we stashed but pull failed, try to restore
    if (didStash) {
      try {
        await git.raw(['stash', 'pop'])
      } catch {
        // Stash restore failed - it's still in stash list, user can recover
      }
    }

    // Check for merge/rebase conflicts
    if (
      errorMessage.includes('conflict') ||
      errorMessage.includes('CONFLICT') ||
      errorMessage.includes('Merge conflict') ||
      errorMessage.includes('could not apply')
    ) {
      try {
        await git.rebase(['--abort'])
      } catch {
        /* ignore */
      }
      return {
        success: false,
        message: 'Pull failed due to conflicts with incoming changes. Please resolve manually.',
        hadConflicts: true,
      }
    }

    // No tracking branch - this is fine for new branches
    if (errorMessage.includes('no tracking') || errorMessage.includes("doesn't track")) {
      return { success: true, message: 'No remote tracking branch (will be created on push)' }
    }

    return { success: false, message: errorMessage }
  }
}

// Re-export CommitResult from commit service for backward compatibility
export type { CommitResult } from '@/lib/services/commit'

/**
 * Pure function: Commit staged changes for a specific context
 * @deprecated Use CommitService.commitChanges directly
 */
export const commitChangesForContext = CommitService.commitChanges

/**
 * Commit staged changes
 * Ledger Opinion: Check if origin has moved ahead before committing.
 * If behind, return behindCount so UI can prompt user to pull first or commit ahead.
 */
export async function commitChanges(
  message: string,
  description?: string,
  force: boolean = false
) {
  return CommitService.commitChanges(requireContext(), message, description, force)
}

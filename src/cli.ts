#!/usr/bin/env node

import { existsSync } from 'fs'
import { resolve } from 'path'
import { startStorybookServer } from './commands/storybook.js'
import { buildStorybook, buildBlocks } from './commands/build.js'

async function main() {
  const args = process.argv.slice(2)

  // Parse command and flags
  let command: string
  let targetPath: string
  let outDir: string | undefined
  let buildBlocksIndividually = false

  // Handle flags
  let individuallyIndex = args.indexOf('--individually')
  if (individuallyIndex !== -1) {
    buildBlocksIndividually = true
    args.splice(individuallyIndex, 1)
  }

  if (args.length === 0) {
    // No arguments - default to storybook in current directory
    command = 'storybook'
    targetPath = process.cwd()
  } else if (args[0] === 'storybook' || args[0] === 'build') {
    // Explicit command
    command = args[0]
    targetPath = args[1] ?? process.cwd()
    outDir = args[2] // Optional output directory for build command
  } else {
    console.error('❌ Unknown command')
    console.error('Usage: blockparty [storybook|build] [flags] [path] [outDir]')
    console.error('')
    console.error('Commands:')
    console.error('  storybook  Start storybook dev server (default)')
    console.error('  build      Build storybook to static files')
    console.error('')
    console.error('Arguments:')
    console.error('  path       Path to Block or root directory for Blocks (default: current directory)')
    console.error('  outDir     Output directory for build (default: dist)')
    console.error('')
    console.error('Build Flags:')
    console.error('  --individually  Bundle each block individually')
    process.exit(1)
  }

  // Resolve the path
  const resolvedPath = resolve(process.cwd(), targetPath)

  if (!existsSync(resolvedPath)) {
    console.error(`❌ Path not found: ${resolvedPath}`)
    process.exit(1)
  }

  // Run the appropriate command
  if (command === 'storybook') {
    await startStorybookServer(resolvedPath)
  } else if (command === 'build') {
    if (outDir === undefined) {
      outDir = 'dist'
    }
    if (buildBlocksIndividually) {
      await buildBlocks(resolvedPath, outDir)
    } else {
      await buildStorybook(resolvedPath, outDir)
    }
  }
}

main().catch(error => {
  console.error('Failed to run Block Party:', error)
  process.exit(1)
})

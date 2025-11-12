#!/usr/bin/env node

import { existsSync } from 'fs'
import { stat } from 'fs/promises'
import { resolve, dirname } from 'path'
import { startStorybook } from './commands/storybook.js'
import { buildBlocks } from './commands/build.js'

async function main() {
  const args = process.argv.slice(2)

  // Parse command and path
  let command = 'storybook'
  let targetPath: string

  if (args.length === 0) {
    // No arguments - default to storybook in current directory
    targetPath = process.cwd()
  } else if (args[0] === 'storybook' || args[0] === 'build') {
    // Explicit command
    command = args[0]
    targetPath = args[1] || process.cwd()
  } else {
    console.error('❌ Unknown command')
    console.error('Usage: blockparty [storybook|build] [path]')
    console.error('')
    console.error('Commands:')
    console.error('  storybook  Start interactive storybook (default)')
    console.error('  build      Build blocks for production')
    console.error('')
    console.error('Path can be:')
    console.error('  - A directory containing Blocks')
    console.error('  - A .ts or .tsx file to treat as a Block')
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
    await startStorybook(resolvedPath)
  } else if (command === 'build') {
    await buildBlocks(resolvedPath)
  }
}

main().catch(error => {
  console.error('Failed to run Block Party:', error)
  process.exit(1)
})

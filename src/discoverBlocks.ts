import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { extractPropsFromFile, type PropDefinition } from './extractProps.js'

export interface BlockInfo {
  name: string
  path: string
  props: PropDefinition[]
}

export async function discoverBlocks(targetPath: string): Promise<BlockInfo[]> {
  const blocks: BlockInfo[] = []

  // Check if the path is a file
  const stats = await stat(targetPath)

  if (stats.isFile()) {
    // If it's a specific file, treat it as a single block
    if (targetPath.endsWith('.ts') || targetPath.endsWith('.tsx')) {
      const props = await extractPropsFromFile(targetPath)
      const blockDir = dirname(targetPath)
      const blockName = basename(blockDir)

      blocks.push({
        name: blockName,
        path: targetPath,
        props
      })
      return blocks
    } else {
      throw new Error(`File must be a .ts or .tsx file: ${targetPath}`)
    }
  }

  // Otherwise, it's a directory - check if it's a Block itself
  const hasIndexTs = existsSync(join(targetPath, 'index.ts'))
  const hasIndexTsx = existsSync(join(targetPath, 'index.tsx'))

  if (hasIndexTs || hasIndexTsx) {
    // Current directory is a Block
    const indexPath = hasIndexTsx ? join(targetPath, 'index.tsx') : join(targetPath, 'index.ts')
    const props = await extractPropsFromFile(indexPath)

    blocks.push({
      name: 'Block',
      path: indexPath,
      props
    })
    return blocks
  }

  // Check subdirectories for Blocks
  try {
    const entries = await readdir(targetPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const dirPath = join(targetPath, entry.name)
        const indexTsPath = join(dirPath, 'index.ts')
        const indexTsxPath = join(dirPath, 'index.tsx')
        const hasIndexTs = existsSync(indexTsPath)
        const hasIndexTsx = existsSync(indexTsxPath)

        if (hasIndexTs || hasIndexTsx) {
          const indexPath = hasIndexTsx ? indexTsxPath : indexTsPath
          const props = await extractPropsFromFile(indexPath)

          blocks.push({
            name: entry.name,
            path: indexPath,
            props
          })
        }
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error)
  }

  return blocks
}

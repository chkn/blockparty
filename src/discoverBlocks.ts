import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { extractPropsFromFile, type PropDefinition } from './extractProps.js'
import { type BlockMetadata, parseReadmeMetadata } from './parseReadme.js'

export interface BlockInfo extends BlockMetadata {
  name: string
  path: string
  propDefinitions: PropDefinition[]
}

async function getBlockInfo(path: string): Promise<BlockInfo | undefined> {
  let blockDir: string
  let indexPath: string

  const targetStat = await stat(path)
  if (targetStat.isFile()) {
    blockDir = dirname(path)
    indexPath = path
  } else {
    blockDir = path

    const indexTsPath = join(blockDir, 'index.ts')
    const indexTsxPath = join(blockDir, 'index.tsx')
    if (existsSync(indexTsxPath)) {
      indexPath = indexTsxPath
    } else if (existsSync(indexTsPath)) {
      indexPath = indexTsPath
    } else {
      return undefined
    }
  }
  const propDefinitions = await extractPropsFromFile(indexPath)
  const blockName = basename(blockDir)
  const metadata = await parseReadmeMetadata(blockDir)

  return {
    ...metadata,
    name: metadata.name ?? blockName,
    path: indexPath,
    propDefinitions
  }
}

export async function discoverBlocks(targetPath: string): Promise<BlockInfo[]> {
  const blocks: BlockInfo[] = []

  const blockInfo = await getBlockInfo(targetPath)
  if (blockInfo) {
    blocks.push(blockInfo)
    return blocks
  }

  // Check subdirectories for Blocks
  try {
    const entries = await readdir(targetPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const dirPath = join(targetPath, entry.name)
        const blockInfo = await getBlockInfo(dirPath)

        if (blockInfo) {
          blocks.push(blockInfo)
        }
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error)
  }

  return blocks
}

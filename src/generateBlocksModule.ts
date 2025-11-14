import type { BlockInfo } from './discoverBlocks.js'
import type { RuntimeBlockInfo } from './templates/PropsEditor.js'

export async function generateBlocksModule(blocks: BlockInfo[]): Promise<string> {
  // Generate block imports
  const imports = blocks.map((block, idx) =>
    `import Block${idx} from '${block.path.replace(/\\/g, '/')}'`
  ).join('\n')

  // Generate block configs
  const blockConfigs = blocks.map((block, idx) => {
    const blockInfo: RuntimeBlockInfo = {
      name: block.name,
      description: block.description,
      propDefinitions: block.propDefinitions,
      Component: null as any  // Placeholder
    }
    return JSON.stringify(blockInfo).replace('null', `Block${idx}`)
  }).join(',\n')

  return `${imports}

export const blocks = [
${blockConfigs}
]
`
}

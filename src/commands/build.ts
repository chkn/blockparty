import { discoverBlocks } from '../discoverBlocks.js'

export async function buildBlocks(targetPath: string) {
  console.log('🏗️  Building Blocks...')
  console.log(`📂 Target: ${targetPath}\n`)

  const blocks = await discoverBlocks(targetPath)

  if (blocks.length === 0) {
    console.error('❌ No Blocks found!')
    console.error('A Block should have an index.ts or index.tsx file with:')
    console.error('  - An exported Props interface')
    console.error('  - A default exported function component')
    process.exit(1)
  }

  console.log(`✅ Found ${blocks.length} Block(s):`)
  blocks.forEach(block => {
    console.log(`   - ${block.name}`)
  })
  console.log()

  // TODO: Implement build logic
  console.log('⚠️  Build command not yet implemented')
}

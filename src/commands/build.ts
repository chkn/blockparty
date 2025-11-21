import { resolve } from 'path'
import { mkdir, writeFile, rm, readFile } from 'fs/promises'
import { build as viteBuild } from 'vite'
import type { PackageJson } from 'type-fest'
import { templatesDir, getViteResolveConfig, getVitePlugins } from '../viteConfig.js'
import { discoverBlocksAndGenerateModule } from './shared.js'
import { discoverBlocks } from '../discoverBlocks.js'

export async function buildStorybook(targetPath: string, outDir: string) {
  console.log('🏗️  Building Storybook...')
  console.log(`📂 Target: ${targetPath}`)
  console.log(`📦 Output: ${outDir}\n`)

  const blocksModule = await discoverBlocksAndGenerateModule(targetPath)

  // Create a temporary directory for the virtual blocks module
  const tempDir = resolve(process.cwd(), '.blockparty-build')
  await mkdir(tempDir, { recursive: true })
  const blocksPath = resolve(tempDir, 'blocks.ts')
  await writeFile(blocksPath, blocksModule)

  console.log('📝 Generating static bundle...')

  try {
    // Build with Vite
    const viteResolve = getViteResolveConfig()
    await viteBuild({
      root: templatesDir,
      base: './',
      resolve: {
        ...viteResolve,
        alias: {
          ...viteResolve.alias,
          './blocks': blocksPath,
          './blocks.ts': blocksPath
        }
      },
      plugins: getVitePlugins(),
      build: {
        outDir: resolve(process.cwd(), outDir),
        minify: true,
        emptyOutDir: true,
        rollupOptions: {
          input: resolve(templatesDir, 'index.html')
        }
      }
    })

    console.log(`\n✅ Build complete! Output in ${outDir}/`)
  } catch (error) {
    console.error('\n❌ Build failed:', error)
    process.exit(1)
  } finally {
    // Clean up temporary directory
    await rm(tempDir, { recursive: true, force: true })
  }
}

export async function buildBlocks(targetPath: string, outDir: string) {
  console.log('🏗️  Building Blocks...')
  console.log(`📂 Target: ${targetPath}`)
  console.log(`📦 Output: ${outDir}\n`)

  const blocks = await discoverBlocks(targetPath)

  if (blocks.length === 0) {
    console.error('❌ No Blocks found!')
    process.exit(1)
  }

  console.log(`✅ Found ${blocks.length} Block(s):`)
  blocks.forEach(block => {
    console.log(`   - ${block.name}`)
  })
  console.log()

  const outputDir = resolve(process.cwd(), outDir)
  await mkdir(outputDir, { recursive: true })

  const viteResolve = getViteResolveConfig()
  const externalDeps = Object.keys(viteResolve.alias) as (keyof typeof viteResolve.alias)[]

  const importMap: Record<string, string> = {}

  console.log('📦 Bundling external dependencies...\n')

  // Build each package
  for (const dep of externalDeps) {
    // Skip subpath imports
    if (dep.includes('/')) {
      continue
    }

    const depPath = viteResolve.alias[dep]
    const packageJsonPath = resolve(depPath, 'package.json')
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8')) as PackageJson
    const version = packageJson.version ?? 'latest'

    // Determine entry point
    const entryPoint = packageJson.module ?? packageJson.main ?? 'index.js'
    const entryPath = resolve(depPath, entryPoint)

    console.log(`   Bundling ${dep}...`)

    // Get the list of other external deps to keep external
    // (sort these with subpath imports first to work around https://github.com/esm-dev/esm.sh/issues/698)
    const otherExternalDeps = externalDeps.filter(d => d !== dep).sort((a, b) => {
      if (a.includes('/')) return -1
      if (b.includes('/')) return 1
      return a.localeCompare(b)
    })

    // Get any subpath imports for this dep
    const subDepEntryPaths: string[] = []
    if (typeof packageJson.exports === 'object' && !Array.isArray(packageJson.exports)) {
      for (const d of externalDeps) {
        if (d.startsWith(`${dep}/`)) {
          const key = d.replace(`${dep}/`, './')
          const entry = packageJson.exports?.[key]
          if (typeof entry === 'string') {
            subDepEntryPaths.push(resolve(depPath, entry))
          }
        }
      }
    }

    try {
      await viteBuild({
        build: {
          lib: {
            entry: [entryPath, ...subDepEntryPaths],
            formats: ['es'],
            fileName: (_, entry) => `${(entry == 'index' ? dep : entry).replace('/', '-')}.js`
          },
          outDir: resolve(outputDir, 'deps'),
          minify: true,
          emptyOutDir: false,
          rollupOptions: {
            external: otherExternalDeps
          }
        }
      })

      // Add to import map
      importMap[dep] = `https://esm.sh/${dep}@${version}?external=${otherExternalDeps.join(',')}`
    } catch (error) {
      console.error(`   ❌ Failed to bundle ${dep}:`, error)
      process.exit(1)
    }
  }

  console.log()

  // Write import map
  await writeFile(
    resolve(outputDir, 'importmap.json'),
    JSON.stringify({ imports: importMap }, null, 2)
  )

  console.log('📝 Bundling individual blocks...\n')

  // Build each block individually
  for (const block of blocks) {
    console.log(`   Building ${block.name}...`)

    // Sanitize block name for filename (replace spaces and special chars)
    const safeFileName = block.name.replace(/[^a-zA-Z0-9-_]/g, '-')

    try {
      await viteBuild({
        build: {
          lib: {
            entry: block.path,
            formats: ['es'],
            fileName: () => `${safeFileName}.js`
          },
          outDir: outputDir,
          minify: true,
          emptyOutDir: false,
          rollupOptions: {
            external: externalDeps
          }
        },
        plugins: getVitePlugins()
      })
    } catch (error) {
      console.error(`   ❌ Failed to build ${block.name}:`, error)
      process.exit(1)
    }
  }

  console.log(`\n✅ Build complete! Output in ${outDir}/`)
  console.log(`   Import map: ${outDir}/importmap.json`)
}

import fs from 'node:fs/promises'
import path from 'node:path'
import type { Options } from 'tsup'
import { defineConfig } from 'tsup'

async function writeCommonJSEntry() {
  await fs.writeFile(
    path.join('dist/cjs/', 'index.js'),
    `'use strict'
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./reselect.production.min.cjs')
} else {
  module.exports = require('./reselect.development.cjs')
}`
  )
}

const tsconfig = 'tsconfig.build.json' satisfies Options['tsconfig']

export default defineConfig((options): Options[] => {
  const commonOptions: Options = {
    entry: {
      reselect: 'src/index.ts'
    },
    sourcemap: true,
    target: ['esnext'],
    tsconfig,
    clean: true,
    ...options
  }

  return [
    {
      ...commonOptions,
      name: 'Modern ESM',
      target: ['esnext'],
      format: ['esm'],
      outExtension: () => ({ js: '.mjs' })
    },

    // Support Webpack 4 by pointing `"module"` to a file with a `.js` extension
    // and optional chaining compiled away
    {
      ...commonOptions,
      name: 'Legacy ESM, Webpack 4',
      entry: {
        'reselect.legacy-esm': 'src/index.ts'
      },
      format: ['esm'],
      outExtension: () => ({ js: '.js' }),
      target: ['es2017']
    },

    // Meant to be served up via CDNs like `unpkg`.
    {
      ...commonOptions,
      name: 'Browser-ready ESM',
      entry: {
        'reselect.browser': 'src/index.ts'
      },
      platform: 'browser',
      env: {
        NODE_ENV: 'production'
      },
      format: ['esm'],
      outExtension: () => ({ js: '.mjs' }),
      minify: true
    },
    {
      ...commonOptions,
      name: 'CJS Development',
      entry: {
        'reselect.development': 'src/index.ts'
      },
      env: {
        NODE_ENV: 'development'
      },
      format: ['cjs'],
      outDir: './dist/cjs/',
      outExtension: () => ({ js: '.cjs' })
    },
    {
      ...commonOptions,
      name: 'CJS production',
      entry: {
        'reselect.production.min': 'src/index.ts'
      },
      env: {
        NODE_ENV: 'production'
      },
      format: ['cjs'],
      outDir: './dist/cjs/',
      outExtension: () => ({ js: '.cjs' }),
      minify: true,
      onSuccess: async () => {
        await writeCommonJSEntry()
      }
    },
    {
      ...commonOptions,
      name: 'CJS Type Definitions',
      format: ['cjs'],
      dts: { only: true }
    }
  ]
})

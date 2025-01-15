#!/usr/bin/env node
import { execaSync } from 'execa'
import { globbySync } from 'globby'
import { createRequire } from 'node:module'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const transformerDirectory = path.join(
  __dirname,
  '..',
  'transforms',
  `${process.argv[2]}/index.ts`,
)

const jscodeshiftExecutable = require.resolve('.bin/jscodeshift')

const extensions = 'ts,js,tsx,jsx,mts,mjs,cts,cjs'

execaSync(
  jscodeshiftExecutable,
  [
    '-t',
    transformerDirectory,
    '--extensions',
    extensions,
    ...(process.argv.slice(3).length === 1
      ? globbySync(process.argv[3])
      : globbySync(process.argv.slice(3))),
  ],
  {
    stdio: 'inherit',
    stripFinalNewline: false,
  },
)

#!/usr/bin/env node --import=tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

const gitRev = process.argv[2]

const packagePath = path.join(import.meta.dirname, '../package.json')
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))

pkg.version = `${pkg.version}-${gitRev}`
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2))

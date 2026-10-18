/**
 * 把 lib/lines.js 里的全部台词导出成 JSON（stdout），供配音脚本消费。
 * @example node scripts/export-lines.mjs
 */
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { allLines } = await import(pathToFileURL(join(root, 'lib/lines.js')).href)

const lines = [...new Set(allLines())]
process.stdout.write(JSON.stringify(lines, null, 2))

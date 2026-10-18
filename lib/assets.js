/**
 * 素材路由：把 assets/ 下的文件按 `/dsh-begin/<文件名>` 伺服出去。
 *
 * 为什么不内联 base64：立绘压到 WebP 也有 300KB 左右，内联进 index.html
 * 会让首帧一直等到这 300KB 下载并解析完；独立 URL 则由浏览器并行取，
 * 且能被 `<link rel=preload>` 提前。
 */

import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'

/** 素材路由前缀，同时也是注入脚本里的引用前缀。 */
export const ASSET_PREFIX = '/dsh-begin'

const CONTENT_TYPES = {
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

/**
 * 建一个只读的静态文件处理器。
 * @param assetsDir - 允许读取的根目录（绝对路径）。
 * @returns webserver 的 handler。
 */
export function createAssetHandler(assetsDir) {
  const root = assetsDir.endsWith(sep) ? assetsDir : assetsDir + sep

  return async function handleAsset(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      res.end()
      return
    }

    let relative
    try {
      const { pathname } = new URL(req.url ?? '/', 'http://x')
      relative = decodeURIComponent(pathname.slice(ASSET_PREFIX.length))
    } catch {
      res.writeHead(400)
      res.end()
      return
    }

    // 归一化后必须仍在 assets 根目录内：挡掉 ../ 穿越。
    const file = join(assetsDir, normalize(relative))
    if (!file.startsWith(root)) {
      res.writeHead(403)
      res.end()
      return
    }

    try {
      const info = await stat(file)
      if (!info.isFile()) throw new Error('not a file')
      res.writeHead(200, {
        'cache-control': 'no-cache',
        'content-length': String(info.size),
        'content-type': CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
      })
      if (req.method === 'HEAD') {
        res.end()
        return
      }
      createReadStream(file).pipe(res)
    } catch {
      res.writeHead(404)
      res.end()
    }
  }
}

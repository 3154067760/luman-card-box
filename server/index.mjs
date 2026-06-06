#!/usr/bin/env node
/**
 * 卢曼卡片盒 · 生产服务：静态站点 + 单用户同步 API（无需密钥）
 */
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, 'data', 'zettelkasten.json')
const DIST = path.join(__dirname, '..', 'dist')
const PORT = Number(process.env.PORT || 3005)
const HOST = process.env.HOST || '0.0.0.0'

const EMPTY = {
  version: 1,
  exportedAt: new Date(0).toISOString(),
  cards: [],
  links: [],
  tags: [],
  cardTags: [],
  tombstones: [],
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

async function handleSync(req, res) {
  if (req.method === 'GET') {
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf8')
      cors(res)
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(raw)
    } catch {
      cors(res)
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(EMPTY))
    }
    return
  }

  if (req.method === 'PUT') {
    const body = await readBody(req)
    JSON.parse(body)
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.writeFile(DATA_FILE, body, 'utf8')
    cors(res)
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  cors(res)
  res.writeHead(405)
  res.end('Method Not Allowed')
}

async function tryFile(filePath) {
  try {
    const info = await fs.stat(filePath)
    if (info.isFile()) return filePath
  } catch {
    /* not found */
  }
  return null
}

async function sendFile(res, filePath) {
  const data = await fs.readFile(filePath)
  const ext = path.extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
  res.end(data)
}

async function serveStatic(req, res, pathname) {
  const safePath = decodeURIComponent(pathname)
  const filePath = path.join(DIST, safePath)

  if (!filePath.startsWith(DIST)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  const found = await tryFile(filePath)
  if (found) {
    await sendFile(res, found)
    return
  }

  const withIndex = await tryFile(path.join(DIST, safePath, 'index.html'))
  if (withIndex) {
    await sendFile(res, withIndex)
    return
  }

  await sendFile(res, path.join(DIST, 'index.html'))
}

const server = http.createServer(async (req, res) => {
  cors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (url.pathname === '/api/sync/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.pathname === '/api/sync') {
    try {
      await handleSync(req, res)
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'bad request' }))
    }
    return
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    try {
      await serveStatic(req, res, url.pathname)
    } catch {
      res.writeHead(500)
      res.end('Server error')
    }
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, HOST, () => {
  console.log(`Luhmann card box → http://${HOST}:${PORT}`)
})

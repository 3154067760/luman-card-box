#!/usr/bin/env node
/**
 * 卢曼卡片盒 · 轻量同步服务
 * 按同步密钥存储 JSON，供多设备 merge 同步
 */
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const PORT = Number(process.env.PORT || 8788)
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

function hashKey(syncKey: string): string {
  return crypto.createHash('sha256').update(syncKey).digest('hex')
}

function dataFile(syncKey: string): string {
  return path.join(DATA_DIR, `${hashKey(syncKey)}.json`)
}

function cors(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Key')
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

async function handleSync(req: http.IncomingMessage, res: http.ServerResponse, syncKey: string) {
  const file = dataFile(syncKey)

  if (req.method === 'GET') {
    try {
      const raw = await fs.readFile(file, 'utf8')
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
    JSON.parse(body) // validate json
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(file, body, 'utf8')
    cors(res)
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  cors(res)
  res.writeHead(405)
  res.end('Method Not Allowed')
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
    const syncKey = req.headers['x-sync-key']
    if (!syncKey || typeof syncKey !== 'string' || syncKey.length < 8) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: '缺少或无效的 X-Sync-Key' }))
      return
    }
    try {
      await handleSync(req, res, syncKey)
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'bad request' }))
    }
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, HOST, () => {
  console.log(`Zettelkasten sync server http://${HOST}:${PORT}`)
})

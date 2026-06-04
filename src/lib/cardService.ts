import { db } from '../db'
import {
  allocateChild,
  allocateSibling,
  nextTopLevel,
} from './numbering'
import type { Card, CreateCardMode, ExportBundle } from '../types/card'

function uuid(): string {
  return crypto.randomUUID()
}

export async function getAllPublishedNumbers(): Promise<string[]> {
  const cards = await db.cards.where('status').equals('published').toArray()
  return cards.map((c) => c.number).filter(Boolean)
}

export async function getCardById(id: string): Promise<Card | undefined> {
  return db.cards.get(id)
}

export async function getCardByNumber(number: string): Promise<Card | undefined> {
  return db.cards.where({ number, status: 'published' }).first()
}

export async function getRecentCards(limit = 12): Promise<Card[]> {
  const all = await db.cards.where('status').equals('published').toArray()
  return all.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit)
}

export async function getInboxCards(): Promise<Card[]> {
  const all = await db.cards.where('status').equals('inbox').toArray()
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function allocateNumber(
  mode: CreateCardMode,
  refNumber?: string,
): Promise<string> {
  const existing = await getAllPublishedNumbers()
  if (mode === 'top') return nextTopLevel(existing)
  if (!refNumber) throw new Error('需要参考编号')
  if (mode === 'child') return allocateChild(refNumber, existing)
  return allocateSibling(refNumber, existing)
}

export async function createCard(input: {
  mode: CreateCardMode
  refNumber?: string
  title?: string
  body?: string
  source?: string
  note?: string
  status?: Card['status']
}): Promise<Card> {
  const now = Date.now()
  const status = input.status ?? 'published'
  const number =
    status === 'inbox' ? '' : await allocateNumber(input.mode, input.refNumber)

  const card: Card = {
    id: uuid(),
    number,
    title: input.title ?? '',
    body: input.body ?? '',
    source: input.source ?? '',
    note: input.note ?? '',
    status,
    createdAt: now,
    updatedAt: now,
  }

  await db.cards.add(card)
  return card
}

export async function updateCard(
  id: string,
  patch: Partial<Pick<Card, 'title' | 'body' | 'source' | 'note'>>,
): Promise<Card> {
  const card = await db.cards.get(id)
  if (!card) throw new Error('卡片不存在')

  const updated: Card = {
    ...card,
    ...patch,
    updatedAt: Date.now(),
  }
  await db.cards.put(updated)
  await syncLinksFromBody(updated)
  return updated
}

export async function deleteCard(id: string): Promise<void> {
  await db.transaction('rw', [db.cards, db.links, db.cardTags], async () => {
    await db.links.where('fromId').equals(id).delete()
    await db.links.where('toId').equals(id).delete()
    await db.cardTags.where('cardId').equals(id).delete()
    await db.cards.delete(id)
  })
}

export async function promoteInboxCard(id: string, mode: CreateCardMode, refNumber?: string): Promise<Card> {
  const card = await db.cards.get(id)
  if (!card || card.status !== 'inbox') throw new Error('闪念不存在')

  const number = await allocateNumber(mode, refNumber)
  const updated: Card = {
    ...card,
    number,
    status: 'published',
    updatedAt: Date.now(),
  }
  await db.cards.put(updated)
  return updated
}

/** 从正文 [[1a2]] 解析并同步显式链接 */
const WIKI_LINK = /\[\[([0-9a-z]+)\]\]/gi

export function extractWikiNumbers(body: string): string[] {
  const found = new Set<string>()
  let match: RegExpExecArray | null
  const re = new RegExp(WIKI_LINK.source, 'gi')
  while ((match = re.exec(body)) !== null) {
    found.add(match[1])
  }
  return [...found]
}

async function syncLinksFromBody(card: Card): Promise<void> {
  if (card.status !== 'published') return

  const targetNumbers = extractWikiNumbers(card.body)
  const targetCards = await Promise.all(targetNumbers.map((n) => getCardByNumber(n)))
  const validTargets = targetCards.filter((c): c is Card => !!c)
  const targetIds = new Set(validTargets.map((t) => t.id))

  await db.transaction('rw', db.links, async () => {
    const outgoing = await db.links.where('fromId').equals(card.id).toArray()
    for (const link of outgoing) {
      if (!targetIds.has(link.toId)) {
        await removeLink(link.fromId, link.toId, true)
      }
    }
    for (const target of validTargets) {
      await addLink(card.id, target.id, true)
    }
  })
}

export async function addLink(fromId: string, toId: string, bidirectional = true): Promise<void> {
  if (fromId === toId) return

  const exists = await db.links.where({ fromId, toId }).first()
  if (!exists) {
    await db.links.add({ fromId, toId })
  }

  if (bidirectional) {
    const reverse = await db.links.where({ fromId: toId, toId: fromId }).first()
    if (!reverse) {
      await db.links.add({ fromId: toId, toId: fromId })
    }
  }
}

export async function removeLink(fromId: string, toId: string, bidirectional = true): Promise<void> {
  await db.links.where({ fromId, toId }).delete()
  if (bidirectional) {
    await db.links.where({ fromId: toId, toId: fromId }).delete()
  }
}

export async function getForwardLinks(cardId: string): Promise<Card[]> {
  const links = await db.links.where('fromId').equals(cardId).toArray()
  const cards = await Promise.all(links.map((l) => db.cards.get(l.toId)))
  return cards.filter((c): c is Card => !!c)
}

export async function getBackwardLinks(cardId: string): Promise<Card[]> {
  const links = await db.links.where('toId').equals(cardId).toArray()
  const cards = await Promise.all(links.map((l) => db.cards.get(l.fromId)))
  return cards.filter((c): c is Card => !!c)
}

export async function searchCards(query: string): Promise<Card[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const all = await db.cards.where('status').equals('published').toArray()
  return all.filter(
    (c) =>
      c.number.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q) ||
      c.note.toLowerCase().includes(q),
  )
}

export async function getRandomCard(): Promise<Card | undefined> {
  const all = await db.cards.where('status').equals('published').toArray()
  if (!all.length) return undefined
  return all[Math.floor(Math.random() * all.length)]
}

export async function exportAll(): Promise<ExportBundle> {
  const [cards, links, tags, cardTags] = await Promise.all([
    db.cards.toArray(),
    db.links.toArray(),
    db.tags.toArray(),
    db.cardTags.toArray(),
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards,
    links,
    tags,
    cardTags,
  }
}

export async function importAll(bundle: ExportBundle, replace = false): Promise<void> {
  await db.transaction('rw', [db.cards, db.links, db.tags, db.cardTags], async () => {
    if (replace) {
      await db.cards.clear()
      await db.links.clear()
      await db.tags.clear()
      await db.cardTags.clear()
    }
    await db.cards.bulkPut(bundle.cards)
    await db.links.bulkPut(bundle.links)
    await db.tags.bulkPut(bundle.tags)
    await db.cardTags.bulkPut(bundle.cardTags)
  })
}

export async function getAllTags(): Promise<{ tag: import('../types/card').Tag; count: number }[]> {
  const tags = await db.tags.toArray()
  const result = await Promise.all(
    tags.map(async (tag) => {
      const count = await db.cardTags.where('tagId').equals(tag.id).count()
      return { tag, count }
    }),
  )
  return result.sort((a, b) => b.count - a.count)
}

export async function getCardsByTag(tagId: string): Promise<Card[]> {
  const relations = await db.cardTags.where('tagId').equals(tagId).toArray()
  const cards = await Promise.all(relations.map((r) => db.cards.get(r.cardId)))
  return cards.filter((c): c is Card => !!c && c.status === 'published')
}

import { db } from '../db'
import { updateCard } from './cardService'
import { buildDemoCards, buildDemoInbox } from './demoData'
import type { Card } from '../types/card'

export async function loadDemoExamples(): Promise<{ added: number; skipped: number }> {
  const all = await db.cards.toArray()
  const existingNumbers = new Set(all.filter((c) => c.number).map((c) => c.number))
  const inboxCount = all.filter((c) => c.status === 'inbox').length

  let added = 0
  let skipped = 0

  const toAdd: Card[] = []

  for (const card of buildDemoCards()) {
    if (existingNumbers.has(card.number)) {
      skipped++
    } else {
      toAdd.push(card)
      added++
    }
  }

  for (const item of buildDemoInbox()) {
    if (inboxCount > 0) {
      skipped++
      continue
    }
    toAdd.push(item)
    added++
  }

  if (toAdd.length === 0) return { added: 0, skipped }

  await db.cards.bulkAdd(toAdd)

  // 解析正文 [[编号]]，建立双向链接
  for (const card of toAdd) {
    if (card.status === 'published' && card.body.includes('[[')) {
      await updateCard(card.id, { body: card.body })
    }
  }

  return { added, skipped }
}

export async function hasDemoCards(): Promise<boolean> {
  const c = await db.cards.where('number').equals('1').first()
  return !!c
}

import { db } from '../db'
import { updateCard } from './cardService'
import { buildDemoCards, buildDemoInbox } from './demoData'
import { buildMLDemoCards, buildMLDemoInbox } from './mlDemoData'
import type { Card } from '../types/card'

async function mergeCards(
  cards: Card[],
  inboxItems: Card[],
  inboxTag: 'general' | 'ml',
): Promise<{ added: number; skipped: number }> {
  const all = await db.cards.toArray()
  const existingNumbers = new Set(all.filter((c) => c.number).map((c) => c.number))

  const inboxMarker = inboxTag === 'ml' ? 'ML 闪念' : '闪念示例'
  const hasInboxDemo = all.some(
    (c) => c.status === 'inbox' && c.body.includes(inboxMarker),
  )

  let added = 0
  let skipped = 0
  const toAdd: Card[] = []

  for (const card of cards) {
    if (existingNumbers.has(card.number)) {
      skipped++
    } else {
      toAdd.push(card)
      added++
    }
  }

  if (hasInboxDemo) {
    skipped += inboxItems.length
  } else {
    for (const item of inboxItems) {
      toAdd.push(item)
      added++
    }
  }

  if (toAdd.length === 0) return { added: 0, skipped }

  await db.cards.bulkAdd(toAdd)

  for (const card of toAdd) {
    if (card.status === 'published' && card.body.includes('[[')) {
      await updateCard(card.id, { body: card.body })
    }
  }

  return { added, skipped }
}

export async function loadDemoExamples(): Promise<{ added: number; skipped: number }> {
  return mergeCards(buildDemoCards(), buildDemoInbox(), 'general')
}

export async function loadMLDemoExamples(): Promise<{ added: number; skipped: number }> {
  return mergeCards(buildMLDemoCards(), buildMLDemoInbox(), 'ml')
}

export async function hasDemoCards(): Promise<boolean> {
  const c = await db.cards.where('number').equals('1').first()
  return !!c
}

export async function hasMLDemoCards(): Promise<boolean> {
  const c = await db.cards.where('number').equals('4').first()
  return !!c && (c.title.includes('机器学习') || c.body.includes('机器学习'))
}

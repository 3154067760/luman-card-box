import { db } from '../db'
import type { CardTag, EntityType, SyncPayload, Tombstone } from '../types/card'

export function entityKey(entityType: EntityType, entityId: string): string {
  return `${entityType}:${entityId}`
}

export function linkEntityId(fromId: string, toId: string): string {
  return `${fromId}|${toId}`
}

export async function recordTombstone(entityType: EntityType, entityId: string): Promise<void> {
  const tombstone: Tombstone = {
    id: entityKey(entityType, entityId),
    entityType,
    entityId,
    deletedAt: Date.now(),
  }
  await db.tombstones.put(tombstone)
}

function tombstoneMap(tombstones: Tombstone[]): Map<string, Tombstone> {
  const map = new Map<string, Tombstone>()
  for (const t of tombstones) {
    const key = entityKey(t.entityType, t.entityId)
    const prev = map.get(key)
    if (!prev || t.deletedAt > prev.deletedAt) map.set(key, t)
  }
  return map
}

function isDeleted(map: Map<string, Tombstone>, entityType: EntityType, entityId: string): boolean {
  return map.has(entityKey(entityType, entityId))
}

/** 合并本地与云端数据（按 updatedAt 取新，删除以 tombstone 为准） */
export function mergeSyncPayloads(a: SyncPayload, b: SyncPayload): SyncPayload {
  const tombs = tombstoneMap([...(a.tombstones ?? []), ...(b.tombstones ?? [])])
  const cardsMap = new Map<string, (typeof a.cards)[0]>()

  for (const card of [...a.cards, ...b.cards]) {
    if (isDeleted(tombs, 'card', card.id)) continue
    const prev = cardsMap.get(card.id)
    if (!prev || card.updatedAt >= prev.updatedAt) cardsMap.set(card.id, card)
  }

  // 再次剔除：删除时间晚于卡片更新时间
  for (const [id, card] of cardsMap) {
    const t = tombs.get(entityKey('card', id))
    if (t && t.deletedAt >= card.updatedAt) cardsMap.delete(id)
  }

  const cardIds = new Set(cardsMap.keys())

  const linksMap = new Map<string, (typeof a.links)[0]>()
  for (const link of [...a.links, ...b.links]) {
    const eid = linkEntityId(link.fromId, link.toId)
    if (isDeleted(tombs, 'link', eid)) continue
    if (!cardIds.has(link.fromId) || !cardIds.has(link.toId)) continue
    linksMap.set(eid, { ...link, id: undefined })
  }

  const tagsMap = new Map<string, (typeof a.tags)[0]>()
  for (const tag of [...a.tags, ...b.tags]) {
    if (isDeleted(tombs, 'tag', tag.id)) continue
    tagsMap.set(tag.id, tag)
  }

  const cardTagsMap = new Map<string, CardTag>()
  for (const ct of [...a.cardTags, ...b.cardTags]) {
    const eid = linkEntityId(ct.cardId, ct.tagId)
    if (isDeleted(tombs, 'cardTag', eid)) continue
    if (!cardIds.has(ct.cardId) || !tagsMap.has(ct.tagId)) continue
    cardTagsMap.set(eid, { ...ct, id: undefined })
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards: [...cardsMap.values()],
    links: [...linksMap.values()],
    tags: [...tagsMap.values()],
    cardTags: [...cardTagsMap.values()],
    tombstones: [...tombs.values()],
    deviceId: a.deviceId ?? b.deviceId,
  }
}

export async function applySyncPayload(payload: SyncPayload): Promise<void> {
  await db.transaction('rw', [db.cards, db.links, db.tags, db.cardTags, db.tombstones], async () => {
    await db.cards.clear()
    await db.links.clear()
    await db.tags.clear()
    await db.cardTags.clear()
    await db.tombstones.clear()
    await db.cards.bulkPut(payload.cards)
    await db.links.bulkPut(payload.links)
    await db.tags.bulkPut(payload.tags)
    await db.cardTags.bulkPut(payload.cardTags)
    await db.tombstones.bulkPut(payload.tombstones ?? [])
  })
}

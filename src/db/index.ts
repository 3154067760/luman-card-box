import Dexie, { type EntityTable } from 'dexie'
import type { Card, CardLink, CardTag, Tag, Tombstone } from '../types/card'

class ZettelkastenDB extends Dexie {
  cards!: EntityTable<Card, 'id'>
  links!: EntityTable<CardLink, 'id'>
  tags!: EntityTable<Tag, 'id'>
  cardTags!: EntityTable<CardTag, 'id'>
  tombstones!: EntityTable<Tombstone, 'id'>

  constructor() {
    super('LuhmannZettelkasten')
    this.version(1).stores({
      cards: 'id, number, status, updatedAt',
      links: '++id, fromId, toId, [fromId+toId]',
      tags: 'id, name',
      cardTags: '++id, cardId, tagId',
    })
    this.version(2).stores({
      cards: 'id, number, status, updatedAt',
      links: '++id, fromId, toId, [fromId+toId]',
      tags: 'id, name',
      cardTags: '++id, cardId, tagId',
      tombstones: 'id, entityType, entityId, deletedAt',
    })
  }
}

export const db = new ZettelkastenDB()

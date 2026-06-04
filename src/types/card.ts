export type CardStatus = 'inbox' | 'published'

export interface Card {
  id: string
  /** 卢曼编号，如 1 / 1a / 1a1；闪念区为空 */
  number: string
  title: string
  body: string
  source: string
  note: string
  status: CardStatus
  createdAt: number
  updatedAt: number
}

export interface CardLink {
  id?: number
  fromId: string
  toId: string
}

export interface Tag {
  id: string
  name: string
}

export interface CardTag {
  id?: number
  cardId: string
  tagId: string
}

export interface ExportBundle {
  version: 1
  exportedAt: string
  cards: Card[]
  links: CardLink[]
  tags: Tag[]
  cardTags: CardTag[]
}

export type CreateCardMode = 'top' | 'sibling' | 'child'

export type EntityType = 'card' | 'link' | 'tag' | 'cardTag'

/** 删除记录，用于跨设备同步删除操作 */
export interface Tombstone {
  id: string
  entityType: EntityType
  entityId: string
  deletedAt: number
}

export interface SyncPayload extends ExportBundle {
  tombstones: Tombstone[]
  deviceId?: string
}

export interface SyncSettings {
  autoSync: boolean
  lastSyncAt: number
  lastSyncStatus: 'ok' | 'error' | ''
  lastSyncMessage: string
}

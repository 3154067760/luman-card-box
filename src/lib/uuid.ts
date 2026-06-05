/** 兼容 HTTP 非安全上下文（手机访问 IP 时 randomUUID 不可用） */
export function newId(): string {
  if (globalThis.crypto?.randomUUID) {
    try {
      return globalThis.crypto.randomUUID()
    } catch {
      /* 非 secure context 会抛错 */
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}

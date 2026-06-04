/** 卢曼 Folgezettel 编号：数字与字母交替延伸，如 1 → 1a → 1a1 → 1a1a */

export type Segment = number | string

export function parseNumber(num: string): Segment[] {
  const segments: Segment[] = []
  let i = 0
  while (i < num.length) {
    if (/\d/.test(num[i])) {
      let digits = ''
      while (i < num.length && /\d/.test(num[i])) {
        digits += num[i++]
      }
      segments.push(parseInt(digits, 10))
    } else if (/[a-z]/.test(num[i])) {
      segments.push(num[i++])
    } else {
      throw new Error(`无效编号: ${num}`)
    }
  }
  return segments
}

export function formatNumber(segments: Segment[]): string {
  return segments.map((s) => String(s)).join('')
}

export function compareNumbers(a: string, b: string): number {
  const segsA = parseNumber(a)
  const segsB = parseNumber(b)
  const len = Math.max(segsA.length, segsB.length)
  for (let i = 0; i < len; i++) {
    if (i >= segsA.length) return -1
    if (i >= segsB.length) return 1
    const sa = segsA[i]
    const sb = segsB[i]
    if (typeof sa === 'number' && typeof sb === 'number') {
      if (sa !== sb) return sa - sb
    } else if (typeof sa === 'string' && typeof sb === 'string') {
      if (sa !== sb) return sa.localeCompare(sb)
    }
  }
  return 0
}

export function sortByNumber(numbers: string[]): string[] {
  return [...numbers].sort(compareNumbers)
}

export function getParent(number: string): string | null {
  const segs = parseNumber(number)
  if (segs.length <= 1) return null
  segs.pop()
  return formatNumber(segs)
}

/** 某编号下的直接子卡（仅一层） */
export function getDirectChildren(
  parentNum: string | null,
  allNumbers: string[],
): string[] {
  const parentSegs = parentNum ? parseNumber(parentNum) : []
  return allNumbers.filter((n) => {
    const segs = parseNumber(n)
    if (segs.length !== parentSegs.length + 1) return false
    if (parentSegs.length === 0) {
      return segs.length === 1 && typeof segs[0] === 'number'
    }
    return formatNumber(segs.slice(0, -1)) === parentNum
  })
}

/** 在父节点下生成第一个子编号 */
export function firstChild(parentNum: string): string {
  const segs = parseNumber(parentNum)
  const last = segs[segs.length - 1]
  if (typeof last === 'number') {
    segs.push('a')
  } else {
    segs.push(1)
  }
  return formatNumber(segs)
}

/** 同级下一个编号 */
export function nextSiblingNumber(num: string): string {
  const segs = parseNumber(num)
  const last = segs[segs.length - 1]
  if (typeof last === 'number') {
    segs[segs.length - 1] = last + 1
  } else {
    segs[segs.length - 1] = String.fromCharCode(last.charCodeAt(0) + 1)
  }
  return formatNumber(segs)
}

export function nextTopLevel(allNumbers: string[]): string {
  const tops = allNumbers.filter((n) => /^\d+$/.test(n)).map((n) => parseInt(n, 10))
  const max = tops.length ? Math.max(...tops) : 0
  return String(max + 1)
}

/** 在已有编号集合中，为某父节点分配下一个子编号 */
export function allocateChild(parentNum: string, allNumbers: string[]): string {
  const children = getDirectChildren(parentNum, allNumbers)
  if (children.length === 0) return firstChild(parentNum)
  const sorted = sortByNumber(children)
  return nextSiblingNumber(sorted[sorted.length - 1])
}

/** 与某卡同级续写（Fortsetzung） */
export function allocateSibling(refNumber: string, allNumbers: string[]): string {
  const parent = getParent(refNumber)
  const siblings = getDirectChildren(parent, allNumbers)
  if (siblings.length === 0) {
    return parent ? firstChild(parent) : nextTopLevel(allNumbers)
  }
  const sorted = sortByNumber(siblings)
  return nextSiblingNumber(sorted[sorted.length - 1])
}

export interface TreeNode {
  number: string
  children: TreeNode[]
}

export function buildNumberTree(numbers: string[]): TreeNode[] {
  const sorted = sortByNumber(numbers)
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const num of sorted) {
    nodeMap.set(num, { number: num, children: [] })
  }

  for (const num of sorted) {
    const node = nodeMap.get(num)!
    const parent = getParent(num)
    if (parent && nodeMap.has(parent)) {
      nodeMap.get(parent)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

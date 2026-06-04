import type { Card } from '../types/card'

/** 示例卡片：演示编号、链接、闪念的典型用法 */
export function buildDemoCards(): Card[] {
  const now = Date.now()
  let t = now

  const card = (
    number: string,
    title: string,
    body: string,
    extra?: Partial<Pick<Card, 'source' | 'note' | 'status'>>,
  ): Card => ({
    id: crypto.randomUUID(),
    number,
    title,
    body,
    source: extra?.source ?? '',
    note: extra?.note ?? '',
    status: extra?.status ?? 'published',
    createdAt: t++,
    updatedAt: t++,
  })

  return [
    // ── 主线 1：方法论 ──
    card(
      '1',
      '卡片盒不是分类档案',
      `卢曼的 Zettelkasten 不是按主题文件夹整理，而是用编号延伸思路、用链接织成网络。

每张卡片只写一件事——一个命题、一个观察、一个疑问。`,
      { source: 'Niklas Luhmann, Communicating with Slip Boxes' },
    ),
    card(
      '1a',
      'Folgezettel 编号',
      `编号表达「接着写」，不是「归类到某文件夹」：

• 1 下面续写 → 1a、1b（同级）
• 对 1a 某点展开 → 1a1、1a2（下级）
• 全新主题 → 2、3（新开主线）

回到总述：[[1]]`,
    ),
    card(
      '1b',
      '同级续写 vs 下级分支',
      `同级续写（1a → 1b）：同一思路线上的下一个想法，地位平等。

下级分支（1a → 1a1）：对上一张卡某一细节的展开，像脚注变成新卡。

在卡片详情页点「同级续写」或「下级分支」，系统会自动分配编号。参见 [[1a]]。`,
    ),
    card(
      '1a1',
      '双向链接',
      `在正文写 [[1a]]，保存后：

• 本卡 outgoing 出现 1a
• 1a 的 incoming 出现本卡

纸质卡片盒里，卢曼会在卡片边缘写「见 ××」；数字版用 [[编号]] 即可，反向链接自动生成。`,
    ),
    card(
      '1a2',
      '链接可以跨主线',
      `编号树是延伸关系，链接是语义关系——两者独立。

例如读书记录 [[3]] 可以链回方法论 [[1]]，不必强行放在同一编号枝下。`,
    ),

    // ── 主线 2：工具用法 ──
    card(
      '2',
      '闪念区：先捕获，后整理',
      `尚未成熟的想法先放进「闪念」，不必立刻编号。

对应卢曼写作流程里的临时便签：走路、读书、聊天时冒出的句子，先记下来，有空再转为正式卡片。

去顶部导航「闪念」可以看到待整理条目。`,
    ),
    card(
      '2a',
      '转正时的三种编号选择',
      `闪念转正时可选择：

1. 转为主线 — 分配 2、3 这样的顶层编号
2. 同级续写 — 接在某张卡后面，如 3 → 3a
3. 下级分支 — 展开某张卡，如 3 → 3a1

详见 [[2]]。`,
    ),

    // ── 主线 3：具体知识示例（读书笔记）──
    card(
      '3',
      '阅读 = 心智被启发',
      `《如何阅读一本书》：阅读不是被动接收字句，而是让原本理解力之上的部分被启发。

这条笔记本身只做一件事：定义「阅读」。`,
      { source: 'Adler & Van Doren, How to Read a Book, ch.1' },
    ),
    card(
      '3a',
      '检视阅读：值不值得精读',
      `检视阅读用有限时间判断：这本书值得分析阅读吗？

不是「读完了」，而是「我知道它讲什么、结构如何」。与 [[3]] 的「被启发」相比，检视更偏工具性。`,
      { source: 'How to Read a Book, Part Two' },
    ),
    card(
      '3a1',
      '系统化略读五步',
      `1. 看序论、目录
2. 查索引、出版介绍
3. 翻几章关键页
4. 从头到尾快速翻一遍
5. 判断：精读 / 粗读 / 不读

这五步来自 [[3a]] 的检视阅读。`,
    ),
    card(
      '3b',
      '分析阅读：完整吃透',
      `分析阅读要回答：这本书在说什么、怎么说、说得对不对、跟你有什么关系。

与 [[3a]] 的检视不同，分析阅读耗时长，只留给值得的书。`,
    ),
    card(
      '3a1a',
      '检视是分析的前置',
      `没有 [[3a]] 的检视，分析阅读可能花在不值得的书上。

链接的意义：把「略读五步 [[3a1]]」和「要不要分析 [[3b]]」串成决策链。`,
    ),
  ]
}

export function buildDemoInbox(): Card[] {
  const now = Date.now()
  return [
    {
      id: crypto.randomUUID(),
      number: '',
      title: '',
      body: '💡 闪念示例：也许「卡片盒」也可以用来整理旅行见闻，不必等想清楚了再编号——先丢进闪念区。',
      source: '',
      note: '',
      status: 'inbox',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      number: '',
      title: '',
      body: '💡 闪念示例：查一下卢曼一生大约写了多少张卡片（据说九万张？）',
      source: '',
      note: '',
      status: 'inbox',
      createdAt: now + 1,
      updatedAt: now + 1,
    },
  ]
}

/** 首页「快速上手」步骤 */
export const quickStartSteps = [
  {
    step: 1,
    title: '看目录树',
    desc: '编号 1 → 1a → 1a1 如何层层延伸',
    to: '/tree',
  },
  {
    step: 2,
    title: '读卡片 1',
    desc: '「一卡一事」是什么意思',
    to: '/card/1',
  },
  {
    step: 3,
    title: '打开 1a1',
    desc: '看右侧 incoming / outgoing 双向链接',
    to: '/card/1a1',
  },
  {
    step: 4,
    title: '看读书笔记链',
    desc: '3 → 3a → 3a1 → 3a1a 的引用关系',
    to: '/card/3a1a',
  },
  {
    step: 5,
    title: '逛闪念区',
    desc: '两条待整理灵感，可试着「转为主线」',
    to: '/inbox',
  },
  {
    step: 6,
    title: '搜「阅读」',
    desc: '全文检索示例',
    to: '/search?q=阅读',
  },
]
